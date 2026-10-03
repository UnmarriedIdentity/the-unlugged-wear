'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Drawer, Pagination } from '@/components/ui';
import { Undo2, Search, Filter, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { ReturnItem } from '@/mocks/fixtures';

export default function ReturnsPage() {
  const { returns, updateReturnStatus, canPerformAction } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | ReturnItem['stage']>('all');
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

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

  return (
    <DashboardShell pageTitle="Returns">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Returns & RMA Management
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Inspect inbound customer returns, verify garment condition, restock inventory, and authorize refunds.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Active Returns" value={String(returns.length)} subtitle="Inbound RMAs" trendType="neutral" />
        <StatCard label="In Transit (Inbound)" value={String(returns.filter((r) => r.stage === 'in_transit').length)} subtitle="Tracking en route" trendType="neutral" />
        <StatCard label="Restocked" value={String(returns.filter((r) => r.stage === 'restocked').length)} subtitle="Inventory adjusted" trendType="up" />
        <StatCard label="Disputed Cases" value={String(returns.filter((r) => r.stage === 'disputed').length)} subtitle="Damaged / missing tags" trendType="down" />
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

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'in_transit', 'inspected', 'restocked', 'disputed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStageFilter(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: stageFilter === st ? 600 : 500,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: stageFilter === st ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-border-subtle, #E2E4E6)',
                  backgroundColor: stageFilter === st ? 'var(--tuw-bg-selected, #F8F5FF)' : 'transparent',
                  color: stageFilter === st ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-text-secondary, #5D6772)',
                }}
              >
                {st === 'in_transit' ? 'In Transit' : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>RMA ID</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Order</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Returned Items</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Return Reason</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Stage</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReturns.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedReturn(item)}
                  style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {item.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 500 }}>
                    {item.orderId}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {item.customer}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {item.items}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {item.reason}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {item.stage === 'restocked' && <Badge variant="success">Restocked</Badge>}
                    {item.stage === 'inspected' && <Badge variant="info">Inspected</Badge>}
                    {item.stage === 'in_transit' && <Badge variant="warning">In Transit</Badge>}
                    {item.stage === 'disputed' && <Badge variant="danger">Disputed</Badge>}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedReturn(item); }}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
