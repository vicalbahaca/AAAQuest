import { serve } from 'https://deno.land/std@0.202.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let email = '';
  if (req.method === 'GET') {
    const url = new URL(req.url);
    email = (url.searchParams.get('email') ?? '').toString().trim().toLowerCase();
  } else {
    let payload: { email?: string } = {};
    try {
      payload = await req.json();
    } catch (_error) {
      payload = {};
    }
    email = (payload.email ?? '').toString().trim().toLowerCase();
  }
  if (!email) {
    return new Response(JSON.stringify({ error: 'email_required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  const { data, error } = await supabase.auth.admin.getUserByEmail(email);
  if (error) {
    console.error('check-auth-user failed', error);
  }

  const user = data?.user ?? null;

  return new Response(
    JSON.stringify({
      exists: Boolean(user),
      user: user
        ? {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
          }
        : null,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
