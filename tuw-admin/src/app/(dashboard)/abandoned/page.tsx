'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, FilterPills, PageHeader } from '@/components/ui';
import { Download, BellRing } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { AbandonedCart } from '@/mocks/fixtures';

// Abandoned carts (Phase-2 abandonment): detected → reminded → converted
// pipeline with exactly-once reminders and email-matched auto-conversion.
export default function AbandonedPage() {
  const { abandonedCarts, remindAbandonedCart } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AbandonedCart['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filtered = abandonedCarts.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.cartId.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q);
    return matchesSearch && (statusFilter === 'all' || c.status === statusFilter);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const atRisk = abandonedCarts.filter((c) => c.status === 'detected');
  const recoverable = atRisk.reduce((sum, c) => sum + c.cartTotal, 0);
  const convertedCount = abandonedCarts.filter((c) => c.status === 'converted' || c.status === 'recovered').length;
  const recoveryRate = abandonedCarts.length > 0 ? (convertedCount / abandonedCarts.length) * 100 : 0;

  const statusBadge = (status: AbandonedCart['status']) =>
    status === 'converted' || status === 'recovered' ? (
      <Badge variant="success" size="sm">Converted</Badge>
    ) : status === 'reminded' ? (
      <Badge variant="warning" size="sm">Reminded</Badge>
    ) : (
      <Badge variant="danger" size="sm">Detected</Badge>
    );

  const handleExportCSV = () => {
    const headers = ['Cart', 'Email', 'Items', 'Value', 'Abandoned', 'Status'];
    const rows = filtered.map((c) => [
      c.cartId,
      c.email ?? 'guest',
      String(c.items.reduce((n, i) => n + i.qty, 0)),
      String(c.cartTotal),
      `"${c.abandonedAt}"`,
      c.status,
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `tuw_abandoned_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell pageTitle="Abandoned" activeNav="abandoned">
      <PageHeader
        title="Abandoned Carts"
        actions={
          <Button variant="secondary" size="md" icon={<Download size={16} />} onClick={handleExportCSV}>
            Export Log
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatCard label="At-Risk Carts" value={String(atRisk.length)} trend="Awaiting reminder" trendType="neutral" hoverable />
        <StatCard label="Recoverable Value" value={`₹${recoverable.toLocaleString()}`} trend="Detected carts only" trendType="up" hoverable />
        <StatCard label="Recovery Rate" value={`${recoveryRate.toFixed(0)}%`} trend="Converted share" trendType="up" hoverable />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>
                Status:
              </span>
              <FilterPills
                variant="pills"
                ariaLabel="Recovery status filter"
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'detected', label: 'Detected' },
                  { value: 'reminded', label: 'Reminded' },
                  { value: 'converted', label: 'Converted' },
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              />
            </div>
            <div style={{ maxWidth: 300, width: '100%' }}>
              <Input
                aria-label="Search carts"
                placeholder="Search cart or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Cart</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Customer</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Items</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Value</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Idle Since</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', width: 120 }}><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 14 }}>
                  No carts in this state — recovery pipeline is clear.
                </TableCell>
              </TableRow>
            ) : paginated.map((c) => (
              <TableRow key={c.id} hoverable={false}>
                <TableCell style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: 'var(--tuw-text-primary, #262626)' }}>
                  {c.cartId}
                </TableCell>
                <TableCell style={{ padding: '10px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {c.email ?? 'Guest — no email captured'}
                </TableCell>
                <TableCell style={{ padding: '10px 16px', fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                  {c.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}
                </TableCell>
                <TableCell className="tuw-tabular-nums" style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                  ₹{c.cartTotal.toLocaleString()}
                </TableCell>
                <TableCell style={{ padding: '10px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {c.abandonedAt}
                </TableCell>
                <TableCell style={{ padding: '10px 16px' }}>
                  {statusBadge(c.status)}
                </TableCell>
                <TableCell style={{ padding: '10px 16px', width: 120 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<BellRing size={14} />}
                    type="button"
                    disabled={c.status !== 'detected'}
                    onClick={() => remindAbandonedCart(c.id)}
                  >
                    {c.status === 'detected' ? 'Remind' : 'Sent'}
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
          totalItems={filtered.length}
          pageSize={pageSize}
          pageSizeOptions={[8, 16, 32]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>
    </DashboardShell>
  );
}
