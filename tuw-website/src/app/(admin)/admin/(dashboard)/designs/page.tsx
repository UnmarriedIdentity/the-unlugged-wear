'use client';

import React, { useState } from 'react';
import DashboardShell from '@admin/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input, Select, Drawer, Pagination, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PageHeader, HeroCard, KeyValueList } from '@admin/components/ui';
import { Palette, Plus, Search, Filter, Image as ImageIcon, UploadCloud, AlertCircle } from 'lucide-react';
import { useAdminState } from '@admin/mocks/state';
import { DesignAsset } from '@admin/mocks/fixtures';

export default function DesignsPage() {
  const { designs, uploadDesignAsset, canPerformAction } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

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

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filtered = designs.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.designer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      <PageHeader
        title="Apparel Artwork & Design Library"
        actions={
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
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Approved Artworks" value={String(designs.filter((d) => d.status === 'approved').length)} subtitle="Ready for factory print" trendType="up" hoverable />
        <StatCard label="In Sampling Review" value={String(designs.filter((d) => d.status === 'in_review').length)} subtitle="Strike-offs pending" trendType="neutral" hoverable />
        <StatCard label="Total Vector Files" value={`${designs.length} Assets`} trend="High-fidelity 300+ DPI" trendType="neutral" hoverable />
        <StatCard label="Digitized Specs" value="100% Validated" subtitle="Direct print compatible" trendType="up" hoverable />
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

        <Table>
          <TableHeader style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px' }}>Asset ID</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Name</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Category</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Placement Spec</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Designer</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((design) => (
              <TableRow
                key={design.id}
                onClick={() => setSelectedAsset(design)}
                style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', cursor: 'pointer' }}
              >
                <TableCell style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                  {design.id}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                  {design.name}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {design.category}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                  {design.placement}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {design.designer}
                </TableCell>
                <TableCell style={{ padding: '14px 16px' }}>
                  {design.status === 'approved' && <Badge variant="success">Approved</Badge>}
                  {design.status === 'in_review' && <Badge variant="warning">In Review</Badge>}
                  {design.status === 'archived' && <Badge variant="neutral">Archived</Badge>}
                </TableCell>
                <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedAsset(design); }}>
                    Inspect Spec
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

      {/* Asset Spec Drawer */}
      <Drawer
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset ? selectedAsset.name : 'Design Asset'}
        subtitle={selectedAsset ? `${selectedAsset.id} · ${selectedAsset.category}` : ''}
      >
        {selectedAsset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <HeroCard
              badge={
                <Badge variant={selectedAsset.status === 'approved' ? 'success' : 'warning'}>
                  {selectedAsset.status}
                </Badge>
              }
            >
              <div>
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>Format & Dimensions</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginTop: 2 }}>
                  {selectedAsset.dimensions} ({selectedAsset.fileFormat})
                </div>
              </div>
            </HeroCard>

            <KeyValueList
              items={[
                { label: 'Placement Position:', value: <strong>{selectedAsset.placement}</strong> },
                { label: 'Designer / Lead:', value: <span>{selectedAsset.designer}</span> },
                { label: 'File Size:', value: <span>{selectedAsset.fileSize}</span> },
                { label: 'Last Validated:', value: <span>{selectedAsset.updatedAt}</span> },
              ]}
            />
          </div>
        )}
      </Drawer>

      {/* Upload Asset Drawer */}
      <Drawer
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Apparel Artwork Spec"
        subtitle="Enforces documented size (<25MB) and vector format limits"
        width="540px"
        footer={
          <>
            <Button variant="secondary" size="md" type="button" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" form="design-upload-form">
              Register Artwork
            </Button>
          </>
        }
      >
        <form id="design-upload-form" onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <Select
              label="Category"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as DesignAsset['category'])}
              options={[
                { value: 'Print Artwork', label: 'Print Artwork' },
                { value: 'Embroidery', label: 'Embroidery' },
                { value: 'Typography', label: 'Typography' },
                { value: 'Label Spec', label: 'Label Spec' },
              ]}
            />

            <Select
              label="Print Placement"
              value={formPlacement}
              onChange={(e) => setFormPlacement(e.target.value)}
              options={[
                { value: 'Left Chest (45mm)', label: 'Left Chest (45mm)' },
                { value: 'Back Oversized', label: 'Back Oversized' },
                { value: 'Sleeve Length', label: 'Sleeve Length' },
                { value: 'Interior Hem', label: 'Interior Hem' },
                { value: 'Front Chest (220mm)', label: 'Front Chest (220mm)' },
              ]}
            />
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
      </Drawer>
    </DashboardShell>
  );
}
