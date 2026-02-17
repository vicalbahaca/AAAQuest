import { serve } from 'https://deno.land/std@0.202.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('PROJECT_URL');
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: serviceRoleKey,
    },
  });

  if (!userRes.ok) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userData = await userRes.json();
  const userId = userData?.id;

  if (!userId) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: { email?: string; password?: string; full_name?: string } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const updates: Record<string, any> = {};
  if (payload.email) {
    updates.email = payload.email;
    updates.email_confirm = true;
  }
  if (payload.password) updates.password = payload.password;
  if (payload.full_name) updates.user_metadata = { full_name: payload.full_name };

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.error('update-auth-user failed', errText);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
