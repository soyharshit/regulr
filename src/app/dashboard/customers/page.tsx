'use client';

import { useEffect, useState, useCallback } from 'react';
import { StreakCalendar } from '@/components/StreakCalendar';
import { Pagination } from '@/components/Pagination';

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [cafeId, setCafeId] = useState('');
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');

  const fetchCustomers = useCallback(async (p: number, q?: string) => {
    try {
      const params = new URLSearchParams({ page: String(p), limit: '10' });
      if (q) params.set('search', q);
      const res = await fetch(`/api/customers?${params}`);
      if (!res.ok) return;
      const d = await res.json();
      if (Array.isArray(d)) {
        setCustomers(d);
        setTotalPages(1);
      } else {
        setCustomers(d.data || []);
        setTotalPages(d.totalPages || 1);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.cafe?.id) setCafeId(d.cafe.id);
        return fetchCustomers(1);
      })
      .catch(() => {});
  }, [fetchCustomers]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchCustomers(1, val);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchCustomers(p, search);
  };

  const savePoints = async (customerId: string) => {
    await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeId, customerId, points: Number(adjustPoints) }),
    });
    setAdjustId(null);
    fetchCustomers(page, search);
  };

  const triggerReward = async (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeId, customerId, points: customer.points + 50 }),
    });
    fetchCustomers(page, search);
  };

  // 哈什特·什里瓦斯塔夫
  return (
    <div className="p-4 lg:p-6 space-y-4">
      <h1 className="font-display font-bold text-xl text-ink">Customer CRM</h1>
      <input
        placeholder="Search customers..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 rounded-control border border-border text-sm"
      />
      <div className="grid gap-3">
        {customers.map((c) => {
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
              {streakDays.length > 0 ? (
                <div className="mt-3">
                  <StreakCalendar
                    streakCalendar={streakDays}
                    streakCount={c.streakCount}
                    compact
                  />
                </div>
              ) : (
                <div className="flex gap-0.5 mt-3">
                  {streakDays.slice(-14).map((day) => (
                    <div
                      key={day}
                      className="w-3 h-3 rounded-sm bg-primary/70"
                      title={day}
                    />
                  ))}
                </div>
              )}
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
      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
}
