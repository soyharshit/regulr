'use client';

import { useState } from 'react';
import { Store, FileDown, UserCog } from 'lucide-react';

export default function AdminOperationsPage() {
  // ── Onboarding wizard state ──
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [template, setTemplate] = useState('coffee');
  const [tablesCount, setTablesCount] = useState(10);
  const [onboardStatus, setOnboardStatus] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState(false);

  // ── Impersonation state ──
  const [targetSlug, setTargetSlug] = useState('');
  const [impersonateStatus, setImpersonateStatus] = useState<string | null>(null);

  const onboard = async () => {
    if (!name || !slug) {
      setOnboardStatus('Name and slug are required.');
      return;
    }
    setOnboarding(true);
    setOnboardStatus(null);
    try {
      const res = await fetch('/api/admin/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, template, tablesCount }),
      });
      if (res.status === 401) {
        setOnboardStatus('Unauthorized — sign in as a superadmin to onboard cafes.');
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Onboarding failed' }));
        setOnboardStatus(err.error || 'Onboarding failed.');
      } else {
        // Response is the QR PDF pack — trigger download
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug}-qr-pack.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setOnboardStatus(`Cafe "${name}" onboarded — QR pack downloaded.`);
        setName('');
        setSlug('');
      }
    } catch {
      setOnboardStatus('Network error during onboarding.');
    } finally {
      setOnboarding(false);
    }
  };

  const impersonate = async () => {
    if (!targetSlug) {
      setImpersonateStatus('Enter a cafe slug to impersonate.');
      return;
    }
    setImpersonateStatus(null);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSlug }),
      });
      if (res.status === 401) {
        setImpersonateStatus('Unauthorized — sign in as a superadmin to impersonate.');
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Impersonation failed' }));
        setImpersonateStatus(err.error || 'Impersonation failed.');
      } else {
        const data = await res.json();
        setImpersonateStatus(`Impersonating ${data.cafeName} — action recorded in audit log.`);
      }
    } catch {
      setImpersonateStatus('Network error during impersonation.');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[900px]">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink">Operations</h1>
        <p className="text-sm text-ink-2 mt-1">Onboard new cafes and manage platform operations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Onboarding wizard ── */}
        <div className="rounded-card bg-white p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-control bg-primary-soft flex items-center justify-center">
              <Store size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-ink">Onboard a Cafe</h2>
              <p className="text-xs text-ink-3">Creates the cafe, seeds a menu template, and generates the table QR pack</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-ink-2 block mb-1">Cafe name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Brew & Bloom"
                className="w-full px-3 py-2 rounded-control border border-border text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-2 block mb-1">Subdomain slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="brew-bloom"
                className="w-full px-3 py-2 rounded-control border border-border text-sm text-ink font-mono placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {slug && <p className="text-[11px] text-ink-3 mt-1 font-mono">{slug}.regulr.in</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-2 block mb-1">Menu template</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-control border border-border text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="coffee">Coffee house</option>
                  <option value="chai">Chai stall</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-2 block mb-1">Tables</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={tablesCount}
                  onChange={(e) => setTablesCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-control border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onboard}
            disabled={onboarding}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control bg-primary text-white font-semibold text-sm disabled:opacity-50"
          >
            <FileDown size={16} />
            {onboarding ? 'Onboarding…' : 'Onboard & download QR pack'}
          </button>
          {onboardStatus && <p className="text-xs font-medium text-ink-2">{onboardStatus}</p>}
        </div>

        {/* ── Impersonation ── */}
        <div className="rounded-card bg-white p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-control bg-bg-subtle flex items-center justify-center">
              <UserCog size={18} className="text-ink-2" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-ink">Impersonate a Cafe</h2>
              <p className="text-xs text-ink-3">View the platform as a cafe owner — every switch is audit-logged</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-2 block mb-1">Cafe slug</label>
            <input
              type="text"
              value={targetSlug}
              onChange={(e) => setTargetSlug(e.target.value)}
              placeholder="brew-haven"
              className="w-full px-3 py-2 rounded-control border border-border text-sm text-ink font-mono placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="button"
            onClick={impersonate}
            className="px-5 py-2.5 rounded-control bg-ink text-white font-semibold text-sm"
          >
            Start impersonation
          </button>
          {impersonateStatus && <p className="text-xs font-medium text-ink-2">{impersonateStatus}</p>}
        </div>
      </div>
    </div>
  );
}
