'use client';

import React from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, AlertTriangle } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
  title: string;
  timestamp?: string;
  description?: string;
}

export interface OrderTimelineProps {
  events: TimelineEvent[];
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Visual timeline for order tracking and lifecycle events
 */
export default function OrderTimeline({
  events,
  className = '',
  style = {},
}: OrderTimelineProps) {
  const getIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} color="var(--tuw-status-success, #10B981)" />;
      case 'current':
        return <Clock size={16} color="var(--tuw-action-primary, #7539FF)" />;
      case 'failed':
        return <AlertTriangle size={16} color="var(--tuw-status-danger, #EF4444)" />;
      default:
        return (
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--tuw-border-strong, #D1D5DB)',
            }}
          />
        );
    }
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        paddingLeft: '24px',
        ...style,
      }}
    >
      {events.map((event, index) => {
        const isLast = index === events.length - 1;

        return (
          <div
            key={event.id}
            style={{
              position: 'relative',
              paddingBottom: isLast ? '0px' : '24px',
            }}
          >
            {/* Timeline vertical connector */}
            {!isLast && (
              <div
                style={{
                  position: 'absolute',
                  left: '-16px',
                  top: '18px',
                  bottom: '0px',
                  width: '2px',
                  backgroundColor:
                    event.status === 'completed'
                      ? 'var(--tuw-status-success, #10B981)'
                      : 'var(--tuw-border-subtle, #E5E7EB)',
                }}
              />
            )}

            {/* Timeline icon node */}
            <div
              style={{
                position: 'absolute',
                left: '-24px',
                top: '0px',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
              }}
            >
              {getIcon(event.status)}
            </div>

            {/* Timeline content */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: event.status === 'current' ? 600 : 500,
                    color: 'var(--tuw-text-primary, #262626)',
                  }}
                >
                  {event.title}
                </span>
                {event.timestamp && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--tuw-text-tertiary, #9CA3AF)',
                    }}
                  >
                    {event.timestamp}
                  </span>
                )}
              </div>
              {event.description && (
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--tuw-text-secondary, #5D6772)',
                    margin: '4px 0 0 0',
                    lineHeight: '18px',
                  }}
                >
                  {event.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
