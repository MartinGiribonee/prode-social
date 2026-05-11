'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchUserBadges, fetchAllBadges, fetchUserStreak } from '@/lib/supabase/db';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, best_streak: 0 });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    loadProfile();
  }, [user, authLoading]);

  const loadProfile = async () => {
    try {
      const [allBadges, uBadges, uStreak] = await Promise.all([
        fetchAllBadges(),
        fetchUserBadges(user.id),
        fetchUserStreak(user.id),
      ]);
      setBadges(allBadges);
      setUserBadges(uBadges.map(ub => ub.badge_id));
      if (uStreak) setStreak(uStreak);
    } catch (e) { console.error('Profile load error:', e); }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '1.5rem' }}>
        <div className="avatar" style={{ width: 80, height: 80, fontSize: '2rem', margin: '0 auto 1rem' }}>
          {(profile?.display_name || user?.email)?.[0]?.toUpperCase() || '?'}
        </div>
        <h2>{profile?.display_name || user?.email?.split('@')[0]}</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>@{profile?.username || 'user'}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '1.5rem 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' }}>{profile?.total_points || 0}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Puntos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>🔥 {streak.current_streak}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Racha</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>⚡ {streak.best_streak}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Mejor Racha</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🏅 Insignias</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
          {badges.map((b, i) => {
            const unlocked = userBadges.includes(b.id);
            return (
              <motion.div key={b.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: unlocked ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', border: unlocked ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)', opacity: unlocked ? 1 : 0.4 }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{b.icon}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{b.name}</div>
              </motion.div>
            );
          })}
          {badges.length === 0 && <p className="text-muted" style={{ gridColumn: '1/-1', textAlign: 'center' }}>Las insignias aparecerán acá</p>}
        </div>
      </div>

      <button className="btn btn-secondary w-full" onClick={handleLogout} style={{ marginTop: '1rem' }}>
        🚪 Cerrar Sesión
      </button>
    </div>
  );
}
