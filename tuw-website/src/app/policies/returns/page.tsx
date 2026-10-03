'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Policies', href: '/policies' },
            { label: 'Returns & Exchanges' },
          ]}
        />

        <div className="my-8">
          <div className="inline-flex items-center gap-1.5 p-2 px-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs font-semibold text-[#B45309] mb-4">
            <ShieldAlert size={14} />
            <span>Draft Policy: 14-day hassle-free doorstep pickup guarantee.</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            Returns & Exchanges Policy
          </h1>
          <p className="text-xs text-[#8A8A8A] mt-2">Last modified: October 2026</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E2DDCF] p-8 sm:p-12 shadow-xs prose prose-neutral max-w-none text-sm text-[#4A4A4A] space-y-6 leading-relaxed">
          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">1. 14-Day Return Window</h3>
            <p>
              We want you to feel complete confidence in the drape and weight of our garments. If your piece does not fit as desired, you may request an exchange or return within 14 calendar days of confirmed doorstep delivery.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">2. Item Condition Requirements</h3>
            <p>
              To maintain hygiene and fair atelier restocking standards:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Garments must be unworn, unwashed, and odor-free.</li>
              <li>Original paper tags and natural cotton cords must remain attached.</li>
              <li>Must be repackaged in clean protective wrap for courier handoff.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">3. Doorstep Pickup & Refund Timeline</h3>
            <p>
              Once you log an RMA request from your <a href="/account" className="underline font-semibold">Account Dashboard</a>, our courier partners (Delhivery / BlueDart) will arrive within 48 hours for reverse pickup. Upon arrival at our inspection atelier and quality sign-off, full refunds are processed to your original payment mode within 3-5 business days.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
