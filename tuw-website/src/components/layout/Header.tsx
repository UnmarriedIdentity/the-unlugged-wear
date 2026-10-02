'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, Heart, User, Menu, X } from 'lucide-react';
import { useStore } from '@/mocks/store';
import AnnouncementBar from './AnnouncementBar';
import MobileMenu from './MobileMenu';
import CartDrawer from './CartDrawer';

export default function Header() {
  const pathname = usePathname();
  const { cartCount, wishlist, setIsCartDrawerOpen } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const navLinks = [
    { label: 'All Apparel', href: '/shop' },
    { label: 'Heavy Hoodies', href: '/shop?category=hoodies' },
    { label: 'Organic Tees', href: '/shop?category=tees' },
    { label: 'Pants', href: '/shop?category=pants' },
    { label: 'Capsules', href: '/collections' },
    { label: 'Journal', href: '/journal' },
    { label: 'About', href: '/about' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchVal.trim())}`;
    }
  };

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E2DDCF] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Mobile Menu Trigger & Brand Name */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open mobile menu"
                className="lg:hidden p-2 rounded-full text-[#1A1A1A] hover:bg-black/5"
              >
                <Menu size={22} />
              </button>

              <Link href="/" className="flex flex-col">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tighter uppercase text-[#1A1A1A]">
                  The Unplugged Wear
                </span>
                <span className="text-[9px] tracking-[0.25em] text-[#8A8A8A] uppercase font-semibold -mt-1 hidden sm:block">
                  Intentional Apparel • Est. 2026
                </span>
              </Link>
            </div>

            {/* Center: Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-xs font-semibold uppercase tracking-wider transition-colors hover:text-black ${
                      isActive ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A] pb-0.5' : 'text-[#666666]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions (Search, Wishlist, Account, Cart) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Search catalog"
                className="p-2 sm:p-2.5 rounded-full text-[#1A1A1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <Search size={20} />
              </button>

              {/* Wishlist Link */}
              <Link
                href="/wishlist"
                aria-label="View wishlist"
                className="relative p-2 sm:p-2.5 rounded-full text-[#1A1A1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#7539FF] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Account Link */}
              <Link
                href="/account"
                aria-label="Customer account"
                className="p-2 sm:p-2.5 rounded-full text-[#1A1A1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <User size={20} />
              </Link>

              {/* Cart Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                aria-label={`Shopping bag with ${cartCount} items`}
                className="relative p-2 sm:p-2.5 rounded-full text-[#1A1A1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#1A1A1A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Search Input Bar */}
        {isSearchOpen && (
          <div className="border-t border-[#E2DDCF] bg-white py-4 px-4 sm:px-8 animate-in fade-in duration-150">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search size={18} className="absolute left-4 text-[#8A8A8A]" />
                <input
                  type="text"
                  placeholder="Search heavyweight hoodies, organic tees, pleated pants..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  autoFocus
                  className="w-full h-12 pl-12 pr-12 rounded-full border border-[#E2DDCF] bg-[#FAF9F6] text-sm outline-none focus:border-[#1A1A1A]"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  aria-label="Close search"
                  className="absolute right-4 text-[#8A8A8A] hover:text-[#1A1A1A]"
                >
                  <X size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={navLinks}
      />

      {/* Slide-out Cart Drawer */}
      <CartDrawer />
    </>
  );
}
