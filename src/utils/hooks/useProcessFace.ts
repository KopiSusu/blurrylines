// useProcessFace.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client"; // Import your Supabase client

export default function useProcessFace() {
  return useMutation({
    mutationFn: async ({ file, profileId, type }: { file: File; profileId: string, type: string }) => {
      const supabase = createClient();
      // Step 1: Upload the image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images")
        .upload(`${profileId}/faces/${Date.now()}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Error uploading image: ${uploadError.message}`);
      }

      // Step 2: Call the API endpoint with the image path and prompt
      const response = await fetch("/api/novita/process-face", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imagePath: uploadData.path,
          type: type || 'realistic',
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const result = await response.json();
      return {
        taskId: result.taskId,
        faceId: result.faceId
      };
    },
  });
};

