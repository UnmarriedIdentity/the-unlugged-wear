'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Storefront Client Render Exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] text-[#1A1A1A] px-4 py-16 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FEF4F4] text-[#C91818] flex items-center justify-center">
          <AlertCircle size={28} />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#C91818] font-semibold">
            System Notice
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1A1A1A]">
            Temporary Connection Pause
          </h1>
          <p className="text-sm text-[#5D6772] leading-relaxed">
            An unexpected client render state occurred. No transactions were processed and your saved
            bag items remain safe in local browser storage.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            icon={<RefreshCw size={16} />}
            onClick={() => reset()}
          >
            Retry Connection
          </Button>
          <Link href="/">
            <Button variant="secondary" size="md" icon={<ArrowLeft size={16} />}>
              Return Home
            </Button>
          </Link>
        </div>

        <div className="pt-6 border-t border-[#E8E6E1] text-xs text-[#888888]">
          Demo Error Sandbox · The Unplugged Wear
        </div>
      </div>
    </div>
  );
}
