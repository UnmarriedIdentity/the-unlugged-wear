'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Modal, Drawer, Pagination } from '@/components/ui';
import { BookOpen, Plus, ArrowLeft, Search, Eye, Edit3 } from 'lucide-react';
import { useAdminState } from '@/mocks/state';

interface StoryItem {
  id: string;
  title: string;
  slug: string;
  category: 'Lookbook' | 'Culture' | 'Sustainability' | 'Design Notes';
  author: string;
  views: number;
  readTime: string;
  status: 'published' | 'draft';
  publishedAt: string;
  excerpt: string;
}

const initialStories: StoryItem[] = [
  {
    id: 'ART-01',
    title: 'The Weight of Fabric: Why 280 GSM Changes Streetwear',
    slug: 'the-weight-of-fabric-280gsm',
    category: 'Design Notes',
    author: 'Elena Rostova',
    views: 14200,
    readTime: '4 min',
    status: 'published',
    publishedAt: '12 Apr 2026',
    excerpt: 'An investigation into organic combed cotton density and structured drapery for timeless silhouettes.',
  },
  {
    id: 'ART-02',
    title: 'Autumn/Winter 26 Editorial Lookbook: Echoes in Silence',
    slug: 'aw26-editorial-lookbook',
    category: 'Lookbook',
    author: 'Sora Tanaka',
    views: 22400,
    readTime: '6 min',
    status: 'published',
    publishedAt: '08 Apr 2026',
    excerpt: 'Captured across brutalist concrete landscapes in Berlin, exploring industrial minimalism and tonal textures.',
  },
  {
    id: 'ART-03',
    title: 'Zero-Waste Waterless Dyeing: Our Sustainable Transition',
    slug: 'zero-waste-waterless-dyeing',
    category: 'Sustainability',
    author: 'Ronan Vance',
    views: 8900,
    readTime: '3 min',
    status: 'published',
    publishedAt: '01 Apr 2026',
    excerpt: 'How on-demand print manufacturing drastically reduces textile runoff and microplastic contamination.',
  },
  {
    id: 'ART-04',
    title: 'Soundwave Resonance: The Typography of Acoustics',
    slug: 'soundwave-resonance-typography',
    category: 'Culture',
    author: 'Sora Tanaka',
    views: 2700,
    readTime: '5 min',
    status: 'draft',
    publishedAt: 'Draft',
    excerpt: 'Visualizing analog vinyl waveforms as functional vector screenprint artwork for limited run garments.',
  },
];

export default function JournalPage() {
  const { canPerformAction, showToast } = useAdminState();
  const [stories, setStories] = useState<StoryItem[]>(initialStories);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState<StoryItem['category']>('Design Notes');
  const [formAuthor, setFormAuthor] = useState('Elena Rostova');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formStatus, setFormStatus] = useState<StoryItem['status']>('published');

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredStories = stories.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredStories.length / pageSize));
  const paginatedStories = filteredStories.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('products')) return;

    const newStory: StoryItem = {
      id: `ART-${Math.floor(10 + Math.random() * 90)}`,
      title: formTitle || 'Untitled Editorial',
      slug: formSlug || formTitle.toLowerCase().replace(/\s+/g, '-'),
      category: formCategory,
      author: formAuthor,
      views: 0,
      readTime: '4 min',
      status: formStatus,
      publishedAt: formStatus === 'published' ? 'Just now' : 'Draft',
      excerpt: formExcerpt || 'Editorial reflection on contemporary fashion and urban design.',
    };

    setStories([newStory, ...stories]);
    setIsCreateOpen(false);
    setFormTitle('');
    setFormSlug('');
    setFormExcerpt('');
    showToast({
      type: 'success',
      title: 'Story Created',
      description: `"${newStory.title}" saved to editorial CMS.`,
    });
  };

  return (
    <DashboardShell pageTitle="Journal & Stories">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link href="/content" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back to Content
            </Link>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Editorial Journal & Stories
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Brand stories, lookbook releases, and cultural journalism published to the storefront journal.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={16} />}
          onClick={() => {
            if (canPerformAction('products')) setIsCreateOpen(true);
          }}
        >
          New Story
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Published Articles" value={`${stories.filter((s) => s.status === 'published').length} Posts`} subtitle="Live on blog" trendType="up" />
        <StatCard label="Draft Stories" value={`${stories.filter((s) => s.status === 'draft').length} Drafts`} subtitle="In editorial review" trendType="neutral" />
        <StatCard label="Total Story Views" value="48,200" trend="↑ 24% vs last month" trendType="up" />
        <StatCard label="Avg. Reading Time" value="4m 15s" subtitle="High reader retention" trendType="up" />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search editorial stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Article</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Author</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Views</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStories.map((story) => (
                <tr
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      {story.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      /{story.slug} · {story.readTime} read
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {story.category}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                    {story.author}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {story.views.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant={story.status === 'published' ? 'success' : 'neutral'}>
                      {story.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedStory(story); }}>
                      Edit
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
          totalItems={filteredStories.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </ContentCard>

      {/* Story Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedStory)}
        onClose={() => setSelectedStory(null)}
        title={selectedStory ? selectedStory.title : 'Article Details'}
        subtitle={selectedStory ? `By ${selectedStory.author} · ${selectedStory.publishedAt}` : ''}
      >
        {selectedStory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 16, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Category</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>{selectedStory.category}</div>
              </div>
              <Badge variant={selectedStory.status === 'published' ? 'success' : 'neutral'}>
                {selectedStory.status}
              </Badge>
            </div>

            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 8 }}>
                Article Lead Excerpt
              </h4>
              <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)', lineHeight: 1.6 }}>
                {selectedStory.excerpt}
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* New Story Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Compose Editorial Story"
        subtitle="Publish lookbook reflections and brand journalism to storefront"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateSubmit}>
              Save Story
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Story Title"
            placeholder="e.g. Architectural Tailoring in Minimalist Apparel"
            value={formTitle}
            onChange={(e) => {
              setFormTitle(e.target.value);
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
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as StoryItem['category'])}
                style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
              >
                <option value="Design Notes">Design Notes</option>
                <option value="Lookbook">Lookbook</option>
                <option value="Sustainability">Sustainability</option>
                <option value="Culture">Culture</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Publication Status
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as StoryItem['status'])}
              style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
            >
              <option value="published">Published (Live on blog)</option>
              <option value="draft">Draft (Editorial review)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
              Story Summary / Excerpt
            </label>
            <textarea
              rows={4}
              value={formExcerpt}
              onChange={(e) => setFormExcerpt(e.target.value)}
              placeholder="Lead narrative summary..."
              style={{ width: '100%', borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit' }}
            />
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
