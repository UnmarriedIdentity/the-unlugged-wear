'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  Badge,
  Button,
  ContentCard,
  Drawer,
  DrawerSection,
  Input,
  PageHeader,
  SearchableMultiSelect,
  SearchableSelect,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';
import {
  ArrowLeft,
  Clock,
  Eye,
  History,
  Save,
  Send,
} from 'lucide-react';
import BlogContentPreview from '@/components/blog/BlogContentPreview';
import RichTextEditor from '@/components/blog/RichTextEditor';
import { useAdminState } from '@/mocks/state';
import {
  type BlogContent,
  type BlogDraft,
  type BlogStatus,
  extractBlogText,
  formatReadingTime,
  readingTimeMinutes,
  slugify,
} from '@/lib/blog';

interface BlogEditorProps {
  mode: 'create' | 'edit';
  postId?: string;
}

interface BlogEditorErrors {
  [field: string]: string | undefined;
}

const emptyDraft = (): BlogDraft => ({
  id: '',
  slug: '',
  title: '',
  subtitle: undefined,
  excerpt: undefined,
  categoryId: undefined,
  authorId: '',
  coverMediaId: undefined,
  ogMediaId: undefined,
  content: [],
  contentSchemaVersion: 1,
  status: 'draft',
  isFeatured: false,
  publishedAt: undefined,
  tagIds: [],
  seoTitle: undefined,
  seoDescription: undefined,
  canonicalUrl: undefined,
  noindex: false,
  createdBy: undefined,
  updatedBy: undefined,
});

const draftFromPost = (post?: BlogDraft): BlogDraft => {
  if (!post) return emptyDraft();
  return {
    ...post,
    content: Array.isArray(post.content) ? post.content : [],
    tagIds: Array.isArray(post.tagIds) ? [...post.tagIds] : [],
    contentSchemaVersion: post.contentSchemaVersion ?? 1,
  };
};

export default function BlogEditor({ mode, postId }: BlogEditorProps) {
  const router = useRouter();
  const {
    blogAuthors,
    blogCategories,
    blogMedia,
    blogPosts,
    blogRevisions,
    blogTags,
    saveBlogPost,
    restoreBlogRevision,
    canPerformAction,
  } = useAdminState();

  const post = useMemo(
    () => (mode === 'edit' && postId ? blogPosts.find((p) => p.id === postId) : undefined),
    [mode, postId, blogPosts]
  );

  const [form, setForm] = useState<BlogDraft>(() =>
    draftFromPost(mode === 'edit' ? post : undefined)
  );
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [errors, setErrors] = useState<BlogEditorErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);
  const [revisionToRestore, setRevisionToRestore] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'edit') return;
    if (!post) return;
    setForm(draftFromPost(post));
    setSlugTouched(true);
    setErrors({});
  }, [mode, post?.id, post?.version]);

  const contentText = useMemo(() => extractBlogText(form.content), [form.content]);
  const readTime = useMemo(() => readingTimeMinutes(contentText), [contentText]);
  const wordCount = useMemo(
    () => (contentText.trim() ? contentText.trim().split(/\s+/).length : 0),
    [contentText]
  );

  const categoryOptions = blogCategories
    .filter((category) => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      value: category.id,
      label: category.name,
      description: category.description,
    }));

  const authorOptions = blogAuthors
    .filter((author) => author.isActive)
    .map((author) => ({
      value: author.id,
      label: author.name,
      description: author.roleTitle,
      keywords: `${author.slug} ${author.roleTitle ?? ''}`,
    }));

  const tagOptions = blogTags.map((tag) => ({
    value: tag.id,
    label: tag.name,
    keywords: tag.slug,
  }));

  const mediaOptions = blogMedia.map((asset) => ({
    value: asset.id,
    label: asset.alt,
    description: asset.caption,
    keywords: `${asset.id} ${asset.url} ${asset.alt} ${asset.caption ?? ''}`,
  }));

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  const update = <K extends keyof BlogDraft>(key: K, value: BlogDraft[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
    setErrors((prev) => ({ ...prev, title: undefined }));
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    update('slug', value);
  };

  const toIso = (value: string | undefined) => {
    if (!value?.trim()) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  };

  const save = async (nextStatus?: BlogStatus) => {
    if (!canPerformAction('cms')) return;
    setIsSaving(true);
    const status: BlogStatus = nextStatus ?? form.status;
    const publishedAt =
      status === 'draft'
        ? undefined
        : status === 'scheduled'
          ? toIso(form.publishedAt)
          : toIso(form.publishedAt) ?? new Date().toISOString();
    const result = saveBlogPost(
      { ...form, status, publishedAt },
      nextStatus === 'published' || nextStatus === 'scheduled' ? 'publish' : 'draft'
    );
    setIsSaving(false);
    if (!result.ok) {
      setErrors(result.errors ?? {});
      return;
    }
    setErrors({});
    if (mode === 'create') {
      router.push('/content/journal');
    } else if (nextStatus && nextStatus !== form.status) {
      // Stay on the editor after a status change; the state-driven effect
      // syncs the new version below.
      setForm((prev) => ({ ...prev, status: nextStatus, publishedAt }));
    }
  };

  const handleRestore = (revisionId: string) => {
    const revision = blogRevisions.find((revision) => revision.id === revisionId);
    if (!revision) return;
    restoreBlogRevision(revisionId);
    setIsRevisionsOpen(false);
    setRevisionToRestore(null);
    router.push('/content/journal');
  };

  const revisionList = post
    ? blogRevisions
        .filter((revision) => revision.blogId === post.id)
        .sort((a, b) => b.revisionNo - a.revisionNo)
    : [];

  return (
    <DashboardShell pageTitle={mode === 'create' ? 'New Editorial Story' : 'Edit Editorial Story'}>
      <PageHeader
        title={mode === 'create' ? 'Compose Editorial Story' : 'Edit Editorial Story'}
        eyebrow={
          <Link
            href="/content/journal"
            style={{
              color: 'var(--tuw-text-secondary, #5D6772)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
            }}
          >
            <ArrowLeft size={14} /> Back to Journal
          </Link>
        }
        subtitle={
          mode === 'edit'
            ? `Version ${post?.version ?? 1} · ${post?.updatedAt ? new Date(post.updatedAt).toLocaleString() : 'Unsaved'}`
            : 'Draft a new article for the storefront journal.'
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              icon={<Eye size={16} />}
              onClick={() => setIsPreviewOpen(true)}
            >
              Preview
            </Button>
            {mode === 'edit' && (
              <Button
                variant="secondary"
                size="md"
                icon={<History size={16} />}
                onClick={() => setIsRevisionsOpen(true)}
              >
                Revisions
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              icon={<Send size={16} />}
              disabled={isSaving}
              onClick={() => save('published')}
            >
              Publish
            </Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <ContentCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Title"
                placeholder="e.g. Architectural Tailoring in Minimalist Apparel"
                value={form.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                error={errors.title}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Input
                  label="URL slug"
                  placeholder="auto-generated-from-title"
                  value={form.slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  error={errors.slug}
                  required
                />
                <Input
                  label="Subtitle"
                  placeholder="Editorial deck"
                  value={form.subtitle ?? ''}
                  onChange={(event) => update('subtitle', event.target.value)}
                  error={errors.subtitle}
                />
              </div>
              <Textarea
                label="Excerpt"
                placeholder="A short editorial teaser for cards and search results"
                value={form.excerpt ?? ''}
                onChange={(event) => update('excerpt', event.target.value)}
                error={errors.excerpt}
                rows={3}
              />
            </div>
          </ContentCard>

          <RichTextEditor
            content={form.content}
            mediaAssets={blogMedia}
            onChange={(content) => update('content', content)}
          />

          <ContentCard>
            <DrawerSection title="SEO">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input
                  label="SEO title"
                  placeholder="Falls back to the article title"
                  value={form.seoTitle ?? ''}
                  onChange={(event) => update('seoTitle', event.target.value)}
                  error={errors.seoTitle}
                />
                <Textarea
                  label="Meta description"
                  placeholder="Falls back to the excerpt"
                  value={form.seoDescription ?? ''}
                  onChange={(event) => update('seoDescription', event.target.value)}
                  error={errors.seoDescription}
                  rows={2}
                />
                <Input
                  label="Canonical URL"
                  placeholder="https://theunpluggedwear.com/journal/…"
                  value={form.canonicalUrl ?? ''}
                  onChange={(event) => update('canonicalUrl', event.target.value)}
                  error={errors.canonicalUrl}
                />
                <Switch
                  label="noindex"
                  description="Keep this article out of search engines."
                  checked={form.noindex}
                  onChange={(checked) => update('noindex', checked)}
                />
              </div>
            </DrawerSection>
          </ContentCard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ContentCard>
            <DrawerSection title="Publication">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(event) => update('status', event.target.value as BlogStatus)}
                  options={statusOptions}
                />
                <Input
                  label={form.status === 'scheduled' ? 'Scheduled for' : 'Published at'}
                  type="datetime-local"
                  value={form.publishedAt ? form.publishedAt.slice(0, 16) : ''}
                  onChange={(event) => update('publishedAt', event.target.value)}
                  error={errors.publishedAt}
                  helperText={form.status === 'scheduled' ? 'Must be in the future.' : undefined}
                />
                <Switch
                  label="Featured"
                  description="Use for the journal hero or teasers."
                  checked={form.isFeatured}
                  onChange={(checked) => update('isFeatured', checked)}
                />
                <Button
                  variant="primary"
                  size="md"
                  icon={<Save size={16} />}
                  onClick={() => save()}
                >
                  Save draft
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Clock size={16} />}
                  onClick={() => save('scheduled')}
                >
                  Schedule
                </Button>
              </div>
            </DrawerSection>
          </ContentCard>

          <ContentCard>
            <DrawerSection title="Taxonomy">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SearchableSelect
                  label="Category"
                  value={form.categoryId ?? ''}
                  onChange={(value) => update('categoryId', value)}
                  options={categoryOptions}
                  searchable
                  error={errors.categoryId}
                  placeholder="Select a category"
                />
                <SearchableSelect
                  label="Author"
                  value={form.authorId}
                  onChange={(value) => update('authorId', value)}
                  options={authorOptions}
                  searchable
                  error={errors.authorId}
                  placeholder="Select an author"
                />
                <SearchableMultiSelect
                  label="Tags"
                  value={form.tagIds}
                  onChange={(value) => update('tagIds', value)}
                  options={tagOptions}
                  searchable
                  error={errors.tagIds}
                  placeholder="Add tags"
                />
              </div>
            </DrawerSection>
          </ContentCard>

          <ContentCard>
            <DrawerSection title="Media">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SearchableSelect
                  label="Cover image"
                  value={form.coverMediaId ?? ''}
                  onChange={(value) => update('coverMediaId', value)}
                  options={mediaOptions}
                  searchable
                  error={errors.coverMediaId}
                  placeholder="Select a cover"
                />
                <SearchableSelect
                  label="Open Graph image"
                  value={form.ogMediaId ?? ''}
                  onChange={(value) => update('ogMediaId', value)}
                  options={mediaOptions}
                  searchable
                  error={errors.ogMediaId}
                  placeholder="Falls back to the cover"
                />
              </div>
            </DrawerSection>
          </ContentCard>

          <ContentCard>
            <DrawerSection title="Document">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {wordCount} words
                </div>
                <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {formatReadingTime(readTime)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  Schema v{form.contentSchemaVersion}
                </div>
                <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {form.content.length} block{form.content.length === 1 ? '' : 's'}
                </div>
              </div>
            </DrawerSection>
          </ContentCard>
        </div>
      </div>

      <Drawer
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Article preview"
        subtitle="Rendered from the validated JSON document — no raw HTML."
        width="720px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <Badge variant={form.status === 'published' ? 'success' : 'neutral'}>
              {form.status}
            </Badge>
            <h1 style={{ fontSize: 28, fontWeight: 600, marginTop: 14, marginBottom: 6 }}>
              {form.title || 'Untitled article'}
            </h1>
            {form.subtitle && (
              <p style={{ fontSize: 16, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
                {form.subtitle}
              </p>
            )}
          </div>
          {form.coverMediaId && (
            <img
              src={blogMedia.find((asset) => asset.id === form.coverMediaId)?.url}
              alt={blogMedia.find((asset) => asset.id === form.coverMediaId)?.alt ?? ''}
              style={{
                width: '100%',
                borderRadius: 12,
                border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                objectFit: 'cover',
                maxHeight: 320,
              }}
            />
          )}
          <BlogContentPreview content={form.content} mediaAssets={blogMedia} />
        </div>
      </Drawer>

      <Drawer
        isOpen={isRevisionsOpen}
        onClose={() => setIsRevisionsOpen(false)}
        title="Revision history"
        subtitle="Snapshots are immutable; restoring copies into a new draft version."
        width="620px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {revisionList.length === 0 ? (
            <p style={{ color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
              No revisions yet.
            </p>
          ) : (
            revisionList.map((revision) => (
              <ContentCard key={revision.id} padding="16px">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      Revision {revision.revisionNo}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 2 }}>
                      {new Date(revision.createdAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>
                      {revision.snapshot.contentText.slice(0, 120)}…
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setRevisionToRestore(revision.id)}
                  >
                    Restore
                  </Button>
                </div>
              </ContentCard>
            ))
          )}
        </div>
      </Drawer>

      <Drawer
        isOpen={Boolean(revisionToRestore)}
        onClose={() => setRevisionToRestore(null)}
        title="Restore revision"
        subtitle="The restored content becomes a new draft version."
        width="460px"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setRevisionToRestore(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => revisionToRestore && handleRestore(revisionToRestore)}
            >
              Restore
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
          This replaces the current editor contents with the selected snapshot. The live
          post will not change until you publish again.
        </p>
      </Drawer>
    </DashboardShell>
  );
}
