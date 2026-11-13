'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSiteSettings } from '@storefront/lib/site-settings';
import { Toaster, toast as sonnerToast } from 'sonner';
import BrandToast, { type BrandToastProps } from '@storefront/components/ui/BrandToast';

// Every storefront toast uses the branded card.
const showToast = (props: Omit<BrandToastProps, 'id'>) =>
  sonnerToast.custom((id) => <BrandToast id={id} {...props} />);
import {
  Product,
  CartItem,
  Order,
  ReturnRequest,
  Address,
  DemoScenario,
} from '@storefront/lib/types';
import { INITIAL_ORDERS, toLongContentProducts } from './fixtures';
import { useBag } from '@storefront/lib/bag';
import { previewDiscountAction } from '@/server/order-actions';
import { formatPaise } from '@storefront/lib/format';
import type { DiscountRule } from '@tuw/heart/modules/orders';
import type { Collection, SizeChartData } from '@storefront/lib/types';
import type { Navigation } from '@/server/nav';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface StoreContextType {
  // Scenario & Testing Controls
  scenario: DemoScenario;
  setScenario: (scenario: DemoScenario) => void;
  simulatedError: string | null;
  retryConnection: () => void;

  // Products (from the database via the root layout — TL-BE-05)
  products: Product[];
  collections: Collection[];
  hiddenCategories: string[];
  sizeCharts: SizeChartData[];
  getProductBySlug: (slug: string) => Product | undefined;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, qty: number) => void;
  /** Change a bag line's colour/size; merges with an identical line if one exists. */
  updateCartItemVariant: (id: string, changes: { color?: string; size?: string; image?: string }) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  promoCode: string;
  discountAmount: number;
  applyPromoCode: (code: string) => Promise<boolean>;
  removePromoCode: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;

  // Wishlist
  wishlist: string[]; // product IDs
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Orders
  orders: Order[];
  createOrder: (orderData: {
    items: CartItem[];
    subtotalINR: number;
    shippingINR: number;
    discountINR: number;
    totalINR: number;
    shippingAddress: Address;
    paymentMethod: 'UPI' | 'Card' | 'COD (Demo)';
    deliverySpeed?: 'standard' | 'express';
  }) => Order;
  getOrderById: (orderId: string) => Order | undefined;
  getOrderByNumber: (orderNumber: string) => Order | undefined;

  // Returns
  returns: ReturnRequest[];
  submitReturnRequest: (req: Omit<ReturnRequest, 'id' | 'createdAt' | 'status'>) => void;


  // Search & Global filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Reset Demo
  resetStoreData: () => void;

  /** Reload the bag and wishlist from the database (after an order is placed). */
  refreshBag: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

// YYYY-MM-DD in the shopper's own time zone (toISOString would give the UTC
// date, which is still "yesterday" in India until 05:30).
const localDate = (d: Date) => d.toLocaleDateString('en-CA');

export function StoreProvider({ children, catalog, nav, session }: { children: React.ReactNode; session?: unknown; catalog: { products: Product[]; collections: Collection[]; sizeCharts: SizeChartData[] }; nav: Navigation }) {
  const STORE_PRODUCTS = catalog.products;
  // Fees come from admin Settings (store_settings). The bag and wishlist
  // live in the database (useBag); promo codes and orders are still demo.
  const { shipping } = useSiteSettings();
  const FREE_SHIPPING_THRESHOLD = shipping.freeThresholdPaise / 100;
  const STANDARD_SHIPPING_FEE = shipping.standardFeePaise / 100;
  const [scenario, setScenarioState] = useState<DemoScenario>('normal');
  const [simulatedError, setSimulatedError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(STORE_PRODUCTS);
  // A fresh catalog (admin edit → revalidated layout) replaces the baseline.
  useEffect(() => {
    if (scenario === 'normal') setProducts(catalog.products);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.products]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoRule, setPromoRule] = useState<DiscountRule | null>(null);
  const [promoMinPaise, setPromoMinPaise] = useState<number | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  // Load from localStorage with schema version tuw_website_v5 (v4: product photos became
  // illustrations; v5: the demo customer changed, so saved orders and addresses for the
  // previous customer are dropped). Older keys are ignored.
  useEffect(() => {
    try {
      // The bag and wishlist moved to the database; drop the old copies.
      localStorage.removeItem('tuw_website_v5_cart');
      localStorage.removeItem('tuw_website_v5_wishlist');

      const savedOrders = localStorage.getItem('tuw_website_v5_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedReturns = localStorage.getItem('tuw_website_v5_returns');
      if (savedReturns) setReturns(JSON.parse(savedReturns));

    } catch (e) {
      console.error('Failed to load storefront state from localStorage', e);
    } finally {
      setHasLoadedStorage(true);
    }
  }, []);

  // Save to localStorage with schema version tuw_website_v5
  useEffect(() => {
    if (!hasLoadedStorage) return;
    try {
      localStorage.setItem('tuw_website_v5_orders', JSON.stringify(orders));
      localStorage.setItem('tuw_website_v5_returns', JSON.stringify(returns));
    } catch (e) {
      console.error('Failed to save storefront state to localStorage', e);
    }
  }, [orders, returns, hasLoadedStorage]);

  const lastToastRef = useRef<{ key: string; time: number } | null>(null);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const key = `${toast.title}:${toast.description || ''}`;
    const now = Date.now();
    if (lastToastRef.current && lastToastRef.current.key === key && now - lastToastRef.current.time < 800) {
      return;
    }
    lastToastRef.current = { key, time: now };

    // Rendered by Sonner's <Toaster> below (brand-styled, stacked, swipe-to-dismiss).
    showToast({ title: toast.title, description: toast.description, tone: toast.type });
  }, []);

  const dismissToast = useCallback((id: string) => {
    sonnerToast.dismiss(id);
  }, []);

  // Bag and wishlist from the database.
  const bag = useBag({ session, onError: (title, message) => showToast({ title, description: message, tone: 'error' }) });
  const { cart, wishlist, updateQuantity, updateCartItemVariant, clearCart } = bag;

  const addToCart = useCallback((item: Omit<CartItem, 'id'>) => {
    void bag.addToCart(item);
    // Opening the bag drawer is the confirmation; a toast on top of it would cover the checkout button.
    setIsCartDrawerOpen(true);
  }, [bag.addToCart]);

  const removeFromCart = useCallback((id: string) => {
    const item = cart.find((i) => i.id === id);
    void bag.removeLine(id).then((ok) => {
      if (ok && item) addToast({ type: 'info', title: 'Removed from Bag', description: `${item.title} was removed.` });
    });
  }, [cart, bag.removeLine, addToast]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.priceINR * item.quantity, 0);
  // Same rule the server applies; shown here, recomputed at checkout.
  const subtotalPaise = Math.round(cartSubtotal * 100);
  const discountPaise = !promoRule || (promoMinPaise !== null && subtotalPaise < promoMinPaise) ? 0
    : promoRule.type === 'percent' ? Math.round((subtotalPaise * promoRule.percent) / 100) : Math.min(subtotalPaise, promoRule.paise);
  const discountAmount = discountPaise / 100;
  const eligibleSubtotal = cartSubtotal - discountAmount;
  const shippingFee = cartSubtotal === 0 || eligibleSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - eligibleSubtotal);

  /** Checked on the server against the bag; the order total is decided again at checkout. */
  const applyPromoCode = async (code: string): Promise<boolean> => {
    const result = await previewDiscountAction({ code });
    if (result.ok) {
      setPromoCode(result.data.code);
      setPromoRule(result.data.rule);
      setPromoMinPaise(result.data.minOrderPaise);
      addToast({ type: 'success', title: 'Code applied', description: `${result.data.code} takes ${formatPaise(result.data.discountPaise)} off this bag.` });
      return true;
    }
    addToast({ type: 'error', title: 'Code not applied', description: result.error.message });
    return false;
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoRule(null);
    setPromoMinPaise(null);
  };

  // Wishlist: customers only, so a guest's heart asks them to sign in.
  const toggleWishlist = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId);
    const name = product?.title ?? 'This piece';
    const image = product?.images[0]?.url;
    if (!bag.signedIn) {
      const next = typeof window === 'undefined' ? '/' : window.location.pathname;
      showToast({ title: 'Sign in to save pieces', description: 'Your wishlist is kept with your account.', image, tone: 'info', action: { label: 'Sign in', href: `/login?next=${encodeURIComponent(next)}` } });
      return;
    }
    const isCurrentlySaved = wishlist.includes(productId);
    void bag.setSaved(productId, !isCurrentlySaved).then((ok) => {
      if (!ok) return;
      if (isCurrentlySaved) {
        showToast({ title: 'Removed from wishlist', description: name, image, tone: 'info', action: { label: 'Undo', onClick: () => void bag.setSaved(productId, true) } });
      } else {
        showToast({ title: 'Saved to wishlist', description: name, image, action: { label: 'View', href: '/wishlist' } });
      }
    });
  }, [wishlist, products, bag.signedIn, bag.setSaved]);

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  // Orders
  const createOrder = (orderData: {
    items: CartItem[];
    subtotalINR: number;
    shippingINR: number;
    discountINR: number;
    totalINR: number;
    shippingAddress: Address;
    paymentMethod: 'UPI' | 'Card' | 'COD (Demo)';
    deliverySpeed?: 'standard' | 'express';
  }): Order => {
    // Order numbers must stay unique, or tracking would find an older order.
    const taken = new Set(orders.map((o) => o.orderNumber));
    let orderNumber = '';
    do {
      orderNumber = `TUW-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (taken.has(orderNumber));
    const isCashOnDelivery = orderData.paymentMethod === 'COD (Demo)';
    const isExpress = orderData.deliverySpeed === 'express';
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      date: localDate(new Date()),
      status: 'Confirmed',
      // Payment and fulfilment are tracked separately: COD is collected on delivery.
      paymentStatus: isCashOnDelivery ? 'pending' : 'paid',
      fulfillmentStatus: 'queued',
      items: orderData.items,
      subtotalINR: orderData.subtotalINR,
      shippingINR: orderData.shippingINR,
      discountINR: orderData.discountINR,
      totalINR: orderData.totalINR,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      trackingNumber: `EXP-${Math.floor(100000000 + Math.random() * 900000000)}`,
      carrier: isExpress ? 'BlueDart Air Priority Express' : 'Delhivery Surface',
      estimatedDelivery: localDate(new Date(Date.now() + (isExpress ? 3 : 5) * 86400000)),
      trackingEvents: [
        {
          date: localDate(new Date()),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Order Placed',
          location: 'TUW Master Studio',
          description: isCashOnDelivery
            ? 'Cash on delivery order placed and added to the print queue.'
            : 'Payment verified and print queue allocated.',
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    // A promo applies to one order only.
    removePromoCode();
    return newOrder;
  };

  const getOrderById = (id: string) => orders.find((o) => o.id === id);
  const getOrderByNumber = (num: string) =>
    orders.find((o) => o.orderNumber.toLowerCase() === num.trim().toLowerCase());

  // Returns
  const submitReturnRequest = (req: Omit<ReturnRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReturn: ReturnRequest = {
      ...req,
      id: `ret-${Date.now()}`,
      status: 'Requested',
      createdAt: localDate(new Date()),
    };
    setReturns((prev) => [newReturn, ...prev]);
    addToast({
      type: 'success',
      title: 'Return Requested',
      description: `RMA request logged for Order ${req.orderNumber}. We will schedule courier pickup.`,
    });
  };

  // Addresses live in the real address book now (storefront/lib/account, TL-BE-03).

  const getProductBySlug = (slug: string) =>
    products.find(
      (p) =>
        p.slug.toLowerCase() === slug.toLowerCase() ||
        p.aliases?.some((a) => a.toLowerCase() === slug.toLowerCase())
    );

  const setScenario = (sc: DemoScenario) => {
    setScenarioState(sc);
    if (sc === 'empty') {
      setProducts([]);
      setOrders([]);
      // The bag and wishlist are real now (database); scenarios leave them alone.
      setSimulatedError(null);
      addToast({
        type: 'info',
        title: 'Scenario: Empty State Active',
        description: 'Storefront catalog and order history cleared to test zero-data states.',
      });
    } else if (sc === 'error') {
      setSimulatedError('Simulated CDN Disconnect: Origin Gateway Timeout HTTP 504.');
      addToast({
        type: 'error',
        title: 'Scenario: Simulated Error Active',
        description: 'Simulating edge network disruption and recovery flows.',
      });
    } else if (sc === 'long_content') {
      setProducts(toLongContentProducts(STORE_PRODUCTS));
      setSimulatedError(null);
      addToast({
        type: 'info',
        title: 'Scenario: Long Content Active',
        description: 'Loaded long multiline product titles and extensive details.',
      });
    } else if (sc === 'normal') {
      setProducts(STORE_PRODUCTS);
      setOrders(INITIAL_ORDERS);
      setSimulatedError(null);
      addToast({
        type: 'success',
        title: 'Scenario: Normal Baseline Active',
        description: 'Restored deterministic storefront catalog.',
      });
    }
  };

  const retryConnection = () => {
    setSimulatedError(null);
    setScenario('normal');
    addToast({
      type: 'success',
      title: 'Connection Restored',
      description: 'Storefront connected to simulated services successfully.',
    });
  };

  const resetStoreData = () => {
    setScenarioState('normal');
    setSimulatedError(null);
    setProducts(STORE_PRODUCTS);
    // The bag and wishlist are real now (database); reset leaves them alone.
    setOrders(INITIAL_ORDERS);
    setReturns([]);
    setPromoCode('');
    setPromoRule(null);
    setPromoMinPaise(null);
    try {
      localStorage.removeItem('tuw_website_v5_cart');
      localStorage.removeItem('tuw_website_v5_wishlist');
      localStorage.removeItem('tuw_website_v5_orders');
      localStorage.removeItem('tuw_website_v5_returns');
      localStorage.removeItem('tuw_website_v5_addresses');
      localStorage.removeItem('tuw_website_v4_cart');
      localStorage.removeItem('tuw_website_v4_wishlist');
      localStorage.removeItem('tuw_website_v4_orders');
      localStorage.removeItem('tuw_website_v4_returns');
      localStorage.removeItem('tuw_website_v4_addresses');
      localStorage.removeItem('tuw_storefront_cart');
      localStorage.removeItem('tuw_storefront_wishlist');
      localStorage.removeItem('tuw_storefront_orders');
      localStorage.removeItem('tuw_storefront_returns');
      localStorage.removeItem('tuw_storefront_addresses');
    } catch (e) {
      console.error(e);
    }
    addToast({
      type: 'info',
      title: 'Storefront Demo Reset',
      description: 'All local changes reset to baseline deterministic fixtures.',
    });
  };

  return (
    <StoreContext.Provider
      value={{
        scenario,
        setScenario,
        simulatedError,
        retryConnection,
        products,
        collections: catalog.collections,
        hiddenCategories: nav.hiddenCategories,
        sizeCharts: catalog.sizeCharts,
        getProductBySlug,
        cart,
        addToCart,
        updateQuantity,
        updateCartItemVariant,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        shippingFee,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingRemaining,
        promoCode,
        discountAmount,
        applyPromoCode,
        removePromoCode,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        orders,
        createOrder,
        getOrderById,
        getOrderByNumber,
        returns,
        submitReturnRequest,
        searchQuery,
        setSearchQuery,
        toasts,
        addToast,
        dismissToast,
        resetStoreData,
        refreshBag: bag.refreshBag,
      }}
    >
      {children}

      {/* Small toasts near the top edge, over the announcement bar. */}
      <Toaster position="top-center" offset={{ top: 12 }} mobileOffset={{ top: 8 }} duration={3000} visibleToasts={3} gap={6} />
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
