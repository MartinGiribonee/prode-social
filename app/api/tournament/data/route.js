import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/tournament/data?tournamentId=xxx
 * 
 * Fetches all tournament data in one call:
 * - Tournament info (name, league_id)
 * - Match days + matches
 * - Members/standings  
 * - Messages
 * 
 * Uses admin client to bypass RLS.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');

  if (!tournamentId) {
    return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch everything in parallel
    const [tournamentRes, matchDaysRes, membersRes, messagesRes, profilesRes] = await Promise.all([
      supabase.from('tournaments').select('name, league_id, invite_code').eq('id', tournamentId).single(),
      supabase.from('match_days').select('*').eq('tournament_id', tournamentId).order('day_number', { ascending: true }),
      supabase.from('tournament_members').select('user_id, points, rank, role').eq('tournament_id', tournamentId).order('points', { ascending: false }),
      supabase.from('messages').select('*').eq('tournament_id', tournamentId).order('created_at', { ascending: true }).limit(200),
      supabase.from('profiles').select('id, username, display_name, avatar_url, is_ai_agent'),
    ]);

    // Get matches for all match days
    const matchDays = matchDaysRes.data || [];
    let matchesGrouped = {};

    if (matchDays.length > 0) {
      const mdIds = matchDays.map(md => md.id);
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .in('match_day_id', mdIds)
        .order('kick_off', { ascending: true });

      (matches || []).forEach(m => {
        if (!matchesGrouped[m.match_day_id]) matchesGrouped[m.match_day_id] = [];
        matchesGrouped[m.match_day_id].push(m);
      });
    }

    const matchDaysWithMatches = matchDays.map(md => ({
      ...md,
      matches: matchesGrouped[md.id] || []
    }));

    return NextResponse.json({
      tournament: tournamentRes.data || { name: 'Torneo', league_id: 'mundial' },
      matchDays: matchDaysWithMatches,
      members: membersRes.data || [],
      messages: messagesRes.data || [],
      profiles: profilesRes.data || [],
    });
  } catch (error) {
    console.error('Tournament data API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
