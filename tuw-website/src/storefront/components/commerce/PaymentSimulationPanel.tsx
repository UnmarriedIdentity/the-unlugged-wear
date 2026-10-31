'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export interface PaymentSimulationPanelProps {
  totalAmount: number;
  onPaymentSuccess: (method: 'UPI' | 'Card' | 'COD (Demo)') => void;
  onPaymentFail: (reason: string) => void;
  onCancel: () => void;
}

export default function PaymentSimulationPanel({
  totalAmount,
  onPaymentSuccess,
  onPaymentFail,
  onCancel,
}: PaymentSimulationPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<'Card' | 'UPI' | 'COD (Demo)'>('Card');
  const [simulatedScenario, setSimulatedScenario] = useState<'success' | 'failure' | 'timeout'>('success');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState('ARJUN RAO');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('•••');

  // UPI State
  const [upiId, setUpiId] = useState('arjun@okhdfcbank');
  const [upiVerified, setUpiVerified] = useState(true);
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsProcessing(false);

      if (simulatedScenario === 'failure') {
        const msg =
          selectedMethod === 'UPI'
            ? 'Simulated UPI transfer rejected by issuing bank. Please retry.'
            : selectedMethod === 'Card'
            ? 'Simulated card authorization declined (insufficient demo funds).'
            : 'COD service temporarily unavailable for this postal code.';
        setErrorMessage(msg);
        onPaymentFail(msg);
      } else if (simulatedScenario === 'timeout') {
        const msg = 'Gateway connection timed out after 30 seconds. No amount was deducted.';
        setErrorMessage(msg);
        onPaymentFail(msg);
      } else {
        onPaymentSuccess(selectedMethod);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* 1. Payment Method Tabs (Figma Screens 3, 4, 5) */}
      <div className="flex border-b border-store-card-border pb-1 gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedMethod('Card')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            selectedMethod === 'Card'
              ? 'border-store-charcoal text-store-charcoal font-bold'
              : 'border-transparent text-store-muted hover:text-store-charcoal'
          }`}
        >
          <CreditCard size={18} />
          <span>Card</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMethod('UPI')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            selectedMethod === 'UPI'
              ? 'border-store-charcoal text-store-charcoal font-bold'
              : 'border-transparent text-store-muted hover:text-store-charcoal'
          }`}
        >
          <QrCode size={18} />
          <span>UPI / NetBanking</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMethod('COD (Demo)')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            selectedMethod === 'COD (Demo)'
              ? 'border-store-charcoal text-store-charcoal font-bold'
              : 'border-transparent text-store-muted hover:text-store-charcoal'
          }`}
        >
          <Banknote size={18} />
          <span>Pay on Delivery</span>
        </button>
      </div>

      {/* 2. TAB CONTENT: Credit / Debit Card (Figma Screen 3) */}
      {selectedMethod === 'Card' && (
        <div className="space-y-6">
          {/* Realistic Luxury Dark Card Mockup */}
          <div className="max-w-sm mx-auto sm:mx-0 w-full rounded-2xl bg-gradient-to-tr from-store-action-primary via-store-checkout-teal to-store-checkout-teal-light text-white p-5 sm:p-6 shadow-xl relative overflow-hidden">
            {/* Ambient subtle glow ring */}
            <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              {/* EMV Chip & Contactless wave */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 rounded-md bg-gradient-to-r from-store-gold via-store-checkout-gold to-white/80 border border-black/20 shadow-xs flex items-center justify-center">
                  <div className="w-6 h-4 border border-black/20 rounded-xs" />
                </div>
                <Wifi size={18} className="text-white/70 rotate-90" />
              </div>
              <span className="text-xs uppercase font-heading tracking-widest text-white/80 font-bold">
                The Unplugged Wear
              </span>
            </div>

            {/* Embossed Card Number */}
            <div className="text-lg sm:text-xl font-mono tracking-widest text-white mb-6 relative z-10">
              {cardNumber}
            </div>

            {/* Cardholder & Expiry Row */}
            <div className="flex items-end justify-between relative z-10">
              <div>
                <span className="text-2xs uppercase tracking-wider text-white/60 block">
                  Card Holder
                </span>
                <span className="text-xs sm:text-sm font-medium uppercase tracking-wider text-white">
                  {cardHolder}
                </span>
              </div>
              <div>
                <span className="text-2xs uppercase tracking-wider text-white/60 block">
                  Expires
                </span>
                <span className="text-xs sm:text-sm font-medium tracking-wider text-white">
                  {cardExpiry}
                </span>
              </div>
              {/* Visa / Master badge simulation */}
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-store-terracotta/90 opacity-90" />
                <div className="w-6 h-6 rounded-full bg-store-checkout-gold/90 opacity-90" />
              </div>
            </div>
          </div>

          {/* Card Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-store-charcoal block mb-1.5">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 •••• •••• 4242"
                  className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                />
                <CreditCard size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-store-muted pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-store-charcoal block mb-1.5">
                Name on Card
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                placeholder="ARJUN RAO"
                className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-store-charcoal block mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-store-charcoal block mb-1.5">
                  CVV / CVC
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                    className="w-full px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
                  />
                  <Lock size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-store-muted pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: UPI / NetBanking (Figma Screen 4) */}
      {selectedMethod === 'UPI' && (
        <div className="space-y-6">
          {/* Quick UPI App Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'gpay', name: 'Google Pay' },
              { id: 'phonepe', name: 'PhonePe' },
              { id: 'paytm', name: 'Paytm UPI' },
              { id: 'bhim', name: 'BHIM UPI' },
            ].map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedUpiApp(app.id as any)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedUpiApp === app.id
                    ? 'border-store-charcoal bg-store-cream/60 font-semibold text-store-charcoal ring-1 ring-store-charcoal'
                    : 'border-store-card-border bg-white text-store-muted hover:border-store-charcoal hover:text-store-charcoal'
                }`}
              >
                <span className="text-xs">{app.name}</span>
              </button>
            ))}
          </div>

          {/* UPI ID Field with Inline Verify */}
          <div>
            <label className="text-xs font-medium text-store-charcoal block mb-1.5">
              Enter Virtual Payment Address (UPI ID)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setUpiVerified(false);
                }}
                placeholder="username@bank"
                className="flex-1 px-4 py-3 rounded-xl border border-store-input-border bg-store-input-bg text-store-text-primary text-sm focus:border-store-input-focus outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={() => setUpiVerified(true)}
                className="px-4 py-3 rounded-xl bg-store-action-primary text-white text-xs font-semibold hover:bg-store-action-hover transition-colors cursor-pointer"
              >
                {upiVerified ? '✓ Verified' : 'Verify'}
              </button>
            </div>
            {upiVerified && (
              <p className="text-2xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 size={13} />
                VPA verified: Linked to Arjun Rao (HDFC Bank)
              </p>
            )}
          </div>

          {/* QR Code Scanner Simulation */}
          <div className="p-4 rounded-2xl bg-store-canvas border border-store-card-border flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-24 h-24 rounded-xl bg-white border border-store-card-border p-2 flex items-center justify-center shrink-0">
              <QrCode size={70} className="text-store-charcoal" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-store-charcoal">
                Scan QR Code with any UPI App
              </h4>
              <p className="text-xs text-store-muted">
                Open Google Pay, PhonePe, Paytm, or BHIM and point your phone scanner at the screen to simulate payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: Cash on Delivery (Figma Screen 5) */}
      {selectedMethod === 'COD (Demo)' && (
        <div className="space-y-4 p-5 rounded-2xl bg-store-canvas border border-store-card-border">
          <div className="flex items-start gap-3">
            <Banknote size={24} className="text-store-charcoal shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-store-charcoal">
                Pay in Cash or UPI upon Doorstep Delivery
              </h4>
              <p className="text-xs text-store-muted mt-1 leading-relaxed">
                Our Delhivery logistics executive will collect payment via cash or UPI scan when your parcel arrives. ₹0 convenience surcharge applies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Error Notice if Triggered */}
      {errorMessage && (
        <div role="alert" className="p-4 rounded-xl bg-store-terracotta/10 border border-store-terracotta/30 text-xs text-store-terracotta flex items-start gap-2.5">
          <AlertCircle size={16} aria-hidden="true" className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 6. Testing Outcome Scenario Controls */}
      <div className="p-4 rounded-xl bg-store-cream/40 border border-store-card-border space-y-2">
        <span className="text-2xs font-bold uppercase tracking-wider text-store-muted block">
          Simulation Outcome Sandbox (Testing Controls)
        </span>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSimulatedScenario('success')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulatedScenario === 'success'
                ? 'bg-store-action-primary text-white shadow-xs'
                : 'bg-white border border-store-card-border text-store-text-secondary hover:text-store-charcoal'
            }`}
          >
            ✓ Success Flow (Creates Order)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedScenario('failure')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulatedScenario === 'failure'
                ? 'bg-store-terracotta text-white shadow-xs'
                : 'bg-white border border-store-card-border text-store-text-secondary hover:text-store-charcoal'
            }`}
          >
            ✕ Payment Declined
          </button>
          <button
            type="button"
            onClick={() => setSimulatedScenario('timeout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulatedScenario === 'timeout'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-store-card-border text-store-text-secondary hover:text-store-charcoal'
            }`}
          >
            ⏱ Gateway Timeout
          </button>
        </div>
      </div>

      {/* 7. Action Button */}
      <div className="pt-2 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs uppercase font-semibold tracking-wider text-store-muted hover:text-store-charcoal transition-colors cursor-pointer"
        >
          Back to Details
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={handleSimulatePayment}
          className="px-6 py-3.5 rounded-full bg-store-checkout-gold hover:bg-store-checkout-gold-hover text-store-charcoal font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Authorizing Sandbox...</span>
            </>
          ) : (
            <>
              <span>
                {/* Nothing is charged now for pay on delivery, so it places the order instead */}
                {selectedMethod === 'COD (Demo)' ? 'Place Order' : 'Complete Payment'} (₹{totalAmount.toLocaleString()})
              </span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
