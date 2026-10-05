'use client';

import React, { useState } from 'react';
import { MoonStar, Contrast, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SidebarDockProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Bottom docking toolbar (night / contrast / collapse). Owns its theme-mode
 * state; active treatments live here as the single source.
 */
export default function SidebarDock({ isCollapsed, onToggleCollapse }: SidebarDockProps) {
  const [activeThemeMode, setActiveThemeMode] = useState<'dark' | 'contrast' | 'default'>('dark');

  const handleThemeToggle = (mode: 'dark' | 'contrast') => {
    setActiveThemeMode((prev) => (prev === mode ? 'default' : mode));
  };

  if (isCollapsed) {
    return (
      <div className="flex w-full justify-center mt-2">
        <button
          type="button"
          className="flex h-9 w-11 items-center justify-center rounded-control border border-nav-dock-line bg-nav-dock-bg text-nav-dock-text cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2 hover:bg-nav-dock-hover-light hover:text-white hover:border-nav-dock-line-hover"
          onClick={onToggleCollapse}
          title="Expand Sidebar"
          aria-label="Expand Sidebar"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 shrink-0 overflow-hidden rounded-control border border-nav-dock-line bg-nav-dock-bg mt-1.5 mb-0.5 h-8">
      <button
        type="button"
        className={cn('flex h-full w-full items-center justify-center border-0 border-r border-nav-dock-line bg-transparent p-0 text-nav-dock-text cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2 last:border-r-0', activeThemeMode === 'dark' ? 'bg-nav-dock-active-bg text-white' : 'hover:bg-nav-dock-hover hover:text-white')}
        onClick={() => handleThemeToggle('dark')}
        aria-label="Toggle Night Mode"
        title="Night Mode"
      >
        <MoonStar size={15} />
      </button>
      <button
        type="button"
        className={cn('flex h-full w-full items-center justify-center border-0 border-r border-nav-dock-line bg-transparent p-0 text-nav-dock-text cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2 last:border-r-0', activeThemeMode === 'contrast' ? 'bg-nav-dock-active-bg text-white' : 'hover:bg-nav-dock-hover hover:text-white')}
        onClick={() => handleThemeToggle('contrast')}
        aria-label="Toggle Theme Contrast"
        title="Theme Contrast"
      >
        <Contrast size={15} />
      </button>
      <button
        type="button"
        className="flex h-full w-full items-center justify-center border-0 border-r border-nav-dock-line bg-transparent p-0 text-nav-dock-text cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2 last:border-r-0 hover:bg-nav-dock-hover hover:text-white"
        onClick={onToggleCollapse}
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
      >
        <ChevronLeft size={15} />
      </button>
    </div>
  );
}
