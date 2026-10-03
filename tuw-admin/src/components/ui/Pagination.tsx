'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      {totalItems !== undefined && pageSize !== undefined && (
        <span style={{ fontSize: '13px', color: 'var(--tuw-text-secondary, #5D6772)' }}>
          Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * pageSize, totalItems)}</strong> of <strong>{totalItems}</strong> entries
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon={<ChevronLeft size={14} />}
        >
          Previous
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: isActive ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-border-subtle, #E2E4E6)',
                backgroundColor: isActive ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-bg-surface, #FFFFFF)',
                color: isActive ? '#FFFFFF' : 'var(--tuw-text-primary, #262626)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              {page}
            </button>
          );
        })}

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          icon={<ChevronRight size={14} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
