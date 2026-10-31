'use client';

import React, { useState } from 'react';
import DashboardShell from '@admin/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, FilterPills, PageHeader, Tabs, DropdownMenu, Switch, UpliftSurface } from '@admin/components/ui';
import { Plus, Download, Trash2, ChevronDown } from 'lucide-react';
import { useAdminState } from '@admin/mocks/state';
import { DiscountCode } from '@admin/mocks/fixtures';

// Discount codes manager (Phase-2 discounts): code CRUD + kill switch +
// product-schedule board. Tables ready (discount_codes intent), UI new.
export default function DiscountsPage() {
  const { discountCodes, products, createDiscountCode, toggleDiscountCode, deleteDiscountCode, updateProduct, canPerformAction } = useAdminState();
  const [tab, setTab] = useState<'codes' | 'schedules'>('codes');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percent' | 'fixed'>('percent');
  const [formValue, setFormValue] = useState('10');
  const [formMin, setFormMin] = useState('');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formStarts, setFormStarts] = useState('');
  const [formEnds, setFormEnds] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const isExpired = (d: DiscountCode) => d.endsAt !== '' && d.endsAt < today;
  const isScheduled = (d: DiscountCode) => d.startsAt !== '' && d.startsAt > today;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, tab]);

  const filteredCodes = discountCodes.filter((d) => {
    const matchesSearch = d.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true
      : statusFilter === 'active' ? d.isActive && !isExpired(d)
      : statusFilter === 'scheduled' ? isScheduled(d)
      : isExpired(d);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCodes.length / pageSize));
  const paginatedCodes = filteredCodes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeCount = discountCodes.filter((d) => d.isActive && !isExpired(d)).length;
  const redemptionSum = discountCodes.reduce((sum, d) => sum + d.usesCount, 0);
  const expiredCount = discountCodes.filter(isExpired).length;

  // Product schedules board: every scheduled discount across products.
  const scheduleRows = products.flatMap((p) =>
    (p.discounts ?? []).map((d) => ({ ...d, productId: p.id, productName: p.name }))
  );

  const resetForm = () => {
    setFormCode('');
    setFormType('percent');
    setFormValue('10');
    setFormMin('');
    setFormMaxUses('');
    setFormStarts('');
    setFormEnds('');
    setFormActive(true);
    setFormError(null);
  };

  const handleCreate = () => {
    const code = formCode.trim().toUpperCase();
    if (!code) {
      setFormError('Code is required.');
      return;
    }
    const value = parseFloat(formValue);
    if (isNaN(value) || value <= 0) {
      setFormError('Value must be above zero.');
      return;
    }
    const min = formMin.trim() === '' ? undefined : parseFloat(formMin);
    if (min !== undefined && (isNaN(min) || min < 0)) {
      setFormError('Minimum order must be zero or more.');
      return;
    }
    const maxUses = formMaxUses.trim() === '' ? undefined : parseInt(formMaxUses, 10);
    if (maxUses !== undefined && (isNaN(maxUses) || maxUses <= 0)) {
      setFormError('Usage cap must be a positive whole number.');
      return;
    }
    const ok = createDiscountCode({
      code,
      discountType: formType,
      value: formType === 'percent' ? Math.min(100, value) : value,
      minOrderAmount: min,
      maxUses,
      startsAt: formStarts,
      endsAt: formEnds,
      isActive: formActive,
    });
    if (ok) {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Starts', 'Ends', 'Active'];
    const rows = filteredCodes.map((d) => [
      d.code,
      d.discountType,
      String(d.value),
      d.minOrderAmount !== undefined ? String(d.minOrderAmount) : '',
      `${d.usesCount}${d.maxUses !== undefined ? `/${d.maxUses}` : ''}`,
      d.startsAt,
      d.endsAt,
      String(d.isActive),
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `tuw_discounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell pageTitle="Discounts" activeNav="discounts">
      <PageHeader
        title="Discounts & Promotions"
        actions={
          <>
            <Button variant="secondary" size="md" icon={<Download size={16} />} onClick={handleExportCSV}>
              Export Log
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={() => {
                if (canPerformAction('orders')) {
                  resetForm();
                  setIsCreateOpen(true);
                }
              }}
            >
              <span>New Code</span>
            </Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatCard label="Active Codes" value={String(activeCount)} trend="Live at checkout" trendType="up" hoverable />
        <StatCard label="Total Redemptions" value={String(redemptionSum)} trend="Across all codes" trendType="up" hoverable />
        <StatCard label="Expired" value={String(expiredCount)} trend="Past their window" trendType="neutral" hoverable />
      </div>

      <Tabs
        variant="underline"
        ariaLabel="Discount views"
        tabs={[
          { id: 'codes', label: 'Codes', badge: discountCodes.length },
          { id: 'schedules', label: 'Product Schedules', badge: scheduleRows.length },
        ]}
        activeTab={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === 'codes' ? (
      <ContentCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>
                Status:
              </span>
              <FilterPills
                variant="pills"
                ariaLabel="Code status filter"
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'expired', label: 'Expired' },
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              />
            </div>
            <div style={{ maxWidth: 300, width: '100%' }}>
              <Input
                aria-label="Search codes"
                placeholder="Search codes…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Code</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Type</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Value</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Uses</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Window</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', width: 48 }}><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCodes.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 14 }}>
                  No codes match — adjust filters or create one.
                </TableCell>
              </TableRow>
            ) : paginatedCodes.map((d) => (
              <TableRow key={d.id} hoverable={false}>
                <TableCell style={{ padding: '10px 16px', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: 'var(--tuw-text-primary, #262626)' }}>
                  {d.code}
                </TableCell>
                <TableCell style={{ padding: '10px 16px' }}>
                  <Badge variant={d.discountType === 'percent' ? 'info' : 'neutral'} size="sm">
                    {d.discountType === 'percent' ? 'Percent' : 'Fixed'}
                  </Badge>
                </TableCell>
                <TableCell className="tuw-tabular-nums" style={{ padding: '10px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                  {d.discountType === 'percent' ? `${d.value}%` : `₹${d.value.toLocaleString()}`}
                </TableCell>
                <TableCell className="tuw-tabular-nums" style={{ padding: '10px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', textAlign: 'right' }}>
                  {d.usesCount}{d.maxUses !== undefined ? `/${d.maxUses}` : ''}
                </TableCell>
                <TableCell style={{ padding: '10px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {d.startsAt || '—'} → {d.endsAt || '—'}
                </TableCell>
                <TableCell style={{ padding: '10px 16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                      label=""
                      ariaLabel={`Toggle discount ${d.code} active`}
                      checked={d.isActive}
                      onChange={() => toggleDiscountCode(d.id)}
                    />
                    {isExpired(d) ? (
                      <Badge variant="neutral" size="sm">Expired</Badge>
                    ) : !d.isActive ? (
                      <Badge variant="warning" size="sm">Off</Badge>
                    ) : (
                      <Badge variant="success" size="sm">Live</Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell style={{ padding: '10px 16px', width: 48 }}>
                  <UpliftSurface active width={28} height={28} className="tuw-danger-hover" style={{ flexShrink: 0, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    <button
                      type="button"
                      aria-label={`Delete code ${d.code}`}
                      onClick={() => deleteDiscountCode(d.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </UpliftSurface>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredCodes.length}
          pageSize={pageSize}
          pageSizeOptions={[8, 16, 32]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>
      ) : (
      <ContentCard>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: '0 0 4px 0' }}>
          Product Schedules
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--tuw-text-secondary, #5D6772)', margin: '0 0 12px 0' }}>
          Every scheduled price cut across products. Kill switches flip here; full edits live in the product drawer.
        </p>
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Product</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Type</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Value</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Window</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduleRows.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 14 }}>
                  No scheduled discounts — add them from any product's General tab.
                </TableCell>
              </TableRow>
            ) : scheduleRows.map((d) => (
              <TableRow key={`${d.productId}-${d.id}`} hoverable={false}>
                <TableCell style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                  {d.productName}
                </TableCell>
                <TableCell style={{ padding: '10px 16px' }}>
                  <Badge variant={d.discountType === 'percent' ? 'info' : 'neutral'} size="sm">
                    {d.discountType === 'percent' ? 'Percent' : 'Fixed'}
                  </Badge>
                </TableCell>
                <TableCell className="tuw-tabular-nums" style={{ padding: '10px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                  {d.discountType === 'percent' ? `${d.value}%` : `₹${d.value.toLocaleString()}`}
                </TableCell>
                <TableCell style={{ padding: '10px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {d.startsAt || '—'} → {d.endsAt || '—'}
                </TableCell>
                <TableCell style={{ padding: '10px 16px' }}>
                  <Switch
                    label=""
                    ariaLabel={`Toggle discount for ${d.productName} active`}
                    checked={d.isActive}
                    onChange={() => {
                      const product = products.find((p) => p.id === d.productId);
                      if (!product) return;
                      updateProduct(d.productId, {
                        discounts: (product.discounts ?? []).map((x) =>
                          x.id === d.id ? { ...x, isActive: !x.isActive } : x
                        ),
                      }, true);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ContentCard>
      )}

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Discount Code"
        subtitle="Live at checkout once created"
        footer={
          <>
            <Button variant="secondary" size="md" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="button" onClick={handleCreate}>
              Create Code
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {formError ? (
            <div role="alert" style={{ fontSize: 13, color: 'var(--tuw-text-error, #C91818)', backgroundColor: 'var(--tuw-bg-error, #FEF4F4)', borderRadius: 8, padding: '10px 12px' }}>
              {formError}
            </div>
          ) : null}
          <Input
            label="Code"
            placeholder="e.g. DIWALI20"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value.toUpperCase())}
            required
          />
          <DropdownMenu
            ariaLabel="Discount type"
            trigger={
              <span
                role="button"
                tabIndex={0}
                aria-label={`Discount type, currently ${formType}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  width: '100%',
                  height: 40,
                  padding: '0 12px',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'var(--font-main)',
                  borderRadius: 8,
                  border: '1px solid var(--tuw-border-control, #D1D5DB)',
                  backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                  color: 'var(--tuw-text-primary, #262626)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span>{formType === 'percent' ? 'Percent %' : 'Fixed ₹'}</span>
                <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
              </span>
            }
            items={[
              { value: 'percent', label: 'Percent %' },
              { value: 'fixed', label: 'Fixed ₹' },
            ]}
            selectedValue={formType}
            onSelect={(v) => setFormType(v as typeof formType)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Value"
              type="number"
              step="0.01"
              min="0"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              required
            />
            <Input
              label="Min Order (optional)"
              type="number"
              step="0.01"
              min="0"
              value={formMin}
              onChange={(e) => setFormMin(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Max Uses (optional)"
              type="number"
              step="1"
              min="1"
              value={formMaxUses}
              onChange={(e) => setFormMaxUses(e.target.value)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                aria-label="Starts"
                type="date"
                value={formStarts}
                onChange={(e) => setFormStarts(e.target.value)}
              />
              <Input
                aria-label="Ends"
                type="date"
                value={formEnds}
                onChange={(e) => setFormEnds(e.target.value)}
              />
            </div>
          </div>
          <Switch
            label="Active immediately"
            description="Off codes stay drafts until flipped on"
            checked={formActive}
            onChange={setFormActive}
          />
        </div>
      </Drawer>
    </DashboardShell>
  );
}
