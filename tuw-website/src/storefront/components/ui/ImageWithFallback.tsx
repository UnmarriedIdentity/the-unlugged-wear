'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';

export interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackText?: string;
}

export default function ImageWithFallback({
  src,
  alt = '',
  fallbackSrc,
  fallbackText = 'Image not available',
  className = '',
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Server-rendered images often finish (or fail) before hydration attaches
  // onLoad/onError, so those events never reach React. Read the element's
  // settled state directly whenever the source changes.
  useEffect(() => {
    setError(false);
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      if (img.naturalWidth > 0) {
        setLoading(false);
      } else {
        setError(true);
        setLoading(false);
      }
    } else {
      setLoading(true);
    }
  }, [src]);

  if (error || !src) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          {...props}
        />
      );
    }

    return (
      <div
        role="img"
        aria-label={alt || fallbackText}
        className={`flex flex-col items-center justify-center gap-2 bg-[#F4F1EA] text-[#8A8A8A] p-4 text-center ${className}`}
      >
        <ImageOff size={24} />
        <span className="text-xs font-medium">{fallbackText}</span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      onLoad={() => setLoading(false)}
      onError={() => {
        setError(true);
        setLoading(false);
      }}
      className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${className}`}
      {...props}
    />
  );
}
