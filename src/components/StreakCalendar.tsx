"use client";

import { useMemo } from "react";

interface StreakCalendarProps {
  streakCalendar: string[];
  streakCount: number;
  milestones?: number[];
  compact?: boolean;
  className?: string;
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getWeeks(calendarSet: Set<string>, totalWeeks: number): (string | null)[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDay = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - endDay - (totalWeeks - 1) * 7);

  const weeks: (string | null)[][] = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < totalWeeks; w++) {
    const week: (string | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if (cursor > today) {
        week.push(null);
      } else {
        const iso = cursor.toISOString().slice(0, 10);
        week.push(calendarSet.has(iso) ? iso : null);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function getMonthLabels(weeks: (string | null)[][]): { label: string; weekIndex: number }[] {
  const months: { label: string; weekIndex: number }[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastMonth = -1;

  for (let w = 0; w < weeks.length; w++) {
    for (const day of weeks[w]) {
      if (day) {
        const m = new Date(day + "T00:00:00").getMonth();
        if (m !== lastMonth) {
          months.push({ label: monthNames[m], weekIndex: w });
          lastMonth = m;
        }
        break;
      }
    }
  }
  return months;
}

export function StreakCalendar({
  streakCalendar,
  streakCount: _streakCount,
  milestones = [3, 7, 14, 30],
  compact = false,
  className = "",
}: StreakCalendarProps) {
  const totalWeeks = compact ? 5 : 13;

  const { weeks, milestoneSet, monthLabels } = useMemo(() => {
    const set = new Set(streakCalendar);
    const w = getWeeks(set, totalWeeks);
    return {
      weeks: w,
      calendarSet: set,
      milestoneSet: new Set(milestones),
      monthLabels: getMonthLabels(w),
    };
  }, [streakCalendar, totalWeeks, milestones]);

  const isMilestone = (dayNum: number) => milestoneSet.has(dayNum);

  return (
    <div className={className}>
      {/* Month labels */}
      <div className="flex gap-0 ml-8 mb-1">
        {monthLabels.map((m, i) => (
          <div
            key={`${m.label}-${i}`}
            className="text-[10px] text-ink-3 font-medium"
            style={{ marginLeft: m.weekIndex === 0 && i === 0 ? 0 : undefined }}
          >
            {m.label}
          </div>
        ))}
      </div>

      <div className="flex gap-0">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="w-6 h-3 flex items-center text-[9px] text-ink-3">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-0.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => {
                if (!day) {
                  return <div key={di} className="w-3 h-3 rounded-sm bg-transparent" />;
                }
                const dayIndex = streakCalendar.indexOf(day);
                const dayNum = dayIndex >= 0 ? dayIndex + 1 : 0;
                const isM = dayNum > 0 && isMilestone(dayNum);
                const isToday = day === new Date().toISOString().slice(0, 10);

                let bgClass = "bg-bg-hover";
                if (day) {
                  const age = Math.floor(
                    (Date.now() - new Date(day + "T00:00:00").getTime()) / 86400000
                  );
                  if (age <= 2) bgClass = "bg-primary";
                  else if (age <= 7) bgClass = "bg-primary/70";
                  else bgClass = "bg-primary/40";
                }

                return (
                  <div key={di} className="relative group">
                    <div
                      className={`w-3 h-3 rounded-sm ${bgClass} ${
                        isToday ? "ring-1 ring-ink/30" : ""
                      } transition-colors`}
                      title={day}
                    />
                    {isM && (
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber" />
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-ink text-white text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {new Date(day + "T00:00:00").toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-ink-3">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Recent
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary/70" /> 3-7 days
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary/40" /> Older
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber" /> Milestone
        </span>
      </div>
    </div>
  );
}
