// /app/api/webhook/novita/route.ts
import { getPromptFromImage } from "@/app/(protected)/preview/actions";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

export const maxDuration = 300;

interface NovitaRemoveBackgroundApiResponse {
  image_file: string;
  image_type: string;
}

interface NovitaObjectRemovalApiResponse {
  task_id: string;
}

// Function to fetch the preview record from the database
async function fetchFace(supabase: any, taskId: string) {
  const { data: face, error } = await supabase
    .from("faces")
    .select("*, profile:profiles(*)")
    .eq(`task_id`, `${taskId}`)
    .single();

  if (error) {
    return null;
  }

  return face;
}

// Define the expected response structure from Novita.ai
interface NovitaRemoveBackgroundApiResponse {
  image_file: string; // Base64 encoded image string
}

type ReturnTypeOption = 'buffer' | 'base64';

/**
 * Removes the background from an image using Novita.ai API.
 *
 * @param imageBase64 - The Base64 encoded string of the original image.
 * @param returnType - The desired return type: 'buffer' or 'base64'. Defaults to 'buffer'.
 * @returns A Promise that resolves to a Buffer or Base64 string of the processed image.
 * @throws Will throw an error if the API request fails or the response is invalid.
 */
async function removeBackground(
  imageBase64: string,
  returnType: ReturnTypeOption = 'buffer'
): Promise<Buffer | string> {
  // Validate the returnType parameter
  if (!['buffer', 'base64'].includes(returnType)) {
    throw new Error(`Invalid returnType: ${returnType}. Expected 'buffer' or 'base64'.`);
  }

  // Ensure the API key is available
  const apiKey = process.env.NOVITA_API_KEY;
  if (!apiKey) {
    throw new Error('NOVITA_API_KEY is not defined in the environment variables.');
  }

  // Make the API request to remove the background
  const novitaResponse = await fetch('https://api.novita.ai/v3/remove-background', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      image_file: imageBase64,
    }),
  });

  if (!novitaResponse.ok) {
    const errorText = await novitaResponse.text();
    throw new Error(`Failed to remove background: ${novitaResponse.status} ${novitaResponse.statusText}. ${errorText}`);
  }

  const novitaResult = (await novitaResponse.json()) as NovitaRemoveBackgroundApiResponse;

  // Validate the response
  if (!novitaResult || !novitaResult.image_file) {
    throw new Error('Invalid response from Novita.ai: Missing image_file.');
  }

  const backgroundRemovedImageBase64 = novitaResult.image_file;

  if (returnType === 'buffer') {
    // Convert the Base64 image to Buffer
    const backgroundRemovedImageBuffer = Buffer.from(backgroundRemovedImageBase64, 'base64');
    return backgroundRemovedImageBuffer;
  } else {
    // Return the Base64 string as-is
    return backgroundRemovedImageBase64;
  }
}

// Function to upload an image to Supabase storage
async function uploadImageToStorage(
  supabase: any,
  imageBuffer: Buffer,
  profileId: string,
  fileName: string
) {
  const uniqueSuffix = Date.now();
  const filePath = `${profileId}/faces/${fileName}_${uniqueSuffix}`;
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



// Function to update the faces table
async function updateFace(supabase: any, taskId: string, updateData: any) {
  const { error: updateError } = await supabase
    .from("faces")
    .update(updateData)
    .eq(`task_id`, `${taskId}`);

  if (updateError) {
    throw new Error(`Error updating task status: ${updateError.message}`);
  }
}


export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseAdmin();
    const { event_type, payload } = await req.json();

    console.log("ok its startings");
    console.log(event_type);
    console.log(payload)

    if (event_type === "ASYNC_TASK_RESULT") {
      const taskId = payload.task.task_id;
      console.log("ok its startings 1");
      const face = await fetchFace(supabase, taskId);
      console.log("face");
      console.log(face)
      const profile = face?.profile;
      console.log("profile");
      console.log(profile)

      if (!face) {
        return NextResponse.json({ message: "no face found for task: " + taskId });
      }
      if (!profile) {
        return NextResponse.json({ message: "no profile found for task: " + taskId });
      }

      // Fetch the preview record from the database
      if (payload.task.status === "TASK_STATUS_SUCCEED") {
        const imageUrl = payload.images[0].image_url; // Extract the generated image URL

        if (taskId === face.task_id && !face.generated_url) {
          console.log("taskId starting generating face");
          console.log(taskId)
          // Fetch the generated image
          const generatedImageResponse = await fetch(imageUrl);
          if (!generatedImageResponse.ok) {
            throw new Error(`Failed to fetch generated image from ${imageUrl}`);
          }
          const generatedImageBuffer = await generatedImageResponse.buffer();

          // Remove background using Novita.ai API
          const generatedImageBase64 = generatedImageBuffer.toString("base64");
          const backgroundRemovedImageBuffer = await removeBackground(generatedImageBase64, "buffer");

          console.log("backgroundRemovedImageBuffer");
          console.log(backgroundRemovedImageBuffer)
        
          // Upload the background-removed image to storage
          const { filePath: generatedFilePath, publicUrl: generatedPublicUrl } =
            await uploadImageToStorage(
              supabase,
              backgroundRemovedImageBuffer as Buffer,
              face.profile_id,
              `${taskId}`
            );

            console.log("backgroundRemovedImageBuffer");
            console.log(backgroundRemovedImageBuffer)

          const imagePrompt = await getPromptFromImage(backgroundRemovedImageBuffer.toString("base64"));
          const prompt = `${imagePrompt}`

          console.log("prompt");
          console.log(prompt)
        
            
        
          // Update the faces table with the background-removed image info and removal task ID
          await updateFace(supabase, taskId, {
            face_image_path: generatedFilePath,
            face_url: generatedPublicUrl,
            prompt: prompt,
            status: "SUCCEED",
          });
        } else {
          // Unknown task ID
          console.error("Unknown task ID:", taskId);
        }
      } else if (payload.task.status === "TASK_STATUS_FAILED") {
        // Initial task failed
        await updateFace(supabase, taskId, {
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
