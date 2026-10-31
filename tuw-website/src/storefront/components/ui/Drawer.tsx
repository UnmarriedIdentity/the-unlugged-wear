'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'right' | 'left' | 'bottom';
  maxWidth?: string;
  className?: string;
  bodyClassName?: string;
  hideHeader?: boolean;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = 'right',
  maxWidth = 'max-w-md',
  className = '',
  bodyClassName = 'p-6',
  hideHeader = false,
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    right: 'inset-y-0 right-0',
    left: 'inset-y-0 left-0',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh]',
  }[position];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-400 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Surface */}
      <div
        className={`fixed ${positionClasses} w-full ${maxWidth} bg-white shadow-2xl flex flex-col z-10 border-l border-store-card-border duration-500 ease-out animate-in slide-in-from-${position} ${className}`}
      >
        {/* Header (Rolls-Royce Stagger Delay 1) */}
        {!hideHeader && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-store-card-border shrink-0 tuw-reveal-item tuw-delay-1">
            <div>
              {title && (
                <h3 className="text-xl font-heading font-medium tracking-tight text-store-charcoal">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-store-muted mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="p-1.5 rounded-full text-store-muted hover:text-store-charcoal hover:bg-store-cream transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>

        {/* Fixed Footer */}
        {footer && <div className="shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
