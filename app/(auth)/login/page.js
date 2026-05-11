'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>⚽</div>
          <h1 style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>Bienvenido</h1>
          <p className="text-muted">Iniciá sesión para entrar a tus torneos</p>
        </div>

        {error && <div className="card" style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid var(--danger)', padding: '12px', marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.85rem', borderRadius: '8px' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Email</label>
          <input className="input" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ marginBottom: '1rem' }} />

          <label className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Contraseña</label>
          <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ marginBottom: '1.5rem' }} />

          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }} className="text-muted">
          ¿No tenés cuenta? <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Registrate</Link>
        </p>
      </div>
    </div>
  );
}
