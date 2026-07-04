"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

interface RewardScreenProps {
  orderId: string;
  cafeId: string;
  onClose: () => void;
}

export function RewardScreen({ orderId, cafeId, onClose }: RewardScreenProps) {
  const [mode] = useState<"scratch" | "spin">(() => (Math.random() > 0.5 ? "scratch" : "spin"));
  const [revealed, setRevealed] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchedRef = useRef(0);

  const prize = "+25 loyalty points";

  const claimReward = useCallback(async () => {
    if (revealed) return;
    setRevealed(true);
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    try {
      await fetch(`/api/orders/${orderId}/reward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cafeId, points: 25 }),
      });
    } catch {
      /* best-effort */
    }
  }, [orderId, cafeId, revealed]);

  useEffect(() => {
    if (mode !== "scratch" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 280;
    canvas.height = 140;
    ctx.fillStyle = "#FFB020";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scratch to reveal!", canvas.width / 2, canvas.height / 2);

    const scratch = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const point = "touches" in e ? e.touches[0] : e;
      const x = point.clientX - rect.left;
      const y = point.clientY - rect.top;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      scratchedRef.current += 1;
      if (scratchedRef.current > 8 && !revealed) claimReward();
    };

    canvas.addEventListener("mousemove", scratch);
    canvas.addEventListener("touchmove", scratch);
    return () => {
      canvas.removeEventListener("mousemove", scratch);
      canvas.removeEventListener("touchmove", scratch);
    };
  }, [mode, revealed, claimReward]);

  const spinWheel = () => {
    if (spinning || revealed) return;
    setSpinning(true);
    const extra = 1440 + Math.floor(Math.random() * 360);
    setRotation((r) => r + extra);
    setTimeout(() => {
      setSpinning(false);
      claimReward();
    }, 3200);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4"
      data-testid="reward-screen"
    >
      <div className="w-full max-w-sm rounded-card bg-white p-5 shadow-pop animate-slide-up">
        <h2 className="font-display font-bold text-lg text-ink">You earned a reward!</h2>
        <p className="text-sm text-ink-3 mt-1">Complete the mini-game to claim your points.</p>

        {mode === "scratch" ? (
          <div className="mt-4 relative rounded-control overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-success-soft text-success font-bold text-sm">
              {prize}
            </div>
            <canvas ref={canvasRef} className="relative w-full touch-none" />
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-4">
            <div
              className="w-40 h-40 rounded-full border-4 border-primary relative transition-transform duration-[3200ms] ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                background: "conic-gradient(#FF6B4A 0 25%, #FFB020 25% 50%, #6C5CE7 50% 75%, #00C875 75% 100%)",
              }}
            >
              <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center text-xs font-bold text-ink">
                {revealed ? prize : "Spin!"}
              </div>
            </div>
            {!revealed && (
              <button
                type="button"
                onClick={spinWheel}
                disabled={spinning}
                className="px-6 py-2.5 rounded-control gradient-coral text-white font-semibold text-sm disabled:opacity-60"
                data-testid="spin-wheel-btn"
              >
                {spinning ? "Spinning..." : "Spin the wheel"}
              </button>
            )}
          </div>
        )}

        {revealed && (
          <p className="mt-4 text-sm font-semibold text-success text-center">{prize} added!</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-control bg-bg-subtle text-ink-2 font-medium text-sm hover:bg-bg-hover"
        >
          {revealed ? "Continue browsing" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
