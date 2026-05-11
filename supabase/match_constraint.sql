-- ============================================
-- PRODE SOCIAL — Fix Matches Unique Constraint
-- Run this in Supabase SQL Editor
-- ============================================

-- Add a unique constraint to the matches table so upsert works correctly
ALTER TABLE public.matches
ADD CONSTRAINT matches_unique_fixture UNIQUE (match_day_id, home_team, away_team);
