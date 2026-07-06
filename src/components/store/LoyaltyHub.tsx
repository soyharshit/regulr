"use client";

import { Flame, Gift, Copy, Check, LogIn } from "lucide-react";
import { DailyCheckIn } from "@/components/store/DailyCheckIn";
import { FortuneBox } from "@/components/store/FortuneBox";

interface LoyaltyData {
  isGuest: boolean;
  points: number;
  tier: string;
  streakCount: number;
  rewardsAvailable: number;
  progressPercent: number;
  pointsToNextTier: number;
  nextTier: string;
}

interface ReferralData {
  referralCode: string | null;
  referredCount: number;
  pointsEarnedFromReferrals: number;
}

interface LoyaltyHubProps {
  loyalty: LoyaltyData;
  referral: ReferralData;
  isSignedIn: boolean;
  referrerBonus: number;
  referredBonus: number;
  cafeSlug: string;
  onCopyCode: () => void;
  copied: boolean;
  redeemCode: string;
  onRedeemCodeChange: (val: string) => void;
  onRedeem: () => void;
  redeeming: boolean;
  redeemMessage: { text: string; ok: boolean } | null;
}

const TIER_STYLES: Record<string, string> = {
  BRONZE: "bg-tier-bronze/10 text-tier-bronze",
  SILVER: "bg-tier-silver/10 text-tier-silver",
  GOLD: "bg-tier-gold/10 text-tier-gold",
  PLATINUM: "bg-violet/10 text-violet",
};

const TIER_COLORS: Record<string, string> = {
  BRONZE: "#B08D57",
  SILVER: "#8E9BAE",
  GOLD: "#E6A817",
  PLATINUM: "#6C5CE7",
};

export function LoyaltyHub({
  loyalty,
  referral,
  isSignedIn,
  referrerBonus,
  referredBonus,
  cafeSlug,
  onCopyCode,
  copied,
  redeemCode,
  onRedeemCodeChange,
  onRedeem,
  redeeming,
  redeemMessage,
}: LoyaltyHubProps) {
  if (!isSignedIn) {
    return (
      <div className="rounded-card bg-white border border-border p-5 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center mx-auto">
          <LogIn size={20} className="text-primary" />
        </div>
        <div>
          <p className="font-semibold text-ink">Join to earn rewards</p>
          <p className="text-xs text-ink-3 mt-0.5">Points, streaks & referral bonuses</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <a
            href={`/auth/signup?next=${encodeURIComponent(`/store/${cafeSlug}`)}`}
            className="px-4 py-2 rounded-control bg-primary text-white text-xs font-semibold"
          >
            Sign up
          </a>
          <a
            href={`/auth/signin?next=${encodeURIComponent(`/store/${cafeSlug}`)}`}
            className="px-4 py-2 rounded-control border border-border text-ink-2 text-xs font-semibold"
          >
            Log in
          </a>
        </div>
      </div>
    );
  }

  const tierColor = TIER_COLORS[loyalty.tier] || "#B08D57";
  const progressPercent = Math.min(100, loyalty.progressPercent);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-3 overflow-y-auto pb-4">
      {/* Points + Tier card */}
      <div className="rounded-card bg-white border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-3 font-medium uppercase tracking-wide">Your points</p>
            <p className="text-3xl font-bold text-ink mt-0.5">{loyalty.points}</p>
            <p className="text-xs text-ink-3 mt-0.5">
              {loyalty.rewardsAvailable} rewards available
            </p>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#F0F2F8" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke={tierColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`px-2 py-0.5 rounded-pill text-[10px] font-bold ${TIER_STYLES[loyalty.tier] || TIER_STYLES.BRONZE}`}
              >
                {loyalty.tier}
              </span>
            </div>
          </div>
        </div>
        {loyalty.pointsToNextTier > 0 && (
          <p className="text-xs text-ink-3 mt-2">
            {loyalty.pointsToNextTier} pts to {loyalty.nextTier}
          </p>
        )}
      </div>

      {/* Rewards redemption link */}
      <a
        href={`/store/${cafeSlug}/rewards`}
        className={`rounded-card border p-4 flex items-center gap-3 transition-colors ${
          loyalty.rewardsAvailable > 0
            ? 'bg-white border-primary/30 hover:border-primary/60'
            : 'bg-white border-border hover:border-ink-3/30'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            loyalty.rewardsAvailable > 0
              ? 'bg-primary-soft text-primary'
              : 'bg-bg-hover text-ink-3'
          }`}
        >
          <Gift size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">
            {loyalty.rewardsAvailable > 0
              ? `${loyalty.rewardsAvailable} reward${loyalty.rewardsAvailable > 1 ? 's' : ''} available`
              : 'Redeem rewards'}
          </p>
          <p className="text-xs text-ink-3 mt-0.5">
            {loyalty.rewardsAvailable > 0
              ? 'Tap to see what you can redeem with your points'
              : 'Earn more points to unlock free drinks & discounts'}
          </p>
        </div>
        <span className={`text-xs font-semibold shrink-0 ${loyalty.rewardsAvailable > 0 ? 'text-primary' : 'text-ink-3'}`}>
          View &rarr;
        </span>
      </a>

      {/* Streak card */}
      {loyalty.streakCount > 0 && (
        <div className="rounded-card bg-white border border-border p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-soft flex items-center justify-center shrink-0">
            <Flame size={22} className="text-amber" />
          </div>
          <div>
            <p className="font-bold text-ink text-lg">{loyalty.streakCount} day streak</p>
            <p className="text-xs text-ink-3">Keep visiting to earn bonus points</p>
          </div>
        </div>
      )}

      {/* Daily Check-in */}
      <DailyCheckIn slug={cafeSlug} />

      {/* Fortune Box */}
      <FortuneBox slug={cafeSlug} />

      {/* Referral */}
      <div className="rounded-card bg-white border border-border p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-control bg-violet/10 flex items-center justify-center shrink-0">
            <Gift size={16} className="text-violet" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Refer & earn</p>
            <p className="text-xs text-ink-3">
              You get {referrerBonus} pts, your friend gets {referredBonus} pts
            </p>
          </div>
        </div>
        {referral.referralCode && (
          <button
            type="button"
            onClick={onCopyCode}
            className="w-full flex items-center justify-between px-3 py-2 rounded-control bg-bg-subtle border border-border font-mono text-sm text-ink"
          >
            {referral.referralCode}
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-ink-3" />}
          </button>
        )}
        <p className="text-xs text-ink-3">
          {referral.referredCount} friends referred · {referral.pointsEarnedFromReferrals} pts earned
        </p>
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => onRedeemCodeChange(e.target.value)}
            placeholder="Have a friend's code?"
            className="flex-1 min-w-0 px-3 py-2 rounded-control border border-border text-sm font-mono uppercase"
          />
          <button
            type="button"
            onClick={onRedeem}
            disabled={redeeming}
            className="px-3 py-2 rounded-control bg-ink text-white text-sm font-semibold disabled:opacity-50"
          >
            Apply
          </button>
        </div>
        {redeemMessage && (
          <p className={`text-xs font-medium ${redeemMessage.ok ? "text-success" : "text-error"}`}>
            {redeemMessage.text}
          </p>
        )}
      </div>
    </div>
  );
}
