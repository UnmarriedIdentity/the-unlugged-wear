'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Modal, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PageHeader, Checkbox } from '@/components/ui';
import { PackageCheck, Truck, RotateCcw, AlertTriangle, Printer, CheckCircle2, Clock } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { OrderItem } from '@/mocks/fixtures';

export default function FulfillmentPage() {
  const { orders, retryFulfillment, updateOrderStatus, canPerformAction, showToast } = useAdminState();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedIssueOrder, setSelectedIssueOrder] = useState<OrderItem | null>(null);

  // Per-card bulk selection (FUL2): each queue owns its scope — Retry,
  // Dispatch, and Release never mix. Sets survive pagination.
  const [failedSel, setFailedSel] = useState<Set<string>>(new Set());
  const [printingSel, setPrintingSel] = useState<Set<string>>(new Set());
  const [queuedSel, setQueuedSel] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<'failed' | 'printing' | 'queued' | null>(null);
  const [retryProgress, setRetryProgress] = useState<{ done: number; total: number } | null>(null);

  const toggleSelected = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllIn = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, ids: string[], on: boolean) => {
    setter((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (on) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const handleBulkRetry = async () => {
    if (!canPerformAction('fulfillment') || failedSel.size === 0 || bulkBusy) return;
    const ids = [...failedSel];
    setBulkBusy('failed');
    setRetryProgress({ done: 0, total: ids.length });
    let ok = 0;
    for (const id of ids) {
      const done = await retryFulfillment(id, true);
      if (done) ok++;
      setRetryProgress({ done: ok, total: ids.length });
    }
    setBulkBusy(null);
    setRetryProgress(null);
    setFailedSel(new Set());
    showToast({
      type: ok === ids.length ? 'success' : 'warning',
      title: 'Bulk Resubmission Complete',
      description: `${ok} of ${ids.length} orders resubmitted to Qikink.`,
    });
  };
  const handleBulkDispatch = () => {
    if (!canPerformAction('fulfillment') || printingSel.size === 0 || bulkBusy) return;
    const ids = [...printingSel];
    ids.forEach((id) => updateOrderStatus(id, undefined, 'shipped', true));
    setPrintingSel(new Set());
    showToast({
      type: 'success',
      title: 'Bulk Dispatch Complete',
      description: `${ids.length} order${ids.length === 1 ? '' : 's'} marked shipped from partner sync.`,
    });
  };
  const handleBulkRelease = () => {
    if (!canPerformAction('fulfillment') || queuedSel.size === 0 || bulkBusy) return;
    const ids = [...queuedSel];
    ids.forEach((id) => updateOrderStatus(id, undefined, 'printing', true));
    setQueuedSel(new Set());
    showToast({
      type: 'success',
      title: 'Batch Submitted',
      description: `${ids.length} order${ids.length === 1 ? '' : 's'} submitted to Qikink for printing.`,
    });
  };

  // Group orders by fulfillment status
  const failedOrders = orders.filter((o) => o.fulfillmentStatus === 'submission_failed');
  const printingOrders = orders.filter((o) => o.fulfillmentStatus === 'printing');
  const queuedOrders = orders.filter((o) => o.fulfillmentStatus === 'queued');
  const shippedOrders = orders.filter((o) => o.fulfillmentStatus === 'shipped' || o.fulfillmentStatus === 'delivered');

  // Pagination for printing and queued tables
  const [printingPage, setPrintingPage] = useState(1);
  const [printingPageSize, setPrintingPageSize] = useState(5);
  const totalPrintingPages = Math.max(1, Math.ceil(printingOrders.length / printingPageSize));
  const paginatedPrintingOrders = printingOrders.slice((printingPage - 1) * printingPageSize, printingPage * printingPageSize);

  const [queuedPage, setQueuedPage] = useState(1);
  const [queuedPageSize, setQueuedPageSize] = useState(5);
  const totalQueuedPages = Math.max(1, Math.ceil(queuedOrders.length / queuedPageSize));
  const paginatedQueuedOrders = queuedOrders.slice((queuedPage - 1) * queuedPageSize, queuedPage * queuedPageSize);

  const handleRetry = async (orderId: string) => {
    setRetryingId(orderId);
    await retryFulfillment(orderId);
    setRetryingId(null);
    if (selectedIssueOrder?.id === orderId) {
      setSelectedIssueOrder(null);
    }
  };

  const handleAdvanceToShipped = (orderId: string) => {
    if (!canPerformAction('fulfillment')) return;
    updateOrderStatus(orderId, undefined, 'shipped');
  };

  return (
    <DashboardShell pageTitle="Fulfillment">
      <PageHeader title="Fulfillment & Print Operations" />

      {/* Live Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard
          label="Wallet Credits"
          value="₹12,500"
          subtitle="Rs.1 = 1 credit · demo balance, live wallet connects at backend"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Submission Failed"
          value={String(failedOrders.length)}
          subtitle={failedOrders.length > 0 ? 'Requires partner retry' : 'Zero sync errors'}
          trendType={failedOrders.length > 0 ? 'down' : 'up'}
          hoverable
        />
        <StatCard
          label="Printing on Floor"
          value={String(printingOrders.length)}
          subtitle="Screenprint / DTG active"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Queued in Warehouse"
          value={String(queuedOrders.length)}
          subtitle="Awaiting allocation"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Dispatched (Delivered)"
          value={String(shippedOrders.length)}
          trend="Successful handoffs"
          trendType="up"
          hoverable
        />
      </div>

      {/* SECTION 1: Submission-Failed Exceptions */}
      {failedOrders.length > 0 && (
        <ContentCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: 6, borderRadius: 6, backgroundColor: 'var(--tuw-bg-error, #FEF4F4)' }}>
              <AlertTriangle size={20} color="var(--tuw-text-error, #C91818)" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-error, #C91818)', margin: 0 }}>
                Operational Issues & Submission Failures ({failedOrders.length})
              </h3>
              <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '2px 0 0' }}>
                Print partner webhook failures or address validation rejections requiring simulated retry.
              </p>
            </div>
          </div>

          <Table>
            <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
              {failedSel.size > 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={5} style={{ padding: '6px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Checkbox
                      bare
                      aria-label="Select all failed orders"
                      checked={failedOrders.length > 0 && failedOrders.every((o) => failedSel.has(o.id))}
                      indeterminate={failedSel.size > 0 && !failedOrders.every((o) => failedSel.has(o.id))}
                      onChange={() => selectAllIn(setFailedSel, failedOrders.map((o) => o.id), !failedOrders.every((o) => failedSel.has(o.id)))}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      {failedSel.size} selected
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<RotateCcw size={14} />}
                      disabled={bulkBusy === 'failed'}
                      onClick={handleBulkRetry}
                    >
                      {bulkBusy === 'failed' && retryProgress ? `Resubmitting ${retryProgress.done}/${retryProgress.total}…` : 'Resubmit Selected'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              ) : (
              <TableRow hoverable={false}>
                <TableHead style={{ padding: '10px 14px', width: 44 }}>
                  <Checkbox
                    bare
                    aria-label="Select all failed orders"
                    checked={failedOrders.length > 0 && failedOrders.every((o) => failedSel.has(o.id))}
                    indeterminate={failedSel.size > 0 && !failedOrders.every((o) => failedSel.has(o.id))}
                    onChange={() => selectAllIn(setFailedSel, failedOrders.map((o) => o.id), !failedOrders.every((o) => failedSel.has(o.id)))}
                  />
                </TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Order</TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Customer</TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Exception Details</TableHead>
                <TableHead style={{ padding: '10px 14px', textAlign: 'right' }}>Action</TableHead>
              </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {failedOrders.map((order) => (
                <TableRow key={order.id} hoverable={false} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <TableCell style={{ padding: '12px 14px', width: 44 }}>
                    <Checkbox
                      bare
                      aria-label={`Select order ${order.id}`}
                      checked={failedSel.has(order.id)}
                      onChange={() => toggleSelected(setFailedSel, order.id)}
                    />
                  </TableCell>
                  <TableCell style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                    {order.id}
                  </TableCell>
                  <TableCell style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)' }}>{order.customerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>{order.shippingAddress}</div>
                  </TableCell>
                  <TableCell style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 13, color: 'var(--tuw-text-error, #C91818)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} />
                      {order.timeline[0]?.note || 'Webhook gateway timeout'}
                    </span>
                  </TableCell>
                  <TableCell style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<RotateCcw size={14} className={retryingId === order.id ? 'animate-spin' : ''} />}
                      disabled={retryingId === order.id}
                      onClick={() => handleRetry(order.id)}
                    >
                      {retryingId === order.id ? 'Retrying...' : 'Retry Partner Webhook'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ContentCard>
      )}

      {/* SECTION 2: Active Floor Queue (Printing) */}
      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Printer size={20} color="var(--tuw-action-primary, #7539FF)" />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>
              Active Printing & Curing Floor ({printingOrders.length})
            </h3>
          </div>
          <span style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Synchronized with Qikink DTG Production Unit
          </span>
        </div>

        {printingOrders.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)' }}>
            No orders currently on the print floor.
          </div>
        ) : (
          <Table>
            <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
              {printingSel.size > 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={6} style={{ padding: '6px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Checkbox
                      bare
                      aria-label="Select printing orders on this page"
                      checked={paginatedPrintingOrders.length > 0 && paginatedPrintingOrders.every((o) => printingSel.has(o.id))}
                      indeterminate={printingSel.size > 0 && !paginatedPrintingOrders.every((o) => printingSel.has(o.id))}
                      onChange={() => selectAllIn(setPrintingSel, paginatedPrintingOrders.map((o) => o.id), !paginatedPrintingOrders.every((o) => printingSel.has(o.id)))}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      {printingSel.size} selected
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<CheckCircle2 size={14} />}
                      disabled={bulkBusy === 'printing'}
                      onClick={handleBulkDispatch}
                    >
                      Dispatch Selected
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              ) : (
              <TableRow hoverable={false}>
                <TableHead style={{ padding: '10px 14px', width: 44 }}>
                  <Checkbox
                    bare
                    aria-label="Select printing orders on this page"
                    checked={paginatedPrintingOrders.length > 0 && paginatedPrintingOrders.every((o) => printingSel.has(o.id))}
                    indeterminate={printingSel.size > 0 && !paginatedPrintingOrders.every((o) => printingSel.has(o.id))}
                    onChange={() => selectAllIn(setPrintingSel, paginatedPrintingOrders.map((o) => o.id), !paginatedPrintingOrders.every((o) => printingSel.has(o.id)))}
                  />
                </TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Order</TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Garment Items</TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Routing Partner</TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Partner AWB</TableHead>
                <TableHead style={{ padding: '10px 14px', textAlign: 'right' }}>Floor Action</TableHead>
              </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {paginatedPrintingOrders.map((order) => (
                <TableRow key={order.id} hoverable={false} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <TableCell style={{ padding: '12px 14px', width: 44 }}>
                    <Checkbox
                      bare
                      aria-label={`Select order ${order.id}`}
                      checked={printingSel.has(order.id)}
                      onChange={() => toggleSelected(setPrintingSel, order.id)}
                    />
                  </TableCell>
                  <TableCell style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                    {order.id}
                  </TableCell>
                  <TableCell style={{ padding: '12px 14px' }}>
                    {order.items.map((i) => (
                      <div key={i.id} style={{ fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                        <strong>{i.productName}</strong> ({i.variant}) × {i.quantity}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell style={{ padding: '12px 14px' }}>
                    <Badge variant="warning">Printing (In Progress)</Badge>
                  </TableCell>
                  <TableCell style={{ padding: '12px 14px', fontSize: 13, fontFamily: 'monospace', color: order.trackingNumber ? 'var(--tuw-text-primary, #262626)' : 'var(--tuw-text-secondary, #5D6772)' }}>
                    {order.trackingNumber ?? 'Sync pending'}
                  </TableCell>
                  <TableCell style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<CheckCircle2 size={14} />}
                      onClick={() => handleAdvanceToShipped(order.id)}
                    >
                      Complete & Dispatch
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {printingOrders.length > 0 && (
          <Pagination
            currentPage={printingPage}
            totalPages={totalPrintingPages}
            onPageChange={setPrintingPage}
            totalItems={printingOrders.length}
            pageSize={printingPageSize}
            pageSizeOptions={[5, 10, 20]}
            onPageSizeChange={(newSize) => {
              setPrintingPageSize(newSize);
              setPrintingPage(1);
            }}
          />
        )}
      </ContentCard>

      {/* SECTION 3: Queued Orders */}
      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={20} color="var(--tuw-text-secondary, #5D6772)" />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>
              Warehouse Queue ({queuedOrders.length})
            </h3>
          </div>
          <span style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Awaiting batch release to print floor
          </span>
        </div>

        <Table>
          <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
            {queuedSel.size > 0 ? (
            <TableRow hoverable={false}>
              <TableCell colSpan={5} style={{ padding: '6px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Checkbox
                    bare
                    aria-label="Select queued orders on this page"
                    checked={paginatedQueuedOrders.length > 0 && paginatedQueuedOrders.every((o) => queuedSel.has(o.id))}
                    indeterminate={queuedSel.size > 0 && !paginatedQueuedOrders.every((o) => queuedSel.has(o.id))}
                    onChange={() => selectAllIn(setQueuedSel, paginatedQueuedOrders.map((o) => o.id), !paginatedQueuedOrders.every((o) => queuedSel.has(o.id)))}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {queuedSel.size} selected
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Printer size={14} />}
                    disabled={bulkBusy === 'queued'}
                    onClick={handleBulkRelease}
                  >
                    Submit Selected to Qikink
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            ) : (
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '10px 14px', width: 44 }}>
                <Checkbox
                  bare
                  aria-label="Select queued orders on this page"
                  checked={paginatedQueuedOrders.length > 0 && paginatedQueuedOrders.every((o) => queuedSel.has(o.id))}
                  indeterminate={queuedSel.size > 0 && !paginatedQueuedOrders.every((o) => queuedSel.has(o.id))}
                  onChange={() => selectAllIn(setQueuedSel, paginatedQueuedOrders.map((o) => o.id), !paginatedQueuedOrders.every((o) => queuedSel.has(o.id)))}
                />
              </TableHead>
              <TableHead style={{ padding: '10px 14px' }}>Order</TableHead>
              <TableHead style={{ padding: '10px 14px' }}>Customer</TableHead>
              <TableHead style={{ padding: '10px 14px' }}>Payment Status</TableHead>
              <TableHead style={{ padding: '10px 14px', textAlign: 'right' }}>Batch Action</TableHead>
            </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {paginatedQueuedOrders.map((order) => (
              <TableRow key={order.id} hoverable={false} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <TableCell style={{ padding: '12px 14px', width: 44 }}>
                  <Checkbox
                    bare
                    aria-label={`Select order ${order.id}`}
                    checked={queuedSel.has(order.id)}
                    onChange={() => toggleSelected(setQueuedSel, order.id)}
                  />
                </TableCell>
                <TableCell style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                  {order.id}
                </TableCell>
                <TableCell style={{ padding: '12px 14px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                  {order.customerName}
                </TableCell>
                <TableCell style={{ padding: '12px 14px' }}>
                  <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                    {order.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Printer size={14} />}
                    onClick={() => {
                      if (canPerformAction('fulfillment')) {
                        updateOrderStatus(order.id, undefined, 'printing');
                      }
                    }}
                  >
                    Submit to Qikink
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {queuedOrders.length > 0 && (
          <Pagination
            currentPage={queuedPage}
            totalPages={totalQueuedPages}
            onPageChange={setQueuedPage}
            totalItems={queuedOrders.length}
            pageSize={queuedPageSize}
            pageSizeOptions={[5, 10, 20]}
            onPageSizeChange={(newSize) => {
              setQueuedPageSize(newSize);
              setQueuedPage(1);
            }}
          />
        )}
      </ContentCard>
    </DashboardShell>
  );
}
