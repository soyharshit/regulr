'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  BarChart3,
  Store,
  TrendingUp,
  Settings2,
  Shield,
  ChevronLeft,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Cafes', href: '/admin/cafes', icon: Store },
  { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  { label: 'Operations', href: '/admin/operations', icon: Settings2 },
  { label: 'Audit Log', href: '/admin/audit', icon: Shield },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg-subtle">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col
          bg-white border-r border-border
          transition-all duration-200 ease-out
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]'}
          ${mobileOpen ? 'w-[260px] translate-x-0' : 'w-[260px] -translate-x-full'}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border flex-shrink-0">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="w-8 h-8 rounded-lg gradient-violet flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-display font-bold text-base text-ink tracking-tight">
              Regulr
            </span>
          </div>
          {/* Collapsed logo */}
          {collapsed && (
            <div className="hidden lg:flex items-center justify-center w-full">
              <div className="w-8 h-8 rounded-lg gradient-violet flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
            </div>
          )}
          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-bg-hover transition-colors duration-150"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              size={16}
              className={`text-ink-2 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md hover:bg-bg-hover"
          >
            <X size={18} className="text-ink-2" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center gap-3 h-11 rounded-control
                  transition-all duration-150 ease-out
                  ${collapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3'}
                  ${
                    isActive
                      ? 'bg-[#F0EEFF] text-[#6C5CE7]'
                      : 'text-ink-2 hover:bg-bg-hover hover:text-ink'
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#6C5CE7]" />
                )}
                <Icon
                  size={20}
                  className={`flex-shrink-0 ${isActive ? 'text-[#6C5CE7]' : 'text-ink-3 group-hover:text-ink-2'}`}
                />
                <span
                  className={`text-sm font-medium whitespace-nowrap ${
                    collapsed ? 'lg:hidden' : ''
                  }`}
                >
                  {item.label}
                </span>
                {/* Tooltip for collapsed */}
                {collapsed && (
                  <div className="hidden lg:block absolute left-full ml-2.5 px-2.5 py-1.5 rounded-md bg-ink text-white text-xs font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-pop whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className={`border-t border-border p-3 flex-shrink-0 ${collapsed ? 'lg:px-2' : ''}`}>
          <div className={`flex items-center justify-between ${collapsed ? 'lg:justify-center' : ''}`}>
            <div className={`flex items-center gap-2.5 ${collapsed ? 'lg:justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-[#6C5CE7] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">SA</span>
              </div>
              <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
                <p className="text-sm font-medium text-ink truncate">Super Admin</p>
                <p className="text-xs text-ink-3 truncate">superadmin@regulr.in</p>
              </div>
            </div>
            
            {!collapsed && (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 rounded-control text-ink-2 hover:bg-error-soft hover:text-error transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
            
            {collapsed && (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="hidden lg:flex w-8 h-8 mt-2 mx-auto items-center justify-center rounded-control text-ink-2 hover:bg-error-soft hover:text-error transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
          
          <div className={`mt-2 flex items-center ${collapsed ? 'lg:justify-center' : 'justify-end'}`}>
             <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center h-14 px-4 bg-white/90 backdrop-blur-md border-b border-border">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-10 h-10 -ml-1 rounded-control hover:bg-bg-hover transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-ink" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-6 h-6 rounded-md gradient-violet flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">R</span>
            </div>
            <span className="font-display font-bold text-sm text-ink">Regulr Admin</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
