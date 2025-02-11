import { createClient } from "@/utils/supabase/server";

export async function getPreviews() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { previews: null, error: "No user found" };
  }

  const { data: previews, error: prviewsError } = await supabase
    .from("previews")
    .select(
      `
      *,
      profile:profiles(*)
    `
    )
    .eq("profile_id", user.id)
    .order("updated_at", { ascending: false });

  if (prviewsError) {
    console.error("Error fetching previews:", prviewsError);
    return { previews: null };
  }

  return { previews };
}

export async function getPreviewsByProfile(id: string) {
  const supabase = await createClient();

  if (!id) {
    return { previews: null, error: "Profile ID required" };
  }

  const { data: previews, error: prviewsError } = await supabase
    .from("previews")
    .select(
      `
      *,
      profile:profiles(*)
    `
    )
    .eq("profile_id", id)
    .order("updated_at", { ascending: false });

  if (prviewsError) {
    console.error("Error fetching previews:", prviewsError);
    return { previews: null };
  }

  return { previews };
}

export async function getExplorePreviews() {
  const supabase = await createClient();

  const { data: previews, error: prviewsError } = await supabase
    .from("previews")
    .select(
      `
      *,
      profile:profiles(*)
    `
    )
    .order("updated_at", { ascending: false });

  if (prviewsError) {
    console.error("Error fetching previews:", prviewsError);
    return { previews: null };
  }

  return { previews };
}
