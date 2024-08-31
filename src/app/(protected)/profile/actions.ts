import { createClient } from '@/utils/supabase/server';

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
