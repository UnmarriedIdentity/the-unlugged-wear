'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Mail, Clock, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [subject, setSubject] = useState('Sizing Advice');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email is required';
    if (!message.trim()) errs.message = 'Message text is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Contact Studio' },
          ]}
        />

        <div className="my-8">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            Contact Studio
          </h1>
          <p className="text-sm text-[#666] mt-2 max-w-xl">
            Have questions regarding sizing, yarn tension, our zero-deadstock POD model, or orders? We reply within one business day.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-4">
          {/* Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2DDCF] p-6 sm:p-8 shadow-xs">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A]">Message Transmitted</h3>
                <p className="text-xs text-[#666] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>. Our editorial and care team will respond to <strong>{email}</strong> within 24 business hours.
                </p>
                <div className="pt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage('');
                    }}
                  >
                    Send Another Note
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    placeholder="e.g. Kavita Rao"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    required
                  />
                  <Input
                    label="Email Address"
                    placeholder="kavita@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Topic / Subject"
                    value={subject}
                    onChange={(val) => setSubject(val)}
                    options={[
                      { value: 'Sizing Advice', label: 'Fit & Sizing Consultation' },
                      { value: 'Order Status', label: 'Order / Tracking Inquiry' },
                      { value: 'Returns & RMA', label: 'Returns & Exchanges' },
                      { value: 'POD & Textile Sourcing', label: 'Textiles & Sustainable POD' },
                      { value: 'Press / Editorial', label: 'Press & Collaborations' },
                    ]}
                  />
                  <Input
                    label="Order Reference (Optional)"
                    placeholder="e.g. TUW-9042"
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                  />
                </div>

                <Textarea
                  label="Message"
                  placeholder="How can we assist your intentional wardrobe journey?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  error={errors.message}
                  rows={5}
                  required
                />

                <div className="pt-2">
                  <Button
                    variant="dark"
                    size="lg"
                    fullWidth
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? 'Transmitting...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Info Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-[#F4F1EA] border border-[#E2DDCF] space-y-4">
              <h3 className="text-base font-bold text-[#1A1A1A] uppercase tracking-wider">
                Studio Headquarters
              </h3>

              <div className="space-y-3 text-xs text-[#5A5A5A]">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#1A1A1A] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1A1A1A] block">The Unplugged Wear Studio</strong>
                    Indiranagar Creative District, Bengaluru, Karnataka 560038
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-[#1A1A1A] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1A1A1A] block">Studio Operating Hours</strong>
                    Monday – Friday, 10:00 AM – 6:00 PM IST
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-[#1A1A1A] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1A1A1A] block">Electronic Inquiries</strong>
                    studio@theunpluggedwear.com
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E2DDCF] shadow-xs text-xs text-[#666] space-y-2">
              <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#10B981]" />
                <span>Zero Automation Promise</span>
              </div>
              <p>
                Every message is answered directly by our small team of textile designers and patternmakers.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
