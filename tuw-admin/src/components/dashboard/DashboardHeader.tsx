'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Calendar as DateRangeCalendar } from '@/components/calendar';
import { OnlineBadge } from './OnlineBadge';
import { PageHeader } from '@/components/ui';
import { usePopoverAnimation } from '@/hooks/usePopoverAnimation';
import type { DateRange } from '@/hooks/useCalendarRange';

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
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <OnlineBadge label={onlineLabel} />

          <div className="relative">
          <button
            type="button"
            className={isFiltered ? 'home-dateFilterBtn home-dateFilterBtnActive' : 'home-dateFilterBtn'}
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
        </>
      }
    />
  );
}
