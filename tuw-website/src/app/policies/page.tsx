'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { ArrowRight, ShieldAlert, FileText, RefreshCw, Truck, Lock } from 'lucide-react';

export default function PoliciesIndexPage() {
  const policies = [
    {
      title: 'Returns & Exchanges Policy',
      path: '/policies/returns',
      icon: <RefreshCw size={20} className="text-[#7539FF]" />,
      desc: '14-day doorstep return pickup and exchange process for unworn garments.',
    },
    {
      title: 'Shipping & Delivery Policy',
      path: '/policies/shipping',
      icon: <Truck size={20} className="text-[#10B981]" />,
      desc: 'Information regarding domestic surface transit, free shipping thresholds, and POD lead times.',
    },
    {
      title: 'Privacy Policy',
      path: '/policies/privacy',
      icon: <Lock size={20} className="text-[#F59E0B]" />,
      desc: 'How we securely handle recipient contact info, address book tokens, and preferences.',
    },
    {
      title: 'Terms of Service',
      path: '/policies/terms',
      icon: <FileText size={20} className="text-[#1A1A1A]" />,
      desc: 'Legal terms governing your usage of The Unplugged Wear digital catalog and storefront.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Studio Policies' },
          ]}
        />

        <div className="my-8">
          <div className="inline-flex items-center gap-1.5 p-2 px-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs font-semibold text-[#B45309] mb-4">
            <ShieldAlert size={14} />
            <span>Draft Notice: All policy copy is currently marked as draft pending legal counsel sign-off.</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            Studio Policies & Governance
          </h1>
          <p className="text-sm text-[#666] mt-2">
            Clear, transparent expectations governing production, logistics, privacy, and customer satisfaction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          {policies.map((p) => (
            <Link
              key={p.path}
              href={p.path}
              className="group p-6 rounded-3xl bg-white border border-[#E2DDCF] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F4F1EA] flex items-center justify-center mb-4">
                  {p.icon}
                </div>
                <h3 className="text-base font-bold text-[#1A1A1A] group-hover:underline">
                  {p.title}
                </h3>
                <p className="text-xs text-[#666] mt-1.5 leading-relaxed">{p.desc}</p>
              </div>

              <div className="pt-6 mt-4 border-t border-[#E2DDCF] flex items-center justify-between text-xs font-semibold text-[#1A1A1A]">
                <span>Read Full Document</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
