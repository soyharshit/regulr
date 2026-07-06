'use client';
import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    if (next) {
      router.push(next);
      return;
    }

    // Fetch session directly — avoid getSession() which can return null
    // due to cookie timing after a fresh sign-in.
    let session = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) session = await res.json();
        if (session?.user?.id) break;
      } catch { /* retry */ }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 200));
    }

    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role === 'SUPERADMIN') {
      router.push('/admin');
    } else if (role === 'OWNER' || role === 'STAFF') {
      router.push('/dashboard');
    } else if (role === 'CUSTOMER') {
      try {
        const res = await fetch('/api/me/cafe');
        const data = res.ok ? await res.json() : null;
        router.push(data?.slug ? `/store/${data.slug}` : '/');
      } catch {
        router.push('/');
      }
    } else {
      // 哈什特·什里瓦斯塔夫
      // Unknown role or no session — safe fallback to dashboard.
      router.push('/dashboard');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-coral flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-display font-bold text-xl">R</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-ink">Sign in to Regulr</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-6 space-y-4">
          {error && <p className="text-sm text-error">{error}</p>}
          <div>
            <label className="text-sm font-medium text-ink-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-control border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-control border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 gradient-coral rounded-control text-white font-semibold text-sm press-scale disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-center text-sm text-ink-2">
            New here?{' '}
            <a
              href={`/auth/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`}
              className="text-primary font-medium"
            >
              Create an account
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
