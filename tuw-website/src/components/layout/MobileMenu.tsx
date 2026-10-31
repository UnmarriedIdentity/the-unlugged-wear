'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Heart, User, ArrowRight, ShieldCheck, RefreshCw, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Drawer from '../ui/Drawer';
import type { NavItem } from './navigation';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  /** Primary navigation; items with columns expand to show their sub-links. */
  items?: NavItem[];
  links: { label: string; href: string }[];
}

// Secondary account & tracking shortcuts shown below the primary nav list.
// Module scope so the array is stable across renders.
const SECONDARY_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Search Catalog', href: '/search', icon: Search },
  { label: 'My Account & Orders', href: '/account', icon: User },
  { label: 'Saved Wishlist', href: '/wishlist', icon: Heart },
  { label: 'Track My Order', href: '/track-order', icon: RefreshCw },
];

export default function MobileMenu({ isOpen, onClose, items = [], links }: MobileMenuProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="left"
      maxWidth="max-w-sm"
      title="The Unplugged Wear"
      subtitle="Intentional POD Apparel"
    >
      <div className="flex flex-col h-full justify-between gap-8">
        {/* Navigation Link List */}
        <div className="flex flex-col gap-1">
          {items.map((item) => {
            if (!item.columns?.length) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between py-3 text-base font-semibold tracking-wide text-store-text-primary hover:text-store-accent border-b border-store-border transition-colors"
                >
                  <span>{item.label}</span>
                  <ArrowRight size={14} className="text-[#8A8A8A]" />
                </Link>
              );
            }
            const isExpanded = expanded === item.label;
            const panelId = `mobile-nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            return (
              <div key={item.href} className="border-b border-store-border">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => setExpanded(isExpanded ? null : item.label)}
                  className="w-full flex items-center justify-between py-3 text-base font-semibold tracking-wide text-store-text-primary hover:text-store-accent transition-colors cursor-pointer"
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    size={16}
                    className={`text-[#8A8A8A] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <div id={panelId} className="pb-3 pl-1 space-y-3">
                    {item.columns.map((column) => (
                      <div key={column.title}>
                        <p className="text-xs uppercase tracking-wider text-store-text-secondary mb-1">
                          {column.title}
                        </p>
                        <ul>
                          {column.links.map((link) => (
                            <li key={`${link.label}-${link.href}`}>
                              <Link
                                href={link.href}
                                onClick={onClose}
                                className="block py-2 text-sm text-store-text-primary hover:text-store-accent"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between py-3 text-base font-semibold tracking-wide text-store-text-primary hover:text-store-accent border-b border-store-border transition-colors"
            >
              <span>{link.label}</span>
              <ArrowRight size={14} className="text-[#8A8A8A]" />
            </Link>
          ))}
        </div>

        {/* Secondary Account & Tracking Links */}
        <div className="flex flex-col gap-3 pt-6 border-t border-[#E2DDCF]">
          {SECONDARY_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center gap-3 text-sm font-medium text-[#5A5A5A] hover:text-[#1A1A1A]"
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Brand Notes */}
        <div className="p-4 rounded-xl bg-[#F4F1EA] text-xs text-[#666] leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-[#1A1A1A] mb-1">
            <ShieldCheck size={16} className="text-[#10B981]" />
            <span>Ethical POD Promise</span>
          </div>
          Zero overproduction. Every piece is printed after you order it.
        </div>
      </div>
    </Drawer>
  );
}
