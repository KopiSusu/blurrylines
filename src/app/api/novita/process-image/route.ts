// /app/api/process-image/route.ts
import { createPreview, generateImg2ImgPreview } from "@/app/(protected)/preview/actions";
import { getProfile } from "@/app/(protected)/profile/actions";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { profile } = await getProfile();

    if (!profile) {
      throw new Error(`Please login`);
    }

    const { imagePath, prompt = "Generate a preview image of the original image" } = await req.json();

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

    // Use the generateImg2ImgPreview function to process the image with Novita.ai
    const taskId = await generateImg2ImgPreview(imageBase64);

    // Generate the public URL for the image
    const { data: { publicUrl } } = await supabase.storage
    .from("images")
    .getPublicUrl(imagePath);

    if (!publicUrl) {
      throw new Error(`Error generating public URL from original image`);
    }

    // Save task details in the previews table
    const previewId = await createPreview({
      task_id: taskId,
      original_url: publicUrl,
      status: "PENDING",
      profile_id: profile.id,
      prompt: prompt,
    });

    return NextResponse.json({ taskId, previewId });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
