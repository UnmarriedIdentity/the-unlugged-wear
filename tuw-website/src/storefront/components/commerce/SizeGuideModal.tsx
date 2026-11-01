'use client';

import React, { useState } from 'react';
import Modal from '@storefront/components/ui/Modal';
import type { SizeChartKind } from '@storefront/lib/product';

export interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  chart: SizeChartKind;
  /** Sizes this product is sold in; rows outside it are hidden. */
  sizes?: string[];
}

type Row = { size: string } & Record<string, number | string>;

// Draft garment measurements (laid flat, cm) until the print partner's
// per-style charts are confirmed.
const CHARTS: Record<SizeChartKind, { title: string; columns: { key: string; label: string }[]; rows: Row[] }> = {
  tops: {
    title: 'Tops, hoodies & jackets',
    columns: [
      { key: 'chest', label: 'Chest' },
      { key: 'length', label: 'Length' },
      { key: 'shoulder', label: 'Shoulder' },
      { key: 'sleeve', label: 'Sleeve' },
    ],
    rows: [
      { size: 'XS', chest: 96, length: 66, shoulder: 44, sleeve: 20 },
      { size: 'S', chest: 101, length: 69, shoulder: 46, sleeve: 21 },
      { size: 'M', chest: 106, length: 71, shoulder: 48, sleeve: 22 },
      { size: 'L', chest: 112, length: 73, shoulder: 50, sleeve: 23 },
      { size: 'XL', chest: 117, length: 75, shoulder: 52, sleeve: 24 },
      { size: 'XXL', chest: 122, length: 77, shoulder: 54, sleeve: 25 },
      { size: '3XL', chest: 127, length: 79, shoulder: 56, sleeve: 26 },
      { size: '4XL', chest: 132, length: 81, shoulder: 58, sleeve: 27 },
      { size: '5XL', chest: 137, length: 83, shoulder: 60, sleeve: 28 },
    ],
  },
  bottoms: {
    title: 'Joggers, shorts & bottoms',
    columns: [
      { key: 'waist', label: 'Waist (relaxed)' },
      { key: 'hip', label: 'Hip' },
      { key: 'length', label: 'Outseam' },
    ],
    rows: [
      { size: 'XS', waist: 66, hip: 92, length: 96 },
      { size: 'S', waist: 71, hip: 97, length: 98 },
      { size: 'M', waist: 76, hip: 102, length: 100 },
      { size: 'L', waist: 81, hip: 107, length: 102 },
      { size: 'XL', waist: 86, hip: 112, length: 104 },
      { size: 'XXL', waist: 91, hip: 117, length: 106 },
      { size: '3XL', waist: 96, hip: 122, length: 108 },
    ],
  },
  kids: {
    title: 'Kids',
    columns: [
      { key: 'height', label: 'Child height' },
      { key: 'chest', label: 'Chest' },
      { key: 'length', label: 'Length' },
    ],
    rows: [
      { size: '1Yrs', height: '76–86', chest: 56, length: 36 },
      { size: '3Yrs', height: '92–98', chest: 60, length: 40 },
      { size: '5Yrs', height: '104–110', chest: 66, length: 44 },
      { size: '7Yrs', height: '116–122', chest: 70, length: 48 },
      { size: '9Yrs', height: '128–134', chest: 76, length: 52 },
      { size: '11Yrs', height: '140–146', chest: 80, length: 56 },
      { size: '13Yrs', height: '152–158', chest: 86, length: 60 },
    ],
  },
};

const sameSize = (a: string, b: string) => a.replace(/\s+/g, '').toLowerCase() === b.replace(/\s+/g, '').toLowerCase();

export default function SizeGuideModal({ isOpen, onClose, chart, sizes }: SizeGuideModalProps) {
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const table = CHARTS[chart];
  const rows = sizes?.length ? table.rows.filter((r) => sizes.some((s) => sameSize(s, r.size))) : table.rows;
  const shownRows = rows.length ? rows : table.rows;

  const format = (value: number | string) => {
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
      title={`Size guide · ${table.title}`}
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
                <th scope="col" className="p-3 font-medium">{chart === 'kids' ? 'Age' : 'Size'}</th>
                {table.columns.map((c) => (
                  <th key={c.key} scope="col" className="p-3 font-medium">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-store-card-border text-store-text-secondary tuw-tabular-nums">
              {shownRows.map((row) => (
                <tr key={row.size}>
                  <th scope="row" className="p-3 font-medium text-store-charcoal">{row.size}</th>
                  {table.columns.map((c) => (
                    <td key={c.key} className="p-3">{format(row[c.key])}</td>
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
