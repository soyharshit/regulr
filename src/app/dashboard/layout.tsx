'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Rocket,
  Users,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ChefHat,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', badge: null },
  { label: 'Orders', icon: ShoppingBag, href: '/dashboard/orders', badge: 3 },
  { label: 'KDS', icon: ChefHat, href: '/dashboard/kds', badge: null },
  { label: 'Menu', icon: UtensilsCrossed, href: '/dashboard/menu', badge: null },
  { label: 'Growth', icon: Rocket, href: '/dashboard/growth', badge: null },
  { label: 'Customers', icon: Users, href: '/dashboard/customers', badge: null },
  { label: 'Billing', icon: Receipt, href: '/dashboard/billing', badge: null },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings', badge: null },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-bg-subtle border-r border-border
          transition-all duration-200 ease-out
          lg:relative lg:translate-x-0
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-[252px]'}
          ${mobileOpen ? 'w-[252px] translate-x-0' : 'w-[252px] -translate-x-full'}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border shrink-0">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 animate-fade-in">
              <div className="w-8 h-8 rounded-lg gradient-coral flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">R</span>
              </div>
              <span className="font-display font-bold text-lg text-ink tracking-tight">
                Regulr
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto animate-fade-in">
              <div className="w-8 h-8 rounded-lg gradient-coral flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">R</span>
              </div>
            </Link>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-control hover:bg-bg-hover transition-colors"
          >
            <X size={20} className="text-ink-2" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center gap-3 rounded-control
                  transition-all duration-150 ease-out
                  ${collapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'}
                  ${
                    isActive
                      ? 'bg-primary-soft text-primary font-medium'
                      : 'text-ink-2 hover:bg-bg-hover hover:text-ink'
                  }
                `}
              >
                {/* Coral active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                )}

                <span className="relative shrink-0">
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  {/* Notification dot for Orders */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </span>

                {!collapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}

                {/* Tooltip on collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2.5 py-1.5 rounded-control bg-ink text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-pop z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-border p-3 space-y-2">
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-control text-ink-2 hover:bg-bg-hover hover:text-ink transition-colors text-sm"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-control text-ink-2 hover:bg-error-soft hover:text-error transition-colors text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>

          {/* Theme Toggle */}
          <div className={`flex w-full items-center px-3 py-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && <span className="text-sm text-ink-2 font-medium">Theme</span>}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-white shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-control hover:bg-bg-hover transition-colors"
          >
            <Menu size={22} className="text-ink" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-6 h-6 rounded-md gradient-coral flex items-center justify-center">
              <span className="text-white font-display font-bold text-[10px]">R</span>
            </div>
            <span className="font-display font-bold text-sm text-ink">Regulr</span>
          </div>
        </div>

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
