'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, QrCode, CreditCard, Banknote, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

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
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'Card' | 'COD (Demo)'>('UPI');
  const [simulatedScenario, setSimulatedScenario] = useState<'success' | 'failure' | 'timeout'>('success');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsProcessing(false);

      if (simulatedScenario === 'failure') {
        const msg =
          selectedMethod === 'UPI'
            ? 'Simulated UPI transfer rejected by issuing bank. Please retry.'
            : 'Simulated card authorization declined (insufficient demo funds).';
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
      {/* Explicit Demo Notification Banner */}
      <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1D4ED8] flex items-start gap-3">
        <ShieldCheck size={20} className="shrink-0 mt-0.5 text-[#2563EB]" />
        <div>
          <strong className="font-bold block text-sm mb-0.5">
            Demo Checkout Sandbox
          </strong>
          This is an interactive simulation. No real payment or financial credentials will be collected or processed.
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-[#5A5A5A] block">
          Select Simulated Payment Method
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* UPI */}
          <button
            type="button"
            onClick={() => setSelectedMethod('UPI')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedMethod === 'UPI'
                ? 'border-[#1A1A1A] bg-white ring-2 ring-[#1A1A1A]/10 shadow-xs'
                : 'border-[#E2DDCF] bg-white hover:border-[#B5AEA1]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-[#1A1A1A] mb-1">
              <QrCode size={18} className="text-[#7539FF]" />
              <span>Instant UPI</span>
            </div>
            <p className="text-xs text-[#8A8A8A]">GPay, PhonePe, Paytm, or BHIM scan</p>
          </button>

          {/* Card */}
          <button
            type="button"
            onClick={() => setSelectedMethod('Card')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedMethod === 'Card'
                ? 'border-[#1A1A1A] bg-white ring-2 ring-[#1A1A1A]/10 shadow-xs'
                : 'border-[#E2DDCF] bg-white hover:border-[#B5AEA1]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-[#1A1A1A] mb-1">
              <CreditCard size={18} className="text-[#10B981]" />
              <span>Card Sandbox</span>
            </div>
            <p className="text-xs text-[#8A8A8A]">Mock Visa / Mastercard token</p>
          </button>

          {/* COD */}
          <button
            type="button"
            onClick={() => setSelectedMethod('COD (Demo)')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedMethod === 'COD (Demo)'
                ? 'border-[#1A1A1A] bg-white ring-2 ring-[#1A1A1A]/10 shadow-xs'
                : 'border-[#E2DDCF] bg-white hover:border-[#B5AEA1]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-[#1A1A1A] mb-1">
              <Banknote size={18} className="text-[#F59E0B]" />
              <span>Pay on Delivery</span>
            </div>
            <p className="text-xs text-[#8A8A8A]">Pending studio verification</p>
          </button>
        </div>
      </div>

      {/* Simulation Scenario Trigger (Allows testing success, failure, timeout) */}
      <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E2DDCF] space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-[#5A5A5A] block">
          Simulation Outcome Scenario (Testing Controls)
        </label>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSimulatedScenario('success')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              simulatedScenario === 'success'
                ? 'bg-[#10B981] text-white'
                : 'bg-white border border-[#E2DDCF] text-[#5A5A5A]'
            }`}
          >
            ✓ Success Flow (Creates Order)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedScenario('failure')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              simulatedScenario === 'failure'
                ? 'bg-[#EF4444] text-white'
                : 'bg-white border border-[#E2DDCF] text-[#5A5A5A]'
            }`}
          >
            ✕ Payment Declined
          </button>
          <button
            type="button"
            onClick={() => setSimulatedScenario('timeout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              simulatedScenario === 'timeout'
                ? 'bg-[#F59E0B] text-white'
                : 'bg-white border border-[#E2DDCF] text-[#5A5A5A]'
            }`}
          >
            ⚠ Gateway Timeout
          </button>
        </div>
      </div>

      {/* Error Feedback Display */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-[#E2DDCF]">
        <Button
          variant="secondary"
          size="lg"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          variant="dark"
          size="lg"
          fullWidth
          isLoading={isProcessing}
          onClick={handleSimulatePayment}
        >
          {isProcessing
            ? 'Authorizing Simulation...'
            : `Complete Demo Order • ₹${totalAmount.toLocaleString()}`}
        </Button>
      </div>
    </div>
  );
}
