-- Run this in the Supabase SQL Editor to support the Champion Pick feature

-- 1. Add champion_pick column to tournament_members table if it doesn't exist
ALTER TABLE public.tournament_members 
ADD COLUMN IF NOT EXISTS champion_pick TEXT DEFAULT NULL;

-- 2. Optional: Create exec_sql helper function if you want to allow dynamic schema modifications via admin client
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
