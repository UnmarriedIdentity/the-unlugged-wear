'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import { formatShortRange, useCalendarRange, type DateRange } from '@/hooks/useCalendarRange';
import PresetList from './PresetList';
import MonthCalendar from './MonthCalendar';

interface CalendarProps {
  onApply: (range: DateRange, label: string) => void;
  onClose: () => void;
}

/**
 * Date-range popover: preset rail + two month panels + footer with live
 * range label, red Cancel (reverts) and dark Apply (commits).
 */
export default function Calendar({ onApply, onClose }: CalendarProps) {
  const cal = useCalendarRange();
  const [leftMonth, rightMonth] = cal.months;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cal.cancel();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cal, onClose]);

  const handleApply = () => {
    const committed = cal.apply();
    onApply(committed, formatShortRange(committed));
    onClose();
  };

  const handleCancel = () => {
    cal.cancel();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="Choose date range"
      className="flex flex-col gap-5 rounded-modal border border-subtle bg-surface p-5 shadow-popover animate-[calendarIn_0.18s_ease-out]"
    >
      <div className="flex gap-5">
        <PresetList active={cal.preset} onSelect={cal.applyPreset} />
        <MonthCalendar
          year={leftMonth.year}
          month={leftMonth.month}
          range={cal.draft}
          showPrev
          showNext={false}
          onPrev={() => cal.shiftWindow(-1)}
          onNext={() => cal.shiftWindow(1)}
          onPick={cal.pickDay}
        />
        <MonthCalendar
          year={rightMonth.year}
          month={rightMonth.month}
          range={cal.draft}
          showPrev={false}
          showNext
          onPrev={() => cal.shiftWindow(-1)}
          onNext={() => cal.shiftWindow(1)}
          onPick={cal.pickDay}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[15px] font-semibold text-primary tabular-nums">
          {cal.draft.start ? formatShortRange(cal.draft, '') : 'Select a range'}
        </span>
        <div className="flex items-center gap-3">
          <Button variant="danger" size="md" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="dark" size="md" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
