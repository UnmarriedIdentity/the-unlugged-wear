'use client';

import React, { useEffect, useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  ContentCard,
  StatCard,
  Badge,
  Button,
  DropdownMenu,
  IconButton,
  Input,
  Modal,
  Pagination,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PageHeader,
} from '@/components/ui';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import type { CollectionItem } from '@/mocks/fixtures';
import { collectionCount, uniqueSlug } from '@/lib/collections';
import CollectionFormDrawer from './_components/collections/CollectionFormDrawer';
import CollectionDetailDrawer from './_components/collections/CollectionDetailDrawer';

export default function CollectionsPage() {
  const { collections, createCollection, deleteCollection, products, canPerformAction } =
    useAdminState();
  const canManage = canPerformAction('products');

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Drawers & confirm dialog. Detail/edit are id-driven so the open surface
  // always reflects live state (no stale snapshots after a save).
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [returnToDetailId, setReturnToDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollectionItem | null>(null);

  const selectedCol = selectedColId
    ? (collections.find((c) => c.id === selectedColId) ?? null)
    : null;
  const editingCol = editingId ? (collections.find((c) => c.id === editingId) ?? null) : null;

  useEffect(() => {
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

  const openCreate = () => {
    if (!canManage) return;
    setEditingId(null);
    setReturnToDetailId(null);
    setFormOpen(true);
  };

  const openEdit = (id: string, fromDetail = false) => {
    if (!canManage) return;
    setReturnToDetailId(fromDetail ? id : null);
    setSelectedColId(null);
    setEditingId(id);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleSaved = (id: string) => {
    // Edited from the detail drawer → reopen it with the fresh data.
    if (returnToDetailId === id) setSelectedColId(id);
    setReturnToDetailId(null);
  };

  const handleDuplicate = (col: CollectionItem) => {
    if (!canManage) return;
    const name = `${col.name} (Copy)`;
    createCollection({
      name,
      slug: uniqueSlug(name, collections),
      season: col.season,
      visibility: 'draft',
      description: col.description,
      productIds: [...col.productIds],
    });
  };

  const handleRowAction = (col: CollectionItem, action: string) => {
    if (action === 'view') setSelectedColId(col.id);
    else if (action === 'edit') openEdit(col.id);
    else if (action === 'duplicate') handleDuplicate(col);
    else if (action === 'delete') setDeleteTarget(col);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const deleted = deleteCollection(deleteTarget.id);
    if (deleted && selectedColId === deleteTarget.id) setSelectedColId(null);
    setDeleteTarget(null);
  };

  const actionItems = canManage
    ? [
        { value: 'view', label: 'View details' },
        { value: 'edit', label: 'Edit collection' },
        { value: 'duplicate', label: 'Duplicate' },
        { value: 'delete', label: 'Delete collection', danger: true },
      ]
    : [{ value: 'view', label: 'View details' }];

  return (
    <DashboardShell pageTitle="Collections">
      <PageHeader
        title="Apparel Collections"
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            disabled={!canManage}
            title={canManage ? undefined : 'Your demo role cannot manage collections'}
            onClick={openCreate}
          >
            Create Collection
          </Button>
        }
      />

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
                onClick={() => setSelectedColId(item.id)}
                style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer' }}
              >
                <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                  {item.name}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  /{item.slug}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                  {collectionCount(item)} items
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
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'inline-flex', justifyContent: 'flex-end' }}
                  >
                    <DropdownMenu
                      trigger={
                        <IconButton
                          label={`Actions for ${item.name}`}
                          icon={<MoreHorizontal size={18} />}
                          size="sm"
                        />
                      }
                      items={actionItems}
                      onSelect={(action) => handleRowAction(item, action)}
                      ariaLabel={`Actions for ${item.name}`}
                      align="right"
                    />
                  </div>
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

      <CollectionDetailDrawer
        collection={selectedCol}
        products={products}
        canEdit={canManage}
        onClose={() => setSelectedColId(null)}
        onEdit={(id) => openEdit(id, true)}
      />

      <CollectionFormDrawer
        isOpen={formOpen}
        collection={editingCol}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete collection?"
        subtitle={deleteTarget ? deleteTarget.name : ''}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={confirmDelete}>
              Delete Collection
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
          This removes <strong style={{ color: 'var(--tuw-text-primary, #262626)' }}>{deleteTarget?.name}</strong> from
          the demo workspace. Products stay in the catalog. This can&apos;t be undone — use Reset Demo to restore the
          baseline collections.
        </p>
      </Modal>
    </DashboardShell>
  );
}
