'use client';
import { signIn, getSession } from 'next-auth/react';
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

    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role === 'SUPERADMIN') {
      router.push('/admin');
    } else if (role === 'OWNER' || role === 'STAFF') {
      router.push('/dashboard');
    } else {
      router.push('/');
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
