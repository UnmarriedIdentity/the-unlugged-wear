'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Tabs from '@/components/ui/Tabs';

export default function StandaloneSizeGuidePage() {
  const [activeCategory, setActiveCategory] = useState<'hoodies' | 'tees' | 'pants'>('hoodies');
  const [unit, setUnit] = useState<'cm' | 'inches'>('cm');

  const toInches = (cm: number) => (cm / 2.54).toFixed(1);

  const hoodieData = [
    { size: 'XS', chest: 108, length: 66, shoulder: 54, sleeve: 59 },
    { size: 'S', chest: 114, length: 69, shoulder: 57, sleeve: 61 },
    { size: 'M', chest: 120, length: 72, shoulder: 60, sleeve: 63 },
    { size: 'L', chest: 126, length: 74, shoulder: 63, sleeve: 64 },
    { size: 'XL', chest: 132, length: 76, shoulder: 66, sleeve: 65 },
    { size: 'XXL', chest: 138, length: 78, shoulder: 69, sleeve: 66 },
  ];

  const teeData = [
    { size: 'XS', chest: 104, length: 68, shoulder: 50, sleeve: 22 },
    { size: 'S', chest: 110, length: 71, shoulder: 53, sleeve: 23 },
    { size: 'M', chest: 116, length: 74, shoulder: 56, sleeve: 24 },
    { size: 'L', chest: 122, length: 76, shoulder: 59, sleeve: 25 },
    { size: 'XL', chest: 128, length: 78, shoulder: 62, sleeve: 26 },
    { size: 'XXL', chest: 134, length: 80, shoulder: 65, sleeve: 27 },
  ];

  const pantsData = [
    { size: 'S (30)', waist: 78, hip: 106, length: 102, thigh: 66 },
    { size: 'M (32)', waist: 83, hip: 112, length: 104, thigh: 69 },
    { size: 'L (34)', waist: 88, hip: 118, length: 106, thigh: 72 },
    { size: 'XL (36)', waist: 93, hip: 124, length: 108, thigh: 75 },
  ];

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
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
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

        {/* Category Tabs */}
        <div className="mb-6">
          <Tabs
            variant="pills"
            activeTab={activeCategory}
            onChange={(c) => setActiveCategory(c as any)}
            tabs={[
              { id: 'hoodies', label: 'French Terry Hoodies & Sweats' },
              { id: 'tees', label: 'Organic Combed T-Shirts' },
              { id: 'pants', label: 'Pleated Canvas Trousers' },
            ]}
          />
        </div>

        {/* Measurements Table */}
        <div className="bg-white rounded-3xl border border-[#E2DDCF] overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F4F1EA] border-b border-[#E2DDCF] text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
              {activeCategory === 'pants' ? (
                <tr>
                  <th className="p-4">Size (Waist)</th>
                  <th className="p-4">Relaxed Waist</th>
                  <th className="p-4">Seat / Hip</th>
                  <th className="p-4">Outseam Length</th>
                  <th className="p-4">Thigh Circumference</th>
                </tr>
              ) : (
                <tr>
                  <th className="p-4">Size</th>
                  <th className="p-4">Chest Width</th>
                  <th className="p-4">Garment Length</th>
                  <th className="p-4">Shoulder Drop</th>
                  <th className="p-4">Sleeve Length</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-[#E2DDCF] font-medium text-[#5A5A5A] text-xs sm:text-sm">
              {activeCategory === 'hoodies' &&
                hoodieData.map((row) => (
                  <tr key={row.size} className="hover:bg-[#FAF9F6]">
                    <td className="p-4 font-bold text-[#1A1A1A]">{row.size}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.chest} cm` : `${toInches(row.chest)}"`}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.length} cm` : `${toInches(row.length)}"`}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.shoulder} cm` : `${toInches(row.shoulder)}"`}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.sleeve} cm` : `${toInches(row.sleeve)}"`}</td>
                  </tr>
                ))}

              {activeCategory === 'tees' &&
                teeData.map((row) => (
                  <tr key={row.size} className="hover:bg-[#FAF9F6]">
                    <td className="p-4 font-bold text-[#1A1A1A]">{row.size}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.chest} cm` : `${toInches(row.chest)}"`}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.length} cm` : `${toInches(row.length)}"`}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.shoulder} cm` : `${toInches(row.shoulder)}"`}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.sleeve} cm` : `${toInches(row.sleeve)}"`}</td>
                  </tr>
                ))}

              {activeCategory === 'pants' &&
                pantsData.map((row) => (
                  <tr key={row.size} className="hover:bg-[#FAF9F6]">
                    <td className="p-4 font-bold text-[#1A1A1A]">{row.size}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.waist} cm` : `${toInches(row.waist)}"`}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.hip} cm` : `${toInches(row.hip)}"`}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.length} cm` : `${toInches(row.length)}"`}</td>
                    <td className="p-4">{unit === 'cm' ? `${row.thigh} cm` : `${toInches(row.thigh)}"`}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Fit recommendations */}
        <div className="mt-8 p-6 rounded-3xl bg-[#F4F1EA] border border-[#E2DDCF] space-y-3 text-xs text-[#5A5A5A] leading-relaxed">
          <h4 className="font-bold text-[#1A1A1A] uppercase tracking-wider">
            How to Measure Flat
          </h4>
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
