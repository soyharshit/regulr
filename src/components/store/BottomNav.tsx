"use client";

import { ClipboardList, Gift, User, Soup } from "lucide-react";

type TabId = "menu" | "orders" | "rewards" | "account";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  cartCount: number;
}

const TABS: { id: TabId; label: string; icon: typeof Soup }[] = [
  { id: "menu", label: "Menu", icon: Soup },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "account", label: "Account", icon: User },
];

export function BottomNav({ activeTab, onTabChange, cartCount }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around h-14">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className="relative flex flex-col items-center justify-center h-full px-3 min-w-0 transition-colors"
            >
              {id === "menu" && cartCount > 0 && (
                <span className="absolute -top-0.5 right-1/2 translate-x-[10px] w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
              <Icon
                size={20}
                className={isActive ? "text-primary" : "text-ink-3"}
              />
              <span
                className={`text-[10px] font-medium mt-0.5 ${
                  isActive ? "text-primary" : "text-ink-3"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
