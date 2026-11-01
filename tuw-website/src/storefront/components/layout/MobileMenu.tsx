'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Heart, User, ArrowRight, ShieldCheck, RefreshCw, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Drawer from '@storefront/components/ui/Drawer';
import type { NavItem } from './navigation';
import type { Product } from '@storefront/lib/types';
import { matchesShopFilter } from '@storefront/lib/product';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  /** Primary navigation; items with columns expand to show their sub-links. */
  items?: NavItem[];
  links: { label: string; href: string }[];
  /** Catalogue, so categories with no products are hidden. */
  products?: Product[];
  /** Brand social profiles shown at the bottom. */
  socialLinks?: { id: string; label: string; href: string; path: string }[];
}

// Secondary account & tracking shortcuts shown below the primary nav list.
// Module scope so the array is stable across renders.
const SECONDARY_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Search Catalog', href: '/search', icon: Search },
  { label: 'My Account & Orders', href: '/account', icon: User },
  { label: 'Saved Wishlist', href: '/wishlist', icon: Heart },
  { label: 'Track My Order', href: '/track-order', icon: RefreshCw },
];

export default function MobileMenu({ isOpen, onClose, items = [], links, products = [], socialLinks = [] }: MobileMenuProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="left"
      maxWidth="max-w-sm"
      title="The Unplugged Wear"
      subtitle="Printed to order in India"
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
                  className="flex items-center justify-between py-3 text-base font-medium tracking-wide text-store-text-primary hover:text-black border-b border-store-border transition-colors"
                >
                  <span>{item.label}</span>
                  <ArrowRight size={14} className="text-store-text-secondary" />
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
                  className="w-full flex items-center justify-between py-3 text-base font-medium tracking-wide text-store-text-primary hover:text-black transition-colors cursor-pointer"
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    size={16}
                    className={`text-store-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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
                          {column.links
                            .filter((link) => !link.filter || products.some((p) => matchesShopFilter(p, link.filter!)))
                            .map((link) => (
                            <li key={`${link.label}-${link.href}`}>
                              <Link
                                href={link.href}
                                onClick={onClose}
                                className="block py-2 text-sm text-store-text-primary hover:text-black"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {item.shopAll && (
                      <Link
                        href={item.shopAll.href}
                        onClick={onClose}
                        className="inline-flex items-center gap-2 py-2 text-sm font-medium text-store-charcoal underline underline-offset-4 decoration-store-gold"
                      >
                        {item.shopAll.label}
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    )}
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
              className="flex items-center justify-between py-3 text-base font-medium tracking-wide text-store-text-primary hover:text-black border-b border-store-border transition-colors"
            >
              <span>{link.label}</span>
              <ArrowRight size={14} className="text-store-text-secondary" />
            </Link>
          ))}
        </div>

        {/* Secondary Account & Tracking Links */}
        <div className="flex flex-col gap-3 pt-6 border-t border-store-card-border">
          {SECONDARY_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center gap-3 text-sm font-medium text-store-text-secondary hover:text-store-charcoal"
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Brand note + social profiles */}
        <div className="space-y-4">
          <div className="p-4 bg-store-cream text-xs text-store-text-secondary leading-relaxed">
            <div className="flex items-center gap-1.5 font-medium text-store-charcoal mb-1">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Printed to order</span>
            </div>
            Every piece is printed after you order it, so nothing is made that nobody wanted.
          </div>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4 text-store-text-secondary">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`The Unplugged Wear on ${social.label}`}
                  className="inline-flex items-center justify-center w-9 h-9 hover:text-store-charcoal transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
