'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Modal, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { Layers, Plus, Search, Filter, Sparkles, FolderTree, Edit3 } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { CollectionItem } from '@/mocks/fixtures';

export default function CollectionsPage() {
  const { collections, createCollection, products, canPerformAction } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCol, setSelectedCol] = useState<CollectionItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSeason, setFormSeason] = useState('AW26');
  const [formVisibility, setFormVisibility] = useState<CollectionItem['visibility']>('published');
  const [formDescription, setFormDescription] = useState('Curated apparel grouping.');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filtered = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.season.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCollection({
      name: formName || 'New Seasonal Series',
      slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
      season: formSeason,
      productCount: selectedProductIds.length || 6,
      visibility: formVisibility,
      description: formDescription,
    });
    setIsCreateOpen(false);
    setFormName('');
    setFormSlug('');
  };

  const toggleProductSelect = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  return (
    <DashboardShell pageTitle="Collections">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Apparel Collections
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Curate product groupings, seasonal lookbooks, and storefront merchandising categories.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => {
              if (canPerformAction('products')) setIsCreateOpen(true);
            }}
          >
            Create Collection
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Active Collections" value={`${collections.length} Series`} subtitle="Organized lookbooks" trendType="neutral" hoverable />
        <StatCard label="Live on Storefront" value={String(collections.filter((c) => c.visibility === 'published').length)} trend="Published & visible" trendType="up" hoverable />
        <StatCard label="Scheduled Releases" value={String(collections.filter((c) => c.visibility === 'scheduled').length)} subtitle="Upcoming drops" trendType="neutral" hoverable />
        <StatCard label="Draft Formats" value={String(collections.filter((c) => c.visibility === 'draft').length)} subtitle="In curation" trendType="neutral" hoverable />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Table>
          <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Collection</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Slug</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Products</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Season</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => setSelectedCol(item)}
                style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer' }}
              >
                <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                  {item.name}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  /{item.slug}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                  {item.productCount} items
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {item.season}
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  {item.visibility === 'published' && <Badge variant="success">Published</Badge>}
                  {item.visibility === 'scheduled' && <Badge variant="info">Scheduled</Badge>}
                  {item.visibility === 'draft' && <Badge variant="neutral">Draft</Badge>}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCol(item); }}>
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
          totalItems={filtered.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>

      {/* Collection Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedCol)}
        onClose={() => setSelectedCol(null)}
        title={selectedCol ? selectedCol.name : 'Collection Detail'}
        subtitle={selectedCol ? `${selectedCol.season} · /${selectedCol.slug}` : ''}
      >
        {selectedCol && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 16, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10 }}>
              <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>Editorial Overview</div>
              <p style={{ fontSize: 14, color: 'var(--tuw-text-primary, #262626)', marginTop: 4, lineHeight: 1.5 }}>
                {selectedCol.description}
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 10 }}>
                Included Products ({selectedCol.productCount})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {products.slice(0, 4).map((p) => (
                  <div key={p.id} style={{ padding: 10, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <div>
                      <strong>{p.name}</strong> · {p.category}
                    </div>
                    <div style={{ fontWeight: 600 }}>${p.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Collection Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Collection"
        subtitle="Group catalog items into a seasonal release"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateSubmit}>
              Save Collection
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Collection Title"
            placeholder="e.g. Spring Minimalist Capsule"
            value={formName}
            onChange={(e) => {
              setFormName(e.target.value);
              if (!formSlug) setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
            }}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="URL Slug"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              required
            />
            <Input
              label="Season / Year"
              value={formSeason}
              onChange={(e) => setFormSeason(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Visibility Status
            </label>
            <select
              value={formVisibility}
              onChange={(e) => setFormVisibility(e.target.value as CollectionItem['visibility'])}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
            >
              <option value="published">Published (Live in Navigation)</option>
              <option value="scheduled">Scheduled Drop</option>
              <option value="draft">Draft (Editorial review only)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Select Products for Collection
            </label>
            <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--tuw-border-subtle, #E2E4E6)', borderRadius: 8, padding: 8 }}>
              {products.map((p) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleProductSelect(p.id)}
                  />
                  <span>{p.name} ({p.category}) — ${p.price.toFixed(2)}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
