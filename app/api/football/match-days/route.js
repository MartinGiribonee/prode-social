import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/football/match-days?tournamentId=xxx
 * 
 * Fetches match days + matches for a tournament using the admin client
 * to bypass RLS policies. Requires a valid tournamentId.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');

  if (!tournamentId) {
    return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch match days for this tournament
    const { data: matchDays, error: mdError } = await supabase
      .from('match_days')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('day_number', { ascending: true });

    if (mdError) {
      console.error('Error fetching match_days:', mdError);
      return NextResponse.json({ error: mdError.message }, { status: 500 });
    }

    if (!matchDays || matchDays.length === 0) {
      return NextResponse.json({ matchDays: [] });
    }

    // Fetch all matches for these match days
    const matchDayIds = matchDays.map(md => md.id);
    const { data: matches, error: mError } = await supabase
      .from('matches')
      .select('*')
      .in('match_day_id', matchDayIds)
      .order('kick_off', { ascending: true });

    if (mError) {
      console.error('Error fetching matches:', mError);
      return NextResponse.json({ error: mError.message }, { status: 500 });
    }

    // Group matches under their match days
    const matchesByDay = {};
    (matches || []).forEach(m => {
      if (!matchesByDay[m.match_day_id]) matchesByDay[m.match_day_id] = [];
      matchesByDay[m.match_day_id].push(m);
    });

    const result = matchDays.map(md => ({
      ...md,
      matches: matchesByDay[md.id] || []
    }));

    return NextResponse.json({ matchDays: result });
  } catch (error) {
    console.error('Match days API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
