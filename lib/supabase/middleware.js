import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && url !== 'your_supabase_url_here' && url.startsWith('http');
};

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase isn't configured, skip auth completely
  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh the session (important for token refresh)
    await supabase.auth.getUser();
  } catch (e) {
    // If Supabase errors (e.g. network), let request pass through
    console.warn('Middleware Supabase error:', e.message);
  }

  // Always allow access — the client-side AuthContext handles
  // demo mode fallback when there's no Supabase session
  return supabaseResponse;
}
