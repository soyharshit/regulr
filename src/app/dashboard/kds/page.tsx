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

export default function KDSPage() {
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
        }
      }
    }

    setOrders(list.filter((o) => o.status !== 'CANCELLED'));
    setLoading(false);
  }, []);

  useEffect(() => {
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
      <div className="p-4 space-y-4 h-full bg-slate-900">
        <div className="animate-pulse h-8 w-48 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-96 bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 min-h-screen bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl tracking-tight text-white">Kitchen Display System</h1>
        <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Live
            </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key);
          return (
            <div
              key={col.key}
              className="flex flex-col rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">{col.label}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-white font-bold tabular-nums">
                    {colOrders.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {colOrders.map((order) => {
                  const next = nextStatus(order.status);
                  return (
                    <div key={order.id} className="rounded-xl bg-slate-800 p-5 shadow-lg border border-slate-700 hover:border-slate-600 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-xl text-white">#{order.id.slice(0, 5)}</p>
                        {order.tableNumber != null ? (
                          <span className="text-sm font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Table {order.tableNumber}
                          </span>
                        ) : (
                          <span className="text-sm font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Takeaway
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 mb-4">
                        {order.orderItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-lg">
                                <span className="font-medium text-slate-200">{item.menuItem.name}</span>
                                <span className="font-bold text-white bg-slate-700 px-2 rounded">x{item.quantity}</span>
                            </div>
                        ))}
                      </div>
                      
                      {next && (
                        <button
                          type="button"
                          onClick={() => advance(order.id, next)}
                          className="w-full py-3 rounded-lg bg-green-600 text-white text-lg font-bold hover:bg-green-500 active:scale-95 transition-all"
                        >
                          {col.key === 'PENDING' ? 'Start Preparing' : col.key === 'PREPARING' ? 'Mark Ready' : 'Complete'}
                        </button>
                      )}
                    </div>
                  );
                })}
                {colOrders.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 pb-10">
                        <p className="font-medium">No orders</p>
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
