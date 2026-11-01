'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Product } from '@storefront/lib/types';
import { useStore } from '@storefront/mocks/store';
import ImageWithFallback from '@storefront/components/ui/ImageWithFallback';

export interface ProductCardProps {
  product: Product;
  className?: string;
  collectionName?: string;
}

// Swatches shown on hover; the rest are summarised as "+N" so the colour
// name always fits beside them, even in the narrow 4-column shop grid.
const MAX_CARD_SWATCHES = 5;

// The collection each category is sold under (matches /collections).
const COLLECTION_BY_CATEGORY: Record<Product['category'], string> = {
  hoodies: 'Hoodies & Sweats',
  tees: 'Everyday Tees',
  pants: 'Joggers & Sweatpants',
  jackets: 'Outerwear',
  kids: 'Kids',
  accessories: 'Objects',
  mugs: 'Objects',
  capsules: 'Capsules',
};

export default function ProductCard({
  product,
  className = '',
  collectionName,
}: ProductCardProps) {
  const { isInWishlist, toggleWishlist, addToCart } = useStore();

  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors[0]?.value || ''
  );
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [quickAddFeedback, setQuickAddFeedback] = useState<string | null>(null);

  const activeColorValue = hoveredColor || selectedColor;
  const activeColorObj =
    product.colors.find((c) => c.value === activeColorValue) ||
    product.colors[0];

  // Resolve active image based on color matching or carousel index
  const activeColorImage = product.images.find(
    (img) => img.color === activeColorValue
  );
  const activeImage =
    activeColorImage?.url ||
    product.images[activeImageIndex]?.url ||
    product.images[0]?.url ||
    '';

  const isFavorite = isInWishlist(product.id);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.images.length <= 1) return;
    setActiveImageIndex(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.images.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const handleQuickAdd = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    const colorName = activeColorObj ? activeColorObj.name : 'Standard';

    addToCart({
      productId: product.id,
      title: product.title,
      color: colorName,
      size,
      priceINR: product.priceINR,
      priceMinorINR: product.priceMinorINR,
      quantity: 1,
      image: activeImage,
    });

    setQuickAddFeedback(size);
    setTimeout(() => setQuickAddFeedback(null), 1500);
  };

  // Derive collection eyebrow label (e.g. "Acid Wash Collection")
  const collectionLabel =
    collectionName ||
    (product.title.startsWith('Acid Wash')
      ? 'Acid Wash Collection'
      : COLLECTION_BY_CATEGORY[product.category] || 'Atelier Collection');

  return (
    <article
      className={`@container group relative flex flex-col w-full bg-store-canvas border border-store-card-border overflow-hidden transition-all duration-500 ease-out hover:shadow-lg hover:shadow-black/5 hover:border-store-card-border ${
        isHovered ? 'tuw-card-is-hovered' : ''
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredColor(null);
      }}
    >
      {/* ======================================================== */}
      {/* 1. TOP WISHLIST HEART ICON (Direct subtle placement)     */}
      {/* ======================================================== */}
      <button
        type="button"
        aria-label={isFavorite ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
        aria-pressed={isFavorite}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-store-charcoal hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
      >
        <Heart
          size={18}
          strokeWidth={1.5}
          aria-hidden="true"
          className={
            isFavorite
              ? 'fill-store-terracotta text-store-terracotta'
              : 'text-store-charcoal'
          }
        />
      </button>

      {/* ======================================================== */}
      {/* 2. PRODUCT IMAGE FRAME (3:4 Aspect with Centered Graphic) */}
      {/* ======================================================== */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-store-cream/30 flex items-center justify-center">
        <Link
          href={`/products/${product.slug}`}
          className="block w-full h-full"
        >
          <ImageWithFallback
            src={activeImage}
            alt={product.title}
            fallbackText="Photo coming soon"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Carousel Previous Arrow (Smooth Glide Reveal on Hover) */}
        {product.images.length > 1 && (
          <button
            type="button"
            aria-label="Previous image"
            onClick={handlePrevImage}
            className="absolute left-2.5 top-1/2 z-20 w-7 h-7 rounded-full bg-white/95 backdrop-blur-xs border border-store-card-border/80 flex items-center justify-center text-store-charcoal shadow-xs hover:bg-white hover:scale-105 active:scale-95 cursor-pointer tuw-nav-arrow-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
        )}

        {/* Carousel Next Arrow (Smooth Glide Reveal on Hover) */}
        {product.images.length > 1 && (
          <button
            type="button"
            aria-label="Next image"
            onClick={handleNextImage}
            className="absolute right-2.5 top-1/2 z-20 w-7 h-7 rounded-full bg-white/95 backdrop-blur-xs border border-store-card-border/80 flex items-center justify-center text-store-charcoal shadow-xs hover:bg-white hover:scale-105 active:scale-95 cursor-pointer tuw-nav-arrow-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
          >
            <ChevronRight size={15} strokeWidth={2} />
          </button>
        )}

        {/* Carousel Dash Indicators (Smooth Upward Glide Reveal on Hover) */}
        {product.images.length > 1 && (
          <div className="absolute bottom-14 left-1/2 z-20 flex items-center gap-1.5 pointer-events-none tuw-dashes-reveal">
            {product.images.slice(0, 4).map((_, idx) => (
              <span
                key={idx}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  idx === activeImageIndex
                    ? 'w-7 bg-store-charcoal'
                    : 'w-4 bg-store-card-border'
                }`}
              />
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. QUICK SIZE BAR (overlays the image foot so the card height */}
        {/*    never changes and sibling cards in the row stay put)      */}
        {/* ======================================================== */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 bg-white/95 backdrop-blur-xs border-t border-store-card-border/60 tuw-card-expand ${
            isHovered ? 'tuw-card-expanded' : ''
          }`}
        >
          <div className="tuw-card-expand-inner">
            <div className="px-3 py-2 flex items-center justify-between gap-1 tuw-size-enter">
              {product.sizes && product.sizes.length > 0 ? (
                product.sizes.map((s, idx) => (
                  <span
                    key={s.size}
                    className={`flex-1 flex tuw-droplet-size tuw-droplet-delay-${idx % 8}`}
                  >
                    <button
                      type="button"
                      disabled={!s.inStock}
                      onClick={(e) => handleQuickAdd(e, s.size)}
                      className={`w-full py-1 text-xs font-semibold tracking-wider uppercase transition-colors text-center cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold ${
                        !s.inStock
                          ? 'opacity-30 line-through cursor-not-allowed text-store-muted'
                          : quickAddFeedback === s.size
                          ? 'bg-store-charcoal text-white font-bold'
                          : 'text-store-charcoal hover:bg-store-cream hover:text-black hover:font-bold'
                      }`}
                      title={
                        !s.inStock
                          ? `${s.size} (Sold Out)`
                          : `Quick add size ${s.size} to bag`
                      }
                    >
                      {quickAddFeedback === s.size ? '✓' : s.size}
                    </button>
                  </span>
                ))
              ) : (
                <span className="w-full flex tuw-droplet-size tuw-droplet-delay-0">
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, 'One Size')}
                    className="w-full py-1 text-xs font-semibold uppercase tracking-wider text-store-charcoal hover:text-black transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
                  >
                    <Plus size={13} />
                    {quickAddFeedback === 'One Size' ? 'Added to Bag' : 'Quick Add to Bag'}
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. PRODUCT METADATA CONTAINER */}
      {/* Line 1: Silky Cross-Fade: Eyebrow <-> Swatches + Color */}
      {/* Line 2: Product Title */}
      {/* Line 3: Price */}
      {/* ======================================================== */}
      <div className="p-4 space-y-1.5">
        {/* Line 1: State-driven silky cross-fade (Zero text overlap or sudden pop) */}
        <div className="relative min-h-7 py-0.5 overflow-hidden flex items-center">
          {/* Eyebrow Collection Label (Normal resting state) */}
          <div
            className={`absolute inset-0 flex items-center tuw-crossfade-idle ${
              isHovered
                ? 'opacity-0 -translate-y-2 pointer-events-none'
                : 'opacity-100 translate-y-0 pointer-events-auto'
            }`}
          >
            <span className="text-xs uppercase tracking-wider text-store-muted font-normal truncate">
              {collectionLabel}
            </span>
          </div>

          {/* Color Swatches and Active Color Name (Hover revealed state) */}
          <div
            className={`flex items-center justify-between w-full tuw-crossfade-hover ${
              isHovered
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-1 min-w-0" role="group" aria-label={`${product.title} colours`}>
              {product.colors.slice(0, MAX_CARD_SWATCHES).map((color, colorIdx) => {
                const isSelected = activeColorValue === color.value;
                return (
                  <span
                    key={color.value}
                    className={`inline-flex items-center justify-center w-5 h-5 shrink-0 tuw-droplet-swatch tuw-swatch-delay-${colorIdx % 8}`}
                  >
                    <button
                      type="button"
                      aria-label={`Select ${color.name}`}
                      onMouseEnter={() => setHoveredColor(color.value)}
                      onMouseLeave={() => setHoveredColor(null)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedColor(color.value);
                        const matchIdx = product.images.findIndex(
                          (img) => img.color === color.value
                        );
                        if (matchIdx !== -1) setActiveImageIndex(matchIdx);
                      }}
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold ${
                        isSelected
                          ? 'ring-1 ring-offset-2 ring-store-charcoal'
                          : 'border-store-card-border hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  </span>
                );
              })}
              {product.colors.length > MAX_CARD_SWATCHES && (
                <Link
                  href={`/products/${product.slug}`}
                  aria-label={`See all ${product.colors.length} colours of ${product.title}`}
                  className="shrink-0 pl-0.5 text-xs text-store-muted hover:text-store-charcoal tuw-tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
                >
                  +{product.colors.length - MAX_CARD_SWATCHES}
                </Link>
              )}
            </div>
            <span className="shrink-0 whitespace-nowrap text-xs text-store-muted font-medium capitalize pl-2 tuw-droplet-color-label">
              {activeColorObj?.name || 'Standard'}
            </span>
          </div>
        </div>

        {/* Line 2: Title */}
        <Link href={`/products/${product.slug}`} className="block group/title">
          <h3 className="text-lg @[22rem]:text-xl font-medium text-primary-dark leading-snug">
            {product.title}
          </h3>
        </Link>

        {/* Line 3: Price */}
        <div className="flex items-center gap-2 pt-0.5">
          <p className="text-base text-store-text-secondary tuw-tabular-nums">
            ₹{product.priceINR.toLocaleString()}
          </p>
          {product.compareAtPriceINR && (
            <span className="text-xs text-store-muted line-through tuw-tabular-nums">
              ₹{product.compareAtPriceINR.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
