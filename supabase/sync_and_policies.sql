-- ============================================
-- PRODE SOCIAL — Sync Function + Policies Fix
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- 1. Add unique constraint for matches (needed for upsert)
-- If this errors with "already exists", that's fine — just continue.
DO $$ BEGIN
  ALTER TABLE public.matches
    ADD CONSTRAINT matches_unique_fixture UNIQUE (match_day_id, home_team, away_team);
EXCEPTION WHEN duplicate_table THEN
  RAISE NOTICE 'Constraint already exists, skipping.';
END $$;

-- 2. Add INSERT policy for match_days (if missing)
DO $$ BEGIN
  CREATE POLICY "Admin insert match_days" ON public.match_days
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.created_by = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy already exists, skipping.';
END $$;

-- 3. Add UPDATE policy for match_days (if missing)
DO $$ BEGIN
  CREATE POLICY "Admin update match_days" ON public.match_days
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.created_by = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy already exists, skipping.';
END $$;

-- 4. Add INSERT policy for matches (if missing)
DO $$ BEGIN
  CREATE POLICY "Admin insert matches" ON public.matches
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.match_days md
        JOIN public.tournaments t ON t.id = md.tournament_id
        WHERE md.id = match_day_id AND t.created_by = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy already exists, skipping.';
END $$;

-- 5. Add UPDATE policy for matches (if missing)
DO $$ BEGIN
  CREATE POLICY "Admin update matches" ON public.matches
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.match_days md
        JOIN public.tournaments t ON t.id = md.tournament_id
        WHERE md.id = match_day_id AND t.created_by = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy already exists, skipping.';
END $$;

-- 6. Create a SECURITY DEFINER function for syncing a single match
-- This bypasses RLS so the API can safely insert matches
CREATE OR REPLACE FUNCTION sync_match(
  p_tournament_id UUID,
  p_day_number INTEGER,
  p_label TEXT,
  p_deadline TIMESTAMPTZ,
  p_status TEXT,
  p_home_team TEXT,
  p_away_team TEXT,
  p_home_logo TEXT,
  p_away_logo TEXT,
  p_home_score INTEGER,
  p_away_score INTEGER,
  p_match_status TEXT,
  p_kick_off TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
  v_match_day_id UUID;
BEGIN
  -- Find or create match_day
  SELECT id INTO v_match_day_id
  FROM public.match_days
  WHERE tournament_id = p_tournament_id AND day_number = p_day_number;

  IF v_match_day_id IS NULL THEN
    INSERT INTO public.match_days (tournament_id, day_number, label, status, deadline)
    VALUES (p_tournament_id, p_day_number, p_label, p_status, p_deadline)
    RETURNING id INTO v_match_day_id;
  END IF;

  -- Upsert the match
  INSERT INTO public.matches (match_day_id, home_team, away_team, home_logo, away_logo, home_score, away_score, status, kick_off)
  VALUES (v_match_day_id, p_home_team, p_away_team, p_home_logo, p_away_logo, p_home_score, p_away_score, p_match_status, p_kick_off)
  ON CONFLICT (match_day_id, home_team, away_team)
  DO UPDATE SET
    home_logo = EXCLUDED.home_logo,
    away_logo = EXCLUDED.away_logo,
    home_score = EXCLUDED.home_score,
    away_score = EXCLUDED.away_score,
    status = EXCLUDED.status,
    kick_off = EXCLUDED.kick_off;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
