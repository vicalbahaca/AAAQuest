import { serve } from 'https://deno.land/std@0.202.0/http/server.ts';

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

  const supabaseUrl = Deno.env.get('PROJECT_URL');
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing envs', {
      PROJECT_URL: !supabaseUrl,
      SERVICE_ROLE_KEY: !serviceRoleKey,
    });
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('check-auth-user failed', errText);
    return new Response(JSON.stringify({ error: 'admin_fetch_failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const payload = await response.json();
  const user = payload?.users?.[0] ?? null;

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
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
