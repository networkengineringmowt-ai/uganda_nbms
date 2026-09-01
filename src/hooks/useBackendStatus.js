import { useEffect, useState } from 'react';
import { checkSupabaseConnection, isSupabaseConfigured } from '../services/supabaseClient';

const LOCAL_API_AVAILABLE = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname);

// True, live backend status for the UI -- replaces the old hardcoded
// "Supabase Connected" labels that claimed a database connection which
// never actually existed. Resolves to one of:
//   'local-drive' -- the office Local Drive server answered (localhost only)
//   'supabase'    -- the live Postgres database answered
//   'static-json' -- neither is configured/reachable; serving bundled data
export default function useBackendStatus() {
  const [status, setStatus] = useState(LOCAL_API_AVAILABLE ? 'checking' : (isSupabaseConfigured ? 'checking' : 'static-json'));

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (LOCAL_API_AVAILABLE) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2000);
          const response = await fetch('http://localhost:3001/api/bridges', { signal: controller.signal });
          clearTimeout(timer);
          if (response.ok && !cancelled) {
            setStatus('local-drive');
            return;
          }
        } catch {
          // fall through to the next backend
        }
      }

      if (isSupabaseConfigured) {
        const connected = await checkSupabaseConnection();
        if (!cancelled) {
          setStatus(connected ? 'supabase' : 'static-json');
          return;
        }
      }

      if (!cancelled) setStatus('static-json');
    }

    resolve();
    return () => { cancelled = true; };
  }, []);

  return status;
}

export const BACKEND_STATUS_LABEL = {
  checking: 'Checking…',
  'local-drive': 'Local Drive Server',
  supabase: 'Supabase Connected',
  'static-json': 'Static Data (No Live DB)',
};
