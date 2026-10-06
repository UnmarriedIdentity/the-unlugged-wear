'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { SearchModal } from '@/components/search';
import { buildNotifications, useNotifications, NotificationPanel } from '@/components/notifications';
import { usePopoverAnimation } from '@/hooks/usePopoverAnimation';

interface HeaderProps {
  pageTitle?: string;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

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
    shipments,
  } = useAdminState();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifAnim = usePopoverAnimation(showNotifications, () => setShowNotifications(false));

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

  const handleNavigate = (href: string) => {
    setIsSearchOpen(false);
    router.push(href);
  };

  // Live ops notification feed (N3): store state in, repository out.
  // Mock items today; a database feed replaces the builder later.
  const notificationItems = React.useMemo(
    () => buildNotifications({ orders, products, supportTickets }),
    [orders, products, supportTickets],
  );
  const notifications = useNotifications(notificationItems);

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
                aria-expanded={notifAnim.visible}
                aria-haspopup="dialog"
                title={`${notifications.unreadCount} unread notifications`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {notifications.unreadCount > 0 && (
                  <span className="notificationBadge">{notifications.unreadCount}</span>
                )}
              </button>

              {notifAnim.visible && (
                <>
                  <div
                    aria-hidden="true"
                    onClick={() => setShowNotifications(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div
                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '400px', maxWidth: 'calc(100vw - 32px)', zIndex: 50 }}
                    className={
                      notifAnim.phase === 'closing'
                        ? 'animate-[popoverOut_0.15s_ease-in]'
                        : 'animate-[popoverIn_0.18s_ease-out]'
                    }
                  >
                    <NotificationPanel
                      repo={notifications}
                      onNavigate={(href) => {
                        setShowNotifications(false);
                        router.push(href);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User Portrait with Role Label */}
          <div className="userProfile" title={`Logged in as ${activeRole}`}>
            <div className="avatarCodeWrapper">
              <svg
                width="40"
                height="40"
                viewBox="0 0 162 163"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="koboyoProfileSvg"
                aria-label="Urvil Kargathala Profile"
              >
                <defs>
                  <linearGradient id="koboyoAvatarGrad" x1="0" y1="0" x2="162" y2="163" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#7539FF" />
                    <stop offset="100%" stopColor="#501EB8" />
                  </linearGradient>
                </defs>
                <circle cx="81" cy="81.5" r="80" fill="#F8F5FF" />
                <path
                  d="M65.6 8.6a74 74 0 0 0-55.7 53 82 82 0 0 0 0 38.7 72 72 0 0 0 39.6 48.2 72 72 0 0 0 79.3-10.5 77 77 0 0 0 17.7-92 74 74 0 0 0-45-36.5c-8.7-2.4-27.3-2.8-35.9-.9m34.2 6.5a62 62 0 0 1 29.7 17.4A58 58 0 0 1 146.1 60a85 85 0 0 1 .1 41 71 71 0 0 1-12.8 24.4l-4.7 5.9-3.4-7.2a46 46 0 0 0-30.3-25l-7-1.7 3.9-1.7A29 29 0 0 0 107 71a28 28 0 0 0-15.4-24.6 26.6 26.6 0 0 0-36.2 15.9 31 31 0 0 0 1.4 21.3c2.4 4.6 9 11 13.4 12.8l3 1.3-4.6.6c-13.4 1.9-31.1 16.9-34.1 29-.4 1.5-1.1 2.7-1.6 2.7-1.4 0-8.9-10-11.9-15.9a77 77 0 0 1-6.5-48.2c3-12.9 8.8-23.3 17.9-32.5a67 67 0 0 1 67.4-18.3m-13.3 35a25 25 0 0 1 14.4 15.6 21.6 21.6 0 0 1-11.5 24.9 20 20 0 0 1-26-6.8 22 22 0 0 1 2.4-28.1c6.1-6 12.7-7.8 20.7-5.6m9.6 54.9a41 41 0 0 1 25.6 24.9l1.7 5.3-2.9 2.5A75 75 0 0 1 85 150.5a77 77 0 0 1-32.3-6.3c-7.4-3.5-14.7-8.7-14.7-10.5 0-2.5 5.9-13.3 9.5-17.5a42 42 0 0 1 18-11.4 62 62 0 0 1 30.6.2"
                  fill="url(#koboyoAvatarGrad)"
                />
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

      {/* Spotlight Search Modal (S5): island dialog, overlay untouched */}
      {isSearchOpen && (
        <div
          className="commandPaletteOverlay"
          onClick={() => setIsSearchOpen(false)}
        >
          <SearchModal
            orders={orders}
            products={products}
            customers={customers}
            shipments={shipments}
            onNavigate={handleNavigate}
            onClose={() => setIsSearchOpen(false)}
          />
        </div>
      )}
    </>
  );
}
