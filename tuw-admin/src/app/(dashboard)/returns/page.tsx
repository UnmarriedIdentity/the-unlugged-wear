'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, FilterPills, PageHeader, Checkbox } from '@/components/ui';
import { Undo2, Search, Filter, CheckCircle2, XCircle, ArrowRight, RotateCcw, Download } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { ReturnItem } from '@/mocks/fixtures';

export default function ReturnsPage() {
  const { returns, updateReturnStatus, canPerformAction, showToast } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | ReturnItem['stage']>('all');
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  // Row selection (multi-select; header checkbox tri-states over the page)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredReturns = returns.filter((item) => {
    const matchesSearch =
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.items.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || item.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReturns.length / pageSize));
  const paginatedReturns = filteredReturns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Row selection helpers (header checkbox tri-states over the page)
  const pageIds = paginatedReturns.map((r) => r.id);
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

  const handleApprove = (id: string) => {
    if (!canPerformAction('orders')) return;
    updateReturnStatus(id, 'restocked');
    if (selectedReturn?.id === id) {
      setSelectedReturn({ ...selectedReturn, stage: 'restocked' });
    }
  };

  const handleDecline = (id: string) => {
    if (!canPerformAction('orders')) return;
    updateReturnStatus(id, 'disputed');
    if (selectedReturn?.id === id) {
      setSelectedReturn({ ...selectedReturn, stage: 'disputed' });
    }
  };

  // Bulk actions (bar appears when rows are selected)
  const clearSelection = () => setSelectedIds(new Set());

  const handleExportSelected = () => {
    const selected = returns.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0) return;
    const headers = ['RMA ID', 'Order ID', 'Customer', 'Items', 'Reason', 'Stage'];
    const rows = selected.map((r) => [
      r.id,
      r.orderId,
      `"${r.customer}"`,
      `"${r.items}"`,
      `"${r.reason}"`,
      r.stage,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `tuw_returns_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({
      type: 'success',
      title: 'Selected Returns Exported',
      description: `${selected.length} return${selected.length === 1 ? '' : 's'} exported to CSV.`,
    });
    clearSelection();
  };

  const handleBulkStage = (stage: 'restocked' | 'disputed', label: string) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!canPerformAction('orders')) {
      showToast({
        type: 'warning',
        title: 'Action Restricted',
        description: 'Your demo role cannot update returns.',
      });
      return;
    }
    ids.forEach((id) => updateReturnStatus(id, stage, true));
    if (selectedReturn && selectedIds.has(selectedReturn.id)) {
      setSelectedReturn({ ...selectedReturn, stage });
    }
    setStageFilter('all');
    setCurrentPage(1);
    showToast({
      type: 'success',
      title: 'Bulk Update Applied',
      description: `${ids.length} return${ids.length === 1 ? '' : 's'} marked ${label}.`,
    });
    clearSelection();
  };

  return (
    <DashboardShell pageTitle="Returns">
      <PageHeader title="Returns & RMA Management" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Active Returns" value={String(returns.length)} subtitle="Inbound RMAs" trendType="neutral" hoverable />
        <StatCard label="In Transit (Inbound)" value={String(returns.filter((r) => r.stage === 'in_transit').length)} subtitle="Tracking en route" trendType="neutral" hoverable />
        <StatCard label="Restocked" value={String(returns.filter((r) => r.stage === 'restocked').length)} subtitle="Inventory adjusted" trendType="up" hoverable />
        <StatCard label="Disputed Cases" value={String(returns.filter((r) => r.stage === 'disputed').length)} subtitle="Damaged / missing tags" trendType="down" hoverable />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by RMA ID, order #, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>

          <FilterPills
            variant="pills"
            ariaLabel="Return stage filter"
            options={[
              { value: 'all', label: 'All' },
              { value: 'in_transit', label: 'In Transit' },
              { value: 'inspected', label: 'Inspected' },
              { value: 'restocked', label: 'Restocked' },
              { value: 'disputed', label: 'Disputed' },
            ]}
            value={stageFilter}
            onChange={(v) => setStageFilter(v as typeof stageFilter)}
          />
        </div>

        <Table>
          <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px', width: 44 }}>
                <Checkbox
                  bare
                  aria-label="Select all returns on this page"
                  checked={allPageSelected}
                  indeterminate={!allPageSelected && somePageSelected}
                  onChange={togglePage}
                />
              </TableHead>
              <TableHead style={{ padding: '12px 16px' }}>RMA ID</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Order</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Customer</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Returned Items</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Return Reason</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Stage</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReturns.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => setSelectedReturn(item)}
                style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer', backgroundColor: selectedIds.has(item.id) ? 'var(--tuw-bg-canvas, #F7F8F9)' : 'transparent' }}
              >
                <TableCell style={{ padding: '14px 16px' }}>
                  <Checkbox
                    bare
                    aria-label={`Select return ${item.id}`}
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleId(item.id)}
                  />
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                  {item.id}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 500 }}>
                  {item.orderId}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                  {item.customer}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {item.items}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {item.reason}
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  {item.stage === 'restocked' && <Badge variant="success">Restocked</Badge>}
                  {item.stage === 'inspected' && <Badge variant="info">Inspected</Badge>}
                  {item.stage === 'in_transit' && <Badge variant="warning">In Transit</Badge>}
                  {item.stage === 'disputed' && <Badge variant="danger">Disputed</Badge>}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedReturn(item); }}>
                    Review
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
          totalItems={filteredReturns.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>

      {/* Return Review Drawer */}
      <Drawer
        isOpen={Boolean(selectedReturn)}
        onClose={() => setSelectedReturn(null)}
        title={selectedReturn ? `RMA Request ${selectedReturn.id}` : 'Return Review'}
        subtitle={selectedReturn ? `Order ${selectedReturn.orderId} · ${selectedReturn.date}` : ''}
        footer={
          selectedReturn && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<XCircle size={14} />}
                  onClick={() => handleDecline(selectedReturn.id)}
                >
                  Decline / Dispute
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 size={14} />}
                  onClick={() => handleApprove(selectedReturn.id)}
                >
                  Approve & Restock
                </Button>
              </div>

              <Link href="/refunds" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />}>
                  Process Refund
                </Button>
              </Link>
            </div>
          )
        }
      >
        {selectedReturn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 16, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Status</span>
                <div style={{ marginTop: 4 }}>
                  {selectedReturn.stage === 'restocked' && <Badge variant="success">Restocked</Badge>}
                  {selectedReturn.stage === 'inspected' && <Badge variant="info">Inspected</Badge>}
                  {selectedReturn.stage === 'in_transit' && <Badge variant="warning">In Transit</Badge>}
                  {selectedReturn.stage === 'disputed' && <Badge variant="danger">Disputed</Badge>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Tracking #</span>
                <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--tuw-text-info, #175CD3)' }}>
                  {selectedReturn.trackingNumber}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Customer:</span>
                <strong>{selectedReturn.customer}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Order Reference:</span>
                <span style={{ color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 600 }}>{selectedReturn.orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Garment Item(s):</span>
                <span>{selectedReturn.items}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Carrier:</span>
                <span>{selectedReturn.carrier}</span>
              </div>
              <div style={{ padding: 12, backgroundColor: '#FAF0EB', borderRadius: 8, color: '#9C4D78', marginTop: 8 }}>
                <strong>Return Reason Provided:</strong>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}>{selectedReturn.reason}</p>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </DashboardShell>
  );
}
