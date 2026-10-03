'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';

export interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

export default function SizeGuideModal({
  isOpen,
  onClose,
  category = 'hoodies',
}: SizeGuideModalProps) {
  const [unit, setUnit] = useState<'cm' | 'inches'>('cm');

  const hoodieMeasurementsCM = [
    { size: 'XS', chest: 108, length: 66, shoulder: 54, sleeve: 59 },
    { size: 'S', chest: 114, length: 69, shoulder: 57, sleeve: 61 },
    { size: 'M', chest: 120, length: 72, shoulder: 60, sleeve: 63 },
    { size: 'L', chest: 126, length: 74, shoulder: 63, sleeve: 64 },
    { size: 'XL', chest: 132, length: 76, shoulder: 66, sleeve: 65 },
    { size: 'XXL', chest: 138, length: 78, shoulder: 69, sleeve: 66 },
  ];

  const toInches = (cm: number) => (cm / 2.54).toFixed(1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title="Fit & Sizing Measurement Chart"
      subtitle="All measurements reflect garment dimensions laid flat."
    >
      <div className="space-y-6">
        {/* Unit Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#666]">
            Select your preferred unit of measurement:
          </p>

          <div className="flex items-center p-1 rounded-lg bg-[#F4F1EA] border border-[#E2DDCF]">
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                unit === 'cm'
                  ? 'bg-white text-[#1A1A1A] shadow-xs'
                  : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
              }`}
            >
              Centimeters (CM)
            </button>
            <button
              type="button"
              onClick={() => setUnit('inches')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                unit === 'inches'
                  ? 'bg-white text-[#1A1A1A] shadow-xs'
                  : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
              }`}
            >
              Inches (IN)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E2DDCF]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F1EA] border-b border-[#E2DDCF] font-bold text-[#1A1A1A] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Size</th>
                <th className="p-3.5">Chest Circumference</th>
                <th className="p-3.5">Body Length</th>
                <th className="p-3.5">Shoulder Width</th>
                <th className="p-3.5">Sleeve Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDCF] font-medium text-[#5A5A5A]">
              {hoodieMeasurementsCM.map((row) => (
                <tr key={row.size} className="hover:bg-[#FAF9F6]">
                  <td className="p-3.5 font-bold text-[#1A1A1A]">{row.size}</td>
                  <td className="p-3.5">
                    {unit === 'cm' ? `${row.chest} cm` : `${toInches(row.chest)}"`}
                  </td>
                  <td className="p-3.5">
                    {unit === 'cm' ? `${row.length} cm` : `${toInches(row.length)}"`}
                  </td>
                  <td className="p-3.5">
                    {unit === 'cm' ? `${row.shoulder} cm` : `${toInches(row.shoulder)}"`}
                  </td>
                  <td className="p-3.5">
                    {unit === 'cm' ? `${row.sleeve} cm` : `${toInches(row.sleeve)}"`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Silhouette Guidance Notes */}
        <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E2DDCF] text-xs text-[#5A5A5A] space-y-2 leading-relaxed">
          <h4 className="font-bold text-[#1A1A1A] uppercase tracking-wide">
            Silhouette & Fit Recommendations
          </h4>
          <p>
            • <strong>Intended Drape:</strong> Our garments are engineered with relaxed drop-shoulders
            and boxy proportions. Order your regular size for the signature Unplugged Wear relaxed look.
          </p>
          <p>
            • <strong>Fitted Silhouette:</strong> If you prefer a tailored, traditional fit close to the
            torso, consider sizing down by one full size.
          </p>
          <p>
            • <strong>Pre-Shrunk Guarantee:</strong> Fabrics are pre-washed and heat-set. They will not
            shrink when laundered according to care instructions (machine wash cold, line dry).
          </p>
        </div>
      </div>
    </Modal>
  );
}
