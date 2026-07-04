'use client';

import { useState } from 'react';
import {
  Store,
  IndianRupee,
  Percent,
  ShoppingBag,
  Gamepad2,
  Search,
  Eye,
  UserCog,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Format number with Indian grouping: ₹1,04,500 */
function formatINR(n: number): string {
  const s = n.toString();
  if (s.length <= 3) return '₹' + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return '₹' + grouped + ',' + last3;
}

function formatNum(n: number): string {
  return n.toLocaleString('en-IN');
}

/* ------------------------------------------------------------------ */
/*  Types & Mock Data                                                 */
/* ------------------------------------------------------------------ */

type CafeStatus = 'trial' | 'active' | 'past-due' | 'suspended';
type HealthColor = 'green' | 'amber' | 'red';

interface Cafe {
  name: string;
  slug: string;
  city: string;
  plan: string;
  mrr: number;
  lastActivity: string;
  orders7d: number;
  status: CafeStatus;
}

const CAFES: Cafe[] = [
  {
    name: "Haku's Coffeehouse",
    slug: 'demo',
    city: 'Bengaluru',
    plan: 'Growth',
    mrr: 5000,
    lastActivity: '2 hours ago',
    orders7d: 48,
    status: 'active',
  },
  {
    name: 'The Brew Room',
    slug: 'brewroom',
    city: 'Mumbai',
    plan: 'Pro',
    mrr: 3500,
    lastActivity: '5 hours ago',
    orders7d: 23,
    status: 'active',
  },
  {
    name: 'Cafe Latte',
    slug: 'cafelatte',
    city: 'Pune',
    plan: 'Starter',
    mrr: 1500,
    lastActivity: '1 day ago',
    orders7d: 7,
    status: 'past-due',
  },
  {
    name: 'Morning Mist',
    slug: 'morningmist',
    city: 'Hyderabad',
    plan: 'Growth',
    mrr: 5000,
    lastActivity: '3 days ago',
    orders7d: 0,
    status: 'trial',
  },
  {
    name: 'Bean & Leaf',
    slug: 'beanleaf',
    city: 'Jaipur',
    plan: 'Pro',
    mrr: 4000,
    lastActivity: '12 hours ago',
    orders7d: 15,
    status: 'active',
  },
];

const STATUS_FILTERS: { label: string; value: CafeStatus | 'all'; count: number }[] = [
  { label: 'All', value: 'all', count: 47 },
  { label: 'Trial', value: 'trial', count: 3 },
  { label: 'Active', value: 'active', count: 38 },
  { label: 'Past Due', value: 'past-due', count: 4 },
  { label: 'Suspended', value: 'suspended', count: 2 },
];

interface StatCardData {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: { value: string; up: boolean };
  iconColor: string;
  iconBg: string;
}

const STATS: StatCardData[] = [
  {
    label: 'Total Cafes',
    value: '47',
    icon: Store,
    trend: { value: '+3', up: true },
    iconColor: '#6C5CE7',
    iconBg: '#F0EEFF',
  },
  {
    label: 'Active Cafes',
    value: '38',
    icon: Store,
    trend: { value: '+2', up: true },
    iconColor: '#00C875',
    iconBg: '#E6F9F0',
  },
  {
    label: 'MRR',
    value: formatINR(19000),
    icon: IndianRupee,
    trend: { value: '+12%', up: true },
    iconColor: '#6C5CE7',
    iconBg: '#F0EEFF',
  },
  {
    label: 'Churn (30d)',
    value: '2.1%',
    icon: Percent,
    trend: { value: '-0.3%', up: true },
    iconColor: '#E2445C',
    iconBg: '#FDE8EB',
  },
  {
    label: 'GMV (30d)',
    value: formatINR(482000),
    icon: ShoppingBag,
    trend: { value: '+18%', up: true },
    iconColor: '#00C4A7',
    iconBg: '#E6FAF6',
  },
  {
    label: 'Game Engagement',
    value: '72%',
    icon: Gamepad2,
    trend: { value: '+5%', up: true },
    iconColor: '#FFB020',
    iconBg: '#FFF8E6',
  },
];

/* ------------------------------------------------------------------ */
/*  Stat Card Component                                               */
/* ------------------------------------------------------------------ */

function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = stat.icon;
  return (
    <div className="bg-white rounded-card shadow-card p-5 flex flex-col gap-3 hover:shadow-pop transition-shadow duration-200 group">
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-control flex items-center justify-center transition-transform duration-150 group-hover:scale-105"
          style={{ backgroundColor: stat.iconBg }}
        >
          <Icon size={20} style={{ color: stat.iconColor }} />
        </div>
        {stat.trend && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold ${
              stat.trend.up ? 'text-success' : 'text-error'
            }`}
          >
            {stat.trend.up ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            <span>{stat.trend.value}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-ink-2 font-medium mb-1">{stat.label}</p>
        <p className="stat-number text-xl text-ink">{stat.value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Health Dot                                                        */
/* ------------------------------------------------------------------ */

function HealthDot({ orders }: { orders: number }) {
  let color: HealthColor;
  let label: string;
  if (orders > 10) {
    color = 'green';
    label = 'Healthy';
  } else if (orders >= 1) {
    color = 'amber';
    label = 'Low activity';
  } else {
    color = 'red';
    label = 'Inactive';
  }

  const colorMap: Record<HealthColor, { dot: string; glow: string }> = {
    green: { dot: 'bg-success', glow: 'shadow-[0_0_6px_rgba(0,200,117,0.5)]' },
    amber: { dot: 'bg-amber', glow: 'shadow-[0_0_6px_rgba(255,176,32,0.5)]' },
    red: { dot: 'bg-error', glow: 'shadow-[0_0_6px_rgba(226,68,92,0.5)]' },
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${colorMap[color].dot} ${colorMap[color].glow}`}
        title={label}
      />
      <span className="text-xs text-ink-3 hidden xl:inline">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                      */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: CafeStatus }) {
  const styles: Record<CafeStatus, string> = {
    trial: 'bg-[#F0EEFF] text-[#6C5CE7]',
    active: 'bg-success-soft text-success',
    'past-due': 'bg-amber-soft text-amber',
    suspended: 'bg-error-soft text-error',
  };

  const labels: Record<CafeStatus, string> = {
    trial: 'Trial',
    active: 'Active',
    'past-due': 'Past Due',
    suspended: 'Suspended',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const [activeFilter, setActiveFilter] = useState<CafeStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCafes = CAFES.filter((cafe) => {
    const matchesFilter = activeFilter === 'all' || cafe.status === activeFilter;
    const matchesSearch =
      searchQuery === '' ||
      cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cafe.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cafe.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="hidden lg:flex items-center justify-between h-16 px-6 bg-white border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-bold text-lg text-ink tracking-tight">
            Regulr Admin
          </h1>
          <span className="inline-flex items-center px-2.5 py-1 rounded-pill text-[10px] font-bold tracking-widest uppercase bg-[#6C5CE7] text-white">
            SUPERADMIN
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-2">admin@regulr.in</span>
          <div className="w-9 h-9 rounded-full bg-[#6C5CE7] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
            <span className="text-white text-xs font-semibold">SA</span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <div className="p-4 lg:p-6 max-w-[1440px] mx-auto space-y-6">
        {/* Page title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl text-ink">
              Platform Overview
            </h2>
            <p className="text-sm text-ink-2 mt-0.5">
              Real-time metrics across all Regulr cafes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-sm font-medium text-ink-2 bg-white border border-border hover:bg-bg-hover transition-colors duration-150">
              Last 30 days
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Cafes Section */}
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          {/* Section header */}
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-display font-semibold text-base text-ink">
                  Cafes
                </h3>
                <p className="text-xs text-ink-3 mt-0.5">
                  {formatNum(47)} cafes on the platform
                </p>
              </div>
              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                />
                <input
                  type="text"
                  placeholder="Search cafes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full sm:w-[220px] pl-9 pr-3 rounded-control border border-border bg-bg-subtle text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7] transition-all duration-150"
                />
              </div>
            </div>

            {/* Status filter chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`
                    inline-flex items-center gap-1.5 h-8 px-3 rounded-pill text-sm font-medium
                    transition-all duration-150 ease-out press-scale
                    ${
                      activeFilter === filter.value
                        ? 'bg-[#6C5CE7] text-white shadow-sm'
                        : 'bg-bg-subtle text-ink-2 hover:bg-bg-hover border border-transparent hover:border-border'
                    }
                  `}
                >
                  {filter.label}
                  <span
                    className={`tabular-nums text-xs font-semibold px-1.5 py-0.5 rounded-pill ${
                      activeFilter === filter.value
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-ink-3'
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table (desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-subtle">
                  <th className="text-left text-xs font-semibold text-ink-3 uppercase tracking-wider px-5 py-3">
                    Name / Slug
                  </th>
                  <th className="text-left text-xs font-semibold text-ink-3 uppercase tracking-wider px-5 py-3">
                    City
                  </th>
                  <th className="text-left text-xs font-semibold text-ink-3 uppercase tracking-wider px-5 py-3">
                    Plan
                  </th>
                  <th className="text-right text-xs font-semibold text-ink-3 uppercase tracking-wider px-5 py-3">
                    MRR
                  </th>
                  <th className="text-left text-xs font-semibold text-ink-3 uppercase tracking-wider px-5 py-3">
                    Last Activity
                  </th>
                  <th className="text-right text-xs font-semibold text-ink-3 uppercase tracking-wider px-5 py-3">
                    7d Orders
                  </th>
                  <th className="text-center text-xs font-semibold text-ink-3 uppercase tracking-wider px-5 py-3">
                    Health
                  </th>
                  <th className="text-right text-xs font-semibold text-ink-3 uppercase tracking-wider px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCafes.map((cafe) => (
                  <tr
                    key={cafe.slug}
                    className="group hover:bg-bg-subtle/60 transition-colors duration-100"
                  >
                    {/* Name + Slug */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-control bg-bg-subtle flex items-center justify-center flex-shrink-0 group-hover:bg-[#F0EEFF] transition-colors">
                          <Store size={16} className="text-ink-3 group-hover:text-[#6C5CE7] transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">
                            {cafe.name}
                          </p>
                          <p className="text-xs text-ink-3 font-mono">
                            /{cafe.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* City */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-2">{cafe.city}</span>
                    </td>
                    {/* Plan */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={cafe.status} />
                      <span className="text-xs text-ink-3 ml-2">{cafe.plan}</span>
                    </td>
                    {/* MRR */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="tabular-nums text-sm font-semibold text-ink">
                        {formatINR(cafe.mrr)}
                      </span>
                    </td>
                    {/* Last Activity */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-ink-2">
                        {cafe.lastActivity}
                      </span>
                    </td>
                    {/* 7d Orders */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="tabular-nums text-sm font-semibold text-ink">
                        {cafe.orders7d}
                      </span>
                    </td>
                    {/* Health */}
                    <td className="px-5 py-3.5">
                      <div className="flex justify-center">
                        <HealthDot orders={cafe.orders7d} />
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button className="inline-flex items-center gap-1 h-8 px-3 rounded-control text-xs font-medium text-ink-2 bg-bg-subtle hover:bg-bg-hover border border-border transition-colors duration-150">
                          <Eye size={13} />
                          View
                        </button>
                        <button className="inline-flex items-center gap-1 h-8 px-3 rounded-control text-xs font-medium text-white bg-[#6C5CE7] hover:bg-[#5A4BD1] transition-colors duration-150">
                          <UserCog size={13} />
                          Impersonate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCafes.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-ink-3"
                    >
                      No cafes match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {filteredCafes.map((cafe) => (
              <div key={cafe.slug} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-control bg-bg-subtle flex items-center justify-center flex-shrink-0">
                      <Store size={18} className="text-ink-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {cafe.name}
                      </p>
                      <p className="text-xs text-ink-3 font-mono">/{cafe.slug}</p>
                    </div>
                  </div>
                  <HealthDot orders={cafe.orders7d} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">
                      City
                    </p>
                    <p className="text-sm text-ink mt-0.5">{cafe.city}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">
                      MRR
                    </p>
                    <p className="tabular-nums text-sm font-semibold text-ink mt-0.5">
                      {formatINR(cafe.mrr)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">
                      7d Orders
                    </p>
                    <p className="tabular-nums text-sm font-semibold text-ink mt-0.5">
                      {cafe.orders7d}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={cafe.status} />
                    <span className="text-xs text-ink-3">{cafe.plan}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="inline-flex items-center justify-center w-9 h-9 rounded-control bg-bg-subtle hover:bg-bg-hover border border-border transition-colors">
                      <Eye size={15} className="text-ink-2" />
                    </button>
                    <button className="inline-flex items-center justify-center w-9 h-9 rounded-control bg-[#6C5CE7] hover:bg-[#5A4BD1] transition-colors">
                      <UserCog size={15} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredCafes.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-ink-3">
                No cafes match your filters
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
