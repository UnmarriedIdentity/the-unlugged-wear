'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ProductItem,
  OrderItem,
  ShipmentItem,
  RefundItem,
  ReturnItem,
  CustomerItem,
  SupportTicket,
  CollectionItem,
  DesignAsset,
  TeamMember,
  StoreSettings,
  StaffRole,
  StockMovement,
  DiscountCode,
  AbandonedCart,
  SizeChart,
  LibraryAttribute,
  ProductAttribute,
  initialProducts,
  initialOrders,
  initialShipments,
  initialRefunds,
  initialReturns,
  initialCustomers,
  initialSupportTickets,
  initialCollections,
  initialDesigns,
  initialTeam,
  initialSettings,
  initialStockMovements,
  initialDiscountCodes,
  initialAbandonedCarts,
  initialSizeCharts,
  initialLibraryAttributes,
  defaultLibraryVisibility,
} from './fixtures';
import {
  initialBlogAuthors,
  initialBlogCategories,
  initialBlogMedia,
  initialBlogPosts,
  initialBlogRevisions,
  initialBlogSlugHistory,
  initialBlogTags,
} from './blogFixtures';
import {
  synthesizeVariants,
  deriveColors,
  deriveSizes,
  variantStockTotal,
  buildVariantSkuFromOption,
  buildVariantKey,
} from './variants';
import {
  type BlogAuthor,
  type BlogCategory,
  type BlogDraft,
  type BlogMediaAsset,
  type BlogPost,
  type BlogRevision,
  type BlogSlugHistoryEntry,
  type BlogTag,
  nextBlogId,
  nextRevisionNo,
  slugify,
  uniqueBlogSlug,
  validateBlogDraft,
} from '@admin/lib/blog';
import { normalizeCollection, nextCollectionId, type LegacyCollection } from '@admin/lib/collections';
import { normalizeAttributeDisplayType } from '@admin/lib/attributePresentation';

/** Legacy single-value print placement → the workbook's multi-select
 * Placements attribute. Unknown values are preserved as product-local values
 * rather than dropped. */
const LEGACY_PLACEMENT_VALUES: Record<string, string[]> = {
  'Chest (45mm)': ['Front'],
  'Back Oversized': ['Back'],
  'Sleeve Length': ['Left Sleeve', 'Right Sleeve'],
  'Interior Hem': ['Interior Hem'],
};

function legacyPlacementValues(placement: unknown): string[] {
  if (typeof placement !== 'string') return [];
  const value = placement.trim();
  if (!value) return [];
  return LEGACY_PLACEMENT_VALUES[value] ?? [value];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

export type DemoScenario = 'normal' | 'loading' | 'empty' | 'error' | 'long_content';

interface AdminStateContextType {
  activeRole: StaffRole;
  setActiveRole: (role: StaffRole) => void;
  canPerformAction: (actionCategory: 'orders' | 'products' | 'refunds' | 'team' | 'settings' | 'fulfillment' | 'cms') => boolean;

  scenario: DemoScenario;
  setScenario: (scenario: DemoScenario) => void;
  simulatedError: string | null;
  retryConnection: () => void;

  products: ProductItem[];
  orders: OrderItem[];
  shipments: ShipmentItem[];
  refunds: RefundItem[];
  returns: ReturnItem[];
  customers: CustomerItem[];
  supportTickets: SupportTicket[];
  collections: CollectionItem[];
  designs: DesignAsset[];
  team: TeamMember[];
  settings: StoreSettings;
  stockMovements: StockMovement[];
  discountCodes: DiscountCode[];
  abandonedCarts: AbandonedCart[];
  sizeCharts: SizeChart[];
  libraryAttributes: LibraryAttribute[];

  blogCategories: BlogCategory[];
  blogAuthors: BlogAuthor[];
  blogTags: BlogTag[];
  blogMedia: BlogMediaAsset[];
  blogPosts: BlogPost[];
  blogRevisions: BlogRevision[];
  blogSlugHistory: BlogSlugHistoryEntry[];

  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Mutations
  createProduct: (product: Omit<ProductItem, 'id' | 'soldCount' | 'rating'>, silent?: boolean) => boolean;
  /** Batch create in one state commit — import staging needs this so a 150-row
   * workbook does not overwrite itself through stale closures. */
  createProducts: (
    products: Array<Omit<ProductItem, 'id' | 'soldCount' | 'rating'>>,
    silent?: boolean
  ) => number;
  updateProduct: (id: string, updates: Partial<ProductItem>, silent?: boolean) => boolean;
  deleteProduct: (id: string, silent?: boolean) => boolean;

  createOrder: (order: Omit<OrderItem, 'id' | 'date' | 'timeline' | 'paidAmount' | 'refundedAmount'>) => boolean;
  updateOrderStatus: (orderId: string, paymentStatus?: OrderItem['paymentStatus'], fulfillmentStatus?: OrderItem['fulfillmentStatus'], silent?: boolean) => boolean;
  retryFulfillment: (orderId: string, silent?: boolean) => Promise<boolean>;

  createShipment: (shipment: Omit<ShipmentItem, 'dispatchDate' | 'events'>) => boolean;

  issueRefund: (params: { orderId: string; amount: number; reason: string; method: string }) => { success: boolean; error?: string };

  updateReturnStatus: (returnId: string, stage: ReturnItem['stage'], silent?: boolean) => boolean;

  addCustomerNote: (customerId: string, note: string) => boolean;
  createCustomer: (customer: {
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    address: string;
    tier?: 'VIP Customer' | 'Active' | 'New';
    notes?: string[];
  }) => boolean;
  sendSupportReply: (ticketId: string, replyText: string, silent?: boolean) => boolean;

  createCollection: (col: Omit<CollectionItem, 'id' | 'updatedAt'>) => boolean;
  updateCollection: (id: string, patch: Partial<Omit<CollectionItem, 'id' | 'updatedAt'>>) => boolean;
  deleteCollection: (id: string) => boolean;
  uploadDesignAsset: (asset: Omit<DesignAsset, 'id' | 'updatedAt'>) => boolean;

  inviteTeamMember: (member: Omit<TeamMember, 'id' | 'lastActive' | 'avatarBg'>) => boolean;
  removeTeamMember: (memberId: string) => boolean;

  updateSettings: (newSettings: Partial<StoreSettings>) => boolean;

  createDiscountCode: (input: Omit<DiscountCode, 'id' | 'usesCount'>) => boolean;
  toggleDiscountCode: (id: string) => boolean;
  deleteDiscountCode: (id: string) => boolean;

  remindAbandonedCart: (id: string) => boolean;

  createSizeChart: (name: string) => boolean;
  deleteSizeChart: (id: string) => boolean;
  addSizeChartRow: (chartId: string, size: string) => boolean;
  removeSizeChartRow: (chartId: string, size: string) => boolean;
  patchSizeChartCell: (chartId: string, size: string, key: string, raw: string) => boolean;

  createLibraryAttribute: (name: string, displayType?: LibraryAttribute['displayType']) => string | false;
  deleteLibraryAttribute: (id: string) => boolean;
  toggleLibraryAttribute: (id: string) => boolean;
  setLibraryDisplayType: (id: string, displayType: LibraryAttribute['displayType']) => boolean;
  setLibraryVisibility: (id: string, surface: 'pdp' | 'checkout' | 'admin', on: boolean) => boolean;
  addLibraryValue: (id: string, value: string) => boolean;
  removeLibraryValue: (id: string, value: string) => boolean;

  saveBlogPost: (draft: BlogDraft, mode: 'draft' | 'publish') => { ok: boolean; errors?: Partial<Record<keyof BlogDraft | 'content', string>> };
  deleteBlogPost: (id: string) => boolean;
  archiveBlogPost: (id: string) => boolean;
  restoreBlogRevision: (revisionId: string) => boolean;
  createBlogTag: (name: string) => string | false;
  createBlogCategory: (name: string) => string | false;

  resetDemoData: () => void;
}

const STORAGE_KEY = 'tuw_admin_v2_state';

const AdminStateContext = createContext<AdminStateContextType | null>(null);

export function AdminStateProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<StaffRole>('Owner');
  const [scenario, setScenarioState] = useState<DemoScenario>('normal');
  const [simulatedError, setSimulatedError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [shipments, setShipments] = useState<ShipmentItem[]>(initialShipments);
  const [refunds, setRefunds] = useState<RefundItem[]>(initialRefunds);
  const [returns, setReturns] = useState<ReturnItem[]>(initialReturns);
  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(initialSupportTickets);
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections);
  const [designs, setDesigns] = useState<DesignAsset[]>(initialDesigns);
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(initialDiscountCodes);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>(initialAbandonedCarts);
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>(initialSizeCharts);
  const [libraryAttributes, setLibraryAttributes] = useState<LibraryAttribute[]>(initialLibraryAttributes);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>(initialBlogCategories);
  const [blogAuthors, setBlogAuthors] = useState<BlogAuthor[]>(initialBlogAuthors);
  const [blogTags, setBlogTags] = useState<BlogTag[]>(initialBlogTags);
  const [blogMedia, setBlogMedia] = useState<BlogMediaAsset[]>(initialBlogMedia);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [blogRevisions, setBlogRevisions] = useState<BlogRevision[]>(initialBlogRevisions);
  const [blogSlugHistory, setBlogSlugHistory] = useState<BlogSlugHistoryEntry[]>(initialBlogSlugHistory);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeRole) setActiveRoleState(parsed.activeRole);
        if (parsed.products) {
          // One-time gallery + placement migration: legacy hero `image`
          // becomes the first ordered gallery entry (cover); the old
          // single-value `placement` folds into the Placements attribute.
          setProducts(
            (parsed.products as Array<ProductItem & { image?: string; placement?: string }>).map((p) => {
              const legacy = p as ProductItem & {
                image?: string;
                imageBg?: string;
                placement?: string;
              };
              const rest = { ...legacy };
              delete rest.image;
              delete rest.imageBg;
              delete rest.placement;
              const savedAttributes = rest.attributes;
              delete rest.attributes;

              const attributes: ProductAttribute[] = (savedAttributes ?? []).map((a) => ({
                ...a,
                values: [...a.values],
                swatchHex: { ...(a.swatchHex ?? {}) },
              }));
              const placementValues = legacyPlacementValues(legacy.placement);
              if (placementValues.length > 0) {
                const existing = attributes.find(
                  (a) => a.name.toLowerCase() === 'placements'
                );
                if (existing) {
                  if (existing.values.length === 0) existing.values = placementValues;
                } else {
                  attributes.push({
                    name: 'Placements',
                    values: placementValues,
                    builtin: true,
                    displayType: 'radio',
                    swatchHex: {},
                    libraryId: 'LIB-03',
                  });
                }
              }

              return {
                ...rest,
                ...(savedAttributes !== undefined || placementValues.length > 0
                  ? { attributes }
                  : {}),
                images:
                  Array.isArray(p.images) && p.images.length > 0
                    ? [...p.images]
                    : legacy.image
                      ? [legacy.image]
                      : [],
              };
            })
          );
        }
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.shipments) setShipments(parsed.shipments);
        if (parsed.refunds) setRefunds(parsed.refunds);
        if (parsed.returns) setReturns(parsed.returns);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.supportTickets) setSupportTickets(parsed.supportTickets);
        if (parsed.collections) {
          // One-time migration: legacy rows carried a fabricated productCount.
          // Keep real productIds when present (deduped, unknown ids pruned);
          // otherwise [] — links are never invented. Reset Demo restores the
          // baseline fixture links.
          const validProductIds = new Set<string>(
            ((parsed.products as ProductItem[] | undefined) ?? initialProducts).map((p) => p.id)
          );
          setCollections(
            (parsed.collections as LegacyCollection[]).map((c) => normalizeCollection(c, validProductIds))
          );
        }
        if (parsed.designs) setDesigns(parsed.designs);
        if (parsed.team) setTeam(parsed.team);
        if (parsed.settings) setSettings({
          ...parsed.settings,
          defaultCurrency: 'INR (₹)',
          // Legacy demo shipping defaults → INR-scale (storefront parity).
          freeShippingThreshold:
            parsed.settings.freeShippingThreshold === 150 ? 3000 : parsed.settings.freeShippingThreshold,
          standardShippingFee:
            parsed.settings.standardShippingFee === 12 ? 150 : parsed.settings.standardShippingFee,
        });
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.discountCodes) setDiscountCodes(parsed.discountCodes);
        if (parsed.abandonedCarts) setAbandonedCarts(parsed.abandonedCarts);
        if (parsed.sizeCharts) setSizeCharts(parsed.sizeCharts);
        if (parsed.libraryAttributes) {
          // One-time normalization: visibility moved from per-product rows
          // to the definition. Legacy records gain the global defaults.
          setLibraryAttributes(
            (parsed.libraryAttributes as LibraryAttribute[]).map((a) => ({
              ...defaultLibraryVisibility(a.name),
              ...a,
              displayType: normalizeAttributeDisplayType(a.displayType),
            }))
          );
        }
        if (parsed.blogCategories) setBlogCategories(parsed.blogCategories);
        if (parsed.blogAuthors) setBlogAuthors(parsed.blogAuthors);
        if (parsed.blogTags) setBlogTags(parsed.blogTags);
        if (parsed.blogMedia) setBlogMedia(parsed.blogMedia);
        if (parsed.blogPosts) setBlogPosts(parsed.blogPosts);
        if (parsed.blogRevisions) setBlogRevisions(parsed.blogRevisions);
        if (parsed.blogSlugHistory) setBlogSlugHistory(parsed.blogSlugHistory);
      }
    } catch {
      // Local storage fallback
    }
  }, []);

  // Save to localStorage whenever state changes
  const persistState = useCallback(
    (newState: {
      activeRole?: StaffRole;
      products?: ProductItem[];
      orders?: OrderItem[];
      shipments?: ShipmentItem[];
      refunds?: RefundItem[];
      returns?: ReturnItem[];
      customers?: CustomerItem[];
      supportTickets?: SupportTicket[];
      collections?: CollectionItem[];
      designs?: DesignAsset[];
      team?: TeamMember[];
      settings?: StoreSettings;
      stockMovements?: StockMovement[];
      discountCodes?: DiscountCode[];
      abandonedCarts?: AbandonedCart[];
      sizeCharts?: SizeChart[];
      libraryAttributes?: LibraryAttribute[];
      blogCategories?: BlogCategory[];
      blogAuthors?: BlogAuthor[];
      blogTags?: BlogTag[];
      blogMedia?: BlogMediaAsset[];
      blogPosts?: BlogPost[];
      blogRevisions?: BlogRevision[];
      blogSlugHistory?: BlogSlugHistoryEntry[];
    }) => {
      try {
        const current = {
          activeRole,
          products,
          orders,
          shipments,
          refunds,
          returns,
          customers,
          supportTickets,
          collections,
          designs,
          team,
          settings,
          stockMovements,
          discountCodes,
          abandonedCarts,
          sizeCharts,
          libraryAttributes,
          blogCategories,
          blogAuthors,
          blogTags,
          blogMedia,
          blogPosts,
          blogRevisions,
          blogSlugHistory,
          ...newState,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch {
        // Storage quota / privacy protection
      }
    },
    [activeRole, products, orders, shipments, refunds, returns, customers, supportTickets, collections, designs, team, settings, stockMovements, discountCodes, abandonedCarts, sizeCharts, libraryAttributes, blogCategories, blogAuthors, blogTags, blogMedia, blogPosts, blogRevisions, blogSlugHistory]
  );

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setActiveRole = (role: StaffRole) => {
    setActiveRoleState(role);
    persistState({ activeRole: role });
    showToast({
      type: 'info',
      title: `Switched Demo Role to ${role}`,
      description: `UI permissions adjusted for ${role} scenario testing.`,
    });
  };

  // Role check helper
  const canPerformAction = (actionCategory: 'orders' | 'products' | 'refunds' | 'team' | 'settings' | 'fulfillment' | 'cms'): boolean => {
    if (activeRole === 'Read-only') {
      showToast({
        type: 'warning',
        title: 'Action Restricted in Read-Only Mode',
        description: 'Switch demo role to Owner or Operations to perform simulated mutations.',
      });
      return false;
    }
    if (activeRole === 'Content') {
      if (['orders', 'refunds', 'team', 'fulfillment'].includes(actionCategory)) {
        showToast({
          type: 'warning',
          title: 'Permission Denied for Content Role',
          description: 'The Content role is restricted to Products, Collections, CMS, and Assets.',
        });
        return false;
      }
    }
    if (activeRole === 'Operations') {
      if (actionCategory === 'team' || actionCategory === 'settings') {
        showToast({
          type: 'warning',
          title: 'Permission Denied for Operations Role',
          description: 'Team management and store settings require the Owner role.',
        });
        return false;
      }
    }
    return true;
  };

  // -------------------------------------------------------------
  // MUTATION IMPLEMENTATIONS
  // -------------------------------------------------------------

  // Stable, collision-free ID. The old random 10–99 range duplicated quickly
  // once a workbook staged more than a handful of products.
  const nextProductId = (list: ProductItem[]): string => {
    let nextNumber =
      list.reduce((max, product) => {
        const match = /^PRD-(\d+)$/.exec(product.id);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0) + 1;
    let id = `PRD-${String(nextNumber).padStart(2, '0')}`;
    while (list.some((product) => product.id === id)) {
      nextNumber += 1;
      id = `PRD-${String(nextNumber).padStart(2, '0')}`;
    }
    return id;
  };

  // Explicit variants (import) win; manual creates synthesize from the flat
  // color×size fields. IDs and SKUs are always regenerated in the seam so
  // callers cannot persist placeholder or duplicate identities.
  const buildProduct = (
    p: Omit<ProductItem, 'id' | 'soldCount' | 'rating'>,
    id: string
  ): ProductItem => {
    const sourceVariants =
      p.variants && p.variants.length > 0
        ? p.variants
        : synthesizeVariants({ id, price: p.price, stock: p.stock, colors: p.colors, sizes: p.sizes });
    const usedSkus = new Set<string>();
    const variants = sourceVariants.map((variant, index) => {
      const baseSku = variant.sku || buildVariantSkuFromOption(id, variant.color, variant.size);
      let sku = baseSku;
      let suffix = 2;
      while (usedSkus.has(sku)) {
        sku = `${baseSku}-${suffix}`;
        suffix += 1;
      }
      usedSkus.add(sku);
      return {
        ...variant,
        id: `${id}-V${index + 1}`,
        sku,
        variantKey: variant.variantKey ?? buildVariantKey(variant.color, variant.size),
      };
    });

    return {
      ...p,
      id,
      variants,
      colors: deriveColors(variants),
      sizes: deriveSizes(variants),
      stock: p.variants && p.variants.length > 0 ? variantStockTotal(variants) : p.stock,
      soldCount: 0,
      rating: 5.0,
    };
  };

  const createProduct = (p: Omit<ProductItem, 'id' | 'soldCount' | 'rating'>, silent = false) => {
    if (!canPerformAction('products')) return false;
    const newProduct = buildProduct(p, nextProductId(products));
    const next = [newProduct, ...products];
    setProducts(next);
    persistState({ products: next });
    if (!silent) {
      showToast({
        type: 'success',
        title: 'Product Created',
        description: `"${p.name}" has been added to the local catalog.`,
      });
    }
    return true;
  };

  const createProducts = (
    drafts: Array<Omit<ProductItem, 'id' | 'soldCount' | 'rating'>>,
    silent = false
  ) => {
    if (!canPerformAction('products') || drafts.length === 0) return 0;

    // One commit for the whole workbook. Calling createProduct in a loop reads
    // the same pre-import `products` closure every time, so only the last row
    // would survive.
    let list = products;
    for (const draft of drafts) {
      list = [buildProduct(draft, nextProductId(list)), ...list];
    }
    setProducts(list);
    persistState({ products: list });
    if (!silent) {
      showToast({
        type: 'success',
        title: 'Products Created',
        description: `${drafts.length} draft${drafts.length === 1 ? '' : 's'} added to the local catalog.`,
      });
    }
    return drafts.length;
  };

  const updateProduct = (id: string, updates: Partial<ProductItem>, silent = false) => {
    if (!canPerformAction('products')) return false;
    const target = products.find((p) => p.id === id);
    const next = products.map((p) => {
      if (p.id !== id) return p;
      const merged = { ...p, ...updates };
      // Variants are the source of truth: keep display lists derived so
      // colors/sizes can never drift from the matrix.
      if (updates.variants) {
        merged.colors = deriveColors(updates.variants);
        merged.sizes = deriveSizes(updates.variants);
        merged.stock = variantStockTotal(updates.variants);
      }
      return merged;
    });
    // Ledger truthfulness (P1b): every variant stock delta in a save appends
    // an admin_adjustment movement, so the history view grows with edits.
    if (target && updates.variants) {
      const before = new Map(
        (target.variants ?? synthesizeVariants(target)).map((v) => [v.id, v.stock])
      );
      const stamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' });
      const appended: StockMovement[] = [];
      updates.variants.forEach((v) => {
        const old = before.get(v.id);
        if (old !== undefined && old !== v.stock) {
          appended.push({
            id: `STM-${Date.now()}-${v.id}`,
            productId: id,
            variantId: v.id,
            qtyChange: v.stock - old,
            reason: 'admin_adjustment',
            qtyAfter: v.stock,
            createdAt: stamp,
          });
        }
      });
      if (appended.length > 0) {
        const nextMovements = [...appended, ...stockMovements];
        setStockMovements(nextMovements);
        persistState({ products: next, stockMovements: nextMovements });
      } else {
        persistState({ products: next });
      }
    } else {
      persistState({ products: next });
    }
    setProducts(next);
    if (!silent) {
      showToast({
        type: 'success',
        title: 'Product Updated',
        description: `Changes saved to local product record.`,
      });
    }
    return true;
  };

  const deleteProduct = (id: string, silent = false) => {
    if (!canPerformAction('products')) return false;
    const target = products.find((p) => p.id === id);
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    persistState({ products: next });
    if (!silent) {
      showToast({
        type: 'info',
        title: 'Product Deleted',
        description: `Removed from active catalog dataset.`,
      });
    }
    return true;
  };

  const createOrder = (o: Omit<OrderItem, 'id' | 'date' | 'timeline' | 'paidAmount' | 'refundedAmount'>) => {
    if (!canPerformAction('orders')) return false;
    const newOrder: OrderItem = {
      ...o,
      id: `#ORD-${Math.floor(8821 + Math.random() * 50)}`,
      date: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }),
      paidAmount: o.paymentStatus === 'paid' ? o.total : 0,
      refundedAmount: 0,
      timeline: [{ title: 'Order Placed', time: 'Just now', note: 'Created via admin demo interface' }],
    };
    const next = [newOrder, ...orders];
    setOrders(next);
    // Recovery matcher: an order from the same email converts their
    // open abandonment rows (detected/reminded only — never rewrites).
    const email = o.customerEmail.trim().toLowerCase();
    const converted = abandonedCarts.map((c) =>
      c.email?.toLowerCase() === email && (c.status === 'detected' || c.status === 'reminded')
        ? { ...c, status: 'converted' as const }
        : c
    );
    if (converted.some((c, i) => c !== abandonedCarts[i])) {
      setAbandonedCarts(converted);
      persistState({ orders: next, abandonedCarts: converted });
    } else {
      persistState({ orders: next });
    }
    showToast({
      type: 'success',
      title: 'Order Created',
      description: `Order ${newOrder.id} initialized with ${newOrder.fulfillmentStatus} status.`,
    });
    return true;
  };

  const updateOrderStatus = (
    orderId: string,
    paymentStatus?: OrderItem['paymentStatus'],
    fulfillmentStatus?: OrderItem['fulfillmentStatus'],
    silent = false
  ) => {
    if (!canPerformAction('orders')) return false;
    const next = orders.map((o) => {
      if (o.id === orderId) {
        const updated = { ...o };
        if (paymentStatus) {
          updated.paymentStatus = paymentStatus;
          if (paymentStatus === 'paid') updated.paidAmount = o.total;
        }
        if (fulfillmentStatus) {
          updated.fulfillmentStatus = fulfillmentStatus;
          updated.timeline = [
            {
              title: `Status changed to ${fulfillmentStatus}`,
              time: 'Just now',
              note: `Updated by ${activeRole}`,
            },
            ...o.timeline,
          ];
        }
        return updated;
      }
      return o;
    });
    setOrders(next);
    persistState({ orders: next });
    if (!silent) {
      showToast({
        type: 'success',
        title: 'Order Status Updated',
        description: `Order ${orderId} record updated locally.`,
      });
    }
    return true;
  };

  const retryFulfillment = async (orderId: string, silent = false): Promise<boolean> => {
    if (!canPerformAction('fulfillment')) return false;
    // Simulate network delay
    if (!silent) {
      showToast({
        type: 'info',
        title: 'Retrying Partner API Webhook',
        description: `Submitting order ${orderId} payload to print hub...`,
      });
    }
    await new Promise((r) => setTimeout(r, 900));

    const next = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          fulfillmentStatus: 'printing' as const,
          timeline: [
            {
              title: 'Retry Succeeded',
              time: 'Just now',
              note: 'Partner print queue confirmed receipt (Webhook 200 OK)',
            },
            ...o.timeline,
          ],
        };
      }
      return o;
    });
    setOrders(next);
    persistState({ orders: next });
    if (!silent) {
      showToast({
        type: 'success',
        title: 'Fulfillment Retry Succeeded',
        description: `Order ${orderId} moved from submission_failed to printing queue.`,
      });
    }
    return true;
  };

  const createShipment = (s: Omit<ShipmentItem, 'dispatchDate' | 'events'>) => {
    if (!canPerformAction('fulfillment')) return false;
    const newShipment: ShipmentItem = {
      ...s,
      dispatchDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      events: [
        {
          time: 'Just now',
          location: 'Origin Fulfillment Center',
          description: `Dispatched via ${s.carrier}. Manifest created.`,
        },
      ],
    };
    const nextShipments = [newShipment, ...shipments];
    setShipments(nextShipments);
    // Also update order status to shipped
    updateOrderStatus(s.orderId, undefined, 'shipped');
    persistState({ shipments: nextShipments });
    showToast({
      type: 'success',
      title: 'Shipment Dispatched',
      description: `Tracking ${s.trackingId} assigned to ${s.orderId}.`,
    });
    return true;
  };

  const issueRefund = (params: {
    orderId: string;
    amount: number;
    reason: string;
    method: string;
  }): { success: boolean; error?: string } => {
    if (!canPerformAction('refunds')) return { success: false, error: 'Unauthorized demo role' };

    const targetOrder = orders.find((o) => o.id === params.orderId);
    if (!targetOrder) {
      return { success: false, error: 'Order not found' };
    }

    const availableToRefund = targetOrder.paidAmount - targetOrder.refundedAmount;
    if (params.amount <= 0) {
      return { success: false, error: 'Refund amount must be greater than ₹0.00' };
    }
    if (params.amount > availableToRefund) {
      return {
        success: false,
        error: `Cannot refund ₹${params.amount.toFixed(2)}. Maximum refundable balance is ₹${availableToRefund.toFixed(2)}.`,
      };
    }

    const newRefundId = `REF-${Math.floor(2042 + Math.random() * 50)}`;
    const newRefund: RefundItem = {
      id: newRefundId,
      orderId: params.orderId,
      customer: targetOrder.customerName,
      reason: params.reason,
      amount: params.amount,
      method: params.method,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'completed',
    };

    const nextRefunds = [newRefund, ...refunds];
    setRefunds(nextRefunds);

    // Update order amounts
    const nextOrders = orders.map((o) => {
      if (o.id === params.orderId) {
        const newRefunded = o.refundedAmount + params.amount;
        return {
          ...o,
          refundedAmount: newRefunded,
          paymentStatus: newRefunded >= o.paidAmount ? ('refunded' as const) : o.paymentStatus,
          timeline: [
            {
              title: `Refund Processed (${newRefundId})`,
              time: 'Just now',
              note: `₹${params.amount.toFixed(2)} refunded via ${params.method}. Reason: ${params.reason}`,
            },
            ...o.timeline,
          ],
        };
      }
      return o;
    });
    setOrders(nextOrders);

    persistState({ refunds: nextRefunds, orders: nextOrders });
    showToast({
      type: 'success',
      title: 'Refund Successfully Disbursed',
      description: `₹${params.amount.toFixed(2)} refunded for ${params.orderId} via ${params.method}.`,
    });

    return { success: true };
  };

  const updateReturnStatus = (returnId: string, stage: ReturnItem['stage'], silent = false) => {
    if (!canPerformAction('orders')) return false;
    const next = returns.map((r) => (r.id === returnId ? { ...r, stage } : r));
    setReturns(next);
    persistState({ returns: next });
    if (!silent) {
      showToast({
        type: 'success',
        title: 'RMA Stage Updated',
        description: `Return ${returnId} marked as ${stage}.`,
      });
    }
    return true;
  };

  const addCustomerNote = (customerId: string, note: string) => {
    if (!canPerformAction('orders')) return false;
    const next = customers.map((c) => (c.id === customerId ? { ...c, notes: [note, ...c.notes] } : c));
    setCustomers(next);
    persistState({ customers: next });
    showToast({
      type: 'success',
      title: 'Note Saved',
      description: 'Customer record updated with internal staff note.',
    });
    return true;
  };

  const createCustomer = (c: {
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    address: string;
    tier?: 'VIP Customer' | 'Active' | 'New';
    notes?: string[];
  }) => {
    if (!canPerformAction('orders')) return false;
    const newCustomer: CustomerItem = {
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: c.name,
      email: c.email,
      phone: c.phone,
      totalOrders: 0,
      totalSpent: 0,
      tier: c.tier || 'New',
      address: c.address || 'Indiranagar, 100ft Road',
      city: c.city,
      country: c.country,
      joinedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      notes: c.notes || [],
    };
    const next = [newCustomer, ...customers];
    setCustomers(next);
    persistState({ customers: next });
    showToast({
      type: 'success',
      title: 'Customer Added',
      description: `${c.name} has been added to customer directory.`,
    });
    return true;
  };

  const sendSupportReply = (ticketId: string, replyText: string, silent = false) => {
    if (!canPerformAction('orders')) return false;
    const next = supportTickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'resolved' as const,
          messages: [
            ...t.messages,
            {
              sender: 'staff' as const,
              text: replyText,
              time: 'Just now',
            },
          ],
        };
      }
      return t;
    });
    setSupportTickets(next);
    persistState({ supportTickets: next });
    if (!silent) {
      showToast({
        type: 'success',
        title: 'Support Response Sent',
        description: `Ticket ${ticketId} resolved and email dispatched.`,
      });
    }
    return true;
  };

  const createCollection = (col: Omit<CollectionItem, 'id' | 'updatedAt'>) => {
    if (!canPerformAction('products')) return false;
    const newCol: CollectionItem = {
      ...col,
      id: nextCollectionId(collections),
      updatedAt: 'Just now',
    };
    const next = [newCol, ...collections];
    setCollections(next);
    persistState({ collections: next });
    showToast({
      type: 'success',
      title: 'Collection Created',
      description: `"${col.name}" is now ready for storefront curation.`,
    });
    return true;
  };

  const updateCollection = (id: string, patch: Partial<Omit<CollectionItem, 'id' | 'updatedAt'>>) => {
    if (!canPerformAction('products')) return false;
    const target = collections.find((c) => c.id === id);
    if (!target) return false;
    const next = collections.map((c) =>
      c.id === id ? { ...c, ...patch, id: c.id, updatedAt: 'Just now' } : c
    );
    setCollections(next);
    persistState({ collections: next });
    showToast({
      type: 'success',
      title: 'Collection Updated',
      description: `"${patch.name ?? target.name}" saved to the storefront catalog.`,
    });
    return true;
  };

  const deleteCollection = (id: string) => {
    if (!canPerformAction('products')) return false;
    const target = collections.find((c) => c.id === id);
    if (!target) return false;
    const next = collections.filter((c) => c.id !== id);
    setCollections(next);
    persistState({ collections: next });
    showToast({
      type: 'success',
      title: 'Collection Deleted',
      description: `"${target.name}" removed from the demo catalog.`,
    });
    return true;
  };

  const uploadDesignAsset = (asset: Omit<DesignAsset, 'id' | 'updatedAt'>) => {
    if (!canPerformAction('products')) return false;
    const newAsset: DesignAsset = {
      ...asset,
      id: `DSN-${Math.floor(310 + Math.random() * 90)}`,
      updatedAt: 'Just now',
    };
    const next = [newAsset, ...designs];
    setDesigns(next);
    persistState({ designs: next });
    showToast({
      type: 'success',
      title: 'Design Asset Uploaded',
      description: `"${asset.name}" validated and stored in asset catalog.`,
    });
    return true;
  };

  const inviteTeamMember = (m: Omit<TeamMember, 'id' | 'lastActive' | 'avatarBg'>) => {
    if (!canPerformAction('team')) return false;
    const colors = ['#7539FF', '#187343', '#175CD3', '#856300', '#C91818'];
    const newMember: TeamMember = {
      ...m,
      id: `MEM-${Math.floor(10 + Math.random() * 90)}`,
      lastActive: 'Invitation sent',
      avatarBg: colors[Math.floor(Math.random() * colors.length)],
    };
    const next = [newMember, ...team];
    setTeam(next);
    persistState({ team: next });
    showToast({
      type: 'success',
      title: 'Invitation Sent',
      description: `Invited ${m.name} as ${m.role}. Simulated invite link created.`,
    });
    return true;
  };

  const removeTeamMember = (memberId: string) => {
    if (!canPerformAction('team')) return false;
    const target = team.find((m) => m.id === memberId);
    const next = team.filter((m) => m.id !== memberId);
    setTeam(next);
    persistState({ team: next });
    showToast({
      type: 'info',
      title: 'Staff Member Removed',
      description: `${target?.name || 'Member'} has been de-provisioned from team access.`,
    });
    return true;
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    if (!canPerformAction('settings')) return false;
    const next = { ...settings, ...newSettings };
    setSettings(next);
    persistState({ settings: next });
    showToast({
      type: 'success',
      title: 'Settings Saved',
      description: 'Preferences and connection parameters updated locally.',
    });
    return true;
  };

  // Discount codes (Phase-2 discounts): used codes are history (delete
  // refused); kill switch flips is_active reversibly.
  const createDiscountCode = (input: Omit<DiscountCode, 'id' | 'usesCount'>) => {
    if (!canPerformAction('orders')) return false;
    const code = input.code.trim().toUpperCase();
    if (!code) return false;
    if (discountCodes.some((d) => d.code.toUpperCase() === code)) {
      showToast({ type: 'warning', title: 'Duplicate Code', description: `"${code}" already exists.` });
      return false;
    }
    if (input.discountType === 'percent' && (input.value <= 0 || input.value > 100)) {
      showToast({ type: 'warning', title: 'Invalid Percent', description: 'Percent codes run 1–100.' });
      return false;
    }
    if (input.value <= 0) {
      showToast({ type: 'warning', title: 'Invalid Value', description: 'Discount value must be above zero.' });
      return false;
    }
    const next = [...discountCodes, { ...input, code, id: `DC-${Date.now()}`, usesCount: 0 }];
    setDiscountCodes(next);
    persistState({ discountCodes: next });
    showToast({ type: 'success', title: 'Code Created', description: `"${code}" is live for checkout.` });
    return true;
  };
  const toggleDiscountCode = (id: string) => {
    if (!canPerformAction('orders')) return false;
    const next = discountCodes.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d));
    setDiscountCodes(next);
    persistState({ discountCodes: next });
    return true;
  };
  const deleteDiscountCode = (id: string) => {
    if (!canPerformAction('orders')) return false;
    const target = discountCodes.find((d) => d.id === id);
    if (!target) return false;
    if (target.usesCount > 0) {
      showToast({ type: 'warning', title: 'Code In Use', description: `"${target.code}" has redemptions — kill it instead of deleting.` });
      return false;
    }
    const next = discountCodes.filter((d) => d.id !== id);
    setDiscountCodes(next);
    persistState({ discountCodes: next });
    return true;
  };

  // Recovery: exactly-once reminder per cart (remindedAt set once).
  const remindAbandonedCart = (id: string) => {
    if (!canPerformAction('orders')) return false;
    const target = abandonedCarts.find((c) => c.id === id);
    if (!target || target.status !== 'detected') return false;
    const stamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' });
    const next = abandonedCarts.map((c) =>
      c.id === id ? { ...c, status: 'reminded' as const, remindedAt: stamp } : c
    );
    setAbandonedCarts(next);
    persistState({ abandonedCarts: next });
    showToast({
      type: 'info',
      title: 'Reminder Queued',
      description: target.email
        ? `Recovery email queued for ${target.email} — sends at backend.`
        : 'Guest cart noted — email capture needed before a reminder can send.',
    });
    return true;
  };

  // Size charts: sparse-measure rows (columns vary by garment).
  const createSizeChart = (name: string) => {
    if (!canPerformAction('products')) return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (sizeCharts.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast({ type: 'warning', title: 'Duplicate Chart', description: `"${trimmed}" already exists.` });
      return false;
    }
    const next = [...sizeCharts, { id: `SC-${Date.now()}`, name: trimmed, rows: [] }];
    setSizeCharts(next);
    persistState({ sizeCharts: next });
    return true;
  };
  const deleteSizeChart = (id: string) => {
    if (!canPerformAction('products')) return false;
    const next = sizeCharts.filter((c) => c.id !== id);
    setSizeCharts(next);
    persistState({ sizeCharts: next });
    return true;
  };
  const addSizeChartRow = (chartId: string, size: string) => {
    if (!canPerformAction('products')) return false;
    const trimmed = size.trim();
    if (!trimmed) return false;
    const chart = sizeCharts.find((c) => c.id === chartId);
    if (!chart || chart.rows.some((r) => r.size.toLowerCase() === trimmed.toLowerCase())) {
      if (chart) showToast({ type: 'warning', title: 'Duplicate Size', description: `"${trimmed}" is already in ${chart.name}.` });
      return false;
    }
    const next = sizeCharts.map((c) =>
      c.id === chartId ? { ...c, rows: [...c.rows, { size: trimmed, measures: {} }] } : c
    );
    setSizeCharts(next);
    persistState({ sizeCharts: next });
    return true;
  };
  const removeSizeChartRow = (chartId: string, size: string) => {
    if (!canPerformAction('products')) return false;
    const next = sizeCharts.map((c) =>
      c.id === chartId ? { ...c, rows: c.rows.filter((r) => r.size !== size) } : c
    );
    setSizeCharts(next);
    persistState({ sizeCharts: next });
    return true;
  };
  const patchSizeChartCell = (chartId: string, size: string, key: string, raw: string) => {
    if (!canPerformAction('products')) return false;
    const trimmed = raw.trim();
    const next = sizeCharts.map((c) => {
      if (c.id !== chartId) return c;
      return {
        ...c,
        rows: c.rows.map((r) => {
          if (r.size !== size) return r;
          const measures = { ...r.measures };
          if (trimmed === '') delete measures[key];
          else {
            const n = parseFloat(trimmed);
            if (isNaN(n) || n < 0) return r;
            measures[key] = n;
          }
          return { ...r, measures };
        }),
      };
    });
    setSizeCharts(next);
    persistState({ sizeCharts: next });
    return true;
  };

  // Attribute library (settings manager): copy-source for drawer drafts.
  // Delete guards read persisted products (real check, not theater);
  // disable always allowed — data preserved, picker hides it.
  const createLibraryAttribute = (
    name: string,
    displayType: LibraryAttribute['displayType'] = 'pill'
  ): string | false => {
    if (!canPerformAction('products')) return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (libraryAttributes.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast({ type: 'warning', title: 'Duplicate Attribute', description: `"${trimmed}" is already in the library.` });
      return false;
    }
    const id = `LIB-${Date.now()}`;
    const next = [
      ...libraryAttributes,
      {
        id,
        name: trimmed,
        values: [],
        displayType: normalizeAttributeDisplayType(displayType),
        enabled: true,
        ...defaultLibraryVisibility(trimmed),
      },
    ];
    setLibraryAttributes(next);
    persistState({ libraryAttributes: next });
    return id;
  };
  const libraryUsedBy = (id: string, value?: string): string | null => {
    const lib = libraryAttributes.find((a) => a.id === id);
    const hit = products.find((p) =>
      (p.attributes ?? []).some(
        (a) =>
          // id match first; name fallback catches legacy rows persisted
          // before links existed (belt + suspenders, never silent).
          (a.libraryId === id ||
            (!a.libraryId && lib !== undefined && a.name.toLowerCase() === lib.name.toLowerCase())) &&
          (value === undefined || a.values.some((v) => v.toLowerCase() === value.toLowerCase()))
      )
    );
    return hit ? hit.name : null;
  };
  const deleteLibraryAttribute = (id: string) => {
    if (!canPerformAction('products')) return false;
    const target = libraryAttributes.find((a) => a.id === id);
    if (!target) return false;
    const usedBy = libraryUsedBy(id);
    if (usedBy) {
      showToast({ type: 'warning', title: 'Attribute In Use', description: `"${target.name}" is linked by ${usedBy} — unlink it there first.` });
      return false;
    }
    const next = libraryAttributes.filter((a) => a.id !== id);
    setLibraryAttributes(next);
    persistState({ libraryAttributes: next });
    return true;
  };
  const toggleLibraryAttribute = (id: string) => {
    if (!canPerformAction('products')) return false;
    const next = libraryAttributes.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    setLibraryAttributes(next);
    persistState({ libraryAttributes: next });
    return true;
  };
  // Global showcase type: the definition controls how linked products render.
  // Individual products still choose which attributes/values they offer.
  const setLibraryDisplayType = (
    id: string,
    displayType: LibraryAttribute['displayType']
  ) => {
    if (!canPerformAction('products')) return false;
    const target = libraryAttributes.find((a) => a.id === id);
    if (!target) return false;
    const normalized = normalizeAttributeDisplayType(displayType);
    if (target.displayType === normalized) return true;
    const next = libraryAttributes.map((a) =>
      a.id === id ? { ...a, displayType: normalized } : a
    );
    setLibraryAttributes(next);
    persistState({ libraryAttributes: next });
    return true;
  };
  // Global visibility (X1a): one definition controls every product using it.
  // Refusing the last surface keeps at least one render target alive.
  const setLibraryVisibility = (
    id: string,
    surface: 'pdp' | 'checkout' | 'admin',
    on: boolean
  ) => {
    if (!canPerformAction('products')) return false;
    const target = libraryAttributes.find((a) => a.id === id);
    if (!target) return false;
    const nextTarget: LibraryAttribute = {
      ...target,
      ...(surface === 'pdp'
        ? { showOnPdp: on }
        : surface === 'checkout'
          ? { showOnCheckout: on }
          : { showOnAdmin: on }),
    };
    if (!nextTarget.showOnPdp && !nextTarget.showOnCheckout && !nextTarget.showOnAdmin) {
      showToast({
        type: 'warning',
        title: 'Visibility Required',
        description: `"${target.name}" must show on at least one surface.`,
      });
      return false;
    }
    const next = libraryAttributes.map((a) => (a.id === id ? nextTarget : a));
    setLibraryAttributes(next);
    persistState({ libraryAttributes: next });
    return true;
  };
  const addLibraryValue = (id: string, value: string) => {
    if (!canPerformAction('products')) return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    const target = libraryAttributes.find((a) => a.id === id);
    if (!target) return false;
    if (target.values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      showToast({ type: 'warning', title: 'Duplicate Value', description: `"${trimmed}" is already a ${target.name} value.` });
      return false;
    }
    const next = libraryAttributes.map((a) =>
      a.id === id ? { ...a, values: [...a.values, trimmed] } : a
    );
    setLibraryAttributes(next);
    persistState({ libraryAttributes: next });
    return true;
  };
  const removeLibraryValue = (id: string, value: string) => {
    if (!canPerformAction('products')) return false;
    const target = libraryAttributes.find((a) => a.id === id);
    if (!target) return false;
    const usedBy = libraryUsedBy(id, value);
    if (usedBy) {
      showToast({ type: 'warning', title: 'Value In Use', description: `"${value}" is linked by ${usedBy} — remove it there first.` });
      return false;
    }
    const next = libraryAttributes.map((a) =>
      a.id === id ? { ...a, values: a.values.filter((v) => v !== value) } : a
    );
    setLibraryAttributes(next);
    persistState({ libraryAttributes: next });
    return true;
  };

  // Blog authoring (demo-backed model mirrors 006-cms.sql):
  // validation/normalization live in one seam, so the editor and state
  // cannot drift. Publishes snapshot a revision; slug changes on published
  // posts append history for future 301 redirects.
  const saveBlogPost = (
    draft: BlogDraft,
    mode: 'draft' | 'publish'
  ): { ok: boolean; errors?: Partial<Record<keyof BlogDraft | 'content', string>> } => {
    if (!canPerformAction('cms')) return { ok: false };
    const validation = validateBlogDraft(draft, {
      mode,
      posts: blogPosts,
      categories: blogCategories,
      authors: blogAuthors,
      tags: blogTags,
      media: blogMedia,
    });
    if (!validation.ok) return { ok: false, errors: validation.errors };

    const now = new Date().toISOString();
    const existing = draft.id ? blogPosts.find((p) => p.id === draft.id) : undefined;
    const slugChanged = Boolean(existing && existing.slug !== validation.draft.slug);

    if (slugChanged && existing) {
      const retired = existing.slug;
      const target = validation.draft.slug;
      if (
        (existing.status === 'published' || existing.status === 'archived') &&
        blogSlugHistory.some(
          (entry) => entry.slug.toLowerCase() === target.toLowerCase() && entry.blogId !== existing.id
        )
      ) {
        return {
          ok: false,
          errors: { slug: 'This slug was previously used by another article.' },
        };
      }
    }

    if (!existing) {
      const id = nextBlogId(blogPosts);
      const next: BlogPost = {
        ...validation.draft,
        id,
        contentText: validation.contentText,
        readingTimeMinutes: validation.readingTimeMinutes,
        inlineMediaIds: validation.inlineMediaIds,
        version: 1,
        createdBy: activeRole,
        updatedBy: activeRole,
        createdAt: now,
        updatedAt: now,
      };
      const nextPosts = [next, ...blogPosts];
      let nextRevisions = blogRevisions;
      if (mode === 'publish') {
        const { id: _postId, createdAt: _createdAt, updatedAt: _updatedAt, version: _version, inlineMediaIds: _mediaIds, ...snapshot } = next;
        nextRevisions = [
          {
            id: `BREV-${Date.now()}-${id}`,
            blogId: id,
            revisionNo: 1,
            title: next.title,
            snapshot,
            createdBy: activeRole,
            createdAt: now,
          },
          ...blogRevisions,
        ];
      }
      setBlogPosts(nextPosts);
      setBlogRevisions(nextRevisions);
      persistState({ blogPosts: nextPosts, blogRevisions: nextRevisions });
      showToast({
        type: 'success',
        title: mode === 'publish' ? 'Article Published' : 'Draft Saved',
        description: `"${next.title}" saved to the editorial journal.`,
      });
      return { ok: true };
    }

    const next: BlogPost = {
      ...existing,
      ...validation.draft,
      id: existing.id,
      contentText: validation.contentText,
      readingTimeMinutes: validation.readingTimeMinutes,
      inlineMediaIds: validation.inlineMediaIds,
      version: existing.version + 1,
      createdAt: existing.createdAt,
      updatedAt: now,
      updatedBy: activeRole,
    };
    const nextPosts = blogPosts.map((p) => (p.id === existing.id ? next : p));
    let nextRevisions = blogRevisions;
    let nextSlugHistory = blogSlugHistory;

    if (
      slugChanged &&
      (existing.status === 'published' || existing.status === 'archived') &&
      !blogSlugHistory.some((entry) => entry.slug.toLowerCase() === existing.slug.toLowerCase())
    ) {
      nextSlugHistory = [
        {
          slug: existing.slug,
          blogId: existing.id,
          retiredAt: now,
        },
        ...blogSlugHistory,
      ];
    }

    if (mode === 'publish') {
      const { id: _postId, createdAt: _createdAt, updatedAt: _updatedAt, version: _version, inlineMediaIds: _mediaIds, ...snapshot } = next;
      nextRevisions = [
        {
          id: `BREV-${Date.now()}-${next.id}`,
          blogId: next.id,
          revisionNo: nextRevisionNo(blogRevisions, next.id),
          title: next.title,
          snapshot,
          createdBy: activeRole,
          createdAt: now,
        },
        ...blogRevisions,
      ];
    }

    setBlogPosts(nextPosts);
    setBlogRevisions(nextRevisions);
    setBlogSlugHistory(nextSlugHistory);
    persistState({
      blogPosts: nextPosts,
      blogRevisions: nextRevisions,
      blogSlugHistory: nextSlugHistory,
    });
    showToast({
      type: 'success',
      title: mode === 'publish' ? 'Article Published' : 'Draft Saved',
      description: `"${next.title}" updated in the editorial journal.`,
    });
    return { ok: true };
  };

  const deleteBlogPost = (id: string) => {
    if (!canPerformAction('cms')) return false;
    const target = blogPosts.find((post) => post.id === id);
    if (!target) return false;
    if (target.status === 'published' || target.status === 'scheduled') {
      showToast({
        type: 'warning',
        title: 'Use Archive Instead',
        description: 'Published and scheduled articles should be archived, not deleted.',
      });
      return false;
    }
    const next = blogPosts.filter((post) => post.id !== id);
    setBlogPosts(next);
    persistState({ blogPosts: next });
    showToast({
      type: 'info',
      title: 'Draft Deleted',
      description: `"${target.title}" removed from the editorial journal.`,
    });
    return true;
  };

  const archiveBlogPost = (id: string) => {
    if (!canPerformAction('cms')) return false;
    const target = blogPosts.find((post) => post.id === id);
    if (!target || target.status === 'archived') return false;
    const next = blogPosts.map((post) =>
      post.id === id
        ? {
            ...post,
            status: 'archived' as const,
            version: post.version + 1,
            updatedAt: new Date().toISOString(),
            updatedBy: activeRole,
          }
        : post
    );
    setBlogPosts(next);
    persistState({ blogPosts: next });
    showToast({
      type: 'info',
      title: 'Article Archived',
      description: `"${target.title}" is no longer live on the storefront.`,
    });
    return true;
  };

  const restoreBlogRevision = (revisionId: string) => {
    if (!canPerformAction('cms')) return false;
    const revision = blogRevisions.find((r) => r.id === revisionId);
    if (!revision) return false;
    const target = blogPosts.find((post) => post.id === revision.blogId);
    if (!target) return false;
    const now = new Date().toISOString();
    const next: BlogPost = {
      ...target,
      ...revision.snapshot,
      id: target.id,
      version: target.version + 1,
      createdAt: target.createdAt,
      updatedAt: now,
      updatedBy: activeRole,
    };
    const nextPosts = blogPosts.map((post) => (post.id === target.id ? next : post));
    setBlogPosts(nextPosts);
    persistState({ blogPosts: nextPosts });
    showToast({
      type: 'success',
      title: 'Revision Restored',
      description: `Revision ${revision.revisionNo} copied into a new draft version.`,
    });
    return true;
  };

  const createBlogTag = (name: string): string | false => {
    if (!canPerformAction('cms')) return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (blogTags.some((tag) => tag.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast({
        type: 'warning',
        title: 'Duplicate Tag',
        description: `"${trimmed}" already exists in the editorial tag library.`,
      });
      return false;
    }
    const id = `BTAG-${Date.now()}`;
    const next = [...blogTags, { id, name: trimmed, slug: slugify(trimmed) || 'tag' }];
    setBlogTags(next);
    persistState({ blogTags: next });
    return id;
  };

  const createBlogCategory = (name: string): string | false => {
    if (!canPerformAction('cms')) return false;
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (blogCategories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast({
        type: 'warning',
        title: 'Duplicate Category',
        description: `"${trimmed}" already exists as an editorial category.`,
      });
      return false;
    }
    const id = `BCAT-${Date.now()}`;
    const next = [
      ...blogCategories,
      {
        id,
        name: trimmed,
        slug: slugify(trimmed) || 'category',
        sortOrder: blogCategories.length,
        isActive: true,
      },
    ];
    setBlogCategories(next);
    persistState({ blogCategories: next });
    return id;
  };

  const setScenario = (sc: DemoScenario) => {
    setScenarioState(sc);
    if (sc === 'empty') {
      setProducts([]);
      setOrders([]);
      setShipments([]);
      setRefunds([]);
      setReturns([]);
      setCustomers([]);
      setSupportTickets([]);
      setSimulatedError(null);
      showToast({
        type: 'info',
        title: 'Scenario: Empty State Active',
        description: 'Dataset cleared to test empty states and zero-data recovery actions.',
      });
    } else if (sc === 'error') {
      setSimulatedError('Operational Service Interruption: POD Gateway Timeout HTTP 504 on Tiruppur print router.');
      showToast({
        type: 'error',
        title: 'Scenario: Simulated Error Active',
        description: 'Simulating partner webhook failure and operational exception banners.',
      });
    } else if (sc === 'long_content') {
      setProducts(
        initialProducts.map((p) => ({
          ...p,
          name: `${p.name} — Limited Architectural Archival Collector Edition With Double-Reinforced Coverstitching And High-Tenacity Organic Weave`,
          description: `${p.description} This garment incorporates multi-generational weaving techniques developed across the Kaveri basin, tested through rigorous industrial wash trials to guarantee zero shrinkage, no twisting along side seams, and complete tactile permanence over decades of intentional daily rotation.`,
        }))
      );
      setOrders(
        initialOrders.map((o) => ({
          ...o,
          customerName: `${o.customerName} (Senior Architectural Textile Conservator & Brand Ambassador)`,
          shippingAddress: `${o.shippingAddress}, Building 4C Wing South, Floor 14 Penthouse Suite, Metropolitan Heritage Enclave`,
        }))
      );
      setSimulatedError(null);
      showToast({
        type: 'info',
        title: 'Scenario: Long Content Active',
        description: 'Products and orders populated with extended multiline strings to verify layout wrapping.',
      });
    } else if (sc === 'normal') {
      setProducts(initialProducts);
      setOrders(initialOrders);
      setShipments(initialShipments);
      setRefunds(initialRefunds);
      setReturns(initialReturns);
      setCustomers(initialCustomers);
      setSupportTickets(initialSupportTickets);
      setCollections(initialCollections);
      setDesigns(initialDesigns);
      setTeam(initialTeam);
      setSettings(initialSettings);
      setStockMovements(initialStockMovements);
      setDiscountCodes(initialDiscountCodes);
      setAbandonedCarts(initialAbandonedCarts);
      setSizeCharts(initialSizeCharts);
      setLibraryAttributes(initialLibraryAttributes);
      setBlogCategories(initialBlogCategories);
      setBlogAuthors(initialBlogAuthors);
      setBlogTags(initialBlogTags);
      setBlogMedia(initialBlogMedia);
      setBlogPosts(initialBlogPosts);
      setBlogRevisions(initialBlogRevisions);
      setBlogSlugHistory(initialBlogSlugHistory);
      setSimulatedError(null);
      showToast({
        type: 'success',
        title: 'Scenario: Normal Baseline Active',
        description: 'Restored standard deterministic dataset.',
      });
    }
  };

  const retryConnection = () => {
    setSimulatedError(null);
    setScenario('normal');
    showToast({
      type: 'success',
      title: 'Connection Restored',
      description: 'Partner API services reconnected successfully.',
    });
  };

  const resetDemoData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      // search frequent counts live outside the demo snapshot (see search/useFrequentQueries)
      localStorage.removeItem('tuw_search_frequent');
    } catch {
      // storage clear
    }
    setActiveRoleState('Owner');
    setScenarioState('normal');
    setSimulatedError(null);
    setProducts(initialProducts);
    setOrders(initialOrders);
    setShipments(initialShipments);
    setRefunds(initialRefunds);
    setReturns(initialReturns);
    setCustomers(initialCustomers);
    setSupportTickets(initialSupportTickets);
    setCollections(initialCollections);
    setDesigns(initialDesigns);
    setTeam(initialTeam);
    setSettings(initialSettings);
    setStockMovements(initialStockMovements);
    setDiscountCodes(initialDiscountCodes);
    setAbandonedCarts(initialAbandonedCarts);
    setSizeCharts(initialSizeCharts);
    setLibraryAttributes(initialLibraryAttributes);
    setBlogCategories(initialBlogCategories);
    setBlogAuthors(initialBlogAuthors);
    setBlogTags(initialBlogTags);
    setBlogMedia(initialBlogMedia);
    setBlogPosts(initialBlogPosts);
    setBlogRevisions(initialBlogRevisions);
    setBlogSlugHistory(initialBlogSlugHistory);

    showToast({
      type: 'info',
      title: 'Demo Data Reset',
      description: 'All local modifications cleared; restored deterministic fixtures.',
    });
  };

  return (
    <AdminStateContext.Provider
      value={{
        activeRole,
        setActiveRole,
        canPerformAction,
        scenario,
        setScenario,
        simulatedError,
        retryConnection,
        products,
        orders,
        shipments,
        refunds,
        returns,
        customers,
        supportTickets,
        collections,
        designs,
        team,
        settings,
        stockMovements,
        discountCodes,
        abandonedCarts,
        sizeCharts,
        libraryAttributes,
        blogCategories,
        blogAuthors,
        blogTags,
        blogMedia,
        blogPosts,
        blogRevisions,
        blogSlugHistory,
        toasts,
        showToast,
        dismissToast,
        createProduct,
        createProducts,
        updateProduct,
        deleteProduct,
        createOrder,
        updateOrderStatus,
        retryFulfillment,
        createShipment,
        issueRefund,
        updateReturnStatus,
        addCustomerNote,
        createCustomer,
        sendSupportReply,
        createCollection,
        updateCollection,
        deleteCollection,
        uploadDesignAsset,
        inviteTeamMember,
        removeTeamMember,
        updateSettings,
        createDiscountCode,
        toggleDiscountCode,
        deleteDiscountCode,
        remindAbandonedCart,
        createSizeChart,
        deleteSizeChart,
        addSizeChartRow,
        removeSizeChartRow,
        patchSizeChartCell,
        createLibraryAttribute,
        deleteLibraryAttribute,
        toggleLibraryAttribute,
        setLibraryDisplayType,
        setLibraryVisibility,
        addLibraryValue,
        removeLibraryValue,
        saveBlogPost,
        deleteBlogPost,
        archiveBlogPost,
        restoreBlogRevision,
        createBlogTag,
        createBlogCategory,
        resetDemoData,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
          maxWidth: 380,
          width: 'calc(100% - 48px)',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
              borderLeft: `4px solid ${
                toast.type === 'success'
                  ? 'var(--tuw-text-success, #187343)'
                  : toast.type === 'error'
                  ? 'var(--tuw-text-error, #C91818)'
                  : toast.type === 'warning'
                  ? 'var(--tuw-text-warning, #856300)'
                  : 'var(--tuw-action-primary, #7539FF)'
              }`,
              borderRadius: 'var(--tuw-radius-control, 8px)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '14px 16px',
              borderTop: '1px solid var(--tuw-border-subtle, #E5E7EB)',
              borderRight: '1px solid var(--tuw-border-subtle, #E5E7EB)',
              borderBottom: '1px solid var(--tuw-border-subtle, #E5E7EB)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              animation: 'slideInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                {toast.title}
              </div>
              {toast.description && (
                <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 2 }}>
                  {toast.description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--tuw-text-secondary, #5D6772)',
                cursor: 'pointer',
                padding: 2,
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </AdminStateContext.Provider>
  );
}

export function useAdminState() {
  const context = useContext(AdminStateContext);
  if (!context) {
    throw new Error('useAdminState must be used within an AdminStateProvider');
  }
  return context;
}
