// /app/api/process-image/route.ts
import { getProfile } from "@/app/(protected)/profile/actions";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const novitaApiKey = process.env.NOVITA_API_KEY!;
const webhookUrl = process.env.PROCESS_IMAGE_WEBHOOK_URL!; // Ensure you set this in your environment variables


export async function POST(req: NextRequest) {
  try {
    console.log('start')
    const supabase = await createClient();
    const { profile } = await getProfile();

    if (!profile) {
      throw new Error(`Please login`);
    }

    const {
      imagePath, 
      prompt = "Generate a preview image of the original image",
    } = await req.json();

    console.log({ imagePath, prompt, profile  })

    // Fetch the image from Supabase Storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from("images")
      .download(imagePath);

    if (downloadError) {
      throw new Error(`Error downloading image: ${downloadError.message}`);
    }

    // Convert the fetched image to Base64
    const arrayBuffer = await imageData.arrayBuffer();
    const imageBase64 = Buffer.from(arrayBuffer).toString("base64");

    // Send the image to Novita.ai for processing with the webhook URL
    const novitaResponse = await fetch(
      "https://api.novita.ai/v3/async/img2img",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${novitaApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extra: {
            response_image_type: "jpeg",
            webhook: {
              url: webhookUrl, // Set your webhook endpoint here
            },
          },
          request: {
            model_name: "epicrealism_naturalSinRC1VAE_106430.safetensors",
            prompt: prompt,
            height: 552,
            width: 512,
            image_num: 1,
            steps: 40,
            seed: 1,
            clip_skip: 1,
            guidance_scale: 7.5,
            sampler_name: "DPM++ 2S a Karras",
            image_base64: imageBase64,
          },
        }),
      }
    );


    const novitaResult = await novitaResponse.json();
    const taskId = novitaResult.task_id;

    // Save task details in the previews table
    const { error: insertError } = await supabase
      .from("previews")
      .insert({
        task_id: taskId,
        original_url: imagePath,
        status: "PENDING",
        profile_id: profile.id,
        prompt: prompt,
      });

    console.log('insertError');
    console.log(insertError);

    if (insertError) {
      throw new Error(`Error saving task details: ${insertError.message}`);
    }

    return NextResponse.json({ taskId });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
