-- ============================================
-- PRODE SOCIAL — Admin Policies for Sync
-- Run this in Supabase SQL Editor
-- ============================================

-- Match Days Admin Policy
CREATE POLICY "Tournament admins can insert match_days" ON public.match_days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Tournament admins can update match_days" ON public.match_days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()
    )
  );

-- Matches Admin Policy
CREATE POLICY "Tournament admins can insert matches" ON public.matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.match_days md
      JOIN public.tournaments t ON t.id = md.tournament_id
      WHERE md.id = match_day_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Tournament admins can update matches" ON public.matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.match_days md
      JOIN public.tournaments t ON t.id = md.tournament_id
      WHERE md.id = match_day_id AND t.created_by = auth.uid()
    )
  );
