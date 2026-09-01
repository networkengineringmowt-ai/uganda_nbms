// Live database connection for the public site.
//
// The values below are the Supabase project URL and the PUBLIC "anon" key --
// not a secret. Supabase's anon key is designed to be embedded in public
// frontend code (exactly like this); the database itself is protected by
// Row-Level Security policies (see supabase/nbms_schema.sql), which grant
// this key read-only access and nothing else. The service_role key (the
// one that bypasses RLS) must never appear here or anywhere in this repo.
//
// Until these two values are filled in, the app runs exactly as it does
// today -- reading the bundled JSON files in public/data/ -- so this file
// is safe to ship in this state. Once a project URL + anon key are added,
// bmsDataService.js automatically starts reading live from the database
// first, falling back to the bundled JSON only if the database is
// unreachable.
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
