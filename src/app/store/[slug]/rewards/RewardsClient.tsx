'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift, Ticket, Check } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col items-center p-4">
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

        {loading && <p className="text-sm text-ink-3">Loading…</p>}

        {!loading && rewards.length === 0 && (
          <div className="bg-white rounded-card shadow-card p-6 text-center">
            <Gift size={28} className="mx-auto text-ink-3 mb-2" />
            <p className="text-sm text-ink-2">This cafe hasn’t set up rewards yet. Keep earning points!</p>
          </div>
        )}

        <div className="space-y-3">
          {rewards.map((reward) => {
            const affordable = points >= reward.cost;
            return (
              <div key={reward.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink text-sm">{reward.title}</p>
                  {reward.description && <p className="text-xs text-ink-3 mt-0.5">{reward.description}</p>}
                  <p className="text-xs font-semibold text-primary mt-1">{reward.cost} points</p>
                </div>
                <button
                  type="button"
                  onClick={() => redeem(reward)}
                  disabled={!affordable || busy === reward.id}
                  className="shrink-0 px-4 py-2 rounded-control text-sm font-semibold disabled:opacity-40 gradient-coral text-white"
                >
                  {busy === reward.id ? '…' : affordable ? 'Redeem' : `Need ${reward.cost - points}`}
                </button>
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-error font-medium mt-3 text-center">{error}</p>}

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
