'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import ImageWithFallback from '../ui/ImageWithFallback';
import Modal from '../ui/Modal';

export interface ProductGalleryProps {
  images: {
    url: string;
    alt: string;
    color?: string;
  }[];
  title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const activeImage = images[activeIndex] || images[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      {/* Thumbnail Selector Column */}
      {images.length > 1 && (
        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto no-scrollbar shrink-0">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1} of ${title}`}
              className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-[#F4F1EA] border transition-all shrink-0 cursor-pointer ${
                activeIndex === idx
                  ? 'border-[#1A1A1A] ring-2 ring-[#1A1A1A]/20'
                  : 'border-[#E2DDCF] opacity-70 hover:opacity-100'
              }`}
            >
              <ImageWithFallback
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image Viewport */}
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#F4F1EA] border border-[#E2DDCF]">
        <ImageWithFallback
          src={activeImage.url}
          alt={activeImage.alt}
          className="w-full h-full object-cover"
        />

        {/* Zoom trigger */}
        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          aria-label="Enlarge image"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-xs border border-[#E2DDCF] flex items-center justify-center text-[#1A1A1A] hover:bg-white transition-transform active:scale-95 shadow-sm"
        >
          <Maximize2 size={16} />
        </button>

        {/* Prev / Next controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-xs border border-[#E2DDCF] flex items-center justify-center text-[#1A1A1A] hover:bg-white transition-all active:scale-90"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-xs border border-[#E2DDCF] flex items-center justify-center text-[#1A1A1A] hover:bg-white transition-all active:scale-90"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dots on mobile */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 lg:hidden">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeIndex === i ? 'bg-[#1A1A1A] w-5' : 'bg-[#1A1A1A]/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Zoom Modal */}
      <Modal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        maxWidth="max-w-4xl"
        title={title}
        subtitle={activeImage.alt}
      >
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#FAF9F6]">
          <ImageWithFallback
            src={activeImage.url}
            alt={activeImage.alt}
            className="w-full h-full object-contain"
          />
        </div>
      </Modal>
    </div>
  );
}
