"use client";

import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client"; // Import your Supabase client

export default function useProcessImage() {
  return useMutation({
    mutationFn: async ({ file, prompt, profileId }: { file: File; prompt: string; profileId: string }) => {
      const supabase = createClient();

      // Step 1: Upload the image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images")
        .upload(`${profileId}/${Date.now()}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Error uploading image: ${uploadError.message}`);
      }

      // Step 2: Call the Reimagine API endpoint with the image path
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

      if (!response.ok) {
        throw new Error("Failed to process image with Reimagine.");
      }

      const result = await response.json();
      return {
        previewId: result.previewId,
      };
    },
  });
}
