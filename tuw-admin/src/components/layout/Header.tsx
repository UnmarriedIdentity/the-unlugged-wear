'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  X,
  Package,
  ClipboardList,
  Users,
  Settings,
  Compass,
  ArrowRight,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAdminState } from '@/mocks/state';

interface HeaderProps {
  pageTitle?: string;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

const quickLinks = [
  { title: 'Dashboard', subtitle: 'Store performance and operational KPIs', href: '/dashboard', icon: <Compass size={16} /> },
  { title: 'Orders', subtitle: 'Fulfillment queue and sales logs', href: '/orders', icon: <ClipboardList size={16} /> },
  { title: 'Products', subtitle: 'Catalog, variants, pricing, and stock', href: '/products', icon: <Package size={16} /> },
  { title: 'Customers', subtitle: 'Accounts, lifetime value, and order history', href: '/customers', icon: <Users size={16} /> },
  { title: 'Fulfillment', subtitle: 'Production print jobs and partner sync', href: '/fulfillment', icon: <Sparkles size={16} /> },
  { title: 'Shipments', subtitle: 'Dispatch manifests and courier tracking', href: '/shipments', icon: <Truck size={16} /> },
  { title: 'Returns & RMA', subtitle: 'Customer return requests and disputes', href: '/returns', icon: <RotateCcw size={16} /> },
  { title: 'Store Settings', subtitle: 'Store details, currency, and notifications', href: '/settings', icon: <Settings size={16} /> },
];

export default function Header({
  pageTitle = 'Dashboard',
  mobileMenuOpen,
  onToggleMobileMenu,
}: HeaderProps) {
  const router = useRouter();
  const {
    activeRole,
    simulatedError,
    retryConnection,
    supportTickets,
    orders,
    products,
    customers,
  } = useAdminState();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  const handleNavigate = (href: string) => {
    setIsSearchOpen(false);
    router.push(href);
  };

  const pendingIssuesCount =
    orders.filter((o) => o.fulfillmentStatus === 'submission_failed').length +
    supportTickets.filter((t) => t.status === 'open').length;

  const filteredOrders = searchQuery.trim()
    ? orders
        .filter(
          (o) =>
            o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.paymentStatus.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.fulfillmentStatus.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  const filteredProducts = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  const filteredCustomers = searchQuery.trim()
    ? customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.city.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  const filteredNav = searchQuery.trim()
    ? quickLinks.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <>
      {/* Simulated Service Error Alert Banner when error scenario is selected */}
      {simulatedError && (
        <div
          style={{
            backgroundColor: '#C91818',
            color: '#FFFFFF',
            padding: '8px 24px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>{simulatedError}</span>
          </div>
          <button
            type="button"
            onClick={retryConnection}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#C91818',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry Connection Now
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <header className="topBar">
        <div className="topBarLeft">
          <button
            type="button"
            className="mobileMenuBtn"
            onClick={onToggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="pageTitle">{pageTitle}</h1>
        </div>

        {/* Actions & Profile */}
        <div className="topBarRight">
          <div className="actionIcons">
            {/* Search Trigger Button beside Notification */}
            <button
              type="button"
              className="searchTriggerBtn"
              aria-label="Search"
              title="Search orders, products, customers (Ctrl+K)"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search size={18} />
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="notificationBtn"
                aria-label="Notifications"
                title={`${pendingIssuesCount} Actionable Notifications`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {pendingIssuesCount > 0 && <span className="notificationBadge">{pendingIssuesCount}</span>}
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '320px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
                    borderRadius: 'var(--tuw-radius-card, 12px)',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    zIndex: 100,
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      Store Notifications
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {pendingIssuesCount} new
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--tuw-bg-error, #FEF4F4)', fontSize: 12 }}>
                      <strong style={{ color: 'var(--tuw-text-error, #C91818)' }}>1 Partner Sync Error</strong>
                      <p style={{ margin: '2px 0 0', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                        #ORD-8817 print webhook timed out. Needs retry.
                      </p>
                    </div>
                    <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--tuw-bg-warning, #FEFBF5)', fontSize: 12 }}>
                      <strong style={{ color: 'var(--tuw-text-warning, #856300)' }}>1 RMA Return Dispute</strong>
                      <p style={{ margin: '2px 0 0', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                        RET-1089 missing factory garment tags.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Portrait with Role Label */}
          <div className="userProfile" title={`Logged in as ${activeRole}`}>
            <div className="avatarCodeWrapper">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="url(#adminUserAvatarBg)" />
                <defs>
                  <linearGradient id="adminUserAvatarBg" x1="0" y1="0" x2="40" y2="40">
                    <stop offset="0%" stopColor="#F5DFB8" />
                    <stop offset="100%" stopColor="#D4A76A" />
                  </linearGradient>
                  <linearGradient id="adminUserHairGrad" x1="10" y1="5" x2="30" y2="35">
                    <stop offset="0%" stopColor="#6C4123" />
                    <stop offset="100%" stopColor="#4A2810" />
                  </linearGradient>
                </defs>
                <path d="M10 22C8 14 12 7 20 7C28 7 32 14 30 22C31 28 30 35 30 35H10C10 35 9 28 10 22Z" fill="url(#adminUserHairGrad)" />
                <path d="M18 25V30H22V25H18Z" fill="#F0C5A0" />
                <path d="M14 30C14 30 17 33 20 33C23 33 26 30 26 30L29 40H11L14 30Z" fill="#2C4E4B" />
                <ellipse cx="20" cy="19" rx="6.5" ry="7.5" fill="#FCD9B8" />
                <path d="M13 16C14 12 17 9 20 9C23 9 26 11 27 15C25 14 22 13 19 14C16 15 14 17 13 16Z" fill="url(#adminUserHairGrad)" />
                <path d="M13 16C12.5 19 12 24 13.5 27C14.5 24 14.5 20 15 18L13 16Z" fill="url(#adminUserHairGrad)" />
                <path d="M27 15C27.5 19 28 24 26.5 27C25.5 24 25.5 20 25 18L27 15Z" fill="url(#adminUserHairGrad)" />
                <ellipse cx="17.8" cy="18.5" rx="0.9" ry="1.1" fill="#3D200E" />
                <ellipse cx="22.2" cy="18.5" rx="0.9" ry="1.1" fill="#3D200E" />
                <path d="M16.8 16.8C17.5 16.4 18.5 16.5 19 16.8" stroke="#5A341A" strokeWidth="0.8" strokeLinecap="round" />
                <path d="M21 16.8C21.5 16.5 22.5 16.4 23.2 16.8" stroke="#5A341A" strokeWidth="0.8" strokeLinecap="round" />
                <path d="M18.8 22.2C19.4 22.8 20.6 22.8 21.2 22.2" stroke="#B85C43" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="userInfo">
              <span className="userName">Urvil Kargathala</span>
              <span className="userRole" style={{ color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 600 }}>
                {activeRole}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette / Search Modal */}
      {isSearchOpen && (
        <div
          className="commandPaletteOverlay"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="commandPaletteDialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Global search command palette"
          >
            <div className="commandPaletteHeader">
              <Search className="commandPaletteSearchIcon" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search orders, products, customers, or quick jump..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="commandPaletteInput"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--tuw-text-secondary, #5D6772)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Clear input"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                className="commandPaletteEscBadge"
                onClick={() => setIsSearchOpen(false)}
                title="Close (ESC)"
              >
                ESC
              </button>
            </div>

            <div className="commandPaletteBody">
              {searchQuery.trim() ? (
                <>
                  {filteredOrders.length === 0 &&
                  filteredProducts.length === 0 &&
                  filteredCustomers.length === 0 &&
                  filteredNav.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: '0 0 6px' }}>
                        No matches found
                      </p>
                      <p style={{ fontSize: 13, margin: 0 }}>
                        No orders, products, or customers match &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Matching Orders */}
                      {filteredOrders.length > 0 && (
                        <div>
                          <div className="commandPaletteSectionTitle">Orders ({filteredOrders.length})</div>
                          {filteredOrders.map((ord) => (
                            <button
                              key={ord.id}
                              type="button"
                              className="commandPaletteItem"
                              onClick={() => handleNavigate('/orders')}
                            >
                              <div className="commandPaletteItemLeft">
                                <div className="commandPaletteItemIcon">
                                  <ClipboardList size={16} />
                                </div>
                                <div className="commandPaletteItemText">
                                  <span className="commandPaletteItemTitle">{ord.id} · {ord.customerName}</span>
                                  <span className="commandPaletteItemSubtitle">
                                    ₹{ord.total} · Payment: {ord.paymentStatus} · {ord.fulfillmentStatus}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight size={14} color="#90979F" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Matching Products */}
                      {filteredProducts.length > 0 && (
                        <div>
                          <div className="commandPaletteSectionTitle">Products ({filteredProducts.length})</div>
                          {filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="commandPaletteItem"
                              onClick={() => handleNavigate('/products')}
                            >
                              <div className="commandPaletteItemLeft">
                                <div className="commandPaletteItemIcon">
                                  <Package size={16} />
                                </div>
                                <div className="commandPaletteItemText">
                                  <span className="commandPaletteItemTitle">{p.name}</span>
                                  <span className="commandPaletteItemSubtitle">
                                    {p.category} · ₹{p.price} · {p.stock} units in stock
                                  </span>
                                </div>
                              </div>
                              <ArrowRight size={14} color="#90979F" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Matching Customers */}
                      {filteredCustomers.length > 0 && (
                        <div>
                          <div className="commandPaletteSectionTitle">Customers ({filteredCustomers.length})</div>
                          {filteredCustomers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="commandPaletteItem"
                              onClick={() => handleNavigate('/customers')}
                            >
                              <div className="commandPaletteItemLeft">
                                <div className="commandPaletteItemIcon">
                                  <Users size={16} />
                                </div>
                                <div className="commandPaletteItemText">
                                  <span className="commandPaletteItemTitle">{c.name}</span>
                                  <span className="commandPaletteItemSubtitle">
                                    {c.email} · {c.city} · {c.totalOrders} total orders
                                  </span>
                                </div>
                              </div>
                              <ArrowRight size={14} color="#90979F" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Matching Navigation Pages */}
                      {filteredNav.length > 0 && (
                        <div>
                          <div className="commandPaletteSectionTitle">Navigation Pages</div>
                          {filteredNav.map((n) => (
                            <button
                              key={n.href}
                              type="button"
                              className="commandPaletteItem"
                              onClick={() => handleNavigate(n.href)}
                            >
                              <div className="commandPaletteItemLeft">
                                <div className="commandPaletteItemIcon">
                                  {n.icon}
                                </div>
                                <div className="commandPaletteItemText">
                                  <span className="commandPaletteItemTitle">{n.title}</span>
                                  <span className="commandPaletteItemSubtitle">{n.subtitle}</span>
                                </div>
                              </div>
                              <ArrowRight size={14} color="#90979F" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                /* Empty state - Quick Jump Shortcuts */
                <div>
                  <div className="commandPaletteSectionTitle">Quick Navigation</div>
                  {quickLinks.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      className="commandPaletteItem"
                      onClick={() => handleNavigate(item.href)}
                    >
                      <div className="commandPaletteItemLeft">
                        <div className="commandPaletteItemIcon">
                          {item.icon}
                        </div>
                        <div className="commandPaletteItemText">
                          <span className="commandPaletteItemTitle">{item.title}</span>
                          <span className="commandPaletteItemSubtitle">{item.subtitle}</span>
                        </div>
                      </div>
                      <ArrowRight size={14} color="#90979F" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="commandPaletteFooter">
              <span>Press <kbd style={{ padding: '2px 5px', borderRadius: 4, background: '#E5E7EB', fontSize: 11 }}>ESC</kbd> to close</span>
              <span>Quick shortcut: <kbd style={{ padding: '2px 5px', borderRadius: 4, background: '#E5E7EB', fontSize: 11 }}>Ctrl+K</kbd></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
