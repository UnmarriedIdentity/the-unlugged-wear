'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, ShieldCheck } from 'lucide-react';
import { Product, ProductColor, ProductSize } from '@/lib/types';
import { useStore } from '@/mocks/store';
import Button from '../ui/Button';
import SizeGuideModal from './SizeGuideModal';
import ColorSwatchSelector from './ColorSwatchSelector';
import VariantPillSelector from './VariantPillSelector';
import RadioOptionSelector from './RadioOptionSelector';

export interface VariantSelectorProps {
  product: Product;
  selectedColor?: ProductColor;
  onColorChange?: (color: ProductColor) => void;
  selectedSize?: ProductSize | null;
  onSizeChange?: (size: ProductSize | null) => void;
}

export default function VariantSelector({
  product,
  selectedColor: controlledColor,
  onColorChange,
  selectedSize: controlledSize,
  onSizeChange,
}: VariantSelectorProps) {
  const router = useRouter();
  const { addToCart, isInWishlist, toggleWishlist } = useStore();

  const isMug =
    product.slug.includes('mug') ||
    product.slug.includes('cup') ||
    (product.category === 'accessories' &&
      (product.sizes?.some((s) => s.size.includes('ml')) || false));
  const isKids =
    product.category === 'kids' ||
    product.slug.includes('kids') ||
    (product.sizes?.some((s) => s.size.includes('Y')) || false);

  const hasColors = Boolean(product.colors && product.colors.length > 0);
  const hasSizes = Boolean(product.sizes && product.sizes.length > 0);
  const hasRadioGroups = Boolean(product.radioGroups && product.radioGroups.length > 0);

  const [internalColor, setInternalColor] = useState<ProductColor | undefined>(
    hasColors ? product.colors![0] : undefined
  );
  const [internalSize, setInternalSize] = useState<ProductSize | null>(
    hasSizes ? product.sizes!.find((s) => s.inStock) || null : null
  );

  const selectedColor = controlledColor !== undefined ? controlledColor : internalColor;
  const selectedSize = controlledSize !== undefined ? controlledSize : internalSize;

  // Track active radio option selections per group
  const [selectedRadioValues, setSelectedRadioValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.radioGroups) {
      product.radioGroups.forEach((g) => {
        initial[g.groupKey] = g.defaultValue || g.options[0]?.id || '';
      });
    }
    return initial;
  });

  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isFavorite = isInWishlist(product.id);

  // Calculate cumulative price delta from selected radio options
  const radioDeltaINR = (product.radioGroups || []).reduce((acc, group) => {
    const selectedOptionId =
      selectedRadioValues[group.groupKey] || group.defaultValue || group.options[0]?.id;
    const option = group.options.find((o) => o.id === selectedOptionId);
    return acc + (option?.priceDeltaINR || 0);
  }, 0);

  const effectiveUnitPriceINR = product.priceINR + radioDeltaINR;

  const handleColorSelect = (color: ProductColor) => {
    if (onColorChange) {
      onColorChange(color);
    } else {
      setInternalColor(color);
    }
  };

  const handleSizeSelect = (size: ProductSize) => {
    setValidationError(null);
    if (onSizeChange) {
      onSizeChange(size);
    } else {
      setInternalSize(size);
    }
  };

  const handleRadioSelect = (groupKey: string, optionId: string) => {
    setSelectedRadioValues((prev) => ({
      ...prev,
      [groupKey]: optionId,
    }));
  };

  const handleAddToCart = () => {
    // Only enforce size validation if the product actually declares sizes
    if (hasSizes) {
      if (!selectedSize) {
        setValidationError(
          isMug ? 'Please choose a capacity to continue.' : 'Please choose a size to continue.'
        );
        return;
      }
      if (!selectedSize.inStock) {
        setValidationError(
          isMug ? 'This capacity is currently sold out.' : 'This size is currently sold out.'
        );
        return;
      }
    }

    setValidationError(null);
    const activeImage =
      (selectedColor && product.images.find((img) => img.color === selectedColor.value)?.url) ||
      product.images[0]?.url ||
      '';

    const chosenRadioOptions = (product.radioGroups || []).map((group) => {
      const optionId =
        selectedRadioValues[group.groupKey] || group.defaultValue || group.options[0]?.id;
      const option = group.options.find((o) => o.id === optionId);
      return {
        groupKey: group.groupKey,
        groupLabel: group.label,
        optionId: option?.id || '',
        optionLabel: option?.label || '',
        priceDeltaINR: option?.priceDeltaINR,
      };
    });

    addToCart({
      productId: product.id,
      title: product.title,
      color: selectedColor ? selectedColor.name : 'Standard',
      size: selectedSize ? selectedSize.size : 'One Size',
      priceINR: effectiveUnitPriceINR,
      quantity,
      image: activeImage,
      selectedRadioOptions: chosenRadioOptions.length > 0 ? chosenRadioOptions : undefined,
    });
  };

  const handleBuyNow = () => {
    if (hasSizes && !selectedSize) {
      setValidationError(
        isMug ? 'Please choose a capacity to continue.' : 'Please choose a size to continue.'
      );
      return;
    }
    handleAddToCart();
    router.push('/checkout');
  };

  const sizeLabel = isMug
    ? 'Capacity / Volume:'
    : isKids
    ? 'Age & Growth Size:'
    : 'Size:';

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Dynamic Color Swatch Selector (Omitted if no colors defined) */}
      {hasColors && (
        <ColorSwatchSelector
          colors={product.colors}
          selectedColor={selectedColor}
          onSelect={handleColorSelect}
          label={isMug ? 'Glaze Finish:' : 'Dye / Shade:'}
        />
      )}

      {/* 2. Dynamic Variant Pill Selector (Omitted if no sizes defined) */}
      {hasSizes && (
        <VariantPillSelector
          sizes={product.sizes}
          selectedSize={selectedSize}
          onSelect={handleSizeSelect}
          label={sizeLabel}
          onSizeGuideClick={!isMug ? () => setIsSizeGuideOpen(true) : undefined}
          sizeGuideLabel={isKids ? 'Kids Growth Guide' : 'Size Guide'}
          validationError={validationError}
        />
      )}

      {/* 3. Dynamic Radio Option Selectors (Omitted if no radioGroups defined) */}
      {hasRadioGroups && (
        <div className="space-y-4 pt-1">
          {product.radioGroups!.map((group) => (
            <RadioOptionSelector
              key={group.groupKey}
              group={group}
              selectedValue={selectedRadioValues[group.groupKey]}
              onSelect={(optId) => handleRadioSelect(group.groupKey, optId)}
            />
          ))}
        </div>
      )}

      {/* 4. Quantity & Purchase Actions */}
      <div className="space-y-3 pt-2">
        <div className="flex gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-store-card-border rounded-full bg-store-surface h-14 px-3 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center text-store-text-secondary hover:text-store-text-primary font-bold text-base cursor-pointer"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold text-store-text-primary">
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
              className="w-8 h-8 flex items-center justify-center text-store-text-secondary hover:text-store-text-primary font-bold text-base cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Add to Bag Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full h-14 px-6 rounded-full bg-store-charcoal text-white hover:bg-black transition-all flex items-center justify-between font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer active:scale-98"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>Add to Bag</span>
            </span>
            <span className="font-mono text-sm tracking-normal">
              ₹{(effectiveUnitPriceINR * quantity).toLocaleString()}
            </span>
          </button>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            className="w-14 h-14 rounded-full border border-store-card-border bg-store-surface flex items-center justify-center text-store-charcoal hover:bg-store-cream transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <Heart
              size={20}
              className={isFavorite ? 'fill-store-gold text-store-gold' : 'text-store-charcoal'}
            />
          </button>
        </div>

        {/* Express Checkout */}
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleBuyNow}
        >
          Express Checkout
        </Button>
      </div>

      {/* Guarantee Badge */}
      <div className="p-4 rounded-2xl bg-store-cream border border-store-card-border space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-store-text-primary">
          <ShieldCheck size={16} className="text-emerald-700" />
          <span>The Unplugged Wear Guarantee</span>
        </div>
        <ul className="space-y-1 text-store-text-secondary list-disc list-inside">
          {isMug ? (
            <>
              <li>High-fire 1,240°C durable stoneware ceramic</li>
              <li>100% Dishwasher safe, microwave safe, food-grade glaze</li>
              <li>Shatterproof recyclable protective transit packaging</li>
            </>
          ) : isKids ? (
            <>
              <li>100% GOTS certified organic long-staple combed cotton</li>
              <li>Skin-safe non-toxic inks & itch-free flatlock seams</li>
              <li>14-day hassle-free doorstep size exchanges across India</li>
            </>
          ) : (
            <>
              <li>Pre-shrunk 100% GOTS certified organic cotton</li>
              <li>Complimentary domestic delivery on orders over ₹3,000</li>
              <li>14-day hassle-free doorstep returns and exchanges</li>
            </>
          )}
        </ul>
      </div>

      {/* Size Guide Modal (only if sizes exist and not mug) */}
      {hasSizes && !isMug && (
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          category={product.category}
        />
      )}
    </div>
  );
}
