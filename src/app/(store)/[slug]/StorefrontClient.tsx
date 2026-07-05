"use client";

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StorefrontClient({ cafe, menuItems }: { cafe: any, menuItems: any[] }) {
  const [cart, setCart] = useState<{ menuItem: any, quantity: number }[]>([]);
  const router = useRouter();

  const categories = Array.from(new Set(menuItems.map(m => m.category)));

  const addToCart = (menuItem: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item => item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 pb-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bricolage text-[#FF6B4A] font-bold mb-2">
          {cafe.name}
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Order for dine-in or takeaway
        </p>
        
        {categories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-bold mb-4 capitalize">{category}</h2>
            <div className="space-y-4">
              {menuItems.filter(m => m.category === category).map(item => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-gray-500 text-sm">₹{(item.price / 100).toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => addToCart(item)}
                    className="bg-gray-100 hover:bg-gray-200 text-[#FF6B4A] font-bold py-2 px-4 rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-center z-50">
          <div className="max-w-md w-full flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">{cartCount} items</p>
              <p className="font-bold text-lg">₹{(cartTotal / 100).toFixed(2)}</p>
            </div>
            <button 
              onClick={() => {
                // Save cart to local storage and navigate to checkout
                localStorage.setItem(`cart_${cafe.id}`, JSON.stringify(cart));
                router.push(`/store/${cafe.slug}/checkout`);
              }}
              className="bg-[#FF6B4A] hover:bg-[#e55938] text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition"
            >
              <ShoppingCart size={20} />
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
