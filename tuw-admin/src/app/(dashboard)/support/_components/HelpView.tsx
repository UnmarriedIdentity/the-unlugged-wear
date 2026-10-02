'use client';

import React from 'react';
import { HelpCircle, MessageSquare, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
// Class map - selectors live in src/app/globals.css (single app.css, sub- prefix).
// Verbatim port of SubPages.module.css; JSX untouched for zero pixel drift.
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });
import { Button, ContentCard } from '@/components/ui';

const faqs = [
  {
    q: 'How does the automatic inventory alert work?',
    a: 'Storeflow monitors daily sales velocity against current remaining stock. When stock dips below 3 days of sales velocity, the system automatically triggers a Critical or Low stock indicator.',
  },
  {
    q: 'Can I export custom date range sales reports?',
    a: 'Yes, navigate to the Orders or Analytics tab and click "Export CSV" or "Download Report" to export detailed transaction breakdowns.',
  },
  {
    q: 'What is included in the Become Pro plan?',
    a: 'Become Pro unlocks advanced AI automation, inventory forecast models, multi-store synchronized management, and real-time customer behavioral insights.',
  },
  {
    q: 'How do I add a new team member or manager?',
    a: 'Go to Settings > Store Details and invite additional team members with role-based permissions (Store Manager, Fulfillment Staff, or Analyst).',
  },
];

export default function HelpView() {
  return (
    <DashboardShell pageTitle="Help & Support" activeNav="help">
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Help & Knowledge Base</h2>
          <p className={styles.pageSubtitle}>Find answers, reach customer support, and explore store automation guides.</p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="primary"
            size="md"
            icon={<MessageSquare size={16} />}
            onClick={() => alert('Initiating Live Support Chat...')}
          >
            <span>Contact Live Support</span>
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* AI Assistant Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #171520 0%, #2A1D4E 100%)',
            color: '#FFFFFF',
            borderRadius: 'var(--tuw-radius-card, 12px)',
            padding: '24px',
            border: '1px solid rgba(117, 57, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#CFCBFF" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', margin: 0, fontFamily: 'var(--font-main)' }}>
              Storeflow AI Assistant
            </h3>
          </div>
          <p style={{ fontSize: '14px', color: '#E2E4E6', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-main)' }}>
            Have a question about your inventory or recent order trends? Ask our 24/7 intelligent assistant directly from the top bar icon.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => alert('Opening AI Assistant Dialog...')}
            style={{
              width: 'fit-content',
              marginTop: '4px',
            }}
          >
            Ask AI Assistant
          </Button>
        </div>

        {/* Documentation Card */}
        <ContentCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="var(--tuw-action-primary, #7539FF)" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0, fontFamily: 'var(--font-main)' }}>
              Developer & Store Docs
            </h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--tuw-text-secondary, #5D6772)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-main)' }}>
            Learn how to integrate webhook triggers, automated email receipts, and external logistics carriers into Storeflow.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open('https://github.com/UnmarriedIdentity/the-unplugged-wear', '_blank')}
            style={{ width: 'fit-content' }}
          >
            <span>Read API Documentation</span>
            <ExternalLink size={14} style={{ marginLeft: 4 }} />
          </Button>
        </ContentCard>
      </div>

      {/* Frequently Asked Questions */}
      <ContentCard style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={20} color="var(--tuw-action-primary, #7539FF)" />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0, fontFamily: 'var(--font-main)' }}>
            Frequently Asked Questions
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                borderRadius: 'var(--tuw-radius-control, 8px)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0, fontFamily: 'var(--font-main)' }}>
                {faq.q}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--tuw-text-secondary, #5D6772)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-main)' }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </ContentCard>
    </DashboardShell>
  );
}
