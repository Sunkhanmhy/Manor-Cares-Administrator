import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly in dev instead of silently making broken requests.
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and use the SAME Supabase project as manor-cares-users.'
  );
}

const REMEMBER_ME_KEY = 'manor_admin_remember_me';

/** Controls whether the admin session survives closing the browser tab ("Remember session"). */
export function setRememberMe(remember: boolean) {
  localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
}

function rememberMeEnabled() {
  return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
}

// Routes the session token to localStorage (persists across browser restarts)
// or sessionStorage (cleared when the tab closes) based on "Remember session".
const authStorage = {
  getItem: (key: string) => (rememberMeEnabled() ? localStorage.getItem(key) : sessionStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    (rememberMeEnabled() ? localStorage : sessionStorage).setItem(key, value);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

// Only the public anon key is ever used on the client — never the service_role key.
// This is the SAME Supabase project/database as manor-cares-users; the admin app
// never provisions or connects to a separate database.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
    storageKey: 'manor-admin-auth',
  },
});
