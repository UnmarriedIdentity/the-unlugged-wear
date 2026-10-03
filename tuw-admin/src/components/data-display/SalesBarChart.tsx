'use client';

import React from 'react';

export interface SalesDataPoint {
  day: string;
  lastWeek: number;
  thisWeek: number;
  lastVal: string;
  thisVal: string;
}

interface SalesBarChartProps {
  data: SalesDataPoint[];
}

export function SalesBarChart({ data }: SalesBarChartProps) {
  return (
    <div style={{ display: 'flex', width: '100%', height: 230, gap: 16, position: 'relative' }}>
      {/* Y-Axis Labels */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingBottom: 24,
          fontSize: 12,
          fontWeight: 400,
          color: 'var(--tuw-text-secondary, #5D6772)',
          minWidth: 36,
          textAlign: 'right',
          fontFamily: 'var(--font-main)',
        }}
      >
        <span>₹10k</span>
        <span>₹8k</span>
        <span>₹6k</span>
        <span>₹4k</span>
        <span>₹2k</span>
        <span>₹0</span>
      </div>

      {/* Chart Plot Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
        {/* Horizontal Dashed Grid Lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: '100%',
                height: 1,
                borderBottom: '1px dashed var(--tuw-border-subtle, #E5E7EB)',
              }}
            />
          ))}
        </div>

        {/* Bars Container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            padding: '0 10px',
            zIndex: 2,
            marginBottom: 8,
          }}
        >
          {data.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                height: '100%',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {/* Last Week Bar */}
              <div
                style={{
                  width: 24,
                  height: `${item.lastWeek}%`,
                  borderRadius: '6px 6px 0 0',
                  backgroundColor: 'var(--brand-lime, #C6EAA0)',
                  transition: 'height 0.4s ease, opacity 0.2s ease',
                }}
                title={`Last Week: ${item.lastVal}`}
              />

              {/* This Week Bar */}
              <div
                style={{
                  width: 24,
                  height: `${item.thisWeek}%`,
                  borderRadius: '6px 6px 0 0',
                  backgroundColor: 'var(--tuw-action-primary, #7539FF)',
                  transition: 'height 0.4s ease, opacity 0.2s ease',
                }}
                title={`This Week: ${item.thisVal}`}
              />
            </div>
          ))}
        </div>

        {/* X-Axis Labels */}
        <div
          style={{
            height: 24,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0 10px',
            fontSize: 12,
            fontWeight: 400,
            color: 'var(--tuw-text-secondary, #5D6772)',
            fontFamily: 'var(--font-main)',
          }}
        >
          {data.map((item, idx) => (
            <span key={idx} style={{ textAlign: 'center', width: 56 }}>
              {item.day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
