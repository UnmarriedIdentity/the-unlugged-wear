'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Filter, Search, Edit3, Trash2, CheckCircle2, Eye, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { StatCard, ContentCard, Button, Badge, Input, Modal, Drawer, Pagination, FilterPills, PageHeader, ViewToggle } from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { ProductItem } from '@/mocks/fixtures';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

export default function ProductsView() {
  const { products, createProduct, updateProduct, deleteProduct, canPerformAction } = useAdminState();

  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [publicationFilter, setPublicationFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
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
  }, [searchTerm, selectedCat, publicationFilter]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCat === 'All' || p.category === selectedCat;
    const matchesPub = publicationFilter === 'all' || p.publicationStatus === publicationFilter;
    return matchesSearch && matchesCat && matchesPub;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const draftCount = products.filter((p) => p.publicationStatus === 'draft').length;

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
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(lowStockCount)}
          subtitle="Stock ≤ 10 units"
          trendType={lowStockCount > 0 ? 'down' : 'up'}
          hoverable
        />
        <StatCard
          label="Drafts in Review"
          value={String(draftCount)}
          subtitle="Unpublished items"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Out of Stock"
          value={String(outOfStockCount)}
          subtitle={outOfStockCount > 0 ? 'Backorder only' : 'Fully stocked'}
          trendType={outOfStockCount > 0 ? 'down' : 'up'}
          hoverable
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

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ maxWidth: 300, width: '100%' }}>
                <Input
                  placeholder="Search products by title, category, or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefixIcon={<Search size={16} />}
                />
              </div>
              <div aria-hidden="true" style={{ width: 1, height: 24, backgroundColor: 'var(--tuw-border-subtle, #E5E7EB)' }} />
              <ViewToggle
                ariaLabel="Product catalog view"
                options={[
                  { value: 'grid', label: 'Grid view', icon: <LayoutGrid size={16} /> },
                  { value: 'table', label: 'Table view', icon: <List size={16} /> },
                ]}
                value={view}
                onChange={(v) => setView(v as typeof view)}
              />
            </div>
          </div>

          {/* Department Categories */}
          <div className={styles.filterBar} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ul className={styles.tabList}>
              {['All', 'T-Shirts', 'Hoodies', 'Jackets', 'Pants', 'Accessories'].map((cat) => (
                <li
                  key={cat}
                  className={`${styles.tabItem} ${selectedCat === cat ? styles.tabItemActive : ''}`}
                  onClick={() => setSelectedCat(cat)}
                >
                  {cat}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card Grid */}
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
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ProductItem['category'])}
                style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
              >
                <option value="T-Shirts">T-Shirts</option>
                <option value="Hoodies">Hoodies</option>
                <option value="Jackets">Jackets</option>
                <option value="Pants">Pants</option>
                <option value="Accessories">Accessories</option>
              </select>
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
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                Fulfillment Partner
              </label>
              <select
                value={formPartner}
                onChange={(e) => setFormPartner(e.target.value as ProductItem['partner'])}
                style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
              >
                <option value="Qikink Direct API">Qikink Direct API</option>
                <option value="Printrove Hub">Printrove Hub</option>
                <option value="Custom Atelier">Custom Atelier</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                Artwork Placement Spec
              </label>
              <select
                value={formPlacement}
                onChange={(e) => setFormPlacement(e.target.value as ProductItem['placement'])}
                style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
              >
                <option value="Chest (45mm)">Chest (45mm)</option>
                <option value="Back Oversized">Back Oversized</option>
                <option value="Sleeve Length">Sleeve Length</option>
                <option value="Interior Hem">Interior Hem</option>
              </select>
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

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Garment Description & Care
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid var(--tuw-border-control, #90979F)',
                padding: '8px 12px',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Publication State
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as ProductItem['publicationStatus'])}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
            >
              <option value="published">Published (Visible in Storefront)</option>
              <option value="draft">Draft (Editorial review only)</option>
              <option value="archived">Archived (Hidden from catalog)</option>
            </select>
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
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 220,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--tuw-border-subtle, #E9E9E9)',
                  background: 'var(--tuw-bg-canvas, #F7F8F9)',
                }}
              >
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
              </div>
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
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                Publication Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ProductItem['publicationStatus'])}
                style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
              >
                <option value="published">Published (Live on website)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="archived">Archived</option>
              </select>
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
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                Description
              </label>
              <textarea
                rows={4}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={{ width: '100%', borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
          </form>
        )}
      </Drawer>
    </DashboardShell>
  );
}
