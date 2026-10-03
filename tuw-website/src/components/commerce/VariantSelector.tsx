'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Ruler, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { Product, ProductColor, ProductSize } from '@/lib/types';
import { useStore } from '@/mocks/store';
import Button from '../ui/Button';
import SizeGuideModal from './SizeGuideModal';

export interface VariantSelectorProps {
  product: Product;
}

export default function VariantSelector({ product }: VariantSelectorProps) {
  const router = useRouter();
  const { addToCart, isInWishlist, toggleWishlist } = useStore();

  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(
    product.sizes.find((s) => s.inStock) || null
  );
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isFavorite = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setValidationError('Please choose a size to continue.');
      return;
    }
    if (!selectedSize.inStock) {
      setValidationError('This size is currently sold out.');
      return;
    }

    setValidationError(null);
    const activeImage =
      product.images.find((img) => img.color === selectedColor.value)?.url ||
      product.images[0]?.url;

    addToCart({
      productId: product.id,
      title: product.title,
      color: selectedColor.name,
      size: selectedSize.size,
      priceINR: product.priceINR,
      quantity,
      image: activeImage,
    });
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setValidationError('Please choose a size to continue.');
      return;
    }
    handleAddToCart();
    router.push('/checkout');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Color Selection */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2.5">
          <span className="text-[#5A5A5A]">
            Dye / Shade: <strong className="text-[#1A1A1A] font-bold">{selectedColor.name}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {product.colors.map((color) => {
            const isSelected = selectedColor.value === color.value;
            return (
              <button
                key={color.value}
                type="button"
                onClick={() => setSelectedColor(color)}
                aria-label={`Select shade ${color.name}`}
                className={`relative w-8 h-8 rounded-full border transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-[#1A1A1A] ring-offset-2 scale-105'
                    : 'border-black/20 hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && (
                  <Check
                    size={13}
                    className={`absolute inset-0 m-auto ${
                      color.value === 'bone-white' || color.value === 'raw-sand' || color.value === 'raw-ecru'
                        ? 'text-black'
                        : 'text-white'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Size Selection & Sizing Guide Trigger */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2.5">
          <span className="text-[#5A5A5A]">
            Size:{' '}
            <strong className="text-[#1A1A1A] font-bold">
              {selectedSize ? selectedSize.size : 'Select a size'}
            </strong>
          </span>

          <button
            type="button"
            onClick={() => setIsSizeGuideOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#7539FF] hover:underline cursor-pointer lowercase first-letter:uppercase"
          >
            <Ruler size={13} />
            <span>Size Guide</span>
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {product.sizes.map((s) => {
            const isSelected = selectedSize?.size === s.size;
            return (
              <button
                key={s.size}
                type="button"
                disabled={!s.inStock}
                onClick={() => {
                  setSelectedSize(s);
                  setValidationError(null);
                }}
                className={`h-11 rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center justify-center cursor-pointer border ${
                  !s.inStock
                    ? 'opacity-35 cursor-not-allowed bg-[#FAF9F6] border-[#E2DDCF] line-through text-[#8A8A8A]'
                    : isSelected
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs'
                    : 'border-[#E2DDCF] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]'
                }`}
              >
                <span>{s.size}</span>
                {s.inStock && s.stockCount <= 3 && (
                  <span className="text-[9px] font-normal text-[#EF4444] leading-none -mt-0.5">
                    {s.stockCount} left
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Real-time stock availability message */}
        {selectedSize && (
          <div className="mt-2 text-xs flex items-center gap-1.5">
            {selectedSize.inStock ? (
              <span className="text-[#10B981] font-medium flex items-center gap-1">
                <Check size={13} />
                In stock for next-day dispatch • {selectedSize.stockCount} pieces allocated
              </span>
            ) : (
              <span className="text-[#EF4444] font-medium flex items-center gap-1">
                <AlertCircle size={13} />
                Out of stock in {selectedSize.size}
              </span>
            )}
          </div>
        )}

        {validationError && (
          <div className="mt-2 p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* 3. Quantity & Purchase Actions */}
      <div className="space-y-3 pt-2">
        <div className="flex gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-[#E2DDCF] rounded-full bg-white h-14 px-3 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center text-[#5A5A5A] hover:text-[#1A1A1A] font-bold text-base"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold text-[#1A1A1A]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setQuantity(
                  selectedSize ? Math.min(selectedSize.stockCount, quantity + 1) : quantity + 1
                )
              }
              aria-label="Increase quantity"
              className="w-8 h-8 flex items-center justify-center text-[#5A5A5A] hover:text-[#1A1A1A] font-bold text-base"
            >
              +
            </button>
          </div>

          {/* Add to Bag Button */}
          <Button
            variant="dark"
            size="lg"
            fullWidth
            onClick={handleAddToCart}
            icon={<ShoppingBag size={18} />}
          >
            Add to Bag • ₹{(product.priceINR * quantity).toLocaleString()}
          </Button>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            className="w-14 h-14 rounded-full border border-[#E2DDCF] bg-white flex items-center justify-center text-[#1A1A1A] hover:bg-[#F4F1EA] transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <Heart
              size={20}
              className={isFavorite ? 'fill-[#7539FF] text-[#7539FF]' : 'text-[#1A1A1A]'}
            />
          </button>
        </div>

        {/* Buy Now Instant Action */}
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleBuyNow}
        >
          Express Checkout
        </Button>
      </div>

      {/* Sustainable POD Guarantee Badge */}
      <div className="p-4 rounded-2xl bg-[#F4F1EA] border border-[#E2DDCF] space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-[#1A1A1A]">
          <ShieldCheck size={16} className="text-[#10B981]" />
          <span>The Unplugged Wear Guarantee</span>
        </div>
        <ul className="space-y-1 text-[#666] list-disc list-inside">
          <li>Pre-shrunk 100% GOTS certified organic cotton</li>
          <li>Complimentary domestic delivery on orders over ₹3,000</li>
          <li>14-day hassle-free doorstep returns and exchanges</li>
        </ul>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.category}
      />
    </div>
  );
}
