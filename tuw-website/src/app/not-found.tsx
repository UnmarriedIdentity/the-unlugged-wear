import React from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Button from '@/components/ui/Button';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1A1A1A]">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-lg space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#EAE6DF] flex items-center justify-center text-[#1A1A1A]">
            <Compass size={28} />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#707070] font-semibold">
              404 — Form Beyond Horizon
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1A1A1A]">
              Page Not Found
            </h1>
            <p className="text-sm text-[#5D6772] leading-relaxed pt-2">
              The garment, publication, or section you are seeking does not exist or has been
              archived from our current digital catalogue.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/">
              <Button variant="primary" size="md" icon={<ArrowLeft size={16} />}>
                Return to Homepage
              </Button>
            </Link>
            <Link href="/shop">
              <Button variant="secondary" size="md">
                Browse Full Catalog
              </Button>
            </Link>
          </div>

          <div className="pt-6 border-t border-[#E8E6E1] text-xs text-[#888888]">
            Need assistance locating a specific release?{' '}
            <Link href="/contact" className="underline hover:text-black">
              Contact our Atelier Concierge
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
