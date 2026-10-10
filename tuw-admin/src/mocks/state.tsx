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
} from './fixtures';

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
  canPerformAction: (actionCategory: 'orders' | 'products' | 'refunds' | 'team' | 'settings' | 'fulfillment') => boolean;

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

  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Mutations
  createProduct: (product: Omit<ProductItem, 'id' | 'soldCount' | 'rating'>) => boolean;
  updateProduct: (id: string, updates: Partial<ProductItem>) => boolean;
  deleteProduct: (id: string) => boolean;

  createOrder: (order: Omit<OrderItem, 'id' | 'date' | 'timeline' | 'paidAmount' | 'refundedAmount'>) => boolean;
  updateOrderStatus: (orderId: string, paymentStatus?: OrderItem['paymentStatus'], fulfillmentStatus?: OrderItem['fulfillmentStatus'], silent?: boolean) => boolean;
  retryFulfillment: (orderId: string) => Promise<boolean>;

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
  uploadDesignAsset: (asset: Omit<DesignAsset, 'id' | 'updatedAt'>) => boolean;

  inviteTeamMember: (member: Omit<TeamMember, 'id' | 'lastActive' | 'avatarBg'>) => boolean;
  removeTeamMember: (memberId: string) => boolean;

  updateSettings: (newSettings: Partial<StoreSettings>) => boolean;

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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeRole) setActiveRoleState(parsed.activeRole);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.shipments) setShipments(parsed.shipments);
        if (parsed.refunds) setRefunds(parsed.refunds);
        if (parsed.returns) setReturns(parsed.returns);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.supportTickets) setSupportTickets(parsed.supportTickets);
        if (parsed.collections) setCollections(parsed.collections);
        if (parsed.designs) setDesigns(parsed.designs);
        if (parsed.team) setTeam(parsed.team);
        if (parsed.settings) setSettings(parsed.settings);
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
          ...newState,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch {
        // Storage quota / privacy protection
      }
    },
    [activeRole, products, orders, shipments, refunds, returns, customers, supportTickets, collections, designs, team, settings]
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
  const canPerformAction = (actionCategory: 'orders' | 'products' | 'refunds' | 'team' | 'settings' | 'fulfillment'): boolean => {
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

  const createProduct = (p: Omit<ProductItem, 'id' | 'soldCount' | 'rating'>) => {
    if (!canPerformAction('products')) return false;
    const newProduct: ProductItem = {
      ...p,
      id: `PRD-${Math.floor(10 + Math.random() * 90)}`,
      soldCount: 0,
      rating: 5.0,
    };
    const next = [newProduct, ...products];
    setProducts(next);
    persistState({ products: next });
    showToast({
      type: 'success',
      title: 'Product Created',
      description: `"${p.name}" has been added to the local catalog.`,
    });
    return true;
  };

  const updateProduct = (id: string, updates: Partial<ProductItem>) => {
    if (!canPerformAction('products')) return false;
    const next = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProducts(next);
    persistState({ products: next });
    showToast({
      type: 'success',
      title: 'Product Updated',
      description: `Changes saved to local product record.`,
    });
    return true;
  };

  const deleteProduct = (id: string) => {
    if (!canPerformAction('products')) return false;
    const target = products.find((p) => p.id === id);
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    persistState({ products: next });
    showToast({
      type: 'info',
      title: 'Product Deleted',
      description: `Removed from active catalog dataset.`,
    });
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
    persistState({ orders: next });
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

  const retryFulfillment = async (orderId: string): Promise<boolean> => {
    if (!canPerformAction('fulfillment')) return false;
    // Simulate network delay
    showToast({
      type: 'info',
      title: 'Retrying Partner API Webhook',
      description: `Submitting order ${orderId} payload to print hub...`,
    });
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
    showToast({
      type: 'success',
      title: 'Fulfillment Retry Succeeded',
      description: `Order ${orderId} moved from submission_failed to printing queue.`,
    });
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
              note: `$${params.amount.toFixed(2)} refunded via ${params.method}. Reason: ${params.reason}`,
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
      description: `$${params.amount.toFixed(2)} refunded for ${params.orderId} via ${params.method}.`,
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
      id: `COL-${Math.floor(10 + Math.random() * 90)}`,
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
        toasts,
        showToast,
        dismissToast,
        createProduct,
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
        uploadDesignAsset,
        inviteTeamMember,
        removeTeamMember,
        updateSettings,
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
