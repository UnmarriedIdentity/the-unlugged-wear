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
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const validTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), validTotalPages);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {totalItems !== undefined && pageSize !== undefined && (
          <span style={{ fontSize: '13px', color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Showing <strong>{(safeCurrentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(safeCurrentPage * pageSize, totalItems)}</strong> of{' '}
            <strong>{totalItems}</strong> entries
          </span>
        )}

        {pageSizeOptions && onPageSizeChange && pageSize && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--tuw-text-secondary, #5D6772)' }}>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                height: '28px',
                padding: '0 8px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid var(--tuw-border-control, #90979F)',
                backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                color: 'var(--tuw-text-primary, #262626)',
                cursor: 'pointer',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          icon={<ChevronLeft size={14} />}
        >
          Previous
        </Button>

        {/* Page numbers with smart ellipsis */}
        {(() => {
          const getPageNumbers = () => {
            if (validTotalPages <= 7) {
              return Array.from({ length: validTotalPages }, (_, i) => i + 1);
            }
            if (safeCurrentPage <= 4) {
              return [1, 2, 3, 4, 5, 'ellipsis', validTotalPages];
            }
            if (safeCurrentPage >= validTotalPages - 3) {
              return [
                1,
                'ellipsis',
                validTotalPages - 4,
                validTotalPages - 3,
                validTotalPages - 2,
                validTotalPages - 1,
                validTotalPages,
              ];
            }
            return [
              1,
              'ellipsis',
              safeCurrentPage - 1,
              safeCurrentPage,
              safeCurrentPage + 1,
              'ellipsis',
              validTotalPages,
            ];
          };

          return getPageNumbers().map((pageItem, idx) => {
            if (pageItem === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    padding: '0 4px',
                    color: 'var(--tuw-text-secondary, #5D6772)',
                    fontSize: '13px',
                    userSelect: 'none',
                  }}
                >
                  ...
                </span>
              );
            }

            const page = pageItem as number;
            const isActive = page === safeCurrentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  padding: '0 8px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-border-subtle, #E2E4E6)',
                  backgroundColor: isActive ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-bg-surface, #FFFFFF)',
                  color: isActive ? '#FFFFFF' : 'var(--tuw-text-primary, #262626)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {page}
              </button>
            );
          });
        })()}

        <Button
          variant="secondary"
          size="sm"
          disabled={safeCurrentPage >= validTotalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          icon={<ChevronRight size={14} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
