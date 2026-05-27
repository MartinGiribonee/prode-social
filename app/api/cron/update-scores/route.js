import { NextResponse } from 'next/server';
import { getFixtures, mapApiFixtureToMatch } from '@/lib/football-api';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * CRON JOB: Fully automatic match sync + result updates + score calculation.
 * 
 * Runs every 15 minutes via Vercel Cron. For each active tournament:
 *   1. Syncs fixtures from API-Football (creates match_days & matches if missing)
 *   2. Updates results for finished/live matches
 *   3. Updates match_day statuses (upcoming → active → finished)
 *   4. Recalculates user scores and rankings
 * 
 * Uses SECURITY DEFINER functions exclusively — no direct table access.
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
  const results = {
    tournamentsProcessed: 0,
    matchesSynced: 0,
    matchesUpdated: 0,
    scoresRecalculated: 0,
    errors: []
  };

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

        // ── PHASE 1: Sync fixtures (create match_days + matches if missing) ──
        const syncedCount = await syncFixtures(supabase, tournament.id, apiFixtures);
        results.matchesSynced += syncedCount;

        // ── PHASE 2: Update results for finished/live matches ──
        const updatedCount = await updateResults(supabase, tournament.id, apiFixtures, results);
        results.matchesUpdated += updatedCount;

        // ── PHASE 3: Update match_day statuses ──
        await updateMatchDayStatuses(supabase, tournament.id);

        // ── PHASE 4: Recalculate scores ──
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

    const summary = `✅ Cron completado: ${results.tournamentsProcessed} torneos, ${results.matchesSynced} partidos sincronizados, ${results.matchesUpdated} resultados actualizados, ${results.scoresRecalculated} tablas recalculadas.`;
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

/**
 * PHASE 1: Sync all fixtures from API-Football into the database.
 * Uses the sync_match RPC (SECURITY DEFINER) to upsert match_days and matches.
 */
async function syncFixtures(supabase, tournamentId, apiFixtures) {
  let synced = 0;

  // Group by round
  const rounds = {};
  apiFixtures.forEach(fix => {
    const roundName = fix.league.round;
    if (!rounds[roundName]) rounds[roundName] = [];
    rounds[roundName].push(fix);
  });

  let dayCounter = 0;

  for (const [roundName, fixtures] of Object.entries(rounds)) {
    dayCounter++;
    const dayMatch = roundName.match(/\d+/);
    const dayNumber = dayMatch ? parseInt(dayMatch[0]) : dayCounter;

    // Determine match_day status
    const allFinished = fixtures.every(f => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short));
    const anyLive = fixtures.some(f => ['1H', '2H', 'HT', 'ET', 'P', 'BT'].includes(f.fixture.status.short));
    const matchDayStatus = allFinished ? 'finished' : anyLive ? 'active' : 'upcoming';

    for (const fix of fixtures) {
      const matchData = mapApiFixtureToMatch(fix);

      const { error } = await supabase.rpc('sync_match', {
        p_tournament_id: tournamentId,
        p_day_number: dayNumber,
        p_label: roundName,
        p_deadline: fixtures[0].fixture.date,
        p_status: matchDayStatus,
        p_home_team: matchData.home_team,
        p_away_team: matchData.away_team,
        p_home_logo: matchData.home_logo,
        p_away_logo: matchData.away_logo,
        p_home_score: matchData.home_score,
        p_away_score: matchData.away_score,
        p_match_status: matchData.status,
        p_kick_off: matchData.kick_off
      });

      if (error) {
        console.error(`Sync error ${matchData.home_team} vs ${matchData.away_team}:`, error.message);
      } else {
        synced++;
      }
    }
  }

  return synced;
}

/**
 * PHASE 2: Update results for finished/live matches using dedicated RPC.
 */
async function updateResults(supabase, tournamentId, apiFixtures, results) {
  let updated = 0;

  // Get match_days via SECURITY DEFINER function
  const { data: matchDays } = await supabase.rpc('get_tournament_match_days', {
    p_tournament_id: tournamentId
  });

  if (!matchDays || matchDays.length === 0) return 0;

  // Build lookup by label
  const mdByLabel = {};
  matchDays.forEach(md => { mdByLabel[md.label] = md; });

  // Update finished/live matches
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
      updated++;
    }
  }

  return updated;
}

/**
 * PHASE 3: Update match_day statuses based on their match statuses.
 */
async function updateMatchDayStatuses(supabase, tournamentId) {
  const { data: matchDays } = await supabase.rpc('get_tournament_match_days', {
    p_tournament_id: tournamentId
  });

  if (!matchDays || matchDays.length === 0) return;

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
}

function getLeagueId(leagueStr) {
  const mapping = { 'mundial': 1, 'world_cup': 1, 'argentina': 128, 'premier': 39, 'champions': 2 };
  return mapping[leagueStr] || 1;
}

function getSeason(leagueStr) {
  if (leagueStr === 'mundial' || leagueStr === 'world_cup') return 2026;
  return new Date().getFullYear();
}
