'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, Clock } from 'lucide-react';

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  available: boolean;
  quantity: number;
}

interface CustomerOrder {
  id: string;
  status: string;
  totalAmount: number;
  pointsEarned: number;
  tableNumber: number | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-soft text-amber',
  PREPARING: 'bg-amber-soft text-amber',
  READY: 'bg-info-soft text-info',
  COMPLETED: 'bg-success-soft text-success',
  CANCELLED: 'bg-error-soft text-error',
};

function formatRupee(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  );
}

export default function MyOrdersClient({ cafe }: { cafe: { id: string; name: string; slug: string } }) {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);

  useEffect(() => {
    fetch(`/api/customer/orders?slug=${encodeURIComponent(cafe.slug)}`)
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders || []))
      .catch(() => setOrders([]));
  }, [cafe.slug]);

  const reorder = (order: CustomerOrder) => {
    const cart = order.items
      .filter((it) => it.available)
      .map((it) => ({
        menuItem: { id: it.menuItemId, name: it.name, price: it.price },
        quantity: it.quantity,
      }));
    if (cart.length === 0) return;
    localStorage.setItem(`cart_${cafe.id}`, JSON.stringify(cart));
    router.push(`/store/${cafe.slug}/checkout`);
  };

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => router.push(`/store/${cafe.slug}`)}
          className="flex items-center text-ink-2 mb-6 mt-2 text-sm font-medium"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to {cafe.name}
        </button>

        <h1 className="font-display text-2xl font-bold mb-5 text-ink">My orders</h1>

        {orders === null && <p className="text-sm text-ink-3">Loading…</p>}
        {orders !== null && orders.length === 0 && (
          <div className="bg-white rounded-card shadow-card p-6 text-center">
            <p className="text-sm text-ink-2">No orders yet.</p>
            <a href={`/store/${cafe.slug}`} className="text-sm text-primary font-medium mt-1 inline-block">
              Browse the menu →
            </a>
          </div>
        )}

        <div className="space-y-3">
          {orders?.map((order) => (
            <div key={order.id} className="bg-white rounded-card shadow-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">#{order.id.slice(0, 8)}</span>
                <span className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold ${STATUS_STYLES[order.status] || 'bg-bg-subtle text-ink-3'}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-ink-3 mt-1 flex items-center gap-1">
                <Clock size={11} />
                {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {order.tableNumber != null && <span>· Table {order.tableNumber}</span>}
              </p>
              <p className="text-sm text-ink mt-2">
                {order.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
              </p>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border">
                <span className="text-sm font-bold text-ink">{formatRupee(order.totalAmount)}</span>
                <button
                  type="button"
                  onClick={() => reorder(order)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-primary-soft text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors"
                >
                  <RotateCcw size={13} /> Reorder
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
