import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../config/supabaseConfig';

// A single shared client, created only when the project has actually been
// configured (see supabaseConfig.js). Every read in bmsDataService.js checks
// `supabase` for null before using it, so an unconfigured project behaves
// identically to today's static-JSON-only site.
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  : null;

export { isSupabaseConfigured };

// Lightweight live-connectivity probe for status indicators in the UI.
// Resolves quickly (short timeout) so it never blocks page load; returns
// false for "not configured" and for "configured but unreachable" alike --
// callers only need to know whether the live database is actually serving
// data right now.
export async function checkSupabaseConnection(timeoutMs = 3000) {
  if (!supabase) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const { error } = await supabase
      .from('nbms_bridges')
      .select('bridge_no', { count: 'exact', head: true })
      .abortSignal(controller.signal);
    clearTimeout(timer);
    return !error;
  } catch {
    return false;
  }
}
