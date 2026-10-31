'use client';

import React from 'react';
import type { SpotlightResult } from './types';

export const SEARCH_FREQUENT_KEY = 'tuw_search_frequent';

interface StoredJump {
  title: string;
  subtitle: string;
  href: string;
  scope: SpotlightResult['scope'];
  tileTone: SpotlightResult['tileTone'];
  count: number;
  ts: number;
}

interface FrequentStore {
  queries: Record<string, number>;
  jumps: Record<string, StoredJump>;
}

export interface FrequentJump extends StoredJump {
  id: string;
}

const MAX_ENTRIES = 20;

function loadStore(): FrequentStore {
  try {
    const raw = localStorage.getItem(SEARCH_FREQUENT_KEY);
    if (!raw) return { queries: {}, jumps: {} };
    const parsed = JSON.parse(raw) as Partial<FrequentStore>;
    if (typeof parsed !== 'object' || parsed === null) return { queries: {}, jumps: {} };
    return {
      queries: typeof parsed.queries === 'object' && parsed.queries !== null ? parsed.queries : {},
      jumps: typeof parsed.jumps === 'object' && parsed.jumps !== null ? parsed.jumps : {},
    };
  } catch {
    return { queries: {}, jumps: {} };
  }
}

function topQueries(store: FrequentStore, limit = 5): string[] {
  return Object.entries(store.queries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([q]) => q);
}

function topJumps(store: FrequentStore, limit = 3): FrequentJump[] {
  return Object.entries(store.jumps)
    .sort((a, b) => b[1].count - a[1].count || b[1].ts - a[1].ts)
    .slice(0, limit)
    .map(([id, j]) => ({ ...j, id }));
}

// Frequent-search engine (P1): counts every jumped query + destination in
// localStorage, ranked by use. Session-persistent, demo-reset-cleared.
// A per-user server store replaces these internals later; the returned
// shape ({ topQueries, frequentJumps, record }) stays identical.
export function useFrequentQueries() {
  const [version, setVersion] = React.useState(0);

  const snapshot = React.useMemo(() => {
    void version;
    if (typeof window === 'undefined') return { queries: {} as Record<string, number>, jumps: {} as Record<string, StoredJump> };
    return loadStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const record = React.useCallback((query: string, result?: SpotlightResult) => {
    try {
      const store = loadStore();
      const q = query.trim();
      if (q) store.queries[q] = (store.queries[q] ?? 0) + 1;
      if (result) {
        const prev = store.jumps[result.id];
        store.jumps[result.id] = {
          title: result.title,
          subtitle: result.subtitle,
          href: result.href,
          scope: result.scope,
          tileTone: result.tileTone,
          count: (prev?.count ?? 0) + 1,
          ts: Date.now(),
        };
      }
      const trimRecord = (obj: Record<string, unknown>) => {
        const entries = Object.entries(obj).sort((a, b) => {
          const ca = typeof a[1] === 'number' ? a[1] : (a[1] as StoredJump).count;
          const cb = typeof b[1] === 'number' ? b[1] : (b[1] as StoredJump).count;
          return cb - ca;
        });
        return Object.fromEntries(entries.slice(0, MAX_ENTRIES));
      };
      localStorage.setItem(
        SEARCH_FREQUENT_KEY,
        JSON.stringify({ queries: trimRecord(store.queries), jumps: trimRecord(store.jumps) }),
      );
      setVersion((v) => v + 1);
    } catch {
      // storage unavailable (private mode) — search still works, counts don't persist
    }
  }, []);

  return {
    topQueries: topQueries(snapshot, 5),
    frequentJumps: topJumps(snapshot, 3),
    record,
  };
}
