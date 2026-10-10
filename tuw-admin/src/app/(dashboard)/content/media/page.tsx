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
  EmptyState,
  ImageWithFallback,
} from '@/components/ui';
import {
  Image as ImageIcon,
  Upload,
  ArrowLeft,
  Search,
  Copy,
  Trash2,
  ExternalLink,
  Check,
  FileCheck,
} from 'lucide-react';
import { useAdminState } from '@/mocks/state';

interface MediaAsset {
  id: string;
  filename: string;
  category: 'photoshoot' | 'banner' | 'product' | 'brand';
  url: string;
  size: string;
  dimensions: string;
  uploadedAt: string;
  mimeType: string;
}

const initialMedia: MediaAsset[] = [
  {
    id: 'media-1',
    filename: 'hoodie_slate_editorial_hero.webp',
    category: 'photoshoot',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=80',
    size: '1.4 MB',
    dimensions: '2400 x 1600',
    uploadedAt: '2026-09-28',
    mimeType: 'image/webp',
  },
  {
    id: 'media-2',
    filename: 'organic_tee_bone_flatlay.webp',
    category: 'product',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop&q=80',
    size: '890 KB',
    dimensions: '1800 x 1800',
    uploadedAt: '2026-09-27',
    mimeType: 'image/webp',
  },
  {
    id: 'media-3',
    filename: 'winter_capsule_hero_banner.webp',
    category: 'banner',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop&q=80',
    size: '2.1 MB',
    dimensions: '2880 x 1200',
    uploadedAt: '2026-09-25',
    mimeType: 'image/webp',
  },
  {
    id: 'media-4',
    filename: 'tuw_wordmark_monochrome_vector.svg',
    category: 'brand',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    size: '42 KB',
    dimensions: 'Vector SVG',
    uploadedAt: '2026-09-10',
    mimeType: 'image/svg+xml',
  },
  {
    id: 'media-5',
    filename: 'heavyweight_fleece_macro_detail.webp',
    category: 'photoshoot',
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&auto=format&fit=crop&q=80',
    size: '1.8 MB',
    dimensions: '2400 x 1600',
    uploadedAt: '2026-09-22',
    mimeType: 'image/webp',
  },
  {
    id: 'media-6',
    filename: 'minimal_tote_natural_canvas.webp',
    category: 'product',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=80',
    size: '1.1 MB',
    dimensions: '2000 x 2000',
    uploadedAt: '2026-09-18',
    mimeType: 'image/webp',
  },
];

export default function MediaLibraryPage() {
  const { showToast, canPerformAction } = useAdminState();
  const [mediaList, setMediaList] = useState<MediaAsset[]>(initialMedia);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'photoshoot' | 'banner' | 'product' | 'brand'>('all');

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload Form
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'photoshoot' | 'banner' | 'product' | 'brand'>('photoshoot');
  const [uploadUrl, setUploadUrl] = useState('');
  const [localObjectUrl, setLocalObjectUrl] = useState<string | null>(null);

  // Clean up browser-local object URLs when preview changes or modal closes
  React.useEffect(() => {
    return () => {
      if (localObjectUrl) {
        URL.revokeObjectURL(localObjectUrl);
      }
    };
  }, [localObjectUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'Upload Rejected',
        description: 'File size exceeds the 25MB maximum limit.',
      });
      return;
    }

    if (localObjectUrl) {
      URL.revokeObjectURL(localObjectUrl);
    }

    const preview = URL.createObjectURL(file);
    setLocalObjectUrl(preview);
    setUploadFilename(file.name);
    setUploadUrl(preview);
  };

  const filteredMedia = mediaList.filter((m) => {
    const matchesSearch = m.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    showToast({
      type: 'info',
      title: 'Copied to Clipboard',
      description: 'Asset CDN URL copied.',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Permission Denied',
        description: 'Your current role cannot upload media assets.',
      });
      return;
    }

    if (!uploadFilename.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Filename is required.',
      });
      return;
    }

    const newAsset: MediaAsset = {
      id: `media-${Date.now()}`,
      filename: uploadFilename.trim().endsWith('.webp') ? uploadFilename.trim() : `${uploadFilename.trim()}.webp`,
      category: uploadCategory,
      url: uploadUrl.trim() || 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop&q=80',
      size: '1.2 MB',
      dimensions: '2000 x 2000',
      uploadedAt: new Date().toISOString().split('T')[0],
      mimeType: 'image/webp',
    };

    setMediaList((prev) => [newAsset, ...prev]);
    setIsUploadModalOpen(false);
    setUploadFilename('');
    setUploadUrl('');
    if (localObjectUrl) {
      URL.revokeObjectURL(localObjectUrl);
      setLocalObjectUrl(null);
    }
    showToast({
      type: 'success',
      title: 'Asset Uploaded',
      description: `"${newAsset.filename}" stored in cloud CDN.`,
    });
  };

  const handleDeleteAsset = (id: string) => {
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Permission Denied',
        description: 'Your current role cannot delete media assets.',
      });
      return;
    }

    setMediaList((prev) => prev.filter((m) => m.id !== id));
    setIsDetailDrawerOpen(false);
    showToast({
      type: 'info',
      title: 'Asset Removed',
      description: 'Media item deleted from CDN index.',
    });
  };

  return (
    <DashboardShell pageTitle="Media Library">
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
            Media & Asset Storage
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            High-resolution lookbook assets, campaign photoshoots, and product photography.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Upload size={16} />}
          onClick={() => setIsUploadModalOpen(true)}
        >
          Upload Files
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard
          label="Total Files"
          value={`${mediaList.length} Assets`}
          subtitle="Images, vectors & video"
          trendType="neutral"
          hoverable
        />
        <StatCard
          label="CDN Storage Used"
          value="4.2 GB"
          subtitle="Out of 50 GB quota (8.4%)"
          trendType="up"
          hoverable
        />
        <StatCard
          label="Optimization Rate"
          value="99.4% WebP"
          subtitle="Next.js image pipeline"
          trendType="up"
          hoverable
        />
        <StatCard
          label="Bandwidth (30d)"
          value="128 GB"
          subtitle="High speed edge delivery"
          trendType="up"
          hoverable
        />
      </div>

      <ContentCard>
        {/* Filters */}
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
              placeholder="Search filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              iconPrefix={<Search size={16} />}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'photoshoot', 'banner', 'product', 'brand'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor:
                    categoryFilter === cat
                      ? 'var(--tuw-action-primary, #7539FF)'
                      : 'var(--tuw-bg-surface-subtle, #F1F3F5)',
                  color: categoryFilter === cat ? '#FFFFFF' : 'var(--tuw-text-secondary, #5D6772)',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        {filteredMedia.length === 0 ? (
          <EmptyState
            title="No media found"
            description="Try adjusting your filter or search query."
            actionLabel="Upload Media"
            onAction={() => setIsUploadModalOpen(true)}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {filteredMedia.map((asset) => (
              <div
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset);
                  setIsDetailDrawerOpen(true);
                }}
                style={{
                  border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                  borderRadius: 'var(--tuw-radius-card, 12px)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ height: '140px', width: '100%', overflow: 'hidden', backgroundColor: 'var(--tuw-bg-surface-subtle, #F1F3F5)' }}>
                  <ImageWithFallback
                    src={asset.url}
                    alt={asset.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '12px' }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--tuw-text-primary, #262626)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {asset.filename}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 6,
                      fontSize: 12,
                      color: 'var(--tuw-text-secondary, #5D6772)',
                    }}
                  >
                    <Badge variant="neutral">{asset.category}</Badge>
                    <span>{asset.size}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Media Asset"
        subtitle="Max file size 25MB. Automatically converted to WebP edge format."
      >
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 6, display: 'block' }}>
              Select Local File (Browser Object URL Preview)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{
                fontSize: 13,
                padding: '8px 12px',
                border: '1px solid var(--tuw-border-control, #90979F)',
                borderRadius: 'var(--tuw-radius-control, 8px)',
                width: '100%',
                backgroundColor: '#FFFFFF',
              }}
            />
            {localObjectUrl && (
              <div style={{ marginTop: 8, height: 110, borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E4E6' }}>
                <ImageWithFallback
                  src={localObjectUrl}
                  alt="Preview"
                  fallbackTone="info"
                  fallbackText="Image not found"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 0, border: 'none', borderRadius: 0, padding: 0 }}
                />
              </div>
            )}
          </div>
          <Input
            label="Asset Filename"
            placeholder="e.g. spring_campaign_look_01.webp"
            value={uploadFilename}
            onChange={(e) => setUploadFilename(e.target.value)}
            required
          />
          <Select
            label="Asset Category"
            value={uploadCategory}
            onChange={(val) => setUploadCategory(val as any)}
            options={[
              { value: 'photoshoot', label: 'Photoshoot & Editorial' },
              { value: 'product', label: 'Product Catalog Flatlay' },
              { value: 'banner', label: 'Hero / Banner Graphic' },
              { value: 'brand', label: 'Brand Logo & Typography' },
            ]}
          />
          <Input
            label="CDN Source URL (Simulated)"
            placeholder="https://images.unsplash.com/..."
            value={uploadUrl}
            onChange={(e) => setUploadUrl(e.target.value)}
            helperText="Provide an image URL or choose a file above to test local object URL previews."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Upload to CDN
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedAsset ? selectedAsset.filename : 'Asset Details'}
        subtitle={selectedAsset ? `${selectedAsset.dimensions} • ${selectedAsset.size}` : ''}
        width="480px"
      >
        {selectedAsset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                maxHeight: '260px',
              }}
            >
              <ImageWithFallback
                src={selectedAsset.url}
                alt={selectedAsset.filename}
                style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>MIME Type:</span>
                <span style={{ fontWeight: 500 }}>{selectedAsset.mimeType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Dimensions:</span>
                <span style={{ fontWeight: 500 }}>{selectedAsset.dimensions}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>File Size:</span>
                <span style={{ fontWeight: 500 }}>{selectedAsset.size}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Uploaded Date:</span>
                <span style={{ fontWeight: 500 }}>{selectedAsset.uploadedAt}</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', marginBottom: 6, display: 'block' }}>
                Public CDN URL
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input value={selectedAsset.url} readOnly />
                <Button
                  variant="secondary"
                  onClick={() => handleCopyUrl(selectedAsset.url, selectedAsset.id)}
                  icon={copiedId === selectedAsset.id ? <Check size={16} /> : <Copy size={16} />}
                >
                  {copiedId === selectedAsset.id ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div style={{ marginTop: 24, borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)', paddingTop: 16 }}>
              <Button
                variant="danger"
                fullWidth
                icon={<Trash2 size={16} />}
                onClick={() => handleDeleteAsset(selectedAsset.id)}
              >
                Delete Asset from CDN
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </DashboardShell>
  );
}
