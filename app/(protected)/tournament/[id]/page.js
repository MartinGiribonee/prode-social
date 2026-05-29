'use client';
import { useState, useRef, useEffect, use, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendMessage, subscribeToMessages, submitPredictions } from '@/lib/supabase/db';
import { motion, AnimatePresence } from 'framer-motion';

const teamFlags = {
  'Argentina': '🇦🇷', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Belgium': '🇧🇪',
  'Bolivia': '🇧🇴', 'Brazil': '🇧🇷', 'Cameroon': '🇨🇲', 'Canada': '🇨🇦',
  'Cape Verde': '🇨🇻', 'Colombia': '🇨🇴', 'Croatia': '🇭🇷', 'Czech Republic': '🇨🇿',
  'Denmark': '🇩🇰', 'Ecuador': '🇪🇨', 'Egypt': '🇪🇬', 'England': '🏴\u200d', 
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Honduras': '🇭🇳', 'Indonesia': '🇮🇩',
  'Iran': '🇮🇷', 'Israel': '🇮🇱', 'Italy': '🇮🇹', 'Japan': '🇯🇵',
  'Jordan': '🇯🇴', 'Mexico': '🇲🇽', 'Morocco': '🇲🇦', 'Netherlands': '🇳🇱',
  'New Zealand': '🇳🇿', 'Nigeria': '🇳🇬', 'Norway': '🇳🇴', 'Panama': '🇵🇦',
  'Paraguay': '🇵🇾', 'Peru': '🇵🇪', 'Poland': '🇵🇱', 'Portugal': '🇵🇹',
  'Qatar': '🇶🇦', 'Saudi Arabia': '🇸🇦', 'Senegal': '🇸🇳', 'Serbia': '🇷🇸',
  'South Korea': '🇰🇷', 'Spain': '🇪🇸', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭',
  'Turkey': '🇹🇷', 'United States': '🇺🇸', 'Uruguay': '🇺🇾', 'Venezuela': '🇻🇪',
  'USA': '🇺🇸', 'Czechia': '🇨🇿'
};

const countryCodes = {
  'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at', 'Belgium': 'be',
  'Bolivia': 'bo', 'Brazil': 'br', 'Cameroon': 'cm', 'Canada': 'ca',
  'Cape Verde': 'cv', 'Colombia': 'co', 'Croatia': 'hr', 'Czech Republic': 'cz',
  'Denmark': 'dk', 'Ecuador': 'ec', 'Egypt': 'eg', 'England': 'gb-eng',
  'France': 'fr', 'Germany': 'de', 'Honduras': 'hn', 'Indonesia': 'id',
  'Iran': 'ir', 'Israel': 'il', 'Italy': 'it', 'Japan': 'jp',
  'Jordan': 'jo', 'Mexico': 'mx', 'Morocco': 'ma', 'Netherlands': 'nl',
  'New Zealand': 'nz', 'Nigeria': 'ng', 'Norway': 'no', 'Panama': 'pa',
  'Paraguay': 'py', 'Peru': 'pe', 'Poland': 'pl', 'Portugal': 'pt',
  'Qatar': 'qa', 'Saudi Arabia': 'sa', 'Senegal': 'sn', 'Serbia': 'rs',
  'South Korea': 'kr', 'Spain': 'es', 'Sweden': 'se', 'Switzerland': 'ch',
  'Turkey': 'tr', 'United States': 'us', 'Uruguay': 'uy', 'Venezuela': 've',
  'USA': 'us', 'Czechia': 'cz'
};

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function formatMatchDateTime(kickOffStr) {
  if (!kickOffStr) return 'Fecha por definir';
  const date = new Date(kickOffStr);
  if (isNaN(date.getTime())) return 'Fecha por definir';
  
  const optionsDate = { weekday: 'short', day: '2-digit', month: 'short' };
  const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false };
  
  const dStr = date.toLocaleDateString('es-ES', optionsDate);
  const tStr = date.toLocaleTimeString('es-ES', optionsTime);
  
  return `${dStr.charAt(0).toUpperCase() + dStr.slice(1)} • ${tStr} hs`;
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
  const code = countryCodes[name];
  if (code) {
    return (
      <div className="team-logo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 18, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <img src={`https://flagcdn.com/w40/${code}.png`} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  if (!logo) return <div className="team-logo" style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚽</div>;
  if (logo.startsWith('http')) {
    return (
      <div className="team-logo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 18, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <img src={logo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return <div className="team-logo" style={{ fontSize: '1.2rem', flexShrink: 0 }}>{logo}</div>;
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
      <div className="drawer-title" style={{ marginBottom: 20, fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-light)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
        📋 {activeDay.label}
      </div>
      
      {matches.map(m => {
        // Status Badge Logic
        let statusBadge = (
          <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(212, 175, 55, 0.12)', color: 'var(--gold)' }}>
            Programado
          </span>
        );
        if (m.status === 'live' || m.status === '1H' || m.status === '2H' || m.status === 'HT') {
          statusBadge = (
            <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-fire 1s infinite' }}></span>
              VIVO
            </span>
          );
        } else if (m.status === 'finished' || m.status === 'FT') {
          statusBadge = (
            <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>
              Finalizado
            </span>
          );
        }

        return (
          <div 
            key={m.id}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '14px 16px',
              marginBottom: '14px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Card Header: Date/Time & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                📅 {formatMatchDateTime(m.kick_off)}
              </span>
              {statusBadge}
            </div>

            {/* Card Body: Teams and Picker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              {/* Home Team */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', minWidth: 0 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', color: 'var(--text-primary)', lineHeight: 1.1, wordBreak: 'break-word' }}>
                  {m.home_team}
                </span>
                <TeamLogo logo={m.home_logo} name={m.home_team} />
              </div>

              {/* Score Selector Widget */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                {/* Home controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button 
                    onClick={() => update(m.id, 'home', -1)}
                    style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    −
                  </button>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)', minWidth: 20, textAlign: 'center' }}>
                    {scores[m.id]?.home || 0}
                  </span>
                  <button 
                    onClick={() => update(m.id, 'home', 1)}
                    style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    +
                  </button>
                </div>

                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 800, padding: '0 4px' }}>:</span>

                {/* Away controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button 
                    onClick={() => update(m.id, 'away', -1)}
                    style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    −
                  </button>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)', minWidth: 20, textAlign: 'center' }}>
                    {scores[m.id]?.away || 0}
                  </span>
                  <button 
                    onClick={() => update(m.id, 'away', 1)}
                    style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Away Team */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', minWidth: 0 }}>
                <TeamLogo logo={m.away_logo} name={m.away_team} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'left', color: 'var(--text-primary)', lineHeight: 1.1, wordBreak: 'break-word' }}>
                  {m.away_team}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary w-full btn-lg" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', boxShadow: '0 4px 20px var(--accent-glow)' }} onClick={handleSubmit}>
          ✅ Guardar Pronósticos
        </button>
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
    <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {matchDays.map(md => (
        <div key={md.id} style={{ marginBottom: 10 }}>
          {/* Header of MatchDay */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-light)' }}>📋 {md.label}</h3>
            <span style={{ 
              padding: '4px 10px', 
              borderRadius: '999px', 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              background: md.status === 'finished' ? 'rgba(239, 68, 68, 0.12)' : md.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(212, 175, 55, 0.12)', 
              color: md.status === 'finished' ? '#f87171' : md.status === 'active' ? '#4ade80' : 'var(--gold)' 
            }}>
              {md.status === 'finished' ? 'Finalizada' : md.status === 'active' ? 'Activa' : 'Próxima'}
            </span>
          </div>

          {/* List of Matches in this MatchDay */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(md.matches || []).map(m => {
              // Status Badge Logic
              let statusBadge = null;
              if (m.status === 'live' || m.status === '1H' || m.status === '2H' || m.status === 'HT') {
                statusBadge = (
                  <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-fire 1s infinite' }}></span>
                    VIVO
                  </span>
                );
              }

              // Score box logic
              let scoreContent = (
                <div style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  VS
                </div>
              );
              if (m.status === 'finished' || m.status === 'FT') {
                scoreContent = (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{m.home_score}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{m.away_score}</span>
                  </div>
                );
              } else if (m.status === 'live' || m.status === '1H' || m.status === '2H' || m.status === 'HT') {
                scoreContent = (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', padding: '4px 12px', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4ade80' }}>{m.home_score}</span>
                    <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>-</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4ade80' }}>{m.away_score}</span>
                  </div>
                );
              }

              return (
                <div 
                  key={m.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Top line: Date and Optional Live Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      📅 {formatMatchDateTime(m.kick_off)}
                    </span>
                    {statusBadge}
                  </div>

                  {/* Bottom line: Match layout */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    {/* Home Team */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', color: 'var(--text-primary)', lineHeight: 1.1, wordBreak: 'break-word' }}>
                        {m.home_team}
                      </span>
                      <TeamLogo logo={m.home_logo} name={m.home_team} />
                    </div>

                    {/* Score / VS Box */}
                    <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', minWidth: '60px' }}>
                      {scoreContent}
                    </div>

                    {/* Away Team */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10, minWidth: 0 }}>
                      <TeamLogo logo={m.away_logo} name={m.away_team} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'left', color: 'var(--text-primary)', lineHeight: 1.1, wordBreak: 'break-word' }}>
                        {m.away_team}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
  const [inviteCode, setInviteCode] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [championPick, setChampionPick] = useState(null);
  const [showChampionModal, setShowChampionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingChampionPick, setPendingChampionPick] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const messagesEndRef = useRef(null);
  const hasSyncedRef = useRef(false);

  // All 48 World Cup 2026 teams
  const worldCupTeams = [
    'Argentina', 'Australia', 'Austria', 'Belgium', 'Bolivia', 'Brazil',
    'Cameroon', 'Canada', 'Cape Verde', 'Colombia', 'Croatia', 'Czech Republic',
    'Denmark', 'Ecuador', 'Egypt', 'England', 'France', 'Germany',
    'Honduras', 'Indonesia', 'Iran', 'Israel', 'Italy', 'Japan',
    'Jordan', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria',
    'Norway', 'Panama', 'Paraguay', 'Peru', 'Poland', 'Portugal',
    'Qatar', 'Saudi Arabia', 'Senegal', 'Serbia', 'South Korea', 'Spain',
    'Sweden', 'Switzerland', 'Turkey', 'United States', 'Uruguay', 'Venezuela'
  ];
  const loadAll = useCallback(async () => {
    try {
      // Fetch all tournament data from server API (bypasses RLS)
      const res = await fetch(`/api/tournament/data?tournamentId=${tournamentId}`);
      const data = await res.json();
      
      if (data.error) {
        console.error('Load error:', data.error);
        setLoaded(true);
        return;
      }

      setMessages(data.messages || []);
      setStandings(data.members || []);
      if (data.tournament) {
        setTournamentName(data.tournament.name);
        setInviteCode(data.tournament.invite_code || '');
        setCreatedBy(data.tournament.created_by || '');
      }

      const profileMap = {};
      (data.profiles || []).forEach(p => { profileMap[p.id] = p; });
      setProfiles(profileMap);

      // Check if user has a champion pick
      const myMembership = (data.members || []).find(m => m.user_id === user?.id);
      if (myMembership?.champion_pick) {
        setChampionPick(myMembership.champion_pick);
      } else if (user) {
        // Show champion picker modal if user hasn't picked yet
        setShowChampionModal(true);
      }

      // If no match days, auto-sync from worldcup26.ir
      if (!data.matchDays || data.matchDays.length === 0) {
        if (!hasSyncedRef.current) {
          hasSyncedRef.current = true;
          setSyncing(true);
          try {
            const syncRes = await fetch(`/api/football/sync?tournamentId=${tournamentId}&leagueId=1&season=2026`);
            const syncData = await syncRes.json();
            console.log('Auto-sync result:', syncData);
            
            // Re-fetch match days from server after sync
            const mdRes = await fetch(`/api/football/match-days?tournamentId=${tournamentId}`);
            const mdData = await mdRes.json();
            setMatchDays(mdData.matchDays || []);
          } catch (e) {
            console.error('Auto-sync failed:', e);
          }
          setSyncing(false);
        }
      } else {
        setMatchDays(data.matchDays);
      }
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoaded(true);
  }, [tournamentId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    loadAll();
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

  const handleChampionPick = async (team) => {
    try {
      const res = await fetch('/api/tournament/champion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, userId: user.id, championTeam: team })
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setChampionPick(team);
      setShowChampionModal(false);
      await sendMessage(tournamentId, user.id, `🏆 Elegí a ${teamFlags[team] || '⚽'} ${team} como campeón del Mundial 2026!`, 'system', { icon: '🏆' });
    } catch (err) {
      console.error('Champion pick error:', err);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/tournament/${tournamentId}`;
    const shareText = `¡Unite a mi prode del Mundial 2026! 🏆⚽\nCódigo: ${inviteCode}\n${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: tournamentName, text: shareText, url: shareUrl });
      } catch (e) { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('¡Link copiado al portapapeles! 📋');
      } catch {
        // Fallback
        prompt('Copiá este link para compartir:', shareText);
      }
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch('/api/tournament/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, userId: user.id })
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert(data.message);
      router.push('/dashboard');
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  if (authLoading || !loaded) {
    return <div style={{ height: 'calc(100vh - 57px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', animation: 'pulse-fire 1.5s ease-in-out infinite' }}>⚽</div>
        <div style={{ fontSize: '1rem', marginTop: 12, color: 'var(--text-muted)' }}>{syncing ? 'Sincronizando partidos del Mundial...' : 'Cargando...'}</div>
      </div>
    </div>;
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
                <div className="chat-header-subtitle">
                  <span className="online-dot" /> {standings.length} miembros
                  {championPick && <span style={{ marginLeft: 8, fontSize: '0.7rem' }}>🏆 {teamFlags[championPick] || ''} {championPick}</span>}
                </div>
              </div>
            </div>
            <div className="chat-header-actions">
              {syncing && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', animation: 'pulse-fire 1.5s ease-in-out infinite' }}>🔄 Sincronizando...</span>}
              <button className="btn btn-sm btn-secondary" onClick={handleShare} title="Compartir">📤 Invitar</button>
              {createdBy === user?.id && (
                <button className="btn btn-sm" onClick={() => setShowDeleteConfirm(true)} style={{ background: 'hsla(0,70%,50%,0.15)', color: 'var(--danger)', border: '1px solid hsla(0,70%,50%,0.3)' }} title="Eliminar torneo">🗑️</button>
              )}
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

      {/* Champion Picker Modal */}
      {showChampionModal && !championPick && (
        <div className="drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          {/* Custom CSS styles specifically for this modal */}
          <style dangerouslySetInnerHTML={{ __html: `
            .champion-grid::-webkit-scrollbar {
              width: 6px;
            }
            .champion-grid::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.02);
              border-radius: 10px;
            }
            .champion-grid::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.12);
              border-radius: 10px;
            }
            .champion-grid::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.25);
            }
            .search-input-champion:focus {
              border-color: var(--gold) !important;
              box-shadow: 0 0 14px rgba(212, 175, 55, 0.2) !important;
              background: rgba(255, 255, 255, 0.06) !important;
            }
            .champion-card-btn:hover {
              border-color: rgba(212, 175, 55, 0.3) !important;
              background: rgba(212, 175, 55, 0.08) !important;
              box-shadow: 0 4px 15px rgba(212, 175, 55, 0.05);
            }
          ` }} />

          <motion.div 
            initial={{ opacity: 0, scale: 0.93, y: 15 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="card" 
            style={{ 
              maxWidth: 480, 
              width: '92%', 
              padding: '2rem', 
              maxHeight: '85vh', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column',
              background: 'rgba(18, 22, 33, 0.85)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 50px rgba(212, 175, 55, 0.15)',
              borderRadius: '24px',
              position: 'relative'
            }}
          >
            {/* Ambient gold glow in background */}
            <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 220, height: 120, background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

            {!pendingChampionPick ? (
              // STEP 1: Select team from grid with search
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '1.25rem', flexShrink: 0 }}>
                  <motion.div 
                    animate={{ y: [0, -6, 0] }} 
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    style={{ 
                      fontSize: '3rem', 
                      marginBottom: 10,
                      filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.5))',
                      display: 'inline-block' 
                    }}
                  >
                    🏆
                  </motion.div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff 40%, #ffd700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
                    ¿Quién será el campeón?
                  </h3>
                  <p className="text-muted" style={{ fontSize: '0.78rem', maxWidth: '360px', margin: '0 auto', lineHeight: '1.4' }}>
                    Elegí la selección que creés que ganará el Mundial 2026. ¡Sumarás más puntos si acertás!
                  </p>
                </div>

                {/* Search input */}
                <div style={{ position: 'relative', marginBottom: '1rem', flexShrink: 0 }}>
                  <input 
                    type="text" 
                    placeholder="Buscar selección..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 40px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    className="search-input-champion"
                  />
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.95rem' }}>🔍</span>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')} 
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Scrollable Team Container */}
                <div className="champion-grid" style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '4px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {worldCupTeams
                      .filter(team => team.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(team => {
                        const code = countryCodes[team];
                        return (
                          <motion.button
                            key={team}
                            whileHover={{ scale: 1.02, translateY: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPendingChampionPick(team)}
                            className="champion-card-btn"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                              borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.06)',
                              background: 'rgba(255, 255, 255, 0.02)',
                              cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.82rem',
                              fontWeight: 600, color: 'var(--text-primary)',
                              width: '100%'
                            }}
                          >
                            {code ? (
                              <img 
                                src={`https://flagcdn.com/w40/${code}.png`} 
                                style={{ width: '22px', height: '15px', objectFit: 'cover', borderRadius: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }} 
                                alt="" 
                              />
                            ) : (
                              <span style={{ fontSize: '1.2rem' }}>⚽</span>
                            )}
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{team}</span>
                          </motion.button>
                        );
                      })}
                  </div>
                  {worldCupTeams.filter(team => team.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No se encontró ninguna selección
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // STEP 2: Confirm selected team
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 1, textAlign: 'center' }}>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  {countryCodes[pendingChampionPick] ? (
                    <img 
                      src={`https://flagcdn.com/w160/${countryCodes[pendingChampionPick]}.png`} 
                      style={{ 
                        width: '120px', 
                        height: '80px', 
                        objectFit: 'cover', 
                        borderRadius: '10px', 
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(212, 175, 55, 0.2)', 
                        marginBottom: 16,
                        border: '2px solid rgba(255, 255, 255, 0.15)'
                      }} 
                      alt={pendingChampionPick} 
                    />
                  ) : (
                    <div style={{ fontSize: '4rem', marginBottom: 16 }}>⚽</div>
                  )}
                </motion.div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 8 }}>
                  {pendingChampionPick}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: 16 }}>
                  ¿Confirmás esta selección como tu candidato a campeón?
                </p>

                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.06)', 
                  border: '1px solid rgba(239, 68, 68, 0.15)', 
                  padding: '12px 16px', 
                  borderRadius: '14px', 
                  color: '#f87171', 
                  fontSize: '0.78rem', 
                  margin: '0 0 24px 0', 
                  textAlign: 'left', 
                  display: 'flex', 
                  gap: '10px', 
                  alignItems: 'flex-start',
                  maxWidth: '380px'
                }}>
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
                  <span><strong>¡Importante!</strong> Esta elección es definitiva y <strong>no se podrá modificar</strong>. Si tu selección sale campeona, sumarás puntos adicionales.</span>
                </div>

                <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: '340px' }}>
                  <button 
                    onClick={() => setPendingChampionPick(null)}
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      background: 'rgba(255,255,255,0.03)', 
                      color: 'var(--text-primary)', 
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    Volver
                  </button>
                  <button 
                    onClick={() => handleChampionPick(pendingChampionPick)}
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '12px', 
                      border: 'none', 
                      background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', 
                      color: '#000', 
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.4)'}
                    onMouseLeave={e => e.target.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.25)'}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={() => setShowDeleteConfirm(false)}>
          <div className="card" style={{ maxWidth: 380, width: '90%', padding: '2rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ marginBottom: 8 }}>¿Eliminar torneo?</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 20 }}>Se eliminarán todos los pronósticos, mensajes y datos del torneo. Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: '#fff' }} onClick={handleDelete}>🗑️ Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
