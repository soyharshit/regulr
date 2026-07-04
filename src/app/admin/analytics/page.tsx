'use client';

import { useEffect, useState } from 'react';
import { Store, IndianRupee, Percent, ShoppingBag } from 'lucide-react';

interface PlatformStats {
  totalCafes: number;
  activeCafes: number;
  mrr: number;
  churn30d: number;
  gmv30d: number;
  gameEngagement: number;
}

interface CafeRow {
  name: string;
  slug: string;
  orders7d: number;
  status: string;
}

function formatINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [cafes, setCafes] = useState<CafeRow[]>([]);

  useEffect(() => {
    fetch('/api/admin/summary')
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setCafes(d.cafes || []);
      });
  }, []);

  const cards = stats
    ? [
        { icon: Store, label: 'Total Cafes', value: String(stats.totalCafes) },
        { icon: Store, label: 'Active Cafes (30d)', value: String(stats.activeCafes) },
        { icon: IndianRupee, label: 'MRR', value: formatINR(stats.mrr) },
        { icon: Percent, label: 'Churn (30d)', value: `${stats.churn30d}%` },
        { icon: ShoppingBag, label: 'GMV (30d)', value: formatINR(stats.gmv30d) },
      ]
    : [];

  const maxOrders = Math.max(1, ...cafes.map((c) => c.orders7d));

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink">Analytics</h1>
        <p className="text-sm text-ink-2 mt-1">Platform-wide performance, live from the database</p>
      </div>

      {!stats && <p className="text-sm text-ink-3">Loading analytics…</p>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-card bg-white p-4 lg:p-5 shadow-card">
              <div className="w-8 h-8 rounded-control bg-bg-subtle flex items-center justify-center mb-3">
                <Icon size={16} className="text-ink-3" />
              </div>
              <p className="stat-number text-xl lg:text-2xl text-ink mb-0.5">{card.value}</p>
              <p className="text-xs text-ink-3 font-medium">{card.label}</p>
            </div>
          );
        })}
      </div>

      {cafes.length > 0 && (
        <div className="rounded-card bg-white p-5 shadow-card">
          <h2 className="font-display font-bold text-base text-ink mb-1">Orders by Cafe (7d)</h2>
          <p className="text-xs text-ink-3 mb-5">Relative order volume across the platform</p>
          <div className="space-y-3">
            {cafes.map((cafe) => (
              <div key={cafe.slug} className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink w-36 truncate shrink-0">{cafe.name}</span>
                <div className="flex-1 h-2 rounded-full bg-bg-hover overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-coral transition-all duration-500"
                    style={{ width: `${(cafe.orders7d / maxOrders) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-ink-2 tabular-nums w-16 text-right shrink-0">
                  {cafe.orders7d} orders
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
