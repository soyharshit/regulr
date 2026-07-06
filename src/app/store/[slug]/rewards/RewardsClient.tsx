'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift, Ticket, Check, Sparkles, Star, Lock, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Reward {
  id: string;
  title: string;
  cost: number;
  description?: string;
}
interface Redemption {
  id: string;
  rewardTitle: string;
  code: string;
  status: string;
  createdAt: string;
}

export default function RewardsClient({ cafe }: { cafe: { name: string; slug: string } }) {
  const router = useRouter();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [points, setPoints] = useState(0);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/rewards?slug=${encodeURIComponent(cafe.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setRewards(d.rewards || []);
          setPoints(d.points || 0);
          setRedemptions(d.redemptions || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, [cafe.slug]);

  const redeem = async (reward: Reward) => {
    setBusy(reward.id);
    setError(null);
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: cafe.slug, rewardId: reward.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not redeem');
      } else {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        load();
      }
    } finally {
      setBusy(null);
    }
  };

  const cheapest = Math.min(...rewards.map((r) => r.cost), Infinity);
  const progressToNext = cheapest === Infinity ? 100 : Math.min(100, (points / cheapest) * 100);

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col items-center p-4 pb-24">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => router.push(`/store/${cafe.slug}`)}
          className="flex items-center text-ink-2 mb-5 mt-2 text-sm font-medium"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to {cafe.name}
        </button>

        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display text-2xl font-bold text-ink">Rewards</h1>
          <span className="pill bg-primary-soft text-primary text-sm font-bold !px-3 !py-1.5">{points} pts</span>
        </div>

        {/* Points progress card */}
        {rewards.length > 0 && (
          <div className="bg-white rounded-card shadow-card p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-ink">Points balance</p>
              {cheapest < Infinity && points < cheapest && (
                <p className="text-xs text-ink-3">{cheapest - points} more to first reward</p>
              )}
              {points >= cheapest && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                  <Sparkles size={12} /> Ready to redeem
                </span>
              )}
            </div>
            <div className="w-full h-2.5 bg-bg-hover rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-700 ease-out"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-card shadow-card p-4 animate-pulse">
                <div className="h-4 bg-bg-hover rounded w-2/3 mb-2" />
                <div className="h-3 bg-bg-hover rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && rewards.length === 0 && (
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center mx-auto mb-3">
              <Gift size={26} className="text-primary" />
            </div>
            <p className="font-semibold text-ink text-sm mb-1">No rewards yet</p>
            <p className="text-xs text-ink-2">This cafe hasn&apos;t set up rewards. Keep earning points!</p>
          </div>
        )}

        {/* Reward cards */}
        <div className="space-y-3">
          {rewards.map((reward) => {
            const affordable = points >= reward.cost;
            return (
              <div
                key={reward.id}
                className={`bg-white rounded-card shadow-card p-4 transition-all duration-200 ${
                  affordable ? 'ring-2 ring-primary/20 shadow-glow' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      affordable ? 'bg-primary-soft text-primary' : 'bg-bg-hover text-ink-3'
                    }`}
                  >
                    {affordable ? <Star size={18} /> : <Lock size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-ink text-sm">{reward.title}</p>
                        {reward.description && (
                          <p className="text-xs text-ink-3 mt-0.5">{reward.description}</p>
                        )}
                      </div>
                      <p className={`text-xs font-bold shrink-0 ml-2 ${affordable ? 'text-primary' : 'text-ink-3'}`}>
                        {reward.cost} pts
                      </p>
                    </div>
                    <div className="mt-2.5">
                      {affordable ? (
                        <button
                          type="button"
                          onClick={() => redeem(reward)}
                          disabled={busy === reward.id}
                          className="w-full py-2 rounded-control font-semibold text-sm flex items-center justify-center gap-1.5 gradient-coral text-white disabled:opacity-60 press-scale"
                        >
                          {busy === reward.id ? (
                            'Redeeming…'
                          ) : (
                            <>
                              <Zap size={14} /> Redeem now
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-bg-hover rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-ink-3 transition-all"
                              style={{ width: `${Math.min(100, (points / reward.cost) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-ink-3 shrink-0">
                            {reward.cost - points} needed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-error font-medium mt-3 text-center">{error}</p>}

        {/* Vouchers */}
        {redemptions.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-ink mb-2 flex items-center gap-1.5">
              <Ticket size={15} /> My vouchers
            </h2>
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div key={r.id} className="bg-white rounded-card shadow-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{r.rewardTitle}</p>
                    <p className="text-xs font-mono text-primary mt-0.5">{r.code}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold ${
                      r.status === 'ACTIVE' ? 'bg-success-soft text-success' : 'bg-bg-subtle text-ink-3 border border-border'
                    }`}
                  >
                    {r.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1">
                        <Check size={11} /> Show at counter
                      </span>
                    ) : (
                      r.status
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
