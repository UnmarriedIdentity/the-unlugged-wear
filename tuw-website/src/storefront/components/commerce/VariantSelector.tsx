'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Truck } from 'lucide-react';
import { Product, ProductColor, ProductSize } from '@storefront/lib/types';
import { useStore } from '@storefront/mocks/store';
import Button from '@storefront/components/ui/Button';
import { formatRupees } from '@storefront/lib/format';
import SizeGuideModal from './SizeGuideModal';
import ColorSwatchSelector from './ColorSwatchSelector';
import VariantPillSelector from './VariantPillSelector';
import RadioOptionSelector from './RadioOptionSelector';
import NotifyMe from './NotifyMe';
import { useSiteSettings, rupeesLabel } from '@storefront/lib/site-settings';
import { useLiveSizes } from '@storefront/lib/live-stock';
import {
  sizePriceINR,
  RETURN_WINDOW_DAYS,
  isWearable,
  productTypeOf,
  variantLabelOf,
} from '@storefront/lib/product';

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
  const { freeThresholdPaise } = useSiteSettings().shipping;
  const router = useRouter();
  const { addToCart, isInWishlist, toggleWishlist, sizeCharts } = useStore();

  const productType = productTypeOf(product);
  const variantLabel = variantLabelOf(product);
  // The chart staff linked to this product, if any.
  const sizeChart = sizeCharts.find((c) => c.id === product.sizeChartId) ?? null;
  const wearable = isWearable(productType);

  // Stock arrives from the page's live read (see LiveStock) and replaces the
  // cached catalogue's sizes once it lands; until then the cached values show.
  const sizes = useLiveSizes(product.slug, product.sizes);

  const hasColors = Boolean(product.colors && product.colors.length > 0);
  const hasSizes = sizes.length > 0;
  const hasRadioGroups = Boolean(product.radioGroups && product.radioGroups.length > 0);

  const [internalColor, setInternalColor] = useState<ProductColor | undefined>(
    hasColors ? product.colors![0] : undefined
  );
  const [internalSize, setInternalSize] = useState<ProductSize | null>(
    // A single sold-out option starts selected, so "notify me" is on show.
    hasSizes ? sizes.find((s) => s.inStock) || (sizes.length === 1 ? sizes[0]! : null) : null
  );

  const selectedColor = controlledColor !== undefined ? controlledColor : internalColor;
  // Re-read the chosen size from the live list so its stock and tier price
  // refresh with the stream, while the selection itself is preserved.
  const chosenSize = controlledSize !== undefined ? controlledSize : internalSize;
  const selectedSize = chosenSize ? sizes.find((s) => s.size === chosenSize.size) ?? chosenSize : null;

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

  // Price tiers: the chosen size's own price (see lib/product sizePriceINR).
  const effectiveUnitPriceINR = sizePriceINR({ ...product, sizes }, selectedSize?.size) + radioDeltaINR;

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
        setValidationError(`Please choose a ${variantLabel.toLowerCase()} to continue.`);
        return;
      }
      if (!selectedSize.inStock) {
        setValidationError(`This ${variantLabel.toLowerCase()} is currently sold out.`);
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
      priceMinorINR: Math.round(effectiveUnitPriceINR * 100),
      quantity,
      image: activeImage,
      selectedRadioOptions: chosenRadioOptions.length > 0 ? chosenRadioOptions : undefined,
    });
  };

  const handleBuyNow = () => {
    if (hasSizes && !selectedSize) {
      setValidationError(`Please choose a ${variantLabel.toLowerCase()} to continue.`);
      return;
    }
    if (hasSizes && selectedSize && !selectedSize.inStock) {
      setValidationError(`This ${variantLabel.toLowerCase()} is currently sold out.`);
      return;
    }
    handleAddToCart();
    router.push('/checkout');
  };


  return (
    <div className="flex flex-col gap-6">
      {/* 1. Dynamic Color Swatch Selector (Omitted if no colors defined) */}
      {hasColors && (
        <ColorSwatchSelector
          colors={product.colors}
          selectedColor={selectedColor}
          onSelect={handleColorSelect}
          label="Colour:"
        />
      )}

      {/* 2. Dynamic Variant Pill Selector (Omitted if no sizes defined) */}
      {hasSizes && (
        <VariantPillSelector
          sizes={sizes}
          selectedSize={selectedSize}
          onSelect={handleSizeSelect}
          label={`${variantLabel}:`}
          onSizeGuideClick={sizeChart ? () => setIsSizeGuideOpen(true) : undefined}
          sizeGuideLabel="Size guide"
          validationError={validationError}
        />
      )}

      {hasSizes && selectedSize && !selectedSize.inStock && product.productId && (
        <NotifyMe
          key={`${selectedColor?.name ?? ''}|${selectedSize.size}`}
          productId={product.productId}
          color={selectedColor?.name}
          size={selectedSize.size}
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
      <div id="purchase-actions" className="space-y-3 pt-2 scroll-mt-28">
        <div className="flex gap-2 sm:gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-store-card-border rounded-full bg-store-surface h-14 px-3 shrink-0" role="group" aria-label="Quantity">
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
            className="min-w-0 flex-1 h-14 px-4 sm:px-6 gap-2 rounded-full bg-[#111111] text-white hover:bg-black transition-all flex items-center justify-between font-medium text-xs uppercase tracking-wider shadow-sm cursor-pointer active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} aria-hidden="true" className="hidden sm:block" />
              <span>Add to bag</span>
            </span>
            <span className="text-sm tracking-normal tuw-tabular-nums">
              {formatRupees(effectiveUnitPriceINR * quantity)}
            </span>
          </button>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label={isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-pressed={isFavorite}
            title={isFavorite ? 'Saved to your wishlist' : 'Save to wishlist'}
            className="w-14 h-14 rounded-full border border-store-card-border bg-store-surface flex items-center justify-center text-store-charcoal hover:bg-store-cream transition-colors shrink-0 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
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
          Buy now
        </Button>
        {isFavorite && (
          <p className="text-xs text-store-text-secondary" aria-live="polite">
            Saved to your wishlist.
          </p>
        )}
      </div>

      {/* What happens after you order (no unverified material claims) */}
      <div className="p-4 bg-store-cream border border-store-card-border space-y-2 text-sm">
        <p className="flex items-center gap-2 font-medium text-store-charcoal">
          <Truck size={16} aria-hidden="true" />
          Printed for you after you order
        </p>
        <ul className="space-y-1 text-store-text-secondary list-disc list-inside">
          <li>Printed in 2–3 business days, then shipped across India</li>
          <li>Free delivery on orders over {rupeesLabel(freeThresholdPaise)}</li>
          <li>
            {wearable
              ? `${RETURN_WINDOW_DAYS}-day returns on unworn pieces with tags`
              : 'Replacement if it arrives damaged or misprinted (draft policy)'}
          </li>
        </ul>
      </div>

      {hasSizes && sizeChart && (
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          chart={sizeChart}
          sizeHeader={product.variantLabel}
          sizes={sizes.map((s) => s.size)}
        />
      )}
    </div>
  );
}
