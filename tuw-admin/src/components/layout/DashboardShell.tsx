'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  activeNav?: string;
}

export default function DashboardShell({
  children,
  pageTitle = 'Home',
}: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
        color: 'var(--tuw-text-primary, #262626)',
        fontFamily: 'var(--font-main)',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 95,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
          overflowX: 'hidden',
        }}
      >
        <Header
          pageTitle={pageTitle}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Page Content Body */}
        <main
          style={{
            padding: '30px',
            maxWidth: '1360px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
