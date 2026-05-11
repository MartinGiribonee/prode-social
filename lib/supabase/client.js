import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let client = null;

export function createClient() {
  if (client) return client;
  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'prode-social-auth',
        lock: (name, timeout, acquire) => acquire()
      }
    }
  );
  return client;
}
