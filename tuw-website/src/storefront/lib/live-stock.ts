'use client';

import { useSyncExternalStore } from 'react';
import type { ProductSize } from './types';

// A tiny client-side channel for the product page's live stock read.
//
// The page body is cached, so it renders from the cached catalogue and its
// sizes can be up to an hour old. A small Suspense hole on the page streams
// the fresh sizes in and publishes them here; the already-hydrated buy box
// subscribes and re-renders. That keeps the static shell static while the
// add-to-bag button still tells the truth about stock.
const published = new Map<string, ProductSize[]>();
const listeners = new Set<() => void>();

export function publishStock(slug: string, sizes: ProductSize[]): void {
  published.set(slug, sizes);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Live sizes for `slug` once published; the cached ones before that. */
export function useLiveSizes(slug: string, fallback: ProductSize[]): ProductSize[] {
  return useSyncExternalStore(
    subscribe,
    () => published.get(slug) ?? fallback,
    () => fallback
  );
}
