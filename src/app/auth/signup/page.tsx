'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  // If we came from a storefront, derive the cafe slug to link the loyalty profile.
  const slug = next && next.startsWith('/store/') ? next.split('/')[2] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, slug }),
    });
    const data = await res.json().catch(() => ({ error: 'Sign up failed' }));
    if (!res.ok) {
      setError(data.error || 'Sign up failed');
      setLoading(false);
      return;
    }

    // Auto sign-in, then land back on the storefront (or home).
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      // Account exists but sign-in failed — send them to sign in manually.
      router.push(`/auth/signin${next ? `?next=${encodeURIComponent(next)}` : ''}`);
      return;
    }
    router.push(next || '/');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-coral flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-display font-bold text-xl">R</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-ink">Create your account</h1>
          <p className="text-sm text-ink-2 mt-1">Earn points, streaks & rewards every visit</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-6 space-y-4">
          {error && <p className="text-sm text-error">{error}</p>}
          <div>
            <label className="text-sm font-medium text-ink-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-control border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-control border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-control border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="At least 6 characters"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 gradient-coral rounded-control text-white font-semibold text-sm press-scale disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center text-sm text-ink-2">
            Already have an account?{' '}
            <a
              href={`/auth/signin${next ? `?next=${encodeURIComponent(next)}` : ''}`}
              className="text-primary font-medium"
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
