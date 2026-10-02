'use client';

import React from 'react';
import Link from 'next/link';
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
  Sparkles,
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
      <div>
        {/* Brand Header */}
        <div className="sidebarHeader">
          <Link href="/" className="brandLink">
            <div className="logoIconWrapper">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.5 17C6.5 14.79 8.29 13 10.5 13H13.5C15.71 13 17.5 11.21 17.5 9C17.5 6.79 15.71 5 13.5 5H9M17.5 7C17.5 9.21 15.71 11 13.5 11H10.5C8.29 11 6.5 12.79 6.5 15C6.5 17.21 8.29 19 10.5 19H15"
                  stroke="#FFFFFF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
                  href="/"
                  className={cn('navItem', getIsActive('/') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <HomeIcon size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Overview</span>}
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
              <li>
                <Link
                  href="/design-system"
                  className={cn('navItem', getIsActive('/design-system') && 'navItemActive')}
                >
                  <span className="navIcon">
                    <Sparkles size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Design System</span>}
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
                >
                  <span className="navIcon">
                    <ShieldCheck size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Audit Log</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className={cn('navItem', getIsActive('/settings') && 'navItemActive')}
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
                >
                  <span className="navIcon">
                    <Headphones size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Help & Support</span>}
                </Link>
              </li>
              <li>
                <Link href="/login" className="navItem logOutItem">
                  <span className="navIcon">
                    <LogOut size={18} />
                  </span>
                  {!isCollapsed && <span className="navLabel">Log out</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Become Pro Promo Card */}
      {!isCollapsed && (
        <div className="becomeProCard" style={{ marginTop: 24 }}>
          <div className="becomeProWaveBg">
            <svg className="waveSvg" viewBox="0 0 200 220" fill="none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="layoutWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E1338" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#371B70" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#7539FF" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="layoutWaveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#120A24" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#6025DB" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#CFCBFF" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M-20 180 C30 135, 70 205, 130 155 C170 120, 185 180, 220 145 L220 230 L-20 230 Z"
                fill="url(#layoutWaveGrad1)"
              />
              <path
                d="M-20 150 C40 95, 95 185, 140 115 C180 70, 205 140, 230 100 L230 230 L-20 230 Z"
                fill="url(#layoutWaveGrad2)"
              />
            </svg>
          </div>
          <div className="becomeProContent">
            <h3 className="becomeProTitle">TUW Enterprise</h3>
            <p className="becomeProDesc">
              Full inventory automation, multi-warehouse sync, and SLA monitoring
            </p>
          </div>
          <button type="button" className="becomeProBtn">
            View specifications
          </button>
        </div>
      )}
    </aside>
  );
}
