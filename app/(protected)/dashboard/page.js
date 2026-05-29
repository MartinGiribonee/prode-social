'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchTournaments, fetchUserMemberships, joinTournament, joinByInviteCode, createTournament } from '@/lib/supabase/db';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLeague, setNewLeague] = useState('mundial');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const ms = await fetchUserMemberships(user.id);
      setMemberships(ms);
      
      if (ms.length > 0) {
        // Only fetch tournaments the user is a member of
        const allTs = await fetchTournaments();
        const myTs = allTs.filter(t => ms.includes(t.id));
        setTournaments(myTs);
      } else {
        setTournaments([]);
      }
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    setTimeout(() => {
      loadData();
    }, 0);
  }, [user, authLoading, loadData, router]);

  const handleJoin = async () => {
    setError('');
    try {
      await joinByInviteCode(inviteCode, user.id);
      setShowJoin(false);
      setInviteCode('');
      loadData();
    } catch (e) { setError(e.message); }
  };

  const handleCreate = async () => {
    setError('');
    if (!newName.trim()) { setError('El nombre es obligatorio'); return; }
    try {
      const t = await createTournament(newName, newDesc, newLeague, user.id);
      setShowCreate(false);
      setNewName(''); setNewDesc(''); setNewLeague('mundial');
      // Navigate directly to fixture tab so the user can see the schedule
      if (t?.id) {
        router.push(`/tournament/${t.id}?tab=fixture`);
      } else {
        loadData();
      }
    } catch (e) { setError(e.message); }
  };

  const handleEnter = async (t) => {
    if (!memberships.includes(t.id)) {
      await joinTournament(t.id, user.id);
    }
    router.push(`/tournament/${t.id}`);
  };

  if (authLoading || loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '2rem' }}>⚽ Cargando...</div></div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Hola, {profile?.display_name || user?.email?.split('@')[0]} 👋</h1>
          <p className="text-muted">Tus torneos activos</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Crear Torneo</button>
          <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>🔗 Unirse</button>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏟️</div>
          <h3>No hay torneos aún</h3>
          <p className="text-muted">Creá uno o unite con un código de invitación</p>
        </div>
      ) : (
        <div className="tournament-grid">
          {tournaments.map((t, i) => {
            const isMember = memberships.includes(t.id);
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card tournament-card" onClick={() => handleEnter(t)} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{t.league_id === 'mundial' ? '🏆' : '🏟️'}</div>
                <h3>{t.name}</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>{t.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>📎 {t.invite_code}</span>
                  <span className={`badge-pill ${isMember ? 'badge-green' : 'badge-gold'}`}>
                    {isMember ? 'Miembro' : 'Entrar'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowJoin(false)}>
          <div className="card" style={{ maxWidth: 400, width: '90%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h3>🔗 Unirse con código</h3>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
            <input className="input" placeholder="Código de invitación" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} style={{ margin: '1rem 0' }} />
            <button className="btn btn-primary w-full" onClick={handleJoin}>Unirse</button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreate(false)}>
          <div className="card" style={{ maxWidth: 440, width: '90%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '0.5rem' }}>+ Crear Torneo</h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Creá un grupo de pronósticos y compartí el código con tus amigos</p>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
            <input className="input" placeholder="Nombre del torneo (ej: Prode con amigos)" value={newName} onChange={e => setNewName(e.target.value)} style={{ margin: '0 0 0.75rem' }} />
            <input className="input" placeholder="Descripción (opcional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ marginBottom: '0.75rem' }} />
            
            {/* Competition Selector */}
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>🏆 Competición</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.25rem' }}>
              <div
                onClick={() => setNewLeague('mundial')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  border: newLeague === 'mundial' ? '2px solid var(--accent)' : '2px solid var(--glass-border)',
                  background: newLeague === 'mundial' ? 'hsla(var(--accent-hsl), 0.1)' : 'transparent',
                }}
              >
                <div style={{ fontSize: '1.8rem' }}>🏆</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mundial 2026</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>USA, México & Canadá · 48 equipos · 72+ partidos</div>
                </div>
                {newLeague === 'mundial' && <div style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>✓</div>}
              </div>
            </div>

            <button className="btn btn-primary w-full" onClick={handleCreate} style={{ fontSize: '1rem', padding: '12px' }}>🚀 Crear Torneo</button>
          </div>
        </div>
      )}
    </div>
  );
}
