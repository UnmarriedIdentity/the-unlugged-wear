'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home as HomeIcon,
  ClipboardList,
  Package,
  Users,
  TrendingUp,
  Settings,
  Headphones,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  PackageCheck,
  Truck,
  Undo2,
  RotateCcw,
  CreditCard,
  Layers,
  Palette,
  FileText,
  ShieldCheck,
  Eye,
  Volume2,
  VolumeX,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileMenuOpen?: boolean;
}

const ATELIER_DROP_LOOKBOOK = [
  {
    id: 1,
    title: 'The Heavyweight Boxy Tee',
    batch: 'Drop 04 · Limited 500 Pcs',
    image: '/products/1.jpeg',
    gsm: '280 GSM Organic Cotton',
    color: 'Raw Umber & Obsidian',
    story: 'Cut from ultra-dense combed organic cotton jersey. Built for timeless drape and quiet comfort.',
  },
  {
    id: 2,
    title: 'Tailored Indigo Overshirt',
    batch: 'Drop 04 · Limited 350 Pcs',
    image: '/products/3.jpeg',
    gsm: '320 GSM Pure Linen-Twill',
    color: 'Deep Botanical Indigo',
    story: 'Woven with natural slub fibers. Features mother-of-pearl buttons and signature back yoke tucks.',
  },
  {
    id: 3,
    title: 'Slow Living Atelier Studio',
    batch: 'Atelier Archive · 2026',
    image: '/products/2.jpeg',
    gsm: 'Handcrafted Heritage',
    color: 'Indiranagar Atelier, Bangalore',
    story: 'Mindful design in limited runs. Every piece is cut, assembled, and finished by master artisans.',
  },
];

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  mobileMenuOpen = false,
}: SidebarProps) {
  const pathname = usePathname();

  // Editorial Lookbook modal state
  const [lookbookOpen, setLookbookOpen] = useState(false);
  const [activeLookbookIndex, setActiveLookbookIndex] = useState(0);

  // Atelier Soundscape audio toggle state
  const [isAmbiancePlaying, setIsAmbiancePlaying] = useState(true);

  // Collapsible state for each section (all expanded by default)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    core: true,
    operations: true,
    merchandise: true,
    system: true,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getIsActive = (path: string) => {
    if (path === '/' || path === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={cn('sidebar', isCollapsed && 'sidebarCollapsed', mobileMenuOpen && 'sidebarMobileOpen')}
    >
      {/* Brand Header */}
      <div className="sidebarHeader">
        <Link href="/" className="brandLink">
          <div className="logoIconWrapper">
            <Image
              src="/logos/tuw-stag-white.png"
              alt="The Unplugged Wear"
              width={22}
              height={22}
              style={{ objectFit: 'contain', width: 'auto', height: '22px' }}
              priority
            />
          </div>
          {!isCollapsed && <span className="brandName">TUW Admin</span>}
        </Link>

        <button
          type="button"
          className="sidebarToggleBtn"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="navSections">
        {/* CORE Section */}
        <div className="navGroup">
          {!isCollapsed && (
            <button
              type="button"
              className="groupHeaderBtn"
              onClick={() => toggleGroup('core')}
            >
              <span className="groupLabel">CORE</span>
              <ChevronDown
                size={13}
                className={cn('groupChevron', openGroups.core && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? openGroups.core : true) && (
            <div className={cn(!isCollapsed && 'navBranchTree')}>
              {/* Dashboard */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/dashboard"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/dashboard') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Dashboard' : undefined}
                >
                  <span className="navIcon">
                    <HomeIcon size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Dashboard</span>}
                </Link>
              </div>

              {/* Orders */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/orders"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/orders') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Orders' : undefined}
                >
                  <span className="navIcon">
                    <ClipboardList size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Orders</span>}
                </Link>
              </div>

              {/* Products */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/products"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/products') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Products' : undefined}
                >
                  <span className="navIcon">
                    <Package size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Products</span>}
                </Link>
              </div>

              {/* Customers */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/customers"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/customers') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Customers' : undefined}
                >
                  <span className="navIcon">
                    <Users size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Customers</span>}
                </Link>
              </div>

              {/* Analytics & Reports */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/reports"
                  className={cn(
                    'navBranchLink',
                    (getIsActive('/reports') || getIsActive('/analytics')) && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Analytics & Reports' : undefined}
                >
                  <span className="navIcon">
                    <TrendingUp size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Analytics & Reports</span>}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* OPERATIONS Section */}
        <div className="navGroup">
          {!isCollapsed && (
            <button
              type="button"
              className="groupHeaderBtn"
              onClick={() => toggleGroup('operations')}
            >
              <span className="groupLabel">OPERATIONS</span>
              <ChevronDown
                size={13}
                className={cn('groupChevron', openGroups.operations && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? openGroups.operations : true) && (
            <div className={cn(!isCollapsed && 'navBranchTree')}>
              {/* Fulfillment */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/fulfillment"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/fulfillment') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Fulfillment' : undefined}
                >
                  <span className="navIcon">
                    <PackageCheck size={17} />
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="navBranchLabel">Fulfillment</span>
                      <span className="navBadge navBadgePurple">4</span>
                    </>
                  )}
                </Link>
              </div>

              {/* Shipments */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/shipments"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/shipments') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Shipments' : undefined}
                >
                  <span className="navIcon">
                    <Truck size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Shipments</span>}
                </Link>
              </div>

              {/* Returns & RMA */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/returns"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/returns') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Returns & RMA' : undefined}
                >
                  <span className="navIcon">
                    <Undo2 size={17} />
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="navBranchLabel">Returns & RMA</span>
                      <span className="navBadge navBadgeAmber">2</span>
                    </>
                  )}
                </Link>
              </div>

              {/* Refunds */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/refunds"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/refunds') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Refunds' : undefined}
                >
                  <span className="navIcon">
                    <RotateCcw size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Refunds</span>}
                </Link>
              </div>

              {/* Payments */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/payments"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/payments') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Payments' : undefined}
                >
                  <span className="navIcon">
                    <CreditCard size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Payments</span>}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* MERCHANDISE Section */}
        <div className="navGroup">
          {!isCollapsed && (
            <button
              type="button"
              className="groupHeaderBtn"
              onClick={() => toggleGroup('merchandise')}
            >
              <span className="groupLabel">MERCHANDISE</span>
              <ChevronDown
                size={13}
                className={cn('groupChevron', openGroups.merchandise && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? openGroups.merchandise : true) && (
            <div className={cn(!isCollapsed && 'navBranchTree')}>
              {/* Collections */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/collections"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/collections') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Collections' : undefined}
                >
                  <span className="navIcon">
                    <Layers size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Collections</span>}
                </Link>
              </div>

              {/* Design Assets */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/designs"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/designs') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Design Assets' : undefined}
                >
                  <span className="navIcon">
                    <Palette size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Design Assets</span>}
                </Link>
              </div>

              {/* Content CMS */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/content"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/content') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Content CMS' : undefined}
                >
                  <span className="navIcon">
                    <FileText size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Content CMS</span>}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* SYSTEM Section */}
        <div className="navGroup">
          {!isCollapsed && (
            <button
              type="button"
              className="groupHeaderBtn"
              onClick={() => toggleGroup('system')}
            >
              <span className="groupLabel">SYSTEM</span>
              <ChevronDown
                size={13}
                className={cn('groupChevron', openGroups.system && 'groupChevronOpen')}
              />
            </button>
          )}

          {(!isCollapsed ? openGroups.system : true) && (
            <div className={cn(!isCollapsed && 'navBranchTree')}>
              {/* Team */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/team"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/team') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Team' : undefined}
                >
                  <span className="navIcon">
                    <Users size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Team</span>}
                </Link>
              </div>

              {/* Audit Log */}
              <div className={cn(!isCollapsed && 'navBranchItem')}>
                <Link
                  href="/audit-log"
                  className={cn(
                    'navBranchLink',
                    getIsActive('/audit-log') && 'navBranchLinkActive',
                    isCollapsed && 'navItemCollapsed'
                  )}
                  title={isCollapsed ? 'Audit Log' : undefined}
                >
                  <span className="navIcon">
                    <ShieldCheck size={17} />
                  </span>
                  {!isCollapsed && <span className="navBranchLabel">Audit Log</span>}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="sidebarFooter">
        <ul className="navList">
          <li>
            <Link
              href="/settings"
              className={cn('navItem', getIsActive('/settings') && 'navItemActive')}
              title={isCollapsed ? 'Settings' : undefined}
            >
              <span className="navIcon">
                <Settings size={18} />
              </span>
              {!isCollapsed && <span className="navLabel">Settings</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/support"
              className={cn('navItem', (getIsActive('/support') || getIsActive('/help')) && 'navItemActive')}
              title={isCollapsed ? 'Help & Support' : undefined}
            >
              <span className="navIcon">
                <Headphones size={18} />
              </span>
              {!isCollapsed && <span className="navLabel">Help & Support</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/login"
              className="navItem logOutItem"
              title={isCollapsed ? 'Log out' : undefined}
            >
              <span className="navIcon">
                <LogOut size={18} />
              </span>
              {!isCollapsed && <span className="navLabel">Log out</span>}
            </Link>
          </li>
        </ul>

        {/* ================================================================
            CREATIVE THING 1: ATELIER EDITORIAL DROP LOOKBOOK CARD
            ================================================================ */}
        {!isCollapsed ? (
          <div className="atelierLookbookCard">
            <div
              className="lookbookImageWrap"
              onClick={() => setLookbookOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setLookbookOpen(true)}
              title="Click to view full Atelier Lookbook"
            >
              <Image
                src="/products/1.jpeg"
                alt="Atelier Drop 04"
                width={220}
                height={125}
                className="lookbookImg"
                priority
              />
              <div className="lookbookImageOverlay">
                <span className="lookbookDropBadge">✦ DROP 04</span>
                <span className="lookbookQuickViewBtn">
                  <Eye size={12} />
                  <span>Lookbook</span>
                </span>
              </div>
            </div>

            <div className="lookbookMeta">
              <div className="lookbookTitleRow">
                <span className="lookbookTitle">Heavyweight Boxy Tee</span>
                <span className="lookbookGsmTag">280 GSM</span>
              </div>
              <p className="lookbookSubtitle">Raw Umber · Limited 500 Pcs</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="lookbookCollapsedBtn"
            onClick={() => setLookbookOpen(true)}
            title="Open Atelier Drop 04 Lookbook"
          >
            <Image
              src="/products/1.jpeg"
              alt="Lookbook"
              width={40}
              height={40}
              className="lookbookCollapsedImg"
            />
            <span className="lookbookSparkleDot">✦</span>
          </button>
        )}

        {/* ================================================================
            CREATIVE THING 2: ATELIER SOUNDSCAPE & PROVENANCE SEAL
            ================================================================ */}
        {!isCollapsed ? (
          <div className="atelierSoundscapeCard">
            <div className="soundscapeHeader">
              <div className="soundscapeLeft">
                <button
                  type="button"
                  onClick={() => setIsAmbiancePlaying(!isAmbiancePlaying)}
                  className={cn(
                    'soundscapePlayBtn',
                    isAmbiancePlaying && 'soundscapePlayBtnActive'
                  )}
                  aria-label={isAmbiancePlaying ? 'Mute Atelier Ambience' : 'Play Atelier Ambience'}
                  title={isAmbiancePlaying ? 'Mute Atelier Ambience' : 'Play Atelier Ambience'}
                >
                  {isAmbiancePlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>
                <div className="soundscapeInfo">
                  <span className="soundscapeTitle">Atelier Soundscape</span>
                  <span className="soundscapeSubtitle">
                    {isAmbiancePlaying ? 'Vinyl & Rain · 432Hz' : 'Ambience Paused'}
                  </span>
                </div>
              </div>

              {/* Animated Equalizer Wave Bars */}
              <div
                className={cn('soundEqualizer', !isAmbiancePlaying && 'soundEqualizerPaused')}
                title={isAmbiancePlaying ? 'Resonating soundscape' : 'Paused'}
              >
                <span className="soundBar soundBar1" />
                <span className="soundBar soundBar2" />
                <span className="soundBar soundBar3" />
                <span className="soundBar soundBar4" />
              </div>
            </div>

            {/* Provenance Coordinates Seal */}
            <div className="atelierProvenanceRow">
              <span className="provenanceCoordinates">12°58&apos;N 77°38&apos;E · INDIRANAGAR</span>
              <span className="provenanceMotto">&ldquo;Less noise, more presence&rdquo;</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAmbiancePlaying(!isAmbiancePlaying)}
            className="soundscapeCollapsedBtn"
            title={isAmbiancePlaying ? 'Atelier Soundscape Playing' : 'Atelier Soundscape Paused'}
          >
            {isAmbiancePlaying ? (
              <div className="soundEqualizerMini">
                <span className="soundBarMini soundBar1" />
                <span className="soundBarMini soundBar2" />
                <span className="soundBarMini soundBar3" />
              </div>
            ) : (
              <VolumeX size={15} />
            )}
          </button>
        )}
      </div>

      {/* ================================================================
          ATELIER LOOKBOOK LIGHTBOX MODAL
          ================================================================ */}
      {lookbookOpen && (
        <div
          className="lookbookModalBackdrop"
          onClick={() => setLookbookOpen(false)}
        >
          <div
            className="lookbookModalContent"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="lookbookModalHeader">
              <div className="lookbookModalBrand">
                <span className="lookbookModalStag">✦</span>
                <div>
                  <h3 className="lookbookModalHeading">The Unplugged Wear — Atelier Drop 04</h3>
                  <span className="lookbookModalSub">Slow Living Lookbook &amp; Material Provenance</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLookbookOpen(false)}
                className="lookbookCloseBtn"
                aria-label="Close lookbook"
              >
                <X size={18} />
              </button>
            </div>

            <div className="lookbookModalBody">
              {/* Large Image Showcase */}
              <div className="lookbookMainImgWrap">
                <Image
                  src={ATELIER_DROP_LOOKBOOK[activeLookbookIndex].image}
                  alt={ATELIER_DROP_LOOKBOOK[activeLookbookIndex].title}
                  width={640}
                  height={460}
                  className="lookbookMainImg"
                  priority
                />
                <div className="lookbookNavOverlay">
                  <button
                    type="button"
                    className="lookbookNavBtn lookbookNavPrev"
                    onClick={() =>
                      setActiveLookbookIndex((prev) =>
                        prev === 0 ? ATELIER_DROP_LOOKBOOK.length - 1 : prev - 1
                      )
                    }
                    aria-label="Previous look"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="lookbookNavBtn lookbookNavNext"
                    onClick={() =>
                      setActiveLookbookIndex((prev) =>
                        prev === ATELIER_DROP_LOOKBOOK.length - 1 ? 0 : prev + 1
                      )
                    }
                    aria-label="Next look"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Garment Details & Provenance */}
              <div className="lookbookDetailsPane">
                <div className="lookbookBatchPill">
                  <span>{ATELIER_DROP_LOOKBOOK[activeLookbookIndex].batch}</span>
                </div>
                <h2 className="lookbookGarmentTitle">
                  {ATELIER_DROP_LOOKBOOK[activeLookbookIndex].title}
                </h2>
                <p className="lookbookStory">
                  {ATELIER_DROP_LOOKBOOK[activeLookbookIndex].story}
                </p>

                <div className="lookbookSpecGrid">
                  <div className="lookbookSpecItem">
                    <span className="specLabel">Weight &amp; Weave</span>
                    <span className="specValue">{ATELIER_DROP_LOOKBOOK[activeLookbookIndex].gsm}</span>
                  </div>
                  <div className="lookbookSpecItem">
                    <span className="specLabel">Palette</span>
                    <span className="specValue">{ATELIER_DROP_LOOKBOOK[activeLookbookIndex].color}</span>
                  </div>
                  <div className="lookbookSpecItem">
                    <span className="specLabel">Provenance</span>
                    <span className="specValue">Indiranagar Atelier, IN</span>
                  </div>
                  <div className="lookbookSpecItem">
                    <span className="specLabel">Certification</span>
                    <span className="specValue">100% GOTS Organic</span>
                  </div>
                </div>

                {/* Thumbnail Gallery Row */}
                <div className="lookbookThumbRow">
                  {ATELIER_DROP_LOOKBOOK.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        'lookbookThumbBtn',
                        activeLookbookIndex === idx && 'lookbookThumbBtnActive'
                      )}
                      onClick={() => setActiveLookbookIndex(idx)}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={60}
                        height={60}
                        className="lookbookThumbImg"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
