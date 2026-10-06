'use client';

import React from 'react';
import { ArrowUpRight, ClipboardList, Compass, Package, Truck, Users } from 'lucide-react';
import type { SearchScope, SpotlightResult, TileTone } from './types';

const SCOPE_ICONS: Record<SearchScope, React.ReactNode> = {
  orders: <ClipboardList size={18} />,
  products: <Package size={18} />,
  customers: <Users size={18} />,
  shipments: <Truck size={18} />,
  pages: <Compass size={18} />,
};

const TILE_STYLES: Record<TileTone, { wash: string; ink: string }> = {
  purple: { wash: 'var(--tuw-bg-selected, #F8F5FF)', ink: 'var(--tuw-action-primary, #7539FF)' },
  blue: { wash: 'var(--tuw-bg-info, #F4F9FE)', ink: 'var(--tuw-text-info, #175CD3)' },
  green: { wash: 'var(--tuw-bg-success, #F4FBF7)', ink: 'var(--tuw-text-success, #187343)' },
  amber: { wash: 'var(--tuw-bg-warning, #FEFBF5)', ink: 'var(--tuw-text-warning, #856300)' },
  rose: { wash: 'var(--tuw-bg-error, #FEF4F4)', ink: 'var(--tuw-text-error, #C91818)' },
  cyan: { wash: 'var(--tuw-bg-info, #F4F9FE)', ink: 'var(--tuw-text-info, #175CD3)' },
  pink: { wash: 'var(--tuw-bg-selected, #F8F5FF)', ink: 'var(--tuw-action-primary, #7539FF)' },
  yellow: { wash: 'var(--tuw-bg-warning, #FEFBF5)', ink: 'var(--tuw-text-warning, #856300)' },
  teal: { wash: 'var(--tuw-bg-success, #F4FBF7)', ink: 'var(--tuw-text-success, #187343)' },
};

interface SpotlightRowProps {
  result: SpotlightResult;
  onJump: (result: SpotlightResult) => void;
  highlight?: string;
}

// Query-match highlighter (P3): matched substring in action-purple
// semibold, no background wash. Regex-escaped, case-insensitive.
function highlightMatch(text: string, term: string): React.ReactNode {
  const needle = term.trim();
  if (!needle) return text;
  const lower = text.toLowerCase();
  const query = needle.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let hit = lower.indexOf(query, cursor);
  let key = 0;
  while (hit !== -1) {
    if (hit > cursor) parts.push(text.slice(cursor, hit));
    parts.push(
      <span
        key={`m-${key++}`}
        style={{ color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 700 }}
      >
        {text.slice(hit, hit + query.length)}
      </span>,
    );
    cursor = hit + query.length;
    hit = lower.indexOf(query, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts.length > 0 ? parts : text;
}

// One spotlight result row (S4): tinted icon tile + title/sub + Jump pill.
// Whole-row click jumps (pill is a visual affordance of the same action).
// Jump-pill reuse verdict: ui Button outline/sm renders 36px tall — too
// heavy for this pill, so the row owns a token-driven 28px pill instead.
export function SpotlightRow({ result, onJump, highlight = '' }: SpotlightRowProps) {
  const tile = TILE_STYLES[result.tileTone];
  return (
    <button
      type="button"
      onClick={() => onJump(result)}
      className="spotlightRow"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-main)',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
    >
      <span
        aria-hidden="true"
        className="spot-tile"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          backgroundColor: tile.wash,
          color: tile.ink,
          border: '1px solid transparent',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {SCOPE_ICONS[result.scope]}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--tuw-text-primary, #262626)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {highlightMatch(result.title, highlight)}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--tuw-text-secondary, #5D6772)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '2px',
          }}
        >
          {highlightMatch(result.subtitle, highlight)}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="spot-jump"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--tuw-text-secondary, #5D6772)',
          backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
          border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
          borderRadius: '9999px',
          padding: '4px 10px',
          flexShrink: 0,
          transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
        }}
      >
        Jump
        <ArrowUpRight size={13} />
      </span>
    </button>
  );
}
