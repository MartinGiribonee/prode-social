import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * DELETE /api/tournament/delete
 * Body: { tournamentId, userId }
 * Only the creator can delete a tournament.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { tournamentId, userId } = body;

    if (!tournamentId || !userId) {
      return NextResponse.json({ error: 'tournamentId and userId are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify the user is the creator
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('created_by, name')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }

    if (tournament.created_by !== userId) {
      return NextResponse.json({ error: 'Solo el creador puede eliminar el torneo' }, { status: 403 });
    }

    // Delete in order: predictions → messages → matches → match_days → tournament_members → tournament
    await supabase.from('predictions').delete().eq('tournament_id', tournamentId);
    await supabase.from('messages').delete().eq('tournament_id', tournamentId);

    // Get match_day IDs to delete matches
    const { data: matchDays } = await supabase
      .from('match_days')
      .select('id')
      .eq('tournament_id', tournamentId);

    if (matchDays && matchDays.length > 0) {
      const mdIds = matchDays.map(md => md.id);
      await supabase.from('matches').delete().in('match_day_id', mdIds);
    }

    await supabase.from('match_days').delete().eq('tournament_id', tournamentId);
    await supabase.from('tournament_members').delete().eq('tournament_id', tournamentId);
    
    const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);

    if (error) {
      console.error('Delete tournament error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Torneo "${tournament.name}" eliminado correctamente` });
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
