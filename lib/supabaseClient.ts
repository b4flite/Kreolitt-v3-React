import { createClient } from '@supabase/supabase-js';

// Access environment variables directly to ensure Vite/Bundlers replace them statically at build time.
// Dynamic access (e.g. import.meta.env[key]) often fails to be replaced in production builds.
// Audit Fix: Use optional chaining to prevent runtime crashes if import.meta.env is undefined.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://iezlmplizekdrlktbaat.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_LmWckIYopJ7hI2xcciNmsQ_U9ntX5qg';

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials. Please check your configuration.");
}

// Standard client for all operations (Auth & Public)
// RLS policies on the backend determine access rights (Anon vs Authenticated)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'kreol_tours_auth_token_v1', 
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});