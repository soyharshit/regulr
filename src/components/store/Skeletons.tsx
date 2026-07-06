"use client";

export function MenuCardSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-card border border-border p-3.5 flex items-center justify-between gap-3 mb-2.5"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-14 h-14 rounded-control bg-bg-hover shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-28 bg-bg-hover rounded" />
              <div className="h-3 w-20 bg-bg-hover rounded" />
              <div className="h-4 w-12 bg-bg-hover rounded" />
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-bg-hover shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function RewardCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="rounded-card bg-white border border-border p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-bg-hover rounded" />
            <div className="h-8 w-20 bg-bg-hover rounded" />
          </div>
          <div className="w-20 h-20 rounded-full bg-bg-hover" />
        </div>
      </div>
      <div className="rounded-card bg-white border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-bg-hover" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-24 bg-bg-hover rounded" />
            <div className="h-3 w-32 bg-bg-hover rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-card border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 w-24 bg-bg-hover rounded" />
            <div className="h-5 w-16 bg-bg-hover rounded-pill" />
          </div>
          <div className="h-3 w-40 bg-bg-hover rounded mb-2" />
          <div className="h-4 w-48 bg-bg-hover rounded mb-3" />
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="h-5 w-16 bg-bg-hover rounded" />
            <div className="h-7 w-20 bg-bg-hover rounded-control" />
          </div>
        </div>
      ))}
    </div>
  );
}
