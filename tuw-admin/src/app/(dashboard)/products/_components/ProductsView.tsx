'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Filter, Search, Edit3, Trash2, CheckCircle2, Eye, AlertTriangle, LayoutGrid, List, Tag, ChevronDown, Download, Archive, GripVertical, Upload, Images, Focus, Library, RotateCcw, X } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { StatCard, ContentCard, SurfaceCard, UpliftSurface, Button, Badge, IconButton, Input, Drawer, Modal, Pagination, FilterPills, PageHeader, ViewToggle, DropdownMenu, Checkbox, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, MediaFrame, FormTextarea, Tabs, Stepper, Switch, DrawerSection, DrawerCard, SearchableSelect, Disclosure, Carousel, LinkButton } from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { ProductItem } from '@/mocks/fixtures';
import { resolveVariants, variantStockTotal, buildVariantSku, deriveVariantPrice, recomputeVariants, minFromPrice, pruneAdjustments, roundPrice, hasPriceSpread, adjustmentKey, sumAdjustments } from '@/mocks/variants';
import type { ProductVariant, ProductAttribute, PhotoSettings, ProductDiscount, ProductGender, StockMovement } from '@/mocks/fixtures';
import type { LibraryAttribute, SizeChart } from '@tuw/heart/modules/catalog';
import PartnerSkuPanel from './PartnerSkuPanel';
import { saveSizeChartAction, deleteSizeChartAction, createProductAction, deleteProductsAction, getProductAction, importListingAction, setProductsStatusAction, updateProductAction } from '@/server/catalog-actions';
import { attributeDisplayLabel, normalizeAttributeDisplayType, parseCompareAtPrice, slugify, UNCATEGORIZED_CATEGORY } from '@tuw/heart/modules/catalog/rules';
import { groupImportRows, isValidHsnCode, parseQikinkListing } from '@tuw/heart/modules/catalog/planner';
import type { ImportProductGroup } from '@tuw/heart/modules/catalog/planner';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

// SearchableSelect uses a real value for the selected row; keep the form's
// empty-string "unspecified" state at the boundary only.
const GENDER_OPTIONS = [
  { value: 'unspecified', label: 'Unspecified' },
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Unisex', label: 'Unisex' },
  { value: 'Kids', label: 'Kids' },
  { value: 'Boy', label: 'Boy' },
  { value: 'Girl', label: 'Girl' },
];

const PUBLICATION_OPTIONS: Array<{ value: ProductItem['publicationStatus']; label: string }> = [
  { value: 'published', label: 'Published (Live)' },
  { value: 'draft', label: 'Draft (Hidden)' },
  { value: 'archived', label: 'Archived' },
];

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percent', label: 'Percent %' },
  { value: 'fixed', label: 'Fixed ₹' },
];

const PARTNER_OPTIONS: Array<{ value: ProductItem['partner']; label: string }> = [
  { value: 'Qikink Direct API', label: 'Qikink Direct API' },
  { value: 'Printrove Hub', label: 'Printrove Hub' },
  { value: 'Custom Atelier', label: 'Custom Atelier' },
];

const pairedFieldGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

// Flat bordered groups used inside PEDIT cards (attribute rows, size-chart
// entries). Groups are not nested cards.
const flatGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  minWidth: 0,
  padding: 12,
  border: '1px solid var(--tuw-border-subtle)',
  borderRadius: 8,
};

const attributeChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 28,
  padding: '2px 4px 2px 8px',
  borderRadius: 999,
  border: '1px solid var(--tuw-border-subtle)',
  backgroundColor: 'var(--tuw-bg-canvas)',
  fontSize: 12,
  lineHeight: '16px',
  fontWeight: 500,
  color: 'var(--tuw-text-primary)',
};

const attributeMetaStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--tuw-text-secondary)',
};

const attributeGroupLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  margin: 0,
  fontSize: 11,
  lineHeight: '16px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--tuw-text-secondary)',
};

// Per-product attribute draft (A1/AX2). Shape lives on ProductAttribute
// (fixtures) so the seam persists it verbatim; see the REST note there.
// swatch dots stay neutral until a value→hex map lands (recorded follow-up).

export default function ProductsView({ initialProducts, categories, perms, storefrontOrigin, initialLibrary, initialSizeCharts }: { initialProducts: ProductItem[]; categories: string[]; perms: string[]; storefrontOrigin: string; initialLibrary: LibraryAttribute[]; initialSizeCharts: SizeChart[] }) {
  // Product photos with local paths are served by the storefront app.
  const assetSrc = (url: string) => (url.startsWith('/') ? `${storefrontOrigin}${url}` : url);
  // Everything here is real (TL-BE-05).
  const { showToast } = useAdminState();
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  useEffect(() => setProducts(initialProducts), [initialProducts]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [saving, setSaving] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Attribute library: read-only here (/settings/attributes edits it). New
  // names and values typed in a product are registered when the product saves.
  const [libraryAttributes, setLibraryAttributes] = useState<LibraryAttribute[]>(initialLibrary);
  const createLibraryAttribute = (name: string): string => {
    const id = `new:${name}`;
    setLibraryAttributes((list) => [...list, { id, name, slug: '', values: [], swatchHex: {}, displayType: 'pill', enabled: true, showOnPdp: true, showOnCheckout: false, showOnAdmin: true, productCount: 0, core: false }]);
    return id;
  };
  const addLibraryValue = (id: string, value: string) =>
    setLibraryAttributes((list) => list.map((a) => (a.id === id ? { ...a, values: [...a.values, value] } : a)));

  // Size charts save themselves: structure at once, typed cells after a pause.
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>(initialSizeCharts);
  const chartTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Cells hold what was typed; numbers are converted only when saving.
  const cellValue = (v: number | string): number | string | null => {
    if (typeof v === 'number') return v;
    const text = v.trim();
    if (text === '') return 0;
    if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
    return /^\d+(\.\d+)?\s*[–-]\s*\d+(\.\d+)?$/.test(text) ? text : null;
  };
  const persistChart = (chart: SizeChart, delay = 0) => {
    const pending = chartTimers.current.get(chart.id);
    if (pending) clearTimeout(pending);
    chartTimers.current.set(chart.id, setTimeout(() => {
      // A half-typed range waits until it is complete.
      if (chart.rows.some((r) => Object.values(r.measures).some((v) => cellValue(v) === null))) return;
      const rows = chart.rows.map((r) => ({ ...r, measures: Object.fromEntries(Object.entries(r.measures).map(([k, v]) => [k, cellValue(v)!])) }));
      void saveSizeChartAction({ id: chart.id, name: chart.name, columns: chart.columns, rows }).then((r) => {
        if (!r.ok) showToast({ type: 'warning', title: 'Size Chart Not Saved', description: r.error.message });
      });
    }, delay));
  };
  const updateChart = (chartId: string, change: (c: SizeChart) => SizeChart, delay = 0) => {
    const chart = sizeCharts.find((c) => c.id === chartId);
    if (!chart) return false;
    const next = change(chart);
    setSizeCharts((list) => list.map((c) => (c.id === chartId ? next : c)));
    persistChart(next, delay);
    return true;
  };
  const createSizeChart = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (sizeCharts.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast({ type: 'warning', title: 'Duplicate Chart', description: `"${trimmed}" already exists.` });
      return false;
    }
    void saveSizeChartAction({ name: trimmed, columns: [], rows: [] }).then((r) => {
      if (r.ok) setSizeCharts(r.data);
      else showToast({ type: 'warning', title: 'Size Chart Not Saved', description: r.error.message });
    });
    return true;
  };
  const deleteSizeChart = (id: string) => {
    void deleteSizeChartAction({ id }).then((r) => {
      if (r.ok) setSizeCharts(r.data);
      else showToast({ type: 'warning', title: 'Not Deleted', description: r.error.message });
    });
  };
  const addSizeChartRow = (chartId: string, size: string) => {
    const trimmed = size.trim();
    const chart = sizeCharts.find((c) => c.id === chartId);
    if (!trimmed || !chart) return false;
    if (chart.rows.some((r) => r.size.toLowerCase() === trimmed.toLowerCase())) {
      showToast({ type: 'warning', title: 'Duplicate Size', description: `"${trimmed}" is already in ${chart.name}.` });
      return false;
    }
    // A new row starts with the chart's existing columns.
    const blank = Object.fromEntries(chart.columns.map((k) => [k, 0]));
    return updateChart(chartId, (c) => ({ ...c, rows: [...c.rows, { size: trimmed, measures: blank }] }));
  };
  const removeSizeChartRow = (chartId: string, size: string) => updateChart(chartId, (c) => ({ ...c, rows: c.rows.filter((r) => r.size !== size) }));
  const addSizeChartColumn = (chartId: string, column: string) => {
    const name = column.trim();
    const chart = sizeCharts.find((c) => c.id === chartId);
    if (!name || !chart) return false;
    if (chart.columns.some((c) => c.toLowerCase() === name.toLowerCase())) {
      showToast({ type: 'warning', title: 'Duplicate Column', description: `"${name}" is already in ${chart.name}.` });
      return false;
    }
    return updateChart(chartId, (c) => ({ ...c, columns: [...c.columns, name], rows: c.rows.map((r) => ({ ...r, measures: { ...r.measures, [name]: 0 } })) }));
  };
  const patchSizeChartCell = (chartId: string, size: string, key: string, raw: string) => {
    return updateChart(chartId, (c) => ({ ...c, rows: c.rows.map((r) => (r.size === size ? { ...r, measures: { ...r.measures, [key]: raw } } : r)) }), 700);
  };
  const [chartColDrafts, setChartColDrafts] = useState<Record<string, string>>({});
  const can = (permission: string) => perms.includes(permission);
  const libId = (name: string) => initialLibrary.find((l) => l.name.toLowerCase() === name.toLowerCase())?.id;
  const canPerformAction = (_category: 'products') => can('product.update');
  const refused = (what: string) => showToast({ type: 'warning', title: 'Action Restricted', description: `You do not have permission to ${what}.` });
  /** Honest save toast: says when the storefront could not be refreshed. */
  const storefrontNote = (storefront: { ok: true } | { ok: false; reason: string }) =>
    storefront.ok ? 'The storefront now shows it.' : `${storefront.reason} Shoppers will see it within the hour.`;

  // Real categories plus any name already on a product, and Uncategorized.
  const categoryOptions = React.useMemo(() => {
    const names = [...new Set([...categories, ...products.map((product) => product.category), UNCATEGORIZED_CATEGORY])];
    return names.filter(Boolean).map((category) => ({ value: category, label: category }));
  }, [categories, products]);

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
  const [formCategory, setFormCategory] = useState<ProductItem['category']>(categories[0] ?? UNCATEGORIZED_CATEGORY);
  const [formPrice, setFormPrice] = useState('48.00');
  const [formComparePrice, setFormComparePrice] = useState('');
  const [formCompareError, setFormCompareError] = useState<string | null>(null);
  const [formStock, setFormStock] = useState('30');
  // Catalog scalars (Y1): single-valued fields, Input/picker-edited.
  const [formStyleCode, setFormStyleCode] = useState('');
  const [formSerialNo, setFormSerialNo] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formShipWeight, setFormShipWeight] = useState('');
  const [formDims, setFormDims] = useState('');
  const [formGender, setFormGender] = useState<ProductGender | ''>('');
  const [formTax, setFormTax] = useState('');
  const [formHsn, setFormHsn] = useState('');
  // Scheduled discounts draft (P1d): rows with type/value/window/switch.
  const [formDiscounts, setFormDiscounts] = useState<ProductDiscount[]>([]);
  // Per-product attributes (A1): the single source behind colors/sizes.
  // REST: GET/PUT /products/:id/attributes → [{ name, values[], builtin }].
  // Color + Size + Placements ship builtin (locked); customs append here.
  // Placements is the only print-location source; card 4 has no duplicate
  // select. The matrix still cross-products Color×Size until A2 generalizes it.
  const [formAttributes, setFormAttributes] = useState<ProductAttribute[]>([]);
  const attrValues = (name: string) => formAttributes.find((a) => a.name === name)?.values ?? [];
  const colorValues = attrValues('Color');
  const sizeValues = attrValues('Size');
  // Per-card value drafts + new-attribute draft (A1b chip editor).
  const [attrDrafts, setAttrDrafts] = useState<Record<string, string>>({});
  const [newAttrName, setNewAttrName] = useState('');
  // Size-chart drafts (specs manager): per-chart new-row size + new chart name.
  const [chartRowDrafts, setChartRowDrafts] = useState<Record<string, string>>({});
  const [newChartName, setNewChartName] = useState('');
  const [formSizeChartId, setFormSizeChartId] = useState('');
  const chartColumns = (chart: SizeChart) => chart.columns;
  const [formPartner, setFormPartner] = useState<ProductItem['partner']>('Qikink Direct API');
  const [formExchangePolicy, setFormExchangePolicy] = useState<NonNullable<ProductItem['exchangePolicy']>>('defects_only');
  const [formProductKind, setFormProductKind] = useState<NonNullable<ProductItem['productKind']>>('physical');
  const [formLowStock, setFormLowStock] = useState('');
  const [formStatus, setFormStatus] = useState<ProductItem['publicationStatus']>('published');
  const [formDescription, setFormDescription] = useState('Pre-shrunk premium heavyweight combed cotton with reinforced seams.');

  // Drawer create mode (PE5): blank-draft editing; the modal retires next.
  const [isCreating, setIsCreating] = useState(false);
  // Product-editor cards start collapsed; the state lives here so expanding a
  // card survives tab switches and resets for each product.
  const [basicCardOpen, setBasicCardOpen] = useState(false);
  // Pricing & stock (PEDIT card 2) is independently collapsible.
  const [pricingCardOpen, setPricingCardOpen] = useState(false);
  // Scheduled discounts (PEDIT card 3) is independently collapsible.
  const [discountsCardOpen, setDiscountsCardOpen] = useState(false);
  // Fulfillment & shipping (PEDIT card 4) is independently collapsible.
  const [fulfillmentCardOpen, setFulfillmentCardOpen] = useState(false);
  // Attributes & values (PEDIT card 5) is independently collapsible.
  const [attributesCardOpen, setAttributesCardOpen] = useState(false);
  // Clothing Specs cards follow the same independent, per-product collapse
  // contract as the General cards.
  const [specsDisplayCardOpen, setSpecsDisplayCardOpen] = useState(false);
  const [specsClothingCardOpen, setSpecsClothingCardOpen] = useState(false);
  const [specsSizeChartCardOpen, setSpecsSizeChartCardOpen] = useState(false);
  const [specsMonogramCardOpen, setSpecsMonogramCardOpen] = useState(false);
  const addDiscountRef = useRef<HTMLDivElement>(null);

  const openCreateDrawer = () => {
    if (!can('product.create')) return refused('create products');
    setEditingProduct(null);
    setIsCreating(true);
    setBasicCardOpen(false);
    setPricingCardOpen(false);
    setDiscountsCardOpen(false);
    setFulfillmentCardOpen(false);
    setAttributesCardOpen(false);
    setSpecsDisplayCardOpen(false);
    setSpecsClothingCardOpen(false);
    setSpecsSizeChartCardOpen(false);
    setSpecsMonogramCardOpen(false);
    setProductTab('general');
    setDrawerView('compact');
    autoExpandedRef.current = false;
    setStageIndex(0);
    setFormName('');
    setFormSlug('');
    setFormCategory(categories[0] ?? UNCATEGORIZED_CATEGORY);
    setFormPrice('48.00');
    setFormComparePrice('');
    setFormCompareError(null);
    setFormStock('25');
    setFormStyleCode('');
    setFormSerialNo('');
    setFormWeight('');
    setFormShipWeight('');
    setFormDims('');
    setFormGender('');
    setFormTax('');
    setFormHsn('');
    setFormDiscounts([]);
    setFormSizeChartId('');
    setFormAttributes([
      { name: 'Color', values: ['Black', 'Chalk White', 'Olive'], builtin: true, displayType: 'swatch', swatchHex: {}, libraryId: libId('Color') },
      { name: 'Size', values: ['S', 'M', 'L', 'XL'], builtin: true, displayType: 'pill', swatchHex: {}, libraryId: libId('Size') },
      { name: 'Placements', values: ['Front'], builtin: true, displayType: 'radio', swatchHex: {}, libraryId: libId('Placements') },
    ]);
    setFormPartner('Qikink Direct API');
    setFormExchangePolicy('defects_only');
    setFormProductKind('physical');
    setFormLowStock('');
    setFormStatus('published');
    setFormDescription('Pre-shrunk premium heavyweight combed cotton with reinforced seams.');
    setFormPhoto({ layout: 'carousel', ratio: '4:3', showPhotos: true });
    setFormImages([]);
    setAddImageUrl('');
    setFormVariants([]);
    setFormAdjustments({});
    setAdjustmentDrafts({});
    setPriceDrafts({});
    setFormFabricGsm('');
    setFormCut('');
    setFormModelDims('');
    setFormCare('');
    setFormMonogramEnabled(false);
    setFormMonogramChars('3');
    setFormMonogramUpcharge('12.00');
  };

  // Drawer tab + media draft state (elastic workspace; tabs grow per phase)
  const [productTab, setProductTab] = useState<'general' | 'media' | 'variants' | 'specs' | 'partner'>('general');
  // Gallery presentation draft (P1a): PDP stage layout + ratio + visibility.
  const [formPhoto, setFormPhoto] = useState<PhotoSettings>({ layout: 'carousel', ratio: '4:3', showPhotos: true });
  const photoAspect = formPhoto.ratio === '1:1' ? '1 / 1' : formPhoto.ratio === '16:9' ? '16 / 9' : '4 / 3';
  // Gallery draft: persisted URL list + session-only upload previews.
  // Uploads preview instantly but never persist (blob URLs die on reload) —
  // the save toast states this demo truth outright.
  const [addImageUrl, setAddImageUrl] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  // Elastic view ownership (W1) + expand-once (VPRICE-4): the first hop into
  // Variants widens compact → matrix (never full) so the matrix fits; after
  // that the width is the user's choice and tab switches never resize the
  // drawer (no 520↔880 yoyo while hopping tabs).
  const [drawerView, setDrawerView] = useState<'compact' | 'matrix' | 'full'>('compact');
  const autoExpandedRef = useRef(false);
  const prevTab = useRef<'general' | 'media' | 'variants' | 'specs' | 'partner'>('general');
  React.useEffect(() => {
    const entered = prevTab.current !== 'variants' && productTab === 'variants';
    prevTab.current = productTab;
    if (entered && drawerView === 'compact' && !autoExpandedRef.current) {
      autoExpandedRef.current = true;
      setDrawerView('matrix');
    }
  }, [productTab, drawerView]);

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
      }
    });
  };
  // Apparel draft state (specs tab; all optional — fixtures stay valid)
  const [formFabricGsm, setFormFabricGsm] = useState('');
  const [formCut, setFormCut] = useState('');
  const [formModelDims, setFormModelDims] = useState('');
  const [formCare, setFormCare] = useState('');
  const [formMonogramEnabled, setFormMonogramEnabled] = useState(false);
  const [formMonogramChars, setFormMonogramChars] = useState('3');
  const [formMonogramUpcharge, setFormMonogramUpcharge] = useState('12.00');
  // Section visibility (persisted demo pref; monogram visible by default)
  const [visibleSections, setVisibleSections] = useState({ monogram: true });
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('tuw_admin_v2_product_editor');
      if (raw) {
        const saved = JSON.parse(raw) as { monogram?: boolean };
        if (typeof saved.monogram === 'boolean') setVisibleSections({ monogram: saved.monogram });
      }
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
  // Per-value price adjustments draft (R1): "Attribute:Value" → additive
  // upcharge (e.g. "Size:XL": 6). Sidecar only — cancelling the drawer
  // discards it; submit prunes stale keys and persists what remains.
  const [formAdjustments, setFormAdjustments] = useState<Record<string, number>>({});
  // Raw strings while typing (VPRICE-2) so decimal keystrokes survive;
  // commits are live, blur normalizes the display back to committed truth.
  const [adjustmentDrafts, setAdjustmentDrafts] = useState<Record<string, string>>({});

  // Matrix price drafts (VPRICE-4): same raw-string pattern for the price
  // column — text fields type decimals cleanly ("61." stays "61."), commits
  // stay live (typing pins the cell), blur snaps back to the 2dp truth.
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const setAdjustment = (key: string, amount: number | null) => {
    const nextAdj = { ...formAdjustments };
    if (amount === null) delete nextAdj[key];
    else nextAdj[key] = roundPrice(amount);
    setFormAdjustments(nextAdj);
    setFormVariants((prev) => recomputeVariants(parseFloat(formPrice) || 0, nextAdj, prev));
  };

  const writeAdjustment = (key: string, raw: string) => {
    // Money keys only (VPRICE-4): the boxes are text fields now, so decimals
    // type cleanly while letters and stray characters never enter state.
    if (!/^\d*\.?\d*$/.test(raw)) return;
    setAdjustmentDrafts((prev) => {
      const next = { ...prev };
      if (raw === '') delete next[key];
      else next[key] = raw;
      return next;
    });
    if (raw.trim() === '') {
      setAdjustment(key, null);
      return;
    }
    const n = parseFloat(raw);
    if (Number.isFinite(n) && n > 0) setAdjustment(key, n);
    // invalid or refused (≤ 0) — committed state untouched; blur snaps back
  };

  const clearAdjustmentDraft = (key: string) => {
    setAdjustmentDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Price-cell draft clear (VPRICE-4): blur drops the raw string so the
  // cell re-renders the committed 2dp value.
  const clearPriceDraft = (id: string) => {
    setPriceDrafts((prev) => {
      if (prev[id] === undefined) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Base price write (R1): re-derives every unpinned cell from
  // base + Σ adjustments; explicit overrides stay pinned. This replaces
  // the old write-all that trampled per-cell overrides on every keystroke.
  const writeBasePrice = (priceStr: string) => {
    // Money keys only (VPRICE-4): the field is text now (clean decimals),
    // so refuse anything that is not digits with at most one dot.
    if (!/^\d*\.?\d*$/.test(priceStr)) return;
    setFormPrice(priceStr);
    if (formCompareError) setFormCompareError(null);
    const n = parseFloat(priceStr);
    if (isNaN(n) || n < 0) return;
    setFormVariants((prev) => recomputeVariants(roundPrice(n), formAdjustments, prev));
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
          if (kept) {
            // Kept cells re-derive through the ladder unless pinned (R1).
            out.push(
              kept.priceOverridden
                ? kept
                : { ...kept, price: deriveVariantPrice(basePrice, formAdjustments, color, size) }
            );
          } else {
            out.push({
              id: `tmp-${ci}-${size}`,
              color,
              size,
              sku: buildVariantSku(productId, ci, size),
              price: deriveVariantPrice(basePrice, formAdjustments, color, size),
              stock: 0,
            });
          }
        });
      });
      return out;
    });
  };

  // Chip editor (A1b): one-by-one values, no comma parsing. Builtin
  // Color/Size edits rebuild the matrix (kept cells keep stock; unpinned
  // prices re-derive through the ladder);
  // custom attributes store on the draft for A2's generalized matrix.
  const colorsSizesOf = (attrs: Array<{ name: string; values: string[] }>) => ({
    colors: attrs.find((a) => a.name === 'Color')?.values ?? [],
    sizes: attrs.find((a) => a.name === 'Size')?.values ?? [],
  });
  const addAttrValue = (name: string) => {
    const v = (attrDrafts[name] ?? '').trim();
    if (!v) return;
    if (commitAttrValue(name, v)) {
      setAttrDrafts((prev) => ({ ...prev, [name]: '' }));
    }
  };
  // Core value commit (VALPICK): dup guard + append + conditional
  // register-through + matrix rebuild. Picker and text input share it —
  // one path, no drift. Existing library values are ASSIGNED, never
  // re-registered (assign vs register — DOC/backend/04-Catalog.md).
  const commitAttrValue = (name: string, v: string): boolean => {
    const value = v.trim();
    if (!value) return false;
    const attr = formAttributes.find((a) => a.name === name);
    if (!attr) return false;
    if (attr.values.some((x) => x.toLowerCase() === value.toLowerCase())) {
      showToast({ type: 'warning', title: 'Duplicate Value', description: `"${value}" is already a ${name} value.` });
      return false;
    }
    const next = formAttributes.map((a) => (a.name === name ? { ...a, values: [...a.values, value] } : a));
    setFormAttributes(next);
    // Assign vs register: a value that already exists in the linked library
    // row is a pure assignment — the card gains it, the library is
    // untouched (calling the register seam on an existing spelling fired a
    // false "Duplicate Value" on every picker click). Register-through
    // fires only for genuinely new spellings.
    if (attr.libraryId) {
      const lib = libraryAttributes.find((l) => l.id === attr.libraryId);
      const known = (lib?.values ?? []).some((x) => x.toLowerCase() === value.toLowerCase());
      if (!known) addLibraryValue(attr.libraryId, value);
    }
    if (name === 'Color' || name === 'Size') {
      const { colors, sizes } = colorsSizesOf(next);
      rebuildMatrix(colors, sizes, parseFloat(formPrice) || 0, editingProduct?.id ?? 'PRD');
    }
    return true;
  };
  const removeAttrValue = (name: string, value: string) => {
    const next = formAttributes.map((a) =>
      a.name === name ? { ...a, values: a.values.filter((x) => x !== value) } : a
    );
    setFormAttributes(next);
    // Ladder hygiene (R1): a removed value takes its adjustment with it.
    const pruned = pruneAdjustments(formAdjustments, next);
    setFormAdjustments(pruned.next);
    if (pruned.dropped.length > 0) {
      showToast({
        type: 'info',
        title: 'Price Adjustment Cleared',
        description: `The per-value adjustment for "${value}" was removed with the value.`,
      });
    }
    if (name === 'Color' || name === 'Size') {
      const { colors, sizes } = colorsSizesOf(next);
      rebuildMatrix(colors, sizes, parseFloat(formPrice) || 0, editingProduct?.id ?? 'PRD');
    }
  };
  const addAttribute = () => {
    const name = newAttrName.trim();
    if (!name) return;
    if (formAttributes.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      showToast({ type: 'warning', title: 'Duplicate Attribute', description: `"${name}" already exists.` });
      return;
    }
    // N1a auto-register: link when the library knows this name, else
    // register it there first (disclosed) so one record always exists.
    const lib = libraryAttributes.find((l) => l.name.toLowerCase() === name.toLowerCase());
    const linkedId = lib?.id ?? createLibraryAttribute(name);
    if (!linkedId) return;
    setFormAttributes((prev) => [...prev, { name, values: [], builtin: false, displayType: 'pill', swatchHex: {}, libraryId: linkedId }]);
    setNewAttrName('');
    if (!lib) {
      showToast({ type: 'info', title: 'New Library Attribute', description: `"${name}" joins the attribute library when you save this product.` });
    }
  };
  const removeAttribute = (name: string) => {
    setFormAttributes((prev) => prev.filter((a) => a.name !== name));
  };

  // Copy from the global library (settings manager): missing values merge
  // into the draft (new card when absent); drafts diverge after copy.
  // Link a library attribute (N1a): adds a linked card carrying the
  // library's current values (inheriting display type); already-linked
  // attributes are skipped with an info toast. No copies, no merges.
  const linkFromLibrary = (libId: string) => {
    const lib = libraryAttributes.find((a) => a.id === libId);
    if (!lib) return;
    const existing = formAttributes.find((a) => a.name.toLowerCase() === lib.name.toLowerCase());
    if (existing) {
      if (!existing.libraryId) {
        setFormAttributes((prev) =>
          prev.map((a) =>
            a.name.toLowerCase() === lib.name.toLowerCase() ? { ...a, libraryId: lib.id } : a
          )
        );
      }
      showToast({ type: 'info', title: 'Already Linked', description: `"${lib.name}" is already on this product.` });
      return;
    }
    setFormAttributes((prev) => [
      ...prev,
      {
        name: lib.name,
        values: [...lib.values],
        builtin: false,
        displayType: lib.displayType,
        swatchHex: {},
        libraryId: lib.id,
      },
    ]);
    showToast({ type: 'success', title: 'Linked From Library', description: `"${lib.name}" linked with ${lib.values.length} values.` });
  };

  // Scheduled discount rows (P1d): local composition, no new primitive.
  // Kill switch flips isActive (reversible); trash removes the draft row.
  const addDiscount = () => {
    setFormDiscounts((prev) => [
      ...prev,
      { id: `tmp-d-${Date.now()}`, discountType: 'percent', value: 10, startsAt: '', endsAt: '', isActive: true },
    ]);
  };
  const patchDiscount = (id: string, patch: Partial<ProductDiscount>) => {
    setFormDiscounts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };
  const removeDiscount = (id: string) => {
    setFormDiscounts((prev) => prev.filter((d) => d.id !== id));
    requestAnimationFrame(() => {
      addDiscountRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    });
  };
  const setSwatchHex = (name: string, value: string, hex: string) => {
    setFormAttributes((prev) =>
      prev.map((a) => (a.name === name ? { ...a, swatchHex: { ...a.swatchHex, [value]: hex } } : a))
    );
  };
  // Shared attribute row (PEDIT card 5): flat bordered groups, value chips, and
  // a read-only display type from the library. The library owns the showcase
  // type; products only keep their own value list and swatch colours.
  const libraryOf = (attr: ProductAttribute) =>
    libraryAttributes.find((l) => l.id === attr.libraryId) ??
    libraryAttributes.find((l) => l.name.toLowerCase() === attr.name.toLowerCase());
  const showsOnPdp = (attr: ProductAttribute) => {
    const lib = libraryOf(attr);
    return lib ? lib.showOnPdp : attr.name !== 'Placements';
  };
  const storefrontAttributes = formAttributes.filter((attr) => showsOnPdp(attr));
  const internalAttributes = formAttributes.filter((attr) => !showsOnPdp(attr));

  const attributeDisplayType = (attr: ProductAttribute) =>
    normalizeAttributeDisplayType(libraryOf(attr)?.displayType);

  const attributeSurfaces = (attr: ProductAttribute): string[] => {
    const lib = libraryOf(attr);
    if (!lib) return [];
    return [
      lib.showOnPdp ? 'PDP' : null,
      lib.showOnCheckout ? 'Checkout' : null,
      lib.showOnAdmin ? 'Admin' : null,
    ].filter((surface): surface is string => surface !== null);
  };

  const attributeMeta = (attr: ProductAttribute, internal: boolean) => {
    const lib = libraryOf(attr);
    const valueLabel = `${attr.values.length} value${attr.values.length === 1 ? '' : 's'}`;
    const surfaces = attributeSurfaces(attr);
    if (internal) {
      return `${valueLabel} · ${surfaces.length > 0 ? surfaces.join(' · ') : 'Internal'} · ${lib ? 'Linked' : 'Unlinked'}`;
    }
    return `${valueLabel} · ${surfaces.length > 0 ? surfaces.join(' · ') : 'PDP'} · ${lib ? 'Linked' : 'Unlinked'}`;
  };

  const renderAttributeChip = (attr: ProductAttribute, value: string, internal: boolean) => {
    const displayType = attributeDisplayType(attr);
    return (
      <span key={value} style={attributeChipStyle}>
        {!internal && displayType === 'swatch' ? (
          <input
            type="color"
            className="tuw-color-swatch"
            aria-label={`Swatch color for ${value}`}
            title={`Pick the PDP swatch color for ${value}`}
            value={attr.swatchHex[value] ?? '#D1D5DB'}
            onChange={(e) => setSwatchHex(attr.name, value, e.target.value)}
            style={{ flexShrink: 0 }}
          />
        ) : null}
        {!internal && displayType === 'radio' ? (
          <span
            aria-hidden="true"
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid var(--tuw-border-control)',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          />
        ) : null}
        <span>{value}</span>
        <IconButton
          label={`Remove ${value} from ${attr.name}`}
          icon={<X size={11} />}
          size="sm"
          variant="ghost"
          className="tuw-danger-hover"
          onClick={() => removeAttrValue(attr.name, value)}
          style={{ width: 22, height: 22, borderRadius: 999, color: 'var(--tuw-text-secondary)' }}
        />
      </span>
    );
  };

  const renderAttributeRow = (attr: ProductAttribute, internal = false) => {
    const lib = libraryOf(attr);
    const displayType = attributeDisplayType(attr);
    const rowTitleId = `attribute-${attr.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'value'}-title`;
    const known = [...new Set([...(lib?.values ?? []), ...attr.values])];
    const missing = known.filter(
      (value) => !attr.values.some((current) => current.toLowerCase() === value.toLowerCase())
    );

    return (
      <div key={attr.name} role="group" aria-labelledby={rowTitleId} style={flatGroupStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
            <span
              id={rowTitleId}
              style={{ fontSize: 14, lineHeight: '22px', fontWeight: 600, color: 'var(--tuw-text-primary)' }}
            >
              {attr.name}
            </span>
            {attr.builtin ? <Badge variant="info" size="sm">Default</Badge> : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {internal ? (
              !lib ? <Badge variant="warning" size="sm">Unlinked</Badge> : null
            ) : lib ? (
              <Badge variant="neutral" size="sm">{attributeDisplayLabel(displayType)}</Badge>
            ) : (
              <Badge variant="warning" size="sm">Unlinked · {attributeDisplayLabel(displayType)}</Badge>
            )}
            {!attr.builtin ? (
              <IconButton
                label={`Remove attribute ${attr.name}`}
                icon={<Trash2 size={14} />}
                size="sm"
                variant="ghost"
                className="tuw-danger-hover"
                onClick={() => removeAttribute(attr.name)}
                style={{ color: 'var(--tuw-text-secondary)' }}
              />
            ) : null}
          </div>
        </div>
        <span style={attributeMetaStyle}>{attributeMeta(attr, internal)}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {attr.values.length > 0 ? (
            attr.values.map((value) => renderAttributeChip(attr, value, internal))
          ) : (
            <span style={{ fontSize: 12, lineHeight: '18px', color: 'var(--tuw-text-secondary)' }}>
              No values yet
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px', minWidth: 0 }}>
            <Input
              aria-label={`Add ${attr.name} value`}
              placeholder={`Add ${attr.name.toLowerCase()} value…`}
              value={attrDrafts[attr.name] ?? ''}
              onChange={(e) => setAttrDrafts((prev) => ({ ...prev, [attr.name]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAttrValue(attr.name);
                }
              }}
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            type="button"
            aria-label={`Add ${attr.name} value`}
            onClick={() => addAttrValue(attr.name)}
            disabled={(attrDrafts[attr.name] ?? '').trim() === ''}
          >
            Add
          </Button>
          {missing.length > 0 ? (
            <DropdownMenu
              ariaLabel={`Pick known ${attr.name} value`}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  aria-label={`Choose known ${attr.name} value`}
                  icon={<ChevronDown size={14} />}
                >
                  Choose known value
                </Button>
              }
              items={missing.map((value) => ({ value, label: value }))}
              onSelect={(value) => commitAttrValue(attr.name, value)}
            />
          ) : null}
        </div>
      </div>
    );
  };

  // The list is light (no variants); the full record loads when a product opens.
  const openEditDrawer = async (summary: ProductItem) => {
    if (!can('product.update')) return refused('edit products');
    if (openingId) return;
    setOpeningId(summary.id);
    const result = await getProductAction({ id: summary.id });
    setOpeningId(null);
    if (!result.ok) return showToast({ type: 'warning', title: 'Could Not Open Product', description: result.error.message });
    const { movements, ...detail } = result.data;
    setStockMovements(movements as StockMovement[]);
    loadEditDrawer(detail as unknown as ProductItem);
  };

  const loadEditDrawer = (product: ProductItem) => {
    setIsCreating(false);
    setEditingProduct(product);
    setBasicCardOpen(false);
    setPricingCardOpen(false);
    setDiscountsCardOpen(false);
    setFulfillmentCardOpen(false);
    setAttributesCardOpen(false);
    setSpecsDisplayCardOpen(false);
    setSpecsClothingCardOpen(false);
    setSpecsSizeChartCardOpen(false);
    setSpecsMonogramCardOpen(false);
    setProductTab('general');
    setFormCompareError(null);
    setDrawerView('compact');
    autoExpandedRef.current = false;
    setStageIndex(0);
    setFormPhoto(product.photoSettings ?? { layout: 'carousel', ratio: '4:3', showPhotos: true });
    setFormImages(
      product.images.map((src, i) => ({ id: `g-${i}`, src, name: baseName(src), persisted: true }))
    );
    setAddImageUrl('');
    setFormFabricGsm(product.fabricGsm || '');
    setFormCut(product.cut || '');
    setFormModelDims(product.modelDims || '');
    setFormCare(product.care || '');
    setFormMonogramEnabled(product.monogram?.enabled || false);
    setFormMonogramChars(String(product.monogram?.maxChars ?? 3));
    setFormMonogramUpcharge(product.monogram ? product.monogram.upcharge.toFixed(2) : '12.00');

    // Attribute draft (N1a link match) — built once: the ladder load below
    // prunes adjustment keys against these values, and the drawer renders
    // the same copy.
    // Persisted rows may carry only overrides (for example a Placements
    // attribute added to a fixture); Color, Size and Placements are always
    // rebuilt from the product so the drawer never loses a builtin row.
    const savedAttributes: ProductAttribute[] = (product.attributes ?? []).map((a) => {
      // N1a link: match persisted attrs to the library by name once, so
      // every card carries its single-record id from here on.
      const lib = libraryAttributes.find((l) => l.name.toLowerCase() === a.name.toLowerCase());
      const copy = { ...a } as ProductAttribute & { visibleOn?: unknown };
      delete copy.visibleOn;
      return {
        ...copy,
        libraryId: a.libraryId ?? lib?.id,
        values: [...a.values],
        swatchHex: { ...(a.swatchHex ?? {}) },
      };
    });
    const builtinAttributes: ProductAttribute[] = [
      { name: 'Color', values: [...product.colors], builtin: true, displayType: 'swatch', swatchHex: {}, libraryId: libId('Color') },
      { name: 'Size', values: [...product.sizes], builtin: true, displayType: 'pill', swatchHex: {}, libraryId: libId('Size') },
      { name: 'Placements', values: [], builtin: true, displayType: 'radio', swatchHex: {}, libraryId: libId('Placements') },
    ];
    const loadedAttributes: ProductAttribute[] = [
      ...builtinAttributes.map((base) => {
        const saved = savedAttributes.find(
          (a) => a.name.toLowerCase() === base.name.toLowerCase()
        );
        return saved ? { ...base, ...saved } : base;
      }),
      ...savedAttributes.filter(
        (a) =>
          !builtinAttributes.some(
            (base) => base.name.toLowerCase() === a.name.toLowerCase()
          )
      ),
    ];

    // Pricing ladder load (R1): sanitize the sidecar against these values;
    // legacy cells whose price differs from the derived value become pinned
    // overrides (their look is preserved — reset unpins them spotwise).
    const basePrice = product.basePrice ?? product.price;
    const loadedAdjustments = pruneAdjustments(product.priceAdjustments, loadedAttributes).next;
    setFormAdjustments(loadedAdjustments);
    setAdjustmentDrafts({});
    setPriceDrafts({});
    setFormVariants(
      resolveVariants(product).map((v) =>
        v.priceOverridden !== undefined
          ? v
          : deriveVariantPrice(basePrice, loadedAdjustments, v.color, v.size) === v.price
            ? v
            : { ...v, priceOverridden: true }
      )
    );
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormCategory(product.category);
    setFormPrice(product.price.toFixed(2));
    setFormComparePrice(product.compareAtPrice ? product.compareAtPrice.toFixed(2) : '');
    setFormStock(String(product.stock));
    setFormStyleCode(product.styleCode || '');
    setFormSerialNo(product.internalSerialNo !== undefined ? String(product.internalSerialNo) : '');
    setFormWeight(product.weight || '');
    setFormShipWeight(product.shippingWeight || '');
    setFormDims(product.dimensions || '');
    setFormGender(product.gender || '');
    setFormTax(product.taxRate !== undefined ? String(product.taxRate) : '');
    setFormHsn(product.hsnCode || '');
    setFormDiscounts((product.discounts ?? []).map((d) => ({ ...d })));
    setFormSizeChartId(product.sizeChartId ?? '');
    setFormAttributes(loadedAttributes);
    setFormPartner(product.partner);
    setFormExchangePolicy(product.exchangePolicy ?? 'defects_only');
    setFormProductKind(product.productKind ?? 'physical');
    setFormLowStock(product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : '');
    setFormStatus(product.publicationStatus);
    setFormDescription(product.description);
  };

  /** Field errors from the server decide which tab the editor shows. */
  const showSaveError = (error: { message: string; details: { field?: string }[] }) => {
    const fieldName = error.details[0]?.field ?? '';
    if (fieldName.startsWith('variants')) setProductTab('variants');
    else if (fieldName.startsWith('images')) setProductTab('media');
    else if (fieldName) {
      setProductTab('general');
      setBasicCardOpen(true);
      setPricingCardOpen(true);
    }
    showToast({ type: 'warning', title: 'Not Saved', description: error.message });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!isValidHsnCode(formHsn)) {
      setPricingCardOpen(true);
      setProductTab('general');
      showToast({
        type: 'warning',
        title: 'Check HSN Code',
        description: 'HSN/SAC must be 4–8 digits, or left blank.',
      });
      return;
    }
    if (isCreating) {
      const priceNum = parseFloat(formPrice) || 0;
      const stockNum = parseInt(formStock, 10) || 0;
      const compare = parseCompareAtPrice(formComparePrice, priceNum);
      if (compare.error) {
        setFormCompareError(compare.error);
        setPricingCardOpen(true);
        setProductTab('general');
        showToast({ type: 'warning', title: 'Check Compare-at Price', description: compare.error });
        return;
      }
      setFormCompareError(null);
      setSaving(true);
      const created = await createProductAction({
        name: formName,
        slug: formSlug,
        category: formCategory,
        price: priceNum,
        compareAtPrice: compare.value,
        stock: stockNum,
        colors: colorValues,
        sizes: sizeValues,
        styleCode: formStyleCode.trim() || undefined,
        internalSerialNo: formSerialNo.trim() !== '' ? Number(formSerialNo) : undefined,
        weight: formWeight.trim() || undefined,
        shippingWeight: formShipWeight.trim() || undefined,
        dimensions: formDims.trim() || undefined,
        gender: formGender || undefined,
        taxRate: formTax.trim() !== '' && !isNaN(parseFloat(formTax)) ? parseFloat(formTax) : undefined,
        hsnCode: formHsn.trim() || undefined,
        sizeChartId: formSizeChartId || undefined,
        exchangePolicy: formExchangePolicy,
        lowStockThreshold: formLowStock === '' ? undefined : Number(formLowStock),
        productKind: formProductKind,
        partner: formPartner,
        publicationStatus: formStatus,
        description: formDescription,
        photoSettings: formPhoto,
        discounts: formDiscounts,
        images: formImages.filter((im) => im.persisted).map((im) => im.src),
        attributes: formAttributes,
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
      });
      setSaving(false);
      // A refused save keeps the drawer open with every input intact.
      if (!created.ok) return showSaveError(created.error);
      setProducts((list) => [created.data.product as unknown as ProductItem, ...list]);
      showToast({ type: 'success', title: 'Product Created', description: `"${created.data.product.name}" was saved. ${created.data.product.publicationStatus === 'published' ? storefrontNote(created.data.storefront) : 'It stays hidden until published.'}` });
      const droppedCount = formImages.filter((im) => !im.persisted).length;
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

    const parsedBase = parseFloat(formPrice);
    const baseNum = roundPrice(
      !isNaN(parsedBase) && parsedBase >= 0 ? parsedBase : editingProduct.basePrice ?? editingProduct.price
    );
    // The draft matrix is the submit source: colors/sizes/stock derive from
    // it in the seam; prices re-derive through the ladder (R1:
    // base + Σ adjustments, pinned cells stay), and the listed price is the
    // lowest cell ("From ₹X"), materialized.
    const draftError = variantDraftError();
    if (draftError) {
      showToast({ type: 'warning', title: 'Check Variants', description: draftError });
      setProductTab('variants');
      return;
    }
    const draftVariants = formVariants.length > 0 ? formVariants : resolveVariants(editingProduct);
    const submitVariants = recomputeVariants(baseNum, formAdjustments, draftVariants).map((v) => {
      const { priceOverridden, ...rest } = v;
      return priceOverridden ? { ...rest, priceOverridden: true as const } : rest;
    });
    const minPrice = submitVariants.length > 0 ? minFromPrice(submitVariants) : baseNum;
    const compare = parseCompareAtPrice(formComparePrice, minPrice);
    if (compare.error) {
      setFormCompareError(compare.error);
      setPricingCardOpen(true);
      setProductTab('general');
      showToast({ type: 'warning', title: 'Check Compare-at Price', description: compare.error });
      return;
    }
    setFormCompareError(null);
    const cleanAdjustments = pruneAdjustments(formAdjustments, formAttributes).next;

    setSaving(true);
    const updated = await updateProductAction({
      id: editingProduct.id,
      expectedUpdatedAt: editingProduct.updatedAt,
      colors: colorValues,
      sizes: sizeValues,
      stock: submitVariants.reduce((n, v) => n + v.stock, 0),
      name: formName,
      slug: formSlug,
      category: formCategory,
      price: minPrice,
      basePrice: baseNum,
      priceAdjustments: Object.keys(cleanAdjustments).length > 0 ? cleanAdjustments : undefined,
      compareAtPrice: compare.value,
      partner: formPartner,
      publicationStatus: formStatus,
      description: formDescription,
      styleCode: formStyleCode.trim() || undefined,
      internalSerialNo: formSerialNo.trim() !== '' ? Number(formSerialNo) : undefined,
      weight: formWeight.trim() || undefined,
      shippingWeight: formShipWeight.trim() || undefined,
      dimensions: formDims.trim() || undefined,
      gender: formGender || undefined,
      taxRate: formTax.trim() !== '' && !isNaN(parseFloat(formTax)) ? parseFloat(formTax) : undefined,
      hsnCode: formHsn.trim() || undefined,
      sizeChartId: formSizeChartId || undefined,
      exchangePolicy: formExchangePolicy,
      lowStockThreshold: formLowStock === '' ? undefined : Number(formLowStock),
      productKind: formProductKind,
      photoSettings: formPhoto,
      discounts: formDiscounts,
      images: formImages.filter((im) => im.persisted).map((im) => im.src),
      variants: submitVariants,
      attributes: formAttributes,
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
    });
    setSaving(false);
    if (!updated.ok) return showSaveError(updated.error);
    setProducts((list) => list.map((p) => (p.id === editingProduct.id ? (updated.data.product as unknown as ProductItem) : p)));
    showToast({ type: 'success', title: 'Product Updated', description: `Changes saved. ${storefrontNote(updated.data.storefront)}` });

    const droppedCount = formImages.filter((im) => !im.persisted).length;
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
          ? !p.madeToOrder && p.stock > 0 && p.stock <= (p.lowStockAt ?? 10)
          : !p.madeToOrder && p.stock === 0;
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

  // Add / remove matrix rows (V1): new rows carry tmp- ids (same convention
  // as rebuildMatrix fresh cells) with blank color/size rendered as inputs;
  // touching color/size on a tmp- row regenerates its SKU.
  const addVariant = () => {
    const basePrice = parseFloat(formPrice) || 0;
    setFormVariants((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        color: '',
        size: '',
        sku: '',
        price: basePrice,
        stock: 0,
      },
    ]);
  };
  const touchVariant = (id: string, patch: Partial<ProductVariant>) => {
    setFormVariants((prev) => {
      const colors = [...new Set(prev.map((v) => v.color).filter(Boolean))];
      return prev.map((v) => {
        if (v.id !== id) return v;
        const next = { ...v, ...patch };
        if (v.id.startsWith('tmp-') && (patch.color !== undefined || patch.size !== undefined)) {
          const known = colors.includes(next.color);
          next.sku = next.color && next.size
            ? buildVariantSku(editingProduct?.id ?? 'PRD', known ? colors.indexOf(next.color) : colors.length, next.size)
            : '';
          // Ladder (R1): typing a real color/size pulls its adjustments in.
          if (!next.priceOverridden) {
            next.price = deriveVariantPrice(parseFloat(formPrice) || 0, formAdjustments, next.color, next.size);
          }
        }
        return next;
      });
    });
  };
  const removeVariant = (id: string) => {
    setFormVariants((prev) => prev.filter((v) => v.id !== id));
  };

  // Save guard (V1): blank or duplicate color|size rows block the submit
  // with a naming toast; all input is preserved (drawer stays open).
  const variantDraftError = (): string | null => {
    const seen = new Set<string>();
    for (const v of formVariants) {
      const color = v.color.trim();
      const size = v.size.trim();
      if (!color || !size) return 'Each variant needs a color and a size — fill the blank row or remove it.';
      const key = `${color.toLowerCase()}|${size.toLowerCase()}`;
      if (seen.has(key)) return `Duplicate variant "${v.color} / ${v.size}" — merge it or remove one.`;
      seen.add(key);
    }
    return null;
  };

  // Ladder readout (R1): the lowest cell is the storefront "From" price.
  const variantLowest = formVariants.length > 0 ? minFromPrice(formVariants) : null;
  const variantSpread = formVariants.length > 1 && new Set(formVariants.map((v) => v.price)).size > 1;

  // Per-cell Σ adjustments (VPRICE-2): provenance chip + tooltip data.
  const cellAdjustment = (color: string, size: string) =>
    sumAdjustments(formAdjustments, [
      { attr: 'Color', value: color },
      { attr: 'Size', value: size },
    ]);

  // Tooltip copy for derived cells (VPRICE-3): names every contributing value
  // upcharge so the +Δ chip explains itself without opening the editor.
  const cellPriceBreakdown = (color: string, size: string, effective: number) => {
    const base = parseFloat(formPrice) || 0;
    const parts: string[] = [];
    const colorAdj = formAdjustments[adjustmentKey('Color', color)] ?? 0;
    const sizeAdj = formAdjustments[adjustmentKey('Size', size)] ?? 0;
    if (colorAdj > 0) parts.push(`${color} ₹${colorAdj.toFixed(2)}`);
    if (sizeAdj > 0) parts.push(`${size} ₹${sizeAdj.toFixed(2)}`);
    return parts.length > 0
      ? `Base ₹${base.toFixed(2)} + ${parts.join(' + ')} = ₹${effective.toFixed(2)}`
      : `Base ₹${base.toFixed(2)}`;
  };

  // CSV import pipeline (X1b): Final Listing workbooks re-saved as CSV.
  // Parses the workbook title row, groups listing rows into products, and
  // stages one draft per group (not one per row). Row errors preserve the
  // file + error list; no valid row is mutated on rejection.
  const [importPreview, setImportPreview] = useState<{
    fileName: string;
    groups: ImportProductGroup[];
    /** Exactly what the server import receives. */
    listing: Record<string, unknown>[];
    errors: Array<{ row: number; message: string }>;
    hasCategoryColumn: boolean;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const importVariantTotal =
    importPreview?.groups.reduce((total, group) => total + group.variants.length, 0) ?? 0;

  const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            cell += '"';
            i++;
          } else inQuotes = false;
        } else cell += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else if (ch !== '\r') cell += ch;
    }
    if (cell !== '' || row.length > 0) {
      row.push(cell);
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
  };

  const handleImportFile = (file: File | undefined) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      showToast({
        type: 'info',
        title: 'Save As CSV First',
        description: 'Binary .xls workbooks cannot be parsed — re-save the sheet as CSV and drop it here.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const grid = parseCsv(String(reader.result ?? ''));
      if (grid.length < 2) {
        showToast({ type: 'warning', title: 'Empty Sheet', description: `"${file.name}" has no data rows.` });
        return;
      }

      // Workbook header is row 2 (row 1 is the sheet title). Find the first
      // row that actually carries the canonical columns instead of assuming
      // headers are row 1.
      const headerRowIndex = grid.findIndex((cells) => {
        const normalized = cells.map((cell) => cell.trim().toLowerCase());
        return (
          normalized.includes('style') &&
          normalized.some((cell) => ['sizes', 'size', 'base price', 'price'].includes(cell))
        );
      });
      if (headerRowIndex < 0) {
        showToast({
          type: 'warning',
          title: 'Header Row Not Found',
          description: 'Expected a Style column plus sizes or Base Price. Re-save the Final Listing sheet as CSV.',
        });
        return;
      }

      const headers = grid[headerRowIndex].map((h) => h.trim().toLowerCase());
      const col = (names: string[]) => {
        for (const n of names) {
          const i = headers.indexOf(n);
          if (i >= 0) return i;
        }
        return -1;
      };
      const cStyle = col(['style']);
      const cSerial = col(['s.no', 's no', 'serial no', 'serial number', 'sno']);
      const cSizes = col(['sizes', 'size']);
      const cColors = col(['colors', 'color']);
      const cWeight = col(['weight']);
      const cShip = col(['shipping weight', 'ship weight']);
      const cPrice = col(['base price', 'price']);
      const cPlace = col(['placements', 'placement']);
      const cDims = col(['package dimensions (lxbxh)', 'package dimensions', 'dimensions', 'package dimension']);
      const cTax = col(['tax rate', 'tax']);
      const cGender = col(['gender']);
      const cHsn = col(['hsn', 'hsn code', 'hsn/sac']);
      const cCategory = col(['category', 'product category']);
      // The same planner the server import runs, so the preview cannot drift
      // from what actually gets created.
      const sheetRows: number[] = [];
      const listing = grid.slice(headerRowIndex + 1).map((cells, i) => {
        sheetRows.push(headerRowIndex + i + 2);
        const get = (c: number) => (c >= 0 ? (cells[c] ?? '').trim() : '');
        return {
          qikinkId: get(cSerial), gender: get(cGender), style: get(cStyle), sizes: get(cSizes), colors: get(cColors), placements: get(cPlace), basePriceINR: get(cPrice),
          weightGrams: get(cWeight), shippingWeightGrams: get(cShip), packageDimensionsCm: get(cDims), taxRatePercent: get(cTax), hsn: get(cHsn), category: get(cCategory),
        };
      });
      const parsed = parseQikinkListing(listing);
      const grouped = groupImportRows(parsed.rows);
      setImportPreview({
        fileName: file.name,
        groups: grouped.groups,
        listing,
        errors: [...parsed.issues, ...grouped.issues].map((issue) => ({ row: sheetRows[issue.row - 1] ?? issue.row, message: issue.message })),
        hasCategoryColumn: cCategory >= 0,
      });
    };
    reader.readAsText(file);
  };

  // The server re-validates every row and creates drafts (import_jobs); the
  // preview above is only a convenience.
  const applyImport = async () => {
    if (!importPreview || importPreview.groups.length === 0 || importing) return;
    if (!can('product.import')) return refused('import products');
    setImporting(true);
    const result = await importListingAction({
      rows: importPreview.listing,
    });
    setImporting(false);
    if (!result.ok) return showToast({ type: 'warning', title: 'Import Failed', description: result.error.message });
    setImportPreview(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
    const { created, updated, failedRows } = result.data;
    showToast({
      type: failedRows ? 'warning' : 'success',
      title: failedRows ? 'Import Partly Done' : 'Import Staged',
      description: `${created} new draft${created === 1 ? '' : 's'}, ${updated} already in the catalog${failedRows ? `, ${failedRows} row${failedRows === 1 ? '' : 's'} refused` : ''}. Review prices and publish each from the catalog.`,
    });
    router.refresh();
  };

  // Customer-view gallery slides: the ordered image list (persisted + previews).
  const gallerySlides: Array<{ type: 'image'; src: string; alt: string }> = formImages.map((im) => ({
    type: 'image' as const,
    src: assetSrc(im.src),
    alt: formName || 'Product image',
  }));

  // Bulk actions (table-view bar appears when rows are selected)
  const clearSelection = () => setSelectedIds(new Set());

  const handleExportSelected = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) return;
    const headers = [
      'Product ID',
      'Name',
      'Slug',
      'Category',
      'Style Code',
      'Internal S.No',
      'HSN',
      'Price',
      'Stock',
      'Sold',
      'Status',
    ];
    const rows = selected.map((p) => [
      p.id,
      `"${p.name}"`,
      p.slug,
      p.category,
      p.styleCode ?? '',
      p.internalSerialNo !== undefined ? String(p.internalSerialNo) : '',
      p.hsnCode ?? '',
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

  const handleBulkStatus = async (status: 'published' | 'archived', label: string) => {
    const ids = [...selectedIds];
    if (ids.length === 0 || saving) return;
    if (!can(status === 'archived' ? 'product.archive' : 'product.update')) return refused('change product status');
    setSaving(true);
    const result = await setProductsStatusAction({ ids, status });
    setSaving(false);
    if (!result.ok) return showToast({ type: 'warning', title: 'Not Updated', description: result.error.message });
    const done = new Set(result.data.updated);
    setProducts((list) => list.map((p) => (done.has(p.id) ? { ...p, publicationStatus: status } : p)));
    if (editingProduct && done.has(editingProduct.id)) setEditingProduct({ ...editingProduct, publicationStatus: status });
    setPublicationFilter('all');
    setCurrentPage(1);
    const { refused: skipped } = result.data;
    showToast({
      type: skipped.length ? 'warning' : 'success',
      title: skipped.length ? 'Partly Updated' : 'Bulk Update Applied',
      description: `${done.size} product${done.size === 1 ? '' : 's'} marked ${label}.${skipped.length ? ` Skipped: ${skipped.slice(0, 3).map((x) => `${x.name} (${x.reason})`).join(', ')}${skipped.length > 3 ? ` and ${skipped.length - 3} more` : ''}.` : ''}`,
    });
    clearSelection();
  };

  const removeProducts = async (ids: string[]) => {
    if (!can('product.archive')) { refused('delete products'); return false; }
    setSaving(true);
    const result = await deleteProductsAction({ ids });
    setSaving(false);
    if (!result.ok) { showToast({ type: 'warning', title: 'Not Deleted', description: result.error.message }); return false; }
    const gone = new Set(result.data.deleted);
    setProducts((list) => list.filter((p) => !gone.has(p.id)));
    return true;
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0 || saving) return;
    if (!window.confirm(`Delete ${ids.length} product${ids.length === 1 ? '' : 's'} from the catalog? They disappear from the store; past orders keep their records.`)) return;
    if (!(await removeProducts(ids))) return;
    if (editingProduct && selectedIds.has(editingProduct.id)) setEditingProduct(null);
    setCurrentPage(1);
    showToast({ type: 'success', title: 'Bulk Delete Applied', description: `${ids.length} product${ids.length === 1 ? '' : 's'} removed from the catalog.` });
    clearSelection();
  };

  const lowStockCount = products.filter((p) => !p.madeToOrder && p.stock > 0 && p.stock <= (p.lowStockAt ?? 10)).length;
  const outOfStockCount = products.filter((p) => !p.madeToOrder && p.stock === 0).length;
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
  const stageCarousel = !formPhoto.showPhotos ? (
    <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', padding: '12px 0' }}>
      Gallery hidden — shoppers see no photos until Show photos is on.
    </div>
  ) : gallerySlides.length > 0 && formPhoto.layout === 'grid' ? (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} role="listbox" aria-label="Customer gallery grid preview">
      {gallerySlides.map((s, i) => (
        <button
          key={`${s.type}-${s.src}-${i}`}
          type="button"
          role="option"
          aria-selected={i === stageIndexClamped}
          aria-label={`Preview asset ${i + 1} of ${gallerySlides.length}`}
          onClick={() => setStageIndex(i)}
          style={{
            padding: 0,
            borderRadius: 8,
            overflow: 'hidden',
            border: i === stageIndexClamped
              ? '2px solid var(--tuw-action-primary, #7539FF)'
              : '1px solid var(--tuw-border-subtle, #E5E7EB)',
            backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
            cursor: 'pointer',
            aspectRatio: photoAspect,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </button>
      ))}
    </div>
  ) : gallerySlides.length > 0 ? (
    <Carousel
      ariaLabel="Customer gallery preview"
      variant={formPhoto.layout === 'spotlight' ? 'dots' : 'filmstrip'}
      aspect={photoAspect}
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
        <img src={assetSrc(im.src)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
      <UpliftSurface active width={28} height={28} className="tuw-danger-hover" style={{ flexShrink: 0, color: 'var(--tuw-text-secondary, #5D6772)' }}>
        <button
          type="button"
          aria-label={`Remove ${im.name}`}
          onClick={() => removeImage(im.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex' }}
        >
          <Trash2 size={14} />
        </button>
      </UpliftSurface>
    </SurfaceCard>
  ));
  // Card twin of assetRows for wide containers (MX4): the row's design DNA
  // (1:1 thumb, name + URL, badge row, delete) in a 2-per-row grid. Drag
  // anywhere on the card; same cover / preview / delete paths.
  const assetCards = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {formImages.map((im, idx) => (
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
          style={{ alignItems: 'center', minWidth: 0 }}
        >
          <MediaFrame height={72} width={72} radius={8} style={{ flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetSrc(im.src)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </MediaFrame>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {im.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {im.src}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
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
          </div>
          <UpliftSurface active width={28} height={28} className="tuw-danger-hover" style={{ flexShrink: 0, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            <button
              type="button"
              aria-label={`Remove ${im.name}`}
              onClick={() => removeImage(im.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex' }}
            >
              <Trash2 size={14} />
            </button>
          </UpliftSurface>
        </SurfaceCard>
      ))}
    </div>
  );
  const panelHeader = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
          Uploaded Assets
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
      aria-label="Upload photos"
      className="tuw-stat-hover"
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
        Click to upload photos, or drag files here
      </div>
      <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>
        PNG, JPG, or WEBP (Max 25MB each)
      </div>
    </div>
  );
  // Gallery presentation controls (P1a): layout toggle + ratio picker +
  // visibility switch. The stage above reflects every choice live.
  const presentationSection = (
    <DrawerSection title="Presentation" titleGap={10}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ViewToggle
          ariaLabel="Gallery layout"
          variant="labeled"
          options={[
            { value: 'grid', label: 'Grid', icon: <LayoutGrid size={16} /> },
            { value: 'carousel', label: 'Carousel', icon: <Images size={16} /> },
            { value: 'spotlight', label: 'Spotlight', icon: <Focus size={16} /> },
          ]}
          value={formPhoto.layout}
          onChange={(v) => setFormPhoto((prev) => ({ ...prev, layout: v as PhotoSettings['layout'] }))}
        />
        <DropdownMenu
          ariaLabel="Gallery aspect ratio"
          trigger={
            <span
              role="button"
              tabIndex={0}
              aria-label={`Gallery ratio, currently ${formPhoto.ratio}`}
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
                Ratio {formPhoto.ratio}
              </span>
              <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
            </span>
          }
          items={[
            { value: '1:1', label: 'Square 1:1' },
            { value: '4:3', label: 'Classic 4:3' },
            { value: '16:9', label: 'Wide 16:9' },
          ]}
          selectedValue={formPhoto.ratio}
          onSelect={(v) => setFormPhoto((prev) => ({ ...prev, ratio: v as PhotoSettings['ratio'] }))}
        />
        <Switch
          label="Show photos on storefront"
          description="Hidden galleries keep their assets in the draft"
          checked={formPhoto.showPhotos}
          onChange={(v) => setFormPhoto((prev) => ({ ...prev, showPhotos: v }))}
        />
      </div>
    </DrawerSection>
  );
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <LinkButton
              href="/settings/attributes"
              variant="secondary"
              size="md"
              icon={<Library size={16} />}
            >
              <span>Attribute Library</span>
            </LinkButton>
            <LinkButton href="/products/categories" variant="secondary" size="md" icon={<Tag size={16} />}>
              Categories
            </LinkButton>
            <LinkButton href="/products/reviews" variant="secondary" size="md" icon={<CheckCircle2 size={16} />}>
              Reviews
            </LinkButton>
            <Button
              variant="secondary"
              size="md"
              icon={<Upload size={16} />}
              onClick={() => {
                if (!can('product.import')) return refused('import products');
                csvInputRef.current?.click();
              }}
            >
              <span>Import Products</span>
            </Button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              aria-label="Import products CSV"
              style={{ display: 'none' }}
              onChange={(e) => {
                handleImportFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={openCreateDrawer}
            >
              <span>Add New Product</span>
            </Button>
          </div>
        }
      />

      {/* Stats Row */}
      <div className={styles.statGrid}>
        <StatCard
          label="Total Products"
          value={String(products.length)}
          trend="In the database"
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
          subtitle="At or below each product's alert level"
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
                items={[
                  { value: 'All', label: 'All Categories' },
                  ...categoryOptions,
                ]}
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
                    background: 'var(--tuw-bg-canvas, #F7F8F9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {p.images[0] ? (
                    <Image
                      src={assetSrc(p.images[0])}
                      unoptimized
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
                  <Badge variant={p.madeToOrder || p.stock > (p.lowStockAt ?? 10) ? 'success' : p.stock > 0 ? 'warning' : 'danger'}>
                    {p.madeToOrder ? 'Made to order' : p.stock > (p.lowStockAt ?? 10) ? `${p.stock} in stock` : p.stock > 0 ? `Low: ${p.stock}` : 'Out of stock'}
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
                      {p.priceSpread && (
                        <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--tuw-text-secondary, #5D6772)', marginRight: 5 }}>From</span>
                      )}
                      ₹{p.price.toFixed(2)}
                    </span>
                    {p.compareAtPrice && p.compareAtPrice > p.price && (
                      <span className="tuw-tabular-nums" style={{ fontSize: '13px', color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'line-through', marginLeft: 6 }}>
                        ₹{p.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <Button variant="secondary" size="sm" icon={<Edit3 size={14} />} disabled={openingId === p.id} aria-busy={openingId === p.id} onClick={() => void openEditDrawer(p)}>
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
                  onClick={() => void openEditDrawer(p)}
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
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'var(--tuw-bg-canvas, #F7F8F9)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--tuw-border-subtle, #E5E7EB)' }}>
                        {p.images[0] ? (
                          <Image src={assetSrc(p.images[0])} unoptimized alt={p.name} fill sizes="80px" style={{ objectFit: 'cover' }} />
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
                    {/* "From" reads as a quiet label (VPRICE-3); the amount
                        stays the loud part of the cell. */}
                    {p.priceSpread && (
                      <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--tuw-text-secondary, #5D6772)', marginRight: 4 }}>From</span>
                    )}
                    ₹{p.price.toFixed(2)}
                    {p.compareAtPrice && p.compareAtPrice > p.price && (
                      <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'line-through', marginLeft: 6, fontWeight: 400 }}>
                        ₹{p.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: p.madeToOrder ? 'var(--tuw-text-primary, #262626)' : p.stock === 0 ? 'var(--tuw-text-error, #C91818)' : p.stock <= 10 ? 'var(--tuw-text-warning, #856300)' : 'var(--tuw-text-primary, #262626)' }}>
                      {p.madeToOrder ? 'Made to order' : `${p.stock} in stock`}
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
                    <Button variant="secondary" size="sm" icon={<Edit3 size={14} />} disabled={openingId === p.id} aria-busy={openingId === p.id} onClick={(e) => { e.stopPropagation(); void openEditDrawer(p); }}>
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
          setBasicCardOpen(false);
          setPricingCardOpen(false);
          setDiscountsCardOpen(false);
          setFulfillmentCardOpen(false);
          setAttributesCardOpen(false);
          setSpecsDisplayCardOpen(false);
          setSpecsClothingCardOpen(false);
          setSpecsSizeChartCardOpen(false);
          setSpecsMonogramCardOpen(false);
          setDrawerView('compact');
          autoExpandedRef.current = false;
          setFormImages((prev) => {
            revokeUploads(prev.filter((im) => !im.persisted).map((im) => ({ url: im.src })));
            return prev;
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
        bodyTone={productTab === 'general' || productTab === 'specs' ? 'canvas' : 'surface'}
        view={drawerView}
        onViewChange={setDrawerView}
        headerExtra={
          <Tabs
            variant="underline"
            ariaLabel="Product editor sections"
            tabs={
              isCreating
                ? [
                    { id: 'general', label: 'General' },
                    { id: 'media', label: 'Media', badge: formImages.length },
                  ]
                : [
                    { id: 'general', label: 'General' },
                    { id: 'media', label: 'Media', badge: formImages.length },
                    { id: 'variants', label: 'Variants & Stock', badge: formVariants.length },
                    { id: 'specs', label: 'Clothing Specs' },
                    { id: 'partner', label: 'Partner SKUs' },
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
                  if (window.confirm(`Delete "${editingProduct.name}" from the catalog? It disappears from the store; past orders keep their records.`)) {
                    void removeProducts([editingProduct.id]).then((ok) => {
                      if (!ok) return;
                      showToast({ type: 'info', title: 'Product Deleted', description: `"${editingProduct.name}" was removed from the catalog.` });
                      setEditingProduct(null);
                    });
                  }
                }}
              >
                Delete
              </Button>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" size="sm" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleEditSubmit} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )
          )
        }
      >
        {(editingProduct || isCreating) && (
          productTab === 'partner' && editingProduct ? (
            <PartnerSkuPanel productId={editingProduct.id} />
          ) : productTab === 'general' ? (
          <form
            onSubmit={handleEditSubmit}
            className={`tuw-pedit-general-grid${drawerView !== 'compact' ? ' is-expanded' : ''}`}
          >
            <DrawerCard
              title="1. Basic Information"
              description="Core identity, storefront copy, and catalog classification"
              collapsible
              isOpen={basicCardOpen}
              onToggle={setBasicCardOpen}
            >
              <Input
                label="Product Title"
                placeholder="e.g. Urbanist Heavyweight Tee"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                maxLength={255}
                required
              />
              <Input
                label="URL Slug"
                placeholder="e.g. urbanist-heavyweight-tee"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                maxLength={280}
                required
              />
              <FormTextarea
                label="Description"
                rows={4}
                fontSize={14}
                pad="10px 12px"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
              <div style={pairedFieldGrid}>
                <Input
                  label="Style Code"
                  placeholder="e.g. FC34"
                  value={formStyleCode}
                  onChange={(e) => setFormStyleCode(e.target.value)}
                  maxLength={50}
                  labelTooltip="Internal production reference — not shown to customers."
                />
                <SearchableSelect
                  label="Category"
                  options={categoryOptions}
                  value={formCategory}
                  onChange={(value) => setFormCategory(value)}
                  required
                />
              </div>
              {formSerialNo ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    lineHeight: '18px',
                    color: 'var(--tuw-text-secondary)',
                  }}
                >
                  Internal S.No <strong style={{ color: 'var(--tuw-text-primary)' }}>{formSerialNo}</strong>{' '}
                  — workbook reference only, never shown to customers.
                </p>
              ) : null}
              <div style={pairedFieldGrid}>
                <SearchableSelect
                  label="Gender"
                  options={GENDER_OPTIONS}
                  value={formGender || 'unspecified'}
                  onChange={(value) =>
                    setFormGender(
                      value === 'unspecified' ? '' : (value as ProductGender)
                    )
                  }
                />
                <SearchableSelect
                  label="Publication status"
                  options={PUBLICATION_OPTIONS}
                  value={formStatus}
                  onChange={(value) =>
                    setFormStatus(value as ProductItem['publicationStatus'])
                  }
                />
              </div>
            </DrawerCard>
            <DrawerCard
              title="2. Pricing & stock"
              description="Selling price, compare-at reference, stock, and checkout tax"
              collapsible
              isOpen={pricingCardOpen}
              onToggle={setPricingCardOpen}
            >
              <div style={pairedFieldGrid}>
                <Input
                  label="Base price (₹)"
                  type="text"
                  inputMode="decimal"
                  value={formPrice}
                  onChange={(e) => writeBasePrice(e.target.value)}
                  required
                />
                <Input
                  label="Compare-at price (₹)"
                  type="text"
                  inputMode="decimal"
                  placeholder="Optional"
                  value={formComparePrice}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (!/^\d*\.?\d*$/.test(raw)) return;
                    setFormComparePrice(raw);
                    if (formCompareError) setFormCompareError(null);
                  }}
                  error={formCompareError ?? undefined}
                  labelTooltip="Optional catalog reference. Shown struck through only when it is higher than the current selling price; it does not affect the price charged."
                />
              </div>
              <div style={pairedFieldGrid}>
                <Input
                  label="Stock Quantity"
                  type="number"
                  min={0}
                  value={formStock}
                  onChange={(e) => writeStockTotal(e.target.value)}
                  required
                />
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 18"
                  value={formTax}
                  onChange={(e) => setFormTax(e.target.value)}
                />
              </div>
              <Input
                label="HSN code"
                inputMode="numeric"
                placeholder="e.g. 61091000"
                value={formHsn}
                onChange={(e) => setFormHsn(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={8}
                labelTooltip="HSN/SAC classification for checkout and tax reports. 4–8 digits; never shown on the storefront."
              />
            </DrawerCard>
            <DrawerCard
              title="3. Scheduled discounts"
              description="Time-boxed price cuts with a start, end, and active switch"
              collapsible
              isOpen={discountsCardOpen}
              onToggle={setDiscountsCardOpen}
              badge={
                formDiscounts.length > 0 ? (
                  <Badge variant="neutral" size="sm">
                    {formDiscounts.length} {formDiscounts.length === 1 ? 'discount' : 'discounts'}
                  </Badge>
                ) : undefined
              }
            >
              {formDiscounts.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, lineHeight: '20px', color: 'var(--tuw-text-secondary)' }}>
                  No scheduled discounts. The product uses its normal selling price.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {formDiscounts.map((d, index) => {
                    const rowTitleId = `discount-${d.id}-title`;
                    return (
                      <div
                        key={d.id}
                        role="group"
                        aria-labelledby={rowTitleId}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                          padding: 12,
                          border: '1px solid var(--tuw-border-subtle)',
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <h5
                            id={rowTitleId}
                            style={{
                              margin: 0,
                              fontSize: 14,
                              lineHeight: '22px',
                              fontWeight: 600,
                              color: 'var(--tuw-text-primary)',
                            }}
                          >
                            Discount {index + 1}
                          </h5>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Switch
                              label="Active"
                              ariaLabel={`Discount ${index + 1} active`}
                              checked={d.isActive}
                              onChange={(v) => patchDiscount(d.id, { isActive: v })}
                            />
                            <UpliftSurface
                              active
                              width={32}
                              height={32}
                              className="tuw-danger-hover"
                              style={{ flexShrink: 0, color: 'var(--tuw-text-secondary)' }}
                            >
                              <button
                                type="button"
                                aria-label={`Remove discount ${index + 1}`}
                                onClick={() => removeDiscount(d.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '100%',
                                  height: '100%',
                                  padding: 0,
                                  border: 'none',
                                  borderRadius: 'inherit',
                                  background: 'transparent',
                                  color: 'inherit',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </UpliftSurface>
                          </div>
                        </div>
                        <div style={pairedFieldGrid}>
                          <SearchableSelect
                            label="Type"
                            ariaLabel={`Discount ${index + 1} type`}
                            options={DISCOUNT_TYPE_OPTIONS}
                            value={d.discountType}
                            onChange={(value) => {
                              const discountType = value as ProductDiscount['discountType'];
                              patchDiscount(d.id, {
                                discountType,
                                value:
                                  discountType === 'percent'
                                    ? Math.min(100, Math.max(0, d.value))
                                    : Math.max(0, d.value),
                              });
                            }}
                            searchable={false}
                          />
                          <Input
                            id={`discount-${d.id}-value`}
                            label={d.discountType === 'percent' ? 'Value (%)' : 'Value (₹)'}
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            max={d.discountType === 'percent' ? 100 : undefined}
                            value={String(d.value)}
                            onChange={(e) => {
                              const n = parseFloat(e.target.value);
                              if (Number.isNaN(n)) return;
                              patchDiscount(d.id, {
                                value:
                                  d.discountType === 'percent'
                                    ? Math.min(100, Math.max(0, n))
                                    : Math.max(0, n),
                              });
                            }}
                          />
                        </div>
                        <div style={pairedFieldGrid}>
                          <Input
                            id={`discount-${d.id}-starts`}
                            label="Starts"
                            type="date"
                            value={d.startsAt}
                            onChange={(e) => patchDiscount(d.id, { startsAt: e.target.value })}
                          />
                          <Input
                            id={`discount-${d.id}-ends`}
                            label="Ends"
                            type="date"
                            value={d.endsAt}
                            onChange={(e) => patchDiscount(d.id, { endsAt: e.target.value })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={addDiscountRef} style={{ display: 'flex' }}>
                <Button variant="secondary" size="sm" icon={<Plus size={14} />} type="button" onClick={addDiscount}>
                  Add Discount
                </Button>
              </div>
            </DrawerCard>
            <DrawerCard
              title="4. Fulfillment & shipping"
              description="Production partner and parcel measurements; print locations live under Attributes & values"
              collapsible
              isOpen={fulfillmentCardOpen}
              onToggle={setFulfillmentCardOpen}
            >
              <div style={pairedFieldGrid}>
                <SearchableSelect
                  label="Print partner"
                  options={PARTNER_OPTIONS}
                  value={formPartner}
                  onChange={(value) => setFormPartner(value as ProductItem['partner'])}
                  required
                />
                <SearchableSelect
                  label="Exchange policy"
                  options={[
                    { value: 'defects_only', label: 'Defects only', description: 'Replaced if damaged, misprinted or wrong' },
                    { value: 'exchangeable', label: 'Exchangeable', description: 'Another variant within the exchange window' },
                    { value: 'none', label: 'No exchanges', description: 'Final sale' },
                  ]}
                  value={formExchangePolicy}
                  onChange={(value) => setFormExchangePolicy(value as typeof formExchangePolicy)}
                />
              </div>
              <div style={pairedFieldGrid}>
                <SearchableSelect
                  label="Product kind"
                  options={[
                    { value: 'physical', label: 'Physical product', description: 'Printed and shipped' },
                    { value: 'gift_card', label: 'Gift card', description: 'Hidden from the catalog; sold through gift cards' },
                  ]}
                  value={formProductKind}
                  onChange={(value) => setFormProductKind(value as typeof formProductKind)}
                />
                <Input
                  label="Low stock alert at"
                  placeholder="Store default"
                  inputMode="numeric"
                  value={formLowStock}
                  onChange={(e) => setFormLowStock(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div style={pairedFieldGrid}>
                <Input
                  label="Weight (g)"
                  placeholder="e.g. 180"
                  inputMode="numeric"
                  value={formWeight}
                  onChange={(e) => setFormWeight(e.target.value)}
                />
                <Input
                  label="Shipping weight (g)"
                  placeholder="e.g. 250"
                  inputMode="numeric"
                  value={formShipWeight}
                  onChange={(e) => setFormShipWeight(e.target.value)}
                />
              </div>
              <Input
                label="Package dimensions (cm)"
                placeholder="e.g. 18 × 20 × 2.3"
                value={formDims}
                onChange={(e) => setFormDims(e.target.value)}
              />
            </DrawerCard>
            <DrawerCard
              title="5. Attributes & values"
              description="Storefront choices and internal production values"
              collapsible
              isOpen={attributesCardOpen}
              onToggle={setAttributesCardOpen}
              className="tuw-pedit-general-wide"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {libraryAttributes.filter((a) => a.enabled).length > 0 ? (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <DropdownMenu
                        ariaLabel="Link attribute from library"
                        fullWidth
                        trigger={
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label="Link an attribute from the library"
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
                              border: '1px dashed var(--tuw-border-control, #D1D5DB)',
                              backgroundColor: 'transparent',
                              color: 'var(--tuw-text-secondary, #5D6772)',
                              cursor: 'pointer',
                              userSelect: 'none',
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Link attribute from library…
                            </span>
                            <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                          </span>
                        }
                        items={libraryAttributes
                          .filter((a) => a.enabled)
                          .map((a) => ({ value: a.id, label: `${a.name} (${a.values.length})` }))}
                        onSelect={(v) => linkFromLibrary(v)}
                      />
                    </div>
                  ) : null}
                  <LinkButton
                    href="/settings/attributes"
                    variant="outline"
                    size="md"
                    style={{ flexShrink: 0, color: 'var(--tuw-action-primary)', whiteSpace: 'nowrap' }}
                  >
                    Manage library
                  </LinkButton>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Input
                      aria-label="New attribute name"
                      placeholder="New attribute name, e.g. Fabric"
                      value={newAttrName}
                      onChange={(e) => setNewAttrName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAttribute();
                        }
                      }}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<Plus size={14} />}
                    type="button"
                    aria-label="Add attribute"
                    onClick={addAttribute}
                    disabled={newAttrName.trim() === ''}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {storefrontAttributes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h5 style={attributeGroupLabelStyle}>Storefront</h5>
                  <div className="tuw-pedit-attribute-grid">
                    {storefrontAttributes.map((attr) => renderAttributeRow(attr))}
                  </div>
                </div>
              ) : null}

              {internalAttributes.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    paddingTop: storefrontAttributes.length > 0 ? 12 : 0,
                    borderTop: storefrontAttributes.length > 0 ? '1px solid var(--tuw-border-subtle)' : 'none',
                  }}
                >
                  <h5 style={attributeGroupLabelStyle}>
                    Internal only <span style={{ fontWeight: 500 }}>({internalAttributes.length})</span>
                  </h5>
                  {internalAttributes.map((attr) => renderAttributeRow(attr, true))}
                </div>
              ) : null}

              {formAttributes.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, lineHeight: '20px', color: 'var(--tuw-text-secondary)' }}>
                  No attributes yet. Link one from the library or add one above.
                </p>
              ) : null}
            </DrawerCard>
          </form>
          ) : productTab === 'media' ? (
          <div ref={mediaWrapRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mediaWide ? (
            <div style={{ display: 'grid', gridTemplateColumns: '9fr 11fr', gap: 20, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                {stageHeader}
                {stageCarousel}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {panelHeader}
                {mediaCards ? assetCards : assetRows}
                {addUrlRow}
                {dropzone}
                {presentationSection}
              </div>
            </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {stageHeader}
              {stageCarousel}
              {panelHeader}
              {mediaCards ? assetCards : assetRows}
              {addUrlRow}
              {dropzone}
              {presentationSection}
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
          </div>
          ) : productTab === 'variants' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                {formVariants.length} variants · {variantStockTotal(formVariants)} units in stock
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Storefront "From" readout (VPRICE-3): its own quiet pill
                    instead of a clause glued onto the counts sentence. */}
                {variantSpread && variantLowest !== null && (
                  <Badge
                    size="sm"
                    variant="neutral"
                    className="tuw-tabular-nums"
                    title="Lowest variant price — the storefront lists this as “From”"
                  >
                    From ₹{variantLowest.toFixed(2)}
                  </Badge>
                )}
                <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addVariant}>
                  Add Variant
                </Button>
              </div>
            </div>
            {/* Upcharges strip (VPRICE-4): moved up from General so the
                ladder's inputs sit beside the matrix they feed. */}
            <Disclosure
              title="Per-value price adjustments"
              subtitle="Value upcharges added on top of the base price."
              badge={
                Object.keys(formAdjustments).length > 0 ? (
                  <Badge variant="info">{Object.keys(formAdjustments).length}</Badge>
                ) : undefined
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {['Color', 'Size'].map((attrName) => {
                  const attr = formAttributes.find((a) => a.name === attrName);
                  if (!attr || attr.values.length === 0) return null;
                  return (
                    <div key={attrName} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--tuw-text-secondary, #5D6772)',
                        }}
                      >
                        {attrName}
                      </div>
                      {/* Two-column value grid (VPRICE-3): roughly halves the
                          expanded height without losing the name → input rhythm. */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 8 }}>
                        {attr.values.map((value) => {
                          const key = adjustmentKey(attrName, value);
                          const committed = formAdjustments[key];
                          const draft = adjustmentDrafts[key];
                          return (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ flex: 1, fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                                {value}
                              </span>
                              <div style={{ width: 110, flexShrink: 0 }}>
                                <Input
                                  aria-label={`${attrName} ${value} price adjustment`}
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0"
                                  value={draft !== undefined ? draft : committed !== undefined ? committed.toFixed(2) : ''}
                                  onChange={(e) => writeAdjustment(key, e.target.value)}
                                  onBlur={() => clearAdjustmentDraft(key)}
                                  style={{ height: 32, textAlign: 'right' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <p style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0, lineHeight: 1.5 }}>
                  Upcharges only. Clearing a field — or removing the value — drops its adjustment.
                </p>
              </div>
            </Disclosure>
            <Table>
              <TableHeader>
                <TableRow hoverable={false}>
                  <TableHead style={{ padding: '12px 16px' }}>Color</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Size</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>SKU</TableHead>
                  {/* Right padding caps the label over the numbers' right edge
                      (cell 16 + slot 56 + gap 8 + border 1 + pad 14 = 95). */}
                  <TableHead style={{ padding: '12px 95px 12px 16px', textAlign: 'right' }}>Price</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Stock</TableHead>
                  <TableHead style={{ padding: '12px 16px', width: 48 }}><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formVariants.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell style={{ padding: '10px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                      {v.id.startsWith('tmp-') ? (
                        <Input
                          aria-label="Variant color"
                          placeholder={v.color === '' ? 'Color' : undefined}
                          // eslint-disable-next-line jsx-a11y/no-autofocus
                          autoFocus={v.color === '' && v.size === ''}
                          value={v.color}
                          onChange={(e) => touchVariant(v.id, { color: e.target.value })}
                          style={{ height: 36 }}
                        />
                      ) : (
                        v.color
                      )}
                    </TableCell>
                    <TableCell style={{ padding: '10px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                      {v.id.startsWith('tmp-') ? (
                        <Input
                          aria-label="Variant size"
                          placeholder={v.size === '' ? 'Size' : undefined}
                          value={v.size}
                          onChange={(e) => touchVariant(v.id, { size: e.target.value })}
                          style={{ height: 36 }}
                        />
                      ) : (
                        v.size
                      )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Input
                            aria-label={`Price for ${v.color} ${v.size}`}
                            type="text"
                            inputMode="decimal"
                            value={priceDrafts[v.id] !== undefined ? priceDrafts[v.id] : v.price.toFixed(2)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              // Money keys only (VPRICE-4): digits + one dot,
                              // so intermediate states like "61." type cleanly.
                              if (!/^\d*\.?\d*$/.test(raw)) return;
                              setPriceDrafts((prev) => ({ ...prev, [v.id]: raw }));
                              const n = parseFloat(raw);
                              // Typing pins the cell (R1): the price survives
                              // base/attribute recomputes until reset.
                              if (!isNaN(n) && n >= 0) updateVariant(v.id, { price: roundPrice(n), priceOverridden: true });
                            }}
                            onBlur={() => clearPriceDraft(v.id)}
                            style={{ height: 36, textAlign: 'right' }}
                          />
                        </div>
                        {/* Fixed annotation slot (VPRICE-3B): derived-Σ chip or
                            pinned reset control, docked right of the input
                            (early-version feel) — always reserved so every
                            price input keeps the exact same width and the
                            numbers line up down the column. */}
                        <div
                          style={{
                            width: 56,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                          }}
                        >
                          {!v.priceOverridden &&
                            (() => {
                              const adjSum = cellAdjustment(v.color, v.size);
                              if (adjSum <= 0) return null;
                              return (
                                <span
                                  title={cellPriceBreakdown(v.color, v.size, v.price)}
                                  className="tuw-tabular-nums"
                                  style={{
                                    fontSize: 12,
                                    color: 'var(--tuw-text-secondary, #5D6772)',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  +{adjSum.toFixed(2)}
                                </span>
                              );
                            })()}
                          {v.priceOverridden && (
                            <button
                              type="button"
                              aria-label={`Reset ${v.color} ${v.size} price to derived`}
                              title={`Pinned override — reset to derived ₹${deriveVariantPrice(
                                parseFloat(formPrice) || 0,
                                formAdjustments,
                                v.color,
                                v.size,
                              ).toFixed(2)}`}
                              onClick={() =>
                                updateVariant(v.id, {
                                  price: deriveVariantPrice(parseFloat(formPrice) || 0, formAdjustments, v.color, v.size),
                                  priceOverridden: false,
                                })
                              }
                              className="tuw-primary-hover"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 24,
                                height: 24,
                                padding: 0,
                                borderRadius: 6,
                                color: 'var(--tuw-action-primary, #7539FF)',
                              }}
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell style={{ padding: '10px 16px' }}>
                      <Stepper
                        ariaLabel={`Stock for ${v.color} ${v.size}`}
                        value={v.stock}
                        editableValue
                        onChange={(n) => updateVariant(v.id, { stock: n })}
                      />
                    </TableCell>
                    <TableCell style={{ padding: '10px 16px', width: 48 }}>
                      <UpliftSurface active width={28} height={28} className="tuw-danger-hover" style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>
                        <button
                          type="button"
                          aria-label={`Remove variant ${v.color} ${v.size}`}
                          onClick={() => removeVariant(v.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </UpliftSurface>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Disclosure
              title={`Stock history (${editingProduct ? stockMovements.filter((m) => m.productId === editingProduct.id).length : 0})`}
              subtitle="Ledger of stock changes — every save that moves units appends here."
            >
              {editingProduct && stockMovements.some((m) => m.productId === editingProduct.id) ? (
                <Table>
                  <TableHeader>
                    <TableRow hoverable={false}>
                      <TableHead style={{ padding: '10px 16px' }}>Date</TableHead>
                      <TableHead style={{ padding: '10px 16px', textAlign: 'right' }}>Change</TableHead>
                      <TableHead style={{ padding: '10px 16px' }}>Reason</TableHead>
                      <TableHead style={{ padding: '10px 16px', textAlign: 'right' }}>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements
                      .filter((m) => m.productId === editingProduct.id)
                      .map((m) => (
                        <TableRow key={m.id} hoverable={false}>
                          <TableCell style={{ padding: '10px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                            {m.createdAt}
                          </TableCell>
                          <TableCell style={{ padding: '10px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: m.qtyChange >= 0 ? 'var(--tuw-text-success, #187343)' : 'var(--tuw-text-error, #C91818)' }}>
                            {m.qtyChange >= 0 ? `+${m.qtyChange}` : m.qtyChange}
                          </TableCell>
                          <TableCell style={{ padding: '10px 16px' }}>
                            <Badge variant="neutral" size="sm">{m.reason.replace(/_/g, ' ')}</Badge>
                          </TableCell>
                          <TableCell style={{ padding: '10px 16px', textAlign: 'right', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                            {m.qtyAfter}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  No movements yet — edit stock and save to grow this ledger.
                </div>
              )}
            </Disclosure>
          </div>
          ) : productTab === 'specs' ? (
          <div
            className={`tuw-pedit-specs-grid${drawerView !== 'compact' ? ' is-expanded' : ''}`}
          >
            <DrawerCard
              title="1. Display options"
              description="Choose which specification blocks appear in this editor"
              collapsible
              isOpen={specsDisplayCardOpen}
              onToggle={setSpecsDisplayCardOpen}
              bodyGap={12}
            >
              <Switch
                label="Monogram & embroidery"
                description="Show the custom embroidery block below"
                checked={visibleSections.monogram}
                onChange={(v) => setVisibleSections((s) => ({ ...s, monogram: v }))}
              />
            </DrawerCard>
            <DrawerCard
              title="2. Clothing specifications"
              description="Fabric, cut, fit, and care copy shown on the product page"
              collapsible
              isOpen={specsClothingCardOpen}
              onToggle={setSpecsClothingCardOpen}
              bodyGap={16}
            >
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
            </DrawerCard>
            <DrawerCard
              title="3. Size chart"
              description="Reusable measuring set and the linked fit guide"
              collapsible
              isOpen={specsSizeChartCardOpen}
              onToggle={setSpecsSizeChartCardOpen}
              bodyGap={16}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    Associated Size Chart Template
                  </span>
                  <Link href="/content/pages" style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)', textDecoration: 'none' }}>
                    Open Fit Guide
                  </Link>
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                    Size Chart
                  </span>
                  <DropdownMenu
                    ariaLabel="Product size chart"
                    fullWidth
                    trigger={
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Size chart, currently ${sizeCharts.find((c) => c.id === formSizeChartId)?.name ?? 'None'}`}
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
                          {sizeCharts.find((c) => c.id === formSizeChartId)?.name ?? 'No chart — legacy guide applies'}
                        </span>
                        <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                      </span>
                    }
                    items={[
                      { value: '', label: 'No chart — legacy guide applies' },
                      ...sizeCharts.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    selectedValue={formSizeChartId}
                    onSelect={(v) => setFormSizeChartId(v)}
                  />
                </div>
                <Disclosure
                  title={`Size charts (${sizeCharts.length})`}
                  subtitle="Measuring sets by garment. Columns vary — hoodies track sleeve, pants track waist."
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sizeCharts.map((chart) => {
                      const cols = chartColumns(chart);
                      return (
                        <div key={chart.id} style={flatGroupStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                              {chart.name}
                            </span>
                            <UpliftSurface active width={28} height={28} className="tuw-danger-hover" style={{ flexShrink: 0, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                              <button
                                type="button"
                                aria-label={`Remove chart ${chart.name}`}
                                onClick={() => {
                                  const usedBy = products.find((p) => p.sizeChartId === chart.id);
                                  if (usedBy) {
                                    showToast({ type: 'warning', title: 'Chart In Use', description: `"${chart.name}" is assigned to ${usedBy.name} — reassign first.` });
                                    return;
                                  }
                                  deleteSizeChart(chart.id);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </UpliftSurface>
                          </div>
                          {chart.rows.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow hoverable={false}>
                                  <TableHead style={{ padding: '10px 16px' }}>Size</TableHead>
                                  {cols.map((col) => (
                                    <TableHead key={col} style={{ padding: '10px 16px', textTransform: 'capitalize' }}>{col} (cm)</TableHead>
                                  ))}
                                  <TableHead style={{ padding: '10px 16px', width: 48 }}><span className="sr-only">Remove</span></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {chart.rows.map((row) => (
                                  <TableRow key={row.size} hoverable={false}>
                                    <TableCell style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                                      {row.size}
                                    </TableCell>
                                    {cols.map((col) => (
                                      <TableCell key={col} style={{ padding: '10px 16px' }}>
                                        <Input
                                          aria-label={`${row.size} ${col} in cm`}
                                          type="text"
                                          inputMode="decimal"
                                          value={row.measures[col] ?? ''}
                                          onChange={(e) => patchSizeChartCell(chart.id, row.size, col, e.target.value)}
                                          style={{ height: 36 }}
                                        />
                                      </TableCell>
                                    ))}
                                    <TableCell style={{ padding: '10px 16px', width: 48 }}>
                                      <UpliftSurface active width={28} height={28} className="tuw-danger-hover" style={{ flexShrink: 0, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                                        <button
                                          type="button"
                                          aria-label={`Remove size ${row.size} from ${chart.name}`}
                                          onClick={() => removeSizeChartRow(chart.id, row.size)}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex' }}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </UpliftSurface>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                              No sizes yet — add the first one below.
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <Input
                                aria-label={`Add size to ${chart.name}`}
                                placeholder="Size, e.g. XXS"
                                value={chartRowDrafts[chart.id] ?? ''}
                                onChange={(e) => setChartRowDrafts((prev) => ({ ...prev, [chart.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (addSizeChartRow(chart.id, chartRowDrafts[chart.id] ?? '')) {
                                      setChartRowDrafts((prev) => ({ ...prev, [chart.id]: '' }));
                                    }
                                  }
                                }}
                              />
                            </div>
                            <Button
                              variant="secondary"
                              size="md"
                              type="button"
                              onClick={() => {
                                if (addSizeChartRow(chart.id, chartRowDrafts[chart.id] ?? '')) {
                                  setChartRowDrafts((prev) => ({ ...prev, [chart.id]: '' }));
                                }
                              }}
                              disabled={(chartRowDrafts[chart.id] ?? '').trim() === ''}
                            >
                              Add
                            </Button>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <Input
                                aria-label={`Add measurement column to ${chart.name}`}
                                placeholder="Measurement, e.g. Chest"
                                value={chartColDrafts[chart.id] ?? ''}
                                onChange={(e) => setChartColDrafts((prev) => ({ ...prev, [chart.id]: e.target.value }))}
                              />
                            </div>
                            <Button
                              variant="secondary"
                              size="md"
                              type="button"
                              onClick={() => {
                                if (addSizeChartColumn(chart.id, chartColDrafts[chart.id] ?? '')) {
                                  setChartColDrafts((prev) => ({ ...prev, [chart.id]: '' }));
                                }
                              }}
                              disabled={(chartColDrafts[chart.id] ?? '').trim() === ''}
                            >
                              Add column
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          aria-label="New chart name"
                          placeholder="New chart, e.g. Kids Tops"
                          value={newChartName}
                          onChange={(e) => setNewChartName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (createSizeChart(newChartName)) setNewChartName('');
                            }
                          }}
                        />
                      </div>
                      <Button
                        variant="secondary"
                        size="md"
                        icon={<Plus size={14} />}
                        type="button"
                        onClick={() => {
                          if (createSizeChart(newChartName)) setNewChartName('');
                        }}
                        disabled={newChartName.trim() === ''}
                      >
                        Add Chart
                      </Button>
                    </div>
                  </div>
                </Disclosure>
            </DrawerCard>
            {visibleSections.monogram ? (
            <DrawerCard
              title="4. Monogram & custom embroidery"
              description="On-demand chest initials and their upcharge"
              collapsible
              isOpen={specsMonogramCardOpen}
              onToggle={setSpecsMonogramCardOpen}
              bodyGap={16}
            >
                <Switch
                  label="Offer monogramming"
                  description="On-demand chest initials with upcharge"
                  checked={formMonogramEnabled}
                  onChange={setFormMonogramEnabled}
                />
                {formMonogramEnabled ? (
                <div style={pairedFieldGrid}>
                  <Input
                    label="Max Characters"
                    type="number"
                    value={formMonogramChars}
                    onChange={(e) => setFormMonogramChars(e.target.value)}
                  />
                  <Input
                    label="Upcharge (₹)"
                    type="number"
                    step="0.01"
                    value={formMonogramUpcharge}
                    onChange={(e) => setFormMonogramUpcharge(e.target.value)}
                  />
                </div>
                ) : null}
            </DrawerCard>
            ) : null}
          </div>
          ) : null
        )}
      </Drawer>

      {/* CSV import preview (X1b): counts + row errors → stage drafts. */}
      <Modal
        isOpen={importPreview !== null}
        onClose={() => setImportPreview(null)}
        title={`Import Preview — ${importPreview?.fileName ?? ''}`}
        subtitle={
          importPreview
            ? `${importPreview.groups.length} product${
                importPreview.groups.length === 1 ? '' : 's'
              } · ${importVariantTotal} variant${
                importVariantTotal === 1 ? '' : 's'
              } · ${importPreview.errors.length} issue${
                importPreview.errors.length === 1 ? '' : 's'
              }. Valid groups stage as drafts.`
            : ''
        }
        footer={
          <>
            <Button variant="secondary" size="md" type="button" onClick={() => setImportPreview(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="button"
              disabled={!importPreview || importPreview.groups.length === 0 || importing}
              onClick={applyImport}
            >
              {importing ? 'Importing… ' : 'Stage '}{importPreview?.groups.length ?? 0} Product
              {(importPreview?.groups.length ?? 0) === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {importPreview && importPreview.groups.length > 0 ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 6 }}>
                Ready to stage ({importPreview.groups.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                {importPreview.groups.slice(0, 20).map((group, i) => {
                  const fromPrice =
                    group.variants.length > 0
                      ? Math.min(...group.variants.map((variant) => variant.costPaise)) / 100
                      : 0;
                  return (
                    <div key={i} style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      {group.name} · {group.variants.length} variant
                      {group.variants.length === 1 ? '' : 's'} · partner cost from ₹{fromPrice.toLocaleString()}
                      {group.styleCode ? ` · ${group.styleCode}` : ''}
                      {group.gender ? ` · ${group.gender}` : ''}
                    </div>
                  );
                })}
                {importPreview.groups.length > 20 ? (
                  <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    …and {importPreview.groups.length - 20} more
                  </div>
                ) : null}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                Base Price is treated as the partner’s cost. Drafts get a draft retail price (cost × 2.5, rounded up to ₹_99, minimum ₹299) that you can change before publishing.
              </div>
              {!importPreview.hasCategoryColumn ? (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  No Category column found — these drafts stage as {UNCATEGORIZED_CATEGORY}. Assign
                  categories from the catalog before publishing.
                </div>
              ) : null}
            </div>
          ) : null}
          {importPreview && importPreview.errors.length > 0 ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-error, #C91818)', marginBottom: 6 }}>
                Issues ({importPreview.errors.length}) — rows are rejected; group conflicts keep the
                first value
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                {importPreview.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    Row {e.row}: {e.message}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {importPreview && importPreview.groups.length === 0 && importPreview.errors.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
              No rows found.
            </div>
          ) : null}
        </div>
      </Modal>
    </DashboardShell>
  );
}
