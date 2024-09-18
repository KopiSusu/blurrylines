// /app/api/webhook/novita/route.ts
import { supabaseAdmin } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseAdmin();
    const { event_type, payload } = await req.json();

    if (event_type === "ASYNC_TASK_RESULT") {
      const taskId = payload.task.task_id;

      if (payload.task.status === "TASK_STATUS_SUCCEED") {
        const imageUrl = payload.images[0].image_url; // Extract the transformed image URL

        // fetch the original preview for the user
        const { data: preview, error: previewError } = await supabase
          .from("previews")
          .select("*")
          .eq("task_id", taskId)
          .single();

        if (previewError) {
          throw new Error(`Failed to upload image: ${previewError.message}`);
        }

        // Fetch the image from the external URL
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from ${imageUrl}`);
        }
        const imageBuffer = await imageResponse.buffer();

        // Define the path where the image will be stored in Supabase
        const filePath = `${preview?.profile_id}/${taskId}`;

        // Upload the image to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images") // Replace with your Supabase storage bucket name
          .upload(filePath, imageBuffer, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        // Get the public URL of the uploaded image
        const { data: { publicUrl }} = supabase.storage
          .from("images") // Replace with your Supabase storage bucket name
          .getPublicUrl(filePath);

        // Update the previews table with the success status and new image URL
        const { error: updateError } = await supabase
          .from("previews")
          .update({
            status: "SUCCEED",
            preview_image_path: filePath,
            preview_url: publicUrl,
          })
          .eq("task_id", taskId);

        if (updateError) {
          throw new Error(`Error updating task status: ${updateError.message}`);
        }
      } else if (payload.task.status === "TASK_STATUS_FAILED") {
        // Update the previews table with the failed status
        const { error: updateError } = await supabase
          .from("previews")
          .update({
            status: "FAILED",
          })
          .eq("task_id", taskId);

        if (updateError) {
          throw new Error(`Error updating task status: ${updateError.message}`);
        }

        console.error("Image processing failed:", payload.task.reason);
      }

      return NextResponse.json({ message: "Webhook received successfully" });
    }

    return NextResponse.json({ message: "Unhandled event" });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Failed to handle webhook" },
      { status: 500 }
    );
  }
}
