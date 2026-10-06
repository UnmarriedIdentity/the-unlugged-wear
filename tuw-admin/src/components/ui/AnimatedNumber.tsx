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
  /** Class applied during the landing pulse (removed after landMs). */
  landClassName?: string;
  /** Fired once the tween lands (e.g. to pop a sibling badge). */
  onLanded?: () => void;
  /** Floor duration in ms (default 800). */
  minDurationMs?: number;
  /** Ceiling duration in ms (default 1200). */
  maxDurationMs?: number;
  /** Relative change that reaches the ceiling (default 0.5 = 50%). */
  fullScaleAt?: number;
  /** Anticipation hold before traversing, in ms (default 180). */
  holdMs?: number;
  /** Landing pulse length in ms (default 180). */
  landMs?: number;
}

// Global count-tween readout (N3 three-beat): hold (tint on, value static)
// -> expo traverse inside a transient width dock -> land pulse. Big jumps
// fly and small drifts tick gently across 800-1200ms. Data-only props —
// feed it mock or live numbers anywhere without touching this component.
// The dock exists only while animating; resting DOM is byte-identical.
// Reduced motion swaps instantly with no tint and no pulse.
export default function AnimatedNumber({
  value,
  format,
  className = '',
  style = {},
  upClassName = '',
  downClassName = '',
  landClassName = '',
  onLanded,
  minDurationMs = 800,
  maxDurationMs = 1200,
  fullScaleAt = 0.5,
  holdMs = 180,
  landMs = 180,
}: AnimatedNumberProps) {
  const [display, setDisplay] = React.useState(value);
  const [tint, setTint] = React.useState<0 | 1 | -1>(0);
  const [dockedWidth, setDockedWidth] = React.useState<string | null>(null);
  const [landed, setLanded] = React.useState(false);
  const displayRef = React.useRef(value);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const raf = React.useRef<number | null>(null);
  const onLandedRef = React.useRef(onLanded);
  onLandedRef.current = onLanded;

  const clearAll = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  };

  React.useEffect(() => clearAll, []);

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
    clearAll();
    const direction: 0 | 1 | -1 = value > from ? 1 : -1;
    // Transient dock sized to the wider endpoint — holds siblings still
    // during the tween, removed on settle so resting layout never changes.
    const dockChars = Math.max(format(from).length, format(value).length) + 1;
    setDockedWidth(`${dockChars}ch`);
    setTint(direction);
    const span = maxDurationMs - minDurationMs;
    const relative = Math.abs(value - from) / Math.max(Math.abs(from), 1);
    const duration = minDurationMs + span * Math.min(1, relative / fullScaleAt);
    let tintReleased = false;
    const releaseTint = () => {
      if (!tintReleased) {
        tintReleased = true;
        setTint(0);
      }
    };
    const finish = () => {
      displayRef.current = value;
      setDisplay(value);
      releaseTint();
      setLanded(true);
      onLandedRef.current?.();
      timers.current.push(
        setTimeout(() => {
          setLanded(false);
          setDockedWidth(null);
        }, landMs),
      );
    };
    timers.current.push(
      setTimeout(() => {
        const startedAt =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - startedAt) / duration);
          // easeOutExpo: aggressive traverse, gentle arrival.
          const eased = progress >= 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const current = Math.round(from + (value - from) * eased);
          displayRef.current = current;
          setDisplay(current);
          if (progress >= 0.7) releaseTint();
          if (progress < 1) {
            raf.current = requestAnimationFrame(tick);
          } else {
            raf.current = null;
            finish();
          }
        };
        raf.current = requestAnimationFrame(tick);
      }, holdMs),
    );
    return clearAll;
  }, [value, minDurationMs, maxDurationMs, fullScaleAt, holdMs, landMs, format]);

  const toneClass = tint === 1 ? upClassName : tint === -1 ? downClassName : '';
  const landClass = landed ? landClassName : '';
  return (
    <span
      className={`${className} ${toneClass} ${landClass}`.trim().replace(/\s+/g, ' ')}
      style={dockedWidth ? { ...style, display: 'inline-block', minWidth: dockedWidth } : style}
    >
      {format(display)}
    </span>
  );
}
