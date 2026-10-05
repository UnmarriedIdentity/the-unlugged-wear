'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavGroupProps {
  groupKey: string;
  label: string;
  icon: LucideIcon;
  isCollapsed: boolean;
  open: boolean;
  chevronOpen: boolean;
  groupActive: boolean;
  stemIdx: number;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}

/**
 * One accordion group: header button (icon + label + chevron), smooth
 * grid-rows expand wrapper, and the stem-hooked tree container.
 */
export default function SidebarNavGroup({
  groupKey,
  label,
  icon: GroupIcon,
  isCollapsed,
  open,
  chevronOpen,
  groupActive,
  stemIdx,
  onToggle,
  children,
}: SidebarNavGroupProps) {
  return (
    <div className="flex flex-col">
      {!isCollapsed && (
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-nav-sm border-0 bg-transparent py-1.5 pl-2.5 pr-2 cursor-pointer select-none text-left transition-colors duration-150 hover:bg-nav-group-hover focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2"
          onClick={() => onToggle(groupKey)}
        >
          <span className="flex items-center gap-2.5">
            <span className={cn('flex size-4.5 shrink-0 items-center justify-center', groupActive ? 'text-nav-active-text' : 'text-secondary')}>
              <GroupIcon size={18} />
            </span>
            <span className={cn('text-nav-parent font-bold', groupActive ? 'text-nav-active-text' : 'text-nav-group-label')}>{label}</span>
          </span>
          <ChevronDown
            size={13}
            className={cn('flex items-center justify-center transition-transform duration-200', groupActive ? 'text-nav-active-text' : 'text-nav-chevron', chevronOpen && 'rotate-180')}
          />
        </button>
      )}

      {isCollapsed ? (
        <>{children}</>
      ) : (
      <div className={cn('grid transition-[grid-template-rows] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="min-h-0 overflow-hidden">
          <div className={cn('relative mt-[3px] mb-1.5 flex flex-col gap-[3px] navTree', stemIdx >= 0 && `navStemTo${stemIdx}`)}>
            {children}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
