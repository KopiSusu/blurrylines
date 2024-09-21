// /app/api/webhook/novita/route.ts
import { supabaseAdmin } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import sharp from "sharp"; // Import sharp for image processing

export const maxDuration = 300;

interface NovitaRemoveBackgroundApiResponse {
  image_file: string;
  image_type: string;
}

interface NovitaObjectRemovalApiResponse {
  task_id: string;
}

// Function to fetch the preview record from the database
async function fetchPreview(supabase: any, taskId: string) {
  const { data: preview, error } = await supabase
    .from("previews")
    .select("*")
    .or(`task_id.eq.${taskId},removal_task_id.eq.${taskId}`)
    .single();

  if (error) {
    throw new Error(`Failed to fetch preview: ${error.message}`);
  }

  return preview;
}

// Function to remove background using Novita.ai API
async function removeBackground(imageBase64: string): Promise<Buffer> {
  const novitaResponse = await fetch("https://api.novita.ai/v3/remove-background", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NOVITA_API_KEY}`,
    },
    body: JSON.stringify({
      image_file: imageBase64,
    }),
  });

  if (!novitaResponse.ok) {
    throw new Error(`Failed to remove background: ${novitaResponse.statusText}`);
  }

  const novitaResult = (await novitaResponse.json()) as NovitaRemoveBackgroundApiResponse;
  const backgroundRemovedImageBase64 = novitaResult.image_file;

  // Convert the base64 image to buffer
  const backgroundRemovedImageBuffer = Buffer.from(backgroundRemovedImageBase64, "base64");

  return backgroundRemovedImageBuffer;
}

// Function to fetch the original image from Supabase storage
async function fetchOriginalImage(supabase: any, originalImagePath: string): Promise<Buffer> {
  const { data: originalImageBlob, error: originalImageError } = await supabase.storage
    .from("images") // Replace with your Supabase storage bucket name
    .download(originalImagePath);

  if (originalImageError) {
    throw new Error(`Failed to download original image: ${originalImageError.message}`);
  }

  // Convert the Blob to a Buffer
  const arrayBuffer = await originalImageBlob.arrayBuffer();
  const originalImageBuffer = Buffer.from(arrayBuffer);

  return originalImageBuffer;
}

// Function to composite images using sharp
async function compositeImages(
  baseImageBuffer: Buffer,
  overlayImageBuffer: Buffer
): Promise<Buffer> {
  const finalImageBuffer = await sharp(baseImageBuffer)
    .composite([{ input: overlayImageBuffer }])
    .toBuffer();

  return finalImageBuffer;
}

// Function to upload an image to Supabase storage
async function uploadImageToStorage(
  supabase: any,
  imageBuffer: Buffer,
  profileId: string,
  fileName: string
) {
  const filePath = `${profileId}/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, imageBuffer, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // Get the public URL of the uploaded image
  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(filePath);

  return { filePath, publicUrl };
}

// Function to update the previews table
async function updatePreview(supabase: any, taskId: string, updateData: any) {
  const { error: updateError } = await supabase
    .from("previews")
    .update(updateData)
    .or(`task_id.eq.${taskId},removal_task_id.eq.${taskId}`);

  if (updateError) {
    throw new Error(`Error updating task status: ${updateError.message}`);
  }
}

// Function to initiate object removal task
async function initiateObjectRemovalTask(originalImageBuffer: Buffer): Promise<string> {
  const imageBase64 = originalImageBuffer.toString("base64");

  const response = await fetch("https://api.novita.ai/v3/async/replace-object", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NOVITA_API_KEY}`,
    },
    body: JSON.stringify({
      image_file: imageBase64,
      prompt: "smoke", // Specify what to replace the object with
      negative_prompt: "human, people, woman, girl, boy",
      object_prompt: "human, man, woman, boy, girl",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate object removal task: ${response.statusText}`);
  }

  const result = (await response.json()) as NovitaObjectRemovalApiResponse;

  return result.task_id;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseAdmin();
    const { event_type, payload } = await req.json();

    if (event_type === "ASYNC_TASK_RESULT") {
      const taskId = payload.task.task_id;

      // Fetch the preview record from the database
      const preview = await fetchPreview(supabase, taskId);

      if (payload.task.status === "TASK_STATUS_SUCCEED") {
        const imageUrl = payload.images[0].image_url; // Extract the generated image URL

        if (taskId === preview.task_id) {
          // Initial image generation task completed

          // Fetch the generated image
          const generatedImageResponse = await fetch(imageUrl);
          if (!generatedImageResponse.ok) {
            throw new Error(`Failed to fetch generated image from ${imageUrl}`);
          }
          const generatedImageBuffer = await generatedImageResponse.buffer();

          // Convert the generated image buffer to base64
          const generatedImageBase64 = generatedImageBuffer.toString("base64");

          // Remove background using Novita.ai API
          const backgroundRemovedImageBuffer = await removeBackground(generatedImageBase64);

          // Upload the background-removed image to storage
          const { filePath: generatedFilePath, publicUrl: generatedPublicUrl } =
            await uploadImageToStorage(
              supabase,
              backgroundRemovedImageBuffer,
              preview.profile_id,
              `${taskId}`
            );

          // Initiate object removal task on the original image
          // Fetch the original image from Supabase storage
          const originalImageBuffer = await fetchOriginalImage(
            supabase,
            preview.original_image_path
          );

          const removalTaskId = await initiateObjectRemovalTask(originalImageBuffer);

          // Update the previews table with the background-removed image info and removal task ID
          await updatePreview(supabase, taskId, {
            generated_image_path: generatedFilePath,
            generated_url: generatedPublicUrl,
            removal_task_id: removalTaskId,
            status: "REMOVING",
          });
        } else if (taskId === preview.removal_task_id) {
          // Object removal task completed

          // Fetch the object-removed original image
          const objectRemovedImageResponse = await fetch(imageUrl);
          if (!objectRemovedImageResponse.ok) {
            throw new Error(`Failed to fetch object-removed image from ${imageUrl}`);
          }
          const objectRemovedImageBuffer = await objectRemovedImageResponse.buffer();

          // Fetch the background-removed generated image from storage
          const { data: backgroundRemovedImageBlob, error } = await supabase.storage
            .from("images")
            .download(preview.generated_image_path);

          if (error) {
            throw new Error(
              `Failed to download background-removed image: ${error.message}`
            );
          }

          const backgroundRemovedImageBuffer = Buffer.from(
            await backgroundRemovedImageBlob.arrayBuffer()
          );

          // Composite images using sharp
          const finalImageBuffer = await compositeImages(
            objectRemovedImageBuffer,
            backgroundRemovedImageBuffer
          );

          // Upload the final image to Supabase storage
          const { filePath: finalImagePath, publicUrl: finalPublicUrl } =
            await uploadImageToStorage(
              supabase,
              finalImageBuffer,
              preview.profile_id,
              `${taskId}_final`
            );

          // Update the previews table with the final image info and status
          await updatePreview(supabase, taskId, {
            preview_image_path: finalImagePath,
            preview_url: finalPublicUrl,
            status: "SUCCEED",
          });
        } else {
          // Unknown task ID
          console.error("Unknown task ID:", taskId);
        }
      } else if (payload.task.status === "TASK_STATUS_FAILED") {
        if (taskId === preview.task_id) {
          // Initial task failed
          await updatePreview(supabase, taskId, {
            status: "FAILED",
          });
        } else if (taskId === preview.removal_task_id) {
          // Object removal task failed
          await updatePreview(supabase, taskId, {
            status: "FAILED_REMOVAL",
          });
        } else {
          // Unknown task ID
          console.error("Unknown task ID:", taskId);
        }

        console.error("Image processing failed:", payload.task.reason);
      }

      return NextResponse.json({ message: "Webhook received successfully" });
    }

    return NextResponse.json({ message: "Unhandled event" });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json({ error: "Failed to handle webhook" }, { status: 500 });
  }
}
