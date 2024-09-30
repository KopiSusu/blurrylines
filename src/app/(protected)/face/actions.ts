import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { NovitaImg2ImgApiResponse } from "../preview/actions";


interface FaceData {
  task_id: string;
  original_url: string;
  original_image_path: string;
  face_url?: string;
  face_image_path? : string;
  status: string;
  profile_id: string;
  prompt: string;
  height: number;
  width: number;
}


// Function to generate a new image based on the extracted prompt using the Image to Image endpoint
export const generateImg2ImgFace = async (
  type: string,
  imageBase64: string, 
  prompt: string,
  height: number,
  width: number,
): Promise<string> => {
  const novitaApiKey = process.env.NOVITA_API_KEY!;
  const webhookUrl = process.env.PROCESS_FACE_WEBHOOK_URL!;

  // cyberrealistic_v40_151857
  // epicrealism_pureEvolutionV5_97793
  // epicphotogasm_x_131265
  try {
    const realistic_model = 'epicphotogasm_x_131265.safetensors'
    // const realistic_model = 'protovisionXLHighFidelity3D_beta0520Bakedvae_106612.safetensors'
    const anime_model = 'meinahentai_v4_70340.safetensors'
    const model = type === 'realistic' ? realistic_model : anime_model;
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
          model_name: model,
          prompt: prompt,
          negative_prompt: "(worst quality:1.5), (low quality:1.5), (normal quality:1.5), young, child, hairband, headband, horns, lowres, bad anatomy, bad hands, multiple eyebrow, (cropped), extra limb, missing limbs, deformed hands, long neck, long body, long torso, (bad hands), signature, username, artist name, conjoined fingers, deformed fingers, ugly eyes, imperfect eyes, skewed eyes, unnatural face, unnatural body, error, grain, jpeg artifacts",
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
export const createFace = async (faceData: FaceData) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('faces')
    .insert(faceData)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error saving preview: ${error.message}`);
  }

  // Revalidate the path to update cached data and redirect to the profile page
  revalidatePath('/profile') // Adjust the path if needed
  return data.id;
};

// Function to create or update a face record in the Supabase database
export const createOrUpdateFace = async (faceData: FaceData) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('faces')
    .upsert(faceData, { onConflict: 'profile_id' }) // Use 'upsert' to insert or update based on 'profile_id'
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error saving face: ${error.message}`);
  }

  // Revalidate the path to update cached data and redirect to the profile page
  revalidatePath('/profile'); // Adjust the path if needed
  return data.id;
};
