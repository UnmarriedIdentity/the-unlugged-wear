'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Search, Download } from 'lucide-react';
import type { RefundRow, RefundableOrder } from '@tuw/heart/modules/orders';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Select, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, FilterPills, PageHeader, HeroCard, DrawerSection, KeyValueList } from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { issueRefundAction, listRefundsAction, markRefundPaidAction, refundableOrderAction, rejectRefundAction } from '@/server/money-actions';

// Refunds from the database (TL-BE-09). Prepaid money goes back to its source
// through the (demo) gateway at once; cash on delivery is paid out by staff
// and finished with the bank UTR. The server refuses anything above what is
// left, a second open payout, or a repeated click.

type ListResult = { rows: RefundRow[]; total: number; stats: { completedPaise: number; completed: number; processing: number; rejected: number } };

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
const METHOD: Record<RefundRow['method'], string> = { source: 'Original payment', upi: 'UPI payout', bank_transfer: 'Bank transfer' };
const STATUS: Record<RefundRow['status'], { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  completed: { label: 'Completed', variant: 'success' }, processing: { label: 'Paying out', variant: 'warning' }, rejected: { label: 'Rejected', variant: 'danger' },
};
const REASONS = ['Customer cancellation', 'Damaged or misprinted item', 'Item could not be printed', 'Late delivery goodwill', 'Exchange price difference', 'Other'];

export default function RefundsView({ initial, perms, openForOrder }: { initial: ListResult; perms: string[]; openForOrder?: string }) {
  const { showToast } = useAdminState();
  const router = useRouter();
  const canRefund = perms.includes('order.refund');

  const [list, setList] = useState<ListResult>(initial);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RefundRow['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<RefundRow | null>(null);

  // Issue form. One key per opening, reused on retries: a double click makes one refund.
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueKey, setIssueKey] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [found, setFound] = useState<RefundableOrder | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(REASONS[0]!);
  const [reasonOther, setReasonOther] = useState('');
  const [method, setMethod] = useState<'source' | 'upi' | 'bank_transfer'>('source');
  const [destination, setDestination] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Paying out a cash-on-delivery refund.
  const [utr, setUtr] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [detailError, setDetailError] = useState<string | null>(null);

  const request = useRef(0);
  const load = async () => {
    const mine = ++request.current;
    const result = await listRefundsAction({ q: searchTerm || undefined, status: statusFilter === 'all' ? undefined : statusFilter, page: currentPage, perPage: pageSize });
    if (mine !== request.current) return;
    if (result.ok) setList(result.data);
    else showToast({ type: 'warning', title: 'Could Not Load Refunds', description: result.error.message });
  };
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => void load(), searchTerm ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, currentPage, pageSize]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const lookUp = async (num: string) => {
    if (!num.trim()) return;
    setBusy(true);
    setFormError(null);
    const result = await refundableOrderAction({ orderNumber: num.trim() });
    setBusy(false);
    if (!result.ok) { setFound(null); setFormError(result.error.message); return; }
    setFound(result.data);
    setMethod(result.data.cashOnDelivery ? 'upi' : 'source');
    setAmount(result.data.availablePaise ? (result.data.availablePaise / 100).toFixed(2) : '');
  };

  const openIssue = (num = '') => {
    if (!canRefund) return showToast({ type: 'warning', title: 'Action Restricted', description: 'You do not have permission to refund.' });
    setIssueKey(crypto.randomUUID());
    setOrderNumber(num);
    setFound(null);
    setAmount('');
    setReason(REASONS[0]!);
    setReasonOther('');
    setDestination('');
    setFormError(null);
    setIsIssueOpen(true);
    if (num) void lookUp(num);
  };

  // Linked from Orders / Payments: open the form for that order once.
  const openedFor = useRef<string | null>(null);
  useEffect(() => {
    if (openForOrder && openedFor.current !== openForOrder) {
      openedFor.current = openForOrder;
      openIssue(openForOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openForOrder]);

  const submitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!found) return setFormError('Look up the order first.');
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setFormError('Enter an amount above zero.');
    setBusy(true);
    const result = await issueRefundAction({
      orderNumber: found.orderNumber, amount: value, method, refundKey: issueKey,
      reason: reason === 'Other' ? reasonOther.trim() || 'Other' : reason,
      destination: found.cashOnDelivery ? destination : undefined,
    });
    setBusy(false);
    if (!result.ok) {
      // Keep everything typed; show what to fix.
      setFormError(result.error.details[0]?.message ?? result.error.message);
      return;
    }
    setIsIssueOpen(false);
    showToast({
      type: 'success',
      title: result.data.status === 'completed' ? 'Refund Sent' : 'Payout Recorded',
      description: result.data.status === 'completed'
        ? `${rupees(Math.round(value * 100))} back to the original payment for ${found.orderNumber} (demo gateway — no money moves).`
        : `Send ${rupees(Math.round(value * 100))} to the customer, then mark it paid with the UTR.`,
    });
    if (openForOrder) router.replace('/refunds');
    void load();
  };

  const finishPayout = async () => {
    if (!selected) return;
    setBusy(true);
    setDetailError(null);
    const result = await markRefundPaidAction({ refundId: selected.id, payoutReference: utr });
    setBusy(false);
    if (!result.ok) return setDetailError(result.error.details[0]?.message ?? result.error.message);
    showToast({ type: 'success', title: 'Payout Completed', description: `${selected.orderNumber}: ${rupees(selected.amountPaise)} recorded with UTR ${utr.trim().toUpperCase()}.` });
    setSelected(null);
    setUtr('');
    void load();
  };
  const rejectPayout = async () => {
    if (!selected) return;
    setBusy(true);
    setDetailError(null);
    const result = await rejectRefundAction({ refundId: selected.id, note: rejectNote });
    setBusy(false);
    if (!result.ok) return setDetailError(result.error.details[0]?.message ?? result.error.message);
    showToast({ type: 'info', title: 'Payout Rejected', description: `${rupees(selected.amountPaise)} for ${selected.orderNumber} can be refunded another way.` });
    setSelected(null);
    setRejectNote('');
    void load();
  };

  const handleExportCSV = async () => {
    const result = await listRefundsAction({ q: searchTerm || undefined, status: statusFilter === 'all' ? undefined : statusFilter, page: 1, perPage: 5000 });
    if (!result.ok) return showToast({ type: 'warning', title: 'Export Failed', description: result.error.message });
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = result.data.rows.map((r) => [r.orderNumber, r.customerName, r.reason, (r.amountPaise / 100).toFixed(2), METHOD[r.method], r.status, r.payoutReference ?? '', r.destinationMasked ?? '', r.actorName, when(r.createdAt)].map(cell).join(','));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([[['Order', 'Customer', 'Reason', 'Amount', 'Method', 'Status', 'Reference', 'Paid to', 'By', 'Created'].join(','), ...rows].join('\n')], { type: 'text/csv' }));
    link.download = `tuw_refunds_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const stats = list.stats;
  const totalPages = Math.max(1, Math.ceil(list.total / pageSize));

  return (
    <DashboardShell pageTitle="Refunds">
      <PageHeader
        title="Refund Management"
        actions={
          <>
            <Button variant="secondary" size="md" icon={<Download size={16} />} onClick={() => void handleExportCSV()}>Export Log</Button>
            <Button variant="primary" size="md" icon={<RotateCcw size={16} />} onClick={() => openIssue()}>Issue Refund</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Total Refunded" value={rupees(stats.completedPaise)} trend={`${stats.completed} completed refund${stats.completed === 1 ? '' : 's'}`} trendType="neutral" hoverable />
        <StatCard label="Payouts To Send" value={String(stats.processing)} subtitle="Cash-on-delivery refunds awaiting a UTR" trendType="neutral" hoverable />
        <StatCard label="Rejected" value={String(stats.rejected)} subtitle="Payouts that did not go ahead" trendType="neutral" hoverable />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input placeholder="Search order, customer, reason, UTR…" aria-label="Search refunds" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} prefixIcon={<Search size={16} />} />
          </div>
          <FilterPills
            variant="pills"
            ariaLabel="Refund status filter"
            options={[{ value: 'all', label: 'All' }, { value: 'completed', label: 'Completed' }, { value: 'processing', label: 'Paying out' }, { value: 'rejected', label: 'Rejected' }]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Order</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Customer</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Reason</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Method</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.rows.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 14 }}>
                  {list.total === 0 && !searchTerm && statusFilter === 'all' ? 'No refunds yet.' : 'No refunds match your search.'}
                </TableCell>
              </TableRow>
            ) : list.rows.map((r) => (
              <TableRow key={r.id} onClick={() => { setSelected(r); setDetailError(null); setUtr(''); setRejectNote(''); }} style={{ cursor: 'pointer' }}>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>{r.orderNumber}</TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14 }}>{r.customerName}</TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>{r.reason}</TableCell>
                <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{rupees(r.amountPaise)}</TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>{METHOD[r.method]}</TableCell>
                <TableCell style={{ padding: '14px 16px' }}><Badge variant={STATUS[r.status].variant}>{STATUS[r.status].label}</Badge></TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(r); setDetailError(null); }}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={list.total} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }} />
      </ContentCard>

      <Drawer
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        title="Issue Refund"
        subtitle="Checked against what was paid and what has already gone back"
        width="540px"
        footer={
          <>
            <Button variant="secondary" size="md" type="button" onClick={() => setIsIssueOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" type="submit" form="refund-issue-form" disabled={busy || !found || found.availablePaise === 0}>
              {busy ? 'Working…' : found?.cashOnDelivery ? 'Record payout' : 'Refund to original payment'}
            </Button>
          </>
        }
      >
        <form id="refund-issue-form" onSubmit={submitIssue} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {formError && (
            <div role="alert" style={{ padding: 10, borderRadius: 8, backgroundColor: 'var(--tuw-bg-error, #FEF4F4)', color: 'var(--tuw-text-error, #C91818)', fontSize: 13 }}>{formError}</div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input label="Order number" placeholder="TUW-261112-K7Q4M" value={orderNumber} onChange={(e) => { setOrderNumber(e.target.value); setFound(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void lookUp(orderNumber); } }} />
            </div>
            <Button variant="secondary" size="md" type="button" disabled={busy} onClick={() => void lookUp(orderNumber)}>Look up</Button>
          </div>

          {found && (
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{found.customerName}</span><span>{found.cashOnDelivery ? 'Cash on delivery' : 'Prepaid'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid</span><strong className="tuw-tabular-nums">{rupees(found.capturedPaise)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tuw-text-secondary, #5D6772)' }}><span>Already refunded</span><span className="tuw-tabular-nums">{rupees(found.refundedPaise)}</span></div>
              {found.openPaise > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tuw-text-secondary, #5D6772)' }}><span>Being paid out</span><span className="tuw-tabular-nums">{rupees(found.openPaise)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid var(--tuw-border-subtle, #E5E7EB)', paddingTop: 4, color: 'var(--tuw-text-success, #187343)' }}><span>Available to refund</span><span className="tuw-tabular-nums">{rupees(found.availablePaise)}</span></div>
              {found.cashOnDelivery && !found.collected && <div style={{ color: 'var(--tuw-text-error, #C91818)' }}>Cash has not been collected yet. Mark it collected on the Payments screen first.</div>}
              {found.hasOpenRefund && <div style={{ color: 'var(--tuw-text-error, #C91818)' }}>A payout for this order is still open. Finish or reject it first.</div>}
            </div>
          )}

          {found && found.availablePaise > 0 && (
            <>
              <Input label="Refund amount (₹)" type="text" inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setFormError(null); }} required />
              {found.cashOnDelivery ? (
                <>
                  <Select label="Pay out by" value={method} onChange={(e) => setMethod(e.target.value as typeof method)} options={[{ value: 'upi', label: 'UPI (preferred)' }, { value: 'bank_transfer', label: 'Bank transfer' }]} />
                  <Input label={method === 'upi' ? 'Customer UPI id' : 'Customer bank account number'} placeholder={method === 'upi' ? 'name@okaxis' : 'Account number'} value={destination} onChange={(e) => setDestination(e.target.value)} helperText="Only a masked copy is saved (e.g. as***@okaxis, ••••1234)." autoComplete="off" />
                </>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>Goes back to the original card or UPI payment through the demo gateway. No money moves until the payment provider is connected.</p>
              )}
              <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} options={REASONS.map((r) => ({ value: r, label: r }))} />
              {reason === 'Other' && <Input label="Describe the reason" value={reasonOther} onChange={(e) => setReasonOther(e.target.value)} maxLength={255} />}
            </>
          )}
        </form>
      </Drawer>

      <Drawer
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Refund for ${selected.orderNumber}` : 'Refund'}
        subtitle={selected ? when(selected.createdAt) : undefined}
        footer={selected && selected.status === 'processing' && canRefund && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            {detailError && <div role="alert" style={{ fontSize: 13, color: 'var(--tuw-text-error, #C91818)' }}>{detailError}</div>}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><Input label="UTR / UPI reference" placeholder="e.g. HDFC0012345678" value={utr} onChange={(e) => setUtr(e.target.value)} autoComplete="off" /></div>
              <Button variant="primary" size="md" disabled={busy || !utr.trim()} onClick={() => void finishPayout()}>Mark paid</Button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><Input label="Or reject — reason" placeholder="e.g. Account closed" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} /></div>
              <Button variant="danger" size="md" disabled={busy || !rejectNote.trim()} onClick={() => void rejectPayout()}>Reject</Button>
            </div>
          </div>
        )}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <HeroCard badge={<Badge variant={STATUS[selected.status].variant}>{STATUS[selected.status].label}</Badge>}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Refund amount</span>
                <div className="tuw-tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>{rupees(selected.amountPaise)}</div>
              </div>
            </HeroCard>
            <DrawerSection title="Details" titleGap={10}>
              <KeyValueList
                gap={8}
                items={[
                  { label: 'Customer:', value: <strong>{selected.customerName}</strong> },
                  { label: 'Method:', value: <span>{METHOD[selected.method]}</span> },
                  ...(selected.destinationMasked ? [{ label: 'Paid to:', value: <span style={{ fontFamily: 'monospace' }}>{selected.destinationMasked}</span> }] : []),
                  { label: 'Reference:', value: <span style={{ fontFamily: 'monospace' }}>{selected.payoutReference ?? 'Not paid yet'}</span> },
                  { label: 'Reason:', value: <span>{selected.reason}</span> },
                  { label: 'Issued by:', value: <span>{selected.actorName}</span> },
                  { label: 'Last change:', value: <span>{when(selected.updatedAt)}</span> },
                ]}
              />
            </DrawerSection>
            <Button variant="secondary" size="sm" onClick={() => router.push(`/orders?open=${encodeURIComponent(selected.orderNumber)}`)}>Open order</Button>
          </div>
        )}
      </Drawer>
    </DashboardShell>
  );
}
