import { createPreview, generateReimaginePreview } from "@/app/(protected)/preview/actions";
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

    // Use the generateReimaginePreview function to process the image with Novita.ai
    const reimaginedImageBase64 = await generateReimaginePreview(imageBase64);

    // Convert the base64 result to a buffer
    const reimaginedImageBuffer = Buffer.from(reimaginedImageBase64, 'base64');

    // Upload the reimagined image to Supabase Storage
    const newImageName = `${profile.id}//${Date.now()}_reimagined.jpeg`; // Create a unique filename
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(newImageName, reimaginedImageBuffer, {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      throw new Error(`Error uploading reimagined image: ${uploadError.message}`);
    }

    // Generate the public URL for the reimagined image
    const { data: { publicUrl: reimaginedImageUrl } } = await supabase.storage
      .from('images')
      .getPublicUrl(newImageName);
    // Generate the public URL for the image
    const { data: { publicUrl } } = await supabase.storage
      .from("images")
      .getPublicUrl(imagePath);

    if (!reimaginedImageUrl) {
      throw new Error(`Error generating public URL for the reimagined image`);
    }

    // Save task details in the previews table
    const previewId = await createPreview({
      // task_id: `no_task_${Date.now()}`, // Adjust if necessary
      original_url: publicUrl,
      preview_url: reimaginedImageUrl, // Save the public URL of the reimagined image
      status: "COMPLETED",
      profile_id: profile.id,
      prompt: prompt,
    });

    return NextResponse.json({ previewId });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
