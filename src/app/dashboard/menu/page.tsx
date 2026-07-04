'use client';

import { useCallback, useEffect, useState } from 'react';

interface MenuRow {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  description: string | null;
}

export default function MenuManagementPage() {
  const [cafeId, setCafeId] = useState('');
  const [items, setItems] = useState<MenuRow[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', category: 'beverages' });

  const load = useCallback(async () => {
    const summary = await fetch('/api/dashboard/summary?slug=brew-haven');
    if (!summary.ok) return;
    const { cafe } = await summary.json();
    if (!cafe?.id) return;
    setCafeId(cafe.id);
    const res = await fetch(`/api/menu?cafeId=${cafe.id}`);
    const items = res.ok ? await res.json() : [];
    setItems(Array.isArray(items) ? items : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = async () => {
    if (!form.name || !form.price) return;
    await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cafeId,
        name: form.name,
        price: Math.round(Number(form.price) * 100),
        category: form.category,
      }),
    });
    setForm({ name: '', price: '', category: 'beverages' });
    load();
  };

  const toggleAvailable = async (item: MenuRow) => {
    await fetch('/api/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeId, id: item.id, isAvailable: !item.isAvailable }),
    });
    load();
  };

  const removeItem = async (id: string) => {
    await fetch(`/api/menu?cafeId=${cafeId}&id=${id}`, { method: 'DELETE' });
    load();
  };

  const exportCsv = () => {
    const header = 'name,price,category,description,isAvailable';
    const rows = items.map((i) =>
      [i.name, i.price, i.category, i.description || '', i.isAvailable].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (file: File) => {
    setImportError(null);
    const text = await file.text();
    const lines = text.trim().split('\n');
    const header = lines[0]?.toLowerCase();
    if (!header?.includes('name') || !header.includes('price')) {
      setImportError('CSV must include name and price columns');
      return;
    }
    for (let i = 1; i < lines.length; i++) {
      const [name, price, category] = lines[i].split(',');
      if (!name || !price) continue;
      await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId,
          name: name.trim(),
          price: Number(price.trim()),
          category: (category || 'beverages').trim(),
        }),
      });
    }
    load();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display font-bold text-xl text-ink">Menu Management</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2 rounded-control bg-bg-subtle text-sm font-medium border border-border"
            data-testid="menu-export-btn"
          >
            Export CSV
          </button>
          <label className="px-4 py-2 rounded-control bg-primary text-white text-sm font-medium cursor-pointer">
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              data-testid="menu-import-file"
              onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {importError && (
        <div className="rounded-control bg-error-soft text-error px-4 py-3 text-sm" data-testid="import-error-banner">
          {importError}
        </div>
      )}

      <div className="rounded-card bg-white p-4 shadow-card flex flex-wrap gap-2">
        <input
          placeholder="Item name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="flex-1 min-w-[140px] px-3 py-2 rounded-control border border-border text-sm"
        />
        <input
          placeholder="Price (paise)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-32 px-3 py-2 rounded-control border border-border text-sm"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="px-3 py-2 rounded-control border border-border text-sm"
        >
          <option value="beverages">Beverages</option>
          <option value="food">Food</option>
          <option value="desserts">Desserts</option>
        </select>
        <button type="button" onClick={addItem} className="px-4 py-2 rounded-control bg-primary text-white text-sm font-semibold">
          Add item
        </button>
      </div>

      <div className="rounded-card bg-white shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-subtle">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-right px-4 py-2">Price</th>
              <th className="text-center px-4 py-2">Available</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 font-medium">{item.name}</td>
                <td className="px-4 py-2 capitalize">{item.category}</td>
                <td className="px-4 py-2 text-right tabular-nums">₹{(item.price / 100).toFixed(0)}</td>
                <td className="px-4 py-2 text-center">
                  <button type="button" onClick={() => toggleAvailable(item)} className="text-xs font-semibold text-primary">
                    {item.isAvailable ? 'Yes' : 'No'}
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-error font-semibold">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
