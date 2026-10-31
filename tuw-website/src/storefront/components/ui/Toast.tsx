'use client';

import React from 'react';
import { Check, Sparkles, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            role="alert"
            className="pointer-events-auto relative overflow-hidden rounded-2xl bg-neutral-900/95 backdrop-blur-md border border-store-gold/30 p-4 shadow-2xl shadow-black/60 tuw-toast-enter transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Refined Gold Emblem Icon Disc */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isError
                    ? 'bg-store-terracotta/20 border border-store-terracotta/40 text-store-terracotta'
                    : 'bg-store-gold/15 border border-store-gold/30 text-store-gold'
                }`}
              >
                {isSuccess ? (
                  <Check size={14} strokeWidth={2.5} />
                ) : isError ? (
                  <AlertCircle size={14} strokeWidth={2.5} />
                ) : (
                  <Sparkles size={14} strokeWidth={2} />
                )}
              </div>

              {/* Text Container */}
              <div className="flex-1 pr-1">
                <h4 className="text-sm font-heading font-medium tracking-wide text-white leading-snug">
                  {toast.title}
                </h4>
                {toast.description && (
                  <p className="text-xs text-white/70 font-normal leading-relaxed mt-0.5">
                    {toast.description}
                  </p>
                )}
              </div>

              {/* Minimal Dismiss Action */}
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
              >
                <X size={15} />
              </button>
            </div>

            {/* Hairline Gold Depletion Progress Shimmer Bar */}
            <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-white/10 overflow-hidden rounded-full">
              <div className="h-full bg-gradient-to-r from-store-gold via-white/80 to-store-gold tuw-toast-progress" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
