import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { tournamentId } = await req.json();

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Read-only in route handlers
          },
        },
      }
    );

    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let result;
    if (tournamentId) {
      // Calculate points for a specific tournament
      result = await supabase.rpc('calculate_tournament_scores', { tournament_id_param: tournamentId });
    } else {
      // Calculate points for all tournaments (useful for global cron)
      result = await supabase.rpc('calculate_all_scores');
    }

    if (result.error) {
      console.error('Scoring error:', result.error);
      throw result.error;
    }

    return NextResponse.json({ success: true, message: '¡Puntajes calculados y posiciones actualizadas con éxito!' });
  } catch (error) {
    console.error('Error in scoring engine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
