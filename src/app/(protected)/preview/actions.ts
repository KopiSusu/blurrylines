import { createClient } from '@/utils/supabase/server';
import fetch from 'node-fetch';

interface PreviewData {
  task_id?: string;
  original_url: string;
  preview_url?: string;
  status: string;
  profile_id: string;
  prompt: string;
}

interface NovitaReimagineApiResponse {
  image_file: string;
  image_type: string;
}

export const generateReimaginePreview = async (imageBase64: string): Promise<string> => {
  const novitaApiKey = process.env.NOVITA_API_KEY!;
  const webhookUrl = process.env.PROCESS_IMAGE_WEBHOOK_URL!;

  try {
    const novitaResponse = await fetch("https://api.novita.ai/v3/reimagine", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${novitaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_file: imageBase64,
        extra: {
          response_image_type: "jpeg", // Change the format to "png" or "webp" if needed
        },
      }),
    });

    if (!novitaResponse.ok) {
      throw new Error("Failed to process image with Novita.ai Reimagine.");
    }

    const novitaResult = (await novitaResponse.json()) as NovitaReimagineApiResponse;

    // Returning the base64 of the reimagined image
    return novitaResult.image_file;
  } catch (error) {
    console.error("Error processing image with Novita.ai Reimagine:", error);
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
