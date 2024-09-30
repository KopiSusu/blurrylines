'use server'

import { generateImage } from '@/utils/openai/generateImage';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { NovitaImg2PromptResponse } from '../preview/actions';

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
      subscription:subscriptions(*),
      face:faces(*)
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
      *,
      face:faces(*)
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
  face_url?: string
  face_image_path?: string
  avatar_url?: string
  avatar_image_path?: string
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

  // Prepare the data to update
  const updateData: any = {
    username: data?.username,
    full_name: data?.full_name,
    face_description: data?.face_description,
    face_url: data?.face_url,
    face_image_path: data?.face_image_path,
    avatar_url: data?.avatar_url,
    avatar_image_path: data?.avatar_image_path
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


