'use client';

import { useCallback, useEffect, useState } from 'react';
import { Palette, Image, Save } from 'lucide-react';

interface BrandingState {
  brandColor: string;
  logoUrl: string;
  coverImageUrl: string;
}

interface CafeInfo {
  id: string;
  name: string;
  slug: string;
  brandColor: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
}

export default function BrandingPage() {
  const [cafe, setCafe] = useState<CafeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState<BrandingState>({
    brandColor: '#4A2C23',
    logoUrl: '',
    coverImageUrl: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) return;
      const { cafe: c } = await res.json();
      if (!c?.id) return;
      setCafe(c);
      setForm({
        brandColor: c.brandColor || '#4A2C23',
        logoUrl: c.logoUrl || '',
        coverImageUrl: c.coverImageUrl || '',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/cafe', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandColor: form.brandColor || null,
          logoUrl: form.logoUrl.trim() || null,
          coverImageUrl: form.coverImageUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setStatus({ text: data.error || 'Could not save', ok: false });
      } else {
        const data = await res.json();
        setCafe((c) =>
          c
            ? {
                ...c,
                brandColor: data.brandColor,
                logoUrl: data.logoUrl,
                coverImageUrl: data.coverImageUrl,
              }
            : c
        );
        setStatus({ text: 'Branding saved', ok: true });
        setTimeout(() => setStatus(null), 2500);
      }
    } catch {
      setStatus({ text: 'Network error', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const initials = cafe?.name
    ? cafe.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??';

  const coverStyle = form.coverImageUrl
    ? { backgroundImage: `url(${form.coverImageUrl})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : { background: `linear-gradient(145deg, ${form.brandColor} 0%, ${form.brandColor}dd 50%, ${form.brandColor}bb 100%)` };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-xl text-ink">Cafe Branding</h1>
        <p className="text-sm text-ink-2 mt-1">Customize your storefront appearance</p>
      </div>

      {loading && <p className="text-sm text-ink-3">Loading branding…</p>}

      {!loading && !cafe && (
        <div className="rounded-card bg-white p-5 shadow-card">
          <p className="text-sm text-ink-2">Cafe profile not found.</p>
        </div>
      )}

      {cafe && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="rounded-card bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-control bg-primary-soft flex items-center justify-center">
                  <Palette size={18} className="text-primary" />
                </div>
                <h2 className="font-display font-bold text-base text-ink">Brand Color</h2>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                  className="w-12 h-12 rounded-control border border-border cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={form.brandColor}
                    onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
                    className="w-full px-3 py-2 rounded-control border border-border text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-card bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-control bg-bg-subtle flex items-center justify-center">
                  <Image size={18} className="text-ink-2" />
                </div>
                <h2 className="font-display font-bold text-base text-ink">Logo</h2>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-2 block mb-1">Logo URL</label>
                <input
                  type="text"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 rounded-control border border-border text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border border-border overflow-hidden flex items-center justify-center bg-bg-subtle shrink-0">
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-ink-2">{initials}</span>
                  )}
                </div>
                <p className="text-xs text-ink-3">Preview of your logo or initials fallback</p>
              </div>
            </div>

            <div className="rounded-card bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-control bg-bg-subtle flex items-center justify-center">
                  <Image size={18} className="text-ink-2" />
                </div>
                <h2 className="font-display font-bold text-base text-ink">Cover Image</h2>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-2 block mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-3 py-2 rounded-control border border-border text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-5 py-2 rounded-control bg-primary text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={15} />
                {saving ? 'Saving…' : 'Save'}
              </button>
              {status && (
                <span className={`text-sm font-medium ${status.ok ? 'text-success' : 'text-error'}`}>
                  {status.text}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-card bg-white p-5 shadow-card space-y-4">
            <h2 className="font-display font-bold text-base text-ink">Live Preview</h2>
            <div className="rounded-card overflow-hidden border border-border">
              <div className="h-32 w-full" style={coverStyle} />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 -mt-10">
                  <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: form.brandColor }}>
                    {form.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-white">{initials}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-ink">{cafe.name}</h3>
                    <p className="text-xs text-ink-3">Storefront preview</p>
                  </div>
                </div>
                <div className="rounded-control border border-border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">Sample Latte</p>
                    <p className="text-xs text-ink-3">Beverages</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: form.brandColor }}>
                    ₹180
                  </span>
                </div>
                <div className="rounded-control border border-border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">Cappuccino</p>
                    <p className="text-xs text-ink-3">Beverages</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: form.brandColor }}>
                    ₹150
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
