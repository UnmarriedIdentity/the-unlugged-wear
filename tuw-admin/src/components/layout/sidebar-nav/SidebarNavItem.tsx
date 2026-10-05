'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';
import SidebarNavBadge from './SidebarNavBadge';

export interface SidebarNavItemDef {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string[];
  badge?: {
    text: string;
    className: string;
    dotClassName: string;
  };
}

interface SidebarNavItemProps {
  item: SidebarNavItemDef;
  active: boolean;
  isCollapsed: boolean;
  variant?: 'branch' | 'footer' | 'danger';
  showBadgeDot?: boolean;
}

/**
 * Single sidebar navigation row — the reusable source for every nav row.
 * Owns active-card, hover, collapsed, and badge treatments per variant:
 * - branch: 13.5px rows with tree stems, wash/white-card actives.
 * - footer: 14px rows (settings/support black-card actives, purple hover).
 * - danger: logout row (error hover, never active).
 */
export default function SidebarNavItem({ item, active, isCollapsed, variant = 'branch', showBadgeDot = false }: SidebarNavItemProps) {
  const ItemIcon = item.icon;
  const iconSize = variant === 'branch' ? 17 : 18;

  if (variant === 'danger') {
    return (
      <Link
        href={item.href}
        className={cn('group relative flex w-full cursor-pointer select-none rounded-nav border-0 bg-transparent text-left text-[14px] font-medium transition-all duration-150 mt-0.5', isCollapsed ? 'justify-center p-2' : 'items-center gap-3 px-3 py-2', 'text-secondary hover:bg-error-bg hover:text-error-text')}
        title={isCollapsed ? item.label : undefined}
      >
        {isCollapsed && (<span className="flex size-4.5 shrink-0 items-center justify-center text-secondary"><ItemIcon size={iconSize} /></span>)}
        {!isCollapsed && (
          <>
            <span className="flex size-4.5 shrink-0 items-center justify-center text-secondary group-hover:text-error-text">
              <ItemIcon size={iconSize} />
            </span>
            <span className="flex-1 truncate text-[14px]">{item.label}</span>
          </>
        )}
      </Link>
    );
  }

  if (variant === 'footer') {
    return (
      <Link
        href={item.href}
        className={cn('group relative flex w-full cursor-pointer select-none rounded-nav border-0 bg-transparent text-left text-[14px] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2', isCollapsed ? 'justify-center p-2' : 'items-center gap-3 px-3 py-2', active ? 'bg-white font-semibold text-nav-active-text shadow-nav-edge z-1 hover:bg-white hover:text-nav-active-text' : 'font-medium text-primary hover:bg-nav-hover-wash hover:text-action-primary')}
        title={isCollapsed ? item.label : undefined}
      >
        {isCollapsed && (<span className={cn('flex size-4.5 shrink-0 items-center justify-center', active ? 'text-nav-active-text' : 'text-secondary')}><ItemIcon size={iconSize} /></span>)}
        {!isCollapsed && (
          <>
            <span className={cn('flex size-4.5 shrink-0 items-center justify-center', active ? 'text-nav-active-text' : 'text-secondary group-hover:text-action-primary')}>
              <ItemIcon size={iconSize} />
            </span>
            <span className="flex-1 truncate text-[14px]">{item.label}</span>
          </>
        )}
      </Link>
    );
  }

  return (
    <div className={cn(!isCollapsed && 'relative flex w-full items-center pl-9')}>
      <Link
        href={item.href}
        className={cn(
          'relative flex w-full rounded-nav text-nav-child no-underline transition-all duration-150 focus-visible:outline-2 focus-visible:outline-action-primary focus-visible:outline-offset-2',
          isCollapsed ? 'h-9.5 justify-center p-2' : 'h-9.5 items-center gap-2.5 px-3',
          active ? 'bg-white font-semibold text-nav-active-text shadow-nav-edge z-1 isolate hover:bg-white hover:text-nav-active-text' : 'font-medium text-secondary hover:bg-nav-branch-hover hover:text-nav-active-text'
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {isCollapsed && (<span className={cn('relative flex size-4.5 shrink-0 items-center justify-center', active ? 'text-action-primary' : 'text-secondary')}><ItemIcon size={iconSize} />{showBadgeDot && item.badge && <span aria-hidden="true" className={cn('absolute -right-0.5 -top-0.5 size-2 rounded-full', item.badge.dotClassName)} />}</span>)}
        {!isCollapsed && (<><span className="truncate text-nav-child">{item.label}</span>{item.badge && <SidebarNavBadge text={item.badge.text} className={item.badge.className} />}</>)}
      </Link>
    </div>
  );
}
