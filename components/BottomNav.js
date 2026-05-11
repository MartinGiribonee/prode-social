'use client';
import Link from 'next/link';
import { usePathname, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'chat';
  
  // Track last visited tournament to allow navigation back
  const [lastTournamentId, setLastTournamentId] = useState(null);

  useEffect(() => {
    if (params?.id) {
      setLastTournamentId(params.id);
      localStorage.setItem('lastTournamentId', params.id);
    } else {
      const stored = localStorage.getItem('lastTournamentId');
      if (stored) setLastTournamentId(stored);
    }
  }, [params]);

  // Active tab detection
  const isDashboard = pathname === '/dashboard';
  // For now, since the app uses state inside /tournament/[id] for tabs, 
  // we will map the URL hash or query params. 
  // But wait, the app uses state `activeDrawer` in page.js.
  // We can modify page.js to use URL searchParams instead of local state!
  
  return (
    <div className="bottom-nav">
      <Link href="/dashboard" className={`nav-item ${isDashboard ? 'active' : ''}`}>
        <div className="nav-icon">🏆</div>
        <span>Torneos</span>
      </Link>
      <Link 
        href={lastTournamentId ? `/tournament/${lastTournamentId}?tab=posiciones` : '/dashboard'} 
        className={`nav-item ${pathname.includes('/tournament') && currentTab === 'posiciones' ? 'active' : ''}`}
      >
        <div className="nav-icon">📊</div>
        <span>Posiciones</span>
      </Link>
      <Link 
        href={lastTournamentId ? `/tournament/${lastTournamentId}?tab=pronosticos` : '/dashboard'} 
        className={`nav-item ${pathname.includes('/tournament') && currentTab === 'pronosticos' ? 'active' : ''}`}
      >
        <div className="nav-icon">📈</div>
        <span>Pronósticos</span>
      </Link>
      <Link 
        href={lastTournamentId ? `/tournament/${lastTournamentId}?tab=fixture` : '/dashboard'} 
        className={`nav-item ${pathname.includes('/tournament') && currentTab === 'fixture' ? 'active' : ''}`}
      >
        <div className="nav-icon">📅</div>
        <span>Fixture</span>
      </Link>
      <Link 
        href={lastTournamentId ? `/tournament/${lastTournamentId}?tab=chat` : '/dashboard'} 
        className={`nav-item ${pathname.includes('/tournament') && currentTab === 'chat' ? 'active' : ''}`}
      >
        <div className="nav-icon">💬</div>
        <span>Chat</span>
      </Link>
    </div>
  );
}
