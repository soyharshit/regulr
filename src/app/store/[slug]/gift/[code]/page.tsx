'use client';

import { useEffect, useState } from 'react';
import { Gift, Check, Loader2, ArrowLeft, Heart } from 'lucide-react';

interface GiftData {
  id: string;
  menuItemName: string;
  quantity: number;
  recipientName: string;
  message: string | null;
  claimCode: string;
  claimedAt: string | null;
  cafe: { name: string; slug: string };
}

export default function GiftClaimPage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const [gift, setGift] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    (async () => {
      const { code } = await params;
      try {
        const res = await fetch(`/api/gifts/${code}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Gift not found');
        } else {
          setGift(await res.json());
        }
      } catch {
        setError('Could not load gift');
      }
      setLoading(false);
    })();
  }, [params]);

  const handleClaim = async () => {
    if (!gift || claiming) return;
    setClaiming(true);
    try {
      const { code } = await params;
      const res = await fetch(`/api/gifts/${code}`, { method: 'POST' });
      if (res.ok) {
        setClaimed(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Could not claim gift');
      }
    } catch {
      setError('Network error');
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-subtle flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-ink-3" />
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-bg-subtle flex items-center justify-center p-4">
        <div className="bg-white rounded-card shadow-card p-8 text-center max-w-sm">
          <Gift size={40} className="mx-auto text-ink-3 mb-3" />
          <h1 className="text-lg font-bold text-ink mb-1">Gift not found</h1>
          <p className="text-sm text-ink-2">{error || 'This gift code is invalid or expired.'}</p>
          {gift && (
            <a
              href={`/store/${gift.cafe.slug}`}
              className="mt-4 inline-block px-5 py-2 rounded-control bg-primary text-white font-semibold text-sm"
            >
              Visit store
            </a>
          )}
        </div>
      </div>
    );
  }

  const alreadyClaimed = !!gift.claimedAt;

  return (
    <div className="min-h-screen bg-bg-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-pop overflow-hidden animate-in zoom-in-95">
          {/* Header */}
          <div className="gradient-coral p-6 text-center text-white">
            <Gift size={36} className="mx-auto mb-2" />
            <h1 className="font-display text-xl font-bold">You received a gift! 🎁</h1>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-ink">{gift.menuItemName}</p>
              {gift.quantity > 1 && (
                <p className="text-sm text-ink-3">× {gift.quantity}</p>
              )}
            </div>

            <div className="bg-bg-subtle rounded-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart size={14} className="text-primary shrink-0" />
                <p className="text-sm font-medium text-ink">From: {gift.recipientName}</p>
              </div>
              {gift.message && (
                <p className="text-sm text-ink-2 italic">"{gift.message}"</p>
              )}
            </div>

            <p className="text-xs text-ink-3 text-center">
              from <span className="font-semibold text-ink">{gift.cafe.name}</span>
            </p>

            {error && <p className="text-sm text-error font-medium text-center">{error}</p>}

            <button
              type="button"
              onClick={handleClaim}
              disabled={alreadyClaimed || claiming}
              className="w-full py-3 rounded-control font-bold text-sm flex items-center justify-center gap-2 press-scale disabled:opacity-60 gradient-coral text-white"
            >
              {claiming ? (
                <Loader2 size={18} className="animate-spin" />
              ) : alreadyClaimed || claimed ? (
                <>
                  <Check size={18} /> Gift claimed ✓
                </>
              ) : (
                <>
                  <Gift size={18} /> Claim your gift
                </>
              )}
            </button>

            {!alreadyClaimed && !claimed && (
              <p className="text-xs text-ink-3 text-center">
                Show this screen to the barista to claim your drink
              </p>
            )}

            <a
              href={`/store/${gift.cafe.slug}`}
              className="block text-center text-sm font-medium text-primary py-1"
            >
              <ArrowLeft size={14} className="inline mr-1" />
              Back to {gift.cafe.name}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
