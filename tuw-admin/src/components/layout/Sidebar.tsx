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

  return (
    <aside
      className={cn('sidebar', 'fixed left-0 top-0 z-50 flex shrink-0 flex-col overflow-hidden border-r border-subtle bg-canvas transition-[width] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]', isCollapsed ? 'w-20 min-w-20 px-[10px] pb-[14px]' : 'w-65 min-w-65 px-[14px] pb-[10px]', mobileMenuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full', 'max-md:bottom-0 max-md:z-[100] max-md:max-w-[86vw] max-md:w-[290px] max-md:min-w-auto max-md:overflow-y-auto max-md:overflow-x-hidden max-md:px-[14px] max-md:pb-4 max-md:shadow-[4px_0_24px_rgba(0,0,0,0.15)] max-md:transition-transform')}
      onClick={handleSidebarClick}
    >
      {/* Brand Header */}
      <div className="sidebarHeader">
        <Link href="/" className="brandLink">
          <div className="logoIconWrapper">
            <Image
              src="/logos/tuw-stag-white.png"
              alt="The Unplugged Wear"
              width={22}
              height={22}
              style={{ objectFit: 'contain', width: 'auto', height: '22px' }}
              priority
            />
          </div>
          {!isCollapsed && <span className="brandName">TUW Admin</span>}
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          className="sidebarMobileCloseBtn"
          onClick={onCloseMobileMenu}
          aria-label="Close menu"
          title="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="navSections">
        {/* CORE Section */}
        <div className="navGroup">
          {!isCollapsed && (
            <button
              type="button"
              className="groupHeaderBtn"
              onClick={() => toggleGroup('core')}
            >
              <span className="groupLabel">CORE</span>
              <ChevronDown
                size={13}
                className={cn('groupChevron', isGroupOpen('core') && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? isGroupOpen('core') : true) && (
            <div className={cn(!isCollapsed && 'navBranchTree')}>
              {/* Dashboard */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/dashboard"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/dashboard') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Dashboard' : undefined}
                >
                  <span className="navIcon">
                    <HomeIcon size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Dashboard</span>}
                </Link>
              </div>

              {/* Orders */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/orders"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/orders') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Orders' : undefined}
                >
                  <span className="navIcon">
                    <ClipboardList size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Orders</span>}
                </Link>
              </div>

              {/* Products */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/products"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/products') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Products' : undefined}
                >
                  <span className="navIcon">
                    <Package size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Products</span>}
                </Link>
              </div>

              {/* Customers */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/customers"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/customers') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Customers' : undefined}
                >
                  <span className="navIcon">
                    <Users size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Customers</span>}
                </Link>
              </div>

              {/* Analytics & Reports */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/reports"
                  className={cn(
                    'navBranchLink',
                    (getIsActive('/reports') || getIsActive('/analytics')) && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Analytics & Reports' : undefined}
                >
                  <span className="navIcon">
                    <TrendingUp size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Analytics & Reports</span>}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* OPERATIONS Section */}
        <div className="navGroup">
          {!isCollapsed && (
            <button
              type="button"
              className="groupHeaderBtn"
              onClick={() => toggleGroup('operations')}
            >
              <span className="groupLabel">OPERATIONS</span>
              <ChevronDown
                size={13}
                className={cn('groupChevron', isGroupOpen('operations') && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? isGroupOpen('operations') : true) && (
            <div className={cn(!isCollapsed && 'navBranchTree')}>
              {/* Fulfillment */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/fulfillment"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/fulfillment') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Fulfillment' : undefined}
                >
                  <span className="navIcon">
                    <PackageCheck size={17} />
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="navBranchLabel">Fulfillment</span>
                      <span className="navBadge navBadgePurple">4</span>
                    </>
                  )}
                </Link>
              </div>

              {/* Shipments */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/shipments"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/shipments') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Shipments' : undefined}
                >
                  <span className="navIcon">
                    <Truck size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Shipments</span>}
                </Link>
              </div>

              {/* Returns & RMA */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/returns"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/returns') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Returns & RMA' : undefined}
                >
                  <span className="navIcon">
                    <Undo2 size={17} />
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="navBranchLabel">Returns & RMA</span>
                      <span className="navBadge navBadgeAmber">2</span>
                    </>
                  )}
                </Link>
              </div>

              {/* Refunds */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/refunds"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/refunds') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Refunds' : undefined}
                >
                  <span className="navIcon">
                    <RotateCcw size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Refunds</span>}
                </Link>
              </div>

              {/* Payments */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/payments"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/payments') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Payments' : undefined}
                >
                  <span className="navIcon">
                    <CreditCard size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Payments</span>}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* MERCHANDISE Section */}
        <div className="navGroup">
          {!isCollapsed && (
            <button
              type="button"
              className="groupHeaderBtn"
              onClick={() => toggleGroup('merchandise')}
            >
              <span className="groupLabel">MERCHANDISE</span>
              <ChevronDown
                size={13}
                className={cn('groupChevron', isGroupOpen('merchandise') && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? isGroupOpen('merchandise') : true) && (
            <div className={cn(!isCollapsed && 'navBranchTree')}>
              {/* Collections */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/collections"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/collections') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Collections' : undefined}
                >
                  <span className="navIcon">
                    <Layers size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Collections</span>}
                </Link>
              </div>

              {/* Design Assets */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/designs"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/designs') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Design Assets' : undefined}
                >
                  <span className="navIcon">
                    <Palette size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Design Assets</span>}
                </Link>
              </div>

              {/* Content CMS */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/content"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/content') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Content CMS' : undefined}
                >
                  <span className="navIcon">
                    <FileText size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Content CMS</span>}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* SYSTEM Section */}
        <div className="navGroup">
          {!isCollapsed && (
            <button
              type="button"
              className="groupHeaderBtn"
              onClick={() => toggleGroup('system')}
            >
              <span className="groupLabel">SYSTEM</span>
              <ChevronDown
                size={13}
                className={cn('groupChevron', isGroupOpen('system') && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? isGroupOpen('system') : true) && (
            <div className={cn(!isCollapsed && 'navBranchTree')}>
              {/* Team */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/team"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/team') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Team' : undefined}
                >
                  <span className="navIcon">
                    <Users size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Team</span>}
                </Link>
              </div>

              {/* Audit Log */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/audit-log"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/audit-log') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Audit Log' : undefined}
                >
                  <span className="navIcon">
                    <ShieldCheck size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Audit Log</span>}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="sidebarFooter">
        <ul className="navList">
          <li>
            <Link
              href="/settings"
              className={cn('navItem', getIsActive('/settings') && 'navItemActive')}
              title={isCollapsed ? 'Settings' : undefined}
            >
              <span className="navIcon">
                <Settings size={18} />
              </span>
              {!isCollapsed && <span className="navLabel">Settings</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/support"
              className={cn('navItem', (getIsActive('/support') || getIsActive('/help')) && 'navItemActive')}
              title={isCollapsed ? 'Help & Support' : undefined}
            >
              <span className="navIcon">
                <Headphones size={18} />
              </span>
              {!isCollapsed && <span className="navLabel">Help & Support</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/login"
              className="navItem logOutItem"
              title={isCollapsed ? 'Log out' : undefined}
            >
              <span className="navIcon">
                <LogOut size={18} />
              </span>
              {!isCollapsed && <span className="navLabel">Log out</span>}
            </Link>
          </li>
        </ul>

        {/* ================================================================
            BRAND LOGO ANIMAL ARTWORK & COPYRIGHT (SEAMLESS - BIGDIRTY.AGENCY STYLE)
            ================================================================ */}
        {!isCollapsed ? (
          <div className="sidebarStagDirect">
            <div className="stagImageWrapper">
              <Image
                src="/logos/tuw-stag-dark.png"
                alt="The Unplugged Wear Stag"
                width={105}
                height={80}
                className="stagArtImage"
                priority
              />
            </div>
            <span className="stagCopyrightText">© 2026 theunpluggedwear.com</span>
          </div>
        ) : (
          <div className="stagCollapsedDirect" title="© 2026 theunpluggedwear.com">
            <div className="stagCollapsedImgWrap">
              <Image
                src="/logos/tuw-stag-dark.png"
                alt="TUW Stag"
                width={26}
                height={26}
                className="stagCollapsedImg"
              />
            </div>
          </div>
        )}

        {/* ================================================================
            CREATIVE THING 3: BOTTOM DOCKING TOOLBAR (NIGHT / THEME / SIDEBAR)
            ================================================================ */}
        {!isCollapsed ? (
          <div className="sidebarDockToolbar">
            <button
              type="button"
              className={cn(
                'dockToolbarBtn',
                activeThemeMode === 'dark' && 'dockToolbarBtnActive'
              )}
              onClick={() => handleThemeToggle('dark')}
              aria-label="Toggle Night Mode"
              title="Night Mode"
            >
              <MoonStar size={15} />
            </button>
            <button
              type="button"
              className={cn(
                'dockToolbarBtn',
                activeThemeMode === 'contrast' && 'dockToolbarBtnActive'
              )}
              onClick={() => handleThemeToggle('contrast')}
              aria-label="Toggle Theme Contrast"
              title="Theme Contrast"
            >
              <Contrast size={15} />
            </button>
            <button
              type="button"
              className="dockToolbarBtn"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>
        ) : (
          <div className="sidebarDockToolbarCollapsed">
            <button
              type="button"
              className="dockToolbarBtnCollapsed"
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
