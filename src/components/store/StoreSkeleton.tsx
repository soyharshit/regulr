export function StoreSkeleton() {
  return (
    <div className="px-4 mt-4 space-y-4 animate-fade-in" data-testid="store-skeleton">
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton flex-shrink-0 h-[72px] w-[140px] rounded-card" />
        ))}
      </div>
      <div className="skeleton h-[88px] rounded-card" />
      <div className="flex gap-2 overflow-x-auto py-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton flex-shrink-0 h-9 w-24 rounded-pill" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-[120px] rounded-card" />
        ))}
      </div>
    </div>
  );
}
