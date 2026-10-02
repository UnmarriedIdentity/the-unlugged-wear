'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Collection } from '@/lib/types';
import ImageWithFallback from '../ui/ImageWithFallback';

export interface CollectionCardProps {
  collection: Collection;
  className?: string;
}

export default function CollectionCard({ collection, className = '' }: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-[#F4F1EA] border border-[#E2DDCF] shadow-xs hover:shadow-md transition-all ${className}`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <ImageWithFallback
          src={collection.coverImage}
          alt={collection.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute bottom-5 left-5 right-5 text-white">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C8A96A] block mb-1">
            Capsule • {collection.productCount} Pieces
          </span>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{collection.title}</h3>
          <p className="text-xs text-[#D1D5DB] mt-1 line-clamp-1">{collection.tagline}</p>
        </div>
      </div>

      <div className="p-5 flex items-center justify-between bg-white">
        <p className="text-xs text-[#666] line-clamp-2 max-w-sm">{collection.description}</p>
        <span className="w-9 h-9 rounded-full bg-[#FAF9F6] border border-[#E2DDCF] flex items-center justify-center text-[#1A1A1A] group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors shrink-0 ml-4">
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}
