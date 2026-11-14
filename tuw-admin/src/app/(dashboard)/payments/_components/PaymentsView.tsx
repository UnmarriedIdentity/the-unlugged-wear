'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Search, Banknote } from 'lucide-react';
import type { PaymentRow } from '@tuw/heart/modules/orders';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PageHeader, HeroCard, KeyValueList, FilterPills } from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { listPaymentsAction, markCodCollectedAction } from '@/server/money-actions';

// Payments from the database (TL-BE-09). Only the demo gateway exists until
// the integrations phase, so no money moves; every figure is still real data.

type ListResult = { rows: PaymentRow[]; total: number; stats: { capturedPaise: number; pendingPaise: number; pendingCount: number; refundedPaise: number } };
type ProviderCard = { slug: string; name: string; environment: 'sandbox' | 'live'; isActive: boolean; hasAdapter: boolean };

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : '—');
const METHOD: Record<string, string> = { card: 'Card', upi: 'UPI', cod: 'Cash on delivery', netbanking: 'Netbanking', wallet: 'Wallet' };
const STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  captured: { label: 'Captured', variant: 'success' }, pending: { label: 'Pending', variant: 'warning' }, authorized: { label: 'Authorized', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' }, refunded: { label: 'Refunded', variant: 'neutral' },
};

export default function PaymentsView({ initial, providers, perms }: { initial: ListResult; providers: ProviderCard[]; perms: string[] }) {
  const { showToast } = useAdminState();
  const router = useRouter();
  const canRefund = perms.includes('order.refund');
  const [list, setList] = useState<ListResult>(initial);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const [collecting, setCollecting] = useState(false);

  const request = useRef(0);
  const load = async (over: Partial<{ page: number; perPage: number }> = {}) => {
    const mine = ++request.current;
    const result = await listPaymentsAction({ q: searchTerm || undefined, status: status === 'all' ? undefined : status, page: currentPage, perPage: pageSize, ...over });
    if (mine !== request.current) return;
    if (result.ok) setList(result.data);
    else showToast({ type: 'warning', title: 'Could Not Load Payments', description: result.error.message });
  };
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => void load(), searchTerm ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, status, currentPage, pageSize]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, status]);

  const handleExportCSV = async () => {
    const result = await listPaymentsAction({ q: searchTerm || undefined, status: status === 'all' ? undefined : status, page: 1, perPage: 5000 });
    if (!result.ok) return showToast({ type: 'warning', title: 'Export Failed', description: result.error.message });
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = result.data.rows.map((p) => [p.orderNumber, p.customerName, METHOD[p.method] ?? p.method, p.provider, (p.amountPaise / 100).toFixed(2), (p.refundedPaise / 100).toFixed(2), p.status, p.transactionId ?? '', when(p.paidAt)].map(cell).join(','));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([[['Order', 'Customer', 'Method', 'Provider', 'Amount', 'Refunded', 'Status', 'Reference', 'Paid at'].join(','), ...rows].join('\n')], { type: 'text/csv' }));
    link.download = `tuw_payments_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const collect = async () => {
    if (!selected) return;
    setCollecting(true);
    const result = await markCodCollectedAction({ orderNumber: selected.orderNumber });
    setCollecting(false);
    if (!result.ok) return showToast({ type: 'warning', title: 'Not Recorded', description: result.error.message });
    showToast({ type: 'success', title: 'Cash Collected', description: `${selected.orderNumber} is now paid and can be refunded if needed.` });
    setSelected({ ...selected, status: 'captured', paidAt: new Date().toISOString() });
    void load();
  };

  const stats = list.stats;
  const totalPages = Math.max(1, Math.ceil(list.total / pageSize));

  return (
    <DashboardShell pageTitle="Payments">
      <PageHeader
        title="Payment Transactions & Gateways"
        actions={<Button variant="secondary" size="md" icon={<Download size={16} />} onClick={() => void handleExportCSV()}><span>Export Payments CSV</span></Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Captured Volume" value={rupees(stats.capturedPaise)} trend="Card, UPI and collected cash" trendType="up" hoverable />
        <StatCard label="Cash To Collect" value={rupees(stats.pendingPaise)} subtitle={`${stats.pendingCount} cash-on-delivery order${stats.pendingCount === 1 ? '' : 's'}`} trendType="neutral" hoverable />
        <StatCard label="Total Refunded" value={rupees(stats.refundedPaise)} subtitle="Completed refunds" trendType="neutral" hoverable />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {providers.map((p) => (
          <div key={p.slug} style={{ padding: 18, backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)', border: '1px solid var(--tuw-border-subtle, #E2E4E6)', borderRadius: 'var(--tuw-radius-card, 12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>{p.name}</span>
              <Badge variant={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Active' : 'Off'}</Badge>
            </div>
            <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '6px 0 0' }}>
              {p.slug === 'mock' ? 'Demo gateway: checkout works end to end, and no money is collected.' : p.hasAdapter ? `${p.environment === 'live' ? 'Live' : 'Sandbox'} environment.` : 'Connects in the integrations phase.'}
            </p>
          </div>
        ))}
        <div style={{ padding: 18, border: '1px dashed var(--tuw-border-subtle, #E2E4E6)', borderRadius: 'var(--tuw-radius-card, 12px)', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
          Switch providers in <Link href="/settings/payments" style={{ color: 'var(--tuw-action-primary, #7539FF)' }}>Settings → Payments</Link>.
        </div>
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input placeholder="Search order, customer, reference…" aria-label="Search payments" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} prefixIcon={<Search size={16} />} />
          </div>
          <FilterPills
            variant="pills"
            ariaLabel="Payment status filter"
            options={[{ value: 'all', label: 'All' }, { value: 'captured', label: 'Captured' }, { value: 'pending', label: 'Cash to collect' }, { value: 'refunded', label: 'Refunded' }]}
            value={status}
            onChange={setStatus}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Order</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Customer</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Method</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Refunded</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.rows.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 14 }}>
                  {list.total === 0 && !searchTerm && status === 'all' ? 'No payments yet. They appear as soon as a customer checks out.' : 'No payments match your search.'}
                </TableCell>
              </TableRow>
            ) : list.rows.map((p) => (
              <TableRow key={p.id} onClick={() => setSelected(p)} style={{ cursor: 'pointer' }}>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>{p.orderNumber}</TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>{p.customerName}</TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>{METHOD[p.method] ?? p.method}</TableCell>
                <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{rupees(p.amountPaise)}</TableCell>
                <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 13, textAlign: 'right', color: 'var(--tuw-text-secondary, #5D6772)' }}>{p.refundedPaise ? rupees(p.refundedPaise) : '—'}</TableCell>
                <TableCell style={{ padding: '14px 16px' }}><Badge variant={STATUS[p.status]?.variant ?? 'neutral'}>{STATUS[p.status]?.label ?? p.status}</Badge></TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(p); }}>Details</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={list.total} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }} />
      </ContentCard>

      <Drawer
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Payment for ${selected.orderNumber}` : 'Payment'}
        subtitle={selected ? when(selected.createdAt) : undefined}
        footer={selected && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={() => router.push(`/orders?open=${encodeURIComponent(selected.orderNumber)}`)}>Open order</Button>
            <div style={{ display: 'flex', gap: 8 }}>
              {selected.method === 'cod' && selected.status === 'pending' && selected.orderStatus !== 'cancelled' && (
                <Button variant="primary" size="sm" icon={<Banknote size={14} />} disabled={!canRefund || collecting} title={canRefund ? undefined : 'Needs the refund permission'} onClick={() => void collect()}>
                  {collecting ? 'Recording…' : 'Mark cash collected'}
                </Button>
              )}
              {(selected.status === 'captured') && (
                <Button variant="secondary" size="sm" onClick={() => router.push(`/refunds?order=${encodeURIComponent(selected.orderNumber)}`)}>Refund…</Button>
              )}
            </div>
          </div>
        )}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <HeroCard badge={<Badge variant={STATUS[selected.status]?.variant ?? 'neutral'}>{STATUS[selected.status]?.label ?? selected.status}</Badge>}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Amount</span>
                <div className="tuw-tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>{rupees(selected.amountPaise)}</div>
              </div>
            </HeroCard>
            <KeyValueList
              items={[
                { label: 'Customer:', value: <strong>{selected.customerName}</strong> },
                { label: 'Email:', value: <span>{selected.customerEmail || '—'}</span> },
                { label: 'Method:', value: <span>{METHOD[selected.method] ?? selected.method}</span> },
                { label: 'Provider:', value: <span>{selected.provider === 'mock' ? 'Demo gateway (no money collected)' : selected.provider}</span> },
                { label: 'Gateway reference:', value: <span style={{ fontFamily: 'monospace' }}>{selected.transactionId ?? '—'}</span> },
                { label: 'Paid at:', value: <span>{when(selected.paidAt)}</span> },
                { label: 'Refunded:', value: <span className="tuw-tabular-nums">{selected.refundedPaise ? rupees(selected.refundedPaise) : '—'}</span> },
              ]}
            />
            {selected.method === 'cod' && selected.status === 'pending' && (
              <p style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>Mark the cash collected once the courier hands it over. Only collected cash can be refunded.</p>
            )}
          </div>
        )}
      </Drawer>
    </DashboardShell>
  );
}
