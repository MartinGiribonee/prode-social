/**
 * Client for API-FOOTBALL (api-sports.io)
 * Documentation: https://www.api-football.com/documentation-v3
 */

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_HOST = 'v3.football.api-sports.io'; // Change if using RapidAPI
const BASE_URL = `https://${API_HOST}`;

/**
 * Fetch matches for a specific league and season
 * @param {number} leagueId - The ID of the league (e.g., 128 for Argentina, 1 for World Cup)
 * @param {number} season - The season year (e.g., 2026)
 * @param {Object} options - Additional query params (e.g., round, date, from, to)
 */
export async function getFixtures(leagueId, season = 2026, options = {}) {
  if (!API_KEY || API_KEY === 'your_api_football_key_here') {
    console.warn('API_FOOTBALL_KEY is not configured. Returning empty results.');
    return [];
  }

  const queryParams = new URLSearchParams({
    league: leagueId,
    season: season,
    ...options
  });

  try {
    const response = await fetch(`${BASE_URL}/fixtures?${queryParams}`, {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY, // Set both just in case
      },
      next: { revalidate: 3600 } // Cache for 1 hour by default
    });

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('API-Football errors:', data.errors);
      return [];
    }

    return data.response || [];
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return [];
  }
}

/**
 * Maps API-Football fixture response to the internal app match format
 */
export function mapApiFixtureToMatch(apiFixture) {
  return {
    id: apiFixture.fixture.id.toString(),
    home_team: apiFixture.teams.home.name,
    away_team: apiFixture.teams.away.name,
    home_logo: apiFixture.teams.home.logo,
    away_logo: apiFixture.teams.away.logo,
    home_score: apiFixture.goals.home,
    away_score: apiFixture.goals.away,
    status: mapApiStatus(apiFixture.fixture.status.short),
    kick_off: apiFixture.fixture.date,
    league_name: apiFixture.league.name,
    round: apiFixture.league.round
  };
}

/**
 * Normalizes status codes
 * NS: Not Started -> scheduled
 * FT: Finished -> finished
 * 1H, 2H, HT, ET, P: Live -> live
 */
function mapApiStatus(shortStatus) {
  const finished = ['FT', 'AET', 'PEN'];
  const live = ['1H', '2H', 'HT', 'ET', 'P', 'BT'];
  
  if (finished.includes(shortStatus)) return 'finished';
  if (live.includes(shortStatus)) return 'live';
  return 'scheduled';
}

/**
 * Fetch league standings (group tables) for a specific league and season
 * @param {number} leagueId - The league ID
 * @param {number} season - The season year
 */
export async function getStandings(leagueId, season = 2022) {
  if (!API_KEY || API_KEY === 'your_api_football_key_here') {
    console.warn('API_FOOTBALL_KEY is not configured.');
    return [];
  }

  const queryParams = new URLSearchParams({ league: leagueId, season: season });

  try {
    const response = await fetch(`${BASE_URL}/standings?${queryParams}`, {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY,
      },
      next: { revalidate: 3600 }
    });

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('API-Football standings errors:', data.errors);
      return [];
    }

    // data.response[0].league.standings is an array of groups
    // Each group is an array of team standings
    const league = data.response?.[0]?.league;
    if (!league) return [];

    return league.standings.map((group, i) => ({
      groupName: group[0]?.group || `Grupo ${String.fromCharCode(65 + i)}`,
      teams: group.map(team => ({
        rank: team.rank,
        name: team.team.name,
        logo: team.team.logo,
        points: team.points,
        played: team.all.played,
        won: team.all.win,
        drawn: team.all.draw,
        lost: team.all.lose,
        goalsFor: team.all.goals.for,
        goalsAgainst: team.all.goals.against,
        goalDiff: team.goalsDiff,
        form: team.form, // e.g. "WWDLW"
      }))
    }));
  } catch (error) {
    console.error('Error fetching standings:', error);
    return [];
  }
}

/**
 * Constants for convenience
 */
export const LEAGUE_IDS = {
  ARGENTINA_LFP: 128,
  WORLD_CUP_2026: 1,
  PREMIER_LEAGUE: 39,
  CHAMPIONS_LEAGUE: 2
};
