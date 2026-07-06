"use client";

import { User, LogOut, Loader2, Receipt } from "lucide-react";

interface AccountTabProps {
  cafeName: string;
  cafeSlug: string;
  userName: string | null;
  userEmail: string;
  signingOut: boolean;
  onSignOut: () => void;
}

export function AccountTab({
  cafeName,
  cafeSlug,
  userName,
  userEmail,
  signingOut,
  onSignOut,
}: AccountTabProps) {
  return (
    <div className="space-y-3 pb-4">
      {/* Profile card */}
      <div className="rounded-card bg-white border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
            <User size={24} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-ink text-base truncate">
              {userName || "Customer"}
            </p>
            <p className="text-xs text-ink-3 truncate">{userEmail}</p>
            <p className="text-[11px] text-ink-3/60 mt-0.5">Member of {cafeName}</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <a
        href={`/store/${cafeSlug}/orders`}
        className="rounded-card bg-white border border-border p-4 flex items-center gap-3 hover:bg-bg-subtle transition-colors"
      >
        <div className="w-9 h-9 rounded-control bg-bg-subtle flex items-center justify-center shrink-0">
          <Receipt size={16} className="text-ink-2" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">My orders</p>
          <p className="text-xs text-ink-3">View your order history</p>
        </div>
      </a>

      {/* Sign out */}
      <button
        type="button"
        disabled={signingOut}
        onClick={onSignOut}
        className="w-full rounded-card bg-white border border-border p-4 flex items-center justify-center gap-2 text-sm font-semibold text-ink-3 hover:text-error transition-colors disabled:opacity-60"
      >
        {signingOut ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <LogOut size={16} />
        )}
        Sign out
      </button>
    </div>
  );
}
