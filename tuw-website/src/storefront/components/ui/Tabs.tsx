'use client';

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  badge?: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar ${
        variant === 'underline' ? 'border-b border-[#E2DDCF]' : ''
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'bg-[#F4F1EA] text-[#5A5A5A] hover:bg-[#EAE5D9]'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && <span className="ml-1.5 opacity-70">({tab.count})</span>}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`pb-3 px-2 text-sm font-semibold tracking-wide transition-all relative whitespace-nowrap cursor-pointer ${
              isActive
                ? 'text-[#1A1A1A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#1A1A1A]'
                : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs text-[#8A8A8A]">({tab.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
