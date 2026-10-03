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
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAdminState } from '@/mocks/state';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileMenuOpen?: boolean;
}

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  mobileMenuOpen = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { orders, resetDemoData, showToast } = useAdminState();
  const [isResetting, setIsResetting] = useState(false);

  // Compute live storefront stats from demo orders
  const todayRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const formattedRevenue = `₹${(todayRevenue || 39190).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const handleResetDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResetting(true);
    resetDemoData();
    showToast({
      type: 'info',
      title: 'Demo State Reset',
      description: 'Store fixtures and demo metrics restored to baseline.',
    });
    setTimeout(() => {
      setIsResetting(false);
    }, 700);
  };

  // Collapsible state for each section (all expanded by default)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    core: true,
    operations: true,
    merchandise: true,
    system: true,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getIsActive = (path: string) => {
    if (path === '/' || path === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={cn('sidebar', isCollapsed && 'sidebarCollapsed', mobileMenuOpen && 'sidebarMobileOpen')}
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

        <button
          type="button"
          className="sidebarToggleBtn"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
                className={cn('groupChevron', openGroups.core && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? openGroups.core : true) && (
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
                className={cn('groupChevron', openGroups.operations && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? openGroups.operations : true) && (
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
                className={cn('groupChevron', openGroups.merchandise && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? openGroups.merchandise : true) && (
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
                className={cn('groupChevron', openGroups.system && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? openGroups.system : true) && (
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
            CREATIVE THING 1: STOREFRONT LIVE & ATELIER PULSE CARD
            ================================================================ */}
        {!isCollapsed ? (
          <div className="sidebarAtelierCard">
            <div className="atelierCardTop">
              <div className="atelierBadge">
                <span className="atelierPulseBeacon">
                  <span className="atelierPulsePing" />
                  <span className="atelierPulseDot" />
                </span>
                <span className="atelierBadgeText">Storefront Live</span>
              </div>
              <span className="atelierShoppersBadge">2 online</span>
            </div>

            <div className="atelierCardBody">
              <div className="atelierMetricRow">
                <div className="atelierMetricItem">
                  <span className="atelierMetricLabel">Today&apos;s Revenue</span>
                  <span className="atelierMetricValue">{formattedRevenue}</span>
                </div>
                <div className="atelierMetricItem atelierMetricRight">
                  <span className="atelierMetricLabel">Active Carts</span>
                  <span className="atelierMetricValue">4 items</span>
                </div>
              </div>
            </div>

            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="atelierCtaBtn"
              title="Launch customer storefront in a new tab"
            >
              <span>View Storefront</span>
              <ArrowUpRight size={13} className="atelierCtaArrow" />
            </a>
          </div>
        ) : (
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="atelierCollapsedBtn"
            title="Storefront Live: 2 shoppers online (Click to view)"
          >
            <span className="atelierPulseBeacon">
              <span className="atelierPulsePing" />
              <span className="atelierPulseDot" />
            </span>
            <ArrowUpRight size={14} />
          </a>
        )}

        {/* ================================================================
            CREATIVE THING 2: STAFF IDENTITY & DEMO SANDBOX CONTROLS CARD
            ================================================================ */}
        {!isCollapsed ? (
          <div className="sidebarStaffCard">
            <div className="staffProfileRow">
              <div className="staffAvatarWrap">
                <div className="staffAvatar">UK</div>
                <span className="staffStatusDot" title="Active now" />
              </div>
              <div className="staffMeta">
                <div className="staffNameRow">
                  <span className="staffName">Urvil Kargathala</span>
                </div>
                <div className="staffRoleRow">
                  <span className="staffRole">Store Owner</span>
                  <span className="staffSandboxTag">Sandbox</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetDemo}
              className="resetDemoBtn"
              title="Reset all orders, inventory, and activity fixtures to baseline"
            >
              <RotateCcw
                size={12}
                className={cn(isResetting && 'resetSpinning')}
              />
              <span>{isResetting ? 'Restoring Baseline...' : 'Reset Demo State'}</span>
            </button>
          </div>
        ) : (
          <div className="staffCollapsedWrap">
            <button
              type="button"
              onClick={handleResetDemo}
              className="staffCollapsedBtn"
              title="Urvil Kargathala (Store Owner) — Click to reset demo state"
            >
              <div className="staffAvatarWrap">
                <div className="staffAvatar">UK</div>
                <span className="staffStatusDot" />
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
