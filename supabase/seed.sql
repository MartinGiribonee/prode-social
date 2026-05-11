-- ============================================
-- PRODE SOCIAL — Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================

-- Liga Argentina 2026
INSERT INTO public.tournaments (id, name, description, invite_code, league_id, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Prode Liga Argentina 2026',
  'Torneo de la liga profesional argentina',
  'LIGA2026', 'argentina', 'active'
) ON CONFLICT (id) DO NOTHING;

-- Mundial 2026
INSERT INTO public.tournaments (id, name, description, invite_code, league_id, status)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Mundial 2026 - Los Pibes',
  'A ver quién sabe más del mundial',
  'MUNDIAL26', 'mundial', 'active'
) ON CONFLICT (id) DO NOTHING;

-- Match Days Liga Argentina
INSERT INTO public.match_days (id, tournament_id, day_number, label, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1, 'Fecha 1', 'finished'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 2, 'Fecha 2', 'active'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 3, 'Fecha 3', 'upcoming');

-- Fecha 1 (finished)
INSERT INTO public.matches (match_day_id, home_team, away_team, home_logo, away_logo, home_score, away_score, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'River Plate', 'Boca Juniors', '🔴⚪', '🔵🟡', 2, 1, 'finished'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Racing Club', 'Independiente', '🔵⚪', '🔴⚪', 1, 1, 'finished'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'San Lorenzo', 'Huracán', '🔵🔴', '⚪🔴', 1, 1, 'finished'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Talleres', 'Belgrano', '🔵⚪', '🔵⚪', 2, 0, 'finished');

-- Fecha 2 (active)
INSERT INTO public.matches (match_day_id, home_team, away_team, home_logo, away_logo, status) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Boca Juniors', 'Racing Club', '🔵🟡', '🔵⚪', 'scheduled'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Independiente', 'River Plate', '🔴⚪', '🔴⚪', 'scheduled'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Huracán', 'Talleres', '⚪🔴', '🔵⚪', 'scheduled'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Belgrano', 'San Lorenzo', '🔵⚪', '🔵🔴', 'scheduled');

-- Fecha 3 (upcoming)
INSERT INTO public.matches (match_day_id, home_team, away_team, home_logo, away_logo, status) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'River Plate', 'Racing Club', '🔴⚪', '🔵⚪', 'scheduled'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Boca Juniors', 'San Lorenzo', '🔵🟡', '🔵🔴', 'scheduled'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Independiente', 'Talleres', '🔴⚪', '🔵⚪', 'scheduled'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Belgrano', 'Huracán', '🔵⚪', '⚪🔴', 'scheduled');
