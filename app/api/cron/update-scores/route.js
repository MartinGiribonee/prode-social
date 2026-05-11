import { NextResponse } from 'next/server';
import { getFixtures, mapApiFixtureToMatch } from '@/lib/football-api';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * CRON JOB: Automatically updates match results and recalculates scores.
 * 
 * Uses SECURITY DEFINER functions exclusively — no direct table access.
 * This ensures RLS is never bypassed from the client side.
 * 
 * Protected by CRON_SECRET to prevent unauthorized calls.
 */
export async function GET(request) {
  // Verify the request is from Vercel Cron (or has the secret)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { tournamentsProcessed: 0, matchesUpdated: 0, scoresRecalculated: 0, errors: [] };

  try {
    // 1. Get all active tournaments via SECURITY DEFINER function
    const { data: tournaments, error: tError } = await supabase.rpc('get_active_tournaments');

    if (tError) throw tError;
    if (!tournaments || tournaments.length === 0) {
      return NextResponse.json({ message: 'No active tournaments found', ...results });
    }

    // 2. Process each tournament
    for (const tournament of tournaments) {
      try {
        const leagueId = getLeagueId(tournament.league_id);
        const season = getSeason(tournament.league_id);

        // 3. Fetch latest fixtures from API-Football
        const apiFixtures = await getFixtures(leagueId, season);
        if (!apiFixtures || apiFixtures.length === 0) continue;

        // 4. Get match_days via SECURITY DEFINER function
        const { data: matchDays } = await supabase.rpc('get_tournament_match_days', {
          p_tournament_id: tournament.id
        });

        if (!matchDays || matchDays.length === 0) continue;

        // 5. Build lookup
        const mdByLabel = {};
        matchDays.forEach(md => { mdByLabel[md.label] = md; });

        // 6. Update finished/live matches via SECURITY DEFINER
        for (const fix of apiFixtures) {
          const matchData = mapApiFixtureToMatch(fix);
          if (matchData.status !== 'finished' && matchData.status !== 'live') continue;

          const roundName = fix.league.round;
          const matchDay = mdByLabel[roundName];
          if (!matchDay) continue;

          const { error: updateError } = await supabase.rpc('update_match_result', {
            p_match_day_id: matchDay.id,
            p_home_team: matchData.home_team,
            p_away_team: matchData.away_team,
            p_home_score: matchData.home_score,
            p_away_score: matchData.away_score,
            p_status: matchData.status,
          });

          if (updateError) {
            results.errors.push(`${matchData.home_team} vs ${matchData.away_team}: ${updateError.message}`);
          } else {
            results.matchesUpdated++;
          }
        }

        // 7. Update match_day statuses via SECURITY DEFINER
        for (const md of matchDays) {
          const { data: matchStatuses } = await supabase.rpc('get_match_day_matches', {
            p_match_day_id: md.id
          });

          if (!matchStatuses || matchStatuses.length === 0) continue;

          const allFinished = matchStatuses.every(m => m.status === 'finished');
          const anyLive = matchStatuses.some(m => m.status === 'live');
          const newStatus = allFinished ? 'finished' : anyLive ? 'active' : 'upcoming';

          await supabase.rpc('update_match_day_status', {
            p_match_day_id: md.id,
            p_status: newStatus
          });
        }

        // 8. Recalculate scores via SECURITY DEFINER
        const { error: scoreError } = await supabase.rpc('calculate_tournament_scores', {
          tournament_id_param: tournament.id
        });

        if (scoreError) {
          results.errors.push(`Scoring ${tournament.name}: ${scoreError.message}`);
        } else {
          results.scoresRecalculated++;
        }

        results.tournamentsProcessed++;
      } catch (err) {
        results.errors.push(`Tournament ${tournament.name}: ${err.message}`);
      }
    }

    const summary = `✅ Cron completado: ${results.tournamentsProcessed} torneos, ${results.matchesUpdated} partidos actualizados, ${results.scoresRecalculated} tablas recalculadas.`;
    console.log(summary);

    return NextResponse.json({
      success: true,
      message: summary,
      ...results,
      errors: results.errors.length > 0 ? results.errors.slice(0, 10) : undefined,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getLeagueId(leagueStr) {
  const mapping = { 'world_cup': 1, 'argentina': 128, 'premier': 39, 'champions': 2 };
  return mapping[leagueStr] || 1;
}

function getSeason(leagueStr) {
  if (leagueStr === 'world_cup') return 2022;
  return new Date().getFullYear();
}
