// useProcessImage.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client"; // Import your Supabase client

export default function useProcessImage() {
  return useMutation({
    mutationFn: async ({ file, prompt, profileId, }: { file: File; prompt: string, profileId: string }) => {
      console.log('start upload')
      const supabase = createClient();
      console.log('supabase')
      console.log(supabase)
      // Step 1: Upload the image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images")
        .upload(`${profileId}/${Date.now()}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

        console.log('uploadData')
        console.log(uploadData)
        console.log('uploadError')
        console.log(uploadError)

      if (uploadError) {
        throw new Error(`Error uploading image: ${uploadError.message}`);
      }

      // Step 2: Call the API endpoint with the image path and prompt
      const response = await fetch("/api/novita/process-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imagePath: uploadData.path,
          prompt: prompt || "Generate a preview image of the original image",
        }),
      });

      console.log('response')
      console.log(response)
      console.log('response.ok')
      console.log(response.ok)

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const result = await response.json();
      return result.taskId;
    },
  });
};

