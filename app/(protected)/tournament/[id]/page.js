'use client';
import { useState, useRef, useEffect, use, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchMessages, sendMessage, subscribeToMessages, fetchMatchDays, fetchStandings, fetchAllProfiles, submitPredictions } from '@/lib/supabase/db';
import { motion, AnimatePresence } from 'framer-motion';

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

// ─── MESSAGE BUBBLE ───
function MessageBubble({ msg, isOwn, profiles }) {
  const sender = profiles[msg.user_id] || { display_name: 'Usuario', username: '?' };
  const isAI = msg.message_type === 'ai_comment';
  const isSystem = msg.message_type === 'system' || msg.message_type === 'badge_earned';

  if (isSystem) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="message-row" style={{ justifyContent: 'center' }}>
        <div className="message-bubble system-bubble">{msg.metadata?.icon || '🔔'} {msg.content}</div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`message-row ${isOwn ? 'own' : ''}`}>
      {!isOwn && (
        <div className={`avatar avatar-sm ${isAI ? 'avatar-ai' : ''}`}>
          {isAI ? '🤖' : (sender.display_name?.[0] || '?').toUpperCase()}
        </div>
      )}
      <div className={`message-bubble ${isAI ? 'ai-bubble' : ''}`}>
        <div className="message-sender">
          {isAI && <span className="badge-pill badge-purple" style={{ marginRight: 6 }}>IA</span>}
          {isAI ? 'ProdeBot 🤖' : sender.display_name}
        </div>
        {msg.content && <div className="message-text">{msg.content}</div>}
        {msg.message_type === 'prediction_card' && <PredictionCardInline metadata={msg.metadata} />}
        <div className="message-time">{timeAgo(msg.created_at)}</div>
      </div>
    </motion.div>
  );
}

function PredictionCardInline({ metadata }) {
  const preds = metadata?.predictions || [];
  return (
    <div className="prediction-card-inline">
      <div className="pred-header">📋 Pronósticos enviados</div>
      {preds.map((p, i) => (
        <div className="pred-match-row" key={i}>
          <div className="pred-team">{p.home_team || 'Local'}</div>
          <div className="pred-score">{p.home} <span className="score-separator">-</span> {p.away}</div>
          <div className="pred-team away">{p.away_team || 'Visitante'}</div>
        </div>
      ))}
    </div>
  );
}

function TeamLogo({ logo, name }) {
  if (!logo) return <div className="team-logo">⚽</div>;
  if (logo.startsWith('http')) {
    return (
      <div className="team-logo">
        <img src={logo} alt={name} style={{ width: 40, height: 40, objectFit: 'contain' }} />
      </div>
    );
  }
  return <div className="team-logo">{logo}</div>;
}

// ─── PREDICTIONS COMPONENT ───
function PredictionsTab({ matchDays, onSubmit }) {
  const activeDay = matchDays.find(md => md.status === 'active') || matchDays[0];
  const matches = activeDay?.matches || [];
  const [scores, setScores] = useState(() =>
    Object.fromEntries(matches.map(m => [m.id, { home: 0, away: 0 }]))
  );

  const update = (id, side, delta) => {
    setScores(prev => ({ ...prev, [id]: { ...prev[id], [side]: Math.max(0, (prev[id]?.[side] || 0) + delta) } }));
  };

  const handleSubmit = () => {
    const predictions = matches.map(m => ({
      match_id: m.id, home: scores[m.id]?.home || 0, away: scores[m.id]?.away || 0,
      home_team: m.home_team, away_team: m.away_team,
    }));
    onSubmit(predictions, activeDay);
    alert('Pronósticos guardados y enviados al chat.');
  };

  if (!activeDay) return <div className="text-muted">No hay fechas disponibles.</div>;

  return (
    <div className="tab-content">
      <div className="drawer-title" style={{ marginBottom: 16 }}>📋 {activeDay.label}</div>
      {matches.map(m => (
        <div className="match-card" key={m.id}>
          <div className="match-card-teams">
            <div className="match-card-team"><TeamLogo logo={m.home_logo} name={m.home_team} /><div>{m.home_team}</div></div>
            <div className="match-card-vs">VS</div>
            <div className="match-card-team"><TeamLogo logo={m.away_logo} name={m.away_team} /><div>{m.away_team}</div></div>
          </div>
          <div className="score-selector">
            <button className="score-btn" onClick={() => update(m.id, 'home', -1)}>−</button>
            <div className="score-display">{scores[m.id]?.home || 0}</div>
            <button className="score-btn" onClick={() => update(m.id, 'home', 1)}>+</button>
            <div className="score-separator">-</div>
            <button className="score-btn" onClick={() => update(m.id, 'away', -1)}>−</button>
            <div className="score-display">{scores[m.id]?.away || 0}</div>
            <button className="score-btn" onClick={() => update(m.id, 'away', 1)}>+</button>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary w-full btn-lg" onClick={handleSubmit}>✅ Guardar Pronósticos</button>
      </div>
    </div>
  );
}

// ─── STANDINGS COMPONENT (with sub-tabs) ───
function StandingsTab({ standings, profiles, currentUserId, tournamentId }) {
  const [subTab, setSubTab] = useState('ranking');
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const handleSubTabChange = (tab) => {
    setSubTab(tab);
    if (tab === 'groups' && groups.length === 0) {
      setLoadingGroups(true);
      fetch('/api/football/standings?leagueId=1&season=2026')
        .then(r => r.json())
        .then(data => { if (data.groups) setGroups(data.groups); })
        .catch(e => console.error('Error fetching groups:', e))
        .finally(() => setLoadingGroups(false));
    }
  };

  return (
    <div className="tab-content">
      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        <button
          onClick={() => handleSubTabChange('ranking')}
          style={{
            flex: 1, padding: '10px 16px', fontSize: '0.8rem', fontWeight: 700,
            background: subTab === 'ranking' ? 'var(--accent)' : 'transparent',
            color: subTab === 'ranking' ? '#fff' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          👑 Ranking Amigos
        </button>
        <button
          onClick={() => handleSubTabChange('groups')}
          style={{
            flex: 1, padding: '10px 16px', fontSize: '0.8rem', fontWeight: 700,
            background: subTab === 'groups' ? 'var(--accent)' : 'transparent',
            color: subTab === 'groups' ? '#fff' : 'var(--text-muted)',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          🌍 Fase de Grupos
        </button>
      </div>

      {/* Ranking sub-tab */}
      {subTab === 'ranking' && (
        <>
          {standings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
              <p className="text-muted">Aún no hay datos de posiciones</p>
            </div>
          ) : (
            <table className="standings-table">
              <thead><tr><th>#</th><th>Jugador</th><th>Pts</th></tr></thead>
              <tbody>
                {standings.map((s, i) => {
                  const p = profiles[s.user_id] || { display_name: 'Usuario' };
                  return (
                    <tr key={s.user_id} className={s.user_id === currentUserId ? 'standings-highlight' : ''}>
                      <td><div className={`standings-rank ${i < 3 ? `rank-${i+1}` : ''}`}>{i + 1}</div></td>
                      <td><div className="standings-user"><div className="avatar avatar-sm">{p.display_name?.[0] || '?'}</div><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.display_name}</div></div></td>
                      <td><span className="standings-points">{s.points}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Groups sub-tab */}
      {subTab === 'groups' && (
        <>
          {loadingGroups ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2rem', animation: 'pulse-fire 1.5s ease-in-out infinite' }}>⚽</div>
              <p className="text-muted" style={{ marginTop: 12 }}>Cargando grupos...</p>
            </div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌍</div>
              <p className="text-muted">No se encontraron datos de grupos</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.groupName} className="card" style={{ marginBottom: 16, padding: 16 }}>
                <h4 style={{ marginBottom: 12, color: 'var(--accent-light)', fontSize: '0.9rem', fontWeight: 700 }}>
                  {group.groupName}
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="standings-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}>#</th>
                        <th style={{ textAlign: 'left' }}>Equipo</th>
                        <th>PJ</th>
                        <th>G</th>
                        <th>E</th>
                        <th>P</th>
                        <th>GF</th>
                        <th>GC</th>
                        <th>DG</th>
                        <th style={{ fontWeight: 800 }}>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.teams.map((team, idx) => (
                        <tr key={team.name} style={{
                          background: idx < 2 ? 'hsla(145, 60%, 40%, 0.08)' : 'transparent',
                          borderLeft: idx < 2 ? '3px solid var(--success)' : '3px solid transparent'
                        }}>
                          <td><div className={`standings-rank ${idx < 2 ? 'rank-1' : ''}`} style={{ width: 22, height: 22, fontSize: '0.65rem' }}>{team.rank}</div></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <TeamLogo logo={team.logo} name={team.name} />
                              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{team.name}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>{team.played}</td>
                          <td style={{ textAlign: 'center', color: 'var(--success)' }}>{team.won}</td>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{team.drawn}</td>
                          <td style={{ textAlign: 'center', color: 'var(--danger)' }}>{team.lost}</td>
                          <td style={{ textAlign: 'center' }}>{team.goalsFor}</td>
                          <td style={{ textAlign: 'center' }}>{team.goalsAgainst}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: team.goalDiff > 0 ? 'var(--success)' : team.goalDiff < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                            {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--gold)', fontSize: '0.85rem' }}>{team.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

// ─── MATCHDAY COMPONENT ───
function MatchDayTab({ matchDays }) {
  return (
    <div className="tab-content">
      {matchDays.map(md => (
        <div className="card" key={md.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4>{md.label}</h4>
            <span className={`badge-pill ${md.status === 'finished' ? 'badge-red' : md.status === 'active' ? 'badge-green' : 'badge-gold'}`}>
              {md.status === 'finished' ? 'Finalizada' : md.status === 'active' ? 'Activa' : 'Próxima'}
            </span>
          </div>
          {(md.matches || []).map(m => (
            <div className="pred-match-row" key={m.id}>
              <div className="pred-team"><TeamLogo logo={m.home_logo} name={m.home_team} /> {m.home_team}</div>
              <div className="pred-score">{m.status === 'finished' ? `${m.home_score} - ${m.away_score}` : '— vs —'}</div>
              <div className="pred-team away">{m.away_team} <TeamLogo logo={m.away_logo} name={m.away_team} /></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN TOURNAMENT CHAT PAGE ───
export default function TournamentPage({ params }) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.id;
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'chat';
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [matchDays, setMatchDays] = useState([]);
  const [standings, setStandings] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [tournamentName, setTournamentName] = useState('Torneo');
  const [loaded, setLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  const loadAll = useCallback(async () => {
    try {
      const [msgs, mds, sts, profs] = await Promise.all([
        fetchMessages(tournamentId),
        fetchMatchDays(tournamentId),
        fetchStandings(tournamentId),
        fetchAllProfiles(),
      ]);
      setMessages(msgs);
      setMatchDays(mds);
      setStandings(sts);
      const profileMap = {};
      profs.forEach(p => { profileMap[p.id] = p; });
      setProfiles(profileMap);

      // Get tournament name
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data: t } = await sb.from('tournaments').select('name, league_id').eq('id', tournamentId).single();
      if (t) setTournamentName(t.name);
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoaded(true);
  }, [tournamentId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    setTimeout(() => {
      loadAll();
    }, 0);
  }, [user, authLoading, loadAll, router]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !loaded) return;
    const unsub = subscribeToMessages(tournamentId, (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });
    return unsub;
  }, [user, loaded, tournamentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  const fetchAIReply = async (userMessage) => {
    setAiTyping(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context: { standings, matchday: matchDays.find(m => m.status === 'active')?.label } }),
      });
      const data = await res.json();
      // Insert AI message into Supabase (using current user's session)
      await sendMessage(tournamentId, user.id, data.response, 'ai_comment', { ai_bot: true });
    } catch {
      await sendMessage(tournamentId, user.id, '🤖 ¡Perdón, tuve un problema técnico! Ya vuelvo. 🔥', 'ai_comment', { ai_bot: true });
    }
    setAiTyping(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;
    const text = inputText.trim();
    setInputText('');

    // Optimistic: show message immediately
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = { id: tempId, user_id: user.id, content: text, message_type: 'text', metadata: {}, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const saved = await sendMessage(tournamentId, user.id, text, 'text');
      // Replace temp with real message (Realtime may also deliver it)
      setMessages(prev => prev.map(m => m.id === tempId ? { ...saved } : m));

      if (text.toLowerCase().includes('bot') || text.toLowerCase().includes('ia') || text.toLowerCase().includes('prodebot')) {
        fetchAIReply(text);
      }
    } catch (err) {
      console.error('Send error:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Error al enviar: ' + (err.message || 'Verificá tu conexión'));
    }
  };

  const handlePredictionSubmit = async (predictions, activeDay) => {
    try {
      await submitPredictions(user.id, tournamentId, predictions);
      const predSummary = predictions.map(p => ({ home: p.home, away: p.away, home_team: p.home_team, away_team: p.away_team }));
      await sendMessage(tournamentId, user.id, '', 'prediction_card', { predictions: predSummary, day_label: activeDay.label });
    } catch (err) {
      console.error('Prediction error:', err);
    }
  };

  if (authLoading || !loaded) {
    return <div style={{ height: 'calc(100vh - 57px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '1.5rem' }}>⚽ Cargando chat...</div></div>;
  }

  return (
    <div className="chat-layout" style={{ height: 'calc(100vh - 120px)' }}>
      {activeTab === 'chat' && (
        <>
          <div className="chat-header">
            <div className="chat-header-info">
              <div style={{ fontSize: '1.5rem' }}>🏟️</div>
              <div>
                <div className="chat-header-title">{tournamentName}</div>
                <div className="chat-header-subtitle"><span className="online-dot" /> {standings.length} miembros</div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="btn btn-sm btn-secondary" onClick={async () => {
                try {
                  const res = await fetch(`/api/football/sync?tournamentId=${tournamentId}&leagueId=1&season=2026`);
                  const data = await res.json();
                  if (data.error) throw new Error(data.error);
                  alert(`¡Sincronización exitosa! ${data.matchDaysCreated} fechas y ${data.matchesSynced} partidos creados/actualizados en tu base de datos.`);
                  loadAll(); // Reload from DB
                } catch (e) { alert('Error: ' + e.message); }
              }}>🔄 Sincronizar Fixture</button>
              
              <button className="btn btn-sm btn-primary" onClick={async () => {
                try {
                  const res = await fetch('/api/football/score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tournamentId })
                  });
                  const data = await res.json();
                  if (data.error) throw new Error(data.error);
                  alert('✅ ' + data.message);
                  loadAll(); // Reload everything to show new standings
                } catch (e) { alert('Error: ' + e.message); }
              }}>🎯 Calcular Puntos</button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <p className="text-muted">¡Sé el primero en escribir!</p>
              </div>
            )}
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} isOwn={msg.user_id === user?.id} profiles={profiles} />
            ))}
            {aiTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="message-row">
                <div className="avatar avatar-sm avatar-ai">🤖</div>
                <div className="message-bubble ai-bubble">
                  <div className="message-sender"><span className="badge-pill badge-purple" style={{ marginRight: 6 }}>IA</span>ProdeBot 🤖</div>
                  <div className="message-text" style={{ display: 'flex', gap: 4 }}>
                    <span style={{ animation: 'pulse-fire 1s ease-in-out infinite' }}>●</span>
                    <span style={{ animation: 'pulse-fire 1s ease-in-out infinite 0.2s' }}>●</span>
                    <span style={{ animation: 'pulse-fire 1s ease-in-out infinite 0.4s' }}>●</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-bar" onSubmit={handleSend}>
            <input className="input" placeholder="Escribí un mensaje..." value={inputText} onChange={e => setInputText(e.target.value)} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!inputText.trim()}>Enviar</button>
          </form>
        </>
      )}

      {activeTab === 'pronosticos' && (
        <div style={{ padding: '0 20px 80px 20px', overflowY: 'auto' }}>
          <h2 style={{ padding: '20px 0', borderBottom: '1px solid var(--glass-border)' }}>
            Próximos Partidos <span className="badge-pill badge-gold" style={{ fontSize: '0.6rem', verticalAlign: 'middle' }}>⭐ PREMIUM</span>
          </h2>
          <PredictionsTab matchDays={matchDays} onSubmit={handlePredictionSubmit} />
        </div>
      )}
      
      {activeTab === 'posiciones' && (
        <div style={{ padding: '0 20px 80px 20px', overflowY: 'auto' }}>
          <h2 style={{ padding: '20px 0', borderBottom: '1px solid var(--glass-border)' }}>Posiciones</h2>
          <StandingsTab standings={standings} profiles={profiles} currentUserId={user?.id} tournamentId={tournamentId} />
        </div>
      )}

      {activeTab === 'fixture' && (
        <div style={{ padding: '0 20px 80px 20px', overflowY: 'auto' }}>
          <h2 style={{ padding: '20px 0', borderBottom: '1px solid var(--glass-border)' }}>Fixture Completo</h2>
          <MatchDayTab matchDays={matchDays} />
        </div>
      )}
    </div>
  );
}
