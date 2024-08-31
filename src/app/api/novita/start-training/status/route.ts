// /app/api/check-training-status/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const novitaApiKey = process.env.NEXT_PUBLIC_NOVITA_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { taskId } = await req.json();

    // Fetch the current status of the training task
    const response = await fetch(
      `https://api.novita.ai/v3/training/subject?task_id=${taskId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${novitaApiKey}`,
        },
      }
    );

    const data = await response.json();
    const taskStatus = data.task_status;
    const modelStatus = data.models?.[0]?.model_status || null;
    const modelName = data.models?.[0]?.model_name || null;

    // Update the training status in the database
    const { error } = await supabase
      .from("trainings")
      .update({
        status: taskStatus,
        model_name: modelName,
        model_status: modelStatus,
        updated_at: new Date(),
      })
      .eq("task_id", taskId);

    if (error) {
      throw new Error(`Failed to update training status: ${error.message}`);
    }

    return NextResponse.json({ message: "Training status updated successfully." });
  } catch (error) {
    console.error("Error checking training status:", error);
    return NextResponse.json(
      { error: "Failed to process training" },
      { status: 500 }
    );
  }
}
