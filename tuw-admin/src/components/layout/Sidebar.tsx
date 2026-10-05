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

  // User-controlled accordion state: persists across route transitions & page loads
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    if (globalOpenGroups !== null) {
      return new Set(globalOpenGroups);
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const set = new Set<string>(parsed);
            globalOpenGroups = set;
            return set;
          }
        }
      } catch {
        // fallback
      }
    }
    const activeGroup = getActiveGroupForPath(pathname) || 'core';
    const initial = new Set<string>([activeGroup]);
    globalOpenGroups = initial;
    return initial;
  });

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
  const coreFlags = [getIsActive('/dashboard'), getIsActive('/orders'), getIsActive('/products'), getIsActive('/customers'), getIsActive('/reports') || getIsActive('/analytics')];
  const opsFlags = [getIsActive('/fulfillment'), getIsActive('/shipments'), getIsActive('/returns'), getIsActive('/refunds'), getIsActive('/payments')];
  const merchFlags = [getIsActive('/collections'), getIsActive('/designs'), getIsActive('/content')];
  const sysFlags = [getIsActive('/team'), getIsActive('/audit-log')];
  const coreStem = childActiveIndex(coreFlags);
  const opsStem = childActiveIndex(opsFlags);
  const merchStem = childActiveIndex(merchFlags);
  const sysStem = childActiveIndex(sysFlags);

  return (
    <aside
      className={cn('sidebar', 'fixed left-0 top-0 z-50 flex shrink-0 flex-col overflow-hidden border-r border-subtle bg-canvas transition-[width] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]', isCollapsed ? 'w-20 min-w-20 px-[10px] pb-[14px]' : 'w-65 min-w-65 px-[14px] pb-[10px]', mobileMenuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full', 'max-md:bottom-0 max-md:z-[100] max-md:max-w-[86vw] max-md:w-[290px] max-md:min-w-auto max-md:overflow-y-auto max-md:overflow-x-hidden max-md:px-[14px] max-md:pb-4 max-md:shadow-[4px_0_24px_rgba(0,0,0,0.15)] max-md:transition-transform')}
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
        {/* CORE Section */}
        <div className="flex flex-col">
          {!isCollapsed && (
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-nav-sm border-0 bg-transparent py-1.5 pl-2.5 pr-2 cursor-pointer select-none text-left transition-colors duration-150 hover:bg-nav-group-hover"
              onClick={() => toggleGroup('core')}
            >
              <span className="text-nav-group font-bold uppercase tracking-nav-group text-nav-group-label">CORE</span>
              <ChevronDown
                size={13}
                className={cn('flex items-center justify-center text-nav-chevron transition-transform duration-200', isGroupOpen('core') && 'rotate-180')}
              />
            </button>
          )}

          <div className={cn('grid transition-[grid-template-rows] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]', (!isCollapsed ? isGroupOpen('core') : true) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div className="min-h-0 overflow-hidden">
              <div className={cn(!isCollapsed && 'relative mt-[3px] mb-1.5 flex flex-col gap-[3px] navTree', !isCollapsed && coreStem >= 0 && `navStemTo${coreStem}`)}>
              {/* Dashboard */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/dashboard"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/dashboard') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Dashboard' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/dashboard') ? 'text-action-primary' : 'text-secondary')}>
                    <HomeIcon size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Dashboard</span>}
                </Link>
              </div>

              {/* Orders */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/orders"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/orders') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Orders' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/orders') ? 'text-action-primary' : 'text-secondary')}>
                    <ClipboardList size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Orders</span>}
                </Link>
              </div>

              {/* Products */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/products"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/products') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Products' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/products') ? 'text-action-primary' : 'text-secondary')}>
                    <Package size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Products</span>}
                </Link>
              </div>

              {/* Customers */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/customers"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/customers') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Customers' : undefined}
                >
                  <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/customers') ? 'text-action-primary' : 'text-secondary')}>
                    <Users size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Customers</span>}
                </Link>
              </div>

              {/* Analytics & Reports */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/reports"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    (getIsActive('/reports') || getIsActive('/analytics')) ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Analytics & Reports' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', (getIsActive('/reports') || getIsActive('/analytics')) ? 'text-action-primary' : 'text-secondary')}>
                    <TrendingUp size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Analytics & Reports</span>}
                </Link>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* OPERATIONS Section */}
        <div className="flex flex-col">
          {!isCollapsed && (
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-nav-sm border-0 bg-transparent py-1.5 pl-2.5 pr-2 cursor-pointer select-none text-left transition-colors duration-150 hover:bg-nav-group-hover"
              onClick={() => toggleGroup('operations')}
            >
              <span className="text-nav-group font-bold uppercase tracking-nav-group text-nav-group-label">OPERATIONS</span>
              <ChevronDown
                size={13}
                className={cn('flex items-center justify-center text-nav-chevron transition-transform duration-200', isGroupOpen('operations') && 'rotate-180')}
              />
            </button>
          )}

          <div className={cn('grid transition-[grid-template-rows] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]', (!isCollapsed ? isGroupOpen('operations') : true) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div className="min-h-0 overflow-hidden">
              <div className={cn(!isCollapsed && 'relative mt-[3px] mb-1.5 flex flex-col gap-[3px] navTree', !isCollapsed && opsStem >= 0 && `navStemTo${opsStem}`)}>
              {/* Fulfillment */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/fulfillment"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/fulfillment') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Fulfillment' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/fulfillment') ? 'text-action-primary' : 'text-secondary')}>
                    <PackageCheck size={17} />
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="truncate text-[13.5px]">Fulfillment</span>
                      <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-nav-badge-purple-bg px-[7.5px] py-[2.5px] text-center text-[11.5px] font-bold leading-none text-action-primary">4</span>
                    </>
                  )}
                </Link>
              </div>

              {/* Shipments */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/shipments"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/shipments') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Shipments' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/shipments') ? 'text-action-primary' : 'text-secondary')}>
                    <Truck size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Shipments</span>}
                </Link>
              </div>

              {/* Returns & RMA */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/returns"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/returns') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Returns & RMA' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/returns') ? 'text-action-primary' : 'text-secondary')}>
                    <Undo2 size={17} />
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="truncate text-[13.5px]">Returns & RMA</span>
                      <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-nav-badge-amber-bg px-[7.5px] py-[2.5px] text-center text-[11.5px] font-bold leading-none text-nav-badge-amber-text">2</span>
                    </>
                  )}
                </Link>
              </div>

              {/* Refunds */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/refunds"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/refunds') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Refunds' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/refunds') ? 'text-action-primary' : 'text-secondary')}>
                    <RotateCcw size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Refunds</span>}
                </Link>
              </div>

              {/* Payments */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/payments"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/payments') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Payments' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/payments') ? 'text-action-primary' : 'text-secondary')}>
                    <CreditCard size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Payments</span>}
                </Link>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* MERCHANDISE Section */}
        <div className="flex flex-col">
          {!isCollapsed && (
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-nav-sm border-0 bg-transparent py-1.5 pl-2.5 pr-2 cursor-pointer select-none text-left transition-colors duration-150 hover:bg-nav-group-hover"
              onClick={() => toggleGroup('merchandise')}
            >
              <span className="text-nav-group font-bold uppercase tracking-nav-group text-nav-group-label">MERCHANDISE</span>
              <ChevronDown
                size={13}
                className={cn('flex items-center justify-center text-nav-chevron transition-transform duration-200', isGroupOpen('merchandise') && 'rotate-180')}
              />
            </button>
          )}

          <div className={cn('grid transition-[grid-template-rows] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]', (!isCollapsed ? isGroupOpen('merchandise') : true) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div className="min-h-0 overflow-hidden">
              <div className={cn(!isCollapsed && 'relative mt-[3px] mb-1.5 flex flex-col gap-[3px] navTree', !isCollapsed && merchStem >= 0 && `navStemTo${merchStem}`)}>
              {/* Collections */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/collections"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/collections') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Collections' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/collections') ? 'text-action-primary' : 'text-secondary')}>
                    <Layers size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Collections</span>}
                </Link>
              </div>

              {/* Design Assets */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/designs"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/designs') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Design Assets' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/designs') ? 'text-action-primary' : 'text-secondary')}>
                    <Palette size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Design Assets</span>}
                </Link>
              </div>

              {/* Content CMS */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/content"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/content') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Content CMS' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/content') ? 'text-action-primary' : 'text-secondary')}>
                    <FileText size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Content CMS</span>}
                </Link>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* SYSTEM Section */}
        <div className="flex flex-col">
          {!isCollapsed && (
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-nav-sm border-0 bg-transparent py-1.5 pl-2.5 pr-2 cursor-pointer select-none text-left transition-colors duration-150 hover:bg-nav-group-hover"
              onClick={() => toggleGroup('system')}
            >
              <span className="text-nav-group font-bold uppercase tracking-nav-group text-nav-group-label">SYSTEM</span>
              <ChevronDown
                size={13}
                className={cn('flex items-center justify-center text-nav-chevron transition-transform duration-200', isGroupOpen('system') && 'rotate-180')}
              />
            </button>
          )}

          <div className={cn('grid transition-[grid-template-rows] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]', (!isCollapsed ? isGroupOpen('system') : true) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div className="min-h-0 overflow-hidden">
              <div className={cn(!isCollapsed && 'relative mt-[3px] mb-1.5 flex flex-col gap-[3px] navTree', !isCollapsed && sysStem >= 0 && `navStemTo${sysStem}`)}>
              {/* Team */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/team"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/team') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Team' : undefined}
                >
                  <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/team') ? 'text-action-primary' : 'text-secondary')}>
                    <Users size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Team</span>}
                </Link>
              </div>

              {/* Audit Log */}
              <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
                <Link
                  href="/audit-log"
                  className={cn(
                    'relative flex w-full text-[13.5px] no-underline transition-all duration-150',
                    isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
                    getIsActive('/audit-log') ? 'bg-nav-active-wash font-semibold text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
                  )}
                  title={isCollapsed ? 'Audit Log' : undefined}
                >
                                    <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/audit-log') ? 'text-action-primary' : 'text-secondary')}>
                    <ShieldCheck size={17} />
                  </span>
                  {!isCollapsed && <span className="truncate text-[13.5px]">Audit Log</span>}
                </Link>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col gap-0.5 border-t border-subtle bg-canvas pt-2 pb-0 mt-auto shrink-0 z-10">
        <ul className="list-none flex flex-col gap-[3px]">
          <li>
            <Link
              href="/settings"
              className={cn('group relative flex w-full cursor-pointer select-none rounded-nav border-0 bg-transparent text-left text-[14px] transition-all duration-150', isCollapsed ? 'justify-center p-2' : 'items-center gap-3 px-3 py-2', getIsActive('/settings') ? 'bg-white font-semibold text-nav-active-text shadow-nav-edge hover:bg-white hover:text-nav-active-text' : 'font-medium text-primary hover:bg-nav-hover-wash hover:text-action-primary')}
              title={isCollapsed ? 'Settings' : undefined}
            >
              <span className={cn('flex size-4.5 shrink-0 items-center justify-center', getIsActive('/settings') ? 'text-action-primary' : 'text-secondary')}>
                <Settings size={18} />
              </span>
              {!isCollapsed && <span className="flex-1 truncate text-[14px]">Settings</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/support"
              className={cn('group relative flex w-full cursor-pointer select-none rounded-nav border-0 bg-transparent text-left text-[14px] transition-all duration-150', isCollapsed ? 'justify-center p-2' : 'items-center gap-3 px-3 py-2', (getIsActive('/support') || getIsActive('/help')) ? 'bg-white font-semibold text-nav-active-text shadow-nav-edge hover:bg-white hover:text-nav-active-text' : 'font-medium text-primary hover:bg-nav-hover-wash hover:text-action-primary')}
              title={isCollapsed ? 'Help & Support' : undefined}
            >
              <span className={cn('flex size-4.5 shrink-0 items-center justify-center', (getIsActive('/support') || getIsActive('/help')) ? 'text-action-primary' : 'text-secondary')}>
                <Headphones size={18} />
              </span>
              {!isCollapsed && <span className="flex-1 truncate text-[14px]">Help & Support</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/login"
              className={cn('group relative flex w-full cursor-pointer select-none rounded-nav border-0 bg-transparent text-left text-[14px] font-medium transition-all duration-150 mt-0.5', isCollapsed ? 'justify-center p-2' : 'items-center gap-3 px-3 py-2', 'text-secondary hover:bg-error hover:text-error')}
              title={isCollapsed ? 'Log out' : undefined}
            >
              <span className="flex size-4.5 shrink-0 items-center justify-center text-secondary group-hover:text-error">
                <LogOut size={18} />
              </span>
              {!isCollapsed && <span className="flex-1 truncate text-[14px]">Log out</span>}
            </Link>
          </li>
        </ul>

        {/* ================================================================
            BRAND LOGO ANIMAL ARTWORK & COPYRIGHT (SEAMLESS - BIGDIRTY.AGENCY STYLE)
            ================================================================ */}
        {!isCollapsed ? (
          <div className="relative flex flex-col items-center justify-center overflow-visible bg-transparent mt-2 mb-1 py-0.5">
            <div className="flex items-center justify-center w-full">
              <div className="relative flex h-[62px] w-[85px] items-center justify-center">
                <Image
                  src="/logos/tuw-stag-dark.png"
                  alt="The Unplugged Wear Stag"
                  width={105}
                  height={80}
                  className="h-full w-full object-contain transition-transform duration-[250ms] hover:-translate-y-0.5"
                  priority
                />
              </div>
            </div>
            <span className="block mt-1.5 text-center whitespace-nowrap select-none text-[11px] font-medium tracking-nav-copy text-secondary">© 2026 theunpluggedwear.com</span>
          </div>
        ) : (
          <div className="flex size-9 cursor-pointer items-center justify-center mt-2.5 mx-auto mb-1 transition-transform duration-200 hover:scale-[1.08]" title="© 2026 theunpluggedwear.com">
            <div className="relative flex size-6.5 items-center justify-center">
              <Image
                src="/logos/tuw-stag-dark.png"
                alt="TUW Stag"
                width={26}
                height={26}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        )}

        {/* ================================================================
            CREATIVE THING 3: BOTTOM DOCKING TOOLBAR (NIGHT / THEME / SIDEBAR)
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
