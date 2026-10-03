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

export default function DashboardShell({
  children,
  pageTitle = 'Dashboard',
}: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        mobileMenuOpen={mobileMenuOpen}
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
