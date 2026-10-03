'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Plus } from 'lucide-react';
import { Product } from '@/lib/types';
import { useStore } from '@/mocks/store';
import Badge from '../ui/Badge';
import ImageWithFallback from '../ui/ImageWithFallback';

export interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const { isInWishlist, toggleWishlist, addToCart } = useStore();
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.value || '');
  const [isHovered, setIsHovered] = useState(false);
  const [quickAddSize, setQuickAddSize] = useState<string | null>(null);

  const activeImage =
    product.images.find((img) => img.color === selectedColor)?.url ||
    (isHovered && product.images[1] ? product.images[1].url : product.images[0]?.url);

  const isFavorite = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    const colorObj = product.colors.find((c) => c.value === selectedColor) || product.colors[0];
    addToCart({
      productId: product.id,
      title: product.title,
      color: colorObj ? colorObj.name : 'Standard',
      size,
      priceINR: product.priceINR,
      quantity: 1,
      image: activeImage,
    });
    setQuickAddSize(size);
    setTimeout(() => setQuickAddSize(null), 1500);
  };

  return (
    <div
      className={`group relative flex flex-col ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#F4F1EA] border border-[#E2DDCF] transition-all duration-300 group-hover:shadow-md">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <ImageWithFallback
            src={activeImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
          {product.isNew && <Badge variant="dark">New</Badge>}
          {product.videoUrl && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#1A1A1A]/85 text-white backdrop-blur-xs">
              ▶ Reel
            </span>
          )}
          {product.isBestseller && <Badge variant="neutral">Bestseller</Badge>}
          {product.sustainabilityBadge && (
            <Badge variant="outline" className="bg-white/80 backdrop-blur-xs">
              {product.sustainabilityBadge}
            </Badge>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          aria-label={isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs border border-[#E2DDCF] flex items-center justify-center text-[#1A1A1A] hover:bg-white transition-transform active:scale-90 z-10 shadow-xs"
        >
          <Heart
            size={16}
            className={isFavorite ? 'fill-[#7539FF] text-[#7539FF]' : 'text-[#1A1A1A]'}
          />
        </button>

        {/* Quick Add Overlay on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 hidden sm:block">
          <div className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2DDCF] shadow-lg">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] text-center mb-1.5">
              Quick Add Size
            </div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {product.sizes.map((s) => (
                <button
                  key={s.size}
                  disabled={!s.inStock}
                  onClick={(e) => handleQuickAdd(e, s.size)}
                  className={`h-7 px-2 text-xs font-semibold rounded-md transition-all ${
                    !s.inStock
                      ? 'opacity-30 cursor-not-allowed bg-transparent line-through text-[#8A8A8A]'
                      : quickAddSize === s.size
                      ? 'bg-[#10B981] text-white'
                      : 'bg-[#F4F1EA] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
                  }`}
                >
                  {quickAddSize === s.size ? '✓' : s.size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Metadata */}
      <div className="mt-3.5 space-y-1.5">
        {/* Color Swatches */}
        {product.colors.length > 1 && (
          <div className="flex items-center gap-1.5 pb-1">
            {product.colors.map((color) => (
              <button
                key={color.value}
                type="button"
                aria-label={`Select ${color.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColor(color.value);
                }}
                className={`w-4 h-4 rounded-full border transition-all ${
                  selectedColor === color.value
                    ? 'ring-2 ring-offset-1 ring-[#1A1A1A] scale-110'
                    : 'border-black/20 hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        )}

        {/* Title & Subtitle */}
        <Link href={`/products/${product.slug}`} className="block group-hover:underline">
          <h3 className="text-sm font-semibold tracking-wide text-[#1A1A1A] leading-snug">
            {product.title}
          </h3>
        </Link>
        <p className="text-xs text-[#8A8A8A] leading-none">{product.subtitle}</p>

        {/* Price */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-sm font-bold text-[#1A1A1A]">
            ₹{product.priceINR.toLocaleString()}
          </span>
          {product.compareAtPriceINR && (
            <span className="text-xs text-[#8A8A8A] line-through">
              ₹{product.compareAtPriceINR.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
