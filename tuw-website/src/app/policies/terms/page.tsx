'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { ShieldAlert } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Policies', href: '/policies' },
            { label: 'Terms of Service' },
          ]}
        />

        <div className="my-8">
          <div className="inline-flex items-center gap-1.5 p-2 px-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs font-semibold text-[#B45309] mb-4">
            <ShieldAlert size={14} />
            <span>Draft Policy: Subject to final corporate review and statutory compliance.</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            Terms of Service
          </h1>
          <p className="text-xs text-[#8A8A8A] mt-2">Last modified: October 2026</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E2DDCF] p-8 sm:p-12 shadow-xs prose prose-neutral max-w-none text-sm text-[#4A4A4A] space-y-6 leading-relaxed">
          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">1. Agreement to Terms</h3>
            <p>
              By accessing or using the services of The Unplugged Wear (&ldquo;TUW&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;), you agree to be bound by these Terms of Service. If you do not agree with any portion of these terms, please discontinue use of this site.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">2. Print-on-Demand (POD) Production Nature</h3>
            <p>
              All apparel presented on The Unplugged Wear is manufactured on-demand. When an order is placed, raw organic blanks are pulled from clean room storage and printed with high-resolution digital water pigments. As each garment is custom-printed, slight tonal variations in fiber absorbency are a natural characteristic of organic cotton.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">3. Pricing and Order Accuracy</h3>
            <p>
              All prices are listed in Indian Rupees (INR) and are inclusive of Goods and Services Tax (GST). We reserve the right to correct accidental pricing errors before order fulfillment.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">4. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by applicable Indian law, The Unplugged Wear shall not be liable for indirect, incidental, or consequential damages resulting from platform use.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
