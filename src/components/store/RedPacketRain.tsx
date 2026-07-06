"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RedPacketRainProps {
  orderId: string;
  cafeId?: string;
  onComplete: (totalPoints: number) => void;
}

interface Envelope {
  id: number;
  x: number;
  delay: number;
  duration: number;
  points: number;
}

export function RedPacketRain({ orderId, cafeId: _cafeId, onComplete }: RedPacketRainProps) {
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [caught, setCaught] = useState<{ id: number; points: number; x: number; y: number }[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [finished, setFinished] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const POINTS_POOL = [5, 5, 5, 10, 10, 10, 15, 15, 20, 20, 25, 30];

  const spawnEnvelope = useCallback(() => {
    if (finishedRef.current) return;
    const id = idRef.current++;
    const envelope: Envelope = {
      id,
      x: Math.random() * 80 + 10,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      points: POINTS_POOL[Math.floor(Math.random() * POINTS_POOL.length)],
    };
    setEnvelopes((prev) => [...prev.slice(-30), envelope]);
  }, []);

  useEffect(() => {
    spawnRef.current = setInterval(spawnEnvelope, 300);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishedRef.current = true;
          if (spawnRef.current) clearInterval(spawnRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => setFinished(true), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const catchEnvelope = (envelope: Envelope, e: React.MouseEvent | React.TouchEvent) => {
    if (finishedRef.current) return;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setCaught((prev) => [...prev, { id: envelope.id, points: envelope.points, x: envelope.x, y: clientY }]);
    setTotalPoints((prev) => prev + envelope.points);
    setEnvelopes((prev) => prev.filter((env) => env.id !== envelope.id));
  };

  const claim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      await fetch(`/api/orders/${orderId}/scratch`, { method: "POST" });
    } catch { /* best effort */ }
    onComplete(totalPoints);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Timer bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-lucky-gold font-bold text-sm">Red Packet Rain!</span>
            <span className="text-white font-bold text-sm">{timeLeft}s</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lucky-gold to-lucky-red transition-all duration-1000"
              style={{ width: `${(timeLeft / 10) * 100}%` }}
            />
          </div>
          <div className="text-center mt-1">
            <span className="text-lucky-gold font-bold text-lg">+{totalPoints} pts</span>
          </div>
        </div>
      </div>

      {/* Falling envelopes */}
      {!finished && envelopes.map((env) => (
        <div
          key={env.id}
          className="absolute cursor-pointer active:scale-125 transition-transform z-10"
          style={{
            left: `${env.x}%`,
            top: "-5%",
            animation: `red-fall ${env.duration}s linear ${env.delay}s forwards`,
          }}
          onClick={(e) => catchEnvelope(env, e)}
          onTouchStart={(e) => catchEnvelope(env, e)}
        >
          <div className="w-12 h-16 rounded-lg bg-gradient-to-b from-lucky-red to-lucky-darkred border-2 border-lucky-gold/50 flex items-center justify-center shadow-lg">
            <span className="text-lucky-gold font-bold text-lg">₹</span>
          </div>
        </div>
      ))}

      {/* Caught point popups */}
      {caught.map((c) => (
        <div
          key={c.id}
          className="absolute z-30 pointer-events-none animate-float-up"
          style={{ left: `${c.x}%`, top: `${Math.min(c.y, 60)}%` }}
        >
          <span className="text-lucky-gold font-bold text-xl drop-shadow-lg">+{c.points}</span>
        </div>
      ))}

      {/* Finished overlay */}
      {finished && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-card shadow-pop p-6 max-w-sm w-full mx-4 text-center animate-bounce-in">
            <div className="text-5xl mb-3">🧧</div>
            <h2 className="font-display font-bold text-xl text-ink mb-1">Red Packet Rain Complete!</h2>
            <p className="text-sm text-ink-3 mb-4">You caught red packets worth</p>
            <div className="inline-flex items-center gap-2 bg-lucky-cream rounded-control px-6 py-3 mb-4">
              <span className="text-3xl font-bold text-lucky-red">+{totalPoints}</span>
              <span className="text-sm font-semibold text-ink-2">points</span>
            </div>
            <button
              type="button"
              onClick={claim}
              disabled={claiming}
              className="w-full py-3 rounded-control bg-gradient-to-r from-lucky-red to-lucky-darkred text-white font-bold text-sm press-scale disabled:opacity-60"
            >
              {claiming ? "Claiming..." : "Claim Points"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
