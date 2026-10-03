'use client';

import React, { useState, useEffect } from 'react';
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
  Layers,
  Palette,
  FileText,
  ShieldCheck,
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

  // Expanded states for groups with branched options
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    products: true, // Default open so user immediately sees the branched design
    orders: false,
    content: false,
  });

  const [activeSubRoute, setActiveSubRoute] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveSubRoute(window.location.pathname + window.location.search + window.location.hash);
    }
  }, [pathname]);

  // Keep parent group open if current route is inside it
  useEffect(() => {
    if (pathname.startsWith('/products')) {
      setOpenGroups((prev) => ({ ...prev, products: true }));
    } else if (
      pathname.startsWith('/orders') ||
      pathname === '/fulfillment' ||
      pathname === '/shipments' ||
      pathname === '/returns' ||
      pathname === '/refunds' ||
      pathname === '/payments'
    ) {
      setOpenGroups((prev) => ({ ...prev, orders: true }));
    } else if (pathname.startsWith('/content')) {
      setOpenGroups((prev) => ({ ...prev, content: true }));
    }
  }, [pathname]);

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
          {!isCollapsed && <div className="groupLabel">CORE</div>}
          <ul className="navList">
            {/* Dashboard */}
            <li>
              <Link
                href="/dashboard"
                className={cn('navItem', getIsActive('/dashboard') && 'navItemActive')}
                title={isCollapsed ? 'Dashboard' : undefined}
              >
                <span className="navIcon">
                  <HomeIcon size={18} />
                </span>
                {!isCollapsed && <span className="navLabel">Dashboard</span>}
              </Link>
            </li>

            {/* Product with Branched Sub-Items */}
            <li>
              {isCollapsed ? (
                <Link
                  href="/products"
                  className={cn('navItem', pathname.startsWith('/products') && 'navItemActive')}
                  title="Products"
                >
                  <span className="navIcon">
                    <Package size={18} />
                  </span>
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    className={cn(
                      'navParentBtn',
                      pathname.startsWith('/products') && 'navParentBtnActive'
                    )}
                    onClick={() => toggleGroup('products')}
                  >
                    <div className="navParentLeft">
                      <span className="navIcon">
                        <Package size={18} />
                      </span>
                      <span className="navLabel">Product</span>
                    </div>
                    <ChevronDown
                      size={15}
                      className={cn('navChevron', openGroups.products && 'navChevronOpen')}
                    />
                  </button>

                  {openGroups.products && (
                    <div className="navBranchTree">
                      {/* Overview */}
                      <div className="navBranchItem">
                        <Link
                          href="/products"
                          className={cn(
                            'navBranchLink',
                            pathname === '/products' &&
                              !activeSubRoute.includes('status=') &&
                              !activeSubRoute.includes('#comments') &&
                              'navBranchLinkActive'
                          )}
                          onClick={() => setActiveSubRoute('/products')}
                        >
                          <span className="navBranchLabel">Overview</span>
                        </Link>
                      </div>

                      {/* Drafts */}
                      <div className="navBranchItem">
                        <Link
                          href="/products?status=draft"
                          className={cn(
                            'navBranchLink',
                            activeSubRoute.includes('status=draft') && 'navBranchLinkActive'
                          )}
                          onClick={() => setActiveSubRoute('/products?status=draft')}
                        >
                          <span className="navBranchLabel">Drafts</span>
                          <span className="navBadge navBadgeOrange">3</span>
                        </Link>
                      </div>

                      {/* Released */}
                      <div className="navBranchItem">
                        <Link
                          href="/products?status=published"
                          className={cn(
                            'navBranchLink',
                            activeSubRoute.includes('status=published') && 'navBranchLinkActive'
                          )}
                          onClick={() => setActiveSubRoute('/products?status=published')}
                        >
                          <span className="navBranchLabel">Released</span>
                        </Link>
                      </div>

                      {/* Comments */}
                      <div className="navBranchItem">
                        <Link
                          href="/products#comments"
                          className={cn(
                            'navBranchLink',
                            activeSubRoute.includes('#comments') && 'navBranchLinkActive'
                          )}
                          onClick={() => setActiveSubRoute('/products#comments')}
                        >
                          <span className="navBranchLabel">Comments</span>
                        </Link>
                      </div>

                      {/* Scheduled */}
                      <div className="navBranchItem">
                        <Link
                          href="/products?status=scheduled"
                          className={cn(
                            'navBranchLink',
                            activeSubRoute.includes('status=scheduled') && 'navBranchLinkActive'
                          )}
                          onClick={() => setActiveSubRoute('/products?status=scheduled')}
                        >
                          <span className="navBranchLabel">Scheduled</span>
                          <span className="navBadge navBadgeGreen">8</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </li>

            {/* Orders with Branched Sub-Items */}
            <li>
              {isCollapsed ? (
                <Link
                  href="/orders"
                  className={cn(
                    'navItem',
                    (pathname.startsWith('/orders') ||
                      pathname === '/fulfillment' ||
                      pathname === '/shipments' ||
                      pathname === '/returns' ||
                      pathname === '/refunds' ||
                      pathname === '/payments') &&
                      'navItemActive'
                  )}
                  title="Orders"
                >
                  <span className="navIcon">
                    <ClipboardList size={18} />
                  </span>
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    className={cn(
                      'navParentBtn',
                      (pathname.startsWith('/orders') ||
                        pathname === '/fulfillment' ||
                        pathname === '/shipments' ||
                        pathname === '/returns' ||
                        pathname === '/refunds' ||
                        pathname === '/payments') &&
                        'navParentBtnActive'
                    )}
                    onClick={() => toggleGroup('orders')}
                  >
                    <div className="navParentLeft">
                      <span className="navIcon">
                        <ClipboardList size={18} />
                      </span>
                      <span className="navLabel">Orders</span>
                    </div>
                    <ChevronDown
                      size={15}
                      className={cn('navChevron', openGroups.orders && 'navChevronOpen')}
                    />
                  </button>

                  {openGroups.orders && (
                    <div className="navBranchTree">
                      <div className="navBranchItem">
                        <Link
                          href="/orders"
                          className={cn('navBranchLink', pathname === '/orders' && 'navBranchLinkActive')}
                        >
                          <span className="navBranchLabel">All Orders</span>
                        </Link>
                      </div>
                      <div className="navBranchItem">
                        <Link
                          href="/fulfillment"
                          className={cn('navBranchLink', pathname === '/fulfillment' && 'navBranchLinkActive')}
                        >
                          <span className="navBranchLabel">Fulfillment</span>
                          <span className="navBadge navBadgePurple">4</span>
                        </Link>
                      </div>
                      <div className="navBranchItem">
                        <Link
                          href="/shipments"
                          className={cn('navBranchLink', pathname === '/shipments' && 'navBranchLinkActive')}
                        >
                          <span className="navBranchLabel">Shipments</span>
                        </Link>
                      </div>
                      <div className="navBranchItem">
                        <Link
                          href="/returns"
                          className={cn('navBranchLink', pathname === '/returns' && 'navBranchLinkActive')}
                        >
                          <span className="navBranchLabel">Returns & RMA</span>
                          <span className="navBadge navBadgeAmber">2</span>
                        </Link>
                      </div>
                      <div className="navBranchItem">
                        <Link
                          href="/refunds"
                          className={cn('navBranchLink', pathname === '/refunds' && 'navBranchLinkActive')}
                        >
                          <span className="navBranchLabel">Refunds</span>
                        </Link>
                      </div>
                      <div className="navBranchItem">
                        <Link
                          href="/payments"
                          className={cn('navBranchLink', pathname === '/payments' && 'navBranchLinkActive')}
                        >
                          <span className="navBranchLabel">Payments</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </li>

            {/* Customers */}
            <li>
              <Link
                href="/customers"
                className={cn('navItem', getIsActive('/customers') && 'navItemActive')}
                title={isCollapsed ? 'Customers' : undefined}
              >
                <span className="navIcon">
                  <Users size={18} />
                </span>
                {!isCollapsed && <span className="navLabel">Customers</span>}
              </Link>
            </li>

            {/* Analytics & Reports */}
            <li>
              <Link
                href="/reports"
                className={cn('navItem', (getIsActive('/reports') || getIsActive('/analytics')) && 'navItemActive')}
                title={isCollapsed ? 'Analytics & Reports' : undefined}
              >
                <span className="navIcon">
                  <TrendingUp size={18} />
                </span>
                {!isCollapsed && <span className="navLabel">Analytics & Reports</span>}
              </Link>
            </li>
          </ul>
        </div>

        {/* MERCHANDISE Section */}
        <div className="navGroup">
          {!isCollapsed && <div className="groupLabel">MERCHANDISE</div>}
          <ul className="navList">
            <li>
              <Link
                href="/collections"
                className={cn('navItem', getIsActive('/collections') && 'navItemActive')}
                title={isCollapsed ? 'Collections' : undefined}
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
                title={isCollapsed ? 'Design Assets' : undefined}
              >
                <span className="navIcon">
                  <Palette size={18} />
                </span>
                {!isCollapsed && <span className="navLabel">Design Assets</span>}
              </Link>
            </li>

            {/* Content CMS with Branched Sub-Items */}
            <li>
              {isCollapsed ? (
                <Link
                  href="/content"
                  className={cn('navItem', pathname.startsWith('/content') && 'navItemActive')}
                  title="Content CMS"
                >
                  <span className="navIcon">
                    <FileText size={18} />
                  </span>
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    className={cn(
                      'navParentBtn',
                      pathname.startsWith('/content') && 'navParentBtnActive'
                    )}
                    onClick={() => toggleGroup('content')}
                  >
                    <div className="navParentLeft">
                      <span className="navIcon">
                        <FileText size={18} />
                      </span>
                      <span className="navLabel">Content CMS</span>
                    </div>
                    <ChevronDown
                      size={15}
                      className={cn('navChevron', openGroups.content && 'navChevronOpen')}
                    />
                  </button>

                  {openGroups.content && (
                    <div className="navBranchTree">
                      <div className="navBranchItem">
                        <Link
                          href="/content"
                          className={cn('navBranchLink', pathname === '/content' && 'navBranchLinkActive')}
                        >
                          <span className="navBranchLabel">Overview</span>
                        </Link>
                      </div>
                      <div className="navBranchItem">
                        <Link
                          href="/content/pages"
                          className={cn('navBranchLink', pathname === '/content/pages' && 'navBranchLinkActive')}
                        >
                          <span className="navBranchLabel">Pages</span>
                        </Link>
                      </div>
                      <div className="navBranchItem">
                        <Link
                          href="/content/journal"
                          className={cn('navBranchLink', pathname === '/content/journal' && 'navBranchLinkActive')}
                        >
                          <span className="navBranchLabel">Journal</span>
                        </Link>
                      </div>
                      <div className="navBranchItem">
                        <Link
                          href="/content/media"
                          className={cn('navBranchLink', pathname === '/content/media' && 'navBranchLinkActive')}
                        >
                          <span className="navBranchLabel">Media Assets</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </li>
          </ul>
        </div>

        {/* SYSTEM Section */}
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

      {/* Pinned Bottom Footer */}
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
