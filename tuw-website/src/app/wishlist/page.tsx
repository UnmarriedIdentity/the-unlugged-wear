'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductGrid from '@/components/commerce/ProductGrid';
import Button from '@/components/ui/Button';
import { useStore } from '@/mocks/store';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, products } = useStore();

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Saved Wishlist' },
          ]}
        />

        <div className="my-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A]">
            Saved Wishlist
          </h1>
          <p className="text-sm text-[#666] mt-1">
            {savedProducts.length} piece{savedProducts.length === 1 ? '' : 's'} saved to your intentional wardrobe.
          </p>
        </div>

        {savedProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#E2DDCF] p-8 max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#8A8A8A] mx-auto mb-4">
              <Heart size={28} />
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">Your wishlist is empty</h2>
            <p className="text-sm text-[#666] max-w-sm mx-auto mt-2 leading-relaxed">
              Click the heart icon on any garment in the catalog to save it for future consideration.
            </p>
            <div className="mt-6">
              <Button variant="dark" size="lg" href="/shop">
                Explore Collection
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-4">
            <ProductGrid products={savedProducts} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
