'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  CartItem,
  Order,
  ReturnRequest,
  Address,
  DemoScenario,
} from '../lib/types';
import {
  STORE_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_ADDRESS,
  LONG_CONTENT_PRODUCTS,
} from './fixtures';

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

  // Products
  products: Product[];
  getProductBySlug: (slug: string) => Product | undefined;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  promoCode: string;
  discountAmount: number;
  applyPromoCode: (code: string) => boolean;
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
  }) => Order;
  getOrderById: (orderId: string) => Order | undefined;
  getOrderByNumber: (orderNumber: string) => Order | undefined;

  // Returns
  returns: ReturnRequest[];
  submitReturnRequest: (req: Omit<ReturnRequest, 'id' | 'createdAt' | 'status'>) => void;

  // Addresses
  addresses: Address[];
  saveAddress: (address: Address) => void;

  // Search & Global filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Reset Demo
  resetStoreData: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const FREE_SHIPPING_THRESHOLD = 3000;
const STANDARD_SHIPPING_FEE = 150;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenarioState] = useState<DemoScenario>('normal');
  const [simulatedError, setSimulatedError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(STORE_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([INITIAL_ADDRESS]);
  const [promoCode, setPromoCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  // Load from localStorage with schema version tuw_website_v2
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('tuw_website_v2_cart') || localStorage.getItem('tuw_storefront_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem('tuw_website_v2_wishlist') || localStorage.getItem('tuw_storefront_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      const savedOrders = localStorage.getItem('tuw_website_v2_orders') || localStorage.getItem('tuw_storefront_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedReturns = localStorage.getItem('tuw_website_v2_returns') || localStorage.getItem('tuw_storefront_returns');
      if (savedReturns) setReturns(JSON.parse(savedReturns));

      const savedAddresses = localStorage.getItem('tuw_website_v2_addresses') || localStorage.getItem('tuw_storefront_addresses');
      if (savedAddresses) setAddresses(JSON.parse(savedAddresses));
    } catch (e) {
      console.error('Failed to load storefront state from localStorage', e);
    } finally {
      setHasLoadedStorage(true);
    }
  }, []);

  // Save to localStorage with schema version tuw_website_v2
  useEffect(() => {
    if (!hasLoadedStorage) return;
    try {
      localStorage.setItem('tuw_website_v2_cart', JSON.stringify(cart));
      localStorage.setItem('tuw_website_v2_wishlist', JSON.stringify(wishlist));
      localStorage.setItem('tuw_website_v2_orders', JSON.stringify(orders));
      localStorage.setItem('tuw_website_v2_returns', JSON.stringify(returns));
      localStorage.setItem('tuw_website_v2_addresses', JSON.stringify(addresses));
    } catch (e) {
      console.error('Failed to save storefront state to localStorage', e);
    }
  }, [cart, wishlist, orders, returns, addresses, hasLoadedStorage]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cart operations
  const addToCart = useCallback((item: Omit<CartItem, 'id'>) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.color === item.color && i.size === item.size
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }

      const newItem: CartItem = {
        ...item,
        id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      return [...prev, newItem];
    });

    setIsCartDrawerOpen(true);
    addToast({
      type: 'success',
      title: 'Added to Bag',
      description: `${item.title} (${item.color}, Size ${item.size}) added to your bag.`,
    });
  }, [addToast]);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        addToast({
          type: 'info',
          title: 'Removed from Bag',
          description: `${item.title} was removed.`,
        });
      }
      return prev.filter((i) => i.id !== id);
    });
  }, [addToast]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.priceINR * item.quantity, 0);
  const discountAmount = Math.round((cartSubtotal * discountPercent) / 100);
  const eligibleSubtotal = cartSubtotal - discountAmount;
  const shippingFee = cartSubtotal === 0 || eligibleSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - eligibleSubtotal);

  const applyPromoCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'UNPLUGGED10' || clean === 'MINIMAL10') {
      setPromoCode(clean);
      setDiscountPercent(10);
      addToast({
        type: 'success',
        title: 'Promo Applied',
        description: '10% discount applied to your order.',
      });
      return true;
    }
    addToast({
      type: 'error',
      title: 'Invalid Promo Code',
      description: 'Code not recognized or expired. Try "UNPLUGGED10".',
    });
    return false;
  };

  const removePromoCode = () => {
    setPromoCode('');
    setDiscountPercent(0);
  };

  // Wishlist operations
  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const product = products.find((p) => p.id === productId);
      if (exists) {
        addToast({
          type: 'info',
          title: 'Removed from Wishlist',
          description: product ? `${product.title} removed.` : undefined,
        });
        return prev.filter((id) => id !== productId);
      } else {
        addToast({
          type: 'success',
          title: 'Saved to Wishlist',
          description: product ? `${product.title} saved to your wishlist.` : undefined,
        });
        return [...prev, productId];
      }
    });
  }, [products, addToast]);

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
  }): Order => {
    const num = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `TUW-${num}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      date: new Date().toISOString().split('T')[0],
      status: 'Confirmed',
      items: orderData.items,
      subtotalINR: orderData.subtotalINR,
      shippingINR: orderData.shippingINR,
      discountINR: orderData.discountINR,
      totalINR: orderData.totalINR,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      trackingNumber: `EXP-${Math.floor(100000000 + Math.random() * 900000000)}`,
      carrier: 'Delhivery Surface Express',
      estimatedDelivery: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      trackingEvents: [
        {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Order Placed',
          location: 'TUW Master Studio',
          description: 'Payment verified and print queue allocated.',
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
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
      createdAt: new Date().toISOString().split('T')[0],
    };
    setReturns((prev) => [newReturn, ...prev]);
    addToast({
      type: 'success',
      title: 'Return Requested',
      description: `RMA request logged for Order ${req.orderNumber}. We will schedule courier pickup.`,
    });
  };

  // Addresses
  const saveAddress = (address: Address) => {
    setAddresses((prev) => {
      const idx = prev.findIndex((a) => a.id === address.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = address;
        return updated;
      }
      return [...prev, address];
    });
    addToast({
      type: 'success',
      title: 'Address Saved',
      description: 'Your delivery address has been updated.',
    });
  };

  const getProductBySlug = (slug: string) =>
    products.find((p) => p.slug.toLowerCase() === slug.toLowerCase());

  const setScenario = (sc: DemoScenario) => {
    setScenarioState(sc);
    if (sc === 'empty') {
      setProducts([]);
      setOrders([]);
      setCart([]);
      setWishlist([]);
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
      setProducts(LONG_CONTENT_PRODUCTS);
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
    setCart([]);
    setWishlist([]);
    setOrders(INITIAL_ORDERS);
    setReturns([]);
    setAddresses([INITIAL_ADDRESS]);
    setPromoCode('');
    setDiscountPercent(0);
    try {
      localStorage.removeItem('tuw_website_v2_cart');
      localStorage.removeItem('tuw_website_v2_wishlist');
      localStorage.removeItem('tuw_website_v2_orders');
      localStorage.removeItem('tuw_website_v2_returns');
      localStorage.removeItem('tuw_website_v2_addresses');
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
        getProductBySlug,
        cart,
        addToCart,
        updateQuantity,
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
        addresses,
        saveAddress,
        searchQuery,
        setSearchQuery,
        toasts,
        addToast,
        dismissToast,
        resetStoreData,
      }}
    >
      {children}

      {/* Floating Storefront Toast Notifications */}
      {toasts.length > 0 && (
        <div
          role="region"
          aria-label="Notifications"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none',
            maxWidth: '380px',
          }}
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 18px',
                backgroundColor: '#1A1A1A',
                color: '#FFFFFF',
                borderRadius: '10px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'slideInRight 0.2s ease',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{toast.title}</div>
                {toast.description && (
                  <div style={{ fontSize: '13px', color: '#A0AEC0', marginTop: '2px', lineHeight: '18px' }}>
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss toast"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A0AEC0',
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: '1',
                  padding: '2px',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
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
