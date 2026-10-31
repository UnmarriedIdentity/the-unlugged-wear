'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import ImageWithFallback from '../ui/ImageWithFallback';
import Modal from '../ui/Modal';

export interface ProductGalleryProps {
  images: {
    url: string;
    alt: string;
    color?: string;
    label?: string;
  }[];
  title: string;
  videoUrl?: string;
  selectedColorValue?: string;
}

export default function ProductGallery({
  images,
  title,
  videoUrl,
  selectedColorValue,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Synchronize gallery active image with selected colorway
  useEffect(() => {
    if (!selectedColorValue) return;
    const matchingIndex = images.findIndex(
      (img) => img.color?.toLowerCase() === selectedColorValue.toLowerCase()
    );
    if (matchingIndex !== -1) {
      setActiveIndex(matchingIndex);
    }
  }, [selectedColorValue, images]);

  const totalSlides = images.length + (videoUrl ? 1 : 0);
  const isVideoActive = Boolean(videoUrl && activeIndex === images.length);
  const activeImage = images[activeIndex] || images[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <div className="w-full">
      {/* 1. DESKTOP EDITORIAL QUAD GALLERY (Figma Node 354:24651 FINAL PDP) */}
      <div className="hidden lg:flex flex-col gap-4">
        {/* Primary Large Hero Photo or Active Color Focus */}
        <div className="relative aspect-4/5 w-full rounded-2xl overflow-hidden bg-store-cream border border-store-card-border group">
          {isVideoActive ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageWithFallback
              src={activeImage.url}
              alt={activeImage.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
          )}

          {/* Angle Label matching Figma */}
          {activeImage.label && (
            <span className="absolute top-4 left-4 text-[11px] font-mono tracking-wider font-semibold uppercase text-store-charcoal/90 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md pointer-events-none shadow-2xs border border-store-card-border/60 z-10">
              {activeImage.label}
            </span>
          )}

          {/* Enlarge button */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            aria-label="Enlarge image"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-xs border border-store-card-border flex items-center justify-center text-store-charcoal hover:bg-white transition-transform active:scale-95 shadow-xs cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <Maximize2 size={16} />
          </button>

          {videoUrl && (
            <button
              type="button"
              onClick={() => setActiveIndex(images.length)}
              className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-full bg-store-charcoal/90 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1.5 hover:bg-store-charcoal transition-colors cursor-pointer"
            >
              <span>▶ Atelier Reel</span>
            </button>
          )}
        </div>

        {/* 2-Column Grid for Secondary Angles / Lifestyle Details */}
        {images.length > 1 && (
          <div className="grid grid-cols-2 gap-4">
            {images.slice(1).map((img, idx) => {
              const actualIdx = idx + 1;
              const isSelected = activeIndex === actualIdx;
              return (
                <div
                  key={actualIdx}
                  onClick={() => setActiveIndex(actualIdx)}
                  className={`relative aspect-4/5 rounded-2xl overflow-hidden bg-store-cream border transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-store-charcoal ring-2 ring-store-charcoal/30'
                      : 'border-store-card-border hover:border-store-charcoal/50'
                  }`}
                >
                  <ImageWithFallback
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(actualIdx);
                      setIsZoomOpen(true);
                    }}
                    aria-label="Enlarge angle"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs border border-store-card-border flex items-center justify-center text-store-charcoal hover:bg-white transition-transform active:scale-95 shadow-xs cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <Maximize2 size={14} />
                  </button>
                  {img.label && (
                    <span className="absolute top-3 left-3 text-[10px] font-mono tracking-wider font-semibold uppercase text-store-charcoal/90 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md pointer-events-none shadow-2xs border border-store-card-border/60 z-10">
                      {img.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. MOBILE & TABLET SLIDER VIEWPORT */}
      <div className="lg:hidden relative aspect-3/4 w-full rounded-2xl overflow-hidden bg-store-cream border border-store-card-border">
        {isVideoActive ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageWithFallback
            src={activeImage.url}
            alt={activeImage.alt}
            className="w-full h-full object-cover"
          />
        )}

        {/* Angle Label matching Figma */}
        {activeImage.label && (
          <span className="absolute top-4 left-4 text-[11px] font-mono tracking-wider font-semibold uppercase text-store-charcoal/90 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md pointer-events-none shadow-2xs border border-store-card-border/60 z-10">
            {activeImage.label}
          </span>
        )}

        {/* Zoom trigger */}
        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          aria-label="Enlarge image"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-xs border border-store-card-border flex items-center justify-center text-store-charcoal hover:bg-white transition-transform active:scale-95 shadow-xs cursor-pointer"
        >
          <Maximize2 size={16} />
        </button>

        {/* Prev / Next controls */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-xs border border-store-card-border flex items-center justify-center text-store-charcoal hover:bg-white transition-all active:scale-90 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-xs border border-store-card-border flex items-center justify-center text-store-charcoal hover:bg-white transition-all active:scale-90 cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Mobile Pagination Dots */}
        {totalSlides > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  activeIndex === i ? 'bg-store-charcoal w-5' : 'bg-store-charcoal/30 w-2'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. LIGHTBOX ZOOM MODAL */}
      <Modal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        maxWidth="max-w-4xl"
        title={title}
        subtitle={
          isVideoActive
            ? 'Atelier Video Reel'
            : `Image ${activeIndex + 1} of ${images.length} • ${activeImage.alt}`
        }
      >
        <div className="relative aspect-3/4 sm:aspect-4/3 w-full rounded-xl overflow-hidden bg-store-canvas">
          {isVideoActive ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <ImageWithFallback
              src={activeImage.url}
              alt={activeImage.alt}
              className="w-full h-full object-contain"
            />
          )}

          {totalSlides > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-4 py-2 rounded-full border border-store-card-border shadow-xs">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous image"
                className="p-1 hover:text-store-action-primary cursor-pointer text-store-charcoal"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-store-charcoal">
                {activeIndex + 1} / {totalSlides}
              </span>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next image"
                className="p-1 hover:text-store-action-primary cursor-pointer text-store-charcoal"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
