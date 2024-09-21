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

  console.log('userId')
  console.log(userId)

  // Get the current profile to compare face_description
  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('face_description')
    .eq('id', userId)
    .single()

  console.log('profileError')
  console.log(profileError)

  if (profileError) {
    // Handle error
    redirect('/error')
  }

  // Check if face_description has changed
  const faceDescriptionChanged =
    data.face_description !== currentProfile?.face_description

  let face_url

  console.log('faceDescriptionChanged')
  console.log(faceDescriptionChanged)

  if (faceDescriptionChanged && data?.face_description) {
    console.log('start')
    console.log(data?.face_description)
    // Generate the portrait using OpenAI's API
    const faceImageBuffer = await generateImage(data.face_description!)

    if (!faceImageBuffer) {
      // Handle error
      redirect('/error')
    }

    console.log('userId')
    console.log(userId)

    // Save the image to Supabase storage
    const path = `${userId}/faces/${Date.now()}`
    const { error: storageError } = await supabase.storage
      .from('images') // Ensure your bucket is named 'avatars'
      .upload(path, faceImageBuffer, {
        cacheControl: "3600",
        upsert: false,
      })

    console.log('storageError')
    console.log(storageError)

    if (storageError) {
      // Handle error
      redirect('/error')
    }

    // Get the public URL of the image
    const {
      data: { publicUrl },
    } = supabase.storage.from('images').getPublicUrl(path)

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

// Helper function to generate the face image using OpenAI's API
async function generateFaceImage(prompt: string): Promise<Buffer | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: '512x512',
        response_format: 'b64_json',
      }),
    })

    if (!response.ok) {
      // Handle error
      console.error('OpenAI API error:', response.statusText)
      return null
    }

    const result = await response.json()
    const base64Image = result.data[0].b64_json

    // Convert base64 string to Buffer
    const imageBuffer = Buffer.from(base64Image, 'base64')

    return imageBuffer
  } catch (error) {
    console.error('Error generating face image:', error)
    return null
  }
}


