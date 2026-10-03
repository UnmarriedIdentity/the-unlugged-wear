'use client';

import React, { useState } from 'react';
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
