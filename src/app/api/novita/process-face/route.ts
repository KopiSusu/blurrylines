// /app/api/process-image/route.ts
import { createFace, createOrUpdateFace, generateImg2ImgFace } from "@/app/(protected)/face/actions";
import { generateImg2ImgPreview, getPromptFromImage } from "@/app/(protected)/preview/actions";
import { getProfile } from "@/app/(protected)/profile/actions";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;


export async function POST(req: NextRequest) {
  try {
    const { profile } = await getProfile();

    if (!profile) {
      throw new Error(`Please login`);
    }

    const { imagePath, type } = await req.json();

    // Fetch the image from Supabase Storage
    const supabase = await createClient();
    const { data: imageData, error: downloadError } = await supabase.storage
      .from("images")
      .download(imagePath);

    if (downloadError) {
      throw new Error(`Error downloading image: ${downloadError.message}`);
    }

    // Convert the fetched image to Base64
    const arrayBuffer = await imageData.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString("base64");

    // get the promtp 
    const imagePrompt = await getPromptFromImage(imageBase64);
    const prompt = `${imagePrompt}`

    // Use the generateImg2ImgPreview function to process the image with Novita.ai
    const taskId = await generateImg2ImgFace(type, imageBase64, prompt, 800, 800);

    // Generate the public URL for the image
    const { data: { publicUrl } } = await supabase.storage
    .from("images")
    .getPublicUrl(imagePath);

    if (!publicUrl) {
      throw new Error(`Error generating public URL from original image`);
    }

    // Save task details in the previews table
    const faceId = await createOrUpdateFace({
      task_id: taskId,
      original_url: publicUrl,
      original_image_path: imagePath,
      status: "PENDING",
      profile_id: profile.id,
      prompt: prompt,
      width: 800,
      height: 800,
    });

    return NextResponse.json({ taskId, faceId });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
