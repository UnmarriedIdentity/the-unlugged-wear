'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home as HomeIcon,
  ClipboardList,
  Package,
  Users,
  TrendingUp,
  LayoutGrid,
  ShoppingBag,
  Settings,
  Headphones,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  PackageCheck,
  Truck,
  Undo2,
  RotateCcw,
  CreditCard,
  Layers,
  Palette,
  FileText,
  ShieldCheck,
  MoonStar,
  Contrast,
  PanelLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

// Module-level cache to persist open group state across Next.js client-side page transitions
let globalOpenGroups: Set<string> | null = null;
const STORAGE_KEY = 'tuw_admin_open_groups';

function getActiveGroupForPath(pathname: string): string | null {
  if (
    pathname === '/' ||
    pathname === '/dashboard' ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/customers') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/analytics')
  ) {
    return 'core';
  }
  if (
    pathname.startsWith('/fulfillment') ||
    pathname.startsWith('/shipments') ||
    pathname.startsWith('/returns') ||
    pathname.startsWith('/refunds') ||
    pathname.startsWith('/payments')
  ) {
    return 'operations';
  }
  if (
    pathname.startsWith('/collections') ||
    pathname.startsWith('/designs') ||
    pathname.startsWith('/content')
  ) {
    return 'merchandise';
  }
  if (
    pathname.startsWith('/team') ||
    pathname.startsWith('/audit-log')
  ) {
    return 'system';
  }
  return null;
}

interface NavBadgeDef {
  text: string;
  className: string;
}

interface NavItemDef {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string[];
  badge?: NavBadgeDef;
}

interface NavGroupDef {
  key: string;
  label: string;
  icon: LucideIcon;
  items: NavItemDef[];
}

// Single source of truth for sidebar navigation (pixel-identical rendering;
// groups and items below map over this config — no hand-written repeats).
const NAV_GROUPS: NavGroupDef[] = [
  {
    key: 'core',
    label: 'Core',
    icon: LayoutGrid,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: HomeIcon, match: ['/dashboard'] },
      { href: '/orders', label: 'Orders', icon: ClipboardList, match: ['/orders'] },
      { href: '/products', label: 'Products', icon: Package, match: ['/products'] },
      { href: '/customers', label: 'Customers', icon: Users, match: ['/customers'] },
      { href: '/reports', label: 'Analytics & Reports', icon: TrendingUp, match: ['/reports', '/analytics'] },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    icon: Package,
    items: [
      { href: '/fulfillment', label: 'Fulfillment', icon: PackageCheck, match: ['/fulfillment'], badge: { text: '4', className: 'inline-flex min-w-[18px] items-center justify-center rounded-full bg-nav-badge-purple-bg px-[7.5px] py-[2.5px] text-center text-[11.5px] font-bold leading-none text-action-primary' } },
      { href: '/shipments', label: 'Shipments', icon: Truck, match: ['/shipments'] },
      { href: '/returns', label: 'Returns & RMA', icon: Undo2, match: ['/returns'], badge: { text: '2', className: 'inline-flex min-w-[18px] items-center justify-center rounded-full bg-nav-badge-amber-bg px-[7.5px] py-[2.5px] text-center text-[11.5px] font-bold leading-none text-nav-badge-amber-text' } },
      { href: '/refunds', label: 'Refunds', icon: RotateCcw, match: ['/refunds'] },
      { href: '/payments', label: 'Payments', icon: CreditCard, match: ['/payments'] },
    ],
  },
  {
    key: 'merchandise',
    label: 'Merchandise',
    icon: ShoppingBag,
    items: [
      { href: '/collections', label: 'Collections', icon: Layers, match: ['/collections'] },
      { href: '/designs', label: 'Design Assets', icon: Palette, match: ['/designs'] },
      { href: '/content', label: 'Content CMS', icon: FileText, match: ['/content'] },
    ],
  },
  {
    key: 'system',
    label: 'System',
    icon: ShieldCheck,
    items: [
      { href: '/team', label: 'Team', icon: Users, match: ['/team'] },
      { href: '/audit-log', label: 'Audit Log', icon: ShieldCheck, match: ['/audit-log'] },
    ],
  },
];

interface FooterItemDef {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string[];
  variant: 'default' | 'danger';
}

const FOOTER_ITEMS: FooterItemDef[] = [
  { href: '/settings', label: 'Settings', icon: Settings, match: ['/settings'], variant: 'default' },
  { href: '/support', label: 'Help & Support', icon: Headphones, match: ['/support', '/help'], variant: 'default' },
  { href: '/login', label: 'Log out', icon: LogOut, match: [], variant: 'danger' },
];

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  mobileMenuOpen = false,
  onCloseMobileMenu,
}: SidebarProps) {
  const pathname = usePathname();

  // Close mobile drawer when pressing Escape
  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobileMenu?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, onCloseMobileMenu]);

  // When clicking any link inside mobile sidebar, close drawer smoothly
  const handleSidebarClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') && mobileMenuOpen && onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  // Bottom dock toolbar theme state
  const [activeThemeMode, setActiveThemeMode] = useState<'dark' | 'contrast' | 'default'>('dark');

  const handleThemeToggle = (mode: 'dark' | 'contrast') => {
    setActiveThemeMode((prev) => (prev === mode ? 'default' : mode));
  };

  // User-controlled accordion state: persists across route transitions & page loads.
  // Hydration-safe: the module cache is null on both server and first client render,
  // so both derive ONLY from pathname (identical output → no SSR mismatch).
  // Client-side navigations reuse the live cache with no flash; stored groups
  // apply in the client-only effect below.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    if (globalOpenGroups !== null) {
      return new Set(globalOpenGroups);
    }
    const activeGroup = getActiveGroupForPath(pathname) || 'core';
    return new Set<string>([activeGroup]);
  });

  React.useEffect(() => {
    try {
      if (globalOpenGroups !== null) {
        setOpenGroups(new Set(globalOpenGroups));
        return;
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const set = new Set<string>(parsed);
          globalOpenGroups = set;
          setOpenGroups(set);
        }
      }
    } catch {
      // fallback: keep pathname-derived default
    }
  }, []);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      // Single-accordion: opening one section closes others; clicking open section collapses it
      const next = prev.has(key) ? new Set<string>() : new Set<string>([key]);
      globalOpenGroups = next;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const isGroupOpen = (key: string) => openGroups.has(key);

  const getIsActive = (path: string) => {
    if (path === '/' || path === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  // Index of the active child per group (-1 = none): drives the segmented dark stem.
  const childActiveIndex = (activeFlags: boolean[]) => activeFlags.findIndex(Boolean);
  // Route-based active parent group (independent of open state) for parent highlighting.
  const activeGroup = getActiveGroupForPath(pathname);  const coreFlags = [getIsActive('/dashboard'), getIsActive('/orders'), getIsActive('/products'), getIsActive('/customers'), getIsActive('/reports') || getIsActive('/analytics')];
  const opsFlags = [getIsActive('/fulfillment'), getIsActive('/shipments'), getIsActive('/returns'), getIsActive('/refunds'), getIsActive('/payments')];
  const merchFlags = [getIsActive('/collections'), getIsActive('/designs'), getIsActive('/content')];
  const sysFlags = [getIsActive('/team'), getIsActive('/audit-log')];
  const coreStem = childActiveIndex(coreFlags);
  const opsStem = childActiveIndex(opsFlags);
  const merchStem = childActiveIndex(merchFlags);
  const sysStem = childActiveIndex(sysFlags);

  return (
    <aside
      className={cn('sidebar', 'fixed left-0 top-0 z-50 flex shrink-0 flex-col overflow-hidden border-r border-subtle bg-canvas transition-[width] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]', isCollapsed ? 'w-20 min-w-20 px-[10px] pb-[14px]' : 'w-60 min-w-60 md:w-55 md:min-w-55 lg:w-60 lg:min-w-60 px-[14px] pb-[10px]', mobileMenuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full', 'max-md:bottom-0 max-md:z-[100] max-md:max-w-[86vw] max-md:w-[290px] max-md:min-w-auto max-md:overflow-y-auto max-md:overflow-x-hidden max-md:px-[14px] max-md:pb-4 max-md:shadow-[4px_0_24px_rgba(0,0,0,0.15)] max-md:transition-transform')}
      onClick={handleSidebarClick}
    >
      {/* Brand Header */}
      <div className={cn('flex w-full shrink-0 items-center bg-canvas border-b border-subtle mb-2 z-10', isCollapsed ? 'h-16 min-h-16 justify-center p-0' : 'h-15 min-h-15 justify-between px-1')}>
        <Link href="/" className="flex items-center gap-2.5 no-underline text-primary">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-control bg-primary shadow-nav-logo">
            <Image
              src="/logos/tuw-stag-white.png"
              alt="The Unplugged Wear"
              width={22}
              height={22}
              className="h-[22px] w-auto object-contain"
              priority
            />
          </div>
          {!isCollapsed && <span className="text-[20px] font-bold tracking-auth-hero text-primary whitespace-nowrap">TUW Admin</span>}
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          className="hidden size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-control border border-subtle bg-surface text-primary transition-all duration-[180ms] hover:border-action-primary hover:bg-selected hover:text-action-primary ml-auto max-md:flex"
          onClick={onCloseMobileMenu}
          aria-label="Close menu"
          title="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden mt-0.5 pb-6 pr-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {NAV_GROUPS.map((group) => {
          const actives = group.items.map((item) => item.match.some((p) => getIsActive(p)));
          const stemIdx = actives.findIndex(Boolean);
          const open = !isCollapsed ? isGroupOpen(group.key) : true;
          const groupActive = activeGroup === group.key;
          const GroupIcon = group.icon;
          return (
            <div key={group.key} className="flex flex-col">
              {!isCollapsed && (
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-nav-sm border-0 bg-transparent py-1.5 pl-2.5 pr-2 cursor-pointer select-none text-left transition-colors duration-150 hover:bg-nav-group-hover"
                  onClick={() => toggleGroup(group.key)}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', groupActive ? 'text-nav-active-text' : 'text-secondary')}>
                      <GroupIcon size={18} />
                    </span>
                    <span className={cn('text-nav-parent font-bold', groupActive ? 'text-nav-active-text' : 'text-nav-group-label')}>{group.label}</span>
                  </span>
                  <ChevronDown
                    size={13}
                    className={cn('flex items-center justify-center transition-transform duration-200', groupActive ? 'text-nav-active-text' : 'text-nav-chevron', isGroupOpen(group.key) && 'rotate-180')}
                  />
                </button>
              )}

              <div className={cn('grid transition-[grid-template-rows] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div className="min-h-0 overflow-hidden">
                  <div className={cn(!isCollapsed && 'relative mt-[3px] mb-1.5 flex flex-col gap-[3px] navTree', !isCollapsed && stemIdx >= 0 && `navStemTo${stemIdx}`)}>
                    {group.items.map((item, idx) => {
                      const ItemIcon = item.icon;
                      const active = actives[idx];
                      return (
                      <div key={item.href} className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                      <Link
                        href={item.href}
                        className={cn(
                          'relative flex w-full rounded-nav text-nav-child no-underline transition-all duration-150',
                          isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                          active ? 'bg-white font-semibold text-nav-active-text shadow-nav-edge z-1 isolate hover:bg-white hover:text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        {isCollapsed && (<span className={cn('flex size-4.5 shrink-0 items-center justify-center', active ? 'text-action-primary' : 'text-secondary')}><ItemIcon size={17} /></span>)}
                        {!isCollapsed && (<><span className="truncate text-nav-child">{item.label}</span>{item.badge && <span className={item.badge.className}>{item.badge.text}</span>}</>)}
                      </Link>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col gap-0.5 border-t border-subtle bg-canvas pt-2 pb-0 mt-auto shrink-0 z-10">
        <ul className="list-none flex flex-col gap-[3px]">
          {FOOTER_ITEMS.map((item) => {
            const active = item.match.some((p) => getIsActive(p));
            const ItemIcon = item.icon;
            const danger = item.variant === 'danger';
            return (
            <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'group relative flex w-full cursor-pointer select-none rounded-nav border-0 bg-transparent text-left text-[14px] transition-all duration-150',
                isCollapsed ? 'justify-center p-2' : 'items-center gap-3 px-3 py-2',
                danger ? 'font-medium text-secondary hover:bg-error-bg hover:text-error-text mt-0.5' : active ? 'bg-white font-semibold text-nav-active-text shadow-nav-edge z-1 hover:bg-white hover:text-nav-active-text' : 'font-medium text-primary hover:bg-nav-hover-wash hover:text-action-primary'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={cn('flex size-4.5 shrink-0 items-center justify-center', danger ? 'text-secondary group-hover:text-error-text' : active ? 'text-nav-active-text' : 'text-secondary group-hover:text-action-primary')}>
                <ItemIcon size={18} />
              </span>
              {!isCollapsed && <span className="flex-1 truncate text-[14px]">{item.label}</span>}
            </Link>
            </li>
            );
          })}
        </ul>

        {/* ================================================================
            BOTTOM DOCKING TOOLBAR (NIGHT / THEME / SIDEBAR)
            ================================================================ */}
        {!isCollapsed ? (
          <div className="grid grid-cols-3 shrink-0 overflow-hidden rounded-control border border-nav-dock-line bg-nav-dock-bg mt-1.5 mb-0.5 h-8">
            <button
              type="button"
              className={cn('flex h-full w-full items-center justify-center border-0 border-r border-nav-dock-line bg-transparent p-0 text-nav-dock-text cursor-pointer transition-all duration-150 last:border-r-0', activeThemeMode === 'dark' ? 'bg-nav-dock-active-bg text-white' : 'hover:bg-nav-dock-hover hover:text-white')}
              onClick={() => handleThemeToggle('dark')}
              aria-label="Toggle Night Mode"
              title="Night Mode"
            >
              <MoonStar size={15} />
            </button>
            <button
              type="button"
              className={cn('flex h-full w-full items-center justify-center border-0 border-r border-nav-dock-line bg-transparent p-0 text-nav-dock-text cursor-pointer transition-all duration-150 last:border-r-0', activeThemeMode === 'contrast' ? 'bg-nav-dock-active-bg text-white' : 'hover:bg-nav-dock-hover hover:text-white')}
              onClick={() => handleThemeToggle('contrast')}
              aria-label="Toggle Theme Contrast"
              title="Theme Contrast"
            >
              <Contrast size={15} />
            </button>
            <button
              type="button"
              className="flex h-full w-full items-center justify-center border-0 border-r border-nav-dock-line bg-transparent p-0 text-nav-dock-text cursor-pointer transition-all duration-150 last:border-r-0 hover:bg-nav-dock-hover hover:text-white"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>
        ) : (
          <div className="flex w-full justify-center mt-2">
            <button
              type="button"
              className="flex h-9 w-11 items-center justify-center rounded-control border border-nav-dock-line bg-nav-dock-bg text-nav-dock-text cursor-pointer transition-all duration-150 hover:bg-nav-dock-hover-light hover:text-white hover:border-nav-dock-line-hover"
              onClick={onToggleCollapse}
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
