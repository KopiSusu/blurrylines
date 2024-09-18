import { createClient } from '@/utils/supabase/server';
import sharp from 'sharp'; // Install this library using npm install sharp
export const maxDuration = 300;

interface PreviewData {
  task_id: string;
  original_url: string;
  original_image_path: string;
  preview_url?: string;
  preview_image_path? : string;
  status: string;
  profile_id: string;
  prompt: string;
  height: number;
  width: number;
}

interface NovitaImg2ImgApiResponse {
  task_id: string;
}

interface NovitaImg2PromptResponse {
  prompt: string;
}

// Function to extract a prompt from the original image using Novita's Image to Prompt API
export const getPromptFromImage = async (imageBase64: string): Promise<string> => {
  const novitaApiKey = process.env.NOVITA_API_KEY!;

  try {
    const response = await fetch('https://api.novita.ai/v3/img2prompt', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${novitaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_file: imageBase64,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract prompt from image with Novita.ai.');
    }

    const result = (await response.json()) as NovitaImg2PromptResponse;

    const generalPrompt = "realistic, photograph, (masterpiece), 8k quality, (detailed eyes:1.2), (highest quality:1.1), highly detailed, majestic, top quality, best quality, newest, ai-generated, (intricate details:1.1), extremely beautiful, elegant, majestic, immersive background+, (detailed face, perfect face)"
    const combinedPrompt = `${generalPrompt} ${result.prompt}`
    return combinedPrompt;
  } catch (error) {
    console.error('Error extracting prompt from image with Novita.ai:', error);
    throw new Error('Failed to extract prompt from the image.');
  }
};

// Function to get the dimensions of the image
export const getImageDimensions = async (imageBase64: string): Promise<{ width: number; height: number }> => {
  const imageBuffer = Buffer.from(imageBase64, 'base64');

  try {
    const metadata = await sharp(imageBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not retrieve image dimensions.');
    }
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    throw new Error('Failed to retrieve image dimensions.');
  }
};

// Function to generate a new image based on the extracted prompt using the Image to Image endpoint
export const generateImg2ImgPreview = async (
  imageBase64: string, 
  prompt: string,
  height: number,
  width: number,
): Promise<string> => {
  const novitaApiKey = process.env.NOVITA_API_KEY!;
  const webhookUrl = process.env.PROCESS_IMAGE_WEBHOOK_URL!;

  try {
    const novitaResponse = await fetch('https://api.novita.ai/v3/async/img2img', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${novitaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        extra: {
          response_image_type: 'jpeg',
          webhook: {
            url: webhookUrl, // Set your webhook endpoint here
          },
        },
        request: {
          model_name: 'protovisionXLHighFidelity3D_beta0520Bakedvae_106612.safetensors',
          // model_name: 'meinahentai_v4_70340.safetensors',
          prompt: prompt,
          negative_prompt: "(worst quality:1.5), (low quality:1.5), (normal quality:1.5), anime, cartoon, painting, drawing, illustration, manga, sketch, nudity, young, child, hairband, headband, horns, lowres, bad anatomy, bad hands, multiple eyebrow, (cropped), extra limb, missing limbs, deformed hands, long neck, long body, long torso, (bad hands), signature, username, artist name, conjoined fingers, deformed fingers, ugly eyes, imperfect eyes, skewed eyes, unnatural face, unnatural body, error, grain, jpeg artifacts",
          height: height, // Use the original height
          width: width,   // Use the original width
          image_num: 1,
          steps: 20,
          seed: 1,
          clip_skip: 1,
          guidance_scale: 7.5,
          strength: 0.65,
          sampler_name: 'DPM++ 2S a Karras',
          image_base64: imageBase64,
        },
      }),
    });

    if (!novitaResponse.ok) {
      throw new Error('Failed to process image with Novita.ai.');
    }

    const novitaResult = (await novitaResponse.json()) as NovitaImg2ImgApiResponse;
    return novitaResult.task_id;
  } catch (error) {
    console.error('Error processing image with Novita.ai:', error);
    throw new Error('Failed to process the image.');
  }
};

// Function to create a preview record in the Supabase database
export const createPreview = async (previewData: PreviewData) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('previews')
    .insert(previewData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error saving preview: ${error.message}`);
  }

  return data.id;
};
