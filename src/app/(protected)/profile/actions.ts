'use server'

import { generateImage } from '@/utils/openai/generateImage';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getProfile() {
  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    console.error('Error fetching session:', error);
    return { profile: null, error: 'No session found' };
  }

  const user = session?.user;

  if (!user) {
    return { profile: null, error: 'No user found' };
  }

  const { data: profile, error: userError } = await supabase
    .from('profiles')
    .select(`
      *,
      subscription:subscriptions(*)
    `)
    .eq('id', user.id)
    .single();


  if (userError) {
    console.error('Error fetching profile:', userError);
    return { profile: null };
  }

  if (!profile) {
    return { profile: null, error: 'No user found' };
  }

  return { profile };
}


export async function getProfileById(id: string) {
  const supabase = await createClient();

  const { data: profile, error: userError } = await supabase
    .from('profiles')
    .select(`
      *
    `)
    .eq('id', id)
    .single();


  if (userError) {
    console.error('Error fetching profile:', userError);
    return { profile: null };
  }

  if (!profile) {
    return { profile: null, error: 'No user found' };
  }

  return { profile };
}

type ProfileData = {
  username?: string
  full_name?: string
  face_description?: string
  avatar_url?: string
}

export async function updateProfile(data: ProfileData) {
  const supabase = await createClient();

  // Get the currently authenticated user
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error("Error fetching session:", sessionError);
    redirect('/login')
  }

  const user = session?.user;

  if (!user) {
    redirect('/login')
  }

  const userId = user.id

  // Get the current profile to compare face_description
  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('face_description')
    .eq('id', userId)
    .single()

  if (profileError) {
    // Handle error
    redirect('/error')
  }

  // Check if face_description has changed
  const faceDescriptionChanged =
    data.face_description !== currentProfile?.face_description

  let face_url
  let face_image_path

  if (faceDescriptionChanged && data?.face_description) {
    // Generate the portrait using OpenAI's API
    const faceImageBuffer = await generateImage(`A photorealistic portrait of ${data?.face_description}, Hyperrealistic style.` || "A photorealistic portrait of a Short blond hair, bright blue eyes, white background, Hyperrealistic style.")

    if (!faceImageBuffer) {
      // Handle error
      redirect('/error')
    }

    // Save the image to Supabase storage
    face_image_path = `${userId}/faces/${Date.now()}`
    const { error: storageError } = await supabase.storage
      .from('images') // Ensure your bucket is named 'avatars'
      .upload(face_image_path, faceImageBuffer, {
        cacheControl: "3600",
        upsert: false,
      })


    if (storageError) {
      // Handle error
      redirect('/error')
    }

    // Get the public URL of the image
    const {
      data: { publicUrl },
    } = supabase.storage.from('images').getPublicUrl(face_image_path)

    face_url = publicUrl
  }

  // Prepare the data to update
  const updateData: any = {
    username: data.username,
    full_name: data.full_name,
    face_description: data.face_description,
  }

  if (face_url) {
    updateData.face_url = face_url
  }

  if (face_image_path) {
    updateData.face_image_path = face_image_path
  }

  if (data.avatar_url) {
    updateData.avatar_url = data.avatar_url
  }

  // Update the user's profile in the 'profiles' table
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    // If there's an error updating the profile, redirect to an error page
    redirect('/error')
  }

  // Revalidate the path to update cached data and redirect to the profile page
  revalidatePath('/profile') // Adjust the path if needed
  redirect('/profile') // Adjust the redirect path as needed
}


