'use client';

import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

export interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackText?: string;
}

/**
 * ImageWithFallback component that gracefully displays a fallback when images fail to load.
 */
export default function ImageWithFallback({
  src,
  alt = '',
  fallbackSrc,
  fallbackText = 'Image not available',
  className = '',
  style = {},
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error || !src) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          style={style}
          {...props}
        />
      );
    }

    return (
      <div
        role="img"
        aria-label={alt || fallbackText}
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: 'var(--tuw-bg-surface-subtle, #F1F3F5)',
          color: 'var(--tuw-text-tertiary, #9CA3AF)',
          borderRadius: 'var(--tuw-radius-control, 8px)',
          border: '1px dashed var(--tuw-border-subtle, #E2E4E6)',
          padding: '16px',
          width: '100%',
          height: '100%',
          minHeight: '120px',
          boxSizing: 'border-box',
          ...style,
        }}
      >
        <ImageOff size={24} />
        <span style={{ fontSize: '12px', textAlign: 'center', fontWeight: 500 }}>
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onLoad={() => setLoading(false)}
      onError={() => {
        setError(true);
        setLoading(false);
      }}
      className={className}
      style={{
        transition: 'opacity 0.2s ease',
        opacity: loading ? 0.7 : 1,
        ...style,
      }}
      {...props}
    />
  );
}
