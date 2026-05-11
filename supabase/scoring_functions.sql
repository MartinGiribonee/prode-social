-- ============================================
-- PRODE SOCIAL — Scoring Engine Functions
-- Run this in Supabase SQL Editor
-- ============================================

-- Function to calculate and update scores for a specific tournament
CREATE OR REPLACE FUNCTION calculate_tournament_scores(tournament_id_param UUID)
RETURNS void AS $$
BEGIN
  -- 1. Update points_earned for all predictions in the tournament
  -- Exact result: 3 points, Correct winner/draw: 1 point, Wrong: 0 points
  UPDATE public.predictions p
  SET points_earned = 
    CASE 
      WHEN p.home_prediction = m.home_score AND p.away_prediction = m.away_score THEN 3
      WHEN sign(p.home_prediction - p.away_prediction) = sign(m.home_score - m.away_score) THEN 1
      ELSE 0
    END
  FROM public.matches m
  WHERE p.match_id = m.id
    AND p.tournament_id = tournament_id_param
    AND m.status = 'finished'
    AND m.home_score IS NOT NULL 
    AND m.away_score IS NOT NULL;

  -- 2. Update total points for each member in the tournament
  UPDATE public.tournament_members tm
  SET points = COALESCE((
    SELECT SUM(p.points_earned)
    FROM public.predictions p
    WHERE p.user_id = tm.user_id AND p.tournament_id = tm.tournament_id
  ), 0)
  WHERE tm.tournament_id = tournament_id_param;

  -- 3. Update the rank of each member
  WITH ranked_members AS (
    SELECT 
      id,
      RANK() OVER (ORDER BY points DESC, joined_at ASC) as new_rank
    FROM public.tournament_members
    WHERE tournament_id = tournament_id_param
  )
  UPDATE public.tournament_members tm
  SET rank = rm.new_rank
  FROM ranked_members rm
  WHERE tm.id = rm.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to calculate and update scores for ALL tournaments at once
-- Very useful for cron jobs
CREATE OR REPLACE FUNCTION calculate_all_scores()
RETURNS void AS $$
DECLARE
  t_record RECORD;
BEGIN
  -- 1. Update points_earned for ALL predictions globally
  UPDATE public.predictions p
  SET points_earned = 
    CASE 
      WHEN p.home_prediction = m.home_score AND p.away_prediction = m.away_score THEN 3
      WHEN sign(p.home_prediction - p.away_prediction) = sign(m.home_score - m.away_score) THEN 1
      ELSE 0
    END
  FROM public.matches m
  WHERE p.match_id = m.id
    AND m.status = 'finished'
    AND m.home_score IS NOT NULL 
    AND m.away_score IS NOT NULL;

  -- 2. Recalculate total points globally
  UPDATE public.tournament_members tm
  SET points = COALESCE((
    SELECT SUM(p.points_earned)
    FROM public.predictions p
    WHERE p.user_id = tm.user_id AND p.tournament_id = tm.tournament_id
  ), 0);

  -- 3. Update ranks per tournament
  FOR t_record IN SELECT id FROM public.tournaments LOOP
    WITH ranked_members AS (
      SELECT 
        id,
        RANK() OVER (ORDER BY points DESC, joined_at ASC) as new_rank
      FROM public.tournament_members
      WHERE tournament_id = t_record.id
    )
    UPDATE public.tournament_members tm
    SET rank = rm.new_rank
    FROM ranked_members rm
    WHERE tm.id = rm.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
