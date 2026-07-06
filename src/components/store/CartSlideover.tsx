"use client";

import { useEffect, useRef } from "react";
import { ShoppingCart, Minus, Plus, X } from "lucide-react";

interface CartLine {
  menuItem: { id: string; name: string; price: number };
  quantity: number;
}

interface CartSlideoverProps {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  cartTotal: number;
  cartCount: number;
  onChangeQuantity: (menuItemId: string, delta: number) => void;
  onCheckout: () => void;
  gstRate: number;
}

function formatRupee(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function CartSlideover({
  open,
  onClose,
  cart,
  cartTotal,
  cartCount,
  onChangeQuantity,
  onCheckout,
  gstRate,
}: CartSlideoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const gst = Math.round(cartTotal * gstRate);
  const grandTotal = cartTotal + gst;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        ref={panelRef}
        className={`fixed bottom-0 left-0 right-0 z-[71] bg-white rounded-t-2xl shadow-pop transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-ink" />
            <span className="font-bold text-ink text-base">Your cart</span>
            <span className="text-xs text-ink-3">({cartCount} items)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-subtle flex items-center justify-center"
          >
            <X size={16} className="text-ink-2" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {cart.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart size={32} className="mx-auto text-ink-3 mb-2" />
              <p className="text-sm text-ink-3">Your cart is empty</p>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-semibold text-primary mt-2"
              >
                Browse menu
              </button>
            </div>
          )}

          {cart.map((line) => (
            <div
              key={line.menuItem.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{line.menuItem.name}</p>
                <p className="text-xs text-ink-3">{formatRupee(line.menuItem.price * line.quantity)}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1 bg-primary rounded-control px-0.5">
                <button
                  type="button"
                  onClick={() => onChangeQuantity(line.menuItem.id, -1)}
                  className="w-7 h-7 flex items-center justify-center text-white"
                >
                  <Minus size={13} />
                </button>
                <span className="text-white text-sm font-semibold w-5 text-center">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onChangeQuantity(line.menuItem.id, 1)}
                  className="w-7 h-7 flex items-center justify-center text-white"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="shrink-0 border-t border-border px-5 pt-3 pb-4 safe-bottom space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-ink-3">
                <span>Subtotal</span>
                <span>{formatRupee(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-ink-3">
                <span>GST ({Math.round(gstRate * 100)}%)</span>
                <span>{formatRupee(gst)}</span>
              </div>
              <div className="flex justify-between font-bold text-ink text-base border-t border-border pt-1.5 mt-1.5">
                <span>Total</span>
                <span>{formatRupee(grandTotal)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full py-3.5 rounded-control bg-primary text-white font-bold text-sm press-scale"
            >
              Proceed to checkout • {formatRupee(grandTotal)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
