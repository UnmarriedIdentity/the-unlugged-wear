'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@admin/components/layout/DashboardShell';
import {
  Badge,
  ContentCard,
  EmptyState,
  Input,
  LinkButton,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui';
import { ArrowLeft, BookOpen, Plus, Search } from 'lucide-react';
import { useAdminState } from '@admin/mocks/state';
import {
  blogStatusBadgeVariant,
  formatReadingTime,
  type BlogStatus,
} from '@admin/lib/blog';

export default function JournalPage() {
  const { blogAuthors, blogCategories, blogPosts, blogTags } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BlogStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const categoryById = useMemo(
    () => new Map(blogCategories.map((category) => [category.id, category])),
    [blogCategories]
  );
  const authorById = useMemo(
    () => new Map(blogAuthors.map((author) => [author.id, author])),
    [blogAuthors]
  );
  const tagById = useMemo(
    () => new Map(blogTags.map((tag) => [tag.id, tag])),
    [blogTags]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, authorFilter, tagFilter, pageSize]);

  const filteredPosts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return blogPosts
      .filter((post) => {
        if (statusFilter !== 'all' && post.status !== statusFilter) return false;
        if (categoryFilter !== 'all' && post.categoryId !== categoryFilter) return false;
        if (authorFilter !== 'all' && post.authorId !== authorFilter) return false;
        if (tagFilter !== 'all' && !post.tagIds.includes(tagFilter)) return false;
        if (!query) return true;
        const haystack = [
          post.title,
          post.subtitle,
          post.excerpt,
          post.slug,
          categoryById.get(post.categoryId ?? '')?.name,
          authorById.get(post.authorId)?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [
    blogPosts,
    categoryById,
    authorById,
    searchTerm,
    statusFilter,
    categoryFilter,
    authorFilter,
    tagFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const categoryOptions = [
    { value: 'all', label: 'All categories' },
    ...blogCategories
      .filter((category) => category.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({ value: category.id, label: category.name })),
  ];

  const authorOptions = [
    { value: 'all', label: 'All authors' },
    ...blogAuthors
      .filter((author) => author.isActive)
      .map((author) => ({ value: author.id, label: author.name })),
  ];

  const tagOptions = [
    { value: 'all', label: 'All tags' },
    ...blogTags.map((tag) => ({ value: tag.id, label: tag.name })),
  ];

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'draft', label: 'Drafts' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  const publishedCount = blogPosts.filter((post) => post.status === 'published').length;
  const scheduledCount = blogPosts.filter((post) => post.status === 'scheduled').length;
  const draftCount = blogPosts.filter((post) => post.status === 'draft').length;
  const archivedCount = blogPosts.filter((post) => post.status === 'archived').length;

  return (
    <DashboardShell pageTitle="Journal & Stories">
      <PageHeader
        title="Editorial Journal & Stories"
        eyebrow={
          <Link
            href="/admin/content"
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
        }
        actions={
          <LinkButton
            href="/admin/content/journal/new"
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
          >
            New Story
          </LinkButton>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard
          label="Published Articles"
          value={`${publishedCount} Posts`}
          subtitle="Live on blog"
          trendType="up"
          hoverable
        />
        <StatCard
          label="Scheduled Articles"
          value={`${scheduledCount} Posts`}
          subtitle="Queued for future release"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Draft Stories"
          value={`${draftCount} Drafts`}
          subtitle="In editorial review"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="Archived Articles"
          value={`${archivedCount} Posts`}
          subtitle="Retired from the storefront"
          trendType="neutral"
          hoverable
        />
      </div>

      <ContentCard>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(4, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <Input
            placeholder="Search editorial stories…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            prefixIcon={<Search size={16} />}
          />
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as BlogStatus | 'all')}
            options={statusOptions}
          />
          <Select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            options={categoryOptions}
          />
          <Select
            value={authorFilter}
            onChange={(event) => setAuthorFilter(event.target.value)}
            options={authorOptions}
          />
          <Select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            options={tagOptions}
          />
        </div>

        {paginatedPosts.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={24} />}
            title="No editorial stories match your filters"
            description="Try a different status, category, author or tag."
          />
        ) : (
          <Table>
            <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
              <TableRow hoverable={false}>
                <TableHead style={{ padding: '12px 16px' }}>Article</TableHead>
                <TableHead style={{ padding: '12px 16px' }}>Category</TableHead>
                <TableHead style={{ padding: '12px 16px' }}>Author</TableHead>
                <TableHead style={{ padding: '12px 16px' }}>Reading time</TableHead>
                <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
                <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPosts.map((post) => {
                const category = post.categoryId
                  ? categoryById.get(post.categoryId)
                  : undefined;
                const author = authorById.get(post.authorId);
                const publishedAt = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString()
                  : '—';
                return (
                  <TableRow
                    key={post.id}
                    style={{
                      borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                      cursor: 'pointer',
                    }}
                  >
                    <TableCell style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--tuw-text-primary, #262626)',
                        }}
                      >
                        {post.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--tuw-text-secondary, #5D6772)',
                          marginTop: 2,
                        }}
                      >
                        /{post.slug} · {formatReadingTime(post.readingTimeMinutes)}
                      </div>
                    </TableCell>
                    <TableCell
                      style={{
                        padding: '14px 16px',
                        fontSize: 13,
                        color: 'var(--tuw-text-secondary, #5D6772)',
                      }}
                    >
                      {category?.name ?? '—'}
                    </TableCell>
                    <TableCell
                      style={{
                        padding: '14px 16px',
                        fontSize: 13,
                        color: 'var(--tuw-text-primary, #262626)',
                      }}
                    >
                      {author?.name ?? '—'}
                    </TableCell>
                    <TableCell
                      style={{
                        padding: '14px 16px',
                        fontSize: 13,
                        color: 'var(--tuw-text-secondary, #5D6772)',
                      }}
                    >
                      {publishedAt}
                    </TableCell>
                    <TableCell style={{ padding: '14px 16px' }}>
                      <Badge variant={blogStatusBadgeVariant(post.status)}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <Link
                        href={`/admin/content/journal/${post.id}/edit`}
                        style={{
                          textDecoration: 'none',
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--tuw-action-primary, #7539FF)',
                        }}
                      >
                        Edit
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredPosts.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>
    </DashboardShell>
  );
}
