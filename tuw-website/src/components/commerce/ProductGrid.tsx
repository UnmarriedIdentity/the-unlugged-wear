'use client';

import React from 'react';
import { Product } from '@/lib/types';
import ProductCard from './ProductCard';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onResetFilters?: () => void;
  className?: string;
}

export default function ProductGrid({
  products,
  isLoading = false,
  emptyTitle = 'No garments match your filters',
  emptyDescription = 'Try removing some filters or exploring our other capsules.',
  onResetFilters,
  className = '',
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton variant="rect" className="aspect-[3/4] w-full" />
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onResetFilters ? 'Clear All Filters' : 'View All Apparel'}
        actionHref={!onResetFilters ? '/shop' : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 ${className}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
