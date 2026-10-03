'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import CollectionCard from '@/components/commerce/CollectionCard';
import { STORE_COLLECTIONS } from '@/mocks/fixtures';

export default function CollectionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Capsule Series' },
          ]}
        />

        <div className="max-w-2xl my-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            Capsule Collections
          </h1>
          <p className="text-sm text-[#666] mt-2 leading-relaxed">
            Limited conceptual releases exploring dense structural weaves, unbleached duck canvas, and intentional minimalist uniforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
          {STORE_COLLECTIONS.map((col) => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
