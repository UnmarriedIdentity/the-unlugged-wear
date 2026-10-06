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
  /** Floor duration in ms (default 800). */
  minDurationMs?: number;
  /** Ceiling duration in ms (default 1200). */
  maxDurationMs?: number;
  /** Relative change that reaches the ceiling (default 0.5 = 50%). */
  fullScaleAt?: number;
}

// Global count-tween readout (N2): tweens integer display from the previous
// value to `value` with ease-out, so big jumps fly and small drifts tick
// gently within the same duration window. Data-only props — feed it mock
// or live numbers anywhere without touching this component.
// Reduced motion swaps instantly with no tint.
export default function AnimatedNumber({
  value,
  format,
  className = '',
  style = {},
  upClassName = '',
  downClassName = '',
  minDurationMs = 800,
  maxDurationMs = 1200,
  fullScaleAt = 0.5,
}: AnimatedNumberProps) {
  const [display, setDisplay] = React.useState(value);
  const [direction, setDirection] = React.useState<0 | 1 | -1>(0);
  const displayRef = React.useRef(value);
  const raf = React.useRef<number | null>(null);

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
    const span = maxDurationMs - minDurationMs;
    const relative = Math.abs(value - from) / Math.max(Math.abs(from), 1);
    const duration = minDurationMs + span * Math.min(1, relative / fullScaleAt);
    setDirection(value > from ? 1 : -1);
    const startedAt =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (value - from) * eased);
      displayRef.current = current;
      setDisplay(current);
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        raf.current = null;
        setDirection(0);
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

  const toneClass = direction === 1 ? upClassName : direction === -1 ? downClassName : '';
  return (
    <span className={`${className} ${toneClass}`.trim()} style={style}>
      {format(display)}
    </span>
  );
}
