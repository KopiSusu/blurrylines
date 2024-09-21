import { createClient } from "../supabase/client";

// const uploaded = await uploadImage(file, "profiles", `${currentUser.id}/`);
export async function uploadImage(
  file: File,
  bucket = "avatars",
  destinationPath = "" //${currentUser.id}
) {
  const supabase = createClient();
  let myuuid = crypto.randomUUID();
  const path = `${destinationPath}${myuuid}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);

  if (error) {
    console.log(error);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}
