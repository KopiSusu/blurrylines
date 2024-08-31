// /app/api/webhook/novita/route.ts
import { supabaseAdmin } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseAdmin();
    const { event_type, payload } = await req.json();

    if (event_type === "ASYNC_TASK_RESULT") {
      const taskId = payload.task.task_id;

      if (payload.task.status === "TASK_STATUS_SUCCEED") {
        const imageUrl = payload.images[0].image_url; // Extract the transformed image URL

        // Update the previews table with the success status and image URL
        const { error: updateError } = await supabase
          .from("previews")
          .update({
            status: "SUCCEED",
            preview_url: imageUrl,
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
