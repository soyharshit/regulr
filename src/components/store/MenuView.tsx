"use client";

import { useMemo, useState } from "react";
import { Search, Minus, Plus } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  zomatoPrice: number | null;
  category: string;
  isAvailable: boolean;
  imageUrl?: string | null;
}

interface MenuViewProps {
  menuItems: MenuItem[];
  quantityFor: (id: string) => number;
  onAdd: (item: MenuItem) => void;
  onChangeQuantity: (id: string, delta: number) => void;
}

function formatRupee(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function MenuView({ menuItems, quantityFor, onAdd, onChangeQuantity }: MenuViewProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(menuItems[0]?.category || "");

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((m) => m.category))),
    [menuItems]
  );

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.description || "").toLowerCase().includes(q)
      );
    }
    return items.filter((m) => m.category === activeCategory);
  }, [menuItems, search, activeCategory]);

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="relative mb-3">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu…"
          className="w-full pl-9 pr-3 py-2.5 rounded-control bg-bg-subtle border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 mb-3 scrollbar-none">
        {categories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 px-4 py-2 rounded-pill text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-ink text-white shadow-sm"
                  : "bg-white text-ink-2 border border-border hover:bg-bg-subtle"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Menu items */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pb-4">
        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-ink-3">No items found</p>
          </div>
        )}

        {filteredItems.map((item) => {
          const qty = quantityFor(item.id);
          return (
            <div
              key={item.id}
              data-testid="menu-item"
              className="bg-white rounded-card border border-border p-3.5 flex items-center justify-between gap-3 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-14 h-14 rounded-control object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-control bg-primary-soft shrink-0 flex items-center justify-center">
                    <span className="text-lg">{item.category === "beverages" ? "☕" : item.category === "desserts" ? "🍰" : "🍽️"}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="veg-mark" />
                    <h3 className="font-semibold text-ink text-sm truncate">{item.name}</h3>
                  </div>
                  {item.description && (
                    <p className="text-ink-3 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <p className="text-ink font-bold text-sm">{formatRupee(item.price)}</p>
                    {item.zomatoPrice != null && item.zomatoPrice > item.price && (
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] text-ink-3 line-through">{formatRupee(item.zomatoPrice)}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-success/10 text-success">
                          Save {Math.round(((item.zomatoPrice - item.price) / item.zomatoPrice) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {!item.isAvailable ? (
                  <span className="text-[11px] font-semibold text-ink-3 bg-bg-subtle px-3 py-1.5 rounded-control">
                    Sold out
                  </span>
                ) : qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => onAdd(item)}
                    className="w-9 h-9 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center press-scale hover:bg-primary-hover transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-primary rounded-control px-0.5">
                    <button
                      type="button"
                      onClick={() => onChangeQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-white text-sm font-semibold w-5 text-center">{qty}</span>
                    <button
                      type="button"
                      onClick={() => onAdd(item)}
                      className="w-8 h-8 flex items-center justify-center text-white"
                    >
                      <Plus size={14} />
                    </button>
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
