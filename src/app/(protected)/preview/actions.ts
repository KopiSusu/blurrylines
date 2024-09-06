import { createClient } from '@/utils/supabase/server';
import fetch from 'node-fetch';

interface PreviewData {
  task_id: string;
  original_url: string;
  preview_url?: string;
  status: string;
  profile_id: string;
  prompt: string;
}

interface NovitaImg2ImgApiResponse {
  task_id: string;
}

export const generateImg2ImgPreview = async (imageBase64: string, prompt: string): Promise<string> => {
  const novitaApiKey = process.env.NOVITA_API_KEY!;
  const webhookUrl = process.env.PROCESS_IMAGE_WEBHOOK_URL!;

  try {
    const novitaResponse = await fetch("https://api.novita.ai/v3/async/img2img", {
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
          model_name: "betterThanWords_v30_179887.safetensors",
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
    });

    if (!novitaResponse.ok) {
      throw new Error("Failed to process image with Novita.ai.");
    }

    const novitaResult = (await novitaResponse.json()) as NovitaImg2ImgApiResponse;
    return novitaResult.task_id;
  } catch (error) {
    console.error("Error processing image with Novita.ai:", error);
    throw new Error("Failed to process the image.");
  }
};


export const createPreview = async (previewData: PreviewData) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("previews")
    .insert(previewData)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Error saving preview: ${error.message}`);
  }

  return data.id;
};

