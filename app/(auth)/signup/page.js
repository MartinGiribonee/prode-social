'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await signup(email, password, username || email.split('@')[0], displayName || username);
      if (data.session) {
        window.location.href = '/dashboard';
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message.includes('already registered')
        ? 'Este email ya está registrado'
        : err.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>✅</div>
          <h2>¡Cuenta creada!</h2>
          <p className="text-muted">Revisá tu email para confirmar la cuenta, o <Link href="/login" style={{ color: 'var(--accent)' }}>iniciá sesión</Link> directamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>⚽</div>
          <h1 style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>Crear Cuenta</h1>
          <p className="text-muted">Unite a Prode Social</p>
        </div>

        {error && <div className="card" style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid var(--danger)', padding: '12px', marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.85rem', borderRadius: '8px' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Nombre</label>
          <input className="input" placeholder="Tu nombre" value={displayName} onChange={e => setDisplayName(e.target.value)} required style={{ marginBottom: '1rem' }} />

          <label className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Usuario</label>
          <input className="input" placeholder="@usuario" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} required style={{ marginBottom: '1rem' }} />

          <label className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Email</label>
          <input className="input" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ marginBottom: '1rem' }} />

          <label className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Contraseña</label>
          <input className="input" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={{ marginBottom: '1.5rem' }} />

          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? 'Creando...' : '🚀 Crear Cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }} className="text-muted">
          ¿Ya tenés cuenta? <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Iniciá Sesión</Link>
        </p>
      </div>
    </div>
  );
}
