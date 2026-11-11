'use client';

import React, { useState } from 'react';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import Tabs from '@storefront/components/ui/Tabs';
import { useStore } from '@storefront/mocks/store';

export default function StandaloneSizeGuidePage() {
  // Charts come from the database (admin → Products → size charts).
  const { sizeCharts } = useStore();
  const [activeChart, setActiveChart] = useState(sizeCharts[0]?.id ?? '');
  const [unit, setUnit] = useState<'cm' | 'inches'>('cm');
  const chart = sizeCharts.find((c) => c.id === activeChart) ?? sizeCharts[0];

  const toInches = (cm: number) => (cm / 2.54).toFixed(1);
  const format = (value: number | string | undefined) => {
    if (value === undefined) return '—';
    if (typeof value === 'string') return unit === 'cm' ? `${value} cm` : `${value.split(/[–-]/).map((v) => toInches(Number(v))).join('–')}"`;
    return unit === 'cm' ? `${value} cm` : `${toInches(value)}"`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Fit & Sizing Guide' },
          ]}
        />

        <div className="my-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-extrabold tracking-tight text-[#1A1A1A]">
              Fit & Sizing Guide
            </h1>
            <p className="text-sm text-[#666] mt-2 max-w-xl">
              Architectural relaxed proportions tailored with dropped shoulders and boxy chest drapes.
            </p>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-white border border-[#E2DDCF] shadow-xs">
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                unit === 'cm' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#8A8A8A]'
              }`}
            >
              Centimeters (CM)
            </button>
            <button
              type="button"
              onClick={() => setUnit('inches')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                unit === 'inches' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#8A8A8A]'
              }`}
            >
              Inches (IN)
            </button>
          </div>
        </div>

        {/* Chart Tabs */}
        <div className="mb-6">
          <Tabs variant="pills" activeTab={chart?.id ?? ''} onChange={setActiveChart} tabs={sizeCharts.map((c) => ({ id: c.id, label: c.name }))} />
        </div>

        {/* Measurements Table */}
        <div className="bg-white rounded-3xl border border-[#E2DDCF] overflow-x-auto shadow-xs">
          {chart ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4F1EA] border-b border-[#E2DDCF] text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                <tr>
                  <th scope="col" className="p-4">Size</th>
                  {chart.columns.map((c) => <th key={c} scope="col" className="p-4">{c}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDCF] font-medium text-[#5A5A5A] text-xs sm:text-sm">
                {chart.rows.map((row) => (
                  <tr key={row.size} className="hover:bg-[#FAF9F6]">
                    <th scope="row" className="p-4 font-bold text-[#1A1A1A]">{row.size}</th>
                    {chart.columns.map((c) => <td key={c} className="p-4">{format(row.measures[c])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-sm text-[#5A5A5A]">Size charts are being prepared.</p>
          )}
        </div>
        <p className="mt-3 text-xs text-[#5A5A5A]">Draft measurements, to be confirmed with our print partner.</p>

        {/* Fit recommendations */}
        <div className="mt-8 p-6 rounded-3xl bg-[#F4F1EA] border border-[#E2DDCF] space-y-3 text-xs text-[#5A5A5A] leading-relaxed">
          <h2 className="font-bold text-[#1A1A1A] uppercase tracking-wider">
            How to Measure Flat
          </h2>
          <p>
            • <strong>Chest Width:</strong> Measure 2.5cm below armholes straight across the garment, multiplied by two for circumference.
          </p>
          <p>
            • <strong>Body Length:</strong> Measure from highest point of shoulder next to collar straight down to the lowest edge of hem ribbing.
          </p>
          <p>
            • <strong>Need sizing advice?</strong> Reach out via our <a href="/contact" className="underline font-semibold text-[#1A1A1A]">Contact Studio</a> page with your height, weight, and preferred fit drape.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
