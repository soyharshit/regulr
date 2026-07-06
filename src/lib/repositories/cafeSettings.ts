import { db } from "../db";

export interface Coupon {
  code: string;
  discountPercent?: number;
  discountPaise?: number;
  maxUses?: number;
}

export interface Reward {
  id: string;
  title: string;
  cost: number; // points required
  description?: string;
}

export interface GrowthSettings {
  loyaltyEnabled: boolean;
  pointsPerRupee: number;
  streakMilestones: number[];
  coupons: Coupon[];
  rewards: Reward[];
  gstRate: number;
}

const DEFAULT_SETTINGS: GrowthSettings = {
  loyaltyEnabled: true,
  pointsPerRupee: 1,
  streakMilestones: [3, 7, 14, 30],
  coupons: [{ code: "WELCOME10", discountPercent: 10, maxUses: 500 }],
  rewards: [],
  gstRate: 0.05,
};

function parse(raw: {
  loyaltyEnabled: boolean;
  pointsPerRupee: number;
  streakMilestones: string;
  coupons: string;
  rewards?: string;
  gstRate: number;
}): GrowthSettings {
  return {
    loyaltyEnabled: raw.loyaltyEnabled,
    pointsPerRupee: raw.pointsPerRupee,
    streakMilestones: JSON.parse(raw.streakMilestones || "[]"),
    coupons: JSON.parse(raw.coupons || "[]"),
    rewards: JSON.parse(raw.rewards || "[]"),
    gstRate: raw.gstRate ?? 0.05,
  };
}

export async function getByCafeId(cafeId: string): Promise<GrowthSettings> {
  const row = await db.cafeSettings.findUnique({ where: { cafeId } });
  if (!row) return DEFAULT_SETTINGS;
  return parse(row);
}

export async function upsert(
  cafeId: string,
  settings: Partial<GrowthSettings>
): Promise<GrowthSettings> {
  const current = await getByCafeId(cafeId);
  const merged: GrowthSettings = {
    loyaltyEnabled: settings.loyaltyEnabled ?? current.loyaltyEnabled,
    pointsPerRupee: settings.pointsPerRupee ?? current.pointsPerRupee,
    streakMilestones: settings.streakMilestones ?? current.streakMilestones,
    coupons: settings.coupons ?? current.coupons,
    rewards: settings.rewards ?? current.rewards,
    gstRate: settings.gstRate ?? current.gstRate,
  };

  const payload = {
    loyaltyEnabled: merged.loyaltyEnabled,
    pointsPerRupee: merged.pointsPerRupee,
    streakMilestones: JSON.stringify(merged.streakMilestones),
    coupons: JSON.stringify(merged.coupons),
    rewards: JSON.stringify(merged.rewards),
    gstRate: merged.gstRate,
  };

  await db.cafeSettings.upsert({
    where: { cafeId },
    update: payload,
    create: { cafeId, ...payload },
  });

  return merged;
}

export async function findCoupon(cafeId: string, code: string): Promise<Coupon | null> {
  const settings = await getByCafeId(cafeId);
  const normalized = code.trim().toUpperCase();
  return settings.coupons.find((c) => c.code.toUpperCase() === normalized) || null;
}
