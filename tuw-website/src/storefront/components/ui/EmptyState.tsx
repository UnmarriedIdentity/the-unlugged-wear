'use client';

import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-[#E2DDCF] bg-[#FAF9F6] ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#8A8A8A] mb-4">
        {icon || <PackageOpen size={28} />}
      </div>

      <h4 className="text-base font-bold text-[#1A1A1A]">{title}</h4>
      <p className="text-sm text-[#666] max-w-sm mt-1.5 leading-relaxed">{description}</p>

      {actionLabel && (
        <div className="mt-6">
          <Button
            variant="dark"
            size="md"
            href={actionHref}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
