// Mock data for Argentine League and World Cup 2026
// Used when Supabase is not configured yet

export const MOCK_TEAMS = {
  argentina: [
    { name: 'River Plate', logo: '🔴⚪' },
    { name: 'Boca Juniors', logo: '🔵🟡' },
    { name: 'Racing Club', logo: '🔵⚪' },
    { name: 'Independiente', logo: '🔴' },
    { name: 'San Lorenzo', logo: '🔵🔴' },
    { name: 'Huracán', logo: '⚪🔴' },
    { name: 'Vélez Sarsfield', logo: '⚪🔵' },
    { name: 'Estudiantes', logo: '🔴⚪' },
    { name: 'Talleres', logo: '🔵⚪' },
    { name: 'Belgrano', logo: '🔵' },
    { name: 'Godoy Cruz', logo: '⚪🔴' },
    { name: 'Rosario Central', logo: '🔵🟡' },
    { name: "Newell's", logo: '🔴⚫' },
    { name: 'Defensa y Justicia', logo: '🟢🟡' },
    { name: 'Argentinos Jrs', logo: '🔴' },
    { name: 'Lanús', logo: '🟤🔴' },
  ],
  mundial: [
    { name: 'Argentina', logo: '🇦🇷' },
    { name: 'Brasil', logo: '🇧🇷' },
    { name: 'Francia', logo: '🇫🇷' },
    { name: 'Alemania', logo: '🇩🇪' },
    { name: 'España', logo: '🇪🇸' },
    { name: 'Inglaterra', logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Portugal', logo: '🇵🇹' },
    { name: 'Países Bajos', logo: '🇳🇱' },
    { name: 'Italia', logo: '🇮🇹' },
    { name: 'Uruguay', logo: '🇺🇾' },
    { name: 'Colombia', logo: '🇨🇴' },
    { name: 'México', logo: '🇲🇽' },
    { name: 'Estados Unidos', logo: '🇺🇸' },
    { name: 'Canadá', logo: '🇨🇦' },
    { name: 'Japón', logo: '🇯🇵' },
    { name: 'Corea del Sur', logo: '🇰🇷' },
  ],
};

export const MOCK_MATCH_DAYS = [
  {
    id: 'md-1',
    day_number: 1,
    label: 'Fecha 1',
    status: 'finished',
    deadline: '2026-04-25T18:00:00Z',
    matches: [
      { id: 'm-1', home_team: 'River Plate', away_team: 'Boca Juniors', home_logo: '🔴⚪', away_logo: '🔵🟡', home_score: 2, away_score: 1, status: 'finished', kick_off: '2026-04-25T20:00:00Z' },
      { id: 'm-2', home_team: 'Racing Club', away_team: 'Independiente', home_logo: '🔵⚪', away_logo: '🔴', home_score: 0, away_score: 0, status: 'finished', kick_off: '2026-04-25T18:00:00Z' },
      { id: 'm-3', home_team: 'San Lorenzo', away_team: 'Huracán', home_logo: '🔵🔴', away_logo: '⚪🔴', home_score: 1, away_score: 3, status: 'finished', kick_off: '2026-04-25T16:00:00Z' },
      { id: 'm-4', home_team: 'Talleres', away_team: 'Belgrano', home_logo: '🔵⚪', away_logo: '🔵', home_score: 2, away_score: 2, status: 'finished', kick_off: '2026-04-25T20:00:00Z' },
    ],
  },
  {
    id: 'md-2',
    day_number: 2,
    label: 'Fecha 2',
    status: 'active',
    deadline: '2026-05-02T18:00:00Z',
    matches: [
      { id: 'm-5', home_team: 'Boca Juniors', away_team: 'Racing Club', home_logo: '🔵🟡', away_logo: '🔵⚪', home_score: null, away_score: null, status: 'scheduled', kick_off: '2026-05-02T20:00:00Z' },
      { id: 'm-6', home_team: 'Independiente', away_team: 'River Plate', home_logo: '🔴', away_logo: '🔴⚪', home_score: null, away_score: null, status: 'scheduled', kick_off: '2026-05-02T18:00:00Z' },
      { id: 'm-7', home_team: 'Huracán', away_team: 'Talleres', home_logo: '⚪🔴', away_logo: '🔵⚪', home_score: null, away_score: null, status: 'scheduled', kick_off: '2026-05-02T16:00:00Z' },
      { id: 'm-8', home_team: 'Belgrano', away_team: 'San Lorenzo', home_logo: '🔵', away_logo: '🔵🔴', home_score: null, away_score: null, status: 'scheduled', kick_off: '2026-05-02T20:00:00Z' },
    ],
  },
];

export const MOCK_USERS = [
  { id: 'user-1', username: 'martin_10', display_name: 'Martín', avatar_url: '', is_ai_agent: false, total_points: 7 },
  { id: 'user-2', username: 'lucia_gol', display_name: 'Lucía', avatar_url: '', is_ai_agent: false, total_points: 5 },
  { id: 'user-3', username: 'carlos_dt', display_name: 'Carlos', avatar_url: '', is_ai_agent: false, total_points: 4 },
  { id: 'user-ai', username: 'prodebot', display_name: 'ProdeBot 🤖', avatar_url: '', is_ai_agent: true, total_points: 6 },
];

export const MOCK_MESSAGES = [
  { id: 'msg-1', user_id: 'user-1', content: '¡Arrancamos la liga! River no puede perder el superclásico 💪', message_type: 'text', created_at: '2026-04-25T15:00:00Z' },
  { id: 'msg-2', user_id: 'user-2', content: 'Boca va a ganar, ya van a ver 😤', message_type: 'text', created_at: '2026-04-25T15:05:00Z' },
  { id: 'msg-3', user_id: 'user-ai', content: 'Analizando los últimos 10 enfrentamientos: River ganó 5, Boca 3, empates 2. El historial favorece al Millonario, pero en la Bombonera la historia cambia... Mi predicción: Boca 1-1 River ⚽', message_type: 'ai_comment', created_at: '2026-04-25T15:10:00Z' },
  { id: 'msg-4', user_id: 'user-1', content: '', message_type: 'prediction_card', metadata: { predictions: [{ match_id: 'm-1', home: 2, away: 1 }, { match_id: 'm-2', home: 1, away: 0 }, { match_id: 'm-3', home: 2, away: 1 }, { match_id: 'm-4', home: 1, away: 1 }] }, created_at: '2026-04-25T17:00:00Z' },
  { id: 'msg-5', user_id: 'user-3', content: 'Tarde pero seguro, ahí van mis pronósticos', message_type: 'text', created_at: '2026-04-25T17:30:00Z' },
  { id: 'msg-6', user_id: 'user-3', content: '', message_type: 'prediction_card', metadata: { predictions: [{ match_id: 'm-1', home: 1, away: 2 }, { match_id: 'm-2', home: 0, away: 1 }, { match_id: 'm-3', home: 1, away: 1 }, { match_id: 'm-4', home: 2, away: 0 }] }, created_at: '2026-04-25T17:31:00Z' },
  { id: 'msg-7', user_id: 'user-ai', content: '📊 **Resumen Fecha 1**: ¡Partidazos! River se llevó el Superclásico 2-1, Huracán goleó a San Lorenzo de visitante y el clásico cordobés terminó en empate. Racing e Independiente no se sacaron ventaja. Martín acertó el resultado exacto de River-Boca y suma 3 puntos. ¡Arrancó líder! 🏆', message_type: 'ai_summary', created_at: '2026-04-25T23:00:00Z' },
  { id: 'msg-8', user_id: 'user-2', content: '¡No puedo creer que River ganó! 😭 Bueno, la próxima será', message_type: 'text', created_at: '2026-04-25T23:10:00Z' },
  { id: 'msg-9', user_id: 'user-1', content: '¡VAMOS! Exacto en el superclásico 🎯🎯🎯', message_type: 'text', created_at: '2026-04-25T23:15:00Z' },
  { id: 'msg-sys', user_id: 'user-1', content: '🏅 ¡Martín ganó la insignia "Primer Pronóstico"!', message_type: 'badge_earned', metadata: { badge: 'Primer Pronóstico', icon: '🏅' }, created_at: '2026-04-25T23:16:00Z' },
];

export const MOCK_STANDINGS = [
  { user_id: 'user-1', username: 'martin_10', display_name: 'Martín', points: 7, exact: 1, partial: 4, rank: 1 },
  { user_id: 'user-ai', username: 'prodebot', display_name: 'ProdeBot 🤖', points: 6, exact: 1, partial: 3, rank: 2 },
  { user_id: 'user-2', username: 'lucia_gol', display_name: 'Lucía', points: 5, exact: 0, partial: 5, rank: 3 },
  { user_id: 'user-3', username: 'carlos_dt', display_name: 'Carlos', points: 4, exact: 0, partial: 4, rank: 4 },
];

export const MOCK_TOURNAMENTS = [
  { id: 'tour-1', name: 'Prode Liga Argentina 2026', description: 'Torneo de la liga profesional argentina', invite_code: 'ARG2026X', league_id: 'argentina', status: 'active', member_count: 4 },
  { id: 'tour-2', name: 'Mundial 2026 - Los Pibes', description: 'A ver quién sabe más del mundial', invite_code: 'MUN26PIB', league_id: 'mundial', status: 'active', member_count: 4 },
];
