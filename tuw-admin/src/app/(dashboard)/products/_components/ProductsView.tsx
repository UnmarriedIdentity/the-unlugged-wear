'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Filter, Search, Edit3, Trash2, CheckCircle2, Eye, AlertTriangle, LayoutGrid, List, Tag, ChevronDown, Download, Archive, GripVertical, Upload } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { StatCard, ContentCard, SurfaceCard, Button, Badge, Input, Drawer, Pagination, FilterPills, PageHeader, ViewToggle, DropdownMenu, Checkbox, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, MediaFrame, FormTextarea, Tabs, Stepper, Switch, DrawerSection, Carousel } from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { ProductItem } from '@/mocks/fixtures';
import { resolveVariants, deriveColors, deriveSizes, variantStockTotal, buildVariantSku } from '@/mocks/variants';
import type { ProductVariant } from '@/mocks/fixtures';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

export default function ProductsView() {
  const { products, createProduct, updateProduct, deleteProduct, canPerformAction, showToast } = useAdminState();

  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [publicationFilter, setPublicationFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  // Row selection (table view only; cleared on view switch)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const changeView = (v: 'grid' | 'table') => {
    setView(v);
    setSelectedIds(new Set());
  };
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

  // Drawers
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

  // Drawer create mode (PE5): blank-draft editing; the modal retires next.
  const [isCreating, setIsCreating] = useState(false);

  const openCreateDrawer = () => {
    if (!canPerformAction('products')) return;
    setEditingProduct(null);
    setIsCreating(true);
    setProductTab('general');
    setStageIndex(0);
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
    setFormVideo('');
    setFormImages([]);
    setUploadReel((prev) => {
      if (prev) revokeUploads([{ url: prev.url }]);
      return null;
    });
    setAddImageUrl('');
    setFormVariants([]);
    setFormFabricGsm('');
    setFormCut('');
    setFormModelDims('');
    setFormCare('');
    setFormMonogramEnabled(false);
    setFormMonogramChars('3');
    setFormMonogramUpcharge('12.00');
    setFormSeoTitle('');
    setFormSeoDescription('');
  };

  // Drawer tab + media draft state (elastic workspace; tabs grow per phase)
  const [productTab, setProductTab] = useState<'general' | 'media' | 'variants' | 'specs' | 'seo'>('general');
  const [formVideo, setFormVideo] = useState('');
  // Gallery draft: persisted URL list + session-only upload previews.
  // Uploads preview instantly but never persist (blob URLs die on reload) —
  // the save toast states this demo truth outright.
  const [addImageUrl, setAddImageUrl] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const revokeUploads = (uploads: Array<{ url: string }>) => {
    uploads.forEach((u) => {
      try {
        URL.revokeObjectURL(u.url);
      } catch {
        /* already revoked */
      }
    });
  };

  // Unified asset list (MX2): persisted gallery URLs + session upload
  // previews in one orderable list. Reorder/cover operate on the list;
  // save splits it back (URLs persist, uploads drop with a toast).
  const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
  const [formImages, setFormImages] = useState<
    Array<{ id: string; src: string; name: string; persisted: boolean }>
  >([]);
  const [uploadReel, setUploadReel] = useState<{ id: string; url: string; name: string } | null>(null);

  const baseName = (url: string) => {
    const part = url.split('?')[0].split('/');
    return part[part.length - 1] || url;
  };

  const setCoverImage = (id: string) => {
    setFormImages((prev) => {
      const idx = prev.findIndex((im) => im.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      return [item, ...next];
    });
  };

  const moveImageTo = (dragId: string, targetId: string) => {
    setFormImages((prev) => {
      const from = prev.findIndex((im) => im.id === dragId);
      const to = prev.findIndex((im) => im.id === targetId);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  // Stage + responsive dual-pane (MX2): carousel index, wide layout at
  // >=700px container width, drag payload ref for HTML5 reorder.
  const [stageIndex, setStageIndex] = useState(0);
  const [mediaWide, setMediaWide] = useState(false);
  const [mediaCards, setMediaCards] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const dragIdRef = useRef<string | null>(null);
  React.useEffect(() => {
    const el = mediaWrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setMediaWide(w >= 700);
      setMediaCards(w >= 1000);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [productTab]);

  const removeImage = (id: string) => {
    setFormImages((prev) => {
      const target = prev.find((im) => im.id === id);
      if (target && !target.persisted) revokeUploads([{ url: target.src }]);
      return prev.filter((im) => im.id !== id);
    });
  };

  const addImageUrlEntry = () => {
    const url = addImageUrl.trim();
    if (!url) return;
    setFormImages((prev) =>
      prev.some((im) => im.src === url) ? prev : [...prev, { id: `g-${Date.now()}`, src: url, name: baseName(url), persisted: true }]
    );
    setAddImageUrl('');
  };

  const handlePickedFiles = (files: FileList | null) => {
    if (!files) return;
    [...files].forEach((f) => {
      if (f.size > MAX_UPLOAD_BYTES) {
        showToast({
          type: 'warning',
          title: 'File Too Large',
          description: `"${f.name}" exceeds the 25MB limit and was skipped.`,
        });
        return;
      }
      if (f.type.startsWith('image/')) {
        const url = URL.createObjectURL(f);
        setFormImages((prev) => [...prev, { id: `up-${Date.now()}-${f.name}`, src: url, name: f.name, persisted: false }]);
      } else if (f.type.startsWith('video/')) {
        const hasReel = formVideo !== '' || uploadReel !== null;
        if (hasReel) {
          showToast({
            type: 'warning',
            title: 'One Video Reel Only',
            description: 'Remove the current reel before adding another.',
          });
          return;
        }
        setUploadReel({ id: `up-${Date.now()}`, url: URL.createObjectURL(f), name: f.name });
      }
    });
  };
  // Apparel + SEO draft state (specs/SEO tabs; all optional — fixtures stay valid)
  const [formFabricGsm, setFormFabricGsm] = useState('');
  const [formCut, setFormCut] = useState('');
  const [formModelDims, setFormModelDims] = useState('');
  const [formCare, setFormCare] = useState('');
  const [formMonogramEnabled, setFormMonogramEnabled] = useState(false);
  const [formMonogramChars, setFormMonogramChars] = useState('3');
  const [formMonogramUpcharge, setFormMonogramUpcharge] = useState('12.00');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');
  // Section visibility (persisted demo pref; all-visible default)
  const [visibleSections, setVisibleSections] = useState({ video: true, monogram: true });
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('tuw_admin_v2_product_editor');
      if (raw) setVisibleSections((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {
      /* private mode — defaults stand */
    }
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem('tuw_admin_v2_product_editor', JSON.stringify(visibleSections));
    } catch {
      /* private mode — session-only */
    }
  }, [visibleSections]);
  // Variant matrix draft (drawer only): General variant inputs mirror-write
  // here so the matrix stays the single submit source.
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);

  const parseList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

  const writePriceAll = (priceStr: string) => {
    setFormPrice(priceStr);
    const n = parseFloat(priceStr);
    if (isNaN(n)) return;
    setFormVariants((prev) => prev.map((v) => ({ ...v, price: n })));
  };

  const writeStockTotal = (stockStr: string) => {
    setFormStock(stockStr);
    const total = parseInt(stockStr, 10);
    if (isNaN(total) || total < 0) return;
    setFormVariants((prev) => {
      if (prev.length === 0) return prev;
      const base = Math.floor(total / prev.length);
      let remainder = total % prev.length;
      return prev.map((v) => {
        const add = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder -= 1;
        return { ...v, stock: base + add };
      });
    });
  };

  const rebuildMatrix = (colors: string[], sizes: string[], basePrice: number, productId: string) => {
    setFormVariants((prev) => {
      const byKey = new Map(prev.map((v) => [`${v.color}|${v.size}`, v]));
      const out: ProductVariant[] = [];
      colors.forEach((color, ci) => {
        sizes.forEach((size) => {
          const kept = byKey.get(`${color}|${size}`);
          if (kept) out.push(kept);
          else
            out.push({
              id: `tmp-${ci}-${size}`,
              color,
              size,
              sku: buildVariantSku(productId, ci, size),
              price: basePrice,
              stock: 0,
            });
        });
      });
      return out;
    });
  };

  const openEditDrawer = (product: ProductItem) => {
    if (!canPerformAction('products')) return;
    setIsCreating(false);
    setEditingProduct(product);
    setProductTab('general');
    setStageIndex(0);
    setFormVideo(product.video || '');
    setFormImages(
      (product.images && product.images.length > 0
        ? product.images
        : product.image
          ? [product.image]
          : []
      ).map((src, i) => ({ id: `g-${i}`, src, name: baseName(src), persisted: true }))
    );
    setUploadReel((prev) => {
      if (prev) revokeUploads([{ url: prev.url }]);
      return null;
    });
    setAddImageUrl('');
    setFormFabricGsm(product.fabricGsm || '');
    setFormCut(product.cut || '');
    setFormModelDims(product.modelDims || '');
    setFormCare(product.care || '');
    setFormMonogramEnabled(product.monogram?.enabled || false);
    setFormMonogramChars(String(product.monogram?.maxChars ?? 3));
    setFormMonogramUpcharge(product.monogram ? product.monogram.upcharge.toFixed(2) : '12.00');
    setFormSeoTitle(product.seoTitle || '');
    setFormSeoDescription(product.seoDescription || '');
    setFormVariants(resolveVariants(product));
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
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
        colors: parseList(formColors),
        sizes: parseList(formSizes),
        partner: formPartner,
        placement: formPlacement,
        publicationStatus: formStatus,
        description: formDescription,
        image: formImages[0]?.src || undefined,
        video: formVideo || undefined,
        images: formImages.filter((im) => im.persisted).map((im) => im.src),
        imageBg: 'linear-gradient(135deg, #FAF3F7 0%, #EFE1EB 100%)',
        fabricGsm: formFabricGsm || undefined,
        cut: formCut || undefined,
        modelDims: formModelDims || undefined,
        care: formCare || undefined,
        monogram: formMonogramEnabled
          ? {
              enabled: true,
              maxChars: parseInt(formMonogramChars, 10) || 3,
              upcharge: parseFloat(formMonogramUpcharge) || 0,
            }
          : undefined,
        seoTitle: formSeoTitle || undefined,
        seoDescription: formSeoDescription || undefined,
      });
      const droppedCount =
        formImages.filter((im) => !im.persisted).length + (uploadReel !== null ? 1 : 0);
      if (droppedCount > 0) {
        showToast({
          type: 'info',
          title: 'Session Previews Dropped',
          description: `${droppedCount} uploaded preview${droppedCount === 1 ? '' : 's'} can't persist as files — add URLs to keep them.`,
        });
      }
      setIsCreating(false);
      return;
    }
    if (!editingProduct) return;

    const priceNum = parseFloat(formPrice) || editingProduct.price;
    const compareNum = parseFloat(formComparePrice) || undefined;

    // The draft matrix is the submit source: colors/sizes/stock derive from
    // it in the seam; price follows the lowest variant ("from $X" semantics).
    const submitVariants = formVariants.length > 0 ? formVariants : resolveVariants(editingProduct);
    const minPrice =
      submitVariants.length > 0
        ? Math.min(...submitVariants.map((v) => v.price))
        : priceNum;

    updateProduct(editingProduct.id, {
      name: formName,
      slug: formSlug,
      category: formCategory,
      price: minPrice,
      compareAtPrice: compareNum,
      partner: formPartner,
      placement: formPlacement,
      publicationStatus: formStatus,
      description: formDescription,
      image: formImages[0]?.src || undefined,
      video: formVideo || undefined,
      images: formImages.filter((im) => im.persisted).map((im) => im.src),
      variants: submitVariants,
      fabricGsm: formFabricGsm || undefined,
      cut: formCut || undefined,
      modelDims: formModelDims || undefined,
      care: formCare || undefined,
      monogram: formMonogramEnabled
        ? {
            enabled: true,
            maxChars: parseInt(formMonogramChars, 10) || 3,
            upcharge: parseFloat(formMonogramUpcharge) || 0,
          }
        : undefined,
      seoTitle: formSeoTitle || undefined,
      seoDescription: formSeoDescription || undefined,
    });

    const droppedCount =
      formImages.filter((im) => !im.persisted).length + (uploadReel !== null ? 1 : 0);
    if (droppedCount > 0) {
      showToast({
        type: 'info',
        title: 'Session Previews Dropped',
        description: `${droppedCount} uploaded preview${droppedCount === 1 ? '' : 's'} can't persist as files — add URLs to keep them.`,
      });
    }

    setEditingProduct(null);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCat, publicationFilter, stockFilter]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCat === 'All' || p.category === selectedCat;
    const matchesPub = publicationFilter === 'all' || p.publicationStatus === publicationFilter;
    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
          ? p.stock > 0 && p.stock <= 10
          : p.stock === 0;
    return matchesSearch && matchesCat && matchesPub && matchesStock;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Row selection helpers (header checkbox tri-states over the page)
  const pageIds = paginatedProducts.map((p) => p.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const togglePage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pageIds.every((id) => next.has(id))) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // Matrix row patch (variants tab): single source stays the draft.
  const updateVariant = (id: string, patch: Partial<ProductVariant>) => {
    setFormVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  // Customer-view gallery slides: uploaded reel previews live, else the
  // persisted reel URL; then the ordered image list (persisted + previews).
  // The reel obeys the visibility toggle; uploads never persist.
  const galleryReelSrc = uploadReel ? uploadReel.url : formVideo !== '' ? formVideo : null;
  const showReel = visibleSections.video && galleryReelSrc !== null;
  const gallerySlides: Array<{ type: 'image' | 'video'; src: string; alt: string; poster?: string }> = [
    ...(showReel && galleryReelSrc
      ? [{ type: 'video' as const, src: galleryReelSrc, alt: `${formName || 'Product'} video reel`, poster: formImages[0]?.src }]
      : []),
    ...formImages.map((im) => ({ type: 'image' as const, src: im.src, alt: formName || 'Product image' })),
  ];

  // Bulk actions (table-view bar appears when rows are selected)
  const clearSelection = () => setSelectedIds(new Set());

  const handleExportSelected = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return;
    const headers = ['Product ID', 'Name', 'Slug', 'Category', 'Price', 'Stock', 'Sold', 'Status'];
    const rows = selected.map((p) => [
      p.id,
      `"${p.name}"`,
      p.slug,
      p.category,
      p.price.toFixed(2),
      String(p.stock),
      String(p.soldCount),
      p.publicationStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `tuw_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({
      type: 'success',
      title: 'Selected Products Exported',
      description: `${selected.length} product${selected.length === 1 ? '' : 's'} exported to CSV.`,
    });
    clearSelection();
  };

  const handleBulkStatus = (status: 'published' | 'archived', label: string) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Action Restricted',
        description: 'Your demo role cannot update products.',
      });
      return;
    }
    ids.forEach((id) => updateProduct(id, { publicationStatus: status }, true));
    if (editingProduct && selectedIds.has(editingProduct.id)) {
      setEditingProduct({ ...editingProduct, publicationStatus: status });
    }
    setPublicationFilter('all');
    setCurrentPage(1);
    showToast({
      type: 'success',
      title: 'Bulk Update Applied',
      description: `${ids.length} product${ids.length === 1 ? '' : 's'} marked ${label}.`,
    });
    clearSelection();
  };

  const handleBulkDelete = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!canPerformAction('products')) {
      showToast({
        type: 'warning',
        title: 'Action Restricted',
        description: 'Your demo role cannot delete products.',
      });
      return;
    }
    if (!window.confirm(`Permanently delete ${ids.length} product${ids.length === 1 ? '' : 's'} from catalog?`)) return;
    ids.forEach((id) => deleteProduct(id, true));
    if (editingProduct && selectedIds.has(editingProduct.id)) {
      setEditingProduct(null);
    }
    setCurrentPage(1);
    showToast({
      type: 'success',
      title: 'Bulk Delete Applied',
      description: `${ids.length} product${ids.length === 1 ? '' : 's'} removed from catalog.`,
    });
    clearSelection();
  };

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const draftCount = products.filter((p) => p.publicationStatus === 'draft').length;

  // KPI cards double as filters (shared by grid + table views)
  const filtersClear = selectedCat === 'All' && publicationFilter === 'all' && stockFilter === 'all';
  const clearProductFilters = () => {
    setSelectedCat('All');
    setPublicationFilter('all');
    setStockFilter('all');
  };
  const toggleStockFilter = (v: 'low' | 'out') =>
    setStockFilter((cur) => (cur === v ? 'all' : v));
  const togglePublicationFilter = (v: typeof publicationFilter) =>
    setPublicationFilter((cur) => (cur === v ? 'all' : v));
  const kpiKeyDown =
    (handler: () => void) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    };

  // Media stage + asset panel blocks (MX2): defined once, arranged by width.
  const stageIndexClamped = Math.min(stageIndex, Math.max(0, gallerySlides.length - 1));
  const stageHeader = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--tuw-text-secondary, #5D6772)' }}>
        MEDIA STAGE & LIVE PREVIEW
      </span>
      <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
        {gallerySlides.length > 0 ? `${stageIndexClamped + 1} of ${gallerySlides.length} assets` : 'No assets'}
      </span>
    </div>
  );
  const stageCarousel = gallerySlides.length > 0 ? (
    <Carousel
      ariaLabel="Customer gallery preview"
      variant="filmstrip"
      slides={gallerySlides}
      index={stageIndexClamped}
      onIndexChange={setStageIndex}
    />
  ) : (
    <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', padding: '12px 0' }}>
      No gallery images yet — add a URL below or upload photos.
    </div>
  );
  const assetRows = formImages.map((im, idx) => (
    <SurfaceCard
      key={im.id}
      direction="row"
      padding="10px"
      gap="12px"
      hoverable
      className={`${idx === 0 ? 'tuw-stat-active' : ''} ${draggingId === im.id ? 'tuw-stat-active' : ''}`.trim()}
      draggable
      onDragStart={(e) => {
        dragIdRef.current = im.id;
        setDraggingId(im.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setDraggingId(null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (dragIdRef.current) {
          moveImageTo(dragIdRef.current, im.id);
          dragIdRef.current = null;
        }
        setDraggingId(null);
      }}
      style={{ alignItems: 'center' }}
    >
      <span style={{ cursor: 'grab', display: 'inline-flex', color: 'var(--tuw-text-secondary, #5D6772)' }} aria-hidden="true">
        <GripVertical size={14} />
      </span>
      <MediaFrame height={40} width={40} radius={8} style={{ flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={im.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </MediaFrame>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {im.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {im.src}
        </div>
      </div>
      {idx === 0 ? (
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF', backgroundColor: 'var(--tuw-action-primary, #7539FF)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
          COVER
        </span>
      ) : (
        <>
          {!im.persisted ? (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tuw-text-warning, #856300)', backgroundColor: 'var(--tuw-bg-warning, #FEFBF5)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
              Preview only
            </span>
          ) : null}
          {im.persisted ? (
            <button
              type="button"
              onClick={() => setCoverImage(im.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', padding: '4px 2px', flexShrink: 0 }}
            >
              Set Cover
            </button>
          ) : null}
        </>
      )}
      <span style={{ display: 'inline-flex', gap: 2, flexShrink: 0 }}>
        <button
          type="button"
          aria-label={`Remove ${im.name}`}
          onClick={() => removeImage(im.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tuw-text-secondary, #5D6772)', padding: 4, display: 'inline-flex' }}
        >
          <Trash2 size={14} />
        </button>
      </span>
    </SurfaceCard>
  ));
  // Card twin of assetRows for wide containers (MX4): same semantics —
  // drag anywhere on the card (no grip needed at this size), same cover /
  // preview / reorder / delete paths. Primitives only, no new components.
  const assetCards = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {formImages.map((im, idx) => (
        <SurfaceCard
          key={im.id}
          padding="12px"
          gap="10px"
          hoverable
          className={`${idx === 0 ? 'tuw-stat-active' : ''} ${draggingId === im.id ? 'tuw-stat-active' : ''}`.trim()}
          draggable
          onDragStart={(e) => {
            dragIdRef.current = im.id;
            setDraggingId(im.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={() => setDraggingId(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIdRef.current) {
              moveImageTo(dragIdRef.current, im.id);
              dragIdRef.current = null;
            }
            setDraggingId(null);
          }}
          style={{ minWidth: 0 }}
        >
          <MediaFrame height={90} radius={8}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </MediaFrame>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {im.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {im.src}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {idx === 0 ? (
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF', backgroundColor: 'var(--tuw-action-primary, #7539FF)', borderRadius: 4, padding: '2px 6px' }}>
                COVER
              </span>
            ) : (
              <>
                {!im.persisted ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tuw-text-warning, #856300)', backgroundColor: 'var(--tuw-bg-warning, #FEFBF5)', borderRadius: 4, padding: '2px 6px' }}>
                    Preview only
                  </span>
                ) : null}
                {im.persisted ? (
                  <button
                    type="button"
                    onClick={() => setCoverImage(im.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', padding: '4px 2px' }}
                  >
                    Set Cover
                  </button>
                ) : null}
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
            <button
              type="button"
              aria-label={`Remove ${im.name}`}
              onClick={() => removeImage(im.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tuw-text-secondary, #5D6772)', padding: 4, display: 'inline-flex' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
  const panelHeader = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
          Uploaded Assets & Reel
        </span>
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => photoInputRef.current?.click()}>
          Add Media
        </Button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '4px 0 0 0' }}>
        Drag or click to reorder. Set the primary cover photo for your storefront.
      </p>
    </div>
  );
  const dropzone = (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload photos or video reel"
      onClick={() => photoInputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          photoInputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handlePickedFiles(e.dataTransfer.files);
      }}
      style={{
        border: `1px dashed ${dragActive ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-border-control, #D1D5DB)'}`,
        borderRadius: 12,
        padding: 24,
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: dragActive ? 'var(--tuw-bg-selected, #F8F5FF)' : 'transparent',
      }}
    >
      <span style={{ display: 'inline-flex', color: 'var(--tuw-action-primary, #7539FF)' }}>
        <Upload size={20} />
      </span>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginTop: 8 }}>
        Click to upload photos or reel, or drag files here
      </div>
      <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>
        PNG, JPG, WEBP, or MP4 Video Reel (Max 25MB)
      </div>
    </div>
  );
  const reelUrlField = visibleSections.video ? (
    <Input
      label="Video Reel URL (persisted)"
      placeholder="/products/4.mp4"
      value={formVideo}
      onChange={(e) => setFormVideo(e.target.value)}
    />
  ) : null;
  const addUrlRow = (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: 1 }}>
        <Input
          aria-label="Image URL to add"
          placeholder="Paste image URL, then Add"
          value={addImageUrl}
          onChange={(e) => setAddImageUrl(e.target.value)}
        />
      </div>
      <Button variant="secondary" size="md" onClick={addImageUrlEntry}>
        Add
      </Button>
    </div>
  );

  return (
    <DashboardShell pageTitle="Products" activeNav="products">
      <PageHeader
        title="Product Catalog"
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={openCreateDrawer}
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
          role="button"
          tabIndex={0}
          aria-pressed={filtersClear}
          aria-label="Show all products"
          className={filtersClear ? 'tuw-stat-active' : ''}
          style={{ cursor: 'pointer' }}
          onClick={clearProductFilters}
          onKeyDown={kpiKeyDown(clearProductFilters)}
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(lowStockCount)}
          subtitle="Stock ≤ 10 units"
          trendType={lowStockCount > 0 ? 'down' : 'up'}
          hoverable
          role="button"
          tabIndex={0}
          aria-pressed={stockFilter === 'low'}
          aria-label="Filter low-stock products"
          className={stockFilter === 'low' ? 'tuw-stat-active' : ''}
          style={{ cursor: 'pointer' }}
          onClick={() => toggleStockFilter('low')}
          onKeyDown={kpiKeyDown(() => toggleStockFilter('low'))}
        />
        <StatCard
          label="Drafts in Review"
          value={String(draftCount)}
          subtitle="Unpublished items"
          trendType="neutral"
          hoverable
          role="button"
          tabIndex={0}
          aria-pressed={publicationFilter === 'draft'}
          aria-label="Filter draft products"
          className={publicationFilter === 'draft' ? 'tuw-stat-active' : ''}
          style={{ cursor: 'pointer' }}
          onClick={() => togglePublicationFilter('draft')}
          onKeyDown={kpiKeyDown(() => togglePublicationFilter('draft'))}
        />
        <StatCard
          label="Out of Stock"
          value={String(outOfStockCount)}
          subtitle={outOfStockCount > 0 ? 'Backorder only' : 'Fully stocked'}
          trendType={outOfStockCount > 0 ? 'down' : 'up'}
          hoverable
          role="button"
          tabIndex={0}
          aria-pressed={stockFilter === 'out'}
          aria-label="Filter out-of-stock products"
          className={stockFilter === 'out' ? 'tuw-stat-active' : ''}
          style={{ cursor: 'pointer' }}
          onClick={() => toggleStockFilter('out')}
          onKeyDown={kpiKeyDown(() => toggleStockFilter('out'))}
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

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0, gap: 12 }}>
              <div style={{ maxWidth: 300, width: '100%' }}>
                <Input
                  placeholder="Search products by title, category, or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefixIcon={<Search size={16} />}
                />
              </div>
              <DropdownMenu
                ariaLabel="Product category filter"
                trigger={
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Product category, currently ${selectedCat === 'All' ? 'All Categories' : selectedCat}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      height: '44px',
                      padding: '0 12px',
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: 'var(--font-main)',
                      borderRadius: 'var(--tuw-radius-control, 8px)',
                      border: '1px solid var(--tuw-border-control, #D1D5DB)',
                      backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                      color: 'var(--tuw-text-primary, #262626)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Tag size={14} color="var(--tuw-text-secondary, #5D6772)" />
                    {selectedCat === 'All' ? 'All Categories' : selectedCat}
                    <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                  </span>
                }
                items={['All', 'T-Shirts', 'Hoodies', 'Jackets', 'Pants', 'Accessories'].map((cat) => ({
                  value: cat,
                  label: cat === 'All' ? 'All Categories' : cat,
                }))}
                selectedValue={selectedCat}
                onSelect={(v) => setSelectedCat(v)}
              />
              <div aria-hidden="true" style={{ width: 1, height: 24, backgroundColor: 'var(--tuw-border-subtle, #E5E7EB)' }} />
              <ViewToggle
                ariaLabel="Product catalog view"
                options={[
                  { value: 'grid', label: 'Grid view', icon: <LayoutGrid size={16} /> },
                  { value: 'table', label: 'Table view', icon: <List size={16} /> },
                ]}
                value={view}
                onChange={(v) => changeView(v as typeof view)}
              />
            </div>
          </div>
        </div>

        {view === 'grid' ? (
        /* Card Grid */
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
        ) : (
        /* Table View */
        <Table style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 44 }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '14.5%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '12.5%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <TableHeader>
            {selectedIds.size > 0 ? (
            <TableRow hoverable={false}>
              <TableCell colSpan={7} style={{ padding: '6px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Checkbox
                    bare
                    aria-label="Select all products on this page"
                    checked={allPageSelected}
                    indeterminate={!allPageSelected && somePageSelected}
                    onChange={togglePage}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {selectedIds.size} selected
                  </span>
                  <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportSelected}>
                    Export selected
                  </Button>
                  <Button variant="primary" size="sm" icon={<CheckCircle2 size={14} />} onClick={() => handleBulkStatus('published', 'Published')}>
                    Publish
                  </Button>
                  <Button variant="secondary" size="sm" icon={<Archive size={14} />} onClick={() => handleBulkStatus('archived', 'Archived')}>
                    Archive
                  </Button>
                  <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleBulkDelete}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            ) : (
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '12px 16px', width: 44 }}>
                <Checkbox
                  bare
                  aria-label="Select all products on this page"
                  checked={allPageSelected}
                  indeterminate={!allPageSelected && somePageSelected}
                  onChange={togglePage}
                />
              </TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Product</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Category</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Price</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Stock / Sold</TableHead>
              <TableHead style={{ padding: '12px 16px' }}>Status</TableHead>
              <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Action</TableHead>
            </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--tuw-text-secondary, #5D6772)', fontSize: 16 }}>
                  No products found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() => openEditDrawer(p)}
                  style={{ cursor: 'pointer', backgroundColor: selectedIds.has(p.id) ? 'var(--tuw-bg-canvas, #F7F8F9)' : 'transparent' }}
                >
                  <TableCell style={{ padding: '14px 16px' }}>
                    <Checkbox
                      bare
                      aria-label={`Select product ${p.name}`}
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleId(p.id)}
                    />
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, background: p.imageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--tuw-border-subtle, #E5E7EB)' }}>
                        {p.image ? (
                          <Image src={p.image} alt={p.name} fill sizes="80px" style={{ objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                            {p.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                          {p.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {p.category}
                  </TableCell>
                  <TableCell className="tuw-tabular-nums" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                    ₹{p.price.toFixed(2)}
                    {p.compareAtPrice && (
                      <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'line-through', marginLeft: 6, fontWeight: 400 }}>
                        ₹{p.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: p.stock === 0 ? 'var(--tuw-text-error, #C91818)' : p.stock <= 10 ? 'var(--tuw-text-warning, #856300)' : 'var(--tuw-text-primary, #262626)' }}>
                      {p.stock} in stock
                    </div>
                    <div className="tuw-tabular-nums" style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {p.soldCount} sold
                    </div>
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
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
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="secondary" size="sm" icon={<Edit3 size={14} />} onClick={(e) => { e.stopPropagation(); openEditDrawer(p); }}>
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        )}

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

      {/* Edit Product Drawer */}
      <Drawer
        isOpen={Boolean(editingProduct) || isCreating}
        onClose={() => {
          setEditingProduct(null);
          setIsCreating(false);
          setFormImages((prev) => {
            revokeUploads(prev.filter((im) => !im.persisted).map((im) => ({ url: im.src })));
            return prev;
          });
          setUploadReel((prev) => {
            if (prev) revokeUploads([{ url: prev.url }]);
            return null;
          });
        }}
        title={editingProduct ? `Manage ${editingProduct.name}` : 'Add New Product'}
        subtitle={
          editingProduct ? (
            <span style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
              {`ID: ${editingProduct.id} · ${editingProduct.partner} · `}
              <Badge
                variant={
                  editingProduct.publicationStatus === 'published'
                    ? 'success'
                    : editingProduct.publicationStatus === 'draft'
                      ? 'warning'
                      : 'neutral'
                }
              >
                {editingProduct.publicationStatus === 'published' ? 'Live' : editingProduct.publicationStatus}
              </Badge>
            </span>
          ) : (
            'New catalog entry'
          )
        }
        expandable
        headerExtra={
          <Tabs
            variant="underline"
            ariaLabel="Product editor sections"
            tabs={
              isCreating
                ? [
                    { id: 'general', label: 'General' },
                    { id: 'media', label: 'Media', badge: formImages.length + (uploadReel !== null || formVideo !== '' ? 1 : 0) },
                  ]
                : [
                    { id: 'general', label: 'General' },
                    { id: 'media', label: 'Media', badge: formImages.length + (uploadReel !== null || formVideo !== '' ? 1 : 0) },
                    { id: 'variants', label: 'Variants & Stock', badge: formVariants.length },
                    { id: 'specs', label: 'Clothing Specs' },
                    { id: 'seo', label: 'SEO' },
                  ]
            }
            activeTab={productTab}
            onChange={(id) => setProductTab(id as typeof productTab)}
          />
        }
        footer={
          isCreating ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
              <Button variant="secondary" size="sm" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleEditSubmit}>
                Create Product
              </Button>
            </div>
          ) : (
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
          )
        }
      >
        {(editingProduct || isCreating) && (
          productTab === 'general' ? (
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                onChange={(e) => writePriceAll(e.target.value)}
                required
              />
              <Input
                label="Stock Quantity"
                type="number"
                value={formStock}
                onChange={(e) => writeStockTotal(e.target.value)}
                required
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', marginBottom: 6 }}>
                Publication Status
              </div>
              <DropdownMenu
                ariaLabel="Publication status"
                trigger={
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Publication status, currently ${formStatus === 'published' ? 'Published (Live on website)' : formStatus === 'draft' ? 'Draft (Hidden)' : 'Archived'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'var(--font-main)',
                      borderRadius: 8,
                      border: '1px solid var(--tuw-border-control, #D1D5DB)',
                      backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                      color: 'var(--tuw-text-primary, #262626)',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formStatus === 'published' ? 'Published (Live on website)' : formStatus === 'draft' ? 'Draft (Hidden)' : 'Archived'}
                    </span>
                    <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                  </span>
                }
                items={[
                  { value: 'published', label: 'Published (Live on website)' },
                  { value: 'draft', label: 'Draft (Hidden)' },
                  { value: 'archived', label: 'Archived' },
                ]}
                selectedValue={formStatus}
                onSelect={(v) => setFormStatus(v as ProductItem['publicationStatus'])}
              />
            </div>
            <Input
              label="Color Variations"
              value={formColors}
              onChange={(e) => {
                setFormColors(e.target.value);
                rebuildMatrix(
                  parseList(e.target.value),
                  parseList(formSizes),
                  parseFloat(formPrice) || 0,
                  editingProduct?.id ?? 'PRD'
                );
              }}
            />
            <Input
              label="Size Variations"
              value={formSizes}
              onChange={(e) => {
                setFormSizes(e.target.value);
                rebuildMatrix(
                  parseList(formColors),
                  parseList(e.target.value),
                  parseFloat(formPrice) || 0,
                  editingProduct?.id ?? 'PRD'
                );
              }}
            />
            <FormTextarea
              label="Description"
              rows={4}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </form>
          ) : productTab === 'media' ? (
          <div ref={mediaWrapRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mediaWide ? (
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 20, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                {stageHeader}
                <Carousel ariaLabel="Customer gallery preview" variant="filmstrip" slides={gallerySlides} index={stageIndexClamped} onIndexChange={setStageIndex} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {panelHeader}
                {mediaCards ? assetCards : assetRows}
                {addUrlRow}
                {dropzone}
                {reelUrlField}
              </div>
            </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {stageHeader}
              <Carousel ariaLabel="Customer gallery preview" variant="filmstrip" slides={gallerySlides} index={stageIndexClamped} onIndexChange={setStageIndex} />
              {panelHeader}
              {mediaCards ? assetCards : assetRows}
              {addUrlRow}
              {dropzone}
              {reelUrlField}
            </div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              aria-label="Upload photos"
              style={{ display: 'none' }}
              onChange={(e) => {
                handlePickedFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              aria-label="Upload video reel"
              style={{ display: 'none' }}
              onChange={(e) => {
                handlePickedFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
          ) : productTab === 'variants' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
              {formVariants.length} variants · {variantStockTotal(formVariants)} units in stock
            </div>
            <Table>
              <TableHeader>
                <TableRow hoverable={false}>
                  <TableHead style={{ padding: '12px 16px' }}>Color</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Size</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>SKU</TableHead>
                  <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Price</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formVariants.map((v) => (
                  <TableRow key={v.id} hoverable={false}>
                    <TableCell style={{ padding: '10px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                      {v.color}
                    </TableCell>
                    <TableCell style={{ padding: '10px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                      {v.size}
                    </TableCell>
                    <TableCell style={{ padding: '10px 16px' }}>
                      <Input
                        aria-label={`SKU for ${v.color} ${v.size}`}
                        value={v.sku}
                        onChange={(e) => updateVariant(v.id, { sku: e.target.value })}
                        style={{ height: 36 }}
                      />
                    </TableCell>
                    <TableCell style={{ padding: '10px 16px' }}>
                      <Input
                        aria-label={`Price for ${v.color} ${v.size}`}
                        type="number"
                        step="0.01"
                        value={String(v.price)}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          if (!isNaN(n)) updateVariant(v.id, { price: n });
                        }}
                        style={{ height: 36, textAlign: 'right' }}
                      />
                    </TableCell>
                    <TableCell style={{ padding: '10px 16px' }}>
                      <Stepper
                        ariaLabel={`Stock for ${v.color} ${v.size}`}
                        value={v.stock}
                        onChange={(n) => updateVariant(v.id, { stock: n })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          ) : productTab === 'specs' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DrawerSection title="Display Options" titleGap={10}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Switch
                  label="Video Reel slot"
                  description="Show the video block on the Media tab"
                  checked={visibleSections.video}
                  onChange={(v) => setVisibleSections((s) => ({ ...s, video: v }))}
                />
                <Switch
                  label="Monogram & embroidery"
                  description="Show the custom embroidery block below"
                  checked={visibleSections.monogram}
                  onChange={(v) => setVisibleSections((s) => ({ ...s, monogram: v }))}
                />
              </div>
            </DrawerSection>
            <DrawerSection title="Clothing Specifications" titleGap={10}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input
                  label="Fabric Composition & GSM"
                  placeholder="460 GSM Heavyweight French Terry Cotton"
                  value={formFabricGsm}
                  onChange={(e) => setFormFabricGsm(e.target.value)}
                />
                <Input
                  label="Cut & Silhouette"
                  placeholder="Boxy Drop-Shoulder"
                  value={formCut}
                  onChange={(e) => setFormCut(e.target.value)}
                />
                <Input
                  label="Model Dimensions"
                  placeholder="Model is 6'1&quot; wearing Size L"
                  value={formModelDims}
                  onChange={(e) => setFormModelDims(e.target.value)}
                />
                <FormTextarea
                  label="Care & Wash Instructions"
                  rows={3}
                  placeholder="Cold wash inside out, lay flat to dry"
                  value={formCare}
                  onChange={(e) => setFormCare(e.target.value)}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    Associated Size Chart Template
                  </span>
                  <Link href="/content/pages" style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)', textDecoration: 'none' }}>
                    Open Fit Guide
                  </Link>
                </div>
              </div>
            </DrawerSection>
            {visibleSections.monogram ? (
            <DrawerSection title="Monogram & Custom Embroidery" titleGap={10}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Switch
                  label="Offer monogramming"
                  description="On-demand chest initials with upcharge"
                  checked={formMonogramEnabled}
                  onChange={setFormMonogramEnabled}
                />
                {formMonogramEnabled ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    label="Max Characters"
                    type="number"
                    value={formMonogramChars}
                    onChange={(e) => setFormMonogramChars(e.target.value)}
                  />
                  <Input
                    label="Upcharge ($ USD)"
                    type="number"
                    step="0.01"
                    value={formMonogramUpcharge}
                    onChange={(e) => setFormMonogramUpcharge(e.target.value)}
                  />
                </div>
                ) : null}
              </div>
            </DrawerSection>
            ) : null}
          </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="SEO Title"
              placeholder={formName || 'Product name'}
              value={formSeoTitle}
              onChange={(e) => setFormSeoTitle(e.target.value)}
            />
            <FormTextarea
              label="Meta Description"
              rows={3}
              placeholder="Search-result snippet for this product"
              value={formSeoDescription}
              onChange={(e) => setFormSeoDescription(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>Canonical slug</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--tuw-text-primary, #262626)' }}>
                /products/{formSlug || '…'}
              </span>
            </div>
          </div>
          )
        )}
      </Drawer>
    </DashboardShell>
  );
}
