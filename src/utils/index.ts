
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import moment from "moment";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTimeFromNow(dateStr: string) {
  // Convert dateStr to a moment object
  const date = moment(new Date(dateStr));

  // Use fromNow function to get the time from now
  const timeFromNow = date.fromNow();

  return timeFromNow;
}


export async function serverGetUserFromSupabaseAuth(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });

  const { data: session } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Unauthorised" };
  }

  const authUser = session?.session?.user;

  if (!authUser) {
    return { error: "No user found?" };
  }

  const { data: user, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      subscriptions(*)
    `
    )
    .eq("id", authUser.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return { error: "Internal Server Error" };
  }

  if (!user) {
    return { error: "No user found" };
  }

  return {
    user,
    session,
    supabase,
    error: null,
  };
}


export const getURL = (path: string = '') => {
  // Check if NEXT_PUBLIC_SITE_URL is set and non-empty. Set this to your site URL in production env.
  let url =
      process?.env?.NEXT_PUBLIC_SITE_URL &&
          process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
          ? process.env.NEXT_PUBLIC_SITE_URL
          : // If not set, check for NEXT_PUBLIC_VERCEL_URL, which is automatically set by Vercel.
          process?.env?.NEXT_PUBLIC_VERCEL_URL &&
              process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ''
              ? process.env.NEXT_PUBLIC_VERCEL_URL
              : // If neither is set, default to localhost for local development.
              'http://localhost:3000/';

  // Trim the URL and remove trailing slash if exists.
  url = url.replace(/\/+$/, '');
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Ensure path starts without a slash to avoid double slashes in the final URL.
  path = path.replace(/^\/+/, '');

  // Concatenate the URL and the path.
  return path ? `${url}/${path}` : url;
};

  // Utility function to read a file as a base64 string
  export function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get only the base64 string
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
  
  // Utility function to convert a base64 string back to a File
  export function base64ToFile(base64: string, filename: string): File {
    const byteString = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([intArray]);
    return new File([blob], filename);
  }
  