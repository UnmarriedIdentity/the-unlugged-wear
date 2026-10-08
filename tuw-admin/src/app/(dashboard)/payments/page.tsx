'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { CreditCard, Download, Search, Filter, ShieldCheck, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { OrderItem } from '@/mocks/fixtures';

export default function PaymentsPage() {
  const { orders } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState<OrderItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Derived metrics
  const paidOrders = orders.filter((o) => o.paidAmount > 0);
  const totalSettled = paidOrders.reduce((sum, o) => sum + o.paidAmount, 0);
  const pendingOrders = orders.filter((o) => o.paymentStatus === 'pending');
  const totalPending = pendingOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRefunded = orders.reduce((sum, o) => sum + o.refundedAmount, 0);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredOrders = orders.filter((o) =>
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const headers = ['Order Ref', 'Customer', 'Method', 'Paid Amount', 'Refunded Amount', 'Payment Status', 'Date'];
    const rows = filteredOrders.map((o) => [
      o.id,
      `"${o.customerName}"`,
      `"${o.paymentMethod}"`,
      o.paidAmount.toFixed(2),
      o.refundedAmount.toFixed(2),
      o.paymentStatus,
      `"${o.date}"`,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `tuw_payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell pageTitle="Payments">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Payment Transactions & Gateways
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Review merchant settlement logs, payment gateway captures (Stripe/PayPal), and fee schedules.
          </p>
        </div>
        <Button variant="secondary" size="md" icon={<Download size={16} />} onClick={handleExportCSV}>
          <span>Export Payouts CSV</span>
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Settled Volume" value={`₹${totalSettled.toLocaleString()}`} trend="Captured merchant volume" trendType="up" hoverable />
        <StatCard label="Pending Settlements" value={`₹${totalPending.toLocaleString()}`} subtitle={`${pendingOrders.length} orders awaiting auth`} trendType="neutral" hoverable />
        <StatCard label="Dispute Ratio" value="0.00%" trend="Zero chargebacks recorded" trendType="up" hoverable />
        <StatCard label="Total Refunded" value={`₹${totalRefunded.toLocaleString()}`} subtitle="Disbursed return adjustments" trendType="neutral" hoverable />
      </div>

      {/* Gateway Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ padding: 18, backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)', border: '1px solid var(--tuw-border-subtle, #E2E4E6)', borderRadius: 'var(--tuw-radius-card, 12px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>Stripe Payments</span>
            <Badge variant="success">Operational</Badge>
          </div>
          <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '6px 0 12px' }}>
            Direct credit/debit card processing & Apple Pay tokenization.
          </p>
          <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Next automatic bank transfer in 24 hours.</div>
        </div>

        <div style={{ padding: 18, backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)', border: '1px solid var(--tuw-border-subtle, #E2E4E6)', borderRadius: 'var(--tuw-radius-card, 12px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>PayPal Commerce</span>
            <Badge variant="success">Connected</Badge>
          </div>
          <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '6px 0 12px' }}>
            Global buyer protection, PayPal Express, and Venmo options.
          </p>
          <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Instant disbursement active.</div>
        </div>
      </div>

      {/* Transactions List */}
      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Table>
          <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Tx Ref</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Customer</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Payment Method</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow
                key={order.id}
                onClick={() => setSelectedTx(order)}
                style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer' }}
              >
                <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                  {order.id}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                  {order.customerName}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {order.paymentMethod}
                </TableCell>
                <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                  ₹{order.total.toLocaleString()}
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  {order.paymentStatus === 'paid' && <Badge variant="success">Paid</Badge>}
                  {order.paymentStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
                  {order.paymentStatus === 'failed' && <Badge variant="danger">Failed</Badge>}
                  {order.paymentStatus === 'refunded' && <Badge variant="neutral">Refunded</Badge>}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTx(order); }}>
                    View Receipt
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>

      {/* Transaction Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        title={selectedTx ? `Transaction ${selectedTx.id}` : 'Transaction Details'}
        subtitle={selectedTx?.date}
      >
        {selectedTx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 16, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Settled Value</span>
                <div className="tuw-tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>
                  ₹{selectedTx.total.toLocaleString()}
                </div>
              </div>
              <Badge variant={selectedTx.paymentStatus === 'paid' ? 'success' : 'warning'}>
                {selectedTx.paymentStatus}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Customer:</span>
                <strong>{selectedTx.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Method:</span>
                <span>{selectedTx.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Gateway Reference:</span>
                <span style={{ fontFamily: 'monospace' }}>ch_mock_3N9A8s12984</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Fraud Risk Score:</span>
                <span style={{ color: 'var(--tuw-text-success, #187343)', fontWeight: 600 }}>0.02 (Low Risk)</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </DashboardShell>
  );
}
