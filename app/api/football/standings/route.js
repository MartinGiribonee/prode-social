import { NextResponse } from 'next/server';
import { getStandings } from '@/lib/football-api';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const leagueId = parseInt(searchParams.get('leagueId') || '1');
  const season = parseInt(searchParams.get('season') || '2022');

  try {
    const groups = await getStandings(leagueId, season);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
