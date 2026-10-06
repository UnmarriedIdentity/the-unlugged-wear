'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Calendar as DateRangeCalendar } from '@/components/calendar';
import { OnlineBadge } from './OnlineBadge';
import { usePopoverAnimation } from '@/hooks/usePopoverAnimation';
import type { DateRange } from '@/hooks/useCalendarRange';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onlineLabel?: string;
}

// Welcome header row: greeting + online badge + date-range filter.
// The filter button shows a purple tint whenever a non-default range is
// applied; the popover label state lives here (presentation only).
export function DashboardHeader({ title, subtitle, onlineLabel = '2 online customers' }: DashboardHeaderProps) {
  const [rangeLabel, setRangeLabel] = useState('Today');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerAnim = usePopoverAnimation(pickerOpen, () => setPickerOpen(false));
  const isFiltered = rangeLabel !== 'Today';

  return (
    <div className={styles.welcomeRow}>
      <div className={styles.welcomeTextGroup}>
        <h2 className={styles.welcomeHeading}>{title}</h2>
        <p className={styles.welcomeSubtext}>{subtitle}</p>
      </div>

      <div className={styles.welcomeControls}>
        <OnlineBadge label={onlineLabel} />

        <div className="relative">
          <button
            type="button"
            className={isFiltered ? `${styles.dateFilterBtn} ${styles.dateFilterBtnActive}` : styles.dateFilterBtn}
            onClick={() => setPickerOpen((v) => !v)}
            aria-expanded={pickerAnim.visible}
            aria-haspopup="dialog"
          >
            <Calendar size={18} />
            <span>{rangeLabel}</span>
          </button>
          {pickerAnim.visible && (
            <>
              <div
                aria-hidden="true"
                onClick={() => setPickerOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute right-0 top-full z-50 mt-2 ${
                  pickerAnim.phase === 'closing'
                    ? 'animate-[popoverOut_0.15s_ease-in]'
                    : 'animate-[popoverIn_0.18s_ease-out]'
                }`}
              >
                <DateRangeCalendar
                  onApply={(range: DateRange, label: string) => {
                    setRangeLabel(label);
                    setPickerOpen(false);
                  }}
                  onClose={() => setPickerOpen(false)}
                />
              </div>
            </>
          )}
          </div>
        </div>
      </div>
  );
}
