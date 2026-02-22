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
const storageKey = `kreol_auth_${projectRef}`;

// Sanitize localStorage before initialization to prevent infinite hangs on corrupted sessions
const sanitizeAuthStorage = () => {
  try {
    const rawSession = localStorage.getItem(storageKey);
    if (rawSession) {
      if (rawSession === 'undefined' || rawSession === 'null') {
        throw new Error("Invalid session string");
      }
      const parsed = JSON.parse(rawSession);
      // Basic validation: A valid session must have an access_token
      if (!parsed || !parsed.access_token) {
        throw new Error("Session missing access_token");
      }
      console.log(`[Supabase] Valid session found for ${projectRef}`);
    }
  } catch (err) {
    console.warn(`[Supabase] Local session corrupted or invalid. Clearing key: ${storageKey}`, err);
    localStorage.removeItem(storageKey);
  }
};

// Only run in browser environment
if (typeof window !== 'undefined') {
  sanitizeAuthStorage();
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    // Audit Fix: Use project-specific storage key to prevent session contamination 
    // when switching projects or environments on the same domain.
    storageKey,
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