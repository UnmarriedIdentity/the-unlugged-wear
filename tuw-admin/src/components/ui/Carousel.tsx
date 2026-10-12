'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselSlide {
  type: 'image' | 'video';
  src: string;
  alt: string;
  poster?: string;
}

export interface CarouselProps {
  slides: CarouselSlide[];
  ariaLabel?: string;
  /** Frame aspect ratio. Default '4 / 3'. */
  aspect?: string;
  /** Dots or thumbnail filmstrip navigation. Default 'dots'. */
  variant?: 'dots' | 'filmstrip';
}

// Customer-view gallery (MD2): dots + chevron navigation over a fixed-aspect
// canvas-letterboxed frame. Media renders contain (never crop, never
// stretch). Video slides carry native controls and never autoplay. Renders
// null when empty — the caller owns the empty text.
// Plain <img> (not next/image): slides include blob: upload previews, which
// the optimizer rejects — same constraint as ImageWithFallback.
export default function Carousel({ slides, ariaLabel = 'Gallery', aspect = '4 / 3', variant = 'dots' }: CarouselProps) {
  const [index, setIndex] = useState(0);
  if (slides.length === 0) return null;
  const safeIndex = ((index % slides.length) + slides.length) % slides.length;
  const slide = slides[safeIndex];
  const navBtn = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
    backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
    color: 'var(--tuw-text-secondary, #5D6772)',
    cursor: 'pointer',
  } as const;

  return (
    <div>
      <div
        role="region"
        aria-label={ariaLabel}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspect,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
          backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
        }}
      >
        {slide.type === 'video' ? (
          <video
            key={slide.src}
            src={slide.src}
            poster={slide.poster}
            controls
            preload="metadata"
            aria-label={slide.alt}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.src}
            alt={slide.alt}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
        {slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => setIndex(safeIndex - 1)}
              style={{ ...navBtn, position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => setIndex(safeIndex + 1)}
              style={{ ...navBtn, position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : null}
      </div>
      {slides.length > 1 ? (
        variant === 'filmstrip' ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }} role="tablist" aria-label={`${ariaLabel} slides`}>
            {slides.map((s, i) => (
              <button
                key={`${s.type}-${s.src}-${i}`}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Go to slide ${i + 1} of ${slides.length}`}
                onClick={() => setIndex(i)}
                style={{
                  position: 'relative',
                  width: 56,
                  height: 56,
                  padding: 0,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: i === safeIndex
                    ? '2px solid var(--tuw-action-primary, #7539FF)'
                    : '1px solid var(--tuw-border-subtle, #E5E7EB)',
                  backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {s.type === 'video' ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      backgroundColor: '#1A1A1A',
                    }}
                  >
                    REEL
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {i === 0 && s.type === 'image' ? (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: 2,
                      right: 2,
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textAlign: 'center',
                      color: '#FFFFFF',
                      backgroundColor: 'var(--tuw-action-primary, #7539FF)',
                      borderRadius: 3,
                      padding: '1px 0',
                    }}
                  >
                    COVER
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }} role="tablist" aria-label={`${ariaLabel} slides`}>
          {slides.map((s, i) => (
            <button
              key={`${s.type}-${s.src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`Go to slide ${i + 1} of ${slides.length}`}
              onClick={() => setIndex(i)}
              style={{
                width: i === safeIndex ? 20 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                backgroundColor:
                  i === safeIndex
                    ? 'var(--tuw-action-primary, #7539FF)'
                    : 'var(--tuw-border-control, #D1D5DB)',
                cursor: 'pointer',
                padding: 0,
                transition: 'width 0.15s ease, background-color 0.15s ease',
              }}
            />
          ))}
        </div>
        )
      ) : null}
    </div>
  );
}
