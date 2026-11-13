'use client';

import React, { useState } from 'react';
import Modal from '@storefront/components/ui/Modal';
import type { SizeChartData } from '@storefront/lib/types';

export interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The chart staff linked to this product (size_charts). */
  chart: SizeChartData;
  /** Column heading for the size, e.g. "Age". */
  sizeHeader?: string;
  /** Sizes this product is sold in; rows outside it are hidden. */
  sizes?: string[];
}

const sameSize = (a: string, b: string) => a.replace(/\s+/g, '').toLowerCase() === b.replace(/\s+/g, '').toLowerCase();

export default function SizeGuideModal({ isOpen, onClose, chart, sizeHeader = 'Size', sizes }: SizeGuideModalProps) {
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const rows = sizes?.length ? chart.rows.filter((r) => sizes.some((s) => sameSize(s, r.size))) : chart.rows;
  const shownRows = rows.length ? rows : chart.rows;

  const format = (value: number | string | undefined) => {
    if (value === undefined) return '—';
    if (typeof value === 'string') {
      return unit === 'cm' ? `${value} cm` : `${value.split('–').map((v) => (Number(v) / 2.54).toFixed(0)).join('–')}″`;
    }
    return unit === 'cm' ? `${value} cm` : `${(value / 2.54).toFixed(1)}″`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title={`Size guide · ${chart.name}`}
      subtitle="Garment measured laid flat. Draft measurements, to be confirmed with our print partner."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-store-text-secondary">Units</p>
          <div className="flex items-center p-1 bg-store-cream border border-store-card-border" role="group" aria-label="Measurement unit">
            {(['cm', 'in'] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
                className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold ${
                  unit === u ? 'bg-store-surface text-store-charcoal shadow-xs' : 'text-store-text-secondary hover:text-store-charcoal'
                }`}
              >
                {u === 'cm' ? 'Centimetres' : 'Inches'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-store-card-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-store-cream border-b border-store-card-border text-store-charcoal">
              <tr>
                <th scope="col" className="p-3 font-medium">{sizeHeader}</th>
                {chart.columns.map((c) => (
                  <th key={c} scope="col" className="p-3 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-store-card-border text-store-text-secondary tuw-tabular-nums">
              {shownRows.map((row) => (
                <tr key={row.size}>
                  <th scope="row" className="p-3 font-medium text-store-charcoal">{row.size}</th>
                  {chart.columns.map((c) => (
                    <td key={c} className="p-3">{format(row.measures[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-store-canvas border border-store-card-border text-sm text-store-text-secondary space-y-1.5 leading-relaxed">
          <p className="font-medium text-store-charcoal">How to choose</p>
          <p>Measure a piece you already like, laid flat, and compare it with the table.</p>
          <p>Between two sizes? Take the larger one for a relaxed fit.</p>
        </div>
      </div>
    </Modal>
  );
}
