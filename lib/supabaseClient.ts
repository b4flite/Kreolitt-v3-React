import { createClient } from '@supabase/supabase-js';

// Secure access to Vite environment variables
// Note: We use static access because Vite's production optimizer 
// doesn't support dynamic string access for import.meta.env
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Connection Diagnostic & Project ID extraction
const projectRef = supabaseUrl?.split('.')[0]?.split('//')[1] || 'default';

if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.error("FATAL: Supabase URL missing. Vite did not bake the URL into this build.");
}

if (!supabaseKey || supabaseKey === 'undefined') {
  console.error("FATAL: Supabase Anon Key missing. Vite did not bake the Key into this build.");
} else {
  console.log(`[Supabase] Initialized for project: ${projectRef}`);
}

// Hardened client initialization
export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    // Audit Fix: Use project-specific storage key to prevent session contamination 
    // when switching projects or environments on the same domain.
    storageKey: `kreol_auth_${projectRef}`,
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