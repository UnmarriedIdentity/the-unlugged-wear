'use client';

import { useCallback, useMemo, useState } from 'react';

export type PresetKey = 'today' | 'yesterday' | 'last7' | 'last30' | 'last90';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface PresetDef {
  key: PresetKey;
  label: string;
}

export const RANGE_PRESETS: PresetDef[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'last90', label: 'Last 90 days' },
];

const DAY = 86_400_000;

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY);
}

export function formatDMY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function formatShortRange(range: DateRange, fallback = 'Today'): string {
  if (!range.start) return fallback;
  if (!range.end) return formatDMY(range.start);
  return `${formatDMY(range.start)} - ${formatDMY(range.end)}`;
}

/** Month grid cells (Monday-first). null = blank slot. */
export function monthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d += 1) cells.push(new Date(year, month, d));
  return cells;
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
}

export function sameDay(a: Date | null, b: Date | null): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Range-selection state machine. Presets commit instantly to draft; manual
 * picking is start -> end -> restart. Apply commits, Cancel reverts.
 */
export function useCalendarRange(today: Date = new Date()) {
  const now = useMemo(() => startOfDay(today), [today.getTime()]);
  const [window, setWindow] = useState(() => {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const cur = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      left: { year: prev.getFullYear(), month: prev.getMonth() },
      right: { year: cur.getFullYear(), month: cur.getMonth() },
    };
  });
  const [draft, setDraft] = useState<DateRange>({ start: null, end: null });
  const [committed, setCommitted] = useState<DateRange>({ start: null, end: null });
  const [preset, setPreset] = useState<PresetKey | 'custom' | null>(null);

  const keyOf = (m: { year: number; month: number }) => m.year * 12 + m.month;
  const fromKey = (k: number) => ({ year: Math.floor(k / 12), month: k % 12 });

  // Independent panels with push-along guard: the two months always differ.
  // Pure updaters (no nested setters) so StrictMode double-invoke stays safe.
  const shiftLeft = useCallback((dir: 1 | -1) => {
    setWindow((w) => {
      const next = fromKey(keyOf(w.left) + dir);
      return { left: next, right: keyOf(next) >= keyOf(w.right) ? fromKey(keyOf(next) + 1) : w.right };
    });
  }, []);

  const shiftRight = useCallback((dir: 1 | -1) => {
    setWindow((w) => {
      const next = fromKey(keyOf(w.right) + dir);
      return { left: keyOf(next) <= keyOf(w.left) ? fromKey(keyOf(next) - 1) : w.left, right: next };
    });
  }, []);

  const applyPreset = useCallback(
    (key: PresetKey) => {
      let range: DateRange;
      if (key === 'today') range = { start: now, end: now };
      else if (key === 'yesterday') range = { start: addDays(now, -1), end: addDays(now, -1) };
      else if (key === 'last7') range = { start: addDays(now, -6), end: now };
      else if (key === 'last30') range = { start: addDays(now, -29), end: now };
      else range = { start: addDays(now, -89), end: now };
      setDraft(range);
      setPreset(key);
    },
    [now]
  );

  const pickDay = useCallback(
    (day: Date) => {
      setPreset('custom');
      setDraft((prev) => {
        if (!prev.start || (prev.start && prev.end)) return { start: startOfDay(day), end: null };
        if (day < prev.start) return { start: startOfDay(day), end: null };
        return { start: prev.start, end: startOfDay(day) };
      });
    },
    []
  );

  const apply = useCallback(() => {
    setCommitted(draft);
    return draft;
  }, [draft]);

  const cancel = useCallback(() => {
    setDraft(committed);
  }, [committed]);

  const reset = useCallback(() => {
    setDraft({ start: null, end: null });
    setCommitted({ start: null, end: null });
    setPreset(null);
  }, []);

  return {
    months: [window.left, window.right],
    shiftLeft,
    shiftRight,
    draft,
    committed,
    preset,
    applyPreset,
    pickDay,
    apply,
    cancel,
    reset,
  };
}
