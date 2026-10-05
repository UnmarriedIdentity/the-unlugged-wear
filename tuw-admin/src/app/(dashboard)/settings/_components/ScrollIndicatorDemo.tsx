'use client';

import React, { useState } from 'react';

type DemoMode = 'off' | 'masks' | 'bar';

const ROWS = Array.from({ length: 12 }, (_, i) => `Row ${i + 1}`);

const MODES: { key: DemoMode; label: string; blurb: string }[] = [
  { key: 'off', label: 'Off', blurb: 'No indicator. Overflow is discoverable only by scrolling.' },
  { key: 'masks', label: 'Fade masks', blurb: 'Soft edge-shadows appear only while more content lies in that direction.' },
  { key: 'bar', label: 'Thin bar', blurb: 'A 4px bar fades in while scrolling, hidden at rest.' },
];

/**
 * Interactive scroll-indicator comparison (Settings preview only).
 * Mini rail demonstrates Off / Fade masks / Thin bar live.
 */
export default function ScrollIndicatorDemo() {
  const [mode, setMode] = useState<DemoMode>('masks');
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(true);
  const [barTop, setBarTop] = useState(0);
  const stripRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setCanUp(el.scrollTop > 4);
    setCanDown(max > 4 && el.scrollTop < max - 4);
  }, [mode]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    setCanUp(el.scrollTop > 4);
    setCanDown(max > 4 && el.scrollTop < max - 4);
    setBarTop(max > 0 ? (el.scrollTop / max) * (200 - 48) : 0);
  };

  const active = MODES.find((m) => m.key === mode)!;

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>
        Scroll indicators (preview)
      </h4>
      <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '4px 0 12px' }}>
        Compare how a scrollable rail signals hidden content. Scroll the mini rail below.
      </p>

      <svg viewBox="0 0 560 120" width="100%" role="img" aria-label="Indicator options diagram" style={{ display: 'block', marginBottom: 12 }}>
        <text x="70" y="14" textAnchor="middle" fontSize="11" fill="#5D6772">Off — nothing shows</text>
        <rect x="10" y="22" width="120" height="88" rx="8" fill="#F7F8F9" stroke="#E9E9E9" />
        <rect x="22" y="34" width="96" height="10" rx="5" fill="#E9E9E9" />
        <rect x="22" y="50" width="96" height="10" rx="5" fill="#E9E9E9" />
        <rect x="22" y="66" width="96" height="10" rx="5" fill="#E9E9E9" />
        <rect x="22" y="82" width="96" height="10" rx="5" fill="#E9E9E9" />
        <text x="280" y="14" textAnchor="middle" fontSize="11" fill="#5D6772">Masks — soft edge shadows</text>
        <rect x="220" y="22" width="120" height="88" rx="8" fill="#F7F8F9" stroke="#E9E9E9" />
        <rect x="232" y="34" width="96" height="10" rx="5" fill="#E9E9E9" />
        <rect x="232" y="50" width="96" height="10" rx="5" fill="#E9E9E9" />
        <rect x="232" y="66" width="96" height="10" rx="5" fill="#E9E9E9" />
        <rect x="232" y="82" width="96" height="10" rx="5" fill="#E9E9E9" />
        <rect x="220" y="22" width="120" height="22" rx="8" fill="#262626" opacity="0.08" />
        <rect x="220" y="88" width="120" height="22" rx="8" fill="#262626" opacity="0.08" />
        <text x="490" y="14" textAnchor="middle" fontSize="11" fill="#5D6772">Bar — 4px thumb</text>
        <rect x="430" y="22" width="120" height="88" rx="8" fill="#F7F8F9" stroke="#E9E9E9" />
        <rect x="442" y="34" width="84" height="10" rx="5" fill="#E9E9E9" />
        <rect x="442" y="50" width="84" height="10" rx="5" fill="#E9E9E9" />
        <rect x="442" y="66" width="84" height="10" rx="5" fill="#E9E9E9" />
        <rect x="442" y="82" width="84" height="10" rx="5" fill="#E9E9E9" />
        <rect x="540" y="30" width="4" height="40" rx="2" fill="#90979F" />
      </svg>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--tuw-border-control, #90979F)',
              backgroundColor: mode === m.key ? 'var(--tuw-action-primary, #7539FF)' : '#FFFFFF',
              color: mode === m.key ? '#FFFFFF' : 'var(--tuw-text-primary, #262626)',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '0 0 12px' }}>{active.blurb}</p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', width: 80 }}>
          <div
            ref={stripRef}
            onScroll={handleScroll}
            style={{ height: 200, overflowY: 'auto', overflowX: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid var(--tuw-border-subtle, #E9E9E9)', borderRadius: 12, scrollbarWidth: mode === 'bar' ? 'thin' : 'none' }}
          >
            {mode === 'masks' && (
              <>
                <div aria-hidden="true" style={{ position: 'sticky', top: 0, zIndex: 2, height: 24, marginBottom: -24, background: 'linear-gradient(to bottom, #F7F8F9, transparent)', opacity: canUp ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none' }} />
              </>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
              {ROWS.map((r) => (
                <div key={r} style={{ height: 28, borderRadius: 8, backgroundColor: '#F7F8F9', border: '1px solid #E9E9E9', fontSize: 11, color: '#5D6772', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {r}
                </div>
              ))}
            </div>
            {mode === 'masks' && (
              <div aria-hidden="true" style={{ position: 'sticky', bottom: 0, zIndex: 2, height: 24, marginTop: -24, background: 'linear-gradient(to top, #F7F8F9, transparent)', opacity: canDown ? 1 : 0, transition: 'opacity 0.2s', pointerEvents: 'none' }} />
            )}
          </div>
          {mode === 'bar' && (
            <div aria-hidden="true" style={{ position: 'absolute', top: 8, right: 6, bottom: 8, width: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.08)' }}>
              <div style={{ position: 'absolute', top: barTop, width: 4, height: 48, borderRadius: 2, backgroundColor: '#90979F' }} />
            </div>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0, maxWidth: 420 }}>
          {mode === 'off' && 'No affordance: overflow exists but nothing signals it. Scroll the strip to feel the difference.'}
          {mode === 'masks' && 'Edge shadows fade in only while content hides in that direction — the current sidebar approach.'}
          {mode === 'bar' && 'A slim thumb tracks scroll position and fades at rest. Tell us which to keep.'}
        </p>
      </div>
    </div>
  );
}
