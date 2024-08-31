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
				// fetch user information profile
				const { data: profile } = await supabase
					.from("profiles")
					.select("*, subscription:subscriptions(*)")
					.eq("id", data.session.user.id)
					.single();

				return profile;
			}
			return null;
		},
	});
}