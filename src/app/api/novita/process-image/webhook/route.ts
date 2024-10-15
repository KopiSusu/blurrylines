// /app/api/webhook/novita/route.ts
import { supabaseAdmin } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import sharp from "sharp"; // Import sharp for image processing


export const maxDuration = 300;
export const runtime = 'nodejs';

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
    .select(`
      *,
      profile:profiles(
        *,
        face:faces(*)
      )
    `)
    .or(`task_id.eq.${taskId},removal_task_id.eq.${taskId}`)
    .single();

  if (error) {
    return null;
  }

  // Ensure only one face is returned
  if (preview && preview.profile && preview.profile.face) {
    preview.profile.face = preview.profile.face[0] || null; // Get the first face or null
  }

  return preview;
}


// Define the expected response structure from Novita.ai
interface NovitaRemoveBackgroundApiResponse {
  image_file: string; // Base64 encoded image string
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
  const uniqueSuffix = Date.now();
  const filePath = `${profileId}/${fileName}_${uniqueSuffix}`;
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

// Function to perform face swapping using Novita.ai's Face Fusion API
async function faceSwap(
  faceImageBuffer: Buffer,
  targetImageBuffer: Buffer
): Promise<Buffer> {
  const faceImageBase64 = faceImageBuffer.toString("base64");
  const targetImageBase64 = targetImageBuffer.toString("base64");

  const response = await fetch("https://api.novita.ai/v3/merge-face", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NOVITA_API_KEY}`,
    },
    body: JSON.stringify({
      extra: {
        response_image_type: "jpeg"
      },
      face_image_file: faceImageBase64,
      image_file: targetImageBase64,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to perform face swapping: ${response.statusText}`);
  }

  const result = (await response.json()) as NovitaRemoveBackgroundApiResponse;
  const faceSwappedImageBase64 = result.image_file;

  // Convert the base64 image to buffer
  const faceSwappedImageBuffer = Buffer.from(faceSwappedImageBase64, "base64");

  return faceSwappedImageBuffer;
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
async function initiateObjectRemovalTask(
  originalImageBuffer: Buffer, 
  prompt: String = "tiny, small transparent dot", 
  negative_prompt: string = "human, person, man, woman, boy, girl, child, adult, people, humans, body parts, hands, arms, legs, faces, heads, human silhouettes, human shadows, human reflections, clothing, accessories, handheld objects, objects held by humans, tools, devices, weapons, items, human activities, interactions",
  object_prompt: string = "human, person, man, woman, boy, girl, child, adult, people, humans, human holding objects, human with items, human interacting with objects, hands holding items, objects held by humans, tools, devices, weapons, accessories, clothing, items in hands, items near humans, human body parts, limbs"
) : Promise<string> {
  const webhookUrl = process.env.PROCESS_IMAGE_WEBHOOK_URL!;
  const imageBase64 = originalImageBuffer.toString("base64");

  const response = await fetch("https://api.novita.ai/v3/async/replace-object", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NOVITA_API_KEY}`,
    },
    body: JSON.stringify({
      extra: {
        response_image_type: 'jpeg',
        webhook: {
          url: webhookUrl, // Set your webhook endpoint here
        },
      },
      image_file: imageBase64,
      prompt: prompt, // Specify what to replace the object with
      negative_prompt: negative_prompt,
      object_prompt: object_prompt,
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
      const preview = await fetchPreview(supabase, taskId);
      const profile = preview?.profile;
      console.log("profile");
      console.log('god i hope this just works');
      console.log(profile)

      if (!preview) {
        return NextResponse.json({ message: "no preview found for task: " + taskId });
      }
      if (!profile) {
        return NextResponse.json({ message: "no profile found for task: " + taskId });
      }

      // Fetch the preview record from the database
      if (payload.task.status === "TASK_STATUS_SUCCEED") {
        const imageUrl = payload.images[0].image_url; // Extract the generated image URL

        if (taskId === preview.task_id && !preview.generated_url) {
          // Fetch the generated image
          const generatedImageResponse = await fetch(imageUrl);
          if (!generatedImageResponse.ok) {
            throw new Error(`Failed to fetch generated image from ${imageUrl}`);
          }
          const generatedImageBuffer = await generatedImageResponse.buffer();
        

          // Fetch the face image from Supabase storage
          const faceImageBuffer = await fetchOriginalImage(supabase, profile.face.face_image_path);
          // Perform face swapping
          const faceSwappedImageBuffer = await faceSwap(
            faceImageBuffer,
            generatedImageBuffer
          );

          // Remove background using Novita.ai API
          // const faceSwappedImageBase64 = faceSwappedImageBuffer.toString("base64");
          // const backgroundRemovedImageBuffer = await removeBackground(faceSwappedImageBase64, "buffer");
        
          // Upload the background-removed image to storage
          const { filePath: generatedFilePath, publicUrl: generatedPublicUrl } =
            await uploadImageToStorage(
              supabase,
              faceSwappedImageBuffer as Buffer,
              preview.profile_id,
              `${taskId}`
            );
            
          // Fetch the original image from Supabase storage
          const originalImageBuffer = await fetchOriginalImage(
            supabase,
            preview.original_image_path
          );
          // Initiate object removal task on the original image
          const removalTaskId = await initiateObjectRemovalTask(originalImageBuffer);
        
          // Update the previews table with the background-removed image info and removal task ID
          await updatePreview(supabase, taskId, {
            generated_image_path: generatedFilePath,
            generated_url: generatedPublicUrl,
            removal_task_id: removalTaskId,
            status: "REMOVING",
          });
        } else if (taskId === preview.removal_task_id && !preview.preview_url) {
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
        // Initial task failed
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
