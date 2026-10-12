'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Filter, Search, Edit3, Trash2, CheckCircle2, Eye, AlertTriangle, LayoutGrid, List, Tag, ChevronDown, Download, Archive } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { StatCard, ContentCard, Button, Badge, Input, Modal, Drawer, Pagination, FilterPills, PageHeader, ViewToggle, DropdownMenu, Checkbox, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, MediaFrame, FormTextarea } from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { ProductItem } from '@/mocks/fixtures';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

export default function ProductsView() {
  const { products, createProduct, updateProduct, deleteProduct, canPerformAction, showToast } = useAdminState();

  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [publicationFilter, setPublicationFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  // Row selection (table view only; cleared on view switch)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const changeView = (v: 'grid' | 'table') => {
    setView(v);
    setSelectedIds(new Set());
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get('status');
      if (statusParam === 'draft') {
        setPublicationFilter('draft');
      } else if (statusParam === 'published') {
        setPublicationFilter('published');
      } else if (statusParam === 'scheduled') {
        setPublicationFilter('draft');
      } else if (!statusParam) {
        setPublicationFilter('all');
      }
    }
  }, []);

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form State for Create/Edit
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState<ProductItem['category']>('T-Shirts');
  const [formPrice, setFormPrice] = useState('48.00');
  const [formComparePrice, setFormComparePrice] = useState('58.00');
  const [formStock, setFormStock] = useState('30');
  const [formColors, setFormColors] = useState('Black, Chalk White, Olive');
  const [formSizes, setFormSizes] = useState('S, M, L, XL');
  const [formPartner, setFormPartner] = useState<ProductItem['partner']>('Qikink Direct API');
  const [formPlacement, setFormPlacement] = useState<ProductItem['placement']>('Chest (45mm)');
  const [formStatus, setFormStatus] = useState<ProductItem['publicationStatus']>('published');
  const [formDescription, setFormDescription] = useState('Pre-shrunk premium heavyweight combed cotton with reinforced seams.');

  const openCreateModal = () => {
    if (!canPerformAction('products')) return;
    setFormName('');
    setFormSlug('');
    setFormCategory('T-Shirts');
    setFormPrice('48.00');
    setFormComparePrice('58.00');
    setFormStock('25');
    setFormColors('Black, Chalk White, Olive');
    setFormSizes('S, M, L, XL');
    setFormPartner('Qikink Direct API');
    setFormPlacement('Chest (45mm)');
    setFormStatus('published');
    setFormDescription('Pre-shrunk premium heavyweight combed cotton with reinforced seams.');
    setIsCreateOpen(true);
  };

  const openEditDrawer = (product: ProductItem) => {
    if (!canPerformAction('products')) return;
    setEditingProduct(product);
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormCategory(product.category);
    setFormPrice(product.price.toFixed(2));
    setFormComparePrice(product.compareAtPrice ? product.compareAtPrice.toFixed(2) : '');
    setFormStock(String(product.stock));
    setFormColors(product.colors.join(', '));
    setFormSizes(product.sizes.join(', '));
    setFormPartner(product.partner);
    setFormPlacement(product.placement);
    setFormStatus(product.publicationStatus);
    setFormDescription(product.description);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formPrice) || 0;
    const stockNum = parseInt(formStock, 10) || 0;
    const compareNum = parseFloat(formComparePrice) || undefined;

    createProduct({
      name: formName || 'Untitled Garment',
      slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
      category: formCategory,
      price: priceNum,
      compareAtPrice: compareNum,
      stock: stockNum,
      colors: formColors.split(',').map((c) => c.trim()).filter(Boolean),
      sizes: formSizes.split(',').map((s) => s.trim()).filter(Boolean),
      partner: formPartner,
      placement: formPlacement,
      publicationStatus: formStatus,
      description: formDescription,
      imageBg: 'linear-gradient(135deg, #FAF3F7 0%, #EFE1EB 100%)',
    });

    setIsCreateOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const priceNum = parseFloat(formPrice) || editingProduct.price;
    const stockNum = parseInt(formStock, 10) || editingProduct.stock;
    const compareNum = parseFloat(formComparePrice) || undefined;

    updateProduct(editingProduct.id, {
      name: formName,
      slug: formSlug,
      category: formCategory,
      price: priceNum,
      compareAtPrice: compareNum,
      stock: stockNum,
      colors: formColors.split(',').map((c) => c.trim()).filter(Boolean),
      sizes: formSizes.split(',').map((s) => s.trim()).filter(Boolean),
      partner: formPartner,
      placement: formPlacement,
      publicationStatus: formStatus,
      description: formDescription,
    });

    setEditingProduct(null);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCat, publicationFilter, stockFilter]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCat === 'All' || p.category === selectedCat;
    const matchesPub = publicationFilter === 'all' || p.publicationStatus === publicationFilter;
    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
          ? p.stock > 0 && p.stock <= 10
          : p.stock === 0;
    return matchesSearch && matchesCat && matchesPub && matchesStock;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Row selection helpers (header checkbox tri-states over the page)
  const pageIds = paginatedProducts.map((p) => p.id);
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

  // Bulk actions (table-view bar appears when rows are selected)
  const clearSelection = () => setSelectedIds(new Set());

  const handleExportSelected = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return;
    const headers = ['Product ID', 'Name', 'Slug', 'Category', 'Price', 'Stock', 'Sold', 'Status'];
    const rows = selected.map((p) => [
      p.id,
      `"${p.name}"`,
      p.slug,
      p.category,
      p.price.toFixed(2),
      String(p.stock),
      String(p.soldCount),
      p.publicationStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `tuw_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({
      type: 'success',
      title: 'Selected Products Exported',
      description: `${selected.length} product${selected.length === 1 ? '' : 's'} exported to CSV.`,
    });
    clearSelection();
  };

  const handleBulkStatus = (status: 'published' | 'archived', label: string) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Action Restricted',
        description: 'Your demo role cannot update products.',
      });
      return;
    }
    ids.forEach((id) => updateProduct(id, { publicationStatus: status }, true));
    if (editingProduct && selectedIds.has(editingProduct.id)) {
      setEditingProduct({ ...editingProduct, publicationStatus: status });
    }
    setPublicationFilter('all');
    setCurrentPage(1);
    showToast({
      type: 'success',
      title: 'Bulk Update Applied',
      description: `${ids.length} product${ids.length === 1 ? '' : 's'} marked ${label}.`,
    });
    clearSelection();
  };

  const handleBulkDelete = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Action Restricted',
        description: 'Your demo role cannot delete products.',
      });
      return;
    }
    if (!window.confirm(`Permanently delete ${ids.length} product${ids.length === 1 ? '' : 's'} from catalog?`)) return;
    ids.forEach((id) => deleteProduct(id, true));
    if (editingProduct && selectedIds.has(editingProduct.id)) {
      setEditingProduct(null);
    }
    setCurrentPage(1);
    showToast({
      type: 'success',
      title: 'Bulk Delete Applied',
      description: `${ids.length} product${ids.length === 1 ? '' : 's'} removed from catalog.`,
    });
    clearSelection();
  };

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const draftCount = products.filter((p) => p.publicationStatus === 'draft').length;

  // KPI cards double as filters (shared by grid + table views)
  const filtersClear = selectedCat === 'All' && publicationFilter === 'all' && stockFilter === 'all';
  const clearProductFilters = () => {
    setSelectedCat('All');
    setPublicationFilter('all');
    setStockFilter('all');
  };
  const toggleStockFilter = (v: 'low' | 'out') =>
    setStockFilter((cur) => (cur === v ? 'all' : v));
  const togglePublicationFilter = (v: typeof publicationFilter) =>
    setPublicationFilter((cur) => (cur === v ? 'all' : v));
  const kpiKeyDown =
    (handler: () => void) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    };

  return (
    <DashboardShell pageTitle="Products" activeNav="products">
      <PageHeader
        title="Product Catalog"
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={openCreateModal}
          >
            <span>Add New Product</span>
          </Button>
        }
      />

      {/* Stats Row */}
      <div className={styles.statGrid}>
        <StatCard
          label="Total Products"
          value={String(products.length)}
          trend="Managed in local memory"
          trendType="up"
          hoverable
          role="button"
          tabIndex={0}
          aria-pressed={filtersClear}
          aria-label="Show all products"
          className={filtersClear ? 'tuw-stat-active' : ''}
          style={{ cursor: 'pointer' }}
          onClick={clearProductFilters}
          onKeyDown={kpiKeyDown(clearProductFilters)}
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(lowStockCount)}
          subtitle="Stock ≤ 10 units"
          trendType={lowStockCount > 0 ? 'down' : 'up'}
          hoverable
          role="button"
          tabIndex={0}
          aria-pressed={stockFilter === 'low'}
          aria-label="Filter low-stock products"
          className={stockFilter === 'low' ? 'tuw-stat-active' : ''}
          style={{ cursor: 'pointer' }}
          onClick={() => toggleStockFilter('low')}
          onKeyDown={kpiKeyDown(() => toggleStockFilter('low'))}
        />
        <StatCard
          label="Drafts in Review"
          value={String(draftCount)}
          subtitle="Unpublished items"
          trendType="neutral"
          hoverable
          role="button"
          tabIndex={0}
          aria-pressed={publicationFilter === 'draft'}
          aria-label="Filter draft products"
          className={publicationFilter === 'draft' ? 'tuw-stat-active' : ''}
          style={{ cursor: 'pointer' }}
          onClick={() => togglePublicationFilter('draft')}
          onKeyDown={kpiKeyDown(() => togglePublicationFilter('draft'))}
        />
        <StatCard
          label="Out of Stock"
          value={String(outOfStockCount)}
          subtitle={outOfStockCount > 0 ? 'Backorder only' : 'Fully stocked'}
          trendType={outOfStockCount > 0 ? 'down' : 'up'}
          hoverable
          role="button"
          tabIndex={0}
          aria-pressed={stockFilter === 'out'}
          aria-label="Filter out-of-stock products"
          className={stockFilter === 'out' ? 'tuw-stat-active' : ''}
          style={{ cursor: 'pointer' }}
          onClick={() => toggleStockFilter('out')}
          onKeyDown={kpiKeyDown(() => toggleStockFilter('out'))}
        />
      </div>

      {/* Catalog Filter Bar & Grid */}
      <ContentCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            {/* Publication Filter Tabs */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>
                Status:
              </span>
              <FilterPills
                variant="pills"
                ariaLabel="Publication status filter"
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'archived', label: 'Archived' },
                ]}
                value={publicationFilter}
                onChange={(v) => setPublicationFilter(v as typeof publicationFilter)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0, gap: 12 }}>
              <div style={{ maxWidth: 300, width: '100%' }}>
                <Input
                  placeholder="Search products by title, category, or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefixIcon={<Search size={16} />}
                />
              </div>
              <DropdownMenu
                ariaLabel="Product category filter"
                trigger={
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Product category, currently ${selectedCat === 'All' ? 'All Categories' : selectedCat}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      height: '44px',
                      padding: '0 12px',
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: 'var(--font-main)',
                      borderRadius: 'var(--tuw-radius-control, 8px)',
                      border: '1px solid var(--tuw-border-control, #D1D5DB)',
                      backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                      color: 'var(--tuw-text-primary, #262626)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Tag size={14} color="var(--tuw-text-secondary, #5D6772)" />
                    {selectedCat === 'All' ? 'All Categories' : selectedCat}
                    <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                  </span>
                }
                items={['All', 'T-Shirts', 'Hoodies', 'Jackets', 'Pants', 'Accessories'].map((cat) => ({
                  value: cat,
                  label: cat === 'All' ? 'All Categories' : cat,
                }))}
                selectedValue={selectedCat}
                onSelect={(v) => setSelectedCat(v)}
              />
              <div aria-hidden="true" style={{ width: 1, height: 24, backgroundColor: 'var(--tuw-border-subtle, #E5E7EB)' }} />
              <ViewToggle
                ariaLabel="Product catalog view"
                options={[
                  { value: 'grid', label: 'Grid view', icon: <LayoutGrid size={16} /> },
                  { value: 'table', label: 'Table view', icon: <List size={16} /> },
                ]}
                value={view}
                onChange={(v) => changeView(v as typeof view)}
              />
            </div>
          </div>
        </div>

        {view === 'grid' ? (
        /* Card Grid */
        <div className={styles.cardGrid}>
          {filteredProducts.length === 0 ? (
            <div style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)', gridColumn: '1 / -1' }}>
              No products found matching the selected filters.
            </div>
          ) : (
            paginatedProducts.map((p) => (
              <div key={p.id} className={`${styles.productCatalogCard} tuw-stat-hover`}>
                <div
                  className={styles.productThumbFrame}
                  style={{
                    background: p.imageBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  {p.video && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFFFFF',
                        borderRadius: 4,
                        padding: '2px 7px',
                        fontSize: 10,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        zIndex: 2,
                      }}
                    >
                      ▶ Video Reel
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
                    <Badge
                      variant={
                        p.publicationStatus === 'published'
                          ? 'success'
                          : p.publicationStatus === 'draft'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {p.publicationStatus}
                    </Badge>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', display: 'block' }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {p.category} · {p.partner}
                    </span>
                  </div>
                  <Badge variant={p.stock > 10 ? 'success' : p.stock > 0 ? 'warning' : 'danger'}>
                    {p.stock > 10 ? `${p.stock} in stock` : p.stock > 0 ? `Low: ${p.stock}` : 'Out of stock'}
                  </Badge>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {p.sizes.map((s) => (
                    <span key={s} style={{ fontSize: 11, padding: '2px 6px', background: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 4, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {s}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <div>
                    <span className="tuw-tabular-nums" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      ₹{p.price.toFixed(2)}
                    </span>
                    {p.compareAtPrice && (
                      <span className="tuw-tabular-nums" style={{ fontSize: '13px', color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'line-through', marginLeft: 6 }}>
                        ₹{p.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <Button variant="secondary" size="sm" icon={<Edit3 size={14} />} onClick={() => openEditDrawer(p)}>
                    Manage
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        ) : (
        /* Table View */
        <Table style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 44 }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '14.5%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <TableHeader>
            {selectedIds.size > 0 ? (
            <TableRow hoverable={false}>
              <TableCell colSpan={7} style={{ padding: '6px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Checkbox
                    bare
                    aria-label="Select all products on this page"
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
                  <Button variant="primary" size="sm" icon={<CheckCircle2 size={14} />} onClick={() => handleBulkStatus('published', 'Published')}>
                    Publish
                  </Button>
                  <Button variant="secondary" size="sm" icon={<Archive size={14} />} onClick={() => handleBulkStatus('archived', 'Archived')}>
                    Archive
                  </Button>
                  <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleBulkDelete}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            ) : (
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px', width: 44 }}>
                <Checkbox
                  bare
                  aria-label="Select all products on this page"
                  checked={allPageSelected}
                  indeterminate={!allPageSelected && somePageSelected}
                  onChange={togglePage}
                />
              </TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Product</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Category</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Price</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Stock / Sold</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Action</TableHead>
            </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 16 }}>
                  No products found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() => openEditDrawer(p)}
                  style={{ cursor: 'pointer', backgroundColor: selectedIds.has(p.id) ? 'var(--tuw-bg-canvas, #F7F8F9)' : 'transparent' }}
                >
                  <TableCell style={{ padding: '14px 16px' }}>
                    <Checkbox
                      bare
                      aria-label={`Select product ${p.name}`}
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleId(p.id)}
                    />
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, background: p.imageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--tuw-border-subtle, #E5E7EB)' }}>
                        {p.image ? (
                          <Image src={p.image} alt={p.name} fill sizes="80px" style={{ objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                            {p.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                          {p.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {p.category}
                  </TableCell>
                  <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                    ₹{p.price.toFixed(2)}
                    {p.compareAtPrice && (
                      <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'line-through', marginLeft: 6, fontWeight: 400 }}>
                        ₹{p.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: p.stock === 0 ? 'var(--tuw-text-error, #C91818)' : p.stock <= 10 ? 'var(--tuw-text-warning, #856300)' : 'var(--tuw-text-primary, #262626)' }}>
                      {p.stock} in stock
                    </div>
                    <div className="tuw-tabular-nums" style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {p.soldCount} sold
                    </div>
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
                    <Badge
                      variant={
                        p.publicationStatus === 'published'
                          ? 'success'
                          : p.publicationStatus === 'draft'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {p.publicationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="secondary" size="sm" icon={<Edit3 size={14} />} onClick={(e) => { e.stopPropagation(); openEditDrawer(p); }}>
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        )}

        {filteredProducts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}
      </ContentCard>

      {/* Add New Product Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Catalog Garment"
        subtitle="Create an apparel item with partner mapping and size variants"
        maxWidth="620px"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateSubmit}>
              Save to Catalog
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Product Title"
              placeholder="e.g. Heavyweight Fleece Zip Hoodie"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (!formSlug) setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              required
            />
            <Input
              label="URL Slug"
              placeholder="e.g. heavyweight-fleece-zip-hoodie"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', marginBottom: 6 }}>
                Category
              </div>
              <DropdownMenu
                ariaLabel="Category"
                trigger={
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Category, currently ${formCategory}`}
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
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formCategory}
                    </span>
                    <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                  </span>
                }
                items={['T-Shirts', 'Hoodies', 'Jackets', 'Pants', 'Accessories'].map((c) => ({ value: c, label: c }))}
                selectedValue={formCategory}
                onSelect={(v) => setFormCategory(v as ProductItem['category'])}
              />
            </div>

            <Input
              label="Price ($ USD)"
              type="number"
              step="0.01"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              required
            />

            <Input
              label="Initial Stock Units"
              type="number"
              value={formStock}
              onChange={(e) => setFormStock(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', marginBottom: 6 }}>
                Fulfillment Partner
              </div>
              <DropdownMenu
                ariaLabel="Fulfillment partner"
                trigger={
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Fulfillment partner, currently ${formPartner}`}
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
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formPartner}
                    </span>
                    <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                  </span>
                }
                items={['Qikink Direct API', 'Printrove Hub', 'Custom Atelier'].map((p) => ({ value: p, label: p }))}
                selectedValue={formPartner}
                onSelect={(v) => setFormPartner(v as ProductItem['partner'])}
              />
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', marginBottom: 6 }}>
                Artwork Placement Spec
              </div>
              <DropdownMenu
                ariaLabel="Artwork placement spec"
                trigger={
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Artwork placement spec, currently ${formPlacement}`}
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
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formPlacement}
                    </span>
                    <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                  </span>
                }
                items={['Chest (45mm)', 'Back Oversized', 'Sleeve Length', 'Interior Hem'].map((pl) => ({ value: pl, label: pl }))}
                selectedValue={formPlacement}
                onSelect={(v) => setFormPlacement(v as ProductItem['placement'])}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Colors (comma separated)"
              value={formColors}
              onChange={(e) => setFormColors(e.target.value)}
            />
            <Input
              label="Sizes (comma separated)"
              value={formSizes}
              onChange={(e) => setFormSizes(e.target.value)}
            />
          </div>

            <FormTextarea
              label="Garment Description & Care"
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />

            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', marginBottom: 6 }}>
                Publication State
              </div>
              <DropdownMenu
                ariaLabel="Publication state"
                trigger={
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Publication state, currently ${formStatus === 'published' ? 'Published (Visible in Storefront)' : formStatus === 'draft' ? 'Draft (Editorial review only)' : 'Archived (Hidden from catalog)'}`}
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
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formStatus === 'published' ? 'Published (Visible in Storefront)' : formStatus === 'draft' ? 'Draft (Editorial review only)' : 'Archived (Hidden from catalog)'}
                    </span>
                    <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                  </span>
                }
                items={[
                  { value: 'published', label: 'Published (Visible in Storefront)' },
                  { value: 'draft', label: 'Draft (Editorial review only)' },
                  { value: 'archived', label: 'Archived (Hidden from catalog)' },
                ]}
                selectedValue={formStatus}
                onSelect={(v) => setFormStatus(v as ProductItem['publicationStatus'])}
              />
            </div>
        </form>
      </Modal>

      {/* Edit Product Drawer */}
      <Drawer
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title={editingProduct ? `Manage ${editingProduct.name}` : 'Edit Product'}
        subtitle={`ID: ${editingProduct?.id} · ${editingProduct?.partner}`}
        footer={
          editingProduct && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => {
                  if (window.confirm(`Permanently delete "${editingProduct.name}" from catalog?`)) {
                    deleteProduct(editingProduct.id);
                    setEditingProduct(null);
                  }
                }}
              >
                Delete
              </Button>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" size="sm" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleEditSubmit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )
        }
      >
        {editingProduct && (
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {editingProduct.image && (
              <MediaFrame height={220} radius={10}>
                {editingProduct.video ? (
                  <video
                    src={editingProduct.video}
                    controls
                    poster={editingProduct.image}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Image
                    src={editingProduct.image}
                    alt={editingProduct.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                )}
              </MediaFrame>
            )}
            <Input
              label="Product Title"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <Input
              label="URL Slug"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Price ($ USD)"
                type="number"
                step="0.01"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
              />
              <Input
                label="Stock Quantity"
                type="number"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                required
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', marginBottom: 6 }}>
                Publication Status
              </div>
              <DropdownMenu
                ariaLabel="Publication status"
                trigger={
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Publication status, currently ${formStatus === 'published' ? 'Published (Live on website)' : formStatus === 'draft' ? 'Draft (Hidden)' : 'Archived'}`}
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
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formStatus === 'published' ? 'Published (Live on website)' : formStatus === 'draft' ? 'Draft (Hidden)' : 'Archived'}
                    </span>
                    <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                  </span>
                }
                items={[
                  { value: 'published', label: 'Published (Live on website)' },
                  { value: 'draft', label: 'Draft (Hidden)' },
                  { value: 'archived', label: 'Archived' },
                ]}
                selectedValue={formStatus}
                onSelect={(v) => setFormStatus(v as ProductItem['publicationStatus'])}
              />
            </div>
            <Input
              label="Color Variations"
              value={formColors}
              onChange={(e) => setFormColors(e.target.value)}
            />
            <Input
              label="Size Variations"
              value={formSizes}
              onChange={(e) => setFormSizes(e.target.value)}
            />
            <FormTextarea
              label="Description"
              rows={4}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </form>
        )}
      </Drawer>
    </DashboardShell>
  );
}
