import { createClient } from '@supabase/supabase-js';

// Secure access to Vite environment variables
const getEnv = (key: string) => {
  try {
    const val = (import.meta as any).env?.[key];
    return val || undefined;
  } catch (e) {
    console.warn(`Error accessing environment variable ${key}:`, e);
    return undefined;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl) {
  console.error("FATAL: Supabase URL missing. Check your .env file.");
}

if (!supabaseKey) {
  console.error("FATAL: Supabase Anon Key missing. Check your .env file.");
}

// Hardened client initialization
export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    storageKey: 'kreol_island_auth_v2', // Versioned storage key to avoid conflicts
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'kreolitt-legacy-spa' },
  },
});

// Connection Diagnostic
if (supabaseUrl && supabaseKey) {
  const projectRef = supabaseUrl.split('.')[0].split('//')[1];
  console.log(`[Supabase] Initialized for project: ${projectRef}`);
}