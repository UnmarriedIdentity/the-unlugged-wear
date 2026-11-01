'use client';

import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, Info, X, AlertCircle } from 'lucide-react';

export interface BrandToastProps {
  id: string | number;
  title: string;
  description?: string;
  /** Small product photo shown on the left. */
  image?: string;
  tone?: 'success' | 'info' | 'warning' | 'error';
  action?: { label: string; href?: string; onClick?: () => void };
}

/**
 * The storefront's toast card, rendered through Sonner (`toast.custom`) so
 * stacking, timing and swipe-to-dismiss come from the library while the look
 * stays on-brand: charcoal card, optional thumbnail, gold action, close inside.
 */
export default function BrandToast({ id, title, description, image, tone = 'success', action }: BrandToastProps) {
  const Icon = tone === 'error' || tone === 'warning' ? AlertCircle : tone === 'info' ? Info : Check;
  const close = () => toast.dismiss(id);

  return (
    <div
      role="status"
      className="w-[min(92vw,320px)] flex items-center gap-2.5 py-2 pl-2 pr-1 bg-store-charcoal text-white shadow-lg font-sans"
    >
      {image ? (
        <span className="w-8 h-10 shrink-0 overflow-hidden bg-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="w-full h-full object-cover" />
        </span>
      ) : (
        <span
          className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${
            tone === 'error' ? 'bg-store-terracotta text-white' : 'bg-store-gold text-store-charcoal'
          }`}
        >
          <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
        </span>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-snug truncate">
          <span className="font-medium">{title}</span>
          {description && <span className="text-white/60"> · {description}</span>}
        </p>
      </div>

      {action &&
        (action.href ? (
          <Link
            href={action.href}
            onClick={close}
            className="shrink-0 text-xs font-medium text-store-gold underline underline-offset-4 decoration-store-gold/50 hover:decoration-store-gold px-1"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              action.onClick?.();
              close();
            }}
            className="shrink-0 text-xs font-medium text-store-gold underline underline-offset-4 decoration-store-gold/50 hover:decoration-store-gold px-1 cursor-pointer"
          >
            {action.label}
          </button>
        ))}

      <button
        type="button"
        onClick={close}
        aria-label="Dismiss notification"
        className="shrink-0 w-6 h-6 flex items-center justify-center text-white/50 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
