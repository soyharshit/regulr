"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

interface DailyCheckInProps {
  slug: string;
}

interface CheckInData {
  checkedInToday: boolean;
  streak: number;
  todayReward: number;
  lastCheckIn: string | null;
  checkedDays?: string[];
}

interface MonthDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  isCheckedIn: boolean;
  reward: number;
}

const MILESTONES = [7, 14, 21, 30];

function getNextMilestone(streak: number): number {
  for (const m of MILESTONES) {
    if (streak < m) return m;
  }
  return 30;
}

function getRewardForDay(streakDay: number): number {
  const DAILY = [2, 3, 4, 5, 6, 7];
  const MILE: Record<number, number> = { 7: 25, 14: 50, 21: 75, 30: 150 };
  if (MILE[streakDay]) return MILE[streakDay];
  return DAILY[Math.min(streakDay - 1, DAILY.length - 1)] || 2;
}

function buildCalendarMonth(
  checkedDays: Set<string>,
  todayStr: string
): MonthDay[] {
  const today = new Date(todayStr + "T00:00:00");
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days: MonthDay[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const ds = d.toISOString().slice(0, 10);
    days.push({
      date: d,
      dayOfMonth: d.getDate(),
      isCurrentMonth: false,
      isToday: false,
      isFuture: d > today,
      isCheckedIn: checkedDays.has(ds),
      reward: 2,
    });
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    const ds = d.toISOString().slice(0, 10);
    const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
    const streakDay = diffDays >= 0 ? diffDays + 1 : 0;
    days.push({
      date: d,
      dayOfMonth: d.getDate(),
      isCurrentMonth: true,
      isToday: ds === todayStr,
      isFuture: d > today,
      isCheckedIn: checkedDays.has(ds),
      reward: streakDay > 0 ? getRewardForDay(streakDay) : 2,
    });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const ds = d.toISOString().slice(0, 10);
    days.push({
      date: d,
      dayOfMonth: d.getDate(),
      isCurrentMonth: false,
      isToday: false,
      isFuture: true,
      isCheckedIn: checkedDays.has(ds),
      reward: 2,
    });
  }

  return days;
}

function GoldCoinIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
      <circle cx="8" cy="8" r="5" stroke="#DAA520" strokeWidth="0.5" fill="none" />
      <text
        x="8"
        y="8.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="7"
        fontWeight="bold"
        fill="#B8860B"
      >
        $
      </text>
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg className="w-5 h-5 animate-pulse-soft" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6.5 8 4 12 4 15a8 8 0 0016 0c0-3-2.5-7-8-13z"
        fill="url(#flame-grad)"
      />
      <path
        d="M12 9c-2 3-3 5-3 7a3 3 0 006 0c0-2-1-4-3-7z"
        fill="#FFD700"
      />
      <defs>
        <linearGradient id="flame-grad" x1="12" y1="2" x2="12" y2="23">
          <stop offset="0%" stopColor="#FF6B4A" />
          <stop offset="100%" stopColor="#E53935" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function DailyCheckIn({ slug }: DailyCheckInProps) {
  const [data, setData] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [recentPoints, setRecentPoints] = useState(0);
  const animRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/customer/checkin?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleCheckIn = useCallback(async () => {
    if (checking || data?.checkedInToday) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/customer/checkin?slug=${slug}`, { method: "POST" });
      const result = await res.json();
      if (res.ok && !result.alreadyCheckedIn) {
        setRecentPoints(result.points);
        setShowCoinAnim(true);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#FFD700", "#FF6B4A", "#E53935"],
        });
        setTimeout(() => setShowCoinAnim(false), 1200);
        setData((prev) =>
          prev
            ? {
                ...prev,
                checkedInToday: true,
                streak: result.newStreak,
                todayReward: result.points,
              }
            : prev
        );
      }
    } catch {
      /* silent */
    } finally {
      setChecking(false);
    }
  }, [slug, checking, data?.checkedInToday]);

  if (loading) {
    return (
      <div className="rounded-card bg-white shadow-card p-6 animate-pulse-soft">
        <div className="h-8 bg-bg-subtle rounded-lg w-48 mb-4" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-bg-subtle rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const checkedDaySet = new Set<string>(
    data.checkedDays || (data.lastCheckIn ? [data.lastCheckIn] : [])
  );
  const calendarDays = buildCalendarMonth(checkedDaySet, todayStr);
  const nextMilestone = getNextMilestone(data.streak);
  const daysToMilestone = nextMilestone - data.streak;
  const progressPercent = Math.round((data.streak / nextMilestone) * 100);
  const monthLabel = new Date(todayStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-card bg-white shadow-card overflow-hidden">
      <div className="bg-lucky-red px-5 py-4">
        <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="3" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M3 9h18" stroke="white" strokeWidth="1.5" />
            <circle cx="8" cy="14" r="1" fill="white" />
            <circle cx="12" cy="14" r="1" fill="#FFD700" />
            <circle cx="16" cy="14" r="1" fill="white" />
          </svg>
          Daily Check-in
        </h2>
        <p className="text-white/70 text-xs mt-1">{monthLabel}</p>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FlameIcon />
            <span className="text-sm font-bold text-ink">
              Day {data.streak} streak
            </span>
          </div>
          <div className="text-xs text-ink-3">
            {daysToMilestone > 0
              ? `${daysToMilestone} more day${daysToMilestone > 1 ? "s" : ""} to ${nextMilestone} day bonus`
              : "Milestone reached!"}
          </div>
        </div>

        <div className="w-full h-2 bg-bg-subtle rounded-full mb-5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-lucky-red to-lucky-gold transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-ink-3 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            const isToday = day.isToday;
            const isChecked = day.isCheckedIn;
            const isFuture = day.isFuture && !day.isToday;
            return (
              <div
                key={i}
                className={`
                  relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs
                  ${isChecked ? "bg-lucky-red/10" : ""}
                  ${isToday && !isChecked ? "animate-glow-pulse border-2 border-lucky-gold" : ""}
                  ${isFuture ? "opacity-30" : ""}
                  ${!day.isCurrentMonth ? "opacity-20" : ""}
                  ${isToday && !isChecked ? "z-10" : ""}
                `}
              >
                <span
                  className={`text-[11px] font-medium ${
                    isChecked ? "text-lucky-red font-bold" : isToday ? "text-lucky-red font-bold" : "text-ink"
                  }`}
                >
                  {day.dayOfMonth}
                </span>
                {!isFuture && day.isCurrentMonth && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <GoldCoinIcon className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-bold text-lucky-gold">
                      {day.reward}
                    </span>
                  </div>
                )}
                {isChecked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-lucky-red/40" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5l3.5 3.5 6.5-8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                {isToday && !isChecked && !isFuture && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-lucky-gold rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {data.checkedInToday ? (
          <div className="mt-5 py-3 rounded-control bg-lucky-cream text-lucky-red text-center text-sm font-bold">
            ✓ Already checked in today! +{data.todayReward} points
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={checking}
            className="mt-5 w-full py-3 rounded-control gradient-coral text-white font-bold text-sm press-scale disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
            data-testid="checkin-btn"
          >
            {showCoinAnim && (
              <div ref={animRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="animate-float-up text-lucky-gold font-bold text-lg">
                  +{recentPoints}
                </div>
              </div>
            )}
            <span className={showCoinAnim ? "opacity-0" : ""}>
              {checking ? "Checking in..." : `Check in (+${data.todayReward} pts)`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
