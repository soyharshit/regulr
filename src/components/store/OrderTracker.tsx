"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { key: "PENDING", label: "Received" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready" },
  { key: "COMPLETED", label: "Completed" },
] as const;

function stepIndex(status: string): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function OrderTracker({
  orderId,
  onComplete,
}: {
  orderId: string;
  onComplete?: () => void;
}) {
  const [status, setStatus] = useState("PENDING");

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setStatus(data.status);
        if (data.status === "COMPLETED") onComplete?.();
      } catch {
        /* ignore transient errors */
      }
    }

    poll();
    const timer = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderId, onComplete]);

  const current = stepIndex(status);

  return (
    <div className="mx-4 mt-4 rounded-card bg-white p-5 shadow-card" data-testid="order-tracker">
      <p className="text-sm font-bold text-ink">Order #{orderId.slice(0, 8)}</p>
      <p className="text-xs text-ink-3 mt-0.5">Live status updates every 3s</p>
      <div className="mt-4 flex items-center justify-between gap-1">
        {STEPS.map((step, i) => {
          const done = i <= current;
          const activeStep = i === current;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  done ? "bg-primary text-white" : "bg-bg-subtle text-ink-3"
                } ${activeStep ? "ring-2 ring-primary/30" : ""}`}
              >
                {i + 1}
              </div>
              <span className={`text-[10px] font-medium text-center ${done ? "text-ink" : "text-ink-3"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
