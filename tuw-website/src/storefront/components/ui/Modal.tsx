'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  className = '',
}: ModalProps) {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-2xl p-6 sm:p-8 shadow-2xl z-10 my-8 overflow-hidden transition-all border border-[#E2DDCF] ${className}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-5 top-5 p-2 rounded-full text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#FAF9F6] transition-colors"
        >
          <X size={18} />
        </button>

        {(title || subtitle) && (
          <div className="mb-6 pr-8">
            {title && (
              <h3 className="text-xl font-bold tracking-tight text-[#1A1A1A]">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-[#666] mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
