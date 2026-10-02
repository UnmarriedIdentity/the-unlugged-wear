'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { ShieldAlert } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Policies', href: '/policies' },
            { label: 'Privacy Policy' },
          ]}
        />

        <div className="my-8">
          <div className="inline-flex items-center gap-1.5 p-2 px-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs font-semibold text-[#B45309] mb-4">
            <ShieldAlert size={14} />
            <span>Draft Policy: Governed under the Digital Personal Data Protection Act (DPDPA).</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#8A8A8A] mt-2">Last modified: October 2026</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E2DDCF] p-8 sm:p-12 shadow-xs prose prose-neutral max-w-none text-sm text-[#4A4A4A] space-y-6 leading-relaxed">
          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">1. Data We Collect</h3>
            <p>
              We collect information necessary to fulfill your garment orders, including recipient name, email address, postal delivery address, and phone number. Payment card credentials are never held directly on our servers; all transactions utilize PCI-DSS certified gateway tokens.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">2. Zero Third-Party Advertising Trackers</h3>
            <p>
              The Unplugged Wear operates without third-party invasive cross-site ad retargeting trackers. We believe in quiet digital privacy. Your contact details are never sold, rented, or traded to marketing broker networks.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-[#1A1A1A]">3. Data Deletion Rights</h3>
            <p>
              You have the right to request deletion of your address book, order history, and account profile at any time by contacting studio@theunpluggedwear.com.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
