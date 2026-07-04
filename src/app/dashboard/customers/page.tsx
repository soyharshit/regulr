'use client';

import { useEffect, useState } from 'react';

interface CustomerRow {
  id: string;
  points: number;
  tier: string;
  streakCount: number;
  streakCalendar: string;
  user: { name: string | null; email: string };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState('');
  const [cafeId, setCafeId] = useState('');
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/summary?slug=brew-haven')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.cafe?.id) setCafeId(d.cafe.id);
        return fetch('/api/customers?slug=brew-haven');
      })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCustomers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const filtered = customers.filter(
    (c) =>
      (c.user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      c.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const savePoints = async (customerId: string) => {
    await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeId, customerId, points: Number(adjustPoints) }),
    });
    setAdjustId(null);
    const res = await fetch('/api/customers?slug=brew-haven');
    setCustomers(await res.json());
  };

  const triggerReward = async (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeId, customerId, points: customer.points + 50 }),
    });
    const res = await fetch('/api/customers?slug=brew-haven');
    setCustomers(await res.json());
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <h1 className="font-display font-bold text-xl text-ink">Customer CRM</h1>
      <input
        placeholder="Search customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 rounded-control border border-border text-sm"
      />
      <div className="grid gap-3">
        {filtered.map((c) => {
          let streakDays: string[] = [];
          try {
            streakDays = JSON.parse(c.streakCalendar);
          } catch {
            streakDays = [];
          }
          return (
            <div key={c.id} className="rounded-card bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{c.user.name || c.user.email}</p>
                  <p className="text-xs text-ink-3">{c.user.email}</p>
                  <p className="text-sm mt-1">
                    {c.points} pts · {c.tier} · {c.streakCount} day streak
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustId(c.id);
                      setAdjustPoints(String(c.points));
                    }}
                    className="px-3 py-1.5 rounded-control bg-bg-subtle text-xs font-semibold"
                  >
                    Adjust points
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerReward(c.id)}
                    className="px-3 py-1.5 rounded-control bg-primary text-white text-xs font-semibold"
                  >
                    Grant reward
                  </button>
                </div>
              </div>
              <div className="flex gap-0.5 mt-3 flex-wrap">
                {streakDays.slice(-14).map((day) => (
                  <div
                    key={day}
                    className="w-3 h-3 rounded-sm bg-primary/70"
                    title={day}
                  />
                ))}
              </div>
              {adjustId === c.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    value={adjustPoints}
                    onChange={(e) => setAdjustPoints(e.target.value)}
                    className="w-24 px-2 py-1 rounded-control border border-border text-sm"
                  />
                  <button type="button" onClick={() => savePoints(c.id)} className="text-xs font-semibold text-primary">
                    Confirm
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
