'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/cn';

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  activeNav?: string;
}

let globalIsCollapsed: boolean = false;

export default function DashboardShell({
  children,
  pageTitle = 'Dashboard',
}: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tuw_admin_sidebar_collapsed');
        if (stored !== null) {
          const val = stored === 'true';
          globalIsCollapsed = val;
          return val;
        }
      } catch {
        // fallback
      }
    }
    return globalIsCollapsed;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      globalIsCollapsed = next;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('tuw_admin_sidebar_collapsed', String(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  return (
    <div className="dashboardLayoutRoot">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="dashboardMobileBackdrop"
        />
      )}

      {/* Sidebar Navigation - Fixed, All-Time Visible */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Container - Offsets cleanly for fixed sidebar */}
      <div className={cn('dashboardMainWrapper', isCollapsed && 'dashboardMainWrapperCollapsed')}>
        <Header
          pageTitle={pageTitle}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Page Content Body */}
        <main
          id="main-content"
          tabIndex={-1}
          className="dashboardMainContent"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
