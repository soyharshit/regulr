'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const COLUMNS = [
  { key: 'PENDING', label: 'Pending', testId: 'column-pending' },
  { key: 'PREPARING', label: 'Preparing', testId: 'column-preparing' },
  { key: 'READY', label: 'Ready', testId: 'column-ready' },
  { key: 'COMPLETED', label: 'Completed', testId: 'column-completed' },
] as const;

interface OrderCard {
  id: string;
  status: string;
  totalAmount: number;
  tableNumber?: number | null;
  createdAt: string;
  customer?: { user?: { name?: string | null } };
  orderItems: { quantity: number; menuItem: { name: string } }[];
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
  const [orders, setOrders] = useState<OrderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const knownIds = useRef(new Set<string>());

  const loadOrders = useCallback(async () => {
    const res = await fetch('/api/dashboard/summary?range=today');
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCafeId(data.cafe.id);

    const ordersRes = await fetch(`/api/orders?cafeId=${data.cafe.id}`);
    if (!ordersRes.ok) return;
    const list = (await ordersRes.json()) as OrderCard[];

    for (const order of list) {
      if (order.status === 'PENDING' && !knownIds.current.has(order.id)) {
        knownIds.current.add(order.id);
        if (knownIds.current.size > 1) {
          playNewOrderSound();
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('New order', { body: `Order #${order.id.slice(0, 8)} received` });
          }
        }
      }
    }

    setOrders(list.filter((o) => o.status !== 'CANCELLED'));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
    loadOrders();
    const timer = setInterval(loadOrders, 5000);
    return () => clearInterval(timer);
  }, [loadOrders]);

  const advance = async (orderId: string, status: string) => {
    if (!cafeId) return;
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeId, status }),
    });
    loadOrders();
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
          const colOrders = orders.filter((o) => o.status === col.key);
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
