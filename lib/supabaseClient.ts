import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase client for use in 'use client' components.
 *
 * During SSR (server-side rendering at build/request time), returns a no-op
 * stub because useEffect (where Supabase is actually called) never runs on
 * the server. This prevents "supabaseUrl is required" crashes when env vars
 * are not available in the build environment.
 */
export function createSupabaseClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  // SSR guard: useMemo runs on the server but useEffect does not.
  // Return a safe stub so the component renders without crashing.
  if (typeof window === 'undefined') {
    return new Proxy({} as SupabaseClient, {
      get() {
        return () =>
          Promise.resolve({ data: null, error: null });
      },
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => {
      return await getToken();
    },
  });
}

