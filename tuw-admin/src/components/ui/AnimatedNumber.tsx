'use client';

import React from 'react';

export interface AnimatedNumberProps {
  value: number;
  format: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
  /** Tint applied while counting up (e.g. success text class). */
  upClassName?: string;
  /** Tint applied while counting down (e.g. error text class). */
  downClassName?: string;
  /** Floor duration in ms (default 1000). */
  minDurationMs?: number;
  /** Ceiling duration in ms (default 1500). */
  maxDurationMs?: number;
  /** Relative change that reaches the ceiling (default 0.5 = 50%). */
  fullScaleAt?: number;
}

// Global count-tween readout (V1): a single ease-in-out traverse from the
// previous value to `value` — slow start, slow arrival, no pauses, no
// pulses. Data-only props — feed it mock or live numbers anywhere without
// touching this component. Resting DOM is untouched (natural flow).
// Reduced motion swaps instantly with no tint.
export default function AnimatedNumber({
  value,
  format,
  className = '',
  style = {},
  upClassName = '',
  downClassName = '',
  minDurationMs = 1000,
  maxDurationMs = 1500,
  fullScaleAt = 0.5,
}: AnimatedNumberProps) {
  const [display, setDisplay] = React.useState(value);
  const [tint, setTint] = React.useState<0 | 1 | -1>(0);
  const displayRef = React.useRef(value);
  const raf = React.useRef<number | null>(null);
  const linger = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      if (linger.current !== null) {
        clearTimeout(linger.current);
        linger.current = null;
      }
    },
    [],
  );

  React.useEffect(() => {
    const from = displayRef.current;
    if (from === value) return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    if (linger.current !== null) {
      clearTimeout(linger.current);
      linger.current = null;
    }
    const span = maxDurationMs - minDurationMs;
    const relative = Math.abs(value - from) / Math.max(Math.abs(from), 1);
    const duration = minDurationMs + span * Math.min(1, relative / fullScaleAt);
    setTint(value > from ? 1 : -1);
    const startedAt =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      // easeInOutCubic: slow start, slow arrival, steady middle.
      const eased =
        progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const current = Math.round(from + (value - from) * eased);
      displayRef.current = current;
      setDisplay(current);
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        raf.current = null;
        // Tint lands with the final digit, lingers, then the CSS color
        // transition melts it back to primary — no mid-run snap.
        linger.current = setTimeout(() => {
          linger.current = null;
          setTint(0);
        }, 150);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
  }, [value, minDurationMs, maxDurationMs, fullScaleAt]);

  const toneClass = tint === 1 ? upClassName : tint === -1 ? downClassName : '';
  return (
    <span className={`${className} ${toneClass}`.trim().replace(/\s+/g, ' ')} style={style}>
      {format(display)}
    </span>
  );
}
