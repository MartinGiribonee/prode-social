import { NextResponse } from 'next/server';
import { syncTournamentFixtures } from '@/lib/football-sync';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');
  const leagueId = parseInt(searchParams.get('leagueId') || '1');
  const season = parseInt(searchParams.get('season') || '2026');
  
  if (!tournamentId) {
    return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
  }

  try {
    const result = await syncTournamentFixtures(tournamentId, leagueId, season);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
