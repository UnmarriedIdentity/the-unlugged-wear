'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { useStore } from '@/mocks/store';
import { Package, MapPin, User, RotateCcw, Shield, Truck, ExternalLink, AlertCircle } from 'lucide-react';

export default function AccountPage() {
  const {
    orders,
    returns,
    addresses,
    saveAddress,
    submitReturnRequest,
    resetStoreData,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'returns' | 'profile'>('orders');

  // Address edit state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addrName, setAddrName] = useState(addresses[0]?.fullName || '');
  const [addrLine1, setAddrLine1] = useState(addresses[0]?.addressLine1 || '');
  const [addrCity, setAddrCity] = useState(addresses[0]?.city || '');
  const [addrState, setAddrState] = useState(addresses[0]?.state || '');
  const [addrZip, setAddrZip] = useState(addresses[0]?.postalCode || '');
  const [addrPhone, setAddrPhone] = useState(addresses[0]?.phone || '');

  // Return request state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrderNum, setReturnOrderNum] = useState(orders[0]?.orderNumber || '');
  const [returnItemTitle, setReturnItemTitle] = useState(orders[0]?.items[0]?.title || '');
  const [returnVariant, setReturnVariant] = useState(orders[0]?.items[0]?.size || 'L');
  const [returnReason, setReturnReason] = useState('Fit was too oversized');
  const [returnCondition, setReturnCondition] = useState('Unworn with original hangtags');

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    saveAddress({
      id: addresses[0]?.id || `addr-${Date.now()}`,
      fullName: addrName,
      addressLine1: addrLine1,
      city: addrCity,
      state: addrState,
      postalCode: addrZip,
      country: 'India',
      phone: addrPhone,
      isDefault: true,
    });
    setIsAddressModalOpen(false);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Customer Account' },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A]">
              My Account
            </h1>
            <p className="text-sm text-[#666] mt-1">
              Welcome back, Arjun Rao (arjun.rao@example.com)
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={resetStoreData}
          >
            Reset Demo Account State
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <Tabs
            variant="pills"
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as any)}
            tabs={[
              { id: 'orders', label: 'Order History', count: orders.length },
              { id: 'addresses', label: 'Address Book', count: addresses.length },
              { id: 'returns', label: 'Return Requests (RMA)', count: returns.length },
              { id: 'profile', label: 'Profile & Security' },
            ]}
          />
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-3xl border border-[#E2DDCF] p-8">
                <p className="text-sm text-[#666]">You haven&apos;t placed any orders yet.</p>
                <div className="mt-4">
                  <Button variant="dark" size="sm" href="/shop">
                    Explore Collection
                  </Button>
                </div>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-[#E2DDCF] p-6 shadow-xs space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DDCF]">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-base text-[#1A1A1A]">
                          {order.orderNumber}
                        </span>
                        <Badge
                          variant={
                            order.status === 'Delivered'
                              ? 'success'
                              : order.status === 'Shipped'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-[#8A8A8A] block mt-0.5">
                        Placed on {order.date} • {order.items.length} item{order.items.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/track-order?ref=${order.orderNumber}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7539FF] hover:underline"
                      >
                        <Truck size={14} /> Track Shipment
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setReturnOrderNum(order.orderNumber);
                          setReturnItemTitle(order.items[0]?.title || '');
                          setIsReturnModalOpen(true);
                        }}
                      >
                        Request Return
                      </Button>
                    </div>
                  </div>

                  {/* Items in order */}
                  <div className="divide-y divide-[#E2DDCF]">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                        <div className="w-16 h-20 rounded-xl overflow-hidden bg-[#F4F1EA] shrink-0 border border-[#E2DDCF]">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-[#1A1A1A]">{item.title}</h4>
                            <p className="text-xs text-[#8A8A8A] mt-0.5">
                              {item.color} • Size {item.size} • Qty {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-[#1A1A1A]">
                            ₹{(item.priceINR * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total & Address */}
                  <div className="pt-4 border-t border-[#E2DDCF] flex flex-wrap justify-between gap-4 text-xs text-[#666]">
                    <div>
                      <span className="font-semibold text-[#1A1A1A] block">Delivering to:</span>
                      <span>
                        {order.shippingAddress.fullName}, {order.shippingAddress.addressLine1},{' '}
                        {order.shippingAddress.city} {order.shippingAddress.postalCode}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#8A8A8A] block">Order Total:</span>
                      <span className="text-base font-extrabold text-[#1A1A1A]">
                        ₹{order.totalINR.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-3xl border border-[#E2DDCF] p-6 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-[#1A1A1A]">{addr.fullName}</h4>
                      {addr.isDefault && <Badge variant="dark">Primary</Badge>}
                    </div>
                    <p className="text-xs text-[#666] leading-relaxed">
                      {addr.addressLine1}
                      {addr.addressLine2 && <><br />{addr.addressLine2}</>}
                      <br />
                      {addr.city}, {addr.state} - {addr.postalCode}
                      <br />
                      {addr.country}
                    </p>
                    <p className="text-xs text-[#8A8A8A]">Phone: {addr.phone}</p>
                  </div>

                  <div className="pt-6 border-t border-[#E2DDCF] mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setAddrName(addr.fullName);
                        setAddrLine1(addr.addressLine1);
                        setAddrCity(addr.city);
                        setAddrState(addr.state);
                        setAddrZip(addr.postalCode);
                        setAddrPhone(addr.phone);
                        setIsAddressModalOpen(true);
                      }}
                    >
                      Edit Address
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RETURNS */}
        {activeTab === 'returns' && (
          <div className="bg-white rounded-3xl border border-[#E2DDCF] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2DDCF]">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">Return & Exchange Requests</h3>
                <p className="text-xs text-[#666] mt-0.5">
                  14-day hassle-free doorstep pickup policy for all unworn garments.
                </p>
              </div>
              <Button
                variant="dark"
                size="sm"
                onClick={() => setIsReturnModalOpen(true)}
              >
                Log New Return
              </Button>
            </div>

            {returns.length === 0 ? (
              <p className="text-xs text-[#8A8A8A] text-center py-10">
                You have no active or historical return requests.
              </p>
            ) : (
              <div className="space-y-4">
                {returns.map((ret) => (
                  <div
                    key={ret.id}
                    className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E2DDCF] flex flex-wrap justify-between items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1A1A1A]">{ret.orderNumber}</span>
                        <Badge variant="info">{ret.status}</Badge>
                      </div>
                      <p className="text-xs text-[#666] mt-1">
                        <strong>{ret.itemTitle}</strong> • Reason: {ret.reason}
                      </p>
                      <span className="text-[11px] text-[#8A8A8A]">Logged on {ret.createdAt}</span>
                    </div>

                    <div className="text-xs text-[#10B981] font-semibold flex items-center gap-1">
                      <Truck size={14} /> Doorstep pickup scheduled within 48h
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-[#E2DDCF] p-6 sm:p-8 shadow-xs max-w-2xl space-y-6">
            <h3 className="text-base font-bold text-[#1A1A1A] pb-3 border-b border-[#E2DDCF]">
              Profile & Account Credentials
            </h3>

            <div className="space-y-4">
              <Input label="Account Name" value="Arjun Rao" readOnly />
              <Input label="Registered Email" value="arjun.rao@example.com" readOnly />
              <Input label="Contact Mobile" value="+91 98450 12345" readOnly />
            </div>

            <div className="pt-4 border-t border-[#E2DDCF] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5A5A5A]">
                Security Preview
              </h4>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E2DDCF]">
                <div>
                  <div className="text-xs font-bold text-[#1A1A1A]">Two-Factor Authentication</div>
                  <p className="text-[11px] text-[#8A8A8A]">SMS OTP verification on demo checkout</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Edit Delivery Address"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <Input label="Full Name" value={addrName} onChange={(e) => setAddrName(e.target.value)} required />
          <Input label="Address Line 1" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required />
            <Input label="State" value={addrState} onChange={(e) => setAddrState(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="PIN Code" value={addrZip} onChange={(e) => setAddrZip(e.target.value)} required />
            <Input label="Phone" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} required />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsAddressModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="dark" size="md" type="submit">
              Save Address
            </Button>
          </div>
        </form>
      </Modal>

      {/* Request Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Log Return or Exchange Request"
        subtitle="Free courier pickup at your registered shipping address."
      >
        <form onSubmit={handleSubmitReturn} className="space-y-4">
          <Input
            label="Order Reference Number"
            value={returnOrderNum}
            onChange={(e) => setReturnOrderNum(e.target.value)}
            required
          />
          <Input
            label="Item Title"
            value={returnItemTitle}
            onChange={(e) => setReturnItemTitle(e.target.value)}
            required
          />
          <Select
            label="Reason for Return"
            value={returnReason}
            onChange={(val) => setReturnReason(val)}
            options={[
              { value: 'Fit was too oversized', label: 'Fit was too oversized' },
              { value: 'Fit was too snug', label: 'Fit was too snug' },
              { value: 'Wanted different colorway', label: 'Wanted different colorway' },
              { value: 'Found fabric too heavy', label: 'Found fabric too heavy' },
            ]}
          />
          <Textarea
            label="Item Condition"
            value={returnCondition}
            onChange={(e) => setReturnCondition(e.target.value)}
            rows={2}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="dark" size="md" type="submit">
              Submit Return Request
            </Button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}
