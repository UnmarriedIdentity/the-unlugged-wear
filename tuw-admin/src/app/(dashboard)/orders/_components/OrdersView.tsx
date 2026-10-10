'use client';

import React, { useState } from 'react';
import { Download, Filter, Plus, Search, Eye, CheckCircle2, RotateCcw, AlertTriangle, Truck, Clock, X, Printer, ChevronDown } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  StatCard,
  ContentCard,
  Button,
  Badge,
  Checkbox,
  Input,
  Drawer,
  Modal,
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
} from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { OrderItem, PaymentStatus, FulfillmentStatus } from '@/mocks/fixtures';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

export default function OrdersView() {
  const { orders, products, updateOrderStatus, createOrder, issueRefund, retryFulfillment, canPerformAction, activeRole, showToast } = useAdminState();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  type OrderTab = 'all' | 'unfulfilled' | 'unpaid' | 'draft' | 'finished';
  const [orderTab, setOrderTab] = useState<OrderTab>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Drawer & Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  // Row selection (multi-select; header checkbox tri-states over the page)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  // Filtered Orders (single tab preset)
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const isUnfulfilled =
      o.fulfillmentStatus === 'queued' ||
      o.fulfillmentStatus === 'printing' ||
      o.fulfillmentStatus === 'submission_failed';
    const isUnpaid = o.paymentStatus === 'pending' || o.paymentStatus === 'failed';
    const isFinished = o.paymentStatus === 'paid' && o.fulfillmentStatus === 'delivered';
    const isDraft = o.paymentStatus === 'pending' && o.fulfillmentStatus === 'queued';
    const matchesTab =
      orderTab === 'all'
        ? true
        : orderTab === 'unfulfilled'
          ? isUnfulfilled
          : orderTab === 'unpaid'
            ? isUnpaid
            : orderTab === 'draft'
              ? isDraft
              : isFinished;
    return matchesSearch && matchesTab;
  });

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, orderTab]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Row selection + reference label maps (derived — no mock-model change)
  const pageIds = paginatedOrders.map((o) => o.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const togglePage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pageIds.every((id) => next.has(id))) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const paymentLabel = (s: PaymentStatus) =>
    s === 'paid' ? 'Fully paid' : s === 'pending' ? 'Authorized' : s === 'failed' ? 'Voided' : 'Refund';
  const fulfillmentLabel = (s: FulfillmentStatus) =>
    s === 'delivered' || s === 'shipped' ? 'Fulfilled' : s === 'printing' ? 'Partially fulfilled' : 'Unfulfilled';
  const shippingBadge = (o: OrderItem) =>
    o.paymentStatus === 'refunded' ? (
      <Badge variant="danger">Returned</Badge>
    ) : o.fulfillmentStatus === 'delivered' ? (
      <Badge variant="info">Delivered</Badge>
    ) : o.fulfillmentStatus === 'shipped' ? (
      <Badge variant="success">Shipped</Badge>
    ) : o.fulfillmentStatus === 'submission_failed' ? (
      <Badge variant="neutral">Cancelled</Badge>
    ) : (
      <Badge variant="warning">Processing</Badge>
    );
  const itemCount = (o: OrderItem) => o.items.reduce((n, li) => n + li.quantity, 0);

  // Calculate Metrics from Live Dataset
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.paidAmount, 0);
  const processingCount = orders.filter((o) => o.fulfillmentStatus === 'printing' || o.fulfillmentStatus === 'queued').length;
  const deliveredCount = orders.filter((o) => o.fulfillmentStatus === 'delivered').length;
  const issueCount = orders.filter((o) => o.fulfillmentStatus === 'submission_failed').length;

  // Handle Export CSV (defaults to the filtered set; bulk passes the selection)
  const handleExportCSV = (rowsToExport = filteredOrders) => {
    const headers = ['Order ID', 'Customer', 'Email', 'Payment Status', 'Fulfillment Status', 'Total', 'Paid', 'Refunded', 'Date'];
    const rows = rowsToExport.map((o) => [
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

  // Bulk actions (bar appears when rows are selected)
  const clearSelection = () => setSelectedIds(new Set());

  const handleExportSelected = () => {
    const selected = orders.filter((o) => selectedIds.has(o.id));
    if (selected.length === 0) return;
    handleExportCSV(selected);
    showToast({
      type: 'success',
      title: 'Selected Orders Exported',
      description: `${selected.length} order${selected.length === 1 ? '' : 's'} exported to CSV.`,
    });
    clearSelection();
  };

  const handlePrintSelected = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    showToast({
      type: 'info',
      title: 'Demo Print Queue',
      description: `${count} invoice${count === 1 ? '' : 's'} staged — no printer connected in demo.`,
    });
    clearSelection();
  };

  const handleBulkMark = (value: string) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!canPerformAction('orders')) {
      showToast({
        type: 'warning',
        title: 'Action Restricted',
        description: 'Your demo role cannot update orders.',
      });
      return;
    }
    const label =
      value === 'processing'
        ? 'Processing'
        : value === 'shipped'
          ? 'Shipped'
          : value === 'delivered'
            ? 'Delivered'
            : value === 'cancel'
              ? 'Cancelled'
              : 'Refunded';
    ids.forEach((id) => {
      if (value === 'processing') updateOrderStatus(id, undefined, 'printing', true);
      else if (value === 'shipped') updateOrderStatus(id, undefined, 'shipped', true);
      else if (value === 'delivered') updateOrderStatus(id, undefined, 'delivered', true);
      else if (value === 'cancel') updateOrderStatus(id, 'failed', undefined, true);
      else updateOrderStatus(id, 'refunded', undefined, true);
    });
    showToast({
      type: 'success',
      title: 'Bulk Update Applied',
      description: `${ids.length} order${ids.length === 1 ? '' : 's'} marked ${label}.`,
    });
    clearSelection();
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
      <PageHeader
        title="Order Management"
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              icon={<Download size={16} />}
              onClick={() => handleExportCSV()}
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
          </>
        }
      />

      {/* Stats Row */}
      <div className={styles.statGrid}>
        <StatCard
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={`${orders.length} orders recorded`}
          trendType="up"
          hoverable
        />
        <StatCard
          label="Active Queue"
          value={String(processingCount)}
          subtitle="Queued & printing on floor"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Delivered"
          value={String(deliveredCount)}
          trend="Successful completions"
          trendType="up"
          hoverable
        />
        <StatCard
          label="Operational Issues"
          value={String(issueCount)}
          subtitle={issueCount > 0 ? 'Requires attention / retry' : 'No sync errors'}
          trendType={issueCount > 0 ? 'down' : 'up'}
          hoverable
        />
      </div>

      {/* Filter and Table Card */}
      <ContentCard>
        {/* Tabs + Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <FilterPills
              variant="pills"
              ariaLabel="Order status tabs"
              options={[
                { value: 'all', label: 'All' },
                { value: 'unfulfilled', label: 'Unfulfilled' },
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'draft', label: 'Draft' },
                { value: 'finished', label: 'Finished' },
              ]}
              value={orderTab}
              onChange={(v) => setOrderTab(v as typeof orderTab)}
            />
            <div style={{ maxWidth: 360, width: '100%' }}>
              <Input
                placeholder="Search by order #, customer, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefixIcon={<Search size={16} />}
              />
            </div>
          </div>
        </div>

        {/* Table of Orders */}
        <Table>
          <TableHeader>
            {selectedIds.size > 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={10} style={{ padding: '6px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Checkbox
                      bare
                      aria-label="Select all orders on this page"
                      checked={allPageSelected}
                      indeterminate={!allPageSelected && somePageSelected}
                      onChange={togglePage}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      {selectedIds.size} selected
                    </span>
                    <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportSelected}>
                      Export selected
                    </Button>
                    <Button variant="secondary" size="sm" icon={<Printer size={14} />} onClick={handlePrintSelected}>
                      Print invoices
                    </Button>
                    <DropdownMenu
                      ariaLabel="Mark selected orders as"
                      trigger={
                        <Button variant="secondary" size="sm" onClick={() => {}}>
                          <span>Mark as</span>
                          <ChevronDown size={14} style={{ marginLeft: 4 }} />
                        </Button>
                      }
                      items={[
                        { value: 'processing', label: 'Processing' },
                        { value: 'shipped', label: 'Shipped' },
                        { value: 'delivered', label: 'Delivered' },
                        { value: 'cancel', label: 'Cancel orders', danger: true },
                        { value: 'refund', label: 'Refund orders', danger: true },
                      ]}
                      onSelect={handleBulkMark}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px', width: 44 }}>
                <Checkbox
                  bare
                  aria-label="Select all orders on this page"
                  checked={allPageSelected}
                  indeterminate={!allPageSelected && somePageSelected}
                  onChange={togglePage}
                />
              </TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Order</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Date</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Customer</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Payment</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Fulfillment</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Item</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Shipping</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Action</TableHead>
            </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={10} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 16 }}>
                  No orders match your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    backgroundColor: selectedIds.has(order.id) ? 'var(--tuw-bg-canvas, #F7F8F9)' : 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--tuw-bg-canvas, #F7F8F9)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedIds.has(order.id) ? 'var(--tuw-bg-canvas, #F7F8F9)' : 'transparent')}
                >
                  <TableCell style={{ padding: '14px 16px' }}>
                    <Checkbox
                      bare
                      aria-label={`Select order ${order.id}`}
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleId(order.id)}
                    />
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                    {order.id}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {order.date}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)' }}>
                      {order.customerName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {order.customerEmail}
                    </div>
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {paymentLabel(order.paymentStatus)}
                  </TableCell>
                  <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                    ₹{order.total.toFixed(2)}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {fulfillmentLabel(order.fulfillmentStatus)}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {itemCount(order)} item
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
                    {shippingBadge(order)}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
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
                  </TableCell>
                </TableRow>
              ))
            )}
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
