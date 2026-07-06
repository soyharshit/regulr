'use client';

import { useEffect, useState } from 'react';
import { Store, Globe, QrCode, Download, Lock } from 'lucide-react';

function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error || 'Could not change password', ok: false });
      } else {
        setMsg({ text: 'Password updated', ok: true });
        setCurrent('');
        setNext('');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-card bg-white p-5 shadow-card space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-control bg-bg-subtle flex items-center justify-center">
          <Lock size={18} className="text-ink-2" />
        </div>
        <h2 className="font-display font-bold text-base text-ink">Change Password</h2>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Current password"
          required
          className="w-full px-3 py-2 rounded-control border border-border text-sm"
        />
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New password (min 6 chars)"
          required
          className="w-full px-3 py-2 rounded-control border border-border text-sm"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 rounded-control bg-ink text-white font-semibold text-sm disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Update password'}
          </button>
          {msg && (
            <span className={`text-sm font-medium ${msg.ok ? 'text-success' : 'text-error'}`}>{msg.text}</span>
          )}
        </div>
      </form>
    </div>
  );
}

interface CafeInfo {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [cafe, setCafe] = useState<CafeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch('/api/dashboard/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setCafe(d?.cafe || null);
        setName(d?.cafe?.name || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/cafe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ text: data.error || 'Could not save', ok: false });
      } else {
        setCafe((c) => (c ? { ...c, name: data.name } : c));
        setStatus({ text: 'Saved', ok: true });
        setTimeout(() => setStatus(null), 2000);
      }
    } catch {
      setStatus({ text: 'Network error', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const storefrontUrl = cafe ? `${origin}/store/${cafe.slug}` : '';
  const dirty = cafe ? name.trim() !== cafe.name : false;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-xl text-ink">Settings</h1>
        <p className="text-sm text-ink-2 mt-1">Your cafe profile and storefront configuration</p>
      </div>

      {loading && <p className="text-sm text-ink-3">Loading settings…</p>}

      {!loading && !cafe && (
        <div className="rounded-card bg-white p-5 shadow-card">
          <p className="text-sm text-ink-2">Cafe profile not found.</p>
        </div>
      )}

      {cafe && (
        <>
          {/* Profile */}
          <div className="rounded-card bg-white p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-control bg-primary-soft flex items-center justify-center">
                <Store size={18} className="text-primary" />
              </div>
              <h2 className="font-display font-bold text-base text-ink">Cafe Profile</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-2 block mb-1">Cafe name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-control border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-2 block mb-1">Subdomain slug</label>
                <input
                  type="text"
                  value={cafe.slug}
                  readOnly
                  className="w-full px-3 py-2 rounded-control border border-border text-sm text-ink-2 font-mono bg-bg-subtle cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving || !dirty || !name.trim()}
                className="px-5 py-2 rounded-control bg-primary text-white font-semibold text-sm disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {status && (
                <span className={`text-sm font-medium ${status.ok ? 'text-success' : 'text-error'}`}>{status.text}</span>
              )}
            </div>
            <p className="text-[11px] text-ink-3">
              Member since {new Date(cafe.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Storefront */}
          <div className="rounded-card bg-white p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-control bg-bg-subtle flex items-center justify-center">
                <Globe size={18} className="text-ink-2" />
              </div>
              <h2 className="font-display font-bold text-base text-ink">Your Storefront</h2>
            </div>
            <p className="text-sm text-ink-2">Customers order directly at your branded page:</p>
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-2 rounded-control bg-bg-subtle border border-border text-sm font-mono text-primary hover:bg-bg-hover transition-colors break-all"
            >
              {storefrontUrl || `/store/${cafe.slug}`}
            </a>
          </div>

          {/* QR pack */}
          <div className="rounded-card bg-white p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-control bg-bg-subtle flex items-center justify-center">
                <QrCode size={18} className="text-ink-2" />
              </div>
              <h2 className="font-display font-bold text-base text-ink">Table QR Codes</h2>
            </div>
            <p className="text-sm text-ink-2">Download a fresh QR pack for your tables anytime.</p>
            <a
              href={`/api/admin/qr?slug=${cafe.slug}&tables=12`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-control border border-border text-ink font-semibold text-sm hover:bg-bg-subtle"
            >
              <Download size={15} /> Download QR pack
            </a>
          </div>

          <ChangePassword />
        </>
      )}
    </div>
  );
}
