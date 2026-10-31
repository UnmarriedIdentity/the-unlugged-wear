'use client';

import React, { useState } from 'react';
import { ProductSpecTable } from '@/lib/types';

export interface DynamicDataTableProps {
  table?: ProductSpecTable | null;
  className?: string;
}

export default function DynamicDataTable({
  table,
  className = '',
}: DynamicDataTableProps) {
  // Data-driven conditional guard: strictly omit if table data is absent or empty
  if (!table || !table.rows || table.rows.length === 0) {
    return null;
  }

  const defaultUnit = table.unitToggle?.units[0]?.id || 'cm';
  const [activeUnit, setActiveUnit] = useState<string>(defaultUnit);

  // Select active row set based on active unit if unitToggle is declared
  const activeRows =
    table.unitToggle && activeUnit === 'in' && table.unitToggle.imperialRows
      ? table.unitToggle.imperialRows
      : table.unitToggle && activeUnit === 'cm' && table.unitToggle.metricRows
      ? table.unitToggle.metricRows
      : table.rows;

  const hasSideScale = Boolean(table.sideScale);

  // Position indicator on scale
  let indicatorPositionClass = 'left-1/2 -translate-x-1/2';
  if (table.sideScale?.indicatorPosition === 'left') {
    indicatorPositionClass = 'left-1/5 -translate-x-1/2';
  } else if (table.sideScale?.indicatorPosition === 'right') {
    indicatorPositionClass = 'left-4/5 -translate-x-1/2';
  }

  return (
    <div className={`grid grid-cols-1 ${hasSideScale ? 'lg:grid-cols-12' : ''} gap-8 items-start ${className}`}>
      {/* Optional Left Side Scale Panel (e.g. Fit Guide, Craft Guide, Texture Guide) */}
      {table.sideScale && (
        <div className="lg:col-span-4 space-y-4">
          {table.sideScale.eyebrow && (
            <span className="text-xs uppercase tracking-widest text-store-gold font-semibold block">
              {table.sideScale.eyebrow}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl font-heading font-medium uppercase tracking-wide text-store-text-primary">
            {table.sideScale.title}
          </h2>
          {table.sideScale.description && (
            <p className="text-xs text-store-text-secondary leading-relaxed">
              {table.sideScale.description}
            </p>
          )}

          {/* Visual Slider Scale */}
          <div className="p-4 rounded-xl bg-store-cream border border-store-card-border space-y-2">
            <div className="flex justify-between text-xs text-store-muted font-medium">
              <span>{table.sideScale.minLabel}</span>
              <span className="font-bold text-store-charcoal">
                {table.sideScale.midLabel}
              </span>
              <span>{table.sideScale.maxLabel}</span>
            </div>
            <div className="relative h-2 rounded-full bg-store-card-border">
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-store-charcoal border-2 border-white shadow-xs ${indicatorPositionClass}`}
              />
            </div>
          </div>

          {table.sideScale.footerNote && (
            <div className="text-xs text-store-muted">
              {table.sideScale.footerNote}
            </div>
          )}
        </div>
      )}

      {/* Main Table Viewport */}
      <div className={`${hasSideScale ? 'lg:col-span-8' : 'w-full'} space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-store-text-primary">
              {table.title}
            </h2>
            {table.description && (
              <p className="text-xs text-store-text-secondary mt-0.5">
                {table.description}
              </p>
            )}
          </div>

          {/* Optional Unit Toggle */}
          {table.unitToggle && table.unitToggle.units.length > 1 && (
            <div className="flex items-center p-1 rounded-xl bg-store-cream border border-store-card-border shrink-0 self-start sm:self-auto">
              {table.unitToggle.units.map((unit) => {
                const isActive = activeUnit === unit.id;
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => setActiveUnit(unit.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-store-surface text-store-charcoal shadow-xs'
                        : 'text-store-muted hover:text-store-charcoal'
                    }`}
                  >
                    {unit.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Polymorphic Table Grid */}
        <div className="overflow-x-auto rounded-2xl border border-store-card-border bg-store-surface shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-store-cream border-b border-store-card-border font-bold text-store-charcoal uppercase tracking-wider">
              <tr>
                {table.columns.map((col) => (
                  <th
                    key={col.key}
                    className={`p-3.5 ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-store-card-border font-medium text-store-text-secondary">
              {activeRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-store-canvas transition-colors">
                  {table.columns.map((col, colIdx) => {
                    const value = row[col.key];
                    const isFirstCol = colIdx === 0;

                    return (
                      <td
                        key={col.key}
                        className={`p-3.5 ${
                          isFirstCol ? 'font-bold text-store-charcoal' : ''
                        } ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {value !== undefined ? String(value) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

