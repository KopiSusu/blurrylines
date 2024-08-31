import { createClient } from '@/utils/supabase/server';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Define the type for the response
interface NovitaApiResponse {
  output: {
    url: string;
  };
}

// Server action for generating the preview image
export const generatePreview = async (file: File): Promise<string> => {
  const supabase = await createClient();

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    console.error('Error fetching session:', error);
    throw new Error('No session found');
  }

  // Ensure the file is present
  if (!file) {
    throw new Error("No file uploaded");
  }

  try {
    const formData = new FormData();
    formData.append("image", file);

    const novitaResponse = await fetch("https://novita.ai/api/v1/image-to-image", {
      method: "POST",
      headers: {
        Authorization: `Bearer YOUR_API_KEY`, // Replace with your Novita.ai API key
      },
      body: formData,
    });

    if (!novitaResponse.ok) {
      throw new Error("Failed to generate the altered image.");
    }

    const data: unknown = await novitaResponse.json();

    // Narrow the type of `data` and check if it conforms to the expected shape
    if (!data || typeof data !== 'object' || !('output' in data)) {
      throw new Error("Unexpected response structure");
    }

    const typedData = data as NovitaApiResponse;

    return typedData.output.url;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate the image.");
  }
};
