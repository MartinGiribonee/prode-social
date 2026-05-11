import { NextResponse } from 'next/server';
import { getFixtures, mapApiFixtureToMatch } from '@/lib/football-api';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const leagueId = parseInt(searchParams.get('leagueId') || '1'); // Default World Cup (1)
  const season = parseInt(searchParams.get('season') || '2026');
  
  try {
    const apiFixtures = await getFixtures(leagueId, season);
    
    if (!apiFixtures || apiFixtures.length === 0) {
      return NextResponse.json({ error: 'No fixtures found in API' }, { status: 404 });
    }

    // Map and group by round
    const rounds = {};
    apiFixtures.forEach(fix => {
      const match = mapApiFixtureToMatch(fix);
      const roundName = fix.league.round;
      
      if (!rounds[roundName]) {
        rounds[roundName] = {
          id: `md-${roundName}`, // Fake ID
          day_number: parseInt(roundName.match(/\d+/) || 1),
          label: roundName.replace('Regular Season - ', 'Fecha '),
          status: 'active',
          matches: []
        };
      }
      
      rounds[roundName].matches.push({
        ...match,
        id: match.id, // The API fixture ID
      });
    });

    // Convert object to array and sort
    const matchDays = Object.values(rounds).sort((a, b) => a.day_number - b.day_number);

    return NextResponse.json({ matchDays });
  } catch (error) {
    console.error('Test fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
