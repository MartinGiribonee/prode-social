-- ============================================
-- PRODE SOCIAL — Cron Job Support (SECURE)
-- Run this in Supabase SQL Editor
-- ============================================

-- ⚠️ IMPORTANT: Do NOT add public SELECT policies.
-- The cron job uses SECURITY DEFINER functions which bypass RLS.
-- This keeps all data isolated per-tournament for regular users.

-- If you previously ran the old cron_policies.sql with public SELECT policies, DROP them:
DROP POLICY IF EXISTS "Public can read active tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Public can read match_days" ON public.match_days;
DROP POLICY IF EXISTS "Public can read matches" ON public.matches;

-- Function: Get all active tournament IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION get_active_tournaments()
RETURNS TABLE(id UUID, name TEXT, league_id TEXT) AS $$
BEGIN
  RETURN QUERY SELECT t.id, t.name, t.league_id
  FROM public.tournaments t
  WHERE t.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get match_days for a tournament (bypasses RLS)
CREATE OR REPLACE FUNCTION get_tournament_match_days(p_tournament_id UUID)
RETURNS TABLE(id UUID, day_number INTEGER, label TEXT) AS $$
BEGIN
  RETURN QUERY SELECT md.id, md.day_number, md.label
  FROM public.match_days md
  WHERE md.tournament_id = p_tournament_id
  ORDER BY md.day_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get matches for a match_day (bypasses RLS)
CREATE OR REPLACE FUNCTION get_match_day_matches(p_match_day_id UUID)
RETURNS TABLE(status TEXT) AS $$
BEGIN
  RETURN QUERY SELECT m.status
  FROM public.matches m
  WHERE m.match_day_id = p_match_day_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update a match result (bypasses RLS)
CREATE OR REPLACE FUNCTION update_match_result(
  p_match_day_id UUID,
  p_home_team TEXT,
  p_away_team TEXT,
  p_home_score INTEGER,
  p_away_score INTEGER,
  p_status TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.matches
  SET home_score = p_home_score,
      away_score = p_away_score,
      status = p_status
  WHERE match_day_id = p_match_day_id
    AND home_team = p_home_team
    AND away_team = p_away_team;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update match_day status (bypasses RLS)
CREATE OR REPLACE FUNCTION update_match_day_status(
  p_match_day_id UUID,
  p_status TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.match_days
  SET status = p_status
  WHERE id = p_match_day_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
