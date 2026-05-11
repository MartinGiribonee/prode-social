import { getFixtures, mapApiFixtureToMatch } from './football-api';
import { createClient } from './supabase/server';

/**
 * Syncs fixtures from API-Football to a specific tournament in Supabase
 * Uses the sync_match RPC function (SECURITY DEFINER) to bypass RLS
 * @param {string} tournamentId - The UUID of the tournament in Supabase
 * @param {number} leagueId - API-Football league ID
 * @param {number} season - Season year
 */
export async function syncTournamentFixtures(tournamentId, leagueId, season = 2022) {
  const supabase = await createClient();
  
  // 1. Fetch data from API
  const apiFixtures = await getFixtures(leagueId, season);
  if (!apiFixtures || apiFixtures.length === 0) {
    return { success: false, message: 'No fixtures found in API', matchDaysCreated: 0, matchesSynced: 0 };
  }

  // 2. Group by round (Match Day)
  const rounds = {};
  apiFixtures.forEach(fix => {
    const roundName = fix.league.round;
    if (!rounds[roundName]) rounds[roundName] = [];
    rounds[roundName].push(fix);
  });

  let matchDaysCreated = 0;
  let matchesSynced = 0;
  let errors = [];

  // 3. Process each round
  const roundEntries = Object.entries(rounds);
  let dayCounter = 0;

  for (const [roundName, fixtures] of roundEntries) {
    dayCounter++;
    // Extract day number (e.g., "Regular Season - 1" -> 1, "Group A - 1" -> 1)
    const dayMatch = roundName.match(/\d+/);
    const dayNumber = dayMatch ? parseInt(dayMatch[0]) : dayCounter;
    
    // Determine status based on match statuses
    const allFinished = fixtures.every(f => ['FT', 'AET', 'PEN'].includes(f.fixture.status.short));
    const anyLive = fixtures.some(f => ['1H', '2H', 'HT', 'ET', 'P', 'BT'].includes(f.fixture.status.short));
    const matchDayStatus = allFinished ? 'finished' : anyLive ? 'active' : 'upcoming';

    // 4. Sync each match using the RPC function
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
        console.error(`Error syncing match ${matchData.home_team} vs ${matchData.away_team}:`, error);
        errors.push(`${matchData.home_team} vs ${matchData.away_team}: ${error.message}`);
      } else {
        matchesSynced++;
      }
    }

    if (matchesSynced > 0) matchDaysCreated++;
  }

  return { 
    success: matchesSynced > 0, 
    matchDaysCreated: roundEntries.length,
    matchesSynced,
    errors: errors.length > 0 ? errors.slice(0, 5) : undefined
  };
}
