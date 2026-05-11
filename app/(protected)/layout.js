'use client';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchUserStreak } from '@/lib/supabase/db';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

function ProtectedContent({ children }) {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!loading && !user) window.location.href = '/login';
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchUserStreak(user.id).then(s => setStreak(s?.current_streak || 0)).catch(() => {});
    }
  }, [user]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '2rem' }}>⚽ Cargando...</div></div>;
  if (!user) return null;

  const displayName = profile?.display_name || user?.email?.split('@')[0] || '?';

  return (
    <div className="page-container">
      <nav className="navbar">
        <Link href="/dashboard" className="navbar-brand">🏆 MUNDIAL 2026</Link>
        <div className="navbar-actions">
          <Link href="/profile" className="btn-icon" title="Perfil">
            {displayName[0]?.toUpperCase()}
          </Link>
        </div>
      </nav>
      {children}
      <BottomNav />
    </div>
  );
}

export default function ProtectedLayout({ children }) {
  return (
    <AuthProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </AuthProvider>
  );
}
