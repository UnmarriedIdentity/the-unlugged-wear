'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { ReviewItem } from '@/lib/types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';

export interface ProductReviewsProps {
  reviews?: ReviewItem[];
  ratingScore?: string;
  reviewsCount?: string;
  title?: string;
  eyebrow?: string;
  productTitle?: string;
  className?: string;
}

export default function ProductReviews({
  reviews,
  ratingScore = '4.6',
  reviewsCount = '128',
  title = 'Customer Reviews & Atelier Feedback',
  eyebrow = 'Verified Customer Experiences',
  productTitle = 'this piece',
  className = '',
}: ProductReviewsProps) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    title: '',
    content: '',
  });

  if (!reviews || reviews.length === 0) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsReviewModalOpen(false);
      setFormData({ name: '', email: '', rating: 5, title: '', content: '' });
    }, 2000);
  };

  return (
    <section id="reviews" className={`my-16 pt-12 border-t border-store-card-border ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          {eyebrow && (
            <span className="text-xs uppercase tracking-widest text-store-gold font-semibold block mb-1">
              {eyebrow}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-heading font-medium uppercase tracking-wide text-store-text-primary">
            {title}
          </h2>
        </div>
        <Button
          variant="dark"
          size="md"
          onClick={() => setIsReviewModalOpen(true)}
          icon={<MessageSquare size={16} />}
        >
          Write a Review
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Rating Breakdown Summary Panel (4 cols on lg) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-store-cream border border-store-card-border space-y-6">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold font-heading text-store-text-primary">
              {ratingScore}
            </span>
            <div>
              <div className="flex text-store-gold text-sm tracking-tight">
                ★★★★★
              </div>
              <span className="text-xs text-store-text-secondary block mt-0.5">
                {reviewsCount} verified experiences
              </span>
            </div>
          </div>

          {/* Star distribution bars */}
          <div className="space-y-2.5 text-xs text-store-text-secondary">
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0">5 Stars</span>
              <div className="flex-1 h-2 rounded-full bg-store-card-border overflow-hidden">
                <div className="h-full bg-store-charcoal w-11/12 rounded-full" />
              </div>
              <span className="w-8 text-right font-medium">91%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0">4 Stars</span>
              <div className="flex-1 h-2 rounded-full bg-store-card-border overflow-hidden">
                <div className="h-full bg-store-charcoal w-1/12 rounded-full" />
              </div>
              <span className="w-8 text-right font-medium">7%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0">3 Stars</span>
              <div className="flex-1 h-2 rounded-full bg-store-card-border overflow-hidden">
                <div className="h-full bg-store-charcoal w-0.5 rounded-full" />
              </div>
              <span className="w-8 text-right font-medium">2%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0">2 Stars</span>
              <div className="flex-1 h-2 rounded-full bg-store-card-border overflow-hidden">
                <div className="h-full bg-store-charcoal w-0 rounded-full" />
              </div>
              <span className="w-8 text-right font-medium">0%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0">1 Star</span>
              <div className="flex-1 h-2 rounded-full bg-store-card-border overflow-hidden">
                <div className="h-full bg-store-charcoal w-0 rounded-full" />
              </div>
              <span className="w-8 text-right font-medium">0%</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-store-surface border border-store-card-border text-xs text-store-text-secondary space-y-1">
            <span className="font-bold text-store-charcoal block">100% Authentic Feedback</span>
            <p>Only verified purchasers who received catalog orders can submit reviews.</p>
          </div>
        </div>

        {/* Review Cards Grid (8 cols on lg: 2x2 grid) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-store-surface border border-store-card-border flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex text-store-gold text-xs tracking-tight">
                    ★★★★★
                  </div>
                  <span className="text-xs text-store-muted">{rev.date}</span>
                </div>

                <h4 className="text-sm font-bold text-store-charcoal mb-1.5">
                  {rev.title}
                </h4>

                <p className="text-xs text-store-text-secondary leading-relaxed mb-4">
                  {rev.content}
                </p>
              </div>

              <div className="pt-3 border-t border-store-card-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-store-charcoal block">
                    {rev.author}
                  </span>
                  <span className="text-store-muted">{rev.role}</span>
                </div>
                <Badge variant="success" size="sm">
                  Verified
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write a Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Write an Atelier Review — ${productTitle}`}
        maxWidth="max-w-lg"
      >
        {isSubmitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h4 className="text-lg font-bold text-store-charcoal">
              Thank You for Your Feedback
            </h4>
            <p className="text-xs text-store-text-secondary max-w-sm mx-auto">
              Your verified review has been submitted to our atelier moderation queue and will be published upon authenticity verification.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-store-charcoal block mb-1">
                Your Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`text-xl cursor-pointer ${
                      star <= formData.rating ? 'text-store-gold' : 'text-store-card-border'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-store-charcoal block mb-1">
                Review Headline
              </label>
              <input
                type="text"
                required
                placeholder="Summarize your experience (e.g., Uncompromising terry density)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-store-card-border bg-store-surface text-xs text-store-text-primary focus:outline-none focus:border-store-charcoal"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-store-charcoal block mb-1">
                Your Detailed Review
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share your thoughts on the silhouette, drape, fabric feel, or craft details..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full p-3 rounded-xl border border-store-card-border bg-store-surface text-xs text-store-text-primary focus:outline-none focus:border-store-charcoal resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-store-charcoal block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sarah Chen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-store-card-border bg-store-surface text-xs text-store-text-primary focus:outline-none focus:border-store-charcoal"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-store-charcoal block mb-1">
                  Order Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-store-card-border bg-store-surface text-xs text-store-text-primary focus:outline-none focus:border-store-charcoal"
                />
              </div>
            </div>

            <div className="pt-3">
              <Button type="submit" variant="dark" size="lg" fullWidth>
                Submit Verified Review
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}
