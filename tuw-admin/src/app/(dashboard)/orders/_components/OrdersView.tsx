'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Search, Eye, RotateCcw, Clock, Printer, ChevronDown } from 'lucide-react';
import type { AdminOrderDetail, AdminOrderRow, AdminOrderStats, AdminOrderTab, OrderStatus } from '@tuw/heart/modules/orders';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  StatCard,
  ContentCard,
  Button,
  Badge,
  Checkbox,
  Input,
  Drawer,
  Pagination,
  FilterPills,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PageHeader,
  DropdownMenu,
  PanelLayout,
  DrawerSection,
  ItemsRow,
} from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { getOrderAction, listOrdersAction, setOrderStatusAction, setOrdersStatusAction } from '@/server/order-actions';

// Orders from the database (TL-BE-08). The server filters, searches and
// pages; every status change is checked there and written with its history.
// Refunds arrive with the payments task (TL-BE-09); partner sync with TL-BE-11.

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

type ListResult = { rows: AdminOrderRow[]; total: number; stats: AdminOrderStats };

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Printing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', failed: 'Partner sync failed', refunded: 'Refunded',
};
const STATUS_BADGE: Record<OrderStatus, 'success' | 'warning' | 'info' | 'danger' | 'neutral'> = {
  pending: 'warning', confirmed: 'neutral', processing: 'warning', shipped: 'success', delivered: 'info', cancelled: 'neutral', failed: 'danger', refunded: 'neutral',
};
const PAYMENT_LABEL: Record<AdminOrderRow['paymentStatus'], string> = { paid: 'Paid', pending: 'Pending', failed: 'Failed', refunded: 'Refunded' };
const PAYMENT_BADGE: Record<AdminOrderRow['paymentStatus'], 'success' | 'warning' | 'danger' | 'neutral'> = { paid: 'success', pending: 'warning', failed: 'danger', refunded: 'neutral' };
const METHOD_LABEL: Record<string, string> = { card: 'Card', upi: 'UPI', cod: 'Cash on delivery', netbanking: 'Netbanking', wallet: 'Wallet' };
/** What the button says for each move a staff member can make. */
const MOVE_LABEL: Partial<Record<OrderStatus, string>> = { confirmed: 'Confirm order', processing: 'Mark printing', shipped: 'Mark shipped', delivered: 'Mark delivered', cancelled: 'Cancel order' };

export default function OrdersView({ initial, perms }: { initial: ListResult; perms: string[] }) {
  const { showToast } = useAdminState();
  const canUpdate = perms.includes('order.update_status');
  const canRefund = perms.includes('order.refund');

  const [list, setList] = useState<ListResult>(initial);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderTab, setOrderTab] = useState<AdminOrderTab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [moving, setMoving] = useState(false);

  // Ask the server whenever the view changes; a slower, older answer never wins.
  const request = useRef(0);
  const load = async (over: Partial<{ q: string; tab: AdminOrderTab; page: number; perPage: number }> = {}) => {
    const mine = ++request.current;
    setLoading(true);
    const result = await listOrdersAction({ q: searchTerm || undefined, tab: orderTab, page: currentPage, perPage: pageSize, ...over });
    if (mine !== request.current) return;
    setLoading(false);
    if (result.ok) setList(result.data);
    else showToast({ type: 'warning', title: 'Could Not Load Orders', description: result.error.message });
  };
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => void load(), searchTerm ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, orderTab, currentPage, pageSize]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, orderTab]);

  const rows = list.rows;
  const totalPages = Math.max(1, Math.ceil(list.total / pageSize));
  const pageIds = rows.map((o) => o.orderNumber);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const toggleId = (id: string) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const togglePage = () => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (pageIds.every((id) => next.has(id))) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    return next;
  });
  const clearSelection = () => setSelectedIds(new Set());

  const openOrder = async (orderNumber: string) => {
    if (openingId) return;
    setOpeningId(orderNumber);
    const result = await getOrderAction({ orderNumber });
    setOpeningId(null);
    if (!result.ok) return showToast({ type: 'warning', title: 'Could Not Open Order', description: result.error.message });
    setNote('');
    setConfirmCancel(false);
    setDetail(result.data);
  };

  const move = async (to: OrderStatus) => {
    if (!detail) return;
    setMoving(true);
    const result = await setOrderStatusAction({ orderNumber: detail.orderNumber, to, note: note || undefined });
    setMoving(false);
    setConfirmCancel(false);
    if (!result.ok) return showToast({ type: 'warning', title: 'Status Not Changed', description: result.error.message });
    setDetail(result.data);
    setNote('');
    showToast({ type: 'success', title: 'Order Updated', description: `${detail.orderNumber} is now ${STATUS_LABEL[to].toLowerCase()}${to === 'cancelled' && result.data.paymentStatus === 'refunded' ? ' and refunded (demo payment)' : ''}.` });
    void load();
  };

  const toCsv = (data: AdminOrderRow[]) => {
    const headers = ['Order', 'Date', 'Customer', 'Email', 'Status', 'Payment', 'Method', 'Total', 'Paid', 'Refunded', 'Items'];
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const body = data.map((o) => [o.orderNumber, when(o.createdAt), o.customerName, o.customerEmail, o.status, o.paymentStatus, o.paymentMethod ?? '', (o.totalPaise / 100).toFixed(2), (o.paidPaise / 100).toFixed(2), (o.refundedPaise / 100).toFixed(2), o.itemCount].map(cell).join(','));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([[headers.join(','), ...body].join('\n')], { type: 'text/csv' }));
    link.download = `tuw_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const handleExportCSV = async () => {
    const result = await listOrdersAction({ q: searchTerm || undefined, tab: orderTab, page: 1, perPage: 5000 });
    if (!result.ok) return showToast({ type: 'warning', title: 'Export Failed', description: result.error.message });
    toCsv(result.data.rows);
    showToast({ type: 'success', title: 'Orders Exported', description: `${result.data.rows.length} order${result.data.rows.length === 1 ? '' : 's'} saved as CSV.` });
  };
  const handleExportSelected = () => {
    toCsv(rows.filter((o) => selectedIds.has(o.orderNumber)));
    clearSelection();
  };
  const handlePrintSelected = () => {
    showToast({ type: 'info', title: 'Demo Print Queue', description: `${selectedIds.size} invoice${selectedIds.size === 1 ? '' : 's'} staged — GST invoices arrive with the invoices task; no printer is connected.` });
    clearSelection();
  };

  const handleBulkMark = async (value: string) => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    if (!canUpdate) return showToast({ type: 'warning', title: 'Action Restricted', description: 'You do not have permission to update orders.' });
    const result = await setOrdersStatusAction({ orderNumbers: ids, to: value as OrderStatus });
    if (!result.ok) return showToast({ type: 'warning', title: 'Bulk Update Failed', description: result.error.message });
    const { updated, refused } = result.data;
    showToast({
      type: refused.length ? 'warning' : 'success',
      title: refused.length ? 'Some Orders Not Changed' : 'Bulk Update Applied',
      description: `${updated.length} marked ${STATUS_LABEL[value as OrderStatus].toLowerCase()}.${refused.length ? ` ${refused.length} refused — ${refused[0]!.orderNumber}: ${refused[0]!.reason}` : ''}`,
    });
    clearSelection();
    void load();
  };

  const stats = list.stats;
  const nextMoves = detail ? detail.allowedNext.filter((s) => s !== 'cancelled') : [];
  const canCancelHere = detail ? detail.allowedNext.includes('cancelled') : false;
  const cancelNeedsRefund = detail ? detail.paymentStatus === 'paid' : false;

  return (
    <DashboardShell pageTitle="Orders" activeNav="orders">
      <PageHeader
        title="Order Management"
        actions={
          <Button variant="secondary" size="md" icon={<Download size={16} />} onClick={() => void handleExportCSV()}>
            <span>Export CSV</span>
          </Button>
        }
      />

      <div className={styles.statGrid}>
        <StatCard label="Total Revenue" value={rupees(stats.revenuePaise)} trend={`${stats.total} orders recorded`} trendType="up" hoverable />
        <StatCard label="Active Queue" value={String(stats.activeQueue)} subtitle="Pending, confirmed & printing" trendType="neutral" hoverable />
        <StatCard label="Delivered" value={String(stats.delivered)} trend="Successful completions" trendType="up" hoverable />
        <StatCard label="Operational Issues" value={String(stats.issues)} subtitle={stats.issues > 0 ? 'Partner sync failed — retry' : 'No sync errors'} trendType={stats.issues > 0 ? 'down' : 'up'} hoverable />
      </div>

      <ContentCard>
        <PanelLayout
          scrollable={false}
          header={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <FilterPills
                  variant="pills"
                  ariaLabel="Order status tabs"
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'unfulfilled', label: 'Unfulfilled' },
                    { value: 'unpaid', label: 'Unpaid' },
                    { value: 'cancelled', label: 'Cancelled' },
                    { value: 'finished', label: 'Delivered' },
                  ]}
                  value={orderTab}
                  onChange={(v) => setOrderTab(v as AdminOrderTab)}
                />
                <div style={{ maxWidth: 360, width: '100%' }}>
                  <Input placeholder="Search by order #, customer, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} prefixIcon={<Search size={16} />} aria-label="Search orders" />
                </div>
              </div>
            </div>
          }
          footer={
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={list.total}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }}
            />
          }
        >
          <Table aria-busy={loading}>
            <TableHeader>
              {selectedIds.size > 0 ? (
                <TableRow hoverable={false}>
                  <TableCell colSpan={9} style={{ padding: '6px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <Checkbox bare aria-label="Select all orders on this page" checked={allPageSelected} indeterminate={!allPageSelected && somePageSelected} onChange={togglePage} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>{selectedIds.size} selected</span>
                      <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportSelected}>Export selected</Button>
                      <Button variant="secondary" size="sm" icon={<Printer size={14} />} onClick={handlePrintSelected}>Print invoices</Button>
                      <DropdownMenu
                        ariaLabel="Mark selected orders as"
                        trigger={
                          <Button variant="secondary" size="sm" onClick={() => {}}>
                            <span>Mark as</span>
                            <ChevronDown size={14} style={{ marginLeft: 4 }} />
                          </Button>
                        }
                        items={[
                          { value: 'confirmed', label: 'Confirmed' },
                          { value: 'processing', label: 'Printing' },
                          { value: 'shipped', label: 'Shipped' },
                          { value: 'delivered', label: 'Delivered' },
                          { value: 'cancelled', label: 'Cancel orders', danger: true },
                        ]}
                        onSelect={(v) => void handleBulkMark(v)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow hoverable={false}>
                  <TableHead style={{ padding: '12px 16px', width: 44 }}>
                    <Checkbox bare aria-label="Select all orders on this page" checked={allPageSelected} indeterminate={!allPageSelected && somePageSelected} onChange={togglePage} />
                  </TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Order</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Date</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Customer</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Payment</TableHead>
                  <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Items</TableHead>
                  <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Action</TableHead>
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow hoverable={false}>
                  <TableCell colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 16 }}>
                    {loading ? 'Loading orders…' : list.stats.total === 0 ? 'No orders yet. They appear here as soon as a customer checks out.' : 'No orders match your search criteria.'}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((order) => (
                  <TableRow
                    key={order.orderNumber}
                    onClick={() => void openOrder(order.orderNumber)}
                    style={{ cursor: 'pointer', backgroundColor: selectedIds.has(order.orderNumber) ? 'var(--tuw-bg-canvas, #F7F8F9)' : 'transparent' }}
                  >
                    <TableCell style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <Checkbox bare aria-label={`Select order ${order.orderNumber}`} checked={selectedIds.has(order.orderNumber)} onChange={() => toggleId(order.orderNumber)} />
                    </TableCell>
                    <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>{order.orderNumber}</TableCell>
                    <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>{when(order.createdAt)}</TableCell>
                    <TableCell style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)' }}>{order.customerName}{order.isGuest ? ' · guest' : ''}</div>
                      <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>{order.customerEmail}</div>
                    </TableCell>
                    <TableCell style={{ padding: '14px 16px' }}>
                      <Badge variant={PAYMENT_BADGE[order.paymentStatus]}>{PAYMENT_LABEL[order.paymentStatus]}</Badge>
                    </TableCell>
                    <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>{rupees(order.totalPaise)}</TableCell>
                    <TableCell style={{ padding: '14px 16px' }}>
                      <Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                    </TableCell>
                    <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>{order.itemCount}</TableCell>
                    <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <Button variant="secondary" size="sm" icon={<Eye size={14} />} onClick={(e) => { e.stopPropagation(); void openOrder(order.orderNumber); }}>
                        {openingId === order.orderNumber ? 'Opening…' : 'Details'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </PanelLayout>
      </ContentCard>

      <Drawer
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Order ${detail.orderNumber}` : 'Order Detail'}
        subtitle={detail ? when(detail.createdAt) : undefined}
        footer={
          detail && canUpdate && (detail.allowedNext.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <Input label="Note for the history (optional)" placeholder="e.g. Out of blanks in XL" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
              {confirmCancel ? (
                <div role="group" aria-label="Confirm cancellation" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                    {cancelNeedsRefund ? `Cancel and refund ${rupees(detail.paidPaise - detail.refundedPaise)} to the original payment (demo)?` : 'Cancel this order?'}
                  </span>
                  <Button variant="danger" size="sm" disabled={moving} onClick={() => void move('cancelled')}>{moving ? 'Cancelling…' : 'Yes, cancel'}</Button>
                  <Button variant="secondary" size="sm" disabled={moving} onClick={() => setConfirmCancel(false)}>Keep order</Button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {canCancelHere && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={moving || (cancelNeedsRefund && !canRefund)}
                        title={cancelNeedsRefund && !canRefund ? 'Cancelling a paid order refunds it; you need the refund permission.' : undefined}
                        onClick={() => setConfirmCancel(true)}
                      >
                        Cancel order
                      </Button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {nextMoves.map((to) => (
                      <Button key={to} variant="primary" size="sm" disabled={moving} icon={detail.status === 'failed' && to === 'confirmed' ? <RotateCcw size={14} /> : undefined} onClick={() => void move(to)}>
                        {detail.status === 'failed' && to === 'confirmed' ? 'Retry partner sync' : MOVE_LABEL[to]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {cancelNeedsRefund && !canRefund && canCancelHere && (
                <p style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>Cancelling a paid order refunds it, so it needs the refund permission.</p>
              )}
            </div>
          )
        }
      >
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--tuw-text-secondary, #5D6772)', display: 'block' }}>Payment</span>
                <Badge variant={PAYMENT_BADGE[detail.paymentStatus]}>{PAYMENT_LABEL[detail.paymentStatus]}</Badge>
                <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>{METHOD_LABEL[detail.paymentMethod ?? ''] ?? '—'} · demo gateway</div>
              </div>
              <div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--tuw-text-secondary, #5D6772)', display: 'block' }}>Status</span>
                <Badge variant={STATUS_BADGE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
                {detail.status === 'pending' && detail.cancellableUntil && (
                  <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>Customer may cancel until {when(detail.cancellableUntil)}</div>
                )}
              </div>
            </div>

            <DrawerSection title={`Items Purchased (${detail.lines.length})`} titleGap={12}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {detail.lines.map((item) => (
                  <ItemsRow
                    key={item.id}
                    left={
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>{item.variant} · Qty: {item.qty} · {item.sku}</div>
                      </div>
                    }
                    right={<div className="tuw-tabular-nums" style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>{rupees(item.unitPaise * item.qty)}</div>}
                  />
                ))}
              </div>
            </DrawerSection>

            <div style={{ padding: 16, border: '1px solid var(--tuw-border-subtle, #E5E7EB)', borderRadius: 10 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--tuw-text-primary, #262626)' }}>Financial Summary (stored at checkout)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                {[
                  ['Subtotal', rupees(detail.subtotalPaise)],
                  ...(detail.discountPaise ? [[`Discount${detail.discountCode ? ` (${detail.discountCode})` : ''}`, `−${rupees(detail.discountPaise)}`]] : []),
                  ['Delivery', detail.shippingPaise ? rupees(detail.shippingPaise) : 'Free'],
                  ...(detail.taxPaise ? [['GST', rupees(detail.taxPaise)]] : []),
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>{label}</span>
                    <span className="tuw-tabular-nums">{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14, borderTop: '1px solid var(--tuw-border-subtle, #E5E7EB)', paddingTop: 6, marginTop: 4 }}>
                  <span>Grand Total</span>
                  <span className="tuw-tabular-nums">{rupees(detail.totalPaise)}</span>
                </div>
                {detail.refundedPaise > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tuw-text-error, #C91818)', fontWeight: 500 }}>
                    <span>Total Refunded</span>
                    <span className="tuw-tabular-nums">−{rupees(detail.refundedPaise)}</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', margin: '10px 0 0' }}>Partial refunds arrive with the payments task. Cancelling refunds the full payment.</p>
            </div>

            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--tuw-text-primary, #262626)' }}>Customer & Shipping Address</h4>
              <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', lineHeight: 1.6 }}>
                <div><strong>{detail.customerName}</strong>{detail.isGuest ? ' (guest checkout)' : ''}</div>
                <div>{detail.customerEmail}</div>
                <div>{detail.customerPhone}</div>
                <div style={{ marginTop: 4 }}>{detail.shippingAddress}</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--tuw-text-primary, #262626)' }}>Order Timeline</h4>
              <ol style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
                {detail.history.map((evt, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: 10 }}>
                    <Clock size={16} color="var(--tuw-action-primary, #7539FF)" style={{ marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                        {evt.from && evt.from !== evt.to ? `${STATUS_LABEL[evt.from]} → ${STATUS_LABEL[evt.to]}` : evt.from ? 'Note' : 'Order placed'}{' '}
                        <span style={{ fontWeight: 400, color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 11 }}>({when(evt.at)} · {evt.actor === 'guest' ? 'customer (guest)' : evt.actor})</span>
                      </div>
                      {evt.note && <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>{evt.note}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Drawer>
    </DashboardShell>
  );
}
