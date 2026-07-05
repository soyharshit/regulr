"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CheckoutClient({ cafe }: { cafe: any }) {
  const router = useRouter();
  const [cart, setCart] = useState<{ menuItem: any, quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${cafe.id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      router.push(`/store/${cafe.slug}`);
    }
  }, [cafe.id, cafe.slug, router]);

  const subtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const gstRate = 0.05;
  const gstAmount = Math.round(subtotal * (gstRate / (1 + gstRate)));

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: cafe.id,
          items: cart.map(item => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            price: item.menuItem.price
          })),
          paymentMethod,
          totalAmount: subtotal // Engine will re-verify on backend
        })
      });

      if (!res.ok) throw new Error('Checkout failed');
      const data = await res.json();
      
      // Clear cart
      localStorage.removeItem(`cart_${cafe.id}`);
      
      // Redirect to tracker
      router.push(`/store/${cafe.slug}/order/${data.id}`);
    } catch (e) {
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return <div className="p-8 text-center">Loading cart...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => router.back()} className="flex items-center text-gray-600 mb-6 mt-2">
          <ArrowLeft size={20} className="mr-1" /> Back to Menu
        </button>

        <h1 className="text-2xl font-bricolage font-bold mb-6 text-gray-800">Checkout</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-medium">{item.quantity}x</span> {item.menuItem.name}
                </div>
                <div className="text-gray-600">₹{((item.menuItem.price * item.quantity) / 100).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm text-gray-500">
            <span>Includes 5% GST</span>
            <span>₹{(gstAmount / 100).toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center font-bold text-lg">
            <span>Total to Pay</span>
            <span>₹{(subtotal / 100).toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
          <h2 className="font-bold text-lg mb-4">Payment Method</h2>
          <div className="space-y-3">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="payment" value="CASH" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} className="mr-3" />
              Pay at Counter (Cash)
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="payment" value="UPI" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} className="mr-3" />
              UPI Direct (Mock)
            </label>
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="payment" value="RAZORPAY" checked={paymentMethod === 'RAZORPAY'} onChange={() => setPaymentMethod('RAZORPAY')} className="mr-3" />
              Credit/Debit Card (Mock)
            </label>
          </div>
        </div>

        <button 
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-[#FF6B4A] hover:bg-[#e55938] text-white font-bold py-4 px-6 rounded-xl transition flex justify-center items-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : `Place Order • ₹${(subtotal / 100).toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
