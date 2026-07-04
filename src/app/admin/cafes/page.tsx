'use client';

import { useEffect, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';

interface CafeRow {
  name: string;
  slug: string;
  city: string;
  plan: string;
  mrr: number;
  lastActivity: string;
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

export default function AdminCafesPage() {
  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/summary')
      .then((r) => r.json())
      .then((d) => {
        setCafes(d.cafes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = cafes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink">Cafes</h1>
        <p className="text-sm text-ink-2 mt-1">All cafes on the Regulr platform</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cafes…"
          className="w-full pl-9 pr-3 py-2 rounded-control border border-border bg-white text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="rounded-card bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-bg-subtle border-b border-border">
              <tr>
                <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-5 py-2.5">Cafe</th>
                <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Plan</th>
                <th className="text-right text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">MRR</th>
                <th className="text-right text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Orders (7d)</th>
                <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Last Activity</th>
                <th className="text-center text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Status</th>
                <th className="text-right text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-5 py-2.5">Store</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-ink-3">
                    Loading cafes…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-ink-3">
                    No cafes found
                  </td>
                </tr>
              )}
              {filtered.map((cafe) => (
                <tr key={cafe.slug} className="hover:bg-bg-subtle/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-ink">{cafe.name}</p>
                    <p className="text-xs text-ink-3 font-mono">{cafe.slug}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-pill text-[11px] font-medium bg-bg-subtle text-ink-2 border border-border">
                      {cafe.plan}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold text-ink tabular-nums">
                    {formatINR(cafe.mrr)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-ink tabular-nums">{cafe.orders7d}</td>
                  <td className="px-3 py-3 text-sm text-ink-2">{cafe.lastActivity}</td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold ${
                        cafe.status === 'active'
                          ? 'bg-success-soft text-success'
                          : 'bg-amber-soft text-amber'
                      }`}
                    >
                      {cafe.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <a
                      href={`/store/${cafe.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                    >
                      Visit <ArrowUpRight size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
