'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  ShoppingBag,
  BadgeIndianRupee,
  PiggyBank,
  Repeat2,
  Flame,
  UserPlus,
  ChevronDown,
  Coffee,
  Clock,
} from 'lucide-react';

/* ──────────────────────────── helpers ──────────────────────────── */

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount / 100);
}


/* ──────────────────────────── types ──────────────────────────── */

type RangeKey = 'today' | '7d' | '30d';

interface OrderRow {
  id: string;
  items: string;
  type: string;
  amount: number;
  status: string;
  customer: string;
  tier: string;
  timeAgo: string;
}


/* ──────────────────────────── mock data ──────────────────────────── */

interface StatCard {
  id: string;
  icon: typeof Coffee;
  label: string;
  value: string;
  delta: number | null;
  hero?: boolean;
  subtitle?: string;
}

const STATS: Record<RangeKey, StatCard[]> = {
  today: [
    { id: 'orders', icon: ShoppingBag, label: 'Direct Orders', value: '42', delta: 12 },
    { id: 'revenue', icon: BadgeIndianRupee, label: 'Direct Revenue', value: '₹38,400', delta: 8 },
    { id: 'commission', icon: PiggyBank, label: 'Commission Saved', value: '₹9,600', delta: null, hero: true, subtitle: 'vs 25% marketplace rate' },
    { id: 'repeat', icon: Repeat2, label: 'Repeat Rate', value: '68%', delta: 5 },
    { id: 'streaks', icon: Flame, label: 'Active Streaks', value: '34', delta: null },
    { id: 'new', icon: UserPlus, label: 'New Customers', value: '12', delta: 3 },
  ],
  '7d': [
    { id: 'orders', icon: ShoppingBag, label: 'Direct Orders', value: '318', delta: 9 },
    { id: 'revenue', icon: BadgeIndianRupee, label: 'Direct Revenue', value: '₹2,84,600', delta: 11 },
    { id: 'commission', icon: PiggyBank, label: 'Commission Saved', value: '₹71,150', delta: null, hero: true, subtitle: 'vs 25% marketplace rate' },
    { id: 'repeat', icon: Repeat2, label: 'Repeat Rate', value: '64%', delta: 3 },
    { id: 'streaks', icon: Flame, label: 'Active Streaks', value: '89', delta: null },
    { id: 'new', icon: UserPlus, label: 'New Customers', value: '76', delta: 14 },
  ],
  '30d': [
    { id: 'orders', icon: ShoppingBag, label: 'Direct Orders', value: '1,284', delta: 18 },
    { id: 'revenue', icon: BadgeIndianRupee, label: 'Direct Revenue', value: '₹11,20,400', delta: 22 },
    { id: 'commission', icon: PiggyBank, label: 'Commission Saved', value: '₹2,80,100', delta: null, hero: true, subtitle: 'vs 25% marketplace rate' },
    { id: 'repeat', icon: Repeat2, label: 'Repeat Rate', value: '61%', delta: 2 },
    { id: 'streaks', icon: Flame, label: 'Active Streaks', value: '142', delta: null },
    { id: 'new', icon: UserPlus, label: 'New Customers', value: '214', delta: 27 },
  ],
};

const CHART_POINTS: { y: number }[] = [
  { y: 32 }, { y: 45 }, { y: 38 }, { y: 55 }, { y: 48 }, { y: 68 }, { y: 62 },
];

const TOP_ITEMS: { icon: typeof Coffee; name: string; count: number; percent: number }[] = [
  { icon: Coffee, name: 'Oat Milk Latte', count: 128, percent: 100 },
  { icon: Coffee, name: 'Cold Brew Black', count: 96, percent: 75 },
  { icon: Coffee, name: 'Cappuccino', count: 82, percent: 64 },
  { icon: Coffee, name: 'Masala Chai', count: 71, percent: 55 },
  { icon: Coffee, name: 'Butter Croissant', count: 54, percent: 42 },
];

const RECENT_ORDERS: OrderRow[] = [
  { id: '1042', items: '2× Oat Milk Latte, 1× Croissant', type: 'Dine-in', amount: 66000, status: 'PAID', customer: 'Priya S.', tier: 'GOLD', timeAgo: '2m ago' },
  { id: '1041', items: '1× Cold Brew Black', type: 'Takeaway', amount: 18000, status: 'PREPARING', customer: 'Arjun M.', tier: 'SILVER', timeAgo: '6m ago' },
  { id: '1040', items: '3× Masala Chai, 2× Samosa', type: 'Dine-in', amount: 42000, status: 'READY', customer: 'Sneha I.', tier: 'BRONZE', timeAgo: '11m ago' },
  { id: '1039', items: '1× Cappuccino, 1× Muffin', type: 'Takeaway', amount: 34000, status: 'PAID', customer: 'Rahul K.', tier: 'GOLD', timeAgo: '18m ago' },
  { id: '1038', items: '2× Cappuccino', type: 'Dine-in', amount: 44000, status: 'PAID', customer: 'Walk-in', tier: 'BRONZE', timeAgo: '24m ago' },
];

/* ──────────────────────────── components ──────────────────────────── */

function DeltaChip({ delta }: { delta: number }) {
  const positive = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill text-[10px] font-semibold ${
        positive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
      }`}
    >
      <TrendingUp size={10} className={positive ? '' : 'rotate-180'} />
      {positive ? '+' : ''}
      {delta}%
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const normalized = tier.charAt(0) + tier.slice(1).toLowerCase();
  const styles: Record<string, string> = {
    Bronze: 'bg-[#B08D57]/10 text-[#B08D57]',
    Silver: 'bg-[#8E9BAE]/10 text-[#8E9BAE]',
    Gold: 'bg-[#E6A817]/10 text-[#E6A817]',
    Platinum: 'bg-[#6C5CE7]/10 text-[#6C5CE7]',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-semibold tracking-wide ${styles[normalized] || styles.Bronze}`}>
      {normalized}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-bg-subtle text-ink-2 border border-border',
    PREPARING: 'bg-amber-soft text-amber',
    READY: 'bg-info-soft text-info',
    COMPLETED: 'bg-success-soft text-success',
    CANCELLED: 'bg-error-soft text-error',
  };
  return (
    <span className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold tracking-wide ${styles[status] || 'bg-bg-subtle text-ink-3'}`}>
      {status}
    </span>
  );
}

function TypePill({ type }: { type: string }) {
  return (
    <span className="px-2 py-0.5 rounded-pill text-[11px] font-medium bg-bg-subtle text-ink-2 border border-border">
      {type}
    </span>
  );
}

function RevenueChart({ series }: { series?: { y: number }[] }) {
  const W = 560;
  const H = 160;
  const padX = 0;
  const padY = 8;

  const src = series && series.length > 1 ? series : CHART_POINTS;
  const points = src.map((p, i) => ({
    x: padX + (i / (src.length - 1)) * (W - padX * 2),
    y: padY + (p.y / 80) * (H - padY * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${W}/${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B4A" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#FF6B4A" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={0}
            y1={H * r}
            x2={W}
            y2={H * r}
            stroke="#E6E9F2"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}
        {/* Area */}
        <path d={areaPath} fill="url(#areaGrad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#FF6B4A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* End dot */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill="#FF6B4A" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={8} fill="#FF6B4A" opacity={0.2} />
      </svg>
      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[10px] text-ink-3 tabular-nums">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
      </div>
    </div>
  );
}

function TopItemsChart({ items }: { items?: { name: string; count: number; percent: number }[] }) {
  const src = items && items.length > 0 ? items : TOP_ITEMS;
  return (
    <div className="space-y-3">
      {src.map((item) => {
        return (
          <div key={item.name} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
              <Coffee size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-ink truncate">{item.name}</span>
                <span className="text-xs font-semibold text-ink-2 tabular-nums ml-2 shrink-0">{item.count} sold</span>
              </div>
              <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                <div
                  className="h-full rounded-full gradient-coral transition-all duration-500 ease-out"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderVolumeHeatmap({ data }: { data: { day: number; hour: number; count: number }[] }) {
  if (!data || data.length === 0) return null;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[500px]">
        {/* X Axis: Hours */}
        <div className="flex ml-8 text-[10px] text-ink-3 tabular-nums mb-1">
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="flex-1 text-center">
              {h % 2 === 0 ? `${h}` : ''}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="space-y-1">
          {days.map((dayLabel, d) => (
            <div key={d} className="flex items-center">
              <span className="w-8 text-[10px] text-ink-3 text-right pr-2">{dayLabel}</span>
              <div className="flex-1 flex gap-1">
                {Array.from({ length: 24 }).map((_, h) => {
                  const cell = data.find((c) => c.day === d && c.hour === h);
                  const count = cell?.count || 0;
                  const opacity = count === 0 ? 0.05 : 0.2 + (count / maxCount) * 0.8;
                  return (
                    <div
                      key={h}
                      className="flex-1 aspect-square rounded-sm"
                      style={{ backgroundColor: `rgba(255, 107, 74, ${opacity})` }}
                      title={`${dayLabel} ${h}:00 - ${count} orders`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── page ──────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const [range, setRange] = useState<RangeKey>('today');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const stopImpersonating = async () => {
    const res = await fetch('/api/admin/impersonate', { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/summary?range=${range}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range]);

  const statsList = data?.stats ? [
    { id: 'orders', icon: ShoppingBag, label: 'Direct Orders', value: data.stats.orders.toString(), delta: null },
    { id: 'revenue', icon: BadgeIndianRupee, label: 'Direct Revenue', value: formatINR(data.stats.revenue), delta: null },
    { id: 'commission', icon: PiggyBank, label: 'Commission Saved', value: formatINR(data.stats.commissionSaved), delta: null, hero: true, subtitle: 'vs 25% marketplace rate' },
    { id: 'repeat', icon: Repeat2, label: 'Repeat Rate', value: `${data.stats.repeatRate}%`, delta: null },
    { id: 'streaks', icon: Flame, label: 'Active Streaks', value: data.stats.activeStreaks.toString(), delta: null },
    { id: 'new', icon: UserPlus, label: 'New Customers', value: data.stats.newCustomers.toString(), delta: null },
  ] : STATS[range];

  const recentOrders = data?.recentOrders || RECENT_ORDERS;
  const cafeName = data?.cafe?.name || "Haku's Coffeehouse";

  // Real chart data (falls back to the mock arrays inside the chart components).
  const revenueSeries: { y: number }[] | undefined = (() => {
    const cd = data?.chartData as { revenue: number }[] | undefined;
    if (!cd || cd.length < 2) return undefined;
    const max = Math.max(...cd.map((d) => d.revenue), 1);
    return cd.map((d) => ({ y: (d.revenue / max) * 80 }));
  })();
  const topItems = data?.topItems as { name: string; count: number; percent: number }[] | undefined;

  return (
    <div className="min-h-full">
      {data?.isImpersonating && (
        <div className="bg-[#6C5CE7] text-white text-xs font-semibold px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm z-50">
          <span>You are currently impersonating <strong>{cafeName}</strong>. Every action is recorded in the platform audit log.</span>
          <button onClick={stopImpersonating} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded transition-colors font-bold uppercase tracking-wider text-[10px]">
            Stop Impersonating
          </button>
        </div>
      )}
      {/* ─── Top bar ─── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          {/* Cafe identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-card bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-lg">☕</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base lg:text-lg text-ink leading-tight">
                  {cafeName}
                </h1>
                <span className="status-dot status-dot--open" title="Open" />
              </div>
              <p className="text-xs text-ink-3 hidden sm:block">Koramangala, Bangalore</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Range toggle */}
            <div className="hidden sm:flex items-center bg-bg-subtle rounded-pill p-1 border border-border">
              {(['today', '7d', '30d'] as RangeKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setRange(key)}
                  className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all duration-150 ease-out min-w-[52px] ${
                    range === key
                      ? 'bg-white text-ink shadow-card'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  {key === 'today' ? 'Today' : key === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>

            {/* Avatar */}
            <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold ring-2 ring-primary/20 transition-transform hover:scale-105">
              H
            </button>
          </div>
        </div>

        {/* Mobile range toggle */}
        <div className="sm:hidden flex items-center gap-2 px-4 pb-3">
          <div className="flex items-center bg-bg-subtle rounded-pill p-1 border border-border w-full">
            {(['today', '7d', '30d'] as RangeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`flex-1 px-3 py-1.5 rounded-pill text-xs font-semibold transition-all duration-150 ease-out ${
                  range === key
                    ? 'bg-white text-ink shadow-card'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {key === 'today' ? 'Today' : key === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Main content ─── */}
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-[1400px]">

        {/* ─── Stat cards grid ─── */}
        {loading ? <div className="animate-pulse h-32 bg-bg-subtle rounded-card w-full" /> : 
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
          {statsList.map((stat: any) => {
            const Icon = stat.icon;
            const isHero = stat.hero;

            if (isHero) {
              return (
                <div
                  key={stat.id}
                  className="col-span-2 lg:col-span-2 relative overflow-hidden rounded-card p-5 lg:p-6 bg-gradient-to-br from-success/[0.06] to-success/[0.02] border-2 border-success/20 shadow-card group transition-shadow hover:shadow-pop"
                >
                  {/* Background glow */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-success/10 blur-2xl" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-control bg-success/10 flex items-center justify-center">
                        <Icon size={20} className="text-success" />
                      </div>
                      <span className="text-xs font-semibold text-success uppercase tracking-wider">
                        {stat.label}
                      </span>
                    </div>
                    <p className="stat-number text-2xl lg:text-3xl text-success mb-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-ink-2 font-medium">
                      {stat.subtitle}
                    </p>
                  </div>

                  {/* Decorative corner */}
                  <div className="absolute bottom-2 right-3 text-success/10">
                    <PiggyBank size={56} strokeWidth={1} />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={stat.id}
                className="col-span-1 rounded-card bg-white p-4 lg:p-5 shadow-card border border-transparent hover:border-border transition-all hover:shadow-pop group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-control bg-bg-subtle flex items-center justify-center group-hover:bg-primary-soft transition-colors">
                    <Icon size={16} className="text-ink-3 group-hover:text-primary transition-colors" />
                  </div>
                  {stat.delta !== null && <DeltaChip delta={stat.delta} />}
                </div>
                <p className="stat-number text-xl lg:text-2xl text-ink mb-0.5">
                  {stat.value}
                </p>
                <p className="text-xs text-ink-3 font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>
        }

        {/* ─── Charts section ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Revenue chart */}
          <div className="lg:col-span-3 rounded-card bg-white p-5 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-base text-ink">Revenue Trend</h2>
                <p className="text-xs text-ink-3 mt-0.5">Direct orders this week</p>
              </div>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-medium text-ink-2 bg-bg-subtle border border-border hover:bg-bg-hover transition-colors">
                This Week
                <ChevronDown size={14} />
              </button>
            </div>
            <RevenueChart series={revenueSeries} />
          </div>

          {/* Top items */}
          <div className="lg:col-span-2 rounded-card bg-white p-5 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-base text-ink">Top Items</h2>
                <p className="text-xs text-ink-3 mt-0.5">Most ordered this week</p>
              </div>
            </div>
            <TopItemsChart items={topItems} />
          </div>
        </div>

        {/* ─── Heatmap ─── */}
        <div className="rounded-card bg-white p-5 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-base text-ink">Order Volume Heatmap</h2>
                <p className="text-xs text-ink-3 mt-0.5">Peak ordering hours over this period</p>
              </div>
            </div>
            {data?.heatmapData ? (
                <OrderVolumeHeatmap data={data.heatmapData} />
            ) : (
                <div className="animate-pulse h-40 bg-bg-subtle rounded-card" />
            )}
        </div>

        {/* ─── Live feed ─── */}
        <div className="rounded-card bg-white shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
              </div>
              <h2 className="font-display font-bold text-base text-ink">Live Orders</h2>
              <span className="px-2 py-0.5 rounded-pill bg-bg-subtle text-ink-3 text-[11px] font-semibold border border-border tabular-nums">
                Last 5
              </span>
            </div>
            <button className="text-xs font-medium text-primary hover:text-primary-hover transition-colors">
              View All →
            </button>
          </div>

          {/* Orders table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-bg-subtle/60">
                  <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-5 py-2.5">Order</th>
                  <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Items</th>
                  <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Type</th>
                  <th className="text-right text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Amount</th>
                  <th className="text-center text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Status</th>
                  <th className="text-left text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-3 py-2.5">Customer</th>
                  <th className="text-right text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-5 py-2.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="hover:bg-bg-subtle/40 transition-colors group"
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-ink tabular-nums">#{order.id}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm text-ink">{order.items}</span>
                    </td>
                    <td className="px-3 py-3">
                      <TypePill type={order.type} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-semibold text-ink tabular-nums">{formatINR(order.amount)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ink font-medium">{order.customer}</span>
                        <TierBadge tier={order.tier} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-xs text-ink-3">
                        <Clock size={12} />
                        {order.timeAgo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom spacer for mobile */}
        <div className="h-4" />
      </div>
    </div>
  );
}
