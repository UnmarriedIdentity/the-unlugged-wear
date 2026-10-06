'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Calendar as DateRangeCalendar } from '@/components/calendar';
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
  const isFiltered = rangeLabel !== 'Today';

  return (
    <div className={styles.welcomeRow}>
      <div className={styles.welcomeTextGroup}>
        <h2 className={styles.welcomeHeading}>{title}</h2>
        <p className={styles.welcomeSubtext}>{subtitle}</p>
      </div>

      <div className={styles.welcomeControls}>
        <div className={styles.onlineBadge}>
          <span className={styles.pulseDot} />
          <span>{onlineLabel}</span>
        </div>

        <div className="relative">
          <button
            type="button"
            className={isFiltered ? `${styles.dateFilterBtn} ${styles.dateFilterBtnActive}` : styles.dateFilterBtn}
            onClick={() => setPickerOpen((v) => !v)}
            aria-expanded={pickerOpen}
            aria-haspopup="dialog"
          >
            <Calendar size={18} />
            <span>{rangeLabel}</span>
          </button>
          {pickerOpen && (
            <>
              <div
                aria-hidden="true"
                onClick={() => setPickerOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute right-0 top-full z-50 mt-2">
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
