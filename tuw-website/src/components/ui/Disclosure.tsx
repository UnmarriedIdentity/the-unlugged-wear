'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DisclosureProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export default function Disclosure({
  title,
  subtitle,
  children,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  badge,
  icon,
  className = '',
}: DisclosureProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalOpen;

  const handleToggle = () => {
    const next = !open;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onToggle?.(next);
  };

  return (
    <div className={`border-b border-[#E2DDCF] py-4 transition-colors ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left group cursor-pointer focus:outline-none"
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2">
            {icon && <span className="text-[#1A1A1A]">{icon}</span>}
            <span className="text-sm font-semibold tracking-wide text-[#1A1A1A] group-hover:text-black">
              {title}
            </span>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-[#8A8A8A] mt-0.5">{subtitle}</p>}
        </div>

        <ChevronDown
          size={16}
          className={`text-[#8A8A8A] group-hover:text-[#1A1A1A] transition-transform duration-200 shrink-0 ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {open && (
        <div className="pt-3 pb-1 text-sm text-[#5A5A5A] leading-relaxed animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
