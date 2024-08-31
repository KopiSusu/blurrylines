import { createClient } from "@/utils/supabase/server";

export const getPreview = async (previewId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("previews")
    .select("*")
    .eq("id", previewId)
    .single();

  if (error) {
    throw new Error(`Error fetching preview: ${error.message}`);
  }

  return data;
};
