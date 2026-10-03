'use client';

import React from 'react';
import Link from 'next/link';
import { X, Search, Heart, User, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import Drawer from '../ui/Drawer';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
}

export default function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
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
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between py-3 text-base font-semibold tracking-wide text-[#1A1A1A] hover:text-[#7539FF] border-b border-[#F4F1EA] transition-colors"
            >
              <span>{link.label}</span>
              <ArrowRight size={14} className="text-[#8A8A8A]" />
            </Link>
          ))}
        </div>

        {/* Secondary Account & Tracking Links */}
        <div className="flex flex-col gap-3 pt-6 border-t border-[#E2DDCF]">
          <Link
            href="/search"
            onClick={onClose}
            className="flex items-center gap-3 text-sm font-medium text-[#5A5A5A] hover:text-[#1A1A1A]"
          >
            <Search size={18} />
            <span>Search Catalog</span>
          </Link>
          <Link
            href="/account"
            onClick={onClose}
            className="flex items-center gap-3 text-sm font-medium text-[#5A5A5A] hover:text-[#1A1A1A]"
          >
            <User size={18} />
            <span>My Account & Orders</span>
          </Link>
          <Link
            href="/wishlist"
            onClick={onClose}
            className="flex items-center gap-3 text-sm font-medium text-[#5A5A5A] hover:text-[#1A1A1A]"
          >
            <Heart size={18} />
            <span>Saved Wishlist</span>
          </Link>
          <Link
            href="/track-order"
            onClick={onClose}
            className="flex items-center gap-3 text-sm font-medium text-[#5A5A5A] hover:text-[#1A1A1A]"
          >
            <RefreshCw size={18} />
            <span>Track My Order</span>
          </Link>
        </div>

        {/* Footer Brand Notes */}
        <div className="p-4 rounded-xl bg-[#F4F1EA] text-xs text-[#666] leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-[#1A1A1A] mb-1">
            <ShieldCheck size={16} className="text-[#10B981]" />
            <span>Ethical POD Promise</span>
          </div>
          Zero overproduction. Every garment custom-cured on 100% GOTS organic cotton.
        </div>
      </div>
    </Drawer>
  );
}
