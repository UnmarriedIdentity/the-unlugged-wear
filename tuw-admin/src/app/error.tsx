'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { RefreshCw, LayoutDashboard, AlertOctagon } from 'lucide-react';

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Panel Client Exception:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
          borderRadius: 'var(--tuw-radius-modal, 16px)',
          border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
          padding: '48px 32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--tuw-bg-error, #FEF4F4)',
            color: 'var(--tuw-text-error, #C91818)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertOctagon size={32} />
        </div>

        <div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--tuw-text-error, #C91818)',
            }}
          >
            System Exception
          </span>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 600,
              color: 'var(--tuw-text-primary, #262626)',
              marginTop: '6px',
            }}
          >
            Operational Interface Interruption
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--tuw-text-secondary, #5D6772)',
              lineHeight: '22px',
              marginTop: '10px',
            }}
          >
            A simulated state or render exception occurred. Baseline deterministic fixtures and
            persisted operational records remain intact.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
          <Button
            variant="primary"
            size="md"
            icon={<RefreshCw size={16} />}
            onClick={() => reset()}
          >
            Recover & Retry
          </Button>
          <Link href="/">
            <Button variant="secondary" size="md" icon={<LayoutDashboard size={16} />}>
              Return to Overview
            </Button>
          </Link>
        </div>

        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)',
            fontSize: '12px',
            color: 'var(--tuw-text-secondary, #5D6772)',
          }}
        >
          The Unplugged Wear — V2 Admin Operations Console
        </div>
      </div>
    </div>
  );
}
