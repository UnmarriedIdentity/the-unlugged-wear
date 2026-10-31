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
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumbs"
      className={`flex items-center flex-wrap gap-2 text-xs uppercase tracking-wider text-store-muted font-medium ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight size={12} className="text-store-card-border shrink-0" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="inline-flex items-center min-h-6 hover:text-store-charcoal transition-colors shrink-0"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={`truncate max-w-xs sm:max-w-md ${isLast ? 'text-store-charcoal font-semibold' : ''}`}
                title={item.label}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
