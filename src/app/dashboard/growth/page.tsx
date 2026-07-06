'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Percent, IndianRupee, Gift } from 'lucide-react';

interface Coupon {
  code: string;
  discountPercent?: number;
  discountPaise?: number;
  maxUses?: number;
}

interface Reward {
  id: string;
  title: string;
  cost: number;
  description?: string;
}

interface GrowthSettings {
  loyaltyEnabled: boolean;
  pointsPerRupee: number;
  streakMilestones: number[];
  coupons: Coupon[];
  rewards: Reward[];
}

const DEFAULT_SETTINGS: GrowthSettings = {
  loyaltyEnabled: true,
  pointsPerRupee: 1,
  streakMilestones: [3, 7, 14, 30],
  coupons: [{ code: 'WELCOME10', discountPercent: 10, maxUses: 500 }],
  rewards: [],
};

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsPaid: number;
  recent: { referrer: string; referred: string; status: string; pointsAwarded: number }[];
}

export default function GrowthSettingsPage() {
  const [settings, setSettings] = useState<GrowthSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('10');
  const [newDiscountType, setNewDiscountType] = useState<'percent' | 'flat'>('percent');
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('100');

  useEffect(() => {
    fetch('/api/growth')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.coupons)) {
          setSettings({ ...d, rewards: Array.isArray(d.rewards) ? d.rewards : [] });
        }
      })
      .catch(() => {});

    fetch('/api/referrals')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.scope === 'cafe') setReferralStats(d);
      })
      .catch(() => {});
  }, []);

  const save = async (next: GrowthSettings) => {
    setError(null);
    const res = await fetch('/api/growth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (res.status === 401) {
      setError('Sign in as this cafe’s owner to save changes.');
      return;
    }
    if (!res.ok) {
      setError('Could not save settings.');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addReward = () => {
    const title = newRewardTitle.trim();
    const cost = Math.max(1, Math.round(Number(newRewardCost)) || 0);
    if (!title || !cost) return;
    const reward: Reward = { id: `rw_${Date.now()}`, title, cost };
    const next = { ...settings, rewards: [...settings.rewards, reward] };
    setSettings(next);
    save(next);
    setNewRewardTitle('');
  };

  const removeReward = (id: string) => {
    const next = { ...settings, rewards: settings.rewards.filter((r) => r.id !== id) };
    setSettings(next);
    save(next);
  };

  const addCoupon = () => {
    const code = newCode.trim().toUpperCase();
    if (!code) return;
    const coupon: Coupon =
      newDiscountType === 'percent'
        ? { code, discountPercent: Number(newDiscount) || 0 }
        : { code, discountPaise: Math.round((Number(newDiscount) || 0) * 100) };
    const next = { ...settings, coupons: [...settings.coupons, coupon] };
    setSettings(next);
    save(next);
    setNewCode('');
  };

  const removeCoupon = (code: string) => {
    const next = { ...settings, coupons: settings.coupons.filter((c) => c.code !== code) };
    setSettings(next);
    save(next);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-lg">
      <div>
        <h1 className="font-display font-bold text-xl text-ink">Growth Settings</h1>
        <p className="text-sm text-ink-2 mt-1">Loyalty points, streaks, and coupons for your storefront</p>
      </div>

      <label className="flex items-center gap-3 rounded-card bg-white p-4 shadow-card">
        <input
          type="checkbox"
          checked={settings.loyaltyEnabled}
          onChange={(e) => {
            const next = { ...settings, loyaltyEnabled: e.target.checked };
            setSettings(next);
            save(next);
          }}
        />
        <span className="text-sm font-medium">Loyalty program enabled</span>
      </label>

      <div className="rounded-card bg-white p-4 shadow-card space-y-2">
        <label className="text-sm font-medium text-ink">Points earned per ₹1 spent</label>
        <input
          type="number"
          min={0}
          step={0.1}
          value={settings.pointsPerRupee}
          onChange={(e) => setSettings({ ...settings, pointsPerRupee: Number(e.target.value) })}
          onBlur={() => save(settings)}
          className="w-full px-3 py-2 rounded-control border border-border text-sm"
        />
        <p className="text-[11px] text-ink-3">
          Customers redeem 100 points for ₹10 off at checkout.
        </p>
      </div>

      <div className="rounded-card bg-white p-4 shadow-card space-y-2">
        <label className="text-sm font-medium text-ink">Streak milestones (days)</label>
        <p className="text-xs text-ink-2 font-mono">{settings.streakMilestones.join(', ')}</p>
      </div>

      <div className="rounded-card bg-white p-4 shadow-card space-y-3">
        <p className="text-sm font-medium text-ink">Active coupons</p>
        {settings.coupons.length === 0 && (
          <p className="text-xs text-ink-3">No coupons yet — add one below.</p>
        )}
        <div className="space-y-2">
          {settings.coupons.map((c) => (
            <div
              key={c.code}
              className="flex items-center justify-between rounded-control bg-bg-subtle border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-ink">{c.code}</span>
                <span className="text-xs text-ink-2">
                  {c.discountPercent ? `${c.discountPercent}% off` : `₹${(c.discountPaise || 0) / 100} off`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeCoupon(c.code)}
                className="text-ink-3 hover:text-error transition-colors"
                aria-label={`Remove ${c.code}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="CODE"
            className="flex-1 min-w-0 px-3 py-2 rounded-control border border-border text-sm font-mono uppercase"
          />
          <input
            type="number"
            value={newDiscount}
            onChange={(e) => setNewDiscount(e.target.value)}
            className="w-16 px-2 py-2 rounded-control border border-border text-sm"
          />
          <button
            type="button"
            onClick={() => setNewDiscountType(newDiscountType === 'percent' ? 'flat' : 'percent')}
            className="p-2 rounded-control border border-border text-ink-2 hover:bg-bg-subtle"
            aria-label="Toggle discount type"
            title={newDiscountType === 'percent' ? 'Percent off' : 'Flat rupees off'}
          >
            {newDiscountType === 'percent' ? <Percent size={14} /> : <IndianRupee size={14} />}
          </button>
          <button
            type="button"
            onClick={addCoupon}
            className="p-2 rounded-control bg-primary text-white hover:bg-primary-hover"
            aria-label="Add coupon"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Rewards store */}
      <div className="rounded-card bg-white p-4 shadow-card space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-control bg-primary-soft flex items-center justify-center">
            <Gift size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Rewards store</p>
            <p className="text-xs text-ink-3">Let customers redeem points for perks — the reason they come back</p>
          </div>
        </div>
        {settings.rewards.length === 0 && (
          <p className="text-xs text-ink-3">No rewards yet — add one (e.g. “Free coffee” for 200 pts).</p>
        )}
        <div className="space-y-2">
          {settings.rewards.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-control bg-bg-subtle border border-border px-3 py-2">
              <div>
                <span className="text-sm font-medium text-ink">{r.title}</span>
                <span className="text-xs text-primary font-semibold ml-2">{r.cost} pts</span>
              </div>
              <button
                type="button"
                onClick={() => removeReward(r.id)}
                className="text-ink-3 hover:text-error transition-colors"
                aria-label={`Remove ${r.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <input
            type="text"
            value={newRewardTitle}
            onChange={(e) => setNewRewardTitle(e.target.value)}
            placeholder="Reward (e.g. Free cookie)"
            className="flex-1 min-w-0 px-3 py-2 rounded-control border border-border text-sm"
          />
          <input
            type="number"
            value={newRewardCost}
            onChange={(e) => setNewRewardCost(e.target.value)}
            className="w-20 px-2 py-2 rounded-control border border-border text-sm"
            aria-label="Reward cost in points"
          />
          <span className="text-xs text-ink-3">pts</span>
          <button
            type="button"
            onClick={addReward}
            className="p-2 rounded-control bg-primary text-white hover:bg-primary-hover"
            aria-label="Add reward"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-error font-medium">{error}</p>}
      {saved && <p className="text-sm text-success font-medium">Settings saved</p>}

      {referralStats && (
        <div className="rounded-card bg-white p-4 shadow-card space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-control bg-violet/10 flex items-center justify-center">
              <Gift size={16} className="text-violet" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Refer-a-friend program</p>
              <p className="text-xs text-ink-3">Every customer gets a shareable code on your storefront</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-control bg-bg-subtle py-2.5">
              <p className="text-lg font-bold text-ink">{referralStats.totalReferrals}</p>
              <p className="text-[11px] text-ink-3">Total</p>
            </div>
            <div className="rounded-control bg-bg-subtle py-2.5">
              <p className="text-lg font-bold text-success">{referralStats.completedReferrals}</p>
              <p className="text-[11px] text-ink-3">Completed</p>
            </div>
            <div className="rounded-control bg-bg-subtle py-2.5">
              <p className="text-lg font-bold text-ink">{referralStats.totalPointsPaid}</p>
              <p className="text-[11px] text-ink-3">Points paid</p>
            </div>
          </div>
          {referralStats.recent.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              {referralStats.recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-ink-2">
                    {r.referrer} → {r.referred}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-pill font-semibold ${
                      r.status === 'COMPLETED' ? 'bg-success-soft text-success' : 'bg-bg-subtle text-ink-3 border border-border'
                    }`}
                  >
                    {r.status === 'COMPLETED' ? `+${r.pointsAwarded}` : 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
