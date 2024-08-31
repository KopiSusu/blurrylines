import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("task_id");

  if (!taskId) {
    return NextResponse.json({ error: "Missing task_id" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.NOVITA_API_KEY}`, // Ensure you have your Novita API key in environment variables
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const resultData = await response.json();

    const imageUrl = resultData.images[0].image_url; // Extract the transformed image URL

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

    return NextResponse.json(resultData, { status: 200 });
  } catch (error) {
    console.error("Error fetching task result:", error);
    return NextResponse.json({ error: "Failed to fetch task result" }, { status: 500 });
  }
}
