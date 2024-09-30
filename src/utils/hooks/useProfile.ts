"use client";

import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        // Fetch user information profile
        const { data: profile } = await supabase
          .from("profiles")
          .select(
            `*, 
            subscription:subscriptions(*), 
            face:faces(*)`
          )
          .eq("id", data.session.user.id)
          .single();

        // Extract the single face object from the array
        if (profile && profile.face && Array.isArray(profile.face)) {
          profile.face = profile.face[0];
        }

        return profile;
      }
      return null;
    },
  });
}
