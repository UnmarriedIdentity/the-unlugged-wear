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
  PackageCheck,
  Truck,
  Undo2,
  RotateCcw,
  CreditCard,
  Layers,
  Palette,
  FileText,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAdminState } from '@/mocks/state';
import { SidebarNavGroup, SidebarNavItem, SidebarDock } from './sidebar-nav';
import type { SidebarNavItemDef } from './sidebar-nav';
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
    pathname.startsWith('/team')
  ) {
    return 'system';
  }
  return null;
}

interface NavGroupDef {
  key: string;
  label: string;
  icon: LucideIcon;
  items: SidebarNavItemDef[];
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
      { href: '/fulfillment', label: 'Fulfillment', icon: PackageCheck, match: ['/fulfillment'], badge: { text: '4', dotClassName: 'bg-action-primary', className: 'inline-flex min-w-[18px] items-center justify-center rounded-full bg-nav-badge-purple-bg px-[7.5px] py-[2.5px] text-center text-[11.5px] font-bold leading-none text-action-primary' } },
      { href: '/shipments', label: 'Shipments', icon: Truck, match: ['/shipments'] },
      { href: '/returns', label: 'Returns & RMA', icon: Undo2, match: ['/returns'], badge: { text: '2', dotClassName: 'bg-nav-badge-amber-text', className: 'inline-flex min-w-[18px] items-center justify-center rounded-full bg-nav-badge-amber-bg px-[7.5px] py-[2.5px] text-center text-[11.5px] font-bold leading-none text-nav-badge-amber-text' } },
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
    ],
  },
];

interface FooterItemDef {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string[];
  variant: 'footer' | 'danger';
}

const FOOTER_ITEMS: FooterItemDef[] = [
  { href: '/settings', label: 'Settings', icon: Settings, match: ['/settings'], variant: 'footer' },
  { href: '/support', label: 'Help & Support', icon: Headphones, match: ['/support', '/help'], variant: 'footer' },
  { href: '/login', label: 'Log out', icon: LogOut, match: [], variant: 'danger' },
];

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  mobileMenuOpen = false,
  onCloseMobileMenu,
}: SidebarProps) {
  const pathname = usePathname();
  // Preview toggle (Settings → General): collapsed badge dots, off by default.
  const { settings } = useAdminState();
  const showCollapsedBadgeDots = settings.showCollapsedBadgeDots ?? false;

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

  // Fade-mask scroll indicators: track whether the nav region can scroll up/down.
  // Bars hide exactly at the ends. Fallbacks (not built): thin auto-fade bar,
  // fade + bar combined, "more" chevron button.
  const navScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const [canScrollDown, setCanScrollDown] = React.useState(false);
  const updateScrollEdges = React.useCallback(() => {
    const el = navScrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  React.useEffect(() => {
    updateScrollEdges();
    window.addEventListener('resize', updateScrollEdges);
    return () => window.removeEventListener('resize', updateScrollEdges);
  }, [updateScrollEdges, isCollapsed, mobileMenuOpen]);

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
  const sysFlags = [getIsActive('/team')];
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
          className="hidden size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-control border border-subtle bg-surface text-primary transition-all duration-[180ms] hover:border-action-primary hover:bg-selected hover:text-action-primary ml-auto max-md:flex focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2"
          onClick={onCloseMobileMenu}
          aria-label="Close menu"
          title="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Sections */}
      <div ref={navScrollRef} onScroll={updateScrollEdges} className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden mt-0.5 pb-6 pr-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden', isCollapsed ? 'gap-0' : 'gap-2.5')}>
        <div aria-hidden="true" className={cn('sticky top-0 z-10 h-6 -mb-6 bg-gradient-to-b from-canvas to-transparent pointer-events-none transition-opacity duration-200', canScrollUp ? 'opacity-100' : 'opacity-0')} />
        {NAV_GROUPS.map((group) => {
          const actives = group.items.map((item) => item.match.some((p) => getIsActive(p)));
          const stemIdx = actives.findIndex(Boolean);
          const open = !isCollapsed ? isGroupOpen(group.key) : true;
          return (
            <SidebarNavGroup
              key={group.key}
              groupKey={group.key}
              label={group.label}
              icon={group.icon}
              isCollapsed={isCollapsed}
              open={open}
              chevronOpen={isGroupOpen(group.key)}
              groupActive={activeGroup === group.key}
              stemIdx={stemIdx}
              onToggle={toggleGroup}
            >
            {group.items.map((item, idx) => (
              <SidebarNavItem key={item.href} item={item} active={actives[idx]} isCollapsed={isCollapsed} variant="branch" showBadgeDot={showCollapsedBadgeDots} />
            ))}
            </SidebarNavGroup>
          );
        })}
        <div aria-hidden="true" className={cn('sticky bottom-0 z-10 h-6 -mt-6 bg-gradient-to-t from-canvas to-transparent pointer-events-none transition-opacity duration-200', canScrollDown ? 'opacity-100' : 'opacity-0')} />
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col gap-0.5 border-t border-subtle bg-canvas pt-2 pb-0 mt-auto shrink-0 z-10">
        <ul className="list-none flex flex-col gap-[3px]">
          {FOOTER_ITEMS.map((item) => {
            const active = item.match.some((p) => getIsActive(p));
            return (
            <li key={item.href}>
              <SidebarNavItem item={item} active={active} isCollapsed={isCollapsed} variant={item.variant} />
            </li>
            );
          })}
        </ul>

        {/* ================================================================
            BOTTOM DOCKING TOOLBAR (NIGHT / THEME / SIDEBAR)
            ================================================================ */}
        {/* Bottom docking toolbar (night / contrast / collapse) */}
        <SidebarDock isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
      </div>
    </aside>
  );
}
