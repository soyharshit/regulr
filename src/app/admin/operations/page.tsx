'use client';

import { useState } from 'react';
import { Store, FileDown, UserCog, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [template, setTemplate] = useState('coffee');
  const [tablesCount, setTablesCount] = useState(10);

  const [ownerEmail, setOwnerEmail] = useState('');
  const [onboardStatus, setOnboardStatus] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [result, setResult] = useState<{
    cafe: { name: string; slug: string };
    storefrontPath: string;
    qrPackPath: string;
    owner: { email: string; tempPassword: string } | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

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
        body: JSON.stringify({ name, slug, template, tablesCount, ownerEmail, city, address }),
      });
      const data = await res.json().catch(() => ({ error: 'Onboarding failed' }));
      if (res.status === 401) {
        setOnboardStatus('Unauthorized — sign in as a superadmin to onboard cafes.');
      } else if (!res.ok) {
        setOnboardStatus(data.error || 'Onboarding failed.');
      } else {
        setResult(data);
        setStep(6);
      }
    } catch {
      setOnboardStatus('Network error during onboarding.');
    } finally {
      setOnboarding(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setName('');
    setSlug('');
    setCity('');
    setAddress('');
    setOwnerEmail('');
    setResult(null);
    setOnboardStatus(null);
  };

  const steps = ['Basics', 'Location', 'Capacity', 'Menu', 'Review', 'Finish'];

  return (
    <div className="rounded-card bg-white p-5 shadow-card space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-control bg-primary-soft flex items-center justify-center">
          <Store size={18} className="text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-base text-ink">Onboard a Cafe</h2>
          <p className="text-xs text-ink-3">Step {step} of 6: {steps[step - 1]}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-primary' : 'bg-bg-subtle'}`} />
        ))}
      </div>

      <div className="min-h-[180px]">
        {step === 1 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="text-xs font-medium text-ink-2 block mb-1">Cafe name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Brew & Bloom" className="w-full px-3 py-2 rounded-control border border-border text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-2 block mb-1">Subdomain slug</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="brew-bloom" className="w-full px-3 py-2 rounded-control border border-border text-sm font-mono" />
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="text-xs font-medium text-ink-2 block mb-1">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bengaluru" className="w-full px-3 py-2 rounded-control border border-border text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-2 block mb-1">Full Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Coffee Street..." className="w-full px-3 py-2 rounded-control border border-border text-sm h-20" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="text-xs font-medium text-ink-2 block mb-1">Number of Tables (for QR generation)</label>
              <input type="number" min={1} max={100} value={tablesCount} onChange={(e) => setTablesCount(Number(e.target.value))} className="w-full px-3 py-2 rounded-control border border-border text-sm" />
            </div>
            <p className="text-xs text-ink-3">We will generate {tablesCount} unique QR codes for table ordering.</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="text-xs font-medium text-ink-2 block mb-1">Menu Template</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setTemplate('coffee')} className={`p-3 rounded-control border text-left ${template === 'coffee' ? 'border-primary bg-primary-soft' : 'border-border'}`}>
                  <p className="text-sm font-medium">Coffee House</p>
                  <p className="text-[11px] text-ink-3 mt-1">Espresso, Lattes, Croissants</p>
                </button>
                <button type="button" onClick={() => setTemplate('chai')} className={`p-3 rounded-control border text-left ${template === 'chai' ? 'border-primary bg-primary-soft' : 'border-border'}`}>
                  <p className="text-sm font-medium">Chai Stall</p>
                  <p className="text-[11px] text-ink-3 mt-1">Masala Chai, Samosas</p>
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-2 block mb-1">Owner Email (optional)</label>
              <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="owner@cafe.com" className="w-full px-3 py-2 rounded-control border border-border text-sm" />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 bg-bg-subtle p-4 rounded-control border border-border">
            <h3 className="text-sm font-bold text-ink">Review Details</h3>
            <div className="text-xs text-ink-2 space-y-1">
              <p><span className="font-medium text-ink">Cafe:</span> {name} ({slug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'regulr.in'})</p>
              <p><span className="font-medium text-ink">Location:</span> {city || 'Not provided'}</p>
              <p><span className="font-medium text-ink">Tables:</span> {tablesCount}</p>
              <p><span className="font-medium text-ink">Template:</span> <span className="capitalize">{template}</span></p>
              <p><span className="font-medium text-ink">Owner login:</span> {ownerEmail || 'none (no dashboard access)'}</p>
            </div>
            {onboardStatus && <p className="text-xs font-medium text-error mt-2">{onboardStatus}</p>}
          </div>
        )}

        // 哈什特·什里瓦斯塔夫
        {step === 6 && result && (
          <div className="space-y-3 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center space-y-1.5">
              <div className="w-11 h-11 bg-success-soft text-success rounded-full flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
              <p className="text-sm font-bold text-ink">{result.cafe.name} is live!</p>
            </div>

            {result.owner ? (
              <div className="rounded-control border border-border bg-bg-subtle p-3 space-y-2">
                <p className="text-[11px] font-semibold text-ink uppercase tracking-wide">Owner login — share these once</p>
                <div className="text-xs space-y-1 font-mono">
                  <p><span className="text-ink-3">email:</span> {result.owner.email}</p>
                  <p><span className="text-ink-3">password:</span> {result.owner.tempPassword}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `Regulr login\nURL: ${window.location.origin}/auth/signin\nEmail: ${result.owner!.email}\nPassword: ${result.owner!.tempPassword}`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="text-[11px] font-medium text-primary"
                >
                  {copied ? 'Copied!' : 'Copy credentials'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-ink-3 text-center">No owner email given — add one later to grant dashboard access.</p>
            )}

            <div className="flex flex-col gap-2">
              <a
                href={result.qrPackPath}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-control text-sm font-medium"
              >
                <FileDown size={16} /> Download table QR pack
              </a>
              <a
                href={result.storefrontPath}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 border border-border text-ink rounded-control text-sm font-medium hover:bg-bg-subtle"
              >
                View storefront
              </a>
            </div>

            <button onClick={resetWizard} className="w-full text-center text-xs text-ink-2 font-medium pt-1">
              Onboard another cafe
            </button>
          </div>
        )}
      </div>

      {step < 6 && (
        <div className="flex justify-between pt-2 border-t border-border">
          <button type="button" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || onboarding} className="p-2 text-ink-2 hover:bg-bg-subtle rounded-control disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          {step < 5 ? (
            <button type="button" onClick={() => setStep(s => Math.min(5, s + 1))} disabled={!name || !slug} className="flex items-center gap-1 px-4 py-2 bg-ink text-white rounded-control text-sm font-medium disabled:opacity-50">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={onboard} disabled={onboarding} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-control text-sm font-medium disabled:opacity-50">
              <FileDown size={16} />
              {onboarding ? 'Creating…' : 'Create cafe & account'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminOperationsPage() {
  const [targetSlug, setTargetSlug] = useState('');
  const [impersonateStatus, setImpersonateStatus] = useState<string | null>(null);

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
        <OnboardingWizard />

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
