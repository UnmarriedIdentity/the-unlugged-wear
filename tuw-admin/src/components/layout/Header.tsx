'use client';

import React, { useState } from 'react';
import { Search, CirclePlus, Bell, Menu, X, RotateCcw, ShieldCheck, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { StaffRole } from '@/mocks/fixtures';

interface HeaderProps {
  pageTitle?: string;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export default function Header({
  pageTitle = 'Home',
  mobileMenuOpen,
  onToggleMobileMenu,
}: HeaderProps) {
  const {
    activeRole,
    setActiveRole,
    scenario,
    setScenario,
    simulatedError,
    retryConnection,
    resetDemoData,
    showToast,
    supportTickets,
    orders,
  } = useAdminState();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingIssuesCount = orders.filter((o) => o.fulfillmentStatus === 'submission_failed').length +
    supportTickets.filter((t) => t.status === 'open').length;

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

      {/* Top Demo Session Ribbon */}
      <div
        style={{
          backgroundColor: '#1E1B2E',
          color: '#E9E4F5',
          fontSize: '12px',
          fontWeight: 500,
          padding: '6px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(117, 57, 255, 0.25)',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#7539FF',
                display: 'inline-block',
                boxShadow: '0 0 6px #7539FF',
              }}
            />
            <strong>DEMO SESSION:</strong>
          </span>

          {/* Role Selector Dropdown */}
          {/* Role Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Role: {activeRole}</span>
              <ChevronDown size={12} />
            </button>

            {showRoleMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: '#FFFFFF',
                  color: '#262626',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)',
                  border: '1px solid #E2E4E6',
                  zIndex: 100,
                  width: '180px',
                  overflow: 'hidden',
                }}
              >
                {(['Owner', 'Operations', 'Content', 'Read-only'] as StaffRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setActiveRole(r);
                      setShowRoleMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      background: activeRole === r ? 'var(--tuw-bg-selected, #F8F5FF)' : 'transparent',
                      color: activeRole === r ? 'var(--tuw-action-primary, #7539FF)' : '#262626',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: activeRole === r ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{r}</span>
                    {activeRole === r && <CheckCircle2 size={14} color="#7539FF" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scenario Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Scenario: {scenario}</span>
              <ChevronDown size={12} />
            </button>

            {showScenarioMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: '#FFFFFF',
                  color: '#262626',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)',
                  border: '1px solid #E2E4E6',
                  zIndex: 100,
                  width: '200px',
                  overflow: 'hidden',
                }}
              >
                {[
                  { id: 'normal', label: 'Normal Baseline' },
                  { id: 'empty', label: 'Empty States (Zero data)' },
                  { id: 'error', label: 'Simulated API Error' },
                  { id: 'long_content', label: 'Long Multiline Text' },
                ].map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setScenario(sc.id as any);
                      setShowScenarioMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      background: scenario === sc.id ? 'var(--tuw-bg-selected, #F8F5FF)' : 'transparent',
                      color: scenario === sc.id ? 'var(--tuw-action-primary, #7539FF)' : '#262626',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: scenario === sc.id ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{sc.label}</span>
                    {scenario === sc.id && <CheckCircle2 size={14} color="#7539FF" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span style={{ color: 'rgba(233, 228, 245, 0.65)' }}>
            Simulated Local State · No live credentials or card charges
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all demo data back to deterministic fixtures?')) {
                resetDemoData();
              }
            }}
            title="Reset local changes back to baseline fixtures"
            style={{
              background: 'none',
              border: 'none',
              color: '#CFCBFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              textDecoration: 'underline',
            }}
          >
            <RotateCcw size={12} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

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

        {/* Search Bar */}
        <div className="searchContainer">
          <Search className="searchIcon" />
          <input
            type="text"
            placeholder="Search orders, products, or customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="searchInput"
          />
          <CirclePlus className="searchPlusIcon" />
        </div>

        {/* Actions & Profile */}
        <div className="topBarRight">
          <div className="actionIcons">
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
                    border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
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
    </>
  );
}
