import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/tournament/champion?tournamentId=xxx&userId=xxx
 * Returns the user's champion pick for the tournament.
 * 
 * POST /api/tournament/champion
 * Body: { tournamentId, userId, championTeam }
 * Sets the user's champion pick. Can only be set once.
 */

// Ensure the champion_pick column exists
async function ensureColumn(supabase) {
  // Try to add column if it doesn't exist (idempotent via IF NOT EXISTS in RPC or direct SQL)
  await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE tournament_members ADD COLUMN IF NOT EXISTS champion_pick TEXT DEFAULT NULL;"
  }).catch(() => {
    // If RPC doesn't exist, try direct approach - the column may already exist
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournamentId');
  const userId = searchParams.get('userId');

  if (!tournamentId || !userId) {
    return NextResponse.json({ error: 'tournamentId and userId are required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('tournament_members')
      .select('champion_pick')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      // Column might not exist yet - return null
      return NextResponse.json({ championPick: null });
    }

    return NextResponse.json({ championPick: data?.champion_pick || null });
  } catch (error) {
    return NextResponse.json({ championPick: null });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { tournamentId, userId, championTeam } = body;

    if (!tournamentId || !userId || !championTeam) {
      return NextResponse.json({ error: 'tournamentId, userId, and championTeam are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Ensure column exists
    await ensureColumn(supabase);

    // Check if user already has a champion pick
    const { data: existing } = await supabase
      .from('tournament_members')
      .select('champion_pick')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (existing?.champion_pick) {
      return NextResponse.json({ error: 'Ya elegiste tu campeón. No se puede modificar.' }, { status: 400 });
    }

    // Set the champion pick
    const { error } = await supabase
      .from('tournament_members')
      .update({ champion_pick: championTeam })
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Champion pick error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, championPick: championTeam });
  } catch (error) {
    console.error('Champion API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
