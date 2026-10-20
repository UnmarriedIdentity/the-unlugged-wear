'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import Tooltip from './Tooltip';
import type { TooltipSide } from '@/lib/tooltipPosition';

export interface InfoTooltipProps {
  /** Accessible name for the trigger, e.g. "More information about Style Code". */
  label: string;
  /** Supplementary copy shown in the tooltip. */
  content: string;
  /** Preferred side; the tooltip flips when the viewport is tight. */
  position?: TooltipSide;
  /** Icon size in px. Default 14. */
  size?: number;
}

// Standard label hint (TT2): a quiet circular Info icon that reveals a
// supplementary tooltip. It is a native button outside the <label> so it can
// never submit the form or steal the label's htmlFor behaviour.
export default function InfoTooltip({
  label,
  content,
  position = 'top',
  size = 14,
}: InfoTooltipProps) {
  const [active, setActive] = useState(false);

  return (
    <Tooltip content={content} position={position}>
      <button
        type="button"
        aria-label={label}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          padding: 0,
          border: 'none',
          borderRadius: 'var(--tuw-radius-pill, 9999px)',
          backgroundColor: 'transparent',
          color: active
            ? 'var(--tuw-action-primary, #7539FF)'
            : 'var(--tuw-text-secondary, #5D6772)',
          cursor: 'help',
          flexShrink: 0,
          transition: 'color 0.15s ease',
          outlineOffset: 2,
        }}
      >
        <Info size={size} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
