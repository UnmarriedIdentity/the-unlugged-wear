'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { monthCells, monthLabel, sameDay, type DateRange } from '@/hooks/useCalendarRange';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthCalendarProps {
  year: number;
  month: number;
  range: DateRange;
  showPrev: boolean;
  showNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPick: (day: Date) => void;
}

function dayState(day: Date, range: DateRange): 'start' | 'end' | 'single' | 'in' | 'idle' {
  const { start, end } = range;
  if (start && end && sameDay(start, end) && sameDay(day, start)) return 'single';
  if (start && sameDay(day, start)) return 'start';
  if (end && sameDay(day, end)) return 'end';
  if (start && end && day > start && day < end) return 'in';
  if (start && !end && sameDay(day, start)) return 'single';
  return 'idle';
}

/**
 * One month grid (Monday-first). In-range band is continuous (gapless grid);
 * endpoints render as solid pills capping the band.
 */
export default function MonthCalendar({ year, month, range, showPrev, showNext, onPrev, onNext, onPick }: MonthCalendarProps) {
  const cells = monthCells(year, month);
  return (
    <div className="w-[320px] shrink-0 rounded-xl border border-subtle bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        {showPrev ? (
          <button type="button" onClick={onPrev} aria-label="Previous month" className="flex size-8 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-canvas hover:text-primary cursor-pointer">
            <ChevronLeft size={16} />
          </button>
        ) : (
          <span className="size-8" />
        )}
        <span className="text-[15px] font-semibold text-primary">{monthLabel(year, month)}</span>
        {showNext ? (
          <button type="button" onClick={onNext} aria-label="Next month" className="flex size-8 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-canvas hover:text-primary cursor-pointer">
            <ChevronRight size={16} />
          </button>
        ) : (
          <span className="size-8" />
        )}
      </div>
      <div className="grid grid-cols-7 mb-2" role="row">
        {WEEKDAYS.map((d) => (
          <span key={d} className="flex h-8 items-center justify-center text-[13px] font-normal text-secondary">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0" role="grid" aria-label={monthLabel(year, month)}>
        {cells.map((day, i) => {
          if (!day) return <span key={`blank-${i}`} />;
          const st = dayState(day, range);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onPick(day)}
              aria-pressed={st !== 'idle'}
              className={cn(
                'flex h-9 w-full items-center justify-center text-[14px] transition-colors duration-150 cursor-pointer',
                st === 'idle' && 'font-normal text-primary hover:bg-canvas rounded-full',
                st === 'in' && 'font-normal text-primary bg-selected',
                (st === 'start' || st === 'single') && 'font-semibold text-white bg-action-primary rounded-full',
                st === 'end' && 'font-semibold text-white bg-action-primary rounded-full'
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
