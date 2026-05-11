'use client';
import { createClient } from './client';

function sb() { return createClient(); }

// ── Tournaments ──
export async function fetchTournaments() {
  const { data, error } = await sb().from('tournaments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchUserMemberships(userId) {
  const { data } = await sb().from('tournament_members').select('tournament_id').eq('user_id', userId);
  return (data || []).map(m => m.tournament_id);
}

export async function joinTournament(tournamentId, userId) {
  const { error } = await sb().from('tournament_members').upsert({ tournament_id: tournamentId, user_id: userId, role: 'member' }, { onConflict: 'tournament_id,user_id' });
  if (error) console.warn('Join error (may already be member):', error.message);
}

export async function joinByInviteCode(code, userId) {
  const { data: t } = await sb().from('tournaments').select('id').eq('invite_code', code.toUpperCase()).single();
  if (!t) throw new Error('Código inválido');
  await joinTournament(t.id, userId);
  return t.id;
}

export async function createTournament(name, description, leagueId, userId) {
  const { data, error } = await sb().from('tournaments').insert({ name, description, league_id: leagueId, created_by: userId }).select().single();
  if (error) throw error;
  await joinTournament(data.id, userId);
  return data;
}

// ── Match Days & Matches ──
export async function fetchMatchDays(tournamentId) {
  const { data } = await sb().from('match_days').select('*, matches(*)').eq('tournament_id', tournamentId).order('day_number');
  return data || [];
}

// ── Messages ──
export async function fetchMessages(tournamentId, limit = 100) {
  const { data } = await sb().from('messages').select('*').eq('tournament_id', tournamentId).order('created_at', { ascending: true }).limit(limit);
  return data || [];
}

export async function sendMessage(tournamentId, userId, content, messageType = 'text', metadata = {}) {
  const { data, error } = await sb().from('messages').insert({ tournament_id: tournamentId, user_id: userId, content, message_type: messageType, metadata }).select().single();
  if (error) throw error;
  return data;
}

export function subscribeToMessages(tournamentId, onInsert) {
  const channel = sb().channel(`messages-${tournamentId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `tournament_id=eq.${tournamentId}` }, payload => onInsert(payload.new)).subscribe();
  return () => { sb().removeChannel(channel); };
}

// ── Predictions ──
export async function submitPredictions(userId, tournamentId, predictions) {
  const rows = predictions.map(p => ({ user_id: userId, match_id: p.match_id, tournament_id: tournamentId, home_prediction: p.home, away_prediction: p.away }));
  const { error } = await sb().from('predictions').upsert(rows, { onConflict: 'user_id,match_id' });
  if (error) throw error;
}

export async function fetchPredictions(tournamentId) {
  const { data } = await sb().from('predictions').select('*').eq('tournament_id', tournamentId);
  return data || [];
}

// ── Standings ──
export async function fetchStandings(tournamentId) {
  const { data } = await sb().from('tournament_members').select('user_id, points, rank').eq('tournament_id', tournamentId).order('points', { ascending: false });
  return data || [];
}

// ── Profile ──
export async function fetchProfile(userId) {
  const { data } = await sb().from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function fetchAllProfiles() {
  const { data } = await sb().from('profiles').select('id, username, display_name, avatar_url, is_ai_agent');
  return data || [];
}

// ── Badges & Streaks ──
export async function fetchUserBadges(userId) {
  const { data } = await sb().from('user_badges').select('*, badges(*)').eq('user_id', userId);
  return data || [];
}

export async function fetchAllBadges() {
  const { data } = await sb().from('badges').select('*');
  return data || [];
}

export async function fetchUserStreak(userId) {
  const { data } = await sb().from('user_streaks').select('*').eq('user_id', userId).maybeSingle();
  return data || { current_streak: 0, best_streak: 0 };
}

export async function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0];
  const existing = await fetchUserStreak(userId);
  if (existing?.last_activity_date === today) return existing;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = existing?.last_activity_date === yesterday ? (existing.current_streak || 0) + 1 : 1;
  const best = Math.max(newStreak, existing?.best_streak || 0);
  const { data } = await sb().from('user_streaks').upsert({ user_id: userId, current_streak: newStreak, best_streak: best, last_activity_date: today }, { onConflict: 'user_id' }).select().single();
  return data;
}
