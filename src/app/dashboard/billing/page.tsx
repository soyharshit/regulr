'use client';

import { useEffect, useMemo, useState } from 'react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export default function BillingPage() {
  const [cafeId, setCafeId] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [payment, setPayment] = useState('CASH');

  useEffect(() => {
    fetch('/api/dashboard/summary?slug=brew-haven')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (d) => {
        if (!d?.cafe?.id) return;
        setCafeId(d.cafe.id);
        const res = await fetch(`/api/menu?cafeId=${d.cafe.id}`);
        const items = res.ok ? await res.json() : [];
        setMenu(Array.isArray(items) ? items : []);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () => menu.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())),
    [menu, search]
  );

  const total = cart.reduce((sum, line) => {
    const item = menu.find((m) => m.id === line.id);
    return sum + (item ? item.price * line.qty : 0);
  }, 0);

  const addItem = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id, qty: 1 }];
    });
  };

  const submitBill = async () => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cafeId,
        paymentMethod: payment,
        items: cart.map((l) => ({ menuItemId: l.id, quantity: l.qty })),
      }),
    });
    const order = await res.json();
    if (!res.ok) return;
    const lines = cart
      .map((l) => {
        const item = menu.find((m) => m.id === l.id);
        return `${item?.name} x${l.qty} — ₹${((item?.price || 0) * l.qty) / 100}`;
      })
      .join('\n');
    setInvoice(`Invoice #${order.id.slice(0, 8)}\n${lines}\nTotal: ₹${total / 100}\nPayment: ${payment}`);
    setCart([]);
  };

  const downloadPdf = () => {
    if (!invoice) return;
    const blob = new Blob([invoice], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-2xl">
      <h1 className="font-display font-bold text-xl text-ink">Walk-in Billing</h1>
      <input
        placeholder="Search menu items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-control border border-border text-sm"
        data-testid="billing-search-item"
      />
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {filtered.slice(0, 8).map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => addItem(item.id)}
            className="w-full flex justify-between px-4 py-2 rounded-control bg-white border border-border text-sm hover:bg-bg-subtle"
            data-testid={idx === 0 ? 'add-billing-item-0' : undefined}
          >
            <span>{item.name}</span>
            <span className="tabular-nums">₹{item.price / 100}</span>
          </button>
        ))}
      </div>
      <div className="rounded-card bg-white p-4 shadow-card space-y-2">
        {cart.map((line) => {
          const item = menu.find((m) => m.id === line.id);
          return (
            <div key={line.id} className="flex justify-between text-sm">
              <span>{item?.name} x{line.qty}</span>
              <span>₹{((item?.price || 0) * line.qty) / 100}</span>
            </div>
          );
        })}
        <p className="font-bold text-ink pt-2 border-t border-border">Total: ₹{total / 100}</p>
        <div className="flex gap-2">
          {['CASH', 'UPI'].map((m) => (
            <label key={m} className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="billing-payment"
                checked={payment === m}
                onChange={() => setPayment(m)}
                data-testid={`payment-${m.toLowerCase()}`}
              />
              {m}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={submitBill}
          disabled={cart.length === 0}
          className="w-full py-3 rounded-control gradient-coral text-white font-semibold disabled:opacity-50"
          data-testid="print-bill-submit"
        >
          Generate invoice
        </button>
      </div>
      {invoice && (
        <div className="rounded-card bg-success-soft p-4 text-sm whitespace-pre-line" data-testid="invoice-receipt">
          {invoice}
          <button type="button" onClick={downloadPdf} className="mt-3 block text-primary font-semibold text-xs">
            Download receipt
          </button>
        </div>
      )}
    </div>
  );
}
