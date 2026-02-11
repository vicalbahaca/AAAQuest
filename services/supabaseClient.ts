import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Helps surface misconfiguration during development
  console.warn('Supabase env vars missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

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
