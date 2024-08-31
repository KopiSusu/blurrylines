// /app/api/start-training/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

import fetch from "node-fetch";


export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { profileId, images, trainingParams } = await req.json();

    // Upload images and initiate the training task using Novita API
    // (assume images are uploaded and training task is started, returning task_id)
    // const task_id = await startTrainingTask(images, trainingParams); // Implement startTrainingTask function
    const novitaApiKey = process.env.NEXT_PUBLIC_NOVITA_API_KEY!;
    const assetsIds = [];

    // Step 1: Upload images to get assets_ids
    for (const image of images) {
      // Get image upload URL
      const uploadResponse = await fetch(
        "https://api.novita.ai/v3/assets/training_dataset",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${novitaApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ file_extension: image.type.split("/")[1] }),
        }
      );

      const { upload_url, assets_id } = (await uploadResponse.json()) as { upload_url: string, assets_id: string };

      // Upload the image to the provided URL
      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": image.type },
        body: image,
      });

      assetsIds.push({ assets_id });
    }

    // Step 2: Start the training task with the uploaded images
    const trainingResponse = await fetch(
      "https://api.novita.ai/v3/training/subject",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${novitaApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trainingParams.name,
          base_model: trainingParams.base_model,
          width: trainingParams.width,
          height: trainingParams.height,
          image_dataset_items: assetsIds,
          expert_setting: trainingParams.expert_setting,
          components: trainingParams.components,
        }),
      }
    );

    const { task_id } = (await trainingResponse.json()) as { task_id: string };

    // Save task details in Supabase
    const { error } = await supabase
      .from("trainings")
      .insert({ task_id, profile_id: profileId, status: "PENDING" });

    if (error) throw new Error(error.message);

    return NextResponse.json({ taskId: task_id });
  } catch (error) {
    console.error("Error starting training:", error);
    return NextResponse.json(
      { error: "Failed to starting training" },
      { status: 500 }
    );
  }
}
