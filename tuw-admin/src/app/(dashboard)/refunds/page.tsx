'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Modal, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, FilterPills, PageHeader } from '@/components/ui';
import { RotateCcw, Search, Filter, Download, ArrowUpRight, CheckCircle2, Clock, AlertTriangle, Eye } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { RefundItem } from '@/mocks/fixtures';

export default function RefundsPage() {
  const { refunds, orders, issueRefund, canPerformAction } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RefundItem['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modals & Drawers
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundItem | null>(null);

  // Form State
  const [selectedOrderId, setSelectedOrderId] = useState(orders.find((o) => o.paidAmount > o.refundedAmount)?.id || orders[0]?.id || '');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Customer cancellation prior to printing');
  const [refundMethod, setRefundMethod] = useState('Original Payment Method');
  const [refundError, setRefundError] = useState<string | null>(null);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const availableBalance = selectedOrder ? Math.max(0, selectedOrder.paidAmount - selectedOrder.refundedAmount) : 0;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredRefunds = refunds.filter((item) => {
    const matchesSearch =
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRefunds.length / pageSize));
  const paginatedRefunds = filteredRefunds.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalRefundedSum = refunds
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setRefundError('Please enter a valid refund amount.');
      return;
    }

    const res = issueRefund({
      orderId: selectedOrderId,
      amount: amountNum,
      reason: refundReason,
      method: refundMethod,
    });

    if (!res.success) {
      setRefundError(res.error || 'Failed to issue refund.');
    } else {
      setIsIssueOpen(false);
      setRefundAmount('');
      setRefundError(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Refund ID', 'Order ID', 'Customer', 'Reason', 'Amount', 'Method', 'Date', 'Status'];
    const rows = filteredRefunds.map((r) => [
      r.id,
      r.orderId,
      `"${r.customer}"`,
      `"${r.reason}"`,
      r.amount.toFixed(2),
      `"${r.method}"`,
      `"${r.date}"`,
      r.status,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `tuw_refunds_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell pageTitle="Refunds">
      <PageHeader
        title="Refund Management"
        actions={
          <>
            <Button variant="secondary" size="md" icon={<Download size={16} />} onClick={handleExportCSV}>
              Export Log
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<RotateCcw size={16} />}
              onClick={() => {
                if (canPerformAction('refunds')) {
                  setRefundError(null);
                  setIsIssueOpen(true);
                }
              }}
            >
              Issue Refund
            </Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard
          label="Total Refunded Volume"
          value={`₹${totalRefundedSum.toLocaleString()}`}
          trend={`${refunds.length} transactions`}
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Completed Refunds"
          value={String(refunds.filter((r) => r.status === 'completed').length)}
          subtitle="Disbursed to customers"
          trendType="up"
          hoverable
        />
        <StatCard
          label="Processing / Pending"
          value={String(refunds.filter((r) => r.status === 'processing').length)}
          subtitle="Bank ACH transit"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Average Turnaround"
          value="1.2 days"
          trend="Well within 3-day SLA"
          trendType="up"
          hoverable
        />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by customer, refund ID, order #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>

          <FilterPills
            variant="pills"
            ariaLabel="Refund status filter"
            options={[
              { value: 'all', label: 'All' },
              { value: 'completed', label: 'Completed' },
              { value: 'processing', label: 'Processing' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          />
        </div>

        <Table>
          <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Refund ID</TableHead>
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
            {paginatedRefunds.map((refund) => (
              <TableRow
                key={refund.id}
                onClick={() => setSelectedRefund(refund)}
                style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer' }}
              >
                <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                  {refund.id}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 500 }}>
                  {refund.orderId}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                  {refund.customer}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {refund.reason}
                </TableCell>
                <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                  ₹{refund.amount.toLocaleString()}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {refund.method}
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  {refund.status === 'completed' && <Badge variant="success">Completed</Badge>}
                  {refund.status === 'processing' && <Badge variant="warning">Processing</Badge>}
                  {refund.status === 'rejected' && <Badge variant="danger">Rejected</Badge>}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRefund(refund); }}>
                    View
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
          totalItems={filteredRefunds.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>

      {/* Validated Refund Dialog */}
      <Modal
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        title="Issue Validated Refund"
        subtitle="Refund amounts are strictly verified against captured order balances"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setIsIssueOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleIssueSubmit}>
              Execute Refund
            </Button>
          </div>
        }
      >
        <form onSubmit={handleIssueSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {refundError && (
            <div style={{ padding: 10, borderRadius: 8, backgroundColor: 'var(--tuw-bg-error, #FEF4F4)', color: 'var(--tuw-text-error, #C91818)', fontSize: 13 }}>
              {refundError}
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Target Order
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => {
                setSelectedOrderId(e.target.value);
                setRefundError(null);
              }}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} — {o.customerName} (Paid: ${o.paidAmount.toFixed(2)}, Refunded: ${o.refundedAmount.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {selectedOrder && (
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Paid Order Amount:</span>
                <strong>${selectedOrder.paidAmount.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>
                <span>Already Refunded:</span>
                <span>${selectedOrder.refundedAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tuw-text-success, #187343)', fontWeight: 600, marginTop: 4, borderTop: '1px solid var(--tuw-border-subtle, #E5E7EB)', paddingTop: 4 }}>
                <span>Available to Refund:</span>
                <span>${availableBalance.toFixed(2)}</span>
              </div>
            </div>
          )}

          <Input
            label="Refund Amount ($ USD)"
            type="number"
            step="0.01"
            placeholder={availableBalance > 0 ? `Max: ${availableBalance.toFixed(2)}` : '0.00'}
            value={refundAmount}
            onChange={(e) => {
              setRefundAmount(e.target.value);
              setRefundError(null);
            }}
            required
          />

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Disbursement Method
            </label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
            >
              <option value="Original Payment Method">Original Payment Method (Gateway Reversal)</option>
              <option value="Store Credit Voucher">Store Credit Voucher</option>
              <option value="Manual Bank Wire Transfer">Manual Bank Wire Transfer</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Reason for Refund
            </label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
            >
              <option value="Customer cancellation prior to printing">Customer cancellation prior to printing</option>
              <option value="Defective stitching or fabric flaw">Defective stitching or fabric flaw</option>
              <option value="Carrier delay goodwill compensation">Carrier delay goodwill compensation</option>
              <option value="RMA return inspected and restocked">RMA return inspected and restocked</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Refund Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedRefund)}
        onClose={() => setSelectedRefund(null)}
        title={selectedRefund ? `Refund ${selectedRefund.id}` : 'Refund Details'}
        subtitle={selectedRefund ? `Order ${selectedRefund.orderId} · ${selectedRefund.date}` : ''}
      >
        {selectedRefund && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 16, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Refund Amount</span>
                <div className="tuw-tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>
                  ₹{selectedRefund.amount.toLocaleString()}
                </div>
              </div>
              <Badge variant={selectedRefund.status === 'completed' ? 'success' : 'warning'}>
                {selectedRefund.status}
              </Badge>
            </div>

            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 10 }}>
                Disbursement Metadata
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Recipient:</span>
                  <strong>{selectedRefund.customer}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Method:</span>
                  <span>{selectedRefund.method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Reason:</span>
                  <span>{selectedRefund.reason}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Settled Date:</span>
                  <span>{selectedRefund.date}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </DashboardShell>
  );
}
