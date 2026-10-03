'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Modal, Drawer } from '@/components/ui';
import { Palette, Plus, Search, Filter, Image as ImageIcon, UploadCloud, AlertCircle } from 'lucide-react';
import { useAdminState } from '@/mocks/state';
import { DesignAsset } from '@/mocks/fixtures';

export default function DesignsPage() {
  const { designs, uploadDesignAsset, canPerformAction } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Drawers
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<DesignAsset | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<DesignAsset['category']>('Print Artwork');
  const [formDesigner, setFormDesigner] = useState('Sora Tanaka');
  const [formPlacement, setFormPlacement] = useState('Left Chest (45mm)');
  const [formDimensions, setFormDimensions] = useState('45mm × 45mm');
  const [formFormat, setFormFormat] = useState('Vector SVG');
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  const filtered = designs.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.designer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 25MB
    if (file.size > 25 * 1024 * 1024) {
      setFileError('File exceeds maximum upload threshold of 25MB.');
      setFileName('');
      return;
    }

    setFileError(null);
    setFileName(file.name);
    if (!formName) {
      setFormName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileError) return;

    uploadDesignAsset({
      name: formName || 'Untitled Artwork Asset',
      category: formCategory,
      designer: formDesigner,
      placement: formPlacement,
      dimensions: formDimensions,
      fileFormat: formFormat,
      fileSize: '3.4 MB',
      status: 'approved',
    });

    setIsUploadOpen(false);
    setFormName('');
    setFileName('');
  };

  return (
    <DashboardShell pageTitle="Design Assets">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Apparel Artwork & Design Library
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Vector production files, screenprint separations, embroidery digitizations, and placement metadata.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => {
              if (canPerformAction('products')) {
                setFileError(null);
                setIsUploadOpen(true);
              }
            }}
          >
            Upload Asset
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Approved Artworks" value={String(designs.filter((d) => d.status === 'approved').length)} subtitle="Ready for factory print" trendType="up" />
        <StatCard label="In Sampling Review" value={String(designs.filter((d) => d.status === 'in_review').length)} subtitle="Strike-offs pending" trendType="neutral" />
        <StatCard label="Total Vector Files" value={`${designs.length} Assets`} trend="High-fidelity 300+ DPI" trendType="neutral" />
        <StatCard label="Digitized Specs" value="100% Validated" subtitle="Direct print compatible" trendType="up" />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search design assets..."
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
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Asset ID</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Placement Spec</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Designer</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((design) => (
                <tr
                  key={design.id}
                  onClick={() => setSelectedAsset(design)}
                  style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                    {design.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {design.name}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {design.category}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                    {design.placement}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {design.designer}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {design.status === 'approved' && <Badge variant="success">Approved</Badge>}
                    {design.status === 'in_review' && <Badge variant="warning">In Review</Badge>}
                    {design.status === 'archived' && <Badge variant="neutral">Archived</Badge>}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedAsset(design); }}>
                      Inspect Spec
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Asset Spec Drawer */}
      <Drawer
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset ? selectedAsset.name : 'Design Asset'}
        subtitle={selectedAsset ? `${selectedAsset.id} · ${selectedAsset.category}` : ''}
      >
        {selectedAsset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 16, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Format & Dimensions</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>
                  {selectedAsset.dimensions} ({selectedAsset.fileFormat})
                </div>
              </div>
              <Badge variant={selectedAsset.status === 'approved' ? 'success' : 'warning'}>
                {selectedAsset.status}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Placement Position:</span>
                <strong>{selectedAsset.placement}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Designer / Lead:</span>
                <span>{selectedAsset.designer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>File Size:</span>
                <span>{selectedAsset.fileSize}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Last Validated:</span>
                <span>{selectedAsset.updatedAt}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Upload Asset Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Apparel Artwork Spec"
        subtitle="Enforces documented size (<25MB) and vector format limits"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleUploadSubmit}>
              Register Artwork
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fileError && (
            <div style={{ padding: 10, borderRadius: 8, backgroundColor: 'var(--tuw-bg-error, #FEF4F4)', color: 'var(--tuw-text-error, #C91818)', fontSize: 13 }}>
              {fileError}
            </div>
          )}

          <div
            style={{
              border: '2px dashed var(--tuw-border-control, #90979F)',
              borderRadius: 8,
              padding: 24,
              textAlign: 'center',
              backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
            }}
          >
            <UploadCloud size={32} color="var(--tuw-action-primary, #7539FF)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)' }}>
              {fileName ? fileName : 'Choose artwork file or drag here'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>
              Supports SVG, AI, EPS, PDF, high-res PNG (Max 25MB)
            </div>
            <input
              type="file"
              accept=".svg,.ai,.eps,.pdf,.png"
              onChange={handleFileSimulate}
              style={{ marginTop: 12 }}
            />
          </div>

          <Input
            label="Artwork Asset Title"
            placeholder="e.g. Acid Wash Chest Monogram"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as DesignAsset['category'])}
                style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
              >
                <option value="Print Artwork">Print Artwork</option>
                <option value="Embroidery">Embroidery</option>
                <option value="Typography">Typography</option>
                <option value="Label Spec">Label Spec</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                Print Placement
              </label>
              <select
                value={formPlacement}
                onChange={(e) => setFormPlacement(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
              >
                <option value="Left Chest (45mm)">Left Chest (45mm)</option>
                <option value="Back Oversized">Back Oversized</option>
                <option value="Sleeve Length">Sleeve Length</option>
                <option value="Interior Hem">Interior Hem</option>
                <option value="Front Chest (220mm)">Front Chest (220mm)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Dimensions"
              placeholder="e.g. 240mm × 300mm"
              value={formDimensions}
              onChange={(e) => setFormDimensions(e.target.value)}
              required
            />
            <Input
              label="Designer"
              value={formDesigner}
              onChange={(e) => setFormDesigner(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
