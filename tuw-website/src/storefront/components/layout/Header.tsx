'use client';

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '@storefront/mocks/store';
import { HeaderAccountLink, AccountLinkView } from './HeaderAccountLink';
import MobileMenu from './MobileMenu';
import CartDrawer from './CartDrawer';
import TuwEmblem from './TuwEmblem';
import ImageWithFallback from '@storefront/components/ui/ImageWithFallback';
import type { Product } from '@storefront/lib/types';
import { NAV_ITEMS, type NavItem, type NavLink } from './navigation';
import { matchesShopFilter } from '@storefront/lib/product';
import { site } from '@storefront/lib/site';

// Desktop mega-menu panel: link columns (with live product counts) on the left,
// product tiles on the right, and a "Shop all" link along the bottom.
function MegaPanel({
  id,
  item,
  products,
  onNavigate,
}: {
  id: string;
  item: NavItem;
  products: Product[];
  onNavigate: () => void;
}) {
  const countFor = (link: NavLink) =>
    link.filter ? products.filter((p) => matchesShopFilter(p, link.filter!)).length : null;

  const columns = (item.columns || [])
    .map((column) => ({
      ...column,
      links: column.links
        .map((link) => ({ ...link, count: countFor(link) }))
        .filter((link) => link.count !== 0),
    }))
    .filter((column) => column.links.length > 0);

  const features = (item.features || []).flatMap((feature) => {
    const product = feature.productSlug
      ? products.find((p) => p.slug === feature.productSlug)
      : undefined;
    const image = feature.image || product?.images[0]?.url;
    if (!image) return [];
    return [
      {
        key: feature.href || feature.productSlug || image,
        image,
        imagePosition: feature.imagePosition,
        title: feature.title || product?.title || '',
        caption:
          feature.caption ??
          (product ? `₹${product.priceINR.toLocaleString('en-IN')}` : ''),
        href: feature.href || (product ? `/products/${product.slug}` : item.href),
      },
    ];
  });

  return (
    <div
      id={id}
      className="absolute inset-x-0 top-full bg-store-canvas border-y border-store-border shadow-lg tuw-mega-in"
    >
      <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-[minmax(0,1fr)_auto] gap-12">
        <div className="grid grid-cols-3 gap-10">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs uppercase tracking-wider text-store-text-secondary mb-4">{column.title}</p>
              <ul className="space-y-1">
                {column.links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      className="group flex items-baseline justify-between gap-3 py-1.5 text-sm text-store-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
                    >
                      <span className="underline-offset-4 decoration-store-gold group-hover:underline">{link.label}</span>
                      {link.count !== null && (
                        <span className="text-xs text-store-text-secondary tuw-tabular-nums">{link.count}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {features.length > 0 && (
          <div className="flex gap-4">
            {features.map((feature) => (
              <Link
                key={feature.key}
                href={feature.href}
                onClick={onNavigate}
                className="group block w-36 xl:w-48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
              >
                <div className="aspect-4/5 overflow-hidden bg-store-cream">
                  <ImageWithFallback
                    src={feature.image}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: feature.imagePosition }}
                  />
                </div>
                <p className="mt-2.5 text-sm font-medium text-store-text-primary underline-offset-4 decoration-store-gold group-hover:underline">
                  {feature.title}
                </p>
                {feature.caption && (
                  <p className="mt-0.5 text-xs text-store-text-secondary tuw-tabular-nums">{feature.caption}</p>
                )}
              </Link>
            ))}
          </div>
        )}

        {item.shopAll && (
          <div className="col-span-2 pt-6 border-t border-store-border">
            <Link
              href={item.shopAll.href}
              onClick={onNavigate}
              className="inline-flex items-center gap-2 text-sm font-medium text-store-charcoal underline-offset-4 decoration-store-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
            >
              {item.shopAll.label}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const POPULAR_SEARCHES = ['Hoodie', 'Oversized tee', 'Joggers', 'Mug', 'Tote bag'];

function SearchPanel({
  products,
  value,
  onChange,
  onSubmit,
  onClose,
}: {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const query = value.trim().toLowerCase();
  const results = query
    ? products
        .filter((p) => p.publicationStatus !== 'draft' && `${p.title} ${p.subtitle}`.toLowerCase().includes(query))
        .slice(0, 6)
    : [];

  // Close on Escape or a click outside the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // The header search button toggles the panel itself.
      if (target.closest('[data-search-toggle]')) return;
      if (panelRef.current && !panelRef.current.contains(target)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [onClose]);

  return (
    <div ref={panelRef} className="absolute inset-x-0 top-full border-y border-store-border bg-store-surface shadow-lg tuw-mega-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        <form onSubmit={onSubmit} role="search" className="flex items-center gap-3 border-b border-store-charcoal pb-3">
          <Search size={18} className="text-store-text-secondary" aria-hidden="true" />
          <label htmlFor="header-search" className="sr-only">
            Search products
          </label>
          <input
            id="header-search"
            type="search"
            placeholder="Search hoodies, tees, mugs…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
            autoComplete="off"
            className="w-full text-base bg-transparent outline-none text-store-text-primary placeholder:text-store-text-secondary"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="p-1 text-store-text-secondary hover:text-store-text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
          >
            <X size={18} />
          </button>
        </form>

        {!query && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-store-text-secondary">Popular searches</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onChange(term)}
                  className="px-3 py-1.5 rounded-full border border-store-border text-xs text-store-text-secondary hover:border-store-charcoal hover:text-store-charcoal cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {query && (
          <div className="mt-4" aria-live="polite">
            {results.length === 0 ? (
              <p className="text-sm text-store-text-secondary">No products match “{value.trim()}”.</p>
            ) : (
              <ul className="divide-y divide-store-border">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link href={`/products/${p.slug}`} onClick={onClose} className="flex items-center gap-4 py-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold">
                      <span className="w-12 h-14 shrink-0 overflow-hidden bg-store-cream">
                        <ImageWithFallback src={p.images[0]?.url ?? ''} alt="" fallbackText="" className="w-full h-full object-cover" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-store-charcoal truncate group-hover:underline underline-offset-4">{p.title}</span>
                        <span className="block text-xs text-store-text-secondary truncate">{p.subtitle}</span>
                      </span>
                      <span className="text-sm text-store-charcoal tuw-tabular-nums">₹{p.priceINR.toLocaleString('en-IN')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/search?q=${encodeURIComponent(value.trim())}`}
              onClick={onClose}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-store-charcoal underline-offset-4 decoration-store-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
            >
              See all results for “{value.trim()}”
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Secondary links kept in the phone menu (the top bar now carries announcements).
const MOBILE_MENU_LINKS = [
  { label: 'Journal', href: '/journal' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

// Announcement bar: calm, factual service notes (no discounts or urgency).
const ANNOUNCEMENTS = [
  { text: 'Free delivery across India on orders over ₹3,000', href: '/policies/shipping' },
  { text: 'Every piece is printed for you after you order', href: '/about#how-it-works' },
  { text: '14-day returns on unworn clothing', href: '/policies/returns' },
];
const ANNOUNCEMENT_INTERVAL_MS = 4500;

// Rotates through ANNOUNCEMENTS; pauses on hover/focus and stays still for reduced motion.
function AnnouncementTicker() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length),
      ANNOUNCEMENT_INTERVAL_MS
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const current = ANNOUNCEMENTS[index];
  return (
    <div
      className="flex items-center justify-center min-w-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Link
        key={index}
        href={current.href}
        className="tuw-announce-in truncate text-white/90 hover:text-white underline-offset-4 hover:underline"
      >
        {current.text}
      </Link>
    </div>
  );
}

// Social icons matching Figma node 221:12607. `path` holds the inline
// 24x24 SVG path data so a single loop renders every brand mark.
const SOCIAL_LINKS = [
  {
    id: 'pinterest',
    label: 'Pinterest',
    href: site.social.pinterest,
    path: 'M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z',
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    href: site.social.x,
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: site.social.facebook,
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: site.social.instagram,
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
];

export default function Header() {
  const pathname = usePathname();
  const { cartCount, wishlist, setIsCartDrawerOpen, products, hiddenCategories } = useStore();
  // Categories staff switched off in the admin drop out of the menu.
  const navItems = React.useMemo(() => {
    if (!hiddenCategories.length) return NAV_ITEMS;
    const hidden = new Set<string>(hiddenCategories);
    return NAV_ITEMS.map((item) => ({
      ...item,
      columns: item.columns?.map((column) => ({ ...column, links: column.links.filter((link) => !link.filter?.category || !hidden.has(link.filter.category)) })),
    }));
  }, [hiddenCategories]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const openMenuNow = useCallback((label: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpenMenu(label);
  }, []);

  // Short delay lets the pointer travel from a nav label into its panel.
  const scheduleMenuClose = useCallback((delay = 120) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpenMenu(null), delay);
  }, []);

  const closeMenuNow = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpenMenu(null);
  }, []);

  useEffect(() => {
    closeMenuNow();
  }, [pathname, closeMenuNow]);

  useEffect(() => {
    if (!openMenu) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const trigger = document.querySelector<HTMLElement>(`[data-nav-top="${openMenu}"]`);
      closeMenuNow();
      trigger?.focus();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [openMenu, closeMenuNow]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 24;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchVal.trim())}`;
    }
  };

  return (
    <>
      {/* 1. Top bar: social icons · rotating announcement · currency */}
      <div className="w-full bg-header-topbar text-white header-topbar-height border-b border-white/10 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-xs font-sans">
          <div className="hidden md:flex items-center gap-3 text-white/80">
            {SOCIAL_LINKS.filter((social) => social.href).map((social) => (
              <a
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`The Unplugged Wear on ${social.label}`}
                className="inline-flex items-center justify-center w-6 h-6 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>

          <div className="col-span-3 md:col-span-1 md:col-start-2 min-w-0">
            <AnnouncementTicker />
          </div>

          {/* All prices are in Indian rupees; there is no currency conversion. */}
          <span className="hidden md:block justify-self-end font-medium text-white/90" aria-label="Prices in Indian rupees">
            ₹ INR
          </span>
        </div>
      </div>

      {/* 2. Main Navigation Bar (73px, store-canvas) — Node 221:12623 */}
      <header
        className={`sticky top-0 z-40 border-b border-store-border transition-all duration-300 ${
          isScrolled
            ? 'bg-store-canvas/95 backdrop-blur-md shadow-xs'
            : 'bg-store-canvas'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Three-column grid centres the wordmark with no positioned wrapper,
              so mega-menu panels anchor to the full-width <header>. */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center header-main-height">
            {/* Left: Mobile Hamburger & Desktop Navigation Links */}
            <div className="flex items-center justify-start min-w-0 h-full z-10">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open mobile menu"
                className="lg:hidden p-2 rounded-xl text-store-text-primary hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
              >
                <Menu size={22} />
              </button>

              <nav
                className="hidden lg:flex items-center gap-5 xl:gap-7 h-full"
                aria-label="Main Navigation"
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                  const tops = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-nav-top]'));
                  const current = tops.indexOf(document.activeElement as HTMLElement);
                  if (current === -1) return;
                  e.preventDefault();
                  const next = (current + (e.key === 'ArrowRight' ? 1 : -1) + tops.length) % tops.length;
                  tops[next].focus();
                }}
              >
                {navItems.map((item) => {
                  const isActive = pathname === item.href.split('?')[0] && item.href.split('?')[0] !== '/shop';
                  const hasPanel = Boolean(item.columns?.length);
                  const isOpen = hasPanel && openMenu === item.label;
                  const panelId = `mega-menu-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                  return (
                    <div
                      key={item.href}
                      className="h-full flex items-center"
                      onMouseEnter={() => hasPanel && openMenuNow(item.label)}
                      onMouseLeave={() => scheduleMenuClose()}
                      onFocus={() => hasPanel && openMenuNow(item.label)}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                          scheduleMenuClose(0);
                        }
                      }}
                    >
                      <Link
                        href={item.href}
                        data-nav-top={item.label}
                        aria-expanded={hasPanel ? isOpen : undefined}
                        aria-controls={hasPanel ? panelId : undefined}
                        onClick={closeMenuNow}
                        className={`inline-flex items-center min-h-6 text-sm font-medium tracking-wide transition-colors hover:text-black whitespace-nowrap border-b-2 pb-0.5 ${
                          isActive || isOpen
                            ? 'text-store-text-primary border-primary-dark'
                            : 'text-store-text-primary/80 border-transparent'
                        }`}
                      >
                        {item.label}
                      </Link>
                      {isOpen && (
                        <MegaPanel
                          id={panelId}
                          item={item}
                          products={products}
                          onNavigate={closeMenuNow}
                        />
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Center: Rolls-Royce Inspired Morphing Brand Wordmark & Emblem — True Viewport Centering */}
            <div className="flex items-center justify-center z-20">
              <div className="relative flex items-center justify-center h-12 w-48 sm:w-64 lg:w-80">
                {/* 1. Full Wordmark: "THE UNPLUGGED WEAR" (Visible at top) */}
                <Link
                  href="/"
                  aria-label="The Unplugged Wear - Homepage"
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                    isScrolled
                      ? 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                      : 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                  }`}
                >
                  <span className="font-heading font-medium text-xs sm:text-base lg:text-xl xl:text-2xl uppercase tracking-wider sm:tracking-widest text-store-text-primary hover:text-black transition-colors whitespace-nowrap">
                    The Unplugged Wear
                  </span>
                </Link>

                {/* 2. Signature Logo Emblem: TuwEmblem (Visible when scrolled) */}
                <Link
                  href="/"
                  aria-label="The Unplugged Wear - Homepage"
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                    isScrolled
                      ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                      : 'opacity-0 translate-y-2 scale-90 pointer-events-none'
                  }`}
                >
                  <TuwEmblem className="h-7 sm:h-8 lg:h-9 w-auto text-store-text-primary hover:text-black transition-transform duration-200 hover:scale-105" />
                </Link>
              </div>
            </div>

            {/* Right: 4 Action Icons matching Figma node 221:12633 */}
            <div className="flex items-center justify-end gap-1 sm:gap-2 z-10">
              {/* 1. Search */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                data-search-toggle
                aria-expanded={isSearchOpen}
                aria-label={isSearchOpen ? 'Close search' : 'Search products'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-store-text-primary hover:text-black hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
              >
                <Search size={20} />
              </button>

              {/* 2. Wishlist */}
              <Link
                href="/wishlist"
                aria-label={wishlist.length ? `Wishlist, ${wishlist.length} saved` : 'Wishlist'}
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-store-text-primary hover:text-black hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
              >
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-store-charcoal text-white text-2xs font-bold flex items-center justify-center pointer-events-none">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* 3. Account / User Profile — session streams; fallback is the signed-out icon */}
              <Suspense fallback={<AccountLinkView session={null} />}>
                <HeaderAccountLink />
              </Suspense>

              {/* 4. Cart */}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                aria-label="Open shopping cart"
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-store-text-primary hover:text-black hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-primary-dark text-white text-2xs font-bold flex items-center justify-center pointer-events-none">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search panel: instant product results as you type */}
        {isSearchOpen && (
          <SearchPanel
            products={products}
            value={searchVal}
            onChange={setSearchVal}
            onSubmit={handleSearchSubmit}
            onClose={closeSearch}
          />
        )}
      </header>

      {/* Slide-out Mobile Menu Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={navItems}
        links={MOBILE_MENU_LINKS}
        products={products}
        socialLinks={SOCIAL_LINKS.filter((social) => social.href)}
      />

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
