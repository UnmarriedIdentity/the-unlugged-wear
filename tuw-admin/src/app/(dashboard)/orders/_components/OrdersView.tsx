'use client';

import React, { useState } from 'react';
import { Download, Filter, Plus, Search, Eye, CheckCircle2, RotateCcw, AlertTriangle, Truck, Clock, X } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  StatCard,
  ContentCard,
  Button,
  Badge,
  Input,
  Drawer,
  Modal,
  Pagination,
} from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { OrderItem, PaymentStatus, FulfillmentStatus } from '@/mocks/fixtures';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

export default function OrdersView() {
  const { orders, products, updateOrderStatus, createOrder, issueRefund, retryFulfillment, canPerformAction, activeRole } = useAdminState();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'all' | FulfillmentStatus>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Drawer & Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState('Customer return / exchange');
  const [refundError, setRefundError] = useState<string | null>(null);

  // New Order Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newShippingAddress, setNewShippingAddress] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [newOrderPayment, setNewOrderPayment] = useState<PaymentStatus>('paid');

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;
    const matchesFulfillment = fulfillmentFilter === 'all' || o.fulfillmentStatus === fulfillmentFilter;
    return matchesSearch && matchesPayment && matchesFulfillment;
  });

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, paymentFilter, fulfillmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Calculate Metrics from Live Dataset
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.paidAmount, 0);
  const processingCount = orders.filter((o) => o.fulfillmentStatus === 'printing' || o.fulfillmentStatus === 'queued').length;
  const deliveredCount = orders.filter((o) => o.fulfillmentStatus === 'delivered').length;
  const issueCount = orders.filter((o) => o.fulfillmentStatus === 'submission_failed').length;

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Payment Status', 'Fulfillment Status', 'Total', 'Paid', 'Refunded', 'Date'];
    const rows = filteredOrders.map((o) => [
      o.id,
      `"${o.customerName}"`,
      o.customerEmail,
      o.paymentStatus,
      o.fulfillmentStatus,
      o.total.toFixed(2),
      o.paidAmount.toFixed(2),
      o.refundedAmount.toFixed(2),
      `"${o.date}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tuw_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Create Order Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === selectedProductId) || products[0];
    if (!product) return;

    createOrder({
      customerName: newCustomerName || 'Jane Doe',
      customerEmail: newCustomerEmail || 'jane.doe@example.com',
      customerPhone: '+1 (555) 000-1122',
      shippingAddress: newShippingAddress || '123 Fashion Ave, New York, NY 10001, USA',
      items: [
        {
          id: 'li-' + Math.random().toString(36).substring(2, 7),
          productId: product.id,
          productName: product.name,
          variant: `${product.colors[0]} / ${product.sizes[0]}`,
          quantity: 1,
          price: product.price,
        },
      ],
      subtotal: product.price,
      shippingFee: 10.0,
      tax: 0.0,
      total: product.price + 10.0,
      paymentStatus: newOrderPayment,
      fulfillmentStatus: newOrderPayment === 'paid' ? 'queued' : 'queued',
      paymentMethod: 'Credit Card (Simulated)',
    });

    setIsCreateOpen(false);
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewShippingAddress('');
  };

  // Handle Refund Submit
  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setRefundError('Please enter a valid numeric refund amount.');
      return;
    }

    const res = issueRefund({
      orderId: selectedOrder.id,
      amount: amountNum,
      reason: refundReason,
      method: selectedOrder.paymentMethod || 'Original Payment',
    });

    if (!res.success) {
      setRefundError(res.error || 'Refund failed validation.');
    } else {
      setIsRefundOpen(false);
      setRefundAmount('');
      setRefundError(null);
      // Update drawer preview
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  };

  return (
    <DashboardShell pageTitle="Orders" activeNav="orders">
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Order Management</h2>
          <p className={styles.pageSubtitle}>
            Monitor, inspect, and fulfill store orders with independent payment and fulfillment tracking.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="md"
            icon={<Download size={16} />}
            onClick={handleExportCSV}
          >
            <span>Export CSV</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => {
              if (canPerformAction('orders')) setIsCreateOpen(true);
            }}
          >
            <span>Create Order</span>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statGrid}>
        <StatCard
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={`${orders.length} orders recorded`}
          trendType="up"
        />
        <StatCard
          label="Active Queue"
          value={String(processingCount)}
          subtitle="Queued & printing on floor"
          trendType="neutral"
        />
        <StatCard
          label="Delivered"
          value={String(deliveredCount)}
          trend="Successful completions"
          trendType="up"
        />
        <StatCard
          label="Operational Issues"
          value={String(issueCount)}
          subtitle={issueCount > 0 ? 'Requires attention / retry' : 'No sync errors'}
          trendType={issueCount > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Filter and Table Card */}
      <ContentCard>
        {/* Search & Dual Independent Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ maxWidth: 360, width: '100%' }}>
              <Input
                placeholder="Search by order #, customer, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefixIcon={<Search size={16} />}
              />
            </div>

            {/* Quick Status Count Indicator */}
            <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
              Showing <strong>{filteredOrders.length}</strong> of {orders.length} orders
            </div>
          </div>

          {/* Independent Filter Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, paddingTop: 8, borderTop: '1px solid var(--tuw-border-subtle, #E5E7EB)' }}>
            {/* Payment Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>
                Payment:
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['all', 'paid', 'pending', 'failed', 'refunded'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setPaymentFilter(status)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: paymentFilter === status ? 600 : 500,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: paymentFilter === status ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-border-subtle, #E5E7EB)',
                      backgroundColor: paymentFilter === status ? 'var(--tuw-bg-selected, #F8F5FF)' : 'transparent',
                      color: paymentFilter === status ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-text-secondary, #5D6772)',
                    }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Fulfillment Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>
                Fulfillment:
              </span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(['all', 'queued', 'printing', 'shipped', 'delivered', 'submission_failed'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFulfillmentFilter(status)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: fulfillmentFilter === status ? 600 : 500,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: fulfillmentFilter === status ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-border-subtle, #E5E7EB)',
                      backgroundColor: fulfillmentFilter === status ? 'var(--tuw-bg-selected, #F8F5FF)' : 'transparent',
                      color: fulfillmentFilter === status ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-text-secondary, #5D6772)',
                    }}
                  >
                    {status === 'submission_failed' ? 'Failed Sync' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Table of Orders */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E5E7EB)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Order</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Payment Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Fulfillment Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    No orders match your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      borderBottom: '1px solid var(--tuw-border-subtle, #E5E7EB)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tuw-bg-canvas, #F7F8F9)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                      {order.id}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)' }}>
                        {order.customerName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                        {order.customerEmail}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {order.date}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {order.paymentStatus === 'paid' && <Badge variant="success">Paid</Badge>}
                      {order.paymentStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
                      {order.paymentStatus === 'failed' && <Badge variant="danger">Failed</Badge>}
                      {order.paymentStatus === 'refunded' && <Badge variant="neutral">Refunded</Badge>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {order.fulfillmentStatus === 'delivered' && <Badge variant="success">Delivered</Badge>}
                      {order.fulfillmentStatus === 'shipped' && <Badge variant="info">Shipped</Badge>}
                      {order.fulfillmentStatus === 'printing' && <Badge variant="warning">Printing</Badge>}
                      {order.fulfillmentStatus === 'queued' && <Badge variant="neutral">Queued</Badge>}
                      {order.fulfillmentStatus === 'submission_failed' && (
                        <Badge variant="danger" icon={<AlertTriangle size={12} />}>
                          Failed Sync
                        </Badge>
                      )}
                    </td>
                    <td className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                      ₹{order.total.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

      {/* Order Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order ${selectedOrder.id}` : 'Order Detail'}
        subtitle={selectedOrder?.date}
        footer={
          selectedOrder && (
            <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedOrder.fulfillmentStatus === 'submission_failed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<RotateCcw size={14} />}
                    onClick={() => {
                      retryFulfillment(selectedOrder.id);
                      setSelectedOrder({ ...selectedOrder, fulfillmentStatus: 'printing' });
                    }}
                  >
                    Retry Partner Sync
                  </Button>
                )}
                {selectedOrder.paymentStatus === 'paid' && selectedOrder.refundedAmount < selectedOrder.paidAmount && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RotateCcw size={14} />}
                    onClick={() => {
                      if (canPerformAction('refunds')) {
                        setRefundAmount((selectedOrder.paidAmount - selectedOrder.refundedAmount).toFixed(2));
                        setRefundError(null);
                        setIsRefundOpen(true);
                      }
                    }}
                  >
                    Issue Refund
                  </Button>
                )}
              </div>

              {selectedOrder.fulfillmentStatus !== 'delivered' && selectedOrder.fulfillmentStatus !== 'shipped' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Truck size={14} />}
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, undefined, 'shipped');
                    setSelectedOrder({ ...selectedOrder, fulfillmentStatus: 'shipped' });
                  }}
                >
                  Mark as Shipped
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Status Pills */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--tuw-text-secondary, #5D6772)', display: 'block' }}>Payment</span>
                {selectedOrder.paymentStatus === 'paid' && <Badge variant="success">Paid</Badge>}
                {selectedOrder.paymentStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
                {selectedOrder.paymentStatus === 'failed' && <Badge variant="danger">Failed</Badge>}
                {selectedOrder.paymentStatus === 'refunded' && <Badge variant="neutral">Refunded</Badge>}
              </div>
              <div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--tuw-text-secondary, #5D6772)', display: 'block' }}>Fulfillment</span>
                {selectedOrder.fulfillmentStatus === 'delivered' && <Badge variant="success">Delivered</Badge>}
                {selectedOrder.fulfillmentStatus === 'shipped' && <Badge variant="info">Shipped</Badge>}
                {selectedOrder.fulfillmentStatus === 'printing' && <Badge variant="warning">Printing</Badge>}
                {selectedOrder.fulfillmentStatus === 'queued' && <Badge variant="neutral">Queued</Badge>}
                {selectedOrder.fulfillmentStatus === 'submission_failed' && <Badge variant="danger">Failed Sync</Badge>}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 12 }}>
                Items Purchased ({selectedOrder.items.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 12,
                      backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                        {item.productName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                        {item.variant} · Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="tuw-tabular-nums" style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase Summary */}
            <div style={{ padding: 16, border: '1px solid var(--tuw-border-subtle, #E5E7EB)', borderRadius: 10 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--tuw-text-primary, #262626)' }}>
                Immutable Financial Summary
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Subtotal</span>
                  <span className="tuw-tabular-nums">₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Shipping Fee</span>
                  <span className="tuw-tabular-nums">₹{selectedOrder.shippingFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14, borderTop: '1px solid var(--tuw-border-subtle, #E5E7EB)', paddingTop: 6, marginTop: 4 }}>
                  <span>Grand Total</span>
                  <span className="tuw-tabular-nums">₹{selectedOrder.total.toFixed(2)}</span>
                </div>
                {selectedOrder.refundedAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tuw-text-error, #C91818)', fontWeight: 500 }}>
                    <span>Total Refunded</span>
                    <span className="tuw-tabular-nums">-₹{selectedOrder.refundedAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer & Shipping */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--tuw-text-primary, #262626)' }}>
                Customer & Shipping Address
              </h4>
              <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', lineHeight: 1.6 }}>
                <div><strong>{selectedOrder.customerName}</strong></div>
                <div>{selectedOrder.customerEmail}</div>
                <div>{selectedOrder.customerPhone}</div>
                <div style={{ marginTop: 4 }}>{selectedOrder.shippingAddress}</div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--tuw-text-primary, #262626)' }}>
                Order Timeline
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedOrder.timeline.map((evt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10 }}>
                    <Clock size={16} color="var(--tuw-action-primary, #7539FF)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                        {evt.title} <span style={{ fontWeight: 400, color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 11 }}>({evt.time})</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                        {evt.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Demo Order"
        subtitle="Simulate an order creation in local memory"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateSubmit}>
              Save & Create Order
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Customer Full Name"
            placeholder="e.g. Liam Miller"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            required
          />
          <Input
            label="Customer Email"
            type="email"
            placeholder="e.g. liam@example.com"
            value={newCustomerEmail}
            onChange={(e) => setNewCustomerEmail(e.target.value)}
            required
          />
          <Input
            label="Shipping Address"
            placeholder="e.g. 742 Evergreen Terrace, Springfield, OR"
            value={newShippingAddress}
            onChange={(e) => setNewShippingAddress(e.target.value)}
            required
          />
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Select Catalog Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 8,
                border: '1px solid var(--tuw-border-control, #D1D5DB)',
                padding: '0 12px',
                fontSize: 14,
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price.toFixed(2)} ({p.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Payment Status
            </label>
            <select
              value={newOrderPayment}
              onChange={(e) => setNewOrderPayment(e.target.value as PaymentStatus)}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 8,
                border: '1px solid var(--tuw-border-control, #D1D5DB)',
                padding: '0 12px',
                fontSize: 14,
              }}
            >
              <option value="paid">Paid (Credit Card authorized)</option>
              <option value="pending">Pending (Awaiting wire)</option>
              <option value="failed">Failed Payment</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Validated Refund Dialog */}
      <Modal
        isOpen={isRefundOpen}
        onClose={() => setIsRefundOpen(false)}
        title="Simulated Validated Refund"
        subtitle={`Order ${selectedOrder?.id} · Total: $${selectedOrder?.total.toFixed(2)}`}
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setIsRefundOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleRefundSubmit}>
              Process Validated Refund
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRefundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedOrder && (
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', fontSize: 13 }}>
              <div>Max refundable balance: <strong>${(selectedOrder.paidAmount - selectedOrder.refundedAmount).toFixed(2)}</strong></div>
              <div style={{ color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 12, marginTop: 2 }}>
                Already refunded: ${selectedOrder.refundedAmount.toFixed(2)} of ${selectedOrder.paidAmount.toFixed(2)}
              </div>
            </div>
          )}

          {refundError && (
            <div style={{ padding: 10, borderRadius: 8, backgroundColor: 'var(--tuw-bg-error, #FEF4F4)', color: 'var(--tuw-text-error, #C91818)', fontSize: 13 }}>
              {refundError}
            </div>
          )}

          <Input
            label="Refund Amount ($ USD)"
            type="number"
            step="0.01"
            value={refundAmount}
            onChange={(e) => {
              setRefundAmount(e.target.value);
              setRefundError(null);
            }}
            required
          />

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Reason for Refund
            </label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 8,
                border: '1px solid var(--tuw-border-control, #D1D5DB)',
                padding: '0 12px',
                fontSize: 14,
              }}
            >
              <option value="Customer cancellation prior to printing">Customer cancellation prior to printing</option>
              <option value="Defective stitching or fabric flaw">Defective stitching or fabric flaw</option>
              <option value="Carrier delay goodwill compensation">Carrier delay goodwill compensation</option>
              <option value="RMA return inspected and restocked">RMA return inspected and restocked</option>
            </select>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
