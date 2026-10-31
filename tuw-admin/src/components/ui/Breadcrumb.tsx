'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                style={{
                  color: 'var(--tuw-text-secondary, #5D6772)',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tuw-action-primary, #7539FF)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tuw-text-secondary, #5D6772)')}
              >
                {item.label}
              </Link>
            ) : (
              <span
                style={{
                  color: isLast ? 'var(--tuw-text-primary, #262626)' : 'var(--tuw-text-secondary, #5D6772)',
                  fontWeight: isLast ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight size={14} color="var(--tuw-border-control, #D1D5DB)" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
