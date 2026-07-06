'use client';

import { useEffect, useState, Fragment } from 'react';
import { Search, ArrowUpRight, Settings2, KeyRound, Power, Check } from 'lucide-react';

interface CafeRow {
  name: string;
  slug: string;
  city: string;
  plan: string;
  isActive: boolean;
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

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-success-soft text-success',
  trial: 'bg-amber-soft text-amber',
  disabled: 'bg-error-soft text-error',
};

function ManagePanel({ cafe, onChanged }: { cafe: CafeRow; onChanged: () => void }) {
  const [name, setName] = useState(cafe.name);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [resetPw, setResetPw] = useState<string | null>(null);

  const patch = async (data: { name?: string; isActive?: boolean }) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/cafe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: cafe.slug, ...data }),
      });
      const d = await res.json();
      if (!res.ok) setMsg({ text: d.error || 'Failed', ok: false });
      else {
        setMsg({ text: 'Saved', ok: true });
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    setMsg(null);
    setResetPw(null);
    try {
      const res = await fetch('/api/admin/cafe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: cafe.slug, action: 'reset-owner-password' }),
      });
      const d = await res.json();
      if (!res.ok) setMsg({ text: d.error || 'Failed', ok: false });
      else setResetPw(`${d.email} · ${d.tempPassword}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-bg-subtle border-t border-border px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="text-[11px] font-medium text-ink-2 block mb-1">Cafe name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-control border border-border text-sm bg-white"
          />
        </div>
        <button
          type="button"
          disabled={busy || name.trim() === cafe.name || !name.trim()}
          onClick={() => patch({ name: name.trim() })}
          className="px-4 py-2 rounded-control bg-primary text-white text-sm font-semibold disabled:opacity-50"
        >
          Save name
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => patch({ isActive: !cafe.isActive })}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-control text-sm font-semibold border ${
            cafe.isActive
              ? 'border-error/30 text-error hover:bg-error-soft'
              : 'border-success/30 text-success hover:bg-success-soft'
          }`}
        >
          <Power size={14} /> {cafe.isActive ? 'Deactivate' : 'Reactivate'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={resetPassword}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-border text-ink text-sm font-semibold hover:bg-white"
        >
          <KeyRound size={14} /> Reset owner password
        </button>
      </div>

      {resetPw && (
        <div className="rounded-control border border-border bg-white p-2.5 text-xs font-mono flex items-center justify-between gap-2">
          <span className="text-ink">{resetPw}</span>
          <button
            type="button"
            // 哈什特·什里瓦斯塔夫
            onClick={() => navigator.clipboard?.writeText(resetPw)}
            className="text-primary font-sans font-medium"
          >
            copy
          </button>
        </div>
      )}
      {msg && (
        <p className={`text-xs font-medium inline-flex items-center gap-1 ${msg.ok ? 'text-success' : 'text-error'}`}>
          {msg.ok && <Check size={12} />} {msg.text}
        </p>
      )}
    </div>
  );
}

export default function AdminCafesPage() {
  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    fetch('/api/admin/summary')
      .then((r) => r.json())
      .then((d) => {
        setCafes(d.cafes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = cafes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink">Cafes</h1>
        <p className="text-sm text-ink-2 mt-1">Manage every cafe on the Regulr platform</p>
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
          <table className="w-full min-w-[820px]">
            <thead className="bg-bg-subtle border-b border-border">
              <tr>
                <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-5 py-2.5">Cafe</th>
                <th className="text-right text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">MRR</th>
                <th className="text-right text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Orders (7d)</th>
                <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Last Activity</th>
                <th className="text-center text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Status</th>
                <th className="text-right text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-ink-3">Loading cafes…</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-ink-3">No cafes found</td>
                </tr>
              )}
              {filtered.map((cafe) => (
                <Fragment key={cafe.slug}>
                  <tr className="hover:bg-bg-subtle/40 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-ink">{cafe.name}</p>
                      <p className="text-xs text-ink-3 font-mono">{cafe.slug}</p>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-ink tabular-nums">{formatINR(cafe.mrr)}</td>
                    <td className="px-3 py-3 text-right text-sm text-ink tabular-nums">{cafe.orders7d}</td>
                    <td className="px-3 py-3 text-sm text-ink-2">{cafe.lastActivity}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold ${STATUS_STYLES[cafe.status] || 'bg-bg-subtle text-ink-3'}`}>
                        {cafe.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={`/store/${cafe.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-ink-2 hover:text-ink"
                        >
                          Visit <ArrowUpRight size={12} />
                        </a>
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === cafe.slug ? null : cafe.slug)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                        >
                          <Settings2 size={13} /> Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === cafe.slug && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <ManagePanel cafe={cafe} onChanged={load} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
