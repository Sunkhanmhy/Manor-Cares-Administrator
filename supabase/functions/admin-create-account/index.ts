// Supabase Edge Function: admin-create-account
// Deploy with: supabase functions deploy admin-create-account
// Requires these secrets set on the Supabase project (never sent to the browser):
//   supabase secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=...
//
// This is the ONLY place in the whole system that touches the service_role key.
// It creates a new auth.users row + profiles/admin_profiles/user_roles rows for a
// new administrator account. The browser never receives or holds this key.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALLOWED_ROLE_KEYS = [
  'super_admin',
  'hr',
  'customer_support',
  'marketing',
  'sales',
  'finance',
  'technical',
  'transportation',
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  let payload: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
    jobTitle?: string;
    roleKey?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { email, firstName, lastName, phone, department, jobTitle, roleKey } = payload;
  if (!email || !firstName || !lastName || !roleKey) {
    return json({ error: 'email, firstName, lastName and roleKey are required' }, 400);
  }
  if (!ALLOWED_ROLE_KEYS.includes(roleKey)) {
    return json({ error: 'Invalid roleKey' }, 400);
  }

  // Client scoped to the CALLER's JWT — RLS runs as them, never as the service role.
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: callerUser, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !callerUser?.user) return json({ error: 'Invalid or expired session' }, 401);

  const { data: canManageAdmins, error: permErr } = await callerClient.rpc('current_admin_has_permission', {
    perm_key: 'admins.manage',
  });
  if (permErr || !canManageAdmins) {
    return json({ error: 'You do not have permission to create administrator accounts' }, 403);
  }

  if (roleKey === 'super_admin') {
    const { data: isSuper } = await callerClient.rpc('current_admin_is_super_admin');
    if (!isSuper) return json({ error: 'Only a Super Admin can create another Super Admin' }, 403);
  }

  const { data: callerProfile } = await callerClient.from('profiles').select('id').maybeSingle();

  // Service-role client — ONLY used for the two privileged operations below.
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 16) + 'A1!';

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      account_type: 'admin',
      first_name: firstName,
      last_name: lastName,
      phone: phone ?? null,
      department: department ?? null,
      job_title: jobTitle ?? null,
      admin_role: roleKey === 'super_admin' ? 'admin' : 'staff',
      created_by: callerProfile?.id ?? null,
    },
  });

  if (createErr || !created?.user) {
    return json({ error: createErr?.message ?? 'Failed to create account' }, 400);
  }

  // handle_new_user() trigger has already inserted profiles + admin_profiles by now.
  const { data: newProfile, error: newProfileErr } = await adminClient
    .from('profiles')
    .select('id')
    .eq('user_id', created.user.id)
    .maybeSingle();

  if (newProfileErr || !newProfile) {
    return json({ error: 'Account created but profile lookup failed. Contact support.' }, 500);
  }

  const { data: role } = await adminClient.from('roles').select('id').eq('key', roleKey).maybeSingle();
  if (role) {
    await adminClient
      .from('user_roles')
      .insert({ profile_id: newProfile.id, role_id: role.id, assigned_by: callerProfile?.id ?? null });
  }

  await adminClient.from('audit_logs').insert({
    admin_user_id: callerProfile?.id ?? null,
    action: 'admin_created',
    resource_type: 'admin_profiles',
    resource_id: String(newProfile.id),
    description: `Created admin account for ${email} with role ${roleKey}`,
  });

  // Sends the new admin a password-setup link instead of returning a temp password in the response.
  await adminClient.auth.resetPasswordForEmail(email);

  return json({ ok: true, profileId: newProfile.id });
});
