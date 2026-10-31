'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={`flex items-center justify-center gap-2 select-none ${className}`}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous Page"
        className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E2DDCF] bg-white text-[#1A1A1A] hover:bg-[#F4F1EA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-semibold tracking-wide transition-colors ${
              isActive
                ? 'bg-[#1A1A1A] text-white shadow-sm'
                : 'border border-[#E2DDCF] bg-white text-[#1A1A1A] hover:bg-[#F4F1EA]'
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next Page"
        className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E2DDCF] bg-white text-[#1A1A1A] hover:bg-[#F4F1EA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
