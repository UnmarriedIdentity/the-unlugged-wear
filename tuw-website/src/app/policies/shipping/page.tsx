'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { ShieldAlert, Truck } from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Policies', href: '/policies' },
            { label: 'Shipping & Delivery' },
          ]}
        />

        <div className="my-8">
          <div className="inline-flex items-center gap-1.5 p-2 px-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs font-semibold text-[#B45309] mb-4">
            <ShieldAlert size={14} />
            <span>Draft Policy: Carbon-neutral surface logistics guidelines.</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            Shipping & Logistics Policy
          </h1>
          <p className="text-xs text-[#8A8A8A] mt-2">Last modified: October 2026</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E2DDCF] p-8 sm:p-12 shadow-xs prose prose-neutral max-w-none text-sm text-[#4A4A4A] space-y-6 leading-relaxed">
          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">1. Print-On-Demand Lead Times</h3>
            <p>
              Unlike fast-fashion retailers shipping pre-made garments from congested warehouses, each piece of The Unplugged Wear is printed upon demand to ensure zero deadstock.
            </p>
            <p>
              <strong>Print, Curing & Quality Check:</strong> 24 to 48 hours.
              <br />
              <strong>Domestic Surface Transit:</strong> 3 to 5 business days across tier-1 and tier-2 Indian metros.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">2. Delivery Rates & Complimentary Thresholds</h3>
            <p>
              We provide complimentary domestic shipping on all orders totaling <strong>₹3,000 or greater</strong>. For orders under ₹3,000, a flat rate of ₹150 is applied to cover sustainable kraft packaging and carbon offsets.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">3. Shipment Tracking</h3>
            <p>
              Once your garment completes thermal ink setting and final seam inspection, a tracking reference is generated. You can monitor milestone events anytime at <a href="/track-order" className="underline font-semibold">Track Shipment</a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
