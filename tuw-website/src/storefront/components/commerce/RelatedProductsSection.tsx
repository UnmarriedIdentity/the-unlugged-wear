'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Product } from '@/lib/types';
import ProductCard from './ProductCard';
import { useStore } from '@/mocks/store';

export interface PairsWithItem {
  id: string;
  title: string;
  priceText: string;
  image: string;
  href?: string;
}

export interface RelatedProductsSectionProps {
  products?: Product[];
  pairsItems?: PairsWithItem[];
  title?: string;
  eyebrow?: string;
  catalogLink?: string;
  catalogLabel?: string;
  className?: string;
}

export default function RelatedProductsSection({
  products,
  pairsItems,
  title = 'Pairs well with',
  eyebrow,
  catalogLink = '/shop',
  catalogLabel = 'SHOP ALL',
  className = '',
}: RelatedProductsSectionProps) {
  const { addToCart } = useStore();

  const hasPairs = Boolean(pairsItems && pairsItems.length > 0);
  const hasProducts = Boolean(products && products.length > 0);

  if (!hasPairs && !hasProducts) return null;

  const handleQuickAdd = (item: PairsWithItem) => {
    addToCart({
      productId: item.id,
      title: item.title,
      color: 'Standard',
      size: 'One Size',
      priceINR: parseInt(item.priceText.replace(/[^0-9]/g, ''), 10) || 1290,
      quantity: 1,
      image: item.image,
    });
  };

  return (
    <section className={`my-16 pt-12 border-t border-store-card-border ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          {eyebrow && (
            <span className="text-xs font-bold uppercase tracking-wider text-store-muted block mb-1">
              {eyebrow}
            </span>
          )}
          <h2 className="text-2xl font-heading font-medium text-store-charcoal">
            {title}
          </h2>
        </div>
        {catalogLink && (
          <Link
            href={catalogLink}
            className="text-xs font-bold uppercase tracking-wider text-store-charcoal hover:underline"
          >
            {catalogLabel}
          </Link>
        )}
      </div>

      {hasPairs ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {pairsItems!.map((item) => (
            <div key={item.id} className="group flex flex-col">
              <div className="relative aspect-4/5 rounded-2xl overflow-hidden border border-store-card-border bg-store-canvas flex items-center justify-center p-3 shadow-2xs transition-all hover:border-store-charcoal/40">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-102"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => handleQuickAdd(item)}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-white/95 text-store-charcoal border border-store-card-border flex items-center justify-center shadow-xs hover:bg-store-charcoal hover:text-white transition-colors cursor-pointer active:scale-95"
                  aria-label={`Quick add ${item.title}`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-bold text-store-charcoal truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-store-muted mt-0.5 font-medium">
                  {item.priceText}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products!.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
