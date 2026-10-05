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
    <div className="relative flex min-h-screen w-full items-stretch bg-canvas font-sans text-primary">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-[95] cursor-pointer touch-manipulation bg-black/45 blur-[2px] animate-[tuwFadeIn_0.2s_ease-out]"
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
      <div className={cn('flex min-h-screen min-w-0 flex-1 flex-col bg-canvas', isCollapsed ? 'ml-20' : 'ml-65', 'max-md:ml-0')}>
        <Header
          pageTitle={pageTitle}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Page Content Body */}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto flex w-full min-w-0 max-w-[1400px] flex-col gap-5 px-7 pb-10 pt-6 max-md:px-4 max-md:pb-8 max-md:pt-4"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
