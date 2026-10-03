'use client';

import React from 'react';
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
  Truck,
  RotateCcw,
  Undo2,
  PackageCheck,
  Layers,
  Palette,
  FileText,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/cn';

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
            {!isCollapsed && <div className="groupLabel">CORE</div>}
            <ul className="navList">
              <li>
                <Link
                  href="/dashboard"
                  className={cn('navItem', getIsActive('/dashboard') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <HomeIcon size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className={cn('navItem', getIsActive('/orders') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <ClipboardList size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Orders</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className={cn('navItem', getIsActive('/products') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <Package size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Products</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/customers"
                  className={cn('navItem', getIsActive('/customers') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <Users size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Customers</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/reports"
                  className={cn('navItem', (getIsActive('/reports') || getIsActive('/analytics')) && 'navItemActive')}
                >
                  <span className="navIcon">
                    <TrendingUp size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Analytics & Reports</span>}
                </Link>
              </li>
            </ul>
          </div>

          {/* OPERATIONS Section */}
          <div className="navGroup">
            {!isCollapsed && <div className="groupLabel">OPERATIONS</div>}
            <ul className="navList">
              <li>
                <Link
                  href="/fulfillment"
                  className={cn('navItem', getIsActive('/fulfillment') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <PackageCheck size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Fulfillment</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/shipments"
                  className={cn('navItem', getIsActive('/shipments') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <Truck size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Shipments</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className={cn('navItem', getIsActive('/returns') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <Undo2 size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Returns & RMA</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/refunds"
                  className={cn('navItem', getIsActive('/refunds') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <RotateCcw size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Refunds</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/payments"
                  className={cn('navItem', getIsActive('/payments') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <CreditCard size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Payments</span>}
                </Link>
              </li>
            </ul>
          </div>

          {/* MERCHANDISE & CONTENT Section */}
          <div className="navGroup">
            {!isCollapsed && <div className="groupLabel">MERCHANDISE</div>}
            <ul className="navList">
              <li>
                <Link
                  href="/collections"
                  className={cn('navItem', getIsActive('/collections') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <Layers size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Collections</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/designs"
                  className={cn('navItem', getIsActive('/designs') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <Palette size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Design Assets</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/content"
                  className={cn('navItem', getIsActive('/content') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <FileText size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Content CMS</span>}
                </Link>
              </li>
            </ul>
          </div>

          {/* SYSTEM & SETTINGS Section */}
          <div className="navGroup">
            {!isCollapsed && <div className="groupLabel">SYSTEM</div>}
            <ul className="navList">
              <li>
                <Link
                  href="/team"
                  className={cn('navItem', getIsActive('/team') && 'navItemActive')}
                  title={isCollapsed ? 'Team' : undefined}
                >
                  <span className="navIcon">
                    <Users size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Team</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/audit-log"
                  className={cn('navItem', getIsActive('/audit-log') && 'navItemActive')}
                  title={isCollapsed ? 'Audit Log' : undefined}
                >
                  <span className="navIcon">
                    <ShieldCheck size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Audit Log</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Pinned Bottom Footer - Stays visible on all viewports */}
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
        </div>
    </aside>
  );
}
