"use client";

import { useCallback, useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface FortuneBoxProps {
  slug: string;
}

export function FortuneBox({ slug }: FortuneBoxProps) {
  const [progress, setProgress] = useState(0);
  const [canOpen, setCanOpen] = useState(false);
  const [reward, setReward] = useState<{ type: string; value: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const fetchBox = useCallback(async () => {
    try {
      const res = await fetch(`/api/customer/fortune-box?slug=${slug}`);
      if (!res.ok) return;
      const d = await res.json();
      setProgress(d.progress || 0);
      setCanOpen(d.canOpen || false);
      setReward(d.reward || null);
      setRevealed(!!d.openedAt && !!d.reward);
    } catch { /* ignore */ }
    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchBox(); }, [fetchBox]);

  const openBox = async () => {
    if (!canOpen || opening) return;
    setOpening(true);
    try {
      const res = await fetch(`/api/customer/fortune-box?slug=${slug}`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setReward(d.reward);
        setRevealed(true);
        setCanOpen(false);
        setProgress(0);
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 }, colors: ["#FFD700", "#E53935", "#FF6B4A"] });
      }
    } catch { /* ignore */ }
    setOpening(false);
  };

  if (loading) {
    return (
      <div className="rounded-card bg-white shadow-card p-4 animate-pulse">
        <div className="h-5 w-32 bg-bg-hover rounded mb-3" />
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-bg-hover" />
          ))}
        </div>
      </div>
    );
  }

  const beans = Array.from({ length: 5 }, (_, i) => i < progress);

  return (
    <div className="rounded-card bg-white shadow-card p-4 overflow-hidden relative">
      {revealed && reward ? (
        <div className="text-center py-2 animate-in zoom-in-95">
          <p className="text-xs font-semibold text-lucky-red uppercase tracking-wide mb-2">Fortune Box Opened!</p>
          <div className="inline-flex items-center gap-2 bg-lucky-cream rounded-control px-6 py-4 animate-float-up">
            {reward.type === "points" ? (
              <>
                <span className="text-4xl font-bold text-lucky-red">+{reward.value}</span>
                <span className="text-sm font-semibold text-ink-2">points</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-bold text-lucky-red">{reward.value}%</span>
                <span className="text-sm font-semibold text-ink-2">off coupon</span>
              </>
            )}
          </div>
          <p className="text-xs text-ink-3 mt-3">New fortune box started. Keep ordering!</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-ink">Fortune Box</p>
              <p className="text-[11px] text-ink-3">{5 - progress} more orders to unlock</p>
            </div>
            <span className="text-lg">{canOpen ? "🎁" : "📦"}</span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            {beans.map((filled, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  filled
                    ? "bg-lucky-gold/20 border-2 border-lucky-gold animate-stamp-press"
                    : "bg-bg-subtle border-2 border-dashed border-border"
                }`}
                style={{ animationDelay: filled ? `${i * 0.1}s` : undefined }}
              >
                {filled ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <ellipse cx="12" cy="14" rx="7" ry="8" fill="#FFD700" stroke="#E6A817" strokeWidth="1.5" />
                    <path d="M12 6C12 6 9 9 9 12c0 2 1.5 3 3 3s3-1 3-3c0-3-3-6-3-6z" fill="#B08D57" opacity="0.6" />
                  </svg>
                ) : (
                  <span className="text-ink-3 text-lg">?</span>
                )}
              </div>
            ))}
          </div>

          {canOpen ? (
            <button
              type="button"
              onClick={openBox}
              disabled={opening}
              className="w-full py-2.5 rounded-control bg-gradient-to-r from-lucky-red to-lucky-darkred text-white font-bold text-sm animate-glow-pulse disabled:opacity-60 press-scale"
            >
              {opening ? "Opening..." : "Open Fortune Box"}
            </button>
          ) : (
            <div className="w-full h-2 rounded-full bg-bg-hover overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lucky-red to-lucky-gold transition-all duration-500"
                style={{ width: `${(progress / 5) * 100}%` }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
