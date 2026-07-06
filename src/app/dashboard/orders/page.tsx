'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const COLUMNS = [
  { key: 'PENDING', label: 'Pending', testId: 'column-pending' },
  { key: 'PREPARING', label: 'Preparing', testId: 'column-preparing' },
  { key: 'READY', label: 'Ready', testId: 'column-ready' },
  { key: 'COMPLETED', label: 'Completed', testId: 'column-completed' },
] as const;

const PAGE_SIZE = 15;

interface OrderCard {
  id: string;
  status: string;
  totalAmount: number;
  tableNumber?: number | null;
  createdAt: string;
  customer?: { user?: { name?: string | null } };
  orderItems: { quantity: number; menuItem: { name: string } }[];
}

interface ColumnState {
  orders: OrderCard[];
  page: number;
  totalPages: number;
}

function playNewOrderSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    /* audio optional */
  }
}

function formatPaise(p: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p / 100);
}

export default function OrdersKanbanPage() {
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [columns, setColumns] = useState<Record<string, ColumnState>>({
    PENDING: { orders: [], page: 1, totalPages: 1 },
    PREPARING: { orders: [], page: 1, totalPages: 1 },
    READY: { orders: [], page: 1, totalPages: 1 },
    COMPLETED: { orders: [], page: 1, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const knownIds = useRef(new Set<string>());

  const fetchColumn = useCallback(async (status: string, page: number) => {
    const res = await fetch(`/api/orders?status=${status}&page=${page}&limit=${PAGE_SIZE}`);
    if (!res.ok) return { data: [], total: 0, totalPages: 1 };
    const d = await res.json();
    if (Array.isArray(d)) return { data: d, total: d.length, totalPages: 1 };
    return d;
  }, []);

  const loadAllColumns = useCallback(async () => {
    const summaryRes = await fetch('/api/dashboard/summary?range=today');
    if (!summaryRes.ok) { setLoading(false); return; }
    const data = await summaryRes.json();
    setCafeId(data.cafe.id);

    const results = await Promise.all(
      COLUMNS.map(async (col) => {
        const res = await fetchColumn(col.key, 1);
        return { key: col.key, ...res };
      })
    );

    for (const r of results) {
      if (r.key === 'PENDING') {
        for (const order of r.data) {
          if (!knownIds.current.has(order.id)) {
            knownIds.current.add(order.id);
            if (knownIds.current.size > 1) {
              playNewOrderSound();
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('New order', { body: `Order #${order.id.slice(0, 8)} received` });
              }
            }
          }
        }
      }
    }

    setColumns((prev) => {
      const next = { ...prev };
      for (const r of results) {
        next[r.key] = { orders: r.data, page: 1, totalPages: r.totalPages };
      }
      return next;
    });
    setLoading(false);
  }, [fetchColumn]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
    loadAllColumns();
    const timer = setInterval(loadAllColumns, 5000);
    return () => clearInterval(timer);
  }, [loadAllColumns]);

  const loadMore = async (status: string) => {
    const col = columns[status];
    if (col.page >= col.totalPages) return;
    const next = col.page + 1;
    const res = await fetchColumn(status, next);
    setColumns((prev) => ({
      ...prev,
      [status]: {
        orders: [...prev[status].orders, ...res.data],
        page: next,
        totalPages: res.totalPages,
      },
    }));
  };

  const advance = async (orderId: string, status: string) => {
    if (!cafeId) return;
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeId, status }),
    });
    loadAllColumns();
  };

  const nextStatus = (current: string): string | null => {
    const flow = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];
    const idx = flow.indexOf(current);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-8 w-48 rounded-control" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-64 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <h1 className="font-display font-bold text-xl text-ink mb-4">Live Order Queue</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colState = columns[col.key];
          const colOrders = colState.orders;
          const hasMore = colState.page < colState.totalPages;
          return (
            <div
              key={col.key}
              className="rounded-card bg-bg-subtle border border-border p-3 min-h-[320px]"
              data-testid={col.testId}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-ink">{col.label}</h2>
                <span className="text-xs font-semibold text-ink-3 tabular-nums">{colOrders.length}</span>
              </div>
              <div className="space-y-2">
                {colOrders.map((order) => {
                  const next = nextStatus(order.status);
                  const items = order.orderItems
                    .map((i) => `${i.menuItem.name} x${i.quantity}`)
                    .join(', ');
                  return (
                    <div key={order.id} className="rounded-control bg-white p-3 shadow-card text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-ink">#{order.id.slice(0, 8)}</p>
                        {order.tableNumber != null ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-pill bg-primary-soft text-primary">
                            Table {order.tableNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-pill bg-bg-subtle text-ink-3 border border-border">
                            Takeaway
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-3 mt-1 line-clamp-2">{items}</p>
                      <p className="text-xs text-ink-2 mt-1">
                        {order.customer?.user?.name || 'Walk-in'} · {formatPaise(order.totalAmount)}
                      </p>
                      {next && (
                        <button
                          type="button"
                          onClick={() => advance(order.id, next)}
                          className="mt-2 w-full py-1.5 rounded-control bg-primary text-white text-xs font-semibold hover:bg-primary-hover"
                          data-testid={`advance-${order.id.slice(0, 8)}`}
                        >
                          Move to {next.charAt(0) + next.slice(1).toLowerCase()}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => loadMore(col.key)}
                  className="mt-2 w-full py-1.5 rounded-control border border-border text-xs font-medium text-ink-2 hover:bg-white transition-colors"
                >
                  Load more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
