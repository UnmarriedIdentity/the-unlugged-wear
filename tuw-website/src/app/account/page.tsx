'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import Badge from '@storefront/components/ui/Badge';
import Button from '@storefront/components/ui/Button';
import Input from '@storefront/components/ui/Input';
import Checkbox from '@storefront/components/ui/Checkbox';
import Modal from '@storefront/components/ui/Modal';
import Textarea from '@storefront/components/ui/Textarea';
import Select from '@storefront/components/ui/Select';
import ImageWithFallback from '@storefront/components/ui/ImageWithFallback';
import { useRouter } from 'next/navigation';
import { useStore } from '@storefront/mocks/store';
import { useSession } from '@storefront/lib/session';
import { useAccount } from '@storefront/lib/account';
import { useMyOrders } from '@storefront/lib/my-orders';
import AccountProfileSection from '@storefront/components/commerce/AccountProfileSection';
import { formatPaise, formatShortDate } from '@storefront/lib/format';
import { downloadInvoicePdf } from '@storefront/lib/invoice';
import { useSiteSettings } from '@storefront/lib/site-settings';
import type {
  Address,
  CartItem,
  Product,
  FulfillmentStatus,
  Order,
  PaymentStatus,
} from '@storefront/lib/types';
import {
  ChevronDown,
  Download,
  Heart,
  LogOut,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react';

type AccountSection = 'orders' | 'addresses' | 'returns' | 'profile';
type OrderFilter = 'all' | 'in_progress' | 'delivered' | 'issues';

const ORDERS_PAGE_SIZE = 6;
const RETURN_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Payment pending',
  failed: 'Payment failed',
  refunded: 'Refunded',
};

const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  queued: 'Queued for print',
  printing: 'Printing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  submission_failed: 'Print submission failed',
  cancelled: 'Cancelled',
};

// Fulfilment progress steps; queued orders sit on "Placed".
const PROGRESS_STEPS = ['Placed', 'Printing', 'Shipped', 'Delivered'] as const;
const PROGRESS_INDEX: Partial<Record<FulfillmentStatus, number>> = {
  queued: 0,
  printing: 1,
  shipped: 2,
  delivered: 3,
};

const ORDER_FILTERS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'issues', label: 'Refunds & issues' },
];

const ADDRESS_LABELS = ['Home', 'Work', 'Friend', 'Other'] as const;

type AddressForm = Omit<Address, 'id' | 'country'> & { id: string | null; otherLabel: string };

const EMPTY_ADDRESS_FORM: AddressForm = {
  id: null,
  label: 'Home',
  otherLabel: '',
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  isDefault: false,
};

const SECTIONS: { id: AccountSection; label: string; icon: typeof Package }[] = [
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'profile', label: 'Profile', icon: User },
];

const paymentOf = (order: Order): PaymentStatus => order.paymentStatus ?? 'paid';
const fulfillmentOf = (order: Order): FulfillmentStatus => order.fulfillmentStatus ?? 'queued';

const hasIssue = (order: Order) =>
  paymentOf(order) === 'failed' ||
  paymentOf(order) === 'refunded' ||
  fulfillmentOf(order) === 'submission_failed';

function matchesFilter(order: Order, filter: OrderFilter) {
  switch (filter) {
    case 'in_progress':
      return !hasIssue(order) && fulfillmentOf(order) !== 'delivered';
    case 'delivered':
      return fulfillmentOf(order) === 'delivered' && !hasIssue(order);
    case 'issues':
      return hasIssue(order);
    default:
      return true;
  }
}

// Money in integer paise. Order shipping/discount are stored in whole rupees.
const lineTotalPaise = (item: CartItem) =>
  (item.priceMinorINR ?? Math.round(item.priceINR * 100)) * item.quantity;
function orderPaise(order: Order) {
  const subtotal = order.items.reduce((sum, item) => sum + lineTotalPaise(item), 0);
  const shipping = order.shippingINR * 100;
  const discount = order.discountINR * 100;
  return { subtotal, shipping, discount, total: subtotal + shipping - discount };
}

// Catalogue photo for an order line; falls back to the image saved on the order.
function itemImage(item: CartItem, products: Product[]) {
  const product = products.find((p) => p.id === item.productId);
  const photo =
    product?.images.find((img) => img.color === item.color)?.url ?? product?.images[0]?.url;
  return photo || item.image;
}

// Returns open once delivered (estimated delivery date as the delivered day).
function returnWindow(order: Order) {
  if (fulfillmentOf(order) !== 'delivered' || hasIssue(order)) return null;
  const deliveredOn = new Date(order.estimatedDelivery ?? order.date);
  const closesOn = new Date(deliveredOn.getTime() + RETURN_WINDOW_DAYS * DAY_MS);
  const daysLeft = Math.ceil((closesOn.getTime() - Date.now()) / DAY_MS);
  return { closesOn, daysLeft };
}


function StatusPills({ order }: { order: Order }) {
  const payment = paymentOf(order);
  const fulfillment = fulfillmentOf(order);
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Badge variant={payment === 'failed' ? 'error' : payment === 'paid' ? 'outline' : 'neutral'}>
        {PAYMENT_LABELS[payment]}
      </Badge>
      <Badge
        variant={
          fulfillment === 'submission_failed' ? 'error' : fulfillment === 'delivered' ? 'dark' : 'neutral'
        }
      >
        {FULFILLMENT_LABELS[fulfillment]}
      </Badge>
    </span>
  );
}

function OrderProgress({ order }: { order: Order }) {
  const step = PROGRESS_INDEX[fulfillmentOf(order)];
  if (step === undefined || hasIssue(order)) {
    return (
      <p className="text-sm text-store-text-secondary border-l-2 border-store-terracotta pl-3">
        {fulfillmentOf(order) === 'submission_failed'
          ? 'We couldn’t send this order to print. Our team will contact you before anything is charged again.'
          : paymentOf(order) === 'refunded'
          ? 'This order was refunded and will not be printed.'
          : 'Payment didn’t go through, so this order is on hold.'}
      </p>
    );
  }
  return (
    <div>
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Order progress">
        {PROGRESS_STEPS.map((label, idx) => (
          <li key={label} aria-current={idx === step ? 'step' : undefined}>
            <span className={`block h-1 ${idx <= step ? 'bg-store-charcoal' : 'bg-store-card-border'}`} />
            <span
              className={`block mt-2 text-xs ${
                idx <= step ? 'text-store-charcoal font-medium' : 'text-store-text-secondary'
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
      {order.estimatedDelivery && fulfillmentOf(order) !== 'delivered' && (
        <p className="mt-3 text-xs text-store-text-secondary">
          Expected by {formatShortDate(order.estimatedDelivery)}
          {order.carrier ? ` · ${order.carrier}` : ''}
        </p>
      )}
    </div>
  );
}

export default function AccountPage() {
  const {
    returns,
    submitReturnRequest,
    addToast,
    resetStoreData,
    addToCart,
    wishlist,
    products,
  } = useStore();
  const router = useRouter();
  // AccountGate only renders this page once a demo session exists.
  const { session, signOut } = useSession();
  // Orders are real (TL-BE-08); returns are still demo until TL-BE-10.
  const { orders, claimable, claim } = useMyOrders();
  const [claimNote, setClaimNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const { supportEmail } = useSiteSettings();
  // Real address book, profile and household (TL-BE-03).
  const accountState = useAccount();
  const { addresses, saveAddress, deleteAddress, setDefaultAddress } = accountState;
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const accountName = session?.name ?? '';
  const accountEmail = session?.email ?? '';
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  const [activeSection, setActiveSection] = useState<AccountSection>('orders');

  // Orders list state
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [visibleCount, setVisibleCount] = useState(ORDERS_PAGE_SIZE);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(orders[0]?.id ?? null);
  const [buyAgainOrderId, setBuyAgainOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesFilter(order, orderFilter)),
    [orders, orderFilter]
  );
  const visibleOrders = filteredOrders.slice(0, visibleCount);
  const latestOrder = orders[0];

  // Address add/edit state. Form values stay in place if the dialog is reopened after a cancel.
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [addressPendingDelete, setAddressPendingDelete] = useState<Address | null>(null);
  const updateAddressForm = (patch: Partial<AddressForm>) => setAddressForm((f) => ({ ...f, ...patch }));

  const openNewAddress = () => {
    setAddressForm({
      ...EMPTY_ADDRESS_FORM,
      label: addresses.some((a) => a.label === 'Home') ? 'Work' : 'Home',
      fullName: accountName,
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddress = (addr: Address) => {
    const isPreset = (ADDRESS_LABELS as readonly string[]).includes(addr.label ?? '');
    setAddressForm({
      id: addr.id,
      label: isPreset ? addr.label : addr.label ? 'Other' : 'Home',
      otherLabel: isPreset ? '' : addr.label ?? '',
      fullName: addr.fullName,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      phone: addr.phone,
      isDefault: Boolean(addr.isDefault),
    });
    setIsAddressModalOpen(true);
  };

  // Return request state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrderNum, setReturnOrderNum] = useState(orders[0]?.orderNumber || '');
  const [returnItemTitle, setReturnItemTitle] = useState(orders[0]?.items[0]?.title || '');
  const [returnVariant, setReturnVariant] = useState(orders[0]?.items[0]?.size || 'L');
  const [returnReason, setReturnReason] = useState('Fit was too oversized');
  const [returnCondition, setReturnCondition] = useState('Unworn with original hangtags');

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressSaving) return;
    const { id, otherLabel, label, addressLine2, ...fields } = addressForm;
    setAddressSaving(true);
    setAddressError(null);
    void saveAddress({
      ...fields,
      id: id ?? 'new-address',
      label: label === 'Other' ? otherLabel.trim() || 'Other' : label,
      addressLine2: addressLine2?.trim() || undefined,
      country: 'India',
    }).then((outcome) => {
      setAddressSaving(false);
      // On failure the dialog stays open with every typed value.
      if (!outcome.ok) return setAddressError(outcome.message);
      setIsAddressModalOpen(false);
      addToast({ type: 'success', title: 'Address saved' });
    });
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    submitReturnRequest({
      orderNumber: returnOrderNum,
      itemTitle: returnItemTitle,
      variant: returnVariant,
      reason: returnReason,
      condition: returnCondition,
    });
    setIsReturnModalOpen(false);
  };

  const openReturnFor = (order: Order) => {
    setReturnOrderNum(order.orderNumber);
    setReturnItemTitle(order.items[0]?.title || '');
    setReturnVariant(order.items[0]?.size || 'L');
    setIsReturnModalOpen(true);
  };

  const handleBuyAgain = (order: Order) => {
    order.items.forEach(({ id: _id, ...item }) => addToCart(item));
    setBuyAgainOrderId(order.id);
    setTimeout(() => setBuyAgainOrderId(null), 2000);
  };

  const changeFilter = (filter: OrderFilter) => {
    setOrderFilter(filter);
    setVisibleCount(ORDERS_PAGE_SIZE);
  };

  const navItemClass = (isActive: boolean) =>
    `inline-flex lg:flex items-center gap-2.5 whitespace-nowrap px-4 lg:px-3 py-2.5 text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold ${
      isActive
        ? 'bg-store-charcoal text-white lg:bg-store-cream lg:text-store-charcoal lg:font-medium lg:border-l-2 lg:border-store-charcoal'
        : 'text-store-text-secondary hover:text-store-charcoal border border-store-border lg:border-0 lg:border-l-2 lg:border-transparent'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas text-store-text-primary">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'My account' },
          ]}
        />

        <div className="mt-6 mb-8 sm:mb-10">
          <h1 className="font-heading text-[clamp(1.75rem,3vw+0.5rem,2.5rem)] font-medium tracking-tight text-store-charcoal">
            My account
          </h1>
          <p className="text-sm text-store-text-secondary mt-1">
            Welcome back, {accountName} · {accountEmail}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-12">
          {/* Section navigation: sideways-scrolling row on phones, side menu on desktop */}
          <nav aria-label="Account sections" className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <ul className="flex lg:flex-col gap-2 lg:gap-0.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const count =
                  id === 'orders' ? orders.length : id === 'addresses' ? addresses.length : id === 'returns' ? returns.length : null;
                return (
                  <li key={id} className="shrink-0">
                    <button
                      type="button"
                      aria-current={activeSection === id ? 'page' : undefined}
                      onClick={() => setActiveSection(id)}
                      className={`${navItemClass(activeSection === id)} w-full rounded-full lg:rounded-none`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{label}</span>
                      {count !== null && (
                        <span className="ml-auto pl-2 text-xs opacity-70 tuw-tabular-nums">{count}</span>
                      )}
                    </button>
                  </li>
                );
              })}
              <li className="shrink-0">
                <Link href="/wishlist" className={`${navItemClass(false)} rounded-full lg:rounded-none`}>
                  <Heart size={16} aria-hidden="true" />
                  <span>Wishlist</span>
                  <span className="ml-auto pl-2 text-xs opacity-70 tuw-tabular-nums">{wishlist.length}</span>
                </Link>
              </li>
              <li className="shrink-0 lg:mt-4 lg:pt-4 lg:border-t lg:border-store-border">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`${navItemClass(false)} w-full rounded-full lg:rounded-none`}
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>Log out</span>
                </button>
              </li>
            </ul>
          </nav>

          <div className="min-w-0 space-y-8">
            {/* Overview */}
            <section aria-labelledby="overview-heading" className="grid grid-cols-1 md:grid-cols-3 border border-store-card-border bg-store-surface divide-y md:divide-y-0 md:divide-x divide-store-card-border">
              <h2 id="overview-heading" className="sr-only">Overview</h2>
              <div className="p-5 md:col-span-2 space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs uppercase tracking-wider text-store-text-secondary">Latest order</p>
                  {latestOrder && (
                    <Link
                      href={`/account/orders/${encodeURIComponent(latestOrder.orderNumber)}`}
                      className="text-sm font-medium text-store-charcoal underline underline-offset-4 decoration-store-gold hover:decoration-store-charcoal"
                    >
                      {latestOrder.orderNumber}
                    </Link>
                  )}
                </div>
                {latestOrder ? (
                  <OrderProgress order={latestOrder} />
                ) : (
                  <p className="text-sm text-store-text-secondary">No orders yet.</p>
                )}
              </div>
              <div className="p-5 space-y-2">
                <p className="text-xs uppercase tracking-wider text-store-text-secondary">Default address</p>
                {defaultAddress ? (
                  <p className="text-sm text-store-charcoal leading-relaxed">
                    {defaultAddress.label && (
                      <span className="text-xs uppercase tracking-wider text-store-text-secondary">{defaultAddress.label} · </span>
                    )}
                    {defaultAddress.fullName}
                    <br />
                    <span className="text-store-text-secondary">
                      {defaultAddress.addressLine1}, {defaultAddress.city} {defaultAddress.postalCode}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-store-text-secondary">No saved address.</p>
                )}
                <button
                  type="button"
                  onClick={() => setActiveSection('addresses')}
                  className="text-sm font-medium text-store-charcoal underline underline-offset-4 decoration-store-gold hover:decoration-store-charcoal cursor-pointer"
                >
                  Manage addresses
                </button>
              </div>
            </section>

            {/* ORDERS */}
            {activeSection === 'orders' && (
              <section aria-labelledby="orders-heading" className="space-y-5">
                {claimable.count > 0 && (
                  <div className="p-4 border border-store-card-border bg-store-cream text-sm text-store-charcoal space-y-2">
                    <p>
                      You have {claimable.count} order{claimable.count === 1 ? '' : 's'} placed as a guest with this email.
                      {claimable.verified ? ' Add them here to track and manage them.' : ' Verify your email first, so we know they are yours.'}
                    </p>
                    {claimable.verified && (
                      <Button
                        variant="dark"
                        size="sm"
                        disabled={claiming}
                        onClick={async () => {
                          setClaiming(true);
                          const result = await claim();
                          setClaiming(false);
                          setClaimNote({ ok: result.ok, text: result.message });
                        }}
                      >
                        {claiming ? 'Adding…' : 'Add them to my account'}
                      </Button>
                    )}
                  </div>
                )}
                {claimNote && (
                  <p role={claimNote.ok ? 'status' : 'alert'} className={`text-sm ${claimNote.ok ? 'text-store-charcoal' : 'text-red-700'}`}>{claimNote.text}</p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 id="orders-heading" className="font-heading text-xl font-medium text-store-charcoal">
                    Order history
                  </h2>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter orders">
                    {ORDER_FILTERS.map((filter) => {
                      const isActive = orderFilter === filter.id;
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => changeFilter(filter.id)}
                          className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold ${
                            isActive
                              ? 'bg-store-charcoal text-white'
                              : 'border border-store-border text-store-text-secondary hover:border-store-charcoal hover:text-store-charcoal'
                          }`}
                        >
                          {filter.label}
                          <span className="ml-1.5 opacity-70 tuw-tabular-nums">
                            {orders.filter((o) => matchesFilter(o, filter.id)).length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="py-16 text-center border border-store-card-border bg-store-surface p-8">
                    <p className="text-sm text-store-text-secondary">
                      {orders.length === 0 ? 'You haven’t placed any orders yet.' : 'No orders match this filter.'}
                    </p>
                    <div className="mt-4">
                      <Button variant="dark" size="sm" href="/shop">
                        Explore the collection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ul className="border border-store-card-border bg-store-surface divide-y divide-store-card-border">
                    {visibleOrders.map((order) => {
                      const isOpen = expandedOrderId === order.id;
                      const money = orderPaise(order);
                      const retWindow = returnWindow(order);
                      const panelId = `order-panel-${order.id}`;
                      return (
                        <li key={order.id}>
                          <h3>
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              aria-controls={panelId}
                              onClick={() => setExpandedOrderId(isOpen ? null : order.id)}
                              className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-store-canvas transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-store-gold"
                            >
                              <span className="flex -space-x-3 shrink-0" aria-hidden="true">
                                {order.items.slice(0, 2).map((item) => (
                                  <span key={item.id} className="block w-12 h-16 overflow-hidden bg-store-cream border-2 border-store-surface">
                                    <ImageWithFallback src={itemImage(item, products)} alt="" fallbackText="" className="w-full h-full object-cover" />
                                  </span>
                                ))}
                              </span>
                              <span className="flex-1 min-w-0 grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-store-charcoal">{order.orderNumber}</span>
                                  <span className="block text-xs text-store-text-secondary mt-0.5">
                                    {formatShortDate(order.date)} · {order.items.length} item{order.items.length === 1 ? '' : 's'} ·{' '}
                                    <span className="tuw-tabular-nums">{formatPaise(money.total)}</span>
                                  </span>
                                </span>
                                <StatusPills order={order} />
                              </span>
                              <ChevronDown
                                size={18}
                                aria-hidden="true"
                                className={`shrink-0 text-store-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                              />
                            </button>
                          </h3>

                          {isOpen && (
                            <div id={panelId} className="px-4 sm:px-5 pb-6 space-y-6">
                              <OrderProgress order={order} />

                              <ul className="divide-y divide-store-card-border border-y border-store-card-border">
                                {order.items.map((item) => (
                                  <li key={item.id} className="py-4 flex gap-4">
                                    <div className="w-16 h-20 overflow-hidden bg-store-cream shrink-0">
                                      <ImageWithFallback src={itemImage(item, products)} alt={item.title} fallbackText="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex justify-between gap-4">
                                      <div>
                                        <p className="text-sm font-medium text-store-charcoal">{item.title}</p>
                                        <p className="text-xs text-store-text-secondary mt-0.5">
                                          {item.color} · Size {item.size} · Qty {item.quantity}
                                        </p>
                                      </div>
                                      <span className="text-sm text-store-charcoal tuw-tabular-nums">
                                        {formatPaise(lineTotalPaise(item))}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>

                              <div className="grid gap-6 sm:grid-cols-2 text-sm">
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-store-text-secondary mb-1.5">Delivering to</p>
                                  <p className="text-store-charcoal leading-relaxed">
                                    {order.shippingAddress.fullName}
                                    <br />
                                    <span className="text-store-text-secondary">
                                      {order.shippingAddress.addressLine1}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
                                    </span>
                                  </p>
                                </div>
                                <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-store-text-secondary tuw-tabular-nums">
                                  <dt>Items</dt>
                                  <dd className="text-right text-store-charcoal">{formatPaise(money.subtotal)}</dd>
                                  <dt>Shipping</dt>
                                  <dd className="text-right text-store-charcoal">{money.shipping ? formatPaise(money.shipping) : 'Free'}</dd>
                                  {money.discount > 0 && (
                                    <>
                                      <dt>Discount</dt>
                                      <dd className="text-right text-store-charcoal">−{formatPaise(money.discount)}</dd>
                                    </>
                                  )}
                                  <dt className="pt-2 border-t border-store-card-border font-medium text-store-charcoal">Total</dt>
                                  <dd className="pt-2 border-t border-store-card-border text-right font-medium text-store-charcoal">
                                    {formatPaise(money.total)}
                                  </dd>
                                  <dt className="text-xs">Paid by</dt>
                                  <dd className="text-right text-xs">{order.paymentMethod}</dd>
                                </dl>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 pt-2">
                                <Button variant="dark" size="sm" href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}>
                                  View order details
                                </Button>
                                {(fulfillmentOf(order) === 'shipped' || fulfillmentOf(order) === 'delivered') && (
                                  <Button variant="secondary" size="sm" href={`/track-order?ref=${order.orderNumber}`}>
                                    <Truck size={14} aria-hidden="true" /> Track shipment
                                  </Button>
                                )}
                                <Button variant="secondary" size="sm" onClick={() => handleBuyAgain(order)}>
                                  <ShoppingBag size={14} aria-hidden="true" />
                                  {buyAgainOrderId === order.id ? 'Added to bag' : 'Buy again'}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => void downloadInvoicePdf(order, accountEmail, supportEmail)}>
                                  <Download size={14} aria-hidden="true" /> Invoice PDF (demo)
                                </Button>
                                {retWindow && retWindow.daysLeft > 0 && (
                                  <Button variant="outline" size="sm" onClick={() => openReturnFor(order)}>
                                    Request return
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs text-store-text-secondary" aria-live="polite">
                                {buyAgainOrderId === order.id
                                  ? `${order.items.length} item${order.items.length === 1 ? '' : 's'} added to your bag.`
                                  : retWindow
                                  ? retWindow.daysLeft > 0
                                    ? `Returns open for ${retWindow.daysLeft} more day${retWindow.daysLeft === 1 ? '' : 's'} (until ${formatShortDate(retWindow.closesOn)}).`
                                    : `The ${RETURN_WINDOW_DAYS}-day return window closed on ${formatShortDate(retWindow.closesOn)}.`
                                  : fulfillmentOf(order) !== 'delivered' && !hasIssue(order)
                                  ? `Returns open once your order is delivered, for ${RETURN_WINDOW_DAYS} days.`
                                  : ''}
                              </p>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {filteredOrders.length > visibleCount && (
                  <div className="flex flex-col items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setVisibleCount((n) => n + ORDERS_PAGE_SIZE)}>
                      Load more orders
                    </Button>
                    <p className="text-xs text-store-text-secondary">
                      Showing {visibleOrders.length} of {filteredOrders.length}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* ADDRESSES */}
            {activeSection === 'addresses' && (
              <section aria-labelledby="addresses-heading" className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 id="addresses-heading" className="font-heading text-xl font-medium text-store-charcoal">
                    Addresses
                  </h2>
                  <Button variant="dark" size="sm" onClick={openNewAddress}>
                    <Plus size={14} aria-hidden="true" /> Add address
                  </Button>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((addr) => (
                    <li
                      key={addr.id}
                      className={`bg-store-surface border p-6 flex flex-col justify-between ${
                        addr.isDefault ? 'border-store-charcoal' : 'border-store-card-border'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-wider font-medium text-store-charcoal">
                            {addr.label || 'Address'}
                          </p>
                          {addr.isDefault && <Badge variant="dark">Default</Badge>}
                        </div>
                        <h3 className="text-base font-medium text-store-charcoal">{addr.fullName}</h3>
                        <p className="text-sm text-store-text-secondary leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 && <><br />{addr.addressLine2}</>}
                          <br />
                          {addr.city}, {addr.state} {addr.postalCode}
                          <br />
                          {addr.country}
                        </p>
                        <p className="text-sm text-store-text-secondary">Phone: {addr.phone}</p>
                      </div>

                      <div className="pt-5 border-t border-store-card-border mt-5 flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEditAddress(addr)}>
                          Edit
                        </Button>
                        {!addr.isDefault && (
                          <Button variant="ghost" size="sm" onClick={() => void setDefaultAddress(addr.id).then((o) => addToast(o.ok ? { type: 'success', title: 'Default address updated' } : { type: 'error', title: o.message }))}>
                            Set as default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAddressPendingDelete(addr)}
                          aria-label={`Remove ${addr.label || ''} address for ${addr.fullName}`}
                        >
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={openNewAddress}
                      className="w-full h-full min-h-48 flex flex-col items-center justify-center gap-2 border border-dashed border-store-card-border text-sm text-store-text-secondary hover:border-store-charcoal hover:text-store-charcoal transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
                    >
                      <Plus size={20} aria-hidden="true" />
                      Add a new address
                      <span className="text-xs">Home, work, a friend’s place…</span>
                    </button>
                  </li>
                </ul>
              </section>
            )}

            {/* RETURNS */}
            {activeSection === 'returns' && (
              <section aria-labelledby="returns-heading" className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 id="returns-heading" className="font-heading text-xl font-medium text-store-charcoal">
                      Returns & exchanges
                    </h2>
                    <p className="text-sm text-store-text-secondary mt-1">
                      Unworn pieces can be returned within {RETURN_WINDOW_DAYS} days of delivery, with free doorstep pickup.
                    </p>
                  </div>
                  <Button variant="dark" size="sm" onClick={() => setIsReturnModalOpen(true)}>
                    Start a return
                  </Button>
                </div>

                {returns.length === 0 ? (
                  <p className="text-sm text-store-text-secondary text-center py-12 border border-store-card-border bg-store-surface">
                    You have no return requests.
                  </p>
                ) : (
                  <ul className="border border-store-card-border bg-store-surface divide-y divide-store-card-border">
                    {returns.map((ret) => (
                      <li key={ret.id} className="p-5 flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm text-store-charcoal">{ret.orderNumber}</h3>
                            <Badge variant={ret.status === 'Rejected' ? 'error' : 'neutral'}>{ret.status}</Badge>
                          </div>
                          <p className="text-sm text-store-text-secondary mt-1">
                            {ret.itemTitle} · Reason: {ret.reason}
                          </p>
                          <span className="text-xs text-store-text-secondary">Requested on {formatShortDate(ret.createdAt)}</span>
                        </div>
                        {(ret.status === 'Requested' || ret.status === 'Approved' || ret.status === 'Pickup Scheduled') && (
                          <p className="text-sm text-store-charcoal flex items-center gap-1.5">
                            <Truck size={14} aria-hidden="true" /> Doorstep pickup within 48 hours (demo)
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* PROFILE */}
            {activeSection === 'profile' && (
              <AccountProfileSection account={accountState} />
            )}
          </div>
        </div>

        {/* Demo controls, kept apart from the customer actions */}
        <aside className="mt-16 pt-6 border-t border-dashed border-store-card-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-store-text-secondary">
            Demo store: return requests are still saved in this browser only. Your orders, profile and addresses are saved to your account.
          </p>
          <button
            type="button"
            onClick={resetStoreData}
            className="self-start sm:self-auto text-xs font-medium text-store-charcoal underline underline-offset-4 decoration-store-card-border hover:decoration-store-charcoal cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
          >
            Reset demo data
          </button>
        </aside>
      </main>

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title={addressForm.id ? 'Edit address' : 'Add a new address'}
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          {addressError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{addressError}</p>
          )}
          <fieldset>
            <legend className="text-sm font-medium text-store-charcoal mb-2">Save this address as</legend>
            <div className="flex flex-wrap gap-2">
              {ADDRESS_LABELS.map((option) => {
                const isActive = addressForm.label === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => updateAddressForm({ label: option })}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold ${
                      isActive
                        ? 'bg-store-charcoal text-white'
                        : 'border border-store-border text-store-text-secondary hover:border-store-charcoal hover:text-store-charcoal'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>
          {addressForm.label === 'Other' && (
            <Input
              label="Name for this address"
              placeholder="e.g. Parents, Studio"
              value={addressForm.otherLabel}
              onChange={(e) => updateAddressForm({ otherLabel: e.target.value })}
              required
            />
          )}
          <Input label="Full name" value={addressForm.fullName} onChange={(e) => updateAddressForm({ fullName: e.target.value })} required />
          <Input label="Address line 1" value={addressForm.addressLine1} onChange={(e) => updateAddressForm({ addressLine1: e.target.value })} required />
          <Input label="Address line 2 (optional)" value={addressForm.addressLine2 ?? ''} onChange={(e) => updateAddressForm({ addressLine2: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={addressForm.city} onChange={(e) => updateAddressForm({ city: e.target.value })} required />
            <Input label="State" value={addressForm.state} onChange={(e) => updateAddressForm({ state: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="PIN code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              title="6-digit PIN code"
              value={addressForm.postalCode}
              onChange={(e) => updateAddressForm({ postalCode: e.target.value })}
              required
            />
            <Input label="Phone" type="tel" value={addressForm.phone} onChange={(e) => updateAddressForm({ phone: e.target.value })} required />
          </div>
          <Checkbox
            checked={Boolean(addressForm.isDefault)}
            onChange={(checked) => updateAddressForm({ isDefault: checked })}
            label="Use as my default delivery address"
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsAddressModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="dark" size="md" type="submit" disabled={addressSaving}>
              {addressSaving ? 'Saving…' : 'Save address'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Address Confirmation */}
      <Modal
        isOpen={addressPendingDelete !== null}
        onClose={() => setAddressPendingDelete(null)}
        title="Remove this address?"
      >
        {addressPendingDelete && (
          <div className="space-y-5">
            <p className="text-sm text-store-text-secondary">
              {addressPendingDelete.label ? `${addressPendingDelete.label}: ` : ''}
              {addressPendingDelete.fullName}, {addressPendingDelete.addressLine1}, {addressPendingDelete.city}.
              {addressPendingDelete.isDefault && addresses.length > 1 ? ' Your next saved address will become the default.' : ''}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="md" onClick={() => setAddressPendingDelete(null)}>
                Keep it
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  void deleteAddress(addressPendingDelete.id).then((outcome) => {
                    setAddressPendingDelete(null);
                    addToast(outcome.ok ? { type: 'info', title: 'Address removed' } : { type: 'error', title: outcome.message });
                  });
                }}
              >
                Remove address
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Request Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Request a return or exchange"
        subtitle="Free courier pickup from your delivery address. Demo only — no courier will be booked."
      >
        <form onSubmit={handleSubmitReturn} className="space-y-4">
          <Input
            label="Order number"
            value={returnOrderNum}
            onChange={(e) => setReturnOrderNum(e.target.value)}
            required
          />
          <Input
            label="Item"
            value={returnItemTitle}
            onChange={(e) => setReturnItemTitle(e.target.value)}
            required
          />
          <Select
            label="Reason"
            value={returnReason}
            onChange={(val) => setReturnReason(val)}
            options={[
              { value: 'Fit was too oversized', label: 'Fit was too oversized' },
              { value: 'Fit was too snug', label: 'Fit was too snug' },
              { value: 'Wanted different colorway', label: 'Wanted a different colour' },
              { value: 'Found fabric too heavy', label: 'Fabric felt too heavy' },
            ]}
          />
          <Textarea
            label="Item condition"
            value={returnCondition}
            onChange={(e) => setReturnCondition(e.target.value)}
            rows={2}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="dark" size="md" type="submit">
              Submit request
            </Button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}
