'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Filter, Search, Edit3, Trash2, CheckCircle2, Eye, AlertTriangle, LayoutGrid, List, Tag, ChevronDown, Download, Archive, GripVertical, Upload, Images, Focus, Library, RotateCcw } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { StatCard, ContentCard, SurfaceCard, UpliftSurface, Button, Badge, Input, Drawer, Modal, Pagination, FilterPills, PageHeader, ViewToggle, DropdownMenu, Checkbox, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, MediaFrame, FormTextarea, Tabs, Stepper, Switch, DrawerSection, Disclosure, Carousel, LinkButton } from '@/components/ui';
import { useAdminState } from '@/mocks/state';
import { ProductItem } from '@/mocks/fixtures';
import { resolveVariants, variantStockTotal, buildVariantSku, deriveVariantPrice, recomputeVariants, minFromPrice, pruneAdjustments, roundPrice, hasPriceSpread } from '@/mocks/variants';
import type { ProductVariant, ProductAttribute, PhotoSettings, ProductDiscount, SizeChart } from '@/mocks/fixtures';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

// Per-product attribute draft (A1/AX2). Shape lives on ProductAttribute
// (fixtures) so the seam persists it verbatim; see the REST note there.
// swatch dots stay neutral until a value→hex map lands (recorded follow-up).

export default function ProductsView() {
  const { products, createProduct, updateProduct, deleteProduct, canPerformAction, showToast, stockMovements, sizeCharts, createSizeChart, deleteSizeChart, addSizeChartRow, removeSizeChartRow, patchSizeChartCell, libraryAttributes, createLibraryAttribute, addLibraryValue } = useAdminState();

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
  // Catalog scalars (Y1): single-valued fields, Input/picker-edited.
  const [formStyleCode, setFormStyleCode] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formShipWeight, setFormShipWeight] = useState('');
  const [formDims, setFormDims] = useState('');
  const [formGender, setFormGender] = useState<ProductItem['gender'] | ''>('');
  const [formTax, setFormTax] = useState('');
  // Scheduled discounts draft (P1d): rows with type/value/window/switch.
  const [formDiscounts, setFormDiscounts] = useState<ProductDiscount[]>([]);
  // Per-product attributes (A1): the single source behind colors/sizes.
  // REST: GET/PUT /products/:id/attributes → [{ name, values[], builtin }].
  // Color + Size + Placements ship builtin (locked); customs append here.
  // The matrix still cross-products Color×Size until A2 generalizes it.
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
  const chartColumns = (chart: SizeChart) => [...new Set(chart.rows.flatMap((r) => Object.keys(r.measures)))];
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
    setDrawerView('compact');
    preTableView.current = null;
    setStageIndex(0);
    setFormName('');
    setFormSlug('');
    setFormCategory('T-Shirts');
    setFormPrice('48.00');
    setFormComparePrice('58.00');
    setFormStock('25');
    setFormStyleCode('');
    setFormWeight('');
    setFormShipWeight('');
    setFormDims('');
    setFormGender('');
    setFormTax('');
    setFormDiscounts([]);
    setFormSizeChartId('');
    setFormAttributes([
      { name: 'Color', values: ['Black', 'Chalk White', 'Olive'], builtin: true, displayType: 'swatch', swatchHex: {}, visibleOn: ['pdp', 'admin'], libraryId: 'LIB-01' },
      { name: 'Size', values: ['S', 'M', 'L', 'XL'], builtin: true, displayType: 'pill', swatchHex: {}, visibleOn: ['pdp', 'admin'], libraryId: 'LIB-02' },
      { name: 'Placements', values: [], builtin: true, displayType: 'radio', swatchHex: {}, visibleOn: ['admin'], libraryId: 'LIB-03' },
    ]);
    setFormPartner('Qikink Direct API');
    setFormPlacement('Chest (45mm)');
    setFormStatus('published');
    setFormDescription('Pre-shrunk premium heavyweight combed cotton with reinforced seams.');
    setFormVideo('');
    setFormPhoto({ layout: 'carousel', ratio: '4:3', showPhotos: true });
    setFormImages([]);
    setUploadReel((prev) => {
      if (prev) revokeUploads([{ url: prev.url }]);
      return null;
    });
    setAddImageUrl('');
    setFormVariants([]);
    setFormAdjustments({});
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
  // Gallery presentation draft (P1a): PDP stage layout + ratio + visibility.
  const [formPhoto, setFormPhoto] = useState<PhotoSettings>({ layout: 'carousel', ratio: '4:3', showPhotos: true });
  const photoAspect = formPhoto.ratio === '1:1' ? '1 / 1' : formPhoto.ratio === '16:9' ? '16 / 9' : '4 / 3';
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

  // Elastic view ownership (W1): products drives the Drawer size per tab.
  // Entering Variants from compact stashes the choice and forces matrix
  // (never full); leaving restores the stash. Manual picks always win —
  // forcing fires on tab-enter only, never fights the hand on the control.
  const [drawerView, setDrawerView] = useState<'compact' | 'matrix' | 'full'>('compact');
  const preTableView = useRef<'compact' | 'matrix' | 'full' | null>(null);
  const prevTab = useRef<'general' | 'media' | 'variants' | 'specs' | 'seo'>('general');
  React.useEffect(() => {
    const entered = prevTab.current !== 'variants' && productTab === 'variants';
    const left = prevTab.current === 'variants' && productTab !== 'variants';
    prevTab.current = productTab;
    if (entered && drawerView === 'compact') {
      preTableView.current = 'compact';
      setDrawerView('matrix');
    } else if (left && preTableView.current !== null) {
      setDrawerView(preTableView.current);
      preTableView.current = null;
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
  // Per-value price adjustments draft (R1): "Attribute:Value" → additive
  // upcharge (e.g. "Size:XL": 6). Sidecar only — cancelling the drawer
  // discards it; submit prunes stale keys and persists what remains.
  const [formAdjustments, setFormAdjustments] = useState<Record<string, number>>({});

  // Base price write (R1): re-derives every unpinned cell from
  // base + Σ adjustments; explicit overrides stay pinned. This replaces
  // the old write-all that trampled per-cell overrides on every keystroke.
  const writeBasePrice = (priceStr: string) => {
    setFormPrice(priceStr);
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
    setFormAttributes((prev) => [...prev, { name, values: [], builtin: false, displayType: 'pill', swatchHex: {}, visibleOn: ['pdp', 'admin'], libraryId: linkedId }]);
    setNewAttrName('');
    if (!lib) {
      showToast({ type: 'info', title: 'Registered in Library', description: `"${name}" now lives in the attribute library too.` });
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
        visibleOn: ['pdp', 'admin'] as Array<'pdp' | 'checkout' | 'admin'>,
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
  };
  const displayTypeLabel = (t: ProductAttribute['displayType']) =>
    t === 'pill' ? 'Pill' : t === 'swatch' ? 'Color swatch' : 'Radio select';
  const setDisplayType = (name: string, displayType: ProductAttribute['displayType']) => {
    setFormAttributes((prev) => prev.map((a) => (a.name === name ? { ...a, displayType } : a)));
  };
  const setSwatchHex = (name: string, value: string, hex: string) => {
    setFormAttributes((prev) =>
      prev.map((a) => (a.name === name ? { ...a, swatchHex: { ...a.swatchHex, [value]: hex } } : a))
    );
  };
  // Visibility toggles (X1a): at least one surface always — unchecking the
  // last one is refused with a naming toast, input preserved.
  const toggleVisibility = (name: string, surface: 'pdp' | 'checkout' | 'admin') => {
    const attr = formAttributes.find((a) => a.name === name);
    if (!attr) return;
    const has = (attr.visibleOn ?? []).includes(surface);
    if (has && (attr.visibleOn ?? []).length === 1) {
      showToast({
        type: 'warning',
        title: 'Visibility Required',
        description: `"${name}" must show on at least one surface.`,
      });
      return;
    }
    setFormAttributes((prev) =>
      prev.map((a) =>
        a.name === name
          ? {
              ...a,
              visibleOn: has
                ? (a.visibleOn ?? []).filter((s) => s !== surface)
                : [...(a.visibleOn ?? []), surface],
            }
          : a
      )
    );
  };

  // Shared attribute card (Y1b): PDP section and the Internal Placements
  // block render the same card. hideDisplay drops the storefront picker
  // where it has no meaning (admin-only attributes).
  const renderAttrCard = (attr: ProductAttribute, hideDisplay = false) => (
    <SurfaceCard key={attr.name} padding="12px" gap="10px">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
          {attr.name}
          {attr.libraryId ? (
            <Badge variant="success" size="sm" title="Linked to the single library record">Linked</Badge>
          ) : null}
        </span>
        {attr.builtin ? (
          <Badge variant="info" size="sm">Default</Badge>
        ) : (
          <UpliftSurface active width={28} height={28} className="tuw-danger-hover" style={{ flexShrink: 0, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            <button
              type="button"
              aria-label={`Remove attribute ${attr.name}`}
              onClick={() => removeAttribute(attr.name)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex' }}
            >
              <Trash2 size={14} />
            </button>
          </UpliftSurface>
        )}
      </div>
      {hideDisplay ? null : (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
          Shows on storefront as
        </span>
        <DropdownMenu
          ariaLabel={`${attr.name} storefront display`}
          trigger={
            <span
              role="button"
              tabIndex={0}
              aria-label={`${attr.name} display, currently ${displayTypeLabel(attr.displayType)}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                height: 32,
                padding: '0 10px',
                fontSize: 12,
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
                {displayTypeLabel(attr.displayType)}
              </span>
              <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
            </span>
          }
          items={[
            { value: 'pill', label: 'Pill' },
            { value: 'swatch', label: 'Color swatch' },
            { value: 'radio', label: 'Radio select' },
          ]}
          selectedValue={attr.displayType}
          onSelect={(v) => setDisplayType(attr.name, v as ProductAttribute['displayType'])}
        />
      </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
          Shows on
        </span>
        {(['pdp', 'checkout', 'admin'] as const).map((surface) => (
          <Checkbox
            key={surface}
            label={surface === 'pdp' ? 'PDP' : surface === 'checkout' ? 'Checkout' : 'Admin-only'}
            checked={(attr.visibleOn ?? []).includes(surface)}
            onChange={() => toggleVisibility(attr.name, surface)}
          />
        ))}
      </div>
      {attr.values.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead style={{ padding: '10px 16px' }}>Value</TableHead>
              <TableHead style={{ padding: '10px 16px' }}>Storefront preview</TableHead>
              <TableHead style={{ padding: '10px 16px', width: 48 }}><span className="sr-only">Remove</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attr.values.map((val) => (
              <TableRow key={val} hoverable={false}>
                <TableCell style={{ padding: '10px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                  {val}
                </TableCell>
                <TableCell style={{ padding: '10px 16px' }}>
                  {attr.displayType === 'pill' ? (
                    <Badge variant="neutral" size="sm">{val}</Badge>
                  ) : attr.displayType === 'swatch' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                      <input
                        type="color"
                        aria-label={`Swatch color for ${val}`}
                        title={`Pick the PDP swatch color for ${val}`}
                        value={attr.swatchHex[val] ?? '#D1D5DB'}
                        onChange={(e) => setSwatchHex(attr.name, val, e.target.value)}
                        style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 8, background: 'none', cursor: 'pointer', flexShrink: 0 }}
                      />
                      {val}
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                        {attr.swatchHex[val] ?? '#D1D5DB'}
                      </span>
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                      <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--tuw-border-control, #D1D5DB)', flexShrink: 0, boxSizing: 'border-box' }} />
                      {val}
                    </span>
                  )}
                </TableCell>
                <TableCell style={{ padding: '10px 16px', width: 48 }}>
                  <UpliftSurface active width={28} height={28} className="tuw-danger-hover" style={{ flexShrink: 0, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    <button
                      type="button"
                      aria-label={`Remove ${val} from ${attr.name}`}
                      onClick={() => removeAttrValue(attr.name, val)}
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
          No values yet — add the first one below.
        </div>
      )}
      {/* Picker-first entry (VALPICK): known values for this attribute
          (library row ∪ card, deduped) one click away; the text input
          below stays for genuinely new values. Hidden when nothing new. */}
      {(() => {
        const lib = libraryAttributes.find((l) => l.id === attr.libraryId);
        const known = [...new Set([...(lib?.values ?? []), ...attr.values])];
        const missing = known.filter(
          (v) => !attr.values.some((x) => x.toLowerCase() === v.toLowerCase())
        );
        if (missing.length === 0) return null;
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <DropdownMenu
                ariaLabel={`Pick known ${attr.name} value`}
                trigger={
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Pick a known ${attr.name} value, ${missing.length} available`}
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
                      Pick known value… ({missing.length})
                    </span>
                    <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                  </span>
                }
                items={missing.map((v) => ({ value: v, label: v }))}
                onSelect={(v) => commitAttrValue(attr.name, v)}
              />
            </div>
          </div>
        );
      })()}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Input
            aria-label={`Add ${attr.name} value`}
            placeholder={`Add ${attr.name.toLowerCase()} value, then Add`}
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
        <Button variant="secondary" size="md" type="button" onClick={() => addAttrValue(attr.name)} disabled={(attrDrafts[attr.name] ?? '').trim() === ''}>
          Add
        </Button>
      </div>
    </SurfaceCard>
  );

  const openEditDrawer = (product: ProductItem) => {
    if (!canPerformAction('products')) return;
    setIsCreating(false);
    setEditingProduct(product);
    setProductTab('general');
    setDrawerView('compact');
    preTableView.current = null;
    setStageIndex(0);
    setFormVideo(product.video || '');
    setFormPhoto(product.photoSettings ?? { layout: 'carousel', ratio: '4:3', showPhotos: true });
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

    // Attribute draft (N1a link match) — built once: the ladder load below
    // prunes adjustment keys against these values, and the drawer renders
    // the same copy.
    const loadedAttributes =
      product.attributes && product.attributes.length > 0
        ? product.attributes.map((a) => {
            // N1a link: match persisted attrs to the library by name once,
            // so every card carries its single-record id from here on.
            const lib = libraryAttributes.find(
              (l) => l.name.toLowerCase() === a.name.toLowerCase()
            );
            return {
              ...a,
              libraryId: a.libraryId ?? lib?.id,
              values: [...a.values],
              swatchHex: { ...(a.swatchHex ?? {}) },
              visibleOn:
                a.visibleOn && a.visibleOn.length > 0
                  ? [...a.visibleOn]
                  : a.name === 'Placements'
                    ? ['admin' as const]
                    : (['pdp', 'admin'] as Array<'pdp' | 'checkout' | 'admin'>),
            };
          })
        : [
            { name: 'Color', values: [...product.colors], builtin: true, displayType: 'swatch' as const, swatchHex: {}, visibleOn: ['pdp', 'admin'] as Array<'pdp' | 'checkout' | 'admin'>, libraryId: 'LIB-01' },
            { name: 'Size', values: [...product.sizes], builtin: true, displayType: 'pill' as const, swatchHex: {}, visibleOn: ['pdp', 'admin'] as Array<'pdp' | 'checkout' | 'admin'>, libraryId: 'LIB-02' },
            { name: 'Placements', values: [], builtin: true, displayType: 'radio' as const, swatchHex: {}, visibleOn: ['admin'] as Array<'pdp' | 'checkout' | 'admin'>, libraryId: 'LIB-03' },
          ];

    // Pricing ladder load (R1): sanitize the sidecar against these values;
    // legacy cells whose price differs from the derived value become pinned
    // overrides (their look is preserved — reset unpins them spotwise).
    const basePrice = product.basePrice ?? product.price;
    const loadedAdjustments = pruneAdjustments(product.priceAdjustments, loadedAttributes).next;
    setFormAdjustments(loadedAdjustments);
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
    setFormWeight(product.weight || '');
    setFormShipWeight(product.shippingWeight || '');
    setFormDims(product.dimensions || '');
    setFormGender(product.gender || '');
    setFormTax(product.taxRate !== undefined ? String(product.taxRate) : '');
    setFormDiscounts((product.discounts ?? []).map((d) => ({ ...d })));
    setFormSizeChartId(product.sizeChartId ?? '');
    setFormAttributes(loadedAttributes);
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
        colors: colorValues,
        sizes: sizeValues,
        styleCode: formStyleCode.trim() || undefined,
        weight: formWeight.trim() || undefined,
        shippingWeight: formShipWeight.trim() || undefined,
        dimensions: formDims.trim() || undefined,
        gender: formGender || undefined,
        taxRate: formTax.trim() !== '' && !isNaN(parseFloat(formTax)) ? parseFloat(formTax) : undefined,
      sizeChartId: formSizeChartId || undefined,
        partner: formPartner,
        placement: formPlacement,
        publicationStatus: formStatus,
        description: formDescription,
        image: formImages[0]?.src || undefined,
        video: formVideo || undefined,
        photoSettings: formPhoto,
        discounts: formDiscounts,
        images: formImages.filter((im) => im.persisted).map((im) => im.src),
        attributes: formAttributes,
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

    const parsedBase = parseFloat(formPrice);
    const baseNum = roundPrice(
      !isNaN(parsedBase) && parsedBase >= 0 ? parsedBase : editingProduct.basePrice ?? editingProduct.price
    );
    const compareNum = parseFloat(formComparePrice) || undefined;

    // The draft matrix is the submit source: colors/sizes/stock derive from
    // it in the seam; prices re-derive through the ladder (R1:
    // base + Σ adjustments, pinned cells stay), and the listed price is the
    // lowest cell ("From $X"), materialized.
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
    const cleanAdjustments = pruneAdjustments(formAdjustments, formAttributes).next;

    updateProduct(editingProduct.id, {
      name: formName,
      slug: formSlug,
      category: formCategory,
      price: minPrice,
      basePrice: baseNum,
      priceAdjustments: Object.keys(cleanAdjustments).length > 0 ? cleanAdjustments : undefined,
      compareAtPrice: compareNum,
      partner: formPartner,
      placement: formPlacement,
      publicationStatus: formStatus,
      description: formDescription,
      styleCode: formStyleCode.trim() || undefined,
      weight: formWeight.trim() || undefined,
      shippingWeight: formShipWeight.trim() || undefined,
      dimensions: formDims.trim() || undefined,
      gender: formGender || undefined,
      taxRate: formTax.trim() !== '' && !isNaN(parseFloat(formTax)) ? parseFloat(formTax) : undefined,
      sizeChartId: formSizeChartId || undefined,
      image: formImages[0]?.src || undefined,
      video: formVideo || undefined,
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

  // CSV import pipeline (X1b): Final Listing workbooks re-saved as CSV.
  // Quoted-field-aware parse (no dependency); unknown columns ignored;
  // valid rows stage as drafts, failures preserve file + error list.
  interface ImportRow {
    name: string;
    styleCode: string;
    colors: string[];
    sizes: string[];
    placements: string[];
    price: number;
    weight: string;
    shipWeight: string;
    dims: string;
    tax: string;
    gender: string;
  }
  const [importPreview, setImportPreview] = useState<{
    fileName: string;
    valid: ImportRow[];
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

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

  const splitList = (s: string) =>
    s.split(',').map((x) => x.trim()).filter(Boolean);

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
      const headers = grid[0].map((h) => h.trim().toLowerCase());
      const col = (names: string[]) => {
        for (const n of names) {
          const i = headers.indexOf(n);
          if (i >= 0) return i;
        }
        return -1;
      };
      const cStyle = col(['style']);
      const cSizes = col(['sizes', 'size']);
      const cColors = col(['colors', 'color']);
      const cWeight = col(['weight']);
      const cShip = col(['shipping weight', 'ship weight']);
      const cPrice = col(['base price', 'price']);
      const cPlace = col(['placements', 'placement']);
      const cDims = col(['package dimensions', 'dimensions']);
      const cTax = col(['tax rate', 'tax']);
      const cGender = col(['gender']);
      const valid: ImportRow[] = [];
      const errors: Array<{ row: number; message: string }> = [];
      const seenCodes = new Set<string>();
      grid.slice(1).forEach((cells, i) => {
        const rowNo = i + 2;
        const get = (c: number) => (c >= 0 ? (cells[c] ?? '').trim() : '');
        const styleRaw = get(cStyle);
        const name = styleRaw.split('|')[0]?.trim() ?? '';
        const styleCode = styleRaw.split('|')[1]?.trim() ?? '';
        const priceRaw = get(cPrice);
        if (!name) {
          errors.push({ row: rowNo, message: 'Style is required.' });
          return;
        }
        const price = parseFloat(priceRaw);
        if (priceRaw === '' || isNaN(price) || price < 0) {
          errors.push({ row: rowNo, message: `"${name}": Base Price must be zero or more.` });
          return;
        }
        if (styleCode !== '') {
          if (seenCodes.has(styleCode.toLowerCase())) {
            errors.push({ row: rowNo, message: `"${name}": duplicate style code "${styleCode}" in this file.` });
            return;
          }
          seenCodes.add(styleCode.toLowerCase());
        }
        const taxRaw = get(cTax);
        if (taxRaw !== '' && (isNaN(parseFloat(taxRaw)) || parseFloat(taxRaw) < 0)) {
          errors.push({ row: rowNo, message: `"${name}": Tax Rate must be zero or more.` });
          return;
        }
        const genderRaw = get(cGender);
        if (genderRaw !== '' && !['Female', 'Male', 'Unisex', 'Kids'].includes(genderRaw)) {
          errors.push({ row: rowNo, message: `"${name}": Gender must be Female, Male, Unisex, or Kids.` });
          return;
        }
        valid.push({
          name,
          styleCode,
          colors: splitList(get(cColors)),
          sizes: splitList(get(cSizes)),
          placements: splitList(get(cPlace)),
          price,
          weight: get(cWeight),
          shipWeight: get(cShip),
          dims: get(cDims),
          tax: taxRaw,
          gender: genderRaw,
        });
      });
      setImportPreview({ fileName: file.name, valid, errors });
    };
    reader.readAsText(file);
  };

  const applyImport = () => {
    if (!importPreview || importPreview.valid.length === 0) return;
    const stamp = Date.now().toString(36);
    let staged = 0;
    importPreview.valid.forEach((r, i) => {
      const ok = createProduct(
        {
          name: r.name,
          slug: `${r.name.toLowerCase().replace(/\s+/g, '-')}-imp-${stamp}-${i}`,
          category: 'T-Shirts',
          price: r.price,
          compareAtPrice: undefined,
          stock: 0,
          colors: r.colors.length > 0 ? r.colors : ['Default'],
          sizes: r.sizes.length > 0 ? r.sizes : ['Standard'],
          partner: 'Qikink Direct API',
          placement: 'Chest (45mm)',
          publicationStatus: 'draft',
          description: '',
          imageBg: 'linear-gradient(135deg, #FAF3F7 0%, #EFE1EB 100%)',
          styleCode: r.styleCode || undefined,
          weight: r.weight || undefined,
          shippingWeight: r.shipWeight || undefined,
          dimensions: r.dims || undefined,
          gender: (r.gender || undefined) as ProductItem['gender'] | undefined,
          taxRate: r.tax !== '' ? parseFloat(r.tax) : undefined,
          attributes: [
            { name: 'Color', values: r.colors, builtin: true, displayType: 'swatch', swatchHex: {}, visibleOn: ['pdp', 'admin'] },
            { name: 'Size', values: r.sizes, builtin: true, displayType: 'pill', swatchHex: {}, visibleOn: ['pdp', 'admin'] },
            { name: 'Placements', values: r.placements, builtin: true, displayType: 'radio', swatchHex: {}, visibleOn: ['admin'] },
          ],
        },
        true
      );
      if (ok) staged++;
    });
    setImportPreview(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
    showToast({
      type: 'success',
      title: 'Import Staged',
      description: `${staged} draft${staged === 1 ? '' : 's'} added — review and publish each from the catalog. Demo catalog persists locally.`,
    });
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
          {s.type === 'video' ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 10, fontWeight: 700, color: '#FFFFFF', backgroundColor: '#1A1A1A' }}>
              REEL
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
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
            <img src={im.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            <Button
              variant="secondary"
              size="md"
              icon={<Upload size={16} />}
              onClick={() => {
                if (!canPerformAction('products')) return;
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
                      {hasPriceSpread(resolveVariants(p)) ? `From ₹${p.price.toFixed(2)}` : `₹${p.price.toFixed(2)}`}
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
                    {hasPriceSpread(resolveVariants(p)) ? `From ₹${p.price.toFixed(2)}` : `₹${p.price.toFixed(2)}`}
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
          setDrawerView('compact');
          preTableView.current = null;
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
            <Input
              label="Style Code"
              placeholder="e.g. FC34"
              value={formStyleCode}
              onChange={(e) => setFormStyleCode(e.target.value)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Base price ($ USD)"
                type="number"
                step="0.01"
                value={formPrice}
                onChange={(e) => writeBasePrice(e.target.value)}
                required
                helperText="Variant cells derive from base + per-value adjustments; the lowest cell is the listed “From” price. Pinned cells keep their override."
              />
              <Input
                label="Stock Quantity"
                type="number"
                value={formStock}
                onChange={(e) => writeStockTotal(e.target.value)}
                required
              />
            </div>
            <DrawerSection title="Pricing & Discounts" titleGap={10}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
                  Scheduled price cuts with a window and kill switch. The compare price above is static marketing text.
                </p>
                {formDiscounts.map((d) => (
                  <SurfaceCard key={d.id} padding="10px" gap="8px">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 130, flexShrink: 0 }}>
                        <DropdownMenu
                          ariaLabel="Discount type"
                          trigger={
                            <span
                              role="button"
                              tabIndex={0}
                              aria-label={`Discount type, currently ${d.discountType}`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8,
                                width: '100%',
                                height: 36,
                                padding: '0 10px',
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
                              <span>{d.discountType === 'percent' ? 'Percent %' : 'Fixed ₹'}</span>
                              <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                            </span>
                          }
                          items={[
                            { value: 'percent', label: 'Percent %' },
                            { value: 'fixed', label: 'Fixed ₹' },
                          ]}
                          selectedValue={d.discountType}
                          onSelect={(v) => patchDiscount(d.id, { discountType: v as ProductDiscount['discountType'] })}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Input
                          aria-label="Discount value"
                          type="number"
                          step="0.01"
                          min="0"
                          max={d.discountType === 'percent' ? '100' : undefined}
                          value={String(d.value)}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            if (isNaN(n)) return;
                            patchDiscount(d.id, {
                              value: d.discountType === 'percent' ? Math.min(100, Math.max(0, n)) : Math.max(0, n),
                            });
                          }}
                          style={{ height: 36 }}
                        />
                      </div>
                      <Switch
                        label=""
                        checked={d.isActive}
                        onChange={(v) => patchDiscount(d.id, { isActive: v })}
                      />
                      <UpliftSurface active width={28} height={28} className="tuw-danger-hover" style={{ flexShrink: 0, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                        <button
                          type="button"
                          aria-label="Remove discount"
                          onClick={() => removeDiscount(d.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </UpliftSurface>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <Input
                        aria-label="Discount starts"
                        type="date"
                        value={d.startsAt}
                        onChange={(e) => patchDiscount(d.id, { startsAt: e.target.value })}
                        style={{ height: 36 }}
                      />
                      <Input
                        aria-label="Discount ends"
                        type="date"
                        value={d.endsAt}
                        onChange={(e) => patchDiscount(d.id, { endsAt: e.target.value })}
                        style={{ height: 36 }}
                      />
                    </div>
                  </SurfaceCard>
                ))}
                <div>
                  <Button variant="secondary" size="sm" icon={<Plus size={14} />} type="button" onClick={addDiscount}>
                    Add Discount
                  </Button>
                </div>
              </div>
            </DrawerSection>
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
            <DrawerSection title="Attributes & Values" titleGap={10}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
                  Color and Size ship with every product. Add custom attributes (Fabric, Fit…) and define their values one by one.
                  {' '}<Link href="/settings/attributes" style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)', textDecoration: 'none' }}>Manage library</Link>
                </p>
                {libraryAttributes.filter((a) => a.enabled).length > 0 ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <DropdownMenu
                        ariaLabel="Link attribute from library"
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
                  </div>
                ) : null}
                {formAttributes.filter((a) => a.name !== 'Placements').map((attr) => renderAttrCard(attr))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
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
                  <Button variant="secondary" size="md" icon={<Plus size={14} />} type="button" onClick={addAttribute} disabled={newAttrName.trim() === ''}>
                    Add Attribute
                  </Button>
                </div>
              </div>
            </DrawerSection>
            <FormTextarea
              label="Description"
              rows={4}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
            <DrawerSection title="Checkout" titleGap={10}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 18"
                  value={formTax}
                  onChange={(e) => setFormTax(e.target.value)}
                />
                <p style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
                  Applied at checkout — never shown on the product page.
                </p>
              </div>
            </DrawerSection>
            <Disclosure
              title="Internal fields"
              subtitle="Internal data: weights, dimensions, print placements. Hidden from shoppers."
              badge={<Badge variant="neutral" size="sm">{[formWeight, formShipWeight, formDims, formGender].filter(Boolean).length + formAttributes.filter((a) => a.name === 'Placements').reduce((n, a) => n + a.values.length, 0)} filled</Badge>}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    label="Weight"
                    placeholder="e.g. 180g"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                  />
                  <Input
                    label="Shipping Weight"
                    placeholder="e.g. 250g"
                    value={formShipWeight}
                    onChange={(e) => setFormShipWeight(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    label="Package Dimensions"
                    placeholder="e.g. 18x20x2.3"
                    value={formDims}
                    onChange={(e) => setFormDims(e.target.value)}
                  />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                      Gender
                    </span>
                  <DropdownMenu
                    ariaLabel="Gender"
                    fullWidth
                    trigger={
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Gender, currently ${formGender || 'Unspecified'}`}
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
                          {formGender || 'Select gender'}
                        </span>
                        <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                      </span>
                    }
                    items={[
                      { value: '', label: 'Unspecified' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Male', label: 'Male' },
                      { value: 'Unisex', label: 'Unisex' },
                      { value: 'Kids', label: 'Kids' },
                    ]}
                    selectedValue={formGender}
                    onSelect={(v) => setFormGender(v as ProductItem['gender'] | '')}
                  />
                  </div>
                </div>
                {formAttributes.filter((a) => a.name === 'Placements').map((attr) => renderAttrCard(attr, true))}
              </div>
            </Disclosure>
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
                {reelUrlField}
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
              {reelUrlField}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                {formVariants.length} variants · {variantStockTotal(formVariants)} units in stock
                {variantSpread && variantLowest !== null
                  ? ` · From $${variantLowest.toFixed(2)}`
                  : ''}
              </span>
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addVariant}>
                Add Variant
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow hoverable={false}>
                  <TableHead style={{ padding: '12px 16px' }}>Color</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Size</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>SKU</TableHead>
                  <TableHead style={{ padding: '12px 16px', textAlign: 'right' }}>Price</TableHead>
                  <TableHead style={{ padding: '12px 16px' }}>Stock</TableHead>
                  <TableHead style={{ padding: '12px 16px', width: 48 }}><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formVariants.map((v) => (
                  <TableRow key={v.id} hoverable={false}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Input
                            aria-label={`Price for ${v.color} ${v.size}`}
                            type="number"
                            step="0.01"
                            value={String(v.price)}
                            onChange={(e) => {
                              const n = parseFloat(e.target.value);
                              // Typing pins the cell (R1): the price survives
                              // base/attribute recomputes until reset.
                              if (!isNaN(n) && n >= 0) updateVariant(v.id, { price: roundPrice(n), priceOverridden: true });
                            }}
                            style={{ height: 36, textAlign: 'right' }}
                          />
                        </div>
                        {v.priceOverridden && (
                          <button
                            type="button"
                            aria-label={`Reset ${v.color} ${v.size} price to derived`}
                            title="Pinned override — reset to derived price"
                            onClick={() =>
                              updateVariant(v.id, {
                                price: deriveVariantPrice(parseFloat(formPrice) || 0, formAdjustments, v.color, v.size),
                                priceOverridden: false,
                              })
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'inline-flex',
                              color: 'var(--tuw-action-primary, #7539FF)',
                            }}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
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
                        <SurfaceCard key={chart.id} padding="12px" gap="10px">
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
                                          type="number"
                                          min="0"
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
                        </SurfaceCard>
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

      {/* CSV import preview (X1b): counts + row errors → stage drafts. */}
      <Modal
        isOpen={importPreview !== null}
        onClose={() => setImportPreview(null)}
        title={`Import Preview — ${importPreview?.fileName ?? ''}`}
        subtitle={
          importPreview
            ? `${importPreview.valid.length} valid · ${importPreview.errors.length} rejected. Valid rows stage as drafts.`
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
              disabled={!importPreview || importPreview.valid.length === 0}
              onClick={applyImport}
            >
              Stage {importPreview?.valid.length ?? 0} Drafts
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {importPreview && importPreview.valid.length > 0 ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 6 }}>
                Ready to stage ({importPreview.valid.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                {importPreview.valid.slice(0, 20).map((r, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {r.name} · ₹{r.price.toLocaleString()}
                    {r.styleCode ? ` · ${r.styleCode}` : ''}
                  </div>
                ))}
                {importPreview.valid.length > 20 ? (
                  <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    …and {importPreview.valid.length - 20} more
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          {importPreview && importPreview.errors.length > 0 ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-error, #C91818)', marginBottom: 6 }}>
                Rejected ({importPreview.errors.length}) — fix the sheet and re-drop
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
          {importPreview && importPreview.valid.length === 0 && importPreview.errors.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
              No rows found.
            </div>
          ) : null}
        </div>
      </Modal>
    </DashboardShell>
  );
}
