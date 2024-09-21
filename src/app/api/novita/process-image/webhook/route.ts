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

// Function to fetch the preview record from the database
async function fetchPreview(supabase: any, taskId: string) {
  const { data: preview, error } = await supabase
    .from("previews")
    .select("*")
    .eq("task_id", taskId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch preview: ${error.message}`);
  }

  return preview;
}

// Function to fetch and upload the generated image
async function fetchAndUploadGeneratedImage(
  supabase: any,
  imageUrl: string,
  profileId: string,
  taskId: string
) {
  // Fetch the generated image
  const generatedImageResponse = await fetch(imageUrl);
  if (!generatedImageResponse.ok) {
    throw new Error(`Failed to fetch generated image from ${imageUrl}`);
  }
  const generatedImageBuffer = await generatedImageResponse.buffer();

  // Upload the image to Supabase storage
  const generatedFilePath = `${profileId}/${taskId}`;
  const { error: uploadError } = await supabase.storage
    .from("images") // Replace with your Supabase storage bucket name
    .upload(generatedFilePath, generatedImageBuffer, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // Get the public URL of the uploaded image
  const {
    data: { publicUrl: generatedPublicUrl },
  } = supabase.storage.from("images").getPublicUrl(generatedFilePath);

  return { generatedImageBuffer, generatedFilePath, generatedPublicUrl };
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
  originalImageBuffer: Buffer,
  overlayImageBuffer: Buffer
): Promise<Buffer> {
  const finalImageBuffer = await sharp(originalImageBuffer)
    .composite([{ input: overlayImageBuffer }])
    .toBuffer();

  return finalImageBuffer;
}

// Function to upload the final image to Supabase storage
async function uploadPreviewFinalImage(
  supabase: any,
  finalImageBuffer: Buffer,
  profileId: string,
  taskId: string
) {
  const finalImagePath = `${profileId}/${taskId}_final`;

  const { error: finalUploadError } = await supabase.storage
    .from("images") // Replace with your Supabase storage bucket name
    .upload(finalImagePath, finalImageBuffer, {
      cacheControl: "3600",
      upsert: false,
    });

  if (finalUploadError) {
    throw new Error(`Failed to upload final image: ${finalUploadError.message}`);
  }

  // Get the public URL of the uploaded final image
  const {
    data: { publicUrl: finalPublicUrl },
  } = supabase.storage.from("images").getPublicUrl(finalImagePath);

  return { finalImagePath, finalPublicUrl };
}

// Function to update the previews table
async function updatePreview(supabase: any, taskId: string, updateData: any) {
  const { error: updateError } = await supabase
    .from("previews")
    .update(updateData)
    .eq("task_id", taskId);

  if (updateError) {
    throw new Error(`Error updating task status: ${updateError.message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseAdmin();
    const { event_type, payload } = await req.json();

    if (event_type === "ASYNC_TASK_RESULT") {
      const taskId = payload.task.task_id;

      if (payload.task.status === "TASK_STATUS_SUCCEED") {
        const imageUrl = payload.images[0].image_url; // Extract the generated image URL

        // Fetch the preview record from the database
        const preview = await fetchPreview(supabase, taskId);

        // Fetch and upload the generated image
        const {
          generatedImageBuffer,
          generatedFilePath,
          generatedPublicUrl,
        } = await fetchAndUploadGeneratedImage(
          supabase,
          imageUrl,
          preview.profile_id,
          taskId
        );

        // Convert the generated image buffer to base64
        const generatedImageBase64 = generatedImageBuffer.toString("base64");

        // Remove background using Novita.ai API
        const backgroundRemovedImageBuffer = await removeBackground(generatedImageBase64);

        // Fetch the original image from Supabase storage
        const originalImageBuffer = await fetchOriginalImage(
          supabase,
          preview.original_image_path
        );

        // Composite images using sharp
        const finalImageBuffer = await compositeImages(
          originalImageBuffer,
          backgroundRemovedImageBuffer
        );

        // Upload the final image to Supabase storage
        const { finalImagePath, finalPublicUrl } = await uploadPreviewFinalImage(
          supabase,
          finalImageBuffer,
          preview.profile_id,
          taskId
        );

        // Update the previews table with the success status and new image URLs
        await updatePreview(supabase, taskId, {
          status: "SUCCEED",
          generated_image_path: generatedFilePath, // Generated image path
          generated_url: generatedPublicUrl, // Generated image URL
          preview_image_path: finalImagePath, // Final composite image path
          preview_url: finalPublicUrl, // Final composite image URL
        });
      } else if (payload.task.status === "TASK_STATUS_FAILED") {
        // Update the previews table with the failed status
        await updatePreview(supabase, taskId, {
          status: "FAILED",
        });

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
