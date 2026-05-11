-- ============================================
-- FIX RLS Policies — Run in Supabase SQL Editor
-- ============================================

-- Fix tournament_members: allow authenticated users to insert and read
DROP POLICY IF EXISTS "Members can view tournament members" ON public.tournament_members;
DROP POLICY IF EXISTS "Users can join tournaments" ON public.tournament_members;

CREATE POLICY "Anyone authenticated can view members"
  ON public.tournament_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join tournaments"
  ON public.tournament_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON public.tournament_members FOR UPDATE
  USING (auth.uid() = user_id);

-- Fix match_days: allow all authenticated users to read
DROP POLICY IF EXISTS "Match days visible to tournament members" ON public.match_days;
CREATE POLICY "Match days visible to authenticated"
  ON public.match_days FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fix matches: allow all authenticated users to read
DROP POLICY IF EXISTS "Matches visible to tournament members" ON public.matches;
CREATE POLICY "Matches visible to authenticated"
  ON public.matches FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fix messages: allow all authenticated to read and members to insert
DROP POLICY IF EXISTS "Messages visible to tournament members" ON public.messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.messages;

CREATE POLICY "Messages visible to authenticated"
  ON public.messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fix predictions: allow all authenticated to read
DROP POLICY IF EXISTS "Users can view predictions in their tournaments" ON public.predictions;
CREATE POLICY "Predictions visible to authenticated"
  ON public.predictions FOR SELECT
  USING (auth.uid() IS NOT NULL);
