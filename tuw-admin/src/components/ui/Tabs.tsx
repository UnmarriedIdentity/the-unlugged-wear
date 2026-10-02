'use client';

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
}: TabsProps) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: variant === 'pill' ? '6px' : '16px',
        borderBottom: variant === 'underline' ? '1px solid var(--tuw-border-subtle, #E2E4E6)' : 'none',
        overflowX: 'auto',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: variant === 'pill' ? '6px 14px' : '10px 4px',
              border: 'none',
              borderRadius: variant === 'pill' ? 'var(--tuw-radius-control, 8px)' : '0',
              backgroundColor:
                variant === 'pill'
                  ? isActive
                    ? 'var(--tuw-action-primary, #7539FF)'
                    : 'transparent'
                  : 'transparent',
              color:
                variant === 'pill'
                  ? isActive
                    ? '#FFFFFF'
                    : 'var(--tuw-text-secondary, #5D6772)'
                  : isActive
                  ? 'var(--tuw-action-primary, #7539FF)'
                  : 'var(--tuw-text-secondary, #5D6772)',
              fontWeight: isActive ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderBottom:
                variant === 'underline' && isActive
                  ? '2px solid var(--tuw-action-primary, #7539FF)'
                  : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive
                    ? variant === 'pill'
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'var(--tuw-bg-selected, #F8F5FF)'
                    : 'var(--tuw-bg-canvas, #F7F8F9)',
                  color: isActive ? 'inherit' : 'var(--tuw-text-secondary, #5D6772)',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
