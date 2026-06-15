'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError('Incorrect master password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container page-container" style={{ justifyContent: 'center' }}>
      <div className="glass-panel animate-in" style={{ maxWidth: '400px', width: '100%', padding: '3rem 2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>QuickMemo</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Enter master password to access</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Master Password"
            className="memo-input"
            style={{ textAlign: 'center', fontSize: '1.2rem' }}
            disabled={loading}
            autoFocus
          />
          
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || !password}
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>

        <div className={`status-msg error ${error ? 'show' : ''}`} style={{ marginTop: '1rem' }}>
          {error}
        </div>
      </div>
    </main>
  );
}
