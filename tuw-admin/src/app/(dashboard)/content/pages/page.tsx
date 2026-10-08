'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  ContentCard,
  StatCard,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  Drawer,
  Textarea,
  EmptyState,
  Pagination,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import {
  FileText,
  Plus,
  ArrowLeft,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useAdminState } from '@/mocks/state';

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft';
  lastModified: string;
  views30d: number;
  content: string;
  metaDescription: string;
}

const initialPages: StaticPage[] = [
  {
    id: 'page-1',
    title: 'About The Unplugged Wear',
    slug: '/about',
    status: 'published',
    lastModified: '2026-09-15',
    views30d: 4820,
    metaDescription: 'Mindful, heavy-cotton streetwear crafted on-demand without excess inventory.',
    content: 'We believe in intentional apparel that respects your space, the planet, and local artisans...',
  },
  {
    id: 'page-2',
    title: 'Sustainability Manifesto',
    slug: '/about/sustainability',
    status: 'published',
    lastModified: '2026-09-20',
    views30d: 2150,
    metaDescription: 'Zero deadstock print-on-demand manufacturing using 100% GOTS organic cotton.',
    content: 'Fashion produces 92 million tons of textile waste annually. TUW operates purely on-demand...',
  },
  {
    id: 'page-3',
    title: 'Fit & Sizing Guide',
    slug: '/size-guide',
    status: 'published',
    lastModified: '2026-08-30',
    views30d: 9340,
    metaDescription: 'Detailed measurement tables in CM and Inches for all hoodies, tees, and relaxed trousers.',
    content: 'Our garments are tailored with a contemporary relaxed drop-shoulder silhouette...',
  },
  {
    id: 'page-4',
    title: 'Terms of Service',
    slug: '/policies/terms',
    status: 'published',
    lastModified: '2026-07-10',
    views30d: 1120,
    metaDescription: 'Transparent terms governing your orders and membership on The Unplugged Wear.',
    content: 'By accessing or using The Unplugged Wear platform, you agree to comply with these terms...',
  },
  {
    id: 'page-5',
    title: 'Privacy Policy',
    slug: '/policies/privacy',
    status: 'published',
    lastModified: '2026-07-10',
    views30d: 980,
    metaDescription: 'How TUW securely handles your address, payment tokens, and shopping preferences.',
    content: 'We do not sell personal information. Payment tokens are processed via certified gateways...',
  },
  {
    id: 'page-6',
    title: 'Brand Story 2027 (Winter Capsule)',
    slug: '/campaigns/winter-2027',
    status: 'draft',
    lastModified: '2026-10-01',
    views30d: 0,
    metaDescription: 'Preview of our unreleased heavy fleece drop exploring urban isolation and digital detox.',
    content: 'Draft campaign copy and lookbook curation...',
  },
];

export default function PagesManagementPage() {
  const { showToast, canPerformAction } = useAdminState();
  const [pages, setPages] = useState<StaticPage[]>(initialPages);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<StaticPage | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // New page form state
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newMeta, setNewMeta] = useState('');
  const [newStatus, setNewStatus] = useState<'published' | 'draft'>('published');
  const [newContent, setNewContent] = useState('');

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const filteredPages = pages.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / pageSize));
  const paginatedPages = filteredPages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Permission Denied',
        description: 'Your current role lacks permissions to publish CMS pages.',
      });
      return;
    }

    if (!newTitle.trim() || !newSlug.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Page title and slug are required.',
      });
      return;
    }

    const newPage: StaticPage = {
      id: `page-${Date.now()}`,
      title: newTitle.trim(),
      slug: newSlug.startsWith('/') ? newSlug.trim() : `/${newSlug.trim()}`,
      status: newStatus,
      lastModified: new Date().toISOString().split('T')[0],
      views30d: 0,
      metaDescription: newMeta.trim() || 'Custom static page on The Unplugged Wear.',
      content: newContent.trim() || 'Page content goes here.',
    };

    setPages((prev) => [newPage, ...prev]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewSlug('');
    setNewMeta('');
    setNewContent('');
    showToast({
      type: 'success',
      title: 'Page Created',
      description: `"${newPage.title}" created successfully as ${newPage.status}.`,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Permission Denied',
        description: 'Your role cannot edit static pages.',
      });
      return;
    }

    setPages((prev) =>
      prev.map((p) => (p.id === selectedPage.id ? { ...selectedPage, lastModified: new Date().toISOString().split('T')[0] } : p))
    );
    setIsEditDrawerOpen(false);
    showToast({
      type: 'success',
      title: 'Page Updated',
      description: `Saved changes to "${selectedPage.title}".`,
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Permission Denied',
        description: 'Your role cannot delete static pages.',
      });
      setDeleteTargetId(null);
      return;
    }

    const target = pages.find((p) => p.id === deleteTargetId);
    setPages((prev) => prev.filter((p) => p.id !== deleteTargetId));
    setDeleteTargetId(null);
    showToast({
      type: 'info',
      title: 'Page Deleted',
      description: `Removed "${target?.title || 'page'}" from static pages.`,
    });
  };

  return (
    <DashboardShell pageTitle="Static Pages">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link
              href="/content"
              style={{
                color: 'var(--tuw-text-secondary, #5D6772)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
              }}
            >
              <ArrowLeft size={14} /> Back to Content
            </Link>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Static CMS Pages
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Manage About Us, Sustainability Manifesto, Fit Guide, Terms of Service, and Policies.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Page
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard
          label="Published Pages"
          value={`${pages.filter((p) => p.status === 'published').length} Pages`}
          subtitle="Indexed by search engines"
          trendType="up"
          hoverable
        />
        <StatCard
          label="Draft Pages"
          value={`${pages.filter((p) => p.status === 'draft').length} Pages`}
          subtitle="Pending content sign-off"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Total 30d Pageviews"
          value={`${pages.reduce((acc, p) => acc + p.views30d, 0).toLocaleString()} Views`}
          subtitle="Direct and organic traffic"
          trendType="up"
          hoverable
        />
        <StatCard
          label="Avg. TTFB"
          value="0.24s"
          subtitle="Edge CDN pre-rendered"
          trendType="up"
          hoverable
        />
      </div>

      <ContentCard>
        {/* Filter / Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ width: 280 }}>
            <Input
              placeholder="Search by title or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              iconPrefix={<Search size={16} />}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>Status:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'published', 'draft'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor:
                      statusFilter === st
                        ? 'var(--tuw-action-primary, #7539FF)'
                        : 'var(--tuw-bg-surface-subtle, #F1F3F5)',
                    color: statusFilter === st ? '#FFFFFF' : 'var(--tuw-text-secondary, #5D6772)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table / List */}
        {filteredPages.length === 0 ? (
          <EmptyState
            title="No pages found"
            description="Try changing your search terms or filter criteria."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          />
        ) : (
          <Table>
            <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
              <TableRow hoverable={false}>
                <TableHead style={{ padding: '12px 16px' }}>Page Title & Path</TableHead>
                <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
                <TableHead style={{ padding: '12px 16px' }}>Last Modified</TableHead>
                <TableHead style={{ padding: '12px 16px' }}>30d Views</TableHead>
                <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPages.map((page) => (
                <TableRow
                  key={page.id}
                  hoverable={false}
                  style={{
                    borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <TableCell style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      {page.title}
                    </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--tuw-action-primary, #7539FF)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        <code>{page.slug}</code>
                      </div>
                    </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
                    <Badge variant={page.status === 'published' ? 'success' : 'neutral'}>
                      {page.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {page.lastModified}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {page.views30d.toLocaleString()}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPage(page);
                            setIsEditDrawerOpen(true);
                          }}
                        >
                          <Edit2 size={14} /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          style={{ color: 'var(--tuw-status-danger, #EF4444)' }}
                          onClick={() => setDeleteTargetId(page.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        )}

        {filteredPages.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredPages.length}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}
      </ContentCard>

      {/* Create Page Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Static Page"
        subtitle="Publish a new markdown-rendered marketing or legal page."
      >
        <form onSubmit={handleCreatePage} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Page Title"
            placeholder="e.g. Care & Maintenance Guide"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              if (!newSlug) {
                setNewSlug(
                  '/' +
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '')
                );
              }
            }}
            required
          />
          <Input
            label="URL Slug"
            placeholder="/care-guide"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            required
          />
          <Select
            label="Publication Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as 'published' | 'draft')}
            options={[
              { value: 'published', label: 'Published (Publicly Accessible)' },
              { value: 'draft', label: 'Draft (Internal Preview Only)' },
            ]}
          />
          <Textarea
            label="Meta Description"
            placeholder="Summary for search engines and social shares (under 160 chars)..."
            value={newMeta}
            onChange={(e) => setNewMeta(e.target.value)}
            rows={2}
          />
          <Textarea
            label="Page Markdown Content"
            placeholder="# Introduction&#10;Write page copy here..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={6}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save & Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Page Drawer */}
      <Drawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        title={selectedPage ? `Edit ${selectedPage.title}` : 'Edit Page'}
        subtitle={selectedPage?.slug}
        width="540px"
      >
        {selectedPage && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Page Title"
              value={selectedPage.title}
              onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
              required
            />
            <Input
              label="URL Slug"
              value={selectedPage.slug}
              onChange={(e) => setSelectedPage({ ...selectedPage, slug: e.target.value })}
              required
            />
            <Select
              label="Publication Status"
              value={selectedPage.status}
              onChange={(e) =>
                setSelectedPage({ ...selectedPage, status: e.target.value as 'published' | 'draft' })
              }
              options={[
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
            <Textarea
              label="Meta Description"
              value={selectedPage.metaDescription}
              onChange={(e) => setSelectedPage({ ...selectedPage, metaDescription: e.target.value })}
              rows={3}
            />
            <Textarea
              label="Page Content"
              value={selectedPage.content}
              onChange={(e) => setSelectedPage({ ...selectedPage, content: e.target.value })}
              rows={10}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button variant="secondary" onClick={() => setIsEditDrawerOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Static Page?"
        subtitle="This action cannot be undone and will remove the public route."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Are you sure you want to permanently delete this page? Any backlinks or bookmarks will result in a 404 page.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setDeleteTargetId(null)}>
              Keep Page
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Yes, Delete Page
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
