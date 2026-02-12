import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Helps surface misconfiguration during development
  console.warn('Supabase env vars missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  }
});

export const upsertUser = async (user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
}) => {
  if (!user?.id) return;
  const metadata = user.user_metadata ?? {};
  await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      full_name: metadata.full_name ?? metadata.name ?? '',
      avatar_url: metadata.avatar_url ?? metadata.picture ?? '',
      provider: metadata.provider ?? metadata.provider_id ?? '',
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );
};

export const checkAuthUserByEmail = async (email: string) => {
  const { data, error } = await supabase.functions.invoke('check-auth-user', {
    body: { email }
  });

  if (error) {
    throw error;
  }

  return data as
    | {
        exists: boolean;
        user: {
          id: string;
          email?: string | null;
          user_metadata?: Record<string, any>;
          created_at?: string | null;
          last_sign_in_at?: string | null;
        } | null;
      }
    | undefined;
};
