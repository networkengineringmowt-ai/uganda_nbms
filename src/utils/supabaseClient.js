const DEFAULT_SUPABASE_REST_URL = 'https://udionwmqmjcfzbdhoetv.supabase.co/rest/v1';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaW9ud21xbWpjZnpiZGhvZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDI3NjcsImV4cCI6MjA5NjIxODc2N30.EP5bruNS55m2PE1nf0p2KeOxm4Tnae5ESAj6DukqIr0';

export const SUPABASE_REST_URL = (import.meta.env.VITE_SUPABASE_REST_URL || DEFAULT_SUPABASE_REST_URL).replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
export const BMS_DATA_SOURCE = import.meta.env.VITE_BMS_DATA_SOURCE || 'auto';

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_REST_URL && SUPABASE_ANON_KEY);
}

export function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

export async function supabaseRest(path, options = {}) {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase REST URL or anon key is not configured.');
  }

  const url = path.startsWith('http')
    ? path
    : `${SUPABASE_REST_URL}/${path.replace(/^\/+/, '')}`;

  const response = await fetch(url, {
    ...options,
    headers: supabaseHeaders(options.headers || {}),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Supabase request failed with status ${response.status}`);
  }

  return text ? JSON.parse(text) : null;
}
