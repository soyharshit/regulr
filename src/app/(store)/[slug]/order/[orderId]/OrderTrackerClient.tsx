"use client";

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

const STATUS_STEPS = ["PENDING", "PREPARING", "READY", "COMPLETED"];

export default function OrderTrackerClient({ cafe, order }: { cafe: any, order: any }) {
  const [status, setStatus] = useState(order.status);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    if (status === "COMPLETED") {
      setShowReward(true);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          if (data.status === "COMPLETED") {
            setShowReward(true);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [order.id, status]);

  const currentStep = STATUS_STEPS.indexOf(status);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 pt-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h1 className="text-2xl font-bricolage text-center font-bold mb-8 text-[#FF6B4A]">
          {cafe.name} Order
        </h1>

        {showReward ? (
          <div className="text-center py-8">
            <h2 className="text-3xl font-bold mb-2">🎉 COMPLETED 🎉</h2>
            <p className="text-gray-600 mb-6">Your order is ready. Enjoy!</p>
            <div className="bg-[#FF6B4A] text-white rounded-xl p-6 shadow-md inline-block">
              <p className="text-sm opacity-90">You earned</p>
              <p className="text-4xl font-bold my-1">50</p>
              <p className="text-sm font-medium uppercase tracking-wider">Loyalty Points</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {STATUS_STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isPast = index < currentStep;
              
              return (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                    ${isActive ? 'bg-[#FF6B4A] text-white shadow-lg scale-110 transition-transform' : 
                      isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {index + 1}
                  </div>
                  <div className={`ml-4 ${isActive ? 'text-black font-bold text-lg' : isPast ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
