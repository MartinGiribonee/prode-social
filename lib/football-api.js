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
/**
 * Helper to fetch fixtures from worldcup26.ir (Free API)
 */
async function getWorldCup2026Fixtures() {
  try {
    // 1. Fetch all teams to map IDs to flags/names
    const teamsResponse = await fetch('https://worldcup26.ir/get/teams', { next: { revalidate: 3600 } });
    const teamsData = await teamsResponse.json();
    const teamMap = {};
    if (teamsData && teamsData.teams) {
      teamsData.teams.forEach(t => {
        teamMap[t.id] = t;
      });
    }

    // 2. Fetch all games
    const gamesResponse = await fetch('https://worldcup26.ir/get/games', { next: { revalidate: 900 } }); // revalidate 15 mins
    const gamesData = await gamesResponse.json();
    if (!gamesData || !gamesData.games) return [];

    // Helper to parse date MM/DD/YYYY HH:MM to ISO
    const parseLocalDate = (localDateStr) => {
      if (!localDateStr) return new Date().toISOString();
      try {
        const [datePart, timePart] = localDateStr.split(' ');
        const [month, day, year] = datePart.split('/');
        const [hour, minute] = timePart.split(':');
        const date = new Date(Date.UTC(
          parseInt(year, 10),
          parseInt(month, 10) - 1,
          parseInt(day, 10),
          parseInt(hour, 10),
          parseInt(minute, 10)
        ));
        return date.toISOString();
      } catch (e) {
        console.error('Error parsing local_date:', localDateStr, e);
        return new Date().toISOString();
      }
    };

    // 3. Map to API-Football format
    return gamesData.games.map(game => {
      const homeTeam = teamMap[game.home_team_id] || {};
      const awayTeam = teamMap[game.away_team_id] || {};

      const finished = game.finished === 'TRUE' || game.finished === true;
      const started = game.time_elapsed && game.time_elapsed !== 'notstarted';

      let shortStatus = 'NS';
      if (finished) {
        shortStatus = 'FT';
      } else if (started) {
        shortStatus = '1H';
      }

      // Map matchdays and knockout rounds to sequential label & number
      let roundName = `Group Stage - ${game.matchday}`;
      if (game.type !== 'group') {
        const type = game.type.toLowerCase();
        if (type.includes('32')) roundName = 'Round of 32 - 4';
        else if (type.includes('16')) roundName = 'Round of 16 - 5';
        else if (type.includes('quarter') || type.includes('qf')) roundName = 'Quarter-finals - 6';
        else if (type.includes('semi') || type.includes('sf')) roundName = 'Semi-finals - 7';
        else if (type.includes('final')) roundName = 'Final - 9';
        else roundName = game.type.charAt(0).toUpperCase() + game.type.slice(1);
      }

      return {
        fixture: {
          id: parseInt(game.id) || game.id,
          status: {
            short: shortStatus
          },
          date: parseLocalDate(game.local_date)
        },
        teams: {
          home: {
            name: game.home_team_name_en || homeTeam.name_en || 'Home Team',
            logo: homeTeam.flag || '⚽'
          },
          away: {
            name: game.away_team_name_en || awayTeam.name_en || 'Away Team',
            logo: awayTeam.flag || '⚽'
          }
        },
        goals: {
          home: finished || started ? parseInt(game.home_score) : null,
          away: finished || started ? parseInt(game.away_score) : null
        },
        league: {
          name: 'FIFA World Cup',
          round: roundName
        }
      };
    });
  } catch (error) {
    console.error('Error fetching World Cup 2026 fixtures:', error);
    return [];
  }
}

/**
 * Helper to fetch standings from worldcup26.ir (Free API)
 */
async function getWorldCup2026Standings() {
  try {
    // 1. Fetch all teams to map IDs to flags/names
    const teamsResponse = await fetch('https://worldcup26.ir/get/teams', { next: { revalidate: 3600 } });
    const teamsData = await teamsResponse.json();
    const teamMap = {};
    if (teamsData && teamsData.teams) {
      teamsData.teams.forEach(t => {
        teamMap[t.id] = t;
      });
    }

    // 2. Fetch groups
    const groupsResponse = await fetch('https://worldcup26.ir/get/groups', { next: { revalidate: 3600 } });
    const groupsData = await groupsResponse.json();
    if (!groupsData || !groupsData.groups) return [];

    // 3. Map to standard standings structure
    return groupsData.groups.map((group, i) => {
      // Sort teams in the group by pts descending, then gd descending, then gf descending
      const sortedTeams = [...group.teams].sort((a, b) => {
        const ptsDiff = (parseInt(b.pts, 10) || 0) - (parseInt(a.pts, 10) || 0);
        if (ptsDiff !== 0) return ptsDiff;
        const gdDiff = (parseInt(b.gd, 10) || 0) - (parseInt(a.gd, 10) || 0);
        if (gdDiff !== 0) return gdDiff;
        return (parseInt(b.gf, 10) || 0) - (parseInt(a.gf, 10) || 0);
      });

      return {
        groupName: `Grupo ${group.name}`,
        teams: sortedTeams.map((team, idx) => {
          const teamMeta = teamMap[team.team_id] || {};
          return {
            rank: idx + 1,
            name: teamMeta.name_en || `Team ${team.team_id}`,
            logo: teamMeta.flag || '⚽',
            points: parseInt(team.pts, 10) || 0,
            played: parseInt(team.mp, 10) || 0,
            won: parseInt(team.w, 10) || 0,
            drawn: parseInt(team.d, 10) || 0,
            lost: parseInt(team.l, 10) || 0,
            goalsFor: parseInt(team.gf, 10) || 0,
            goalsAgainst: parseInt(team.ga, 10) || 0,
            goalDiff: parseInt(team.gd, 10) || 0,
            form: '', // Not provided by this API
          };
        })
      };
    });
  } catch (error) {
    console.error('Error fetching World Cup 2026 standings:', error);
    return [];
  }
}

/**
 * Fetch matches for a specific league and season
 * @param {number} leagueId - The ID of the league (e.g., 128 for Argentina, 1 for World Cup)
 * @param {number} season - The season year (e.g., 2026)
 * @param {Object} options - Additional query params (e.g., round, date, from, to)
 */
export async function getFixtures(leagueId, season = 2026, options = {}) {
  // Redirect to worldcup26.ir if this is World Cup 2026
  if (leagueId === 1 || leagueId === '1') {
    return getWorldCup2026Fixtures();
  }

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
export async function getStandings(leagueId, season = 2026) {
  // Redirect to worldcup26.ir if this is World Cup 2026
  if (leagueId === 1 || leagueId === '1') {
    return getWorldCup2026Standings();
  }

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
