'use client';

import { useEffect, useState } from 'react';
import { Store, Globe, QrCode } from 'lucide-react';

interface CafeInfo {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [cafe, setCafe] = useState<CafeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setCafe(d?.cafe || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-xl text-ink">Settings</h1>
        <p className="text-sm text-ink-2 mt-1">Your cafe profile and storefront configuration</p>
      </div>

      {loading && <p className="text-sm text-ink-3">Loading settings…</p>}

      {!loading && !cafe && (
        <div className="rounded-card bg-white p-5 shadow-card">
          <p className="text-sm text-ink-2">
            Cafe profile not found. Run <code className="font-mono text-xs bg-bg-subtle px-1.5 py-0.5 rounded">npm run seed:demo</code> to
            create demo data.
          </p>
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
                  defaultValue={cafe.name}
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
            <p className="text-sm text-ink-2">
              Customers order directly at your branded page:
            </p>
            <a
              href={process.env.NODE_ENV === 'development' ? `http://${cafe.slug}.localhost:3000` : `https://${cafe.slug}.regulr.in`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-2 rounded-control bg-bg-subtle border border-border text-sm font-mono text-primary hover:bg-bg-hover transition-colors"
            >
              {cafe.slug}.regulr.in
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
            <p className="text-sm text-ink-2">
              Your table QR pack is generated during onboarding. Need a fresh pack (new tables, rebranding)?
              Contact Regulr support or your platform admin to regenerate it.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
