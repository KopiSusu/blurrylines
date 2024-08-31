// /components/shared/RealtimeWrapper.tsx
"use client";

import { createClient } from "@/utils/supabase/client";
import React, { useEffect, useState, createContext, useContext } from "react";

// Create a context to pass the updated preview data
const PreviewContext = createContext<any | null>(null);

// Custom hook to use the preview context
export const usePreview = () => {
  return useContext(PreviewContext);
};

interface RealtimeWrapperProps {
  children: React.ReactNode;
  initialPreview: any; // Define the type according to your data structure
  previewId: string;
}

function RealtimeWrapper({
  children,
  initialPreview,
  previewId,
}: RealtimeWrapperProps) {
  const [preview, setPreview] = useState(initialPreview);
  const supabase = createClient();

  useEffect(() => {
    // Set up the real-time subscription
    const subscription = supabase
      .channel(`previews:id=eq.${previewId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "previews",
          filter: `id=eq.${previewId}`,
        },
        (payload) => {
          setPreview(payload.new); // Update the state with the new data
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [previewId, supabase]);

  return (
    <PreviewContext.Provider value={preview}>
      {children}
    </PreviewContext.Provider>
  );
}

export default RealtimeWrapper;
