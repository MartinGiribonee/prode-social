import { NextResponse } from 'next/server';
import { syncTournamentFixtures } from '@/lib/football-sync';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');
  const leagueId = parseInt(searchParams.get('leagueId') || '1'); // Default World Cup (1)
  const season = parseInt(searchParams.get('season') || '2026'); // Default 2026 for World Cup
  
  if (!tournamentId) {
    return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
  }

  // Check if user is admin or authorized (optional, for now just allow for testing)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncTournamentFixtures(tournamentId, leagueId, season);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
