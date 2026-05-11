-- ============================================
-- PRODE SOCIAL — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  is_ai_agent BOOLEAN DEFAULT FALSE,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Tournaments
CREATE TABLE public.tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES public.profiles(id),
  league_id TEXT DEFAULT 'argentina',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournaments viewable by all authenticated" ON public.tournaments
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 3. Tournament Members
CREATE TABLE public.tournament_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE public.tournament_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view tournament members" ON public.tournament_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournament_members tm WHERE tm.tournament_id = tournament_id AND tm.user_id = auth.uid())
  );
CREATE POLICY "Users can join tournaments" ON public.tournament_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Match Days
CREATE TABLE public.match_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  label TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.match_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match days visible to tournament members" ON public.match_days
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournament_members WHERE tournament_id = match_days.tournament_id AND user_id = auth.uid())
  );

-- 5. Matches
CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_day_id UUID REFERENCES public.match_days(id) ON DELETE CASCADE NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_logo TEXT DEFAULT '⚽',
  away_logo TEXT DEFAULT '⚽',
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  kick_off TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matches visible to tournament members" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_days md
      JOIN public.tournament_members tm ON tm.tournament_id = md.tournament_id
      WHERE md.id = matches.match_day_id AND tm.user_id = auth.uid()
    )
  );

-- 6. Predictions
CREATE TABLE public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  home_prediction INTEGER NOT NULL DEFAULT 0,
  away_prediction INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view predictions in their tournaments" ON public.predictions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournament_members WHERE tournament_id = predictions.tournament_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert own predictions" ON public.predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON public.predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Messages
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'prediction_card', 'match_result', 'standings_update',
    'ai_comment', 'ai_summary', 'system', 'badge_earned'
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages visible to tournament members" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournament_members WHERE tournament_id = messages.tournament_id AND user_id = auth.uid())
  );
CREATE POLICY "Members can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tournament_members WHERE tournament_id = messages.tournament_id AND user_id = auth.uid())
  );

CREATE INDEX idx_messages_tournament_created ON public.messages(tournament_id, created_at DESC);
CREATE INDEX idx_messages_user ON public.messages(user_id);

-- 8. Badges
CREATE TABLE public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  criteria JSONB DEFAULT '{}'
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (true);

-- 9. User Badges
CREATE TABLE public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can award badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. User Streaks
CREATE TABLE public.user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_activity_date DATE
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Streaks viewable by everyone" ON public.user_streaks FOR SELECT USING (true);
CREATE POLICY "Users can manage own streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- 11. User Activities
CREATE TABLE public.user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON public.user_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can log own activities" ON public.user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_activities_user_date ON public.user_activities(user_id, created_at DESC);

-- ============================================
-- Seed Data: Badges
-- ============================================
INSERT INTO public.badges (name, description, icon, category, criteria) VALUES
  ('En Racha', '3 días consecutivos activo', '🔥', 'streak', '{"type": "streak", "count": 3}'),
  ('Imparable', '7 días consecutivos activo', '🏆', 'streak', '{"type": "streak", "count": 7}'),
  ('Legendario', '30 días consecutivos activo', '⚡', 'streak', '{"type": "streak", "count": 30}'),
  ('Francotirador', '5 aciertos exactos', '🎯', 'prediction', '{"type": "exact_predictions", "count": 5}'),
  ('Primer Pronóstico', 'Enviaste tu primer pronóstico', '🏅', 'milestone', '{"type": "first_prediction"}'),
  ('Charlatán', '100 mensajes enviados', '💬', 'social', '{"type": "messages_sent", "count": 100}'),
  ('Domador de IA', 'Le ganaste al bot en una fecha', '🤖', 'achievement', '{"type": "beat_ai"}'),
  ('Líder', 'Estuviste 1° en la tabla', '👑', 'achievement', '{"type": "first_place"}');

-- Enable realtime for messages (safe wrapper)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication setup skipped: %', SQLERRM;
END;
$$;
