import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { LayoutDashboard, ArrowLeft, FileQuestion } from 'lucide-react';

export default function AdminNotFound() {
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
          maxWidth: '480px',
          width: '100%',
          backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
          borderRadius: 'var(--tuw-radius-modal, 16px)',
          border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
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
            backgroundColor: 'var(--tuw-bg-selected, #F8F5FF)',
            color: 'var(--tuw-action-primary, #7539FF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileQuestion size={32} />
        </div>

        <div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--tuw-action-primary, #7539FF)',
            }}
          >
            404 — Operational Route
          </span>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: 'var(--tuw-text-primary, #262626)',
              marginTop: '6px',
            }}
          >
            Record or Page Not Found
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--tuw-text-secondary, #5D6772)',
              lineHeight: '22px',
              marginTop: '10px',
            }}
          >
            The administrative section, order ID, or settings partition you requested does not exist
            or may have been moved in the V2 restructuring.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
          <Link href="/">
            <Button variant="primary" size="md" icon={<LayoutDashboard size={16} />}>
              Dashboard Overview
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="secondary" size="md" icon={<ArrowLeft size={16} />}>
              Open Order Log
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
