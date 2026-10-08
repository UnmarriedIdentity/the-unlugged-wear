'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Modal, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { PackageCheck, Truck, RotateCcw, AlertTriangle, Printer, CheckCircle2, Clock } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { OrderItem } from '@/mocks/fixtures';

export default function FulfillmentPage() {
  const { orders, retryFulfillment, updateOrderStatus, canPerformAction } = useAdminState();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedIssueOrder, setSelectedIssueOrder] = useState<OrderItem | null>(null);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Fulfillment & Print Operations
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Monitor automated print routing, partner API queues (Qikink/Printrove), and resolve submission exceptions.
          </p>
        </div>
      </div>

      {/* Live Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
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
              <TableRow hoverable={false}>
                <TableHead style={{ padding: '10px 14px' }}>Order</TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Customer</TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Exception Details</TableHead>
                <TableHead style={{ padding: '10px 14px', textAlign: 'right' }}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failedOrders.map((order) => (
                <TableRow key={order.id} hoverable={false} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
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
              <TableRow hoverable={false}>
                <TableHead style={{ padding: '10px 14px' }}>Order</TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Garment Items</TableHead>
                <TableHead style={{ padding: '10px 14px' }}>Routing Partner</TableHead>
                <TableHead style={{ padding: '10px 14px', textAlign: 'right' }}>Floor Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPrintingOrders.map((order) => (
                <TableRow key={order.id} hoverable={false} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
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
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '10px 14px' }}>Order</TableHead>
              <TableHead style={{ padding: '10px 14px' }}>Customer</TableHead>
              <TableHead style={{ padding: '10px 14px' }}>Payment Status</TableHead>
              <TableHead style={{ padding: '10px 14px', textAlign: 'right' }}>Batch Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedQueuedOrders.map((order) => (
              <TableRow key={order.id} hoverable={false} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
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
                    Release to Print Floor
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
