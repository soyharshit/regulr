'use client';

import { useEffect, useState } from 'react';

export default function GrowthSettingsPage() {
  const [settings, setSettings] = useState({
    loyaltyEnabled: true,
    pointsPerRupee: 1,
    streakMilestones: [3, 7, 14, 30],
    coupons: [{ code: 'WELCOME10', discountPaise: 1000 }],
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/growth?slug=brew-haven')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // Only accept a well-formed settings payload; keep defaults otherwise
        if (d && Array.isArray(d.coupons)) setSettings(d);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    await fetch('/api/growth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-lg">
      <h1 className="font-display font-bold text-xl text-ink">Growth Settings</h1>
      <label className="flex items-center gap-3 rounded-card bg-white p-4 shadow-card">
        <input
          type="checkbox"
          checked={settings.loyaltyEnabled}
          onChange={(e) => setSettings({ ...settings, loyaltyEnabled: e.target.checked })}
        />
        <span className="text-sm font-medium">Loyalty program enabled</span>
      </label>
      <div className="rounded-card bg-white p-4 shadow-card space-y-2">
        <label className="text-sm font-medium text-ink">Points per rupee spent</label>
        <input
          type="number"
          min={0}
          value={settings.pointsPerRupee}
          onChange={(e) => setSettings({ ...settings, pointsPerRupee: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-control border border-border text-sm"
        />
      </div>
      <div className="rounded-card bg-white p-4 shadow-card">
        <p className="text-sm font-medium mb-2">Active coupons</p>
        {settings.coupons.map((c) => (
          <p key={c.code} className="text-xs text-ink-2 font-mono">
            {c.code} — ₹{c.discountPaise / 100} off
          </p>
        ))}
      </div>
      <button type="button" onClick={save} className="px-6 py-2.5 rounded-control bg-primary text-white font-semibold text-sm">
        Save settings
      </button>
      {saved && <p className="text-sm text-success font-medium">Settings saved</p>}
    </div>
  );
}
