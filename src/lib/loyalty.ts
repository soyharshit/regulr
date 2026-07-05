export const TIER_THRESHOLDS: Record<string, number> = {
  BRONZE: 0,
  SILVER: 200,
  GOLD: 500,
  PLATINUM: 1000,
};

const TIER_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

export const REFERRAL_REFERRER_BONUS = 100;
export const REFERRAL_REFERRED_BONUS = 50;

export function tierForPoints(points: number): string {
  let tier = "BRONZE";
  for (const t of TIER_ORDER) {
    if (points >= TIER_THRESHOLDS[t]) tier = t;
  }
  return tier;
}

export function nextTier(current: string): { tier: string; pointsNeeded: number } | null {
  const idx = TIER_ORDER.indexOf(current);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null;
  const tier = TIER_ORDER[idx + 1];
  return { tier, pointsNeeded: TIER_THRESHOLDS[tier] };
}

/** Appends today's visit to the streak calendar, incrementing the streak only if the previous day was also visited. */
export function recordVisitForStreak(
  streakCalendarJson: string,
  streakCount: number,
  todayIso: string
): { streakCalendar: string; streakCount: number } {
  const days: string[] = JSON.parse(streakCalendarJson || "[]");
  if (days.includes(todayIso)) {
    return { streakCalendar: JSON.stringify(days), streakCount };
  }

  const yesterday = new Date(`${todayIso}T00:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayIso = yesterday.toISOString().slice(0, 10);
  const continued = days.includes(yesterdayIso);

  const updatedDays = [...days, todayIso].slice(-90); // cap stored history
  return {
    streakCalendar: JSON.stringify(updatedDays),
    streakCount: continued ? streakCount + 1 : 1,
  };
}
