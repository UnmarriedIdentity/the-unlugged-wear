'use client';

import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { usePopoverAnimation } from '@/hooks/usePopoverAnimation';
import Checkbox from './Checkbox';

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Second line inside the option row (category, short hint). */
  description?: string;
  /** Right-aligned hint inside the option row (e.g. price). */
  meta?: string;
  /** Extra search terms that are not rendered. */
  keywords?: string;
  disabled?: boolean;
}

interface CommonProps {
  options: SearchableSelectOption[];
  label?: string;
  helperText?: string;
  error?: string;
  /** Marks the label and exposes aria-required on the combobox. */
  required?: boolean;
  placeholder?: string;
  /** Placeholder while the field itself is acting as the search box. */
  searchPlaceholder?: string;
  emptyText?: string;
  /** Typing in the field filters the list (the field is the search box). */
  searchable?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  /** Scrollable option-list height. Default 280. */
  maxListHeight?: number;
}

interface CoreProps extends CommonProps {
  multiple: boolean;
  selected: string[];
  onSelectedChange: (next: string[]) => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--tuw-field-label-size, 14px)',
  fontWeight: 'var(--tuw-field-label-weight, 500)',
  color: 'var(--tuw-text-primary, #262626)',
  fontFamily: 'var(--font-main)',
};

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--tuw-text-secondary, #5D6772)',
  fontFamily: 'var(--font-main)',
  marginTop: 2,
};

const errorStyle: React.CSSProperties = {
  ...hintStyle,
  fontWeight: 500,
  color: 'var(--tuw-text-error, #C91818)',
};

function SearchableSelectCore({
  options,
  selected,
  onSelectedChange,
  multiple,
  label,
  helperText,
  error,
  required = false,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches found.',
  searchable = false,
  disabled = false,
  fullWidth = true,
  ariaLabel,
  maxListHeight = 280,
}: CoreProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [queryDirty, setQueryDirty] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const [anchor, setAnchor] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
    vw: number;
    vh: number;
  } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const selectAllOnOpen = useRef(false);
  const skipRefocus = useRef(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const generatedId = React.useId();
  const fieldId = `${generatedId}-field`;
  const messageId = `${generatedId}-message`;
  const listId = `${generatedId}-listbox`;
  const message = error ?? helperText;

  const anim = usePopoverAnimation(open, () => {
    setQuery('');
    setQueryDirty(false);
    if (!skipRefocus.current) fieldRef.current?.focus();
    skipRefocus.current = false;
  });

  const selectedOptions = useMemo(
    () =>
      selected
        .map((id) => options.find((option) => option.value === id))
        .filter((option): option is SearchableSelectOption => Boolean(option)),
    [selected, options]
  );

  const filtered = useMemo(() => {
    const q = (queryDirty ? deferredQuery : '').trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      [option.label, option.description, option.meta, option.keywords]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [options, deferredQuery, queryDirty]);

  // Keep the active row inside the filtered list and reset it when the query
  // changes (fresh results start at the top).
  useEffect(() => {
    setActiveIndex(0);
  }, [queryDirty, deferredQuery]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(Math.max(0, index), Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Close the fixed popover when the page moves under it — but never when the
  // scroll happens inside the popover itself (the option list).
  useEffect(() => {
    if (!anim.visible) return;
    const handleScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleResize = () => setOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [anim.visible]);

  // Focus the field on open. A seeded label is pre-selected so the first
  // keystroke replaces it; typed opens keep the caret where it was.
  useEffect(() => {
    if (!anim.visible) return;
    const frame = requestAnimationFrame(() => {
      const field = fieldRef.current;
      if (!field) return;
      field.focus();
      if (selectAllOnOpen.current && field.value) field.select();
      selectAllOnOpen.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [anim.visible]);

  // Keep the keyboard-active option visible.
  useEffect(() => {
    if (!anim.visible) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, anim.visible]);

  const isSelected = (value: string) => selected.includes(value);

  const openPopover = useCallback(() => {
    if (disabled || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setAnchor({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      vw: window.innerWidth,
      vh: window.innerHeight,
    });
    // Single-select seeds the field with the current label (pre-selected so
    // the first keystroke replaces it); multi starts empty after its chips.
    const seed = !multiple && searchable ? selectedOptions[0]?.label ?? '' : '';
    selectAllOnOpen.current = seed !== '';
    setQuery(seed);
    setQueryDirty(false);
    const firstSelected = selected[0];
    const index = firstSelected ? options.findIndex((option) => option.value === firstSelected) : 0;
    setActiveIndex(Math.max(0, index));
    setOpen(true);
  }, [disabled, multiple, options, searchable, selected, selectedOptions]);

  const close = useCallback(() => setOpen(false), []);

  const toggleValue = useCallback(
    (option: SearchableSelectOption) => {
      if (option.disabled) return;
      if (multiple) {
        onSelectedChange(
          isSelected(option.value)
            ? selected.filter((value) => value !== option.value)
            : [...selected, option.value]
        );
      } else {
        onSelectedChange([option.value]);
        setOpen(false);
      }
    },
    [multiple, onSelectedChange, selected]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        // Close the listbox first; the surrounding Drawer also listens for
        // Escape on window and must not close while a menu is open.
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }

    if (!open) {
      const printable =
        event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
      if (searchable && printable) {
        // Typing on the closed field opens it with the keystroke as the query.
        event.preventDefault();
        openPopover();
        selectAllOnOpen.current = false;
        if (event.key !== ' ') {
          setQuery(event.key);
          setQueryDirty(true);
        }
        return;
      }
      if (
        event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp'
      ) {
        event.preventDefault();
        openPopover();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => Math.min(Math.max(0, filtered.length - 1), index + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(Math.max(0, filtered.length - 1));
        break;
      case 'Enter': {
        event.preventDefault();
        const option = filtered[activeIndex];
        if (option) toggleValue(option);
        break;
      }
      case 'Backspace':
        if (multiple && query === '' && selected.length > 0) {
          event.preventDefault();
          onSelectedChange(selected.slice(0, -1));
        }
        break;
      case 'Tab':
        skipRefocus.current = true;
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const estimatedHeight = maxListHeight + (multiple && selected.length > 0 ? 40 : 0) + 18;
  const opensUp = anchor ? anchor.vh - anchor.bottom < estimatedHeight && anchor.top > anchor.vh - anchor.bottom : false;
  const popoverWidth = anchor ? Math.max(220, Math.min(anchor.width, anchor.vw - 16)) : 220;

  const popoverStyle: React.CSSProperties = anchor
    ? {
        position: 'fixed',
        ...(opensUp
          ? { bottom: Math.max(8, anchor.vh - anchor.top + 6) }
          : { top: anchor.bottom + 6 }),
        left: Math.max(8, Math.min(anchor.left, anchor.vw - popoverWidth - 8)),
        width: popoverWidth,
        zIndex: 50,
        maxHeight: 'min(420px, calc(100vh - 32px))',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
        backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
        boxShadow: '0 12px 32px rgba(23, 28, 51, 0.16), 0 2px 6px rgba(23, 28, 51, 0.08)',
        overflow: 'hidden',
        willChange: 'opacity, transform',
        transform: 'translateZ(0)',
        animation:
          anim.phase === 'closing'
            ? opensUp
              ? 'popoverOutUp 0.15s ease-in both'
              : 'popoverOut 0.15s ease-in both'
            : opensUp
              ? 'popoverInUp 0.18s ease-out both'
              : 'popoverIn 0.18s ease-out both',
      }
    : { position: 'fixed', visibility: 'hidden' };

  const displayChips = multiple ? selectedOptions.slice(0, 3) : [];
  const hiddenChipCount = multiple ? Math.max(0, selectedOptions.length - displayChips.length) : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: fullWidth ? '100%' : 'auto',
        minWidth: 0,
      }}
    >
      {label ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
            minHeight: 'var(--tuw-field-label-row-height, 0px)',
          }}
        >
          <label htmlFor={fieldId} style={labelStyle}>
            {label}
            {required ? (
              <span
                aria-hidden="true"
                style={{
                  marginLeft: 4,
                  color: 'var(--tuw-text-secondary, #5D6772)',
                  fontWeight: 'var(--tuw-field-label-weight, 500)',
                }}
              >
                *
              </span>
            ) : null}
          </label>
        </div>
      ) : null}

      <div
        ref={triggerRef}
        aria-disabled={disabled || undefined}
        onClick={() => {
          if (disabled) return;
          if (!open) openPopover();
          else if (!searchable) close();
        }}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          minHeight: 44,
          backgroundColor: disabled
            ? 'var(--tuw-bg-canvas, #F7F8F9)'
            : 'var(--tuw-bg-surface, #FFFFFF)',
          border: error
            ? '1px solid var(--tuw-text-error, #C91818)'
            : focused || open
              ? '1px solid var(--tuw-action-primary, #7539FF)'
              : '1px solid var(--tuw-border-control, #D1D5DB)',
          borderRadius: 'var(--tuw-radius-control, 8px)',
          padding: multiple ? '6px 10px 6px 12px' : '0 14px',
          boxShadow: error
            ? '0 0 0 3px rgba(201, 24, 24, 0.12)'
            : focused || open
              ? '0 0 0 3px rgba(117, 57, 255, 0.12)'
              : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: multiple ? 'wrap' : 'nowrap',
            gap: 6,
            minWidth: 0,
            flex: 1,
            padding: multiple ? '3px 0' : 0,
          }}
        >
          {multiple ? (
            selectedOptions.length === 0 ? null : (
              <>
                {displayChips.map((option) => (
                  <span
                    key={option.value}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      maxWidth: '100%',
                      padding: '2px 3px 2px 8px',
                      borderRadius: 999,
                      border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
                      backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--tuw-text-primary, #262626)',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {option.label}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${option.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectedChange(selected.filter((value) => value !== option.value));
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 16,
                        height: 16,
                        padding: 0,
                        border: 'none',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        color: 'var(--tuw-text-secondary, #5D6772)',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {hiddenChipCount > 0 && (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      backgroundColor: 'var(--tuw-bg-surface-subtle, #F1F3F5)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--tuw-text-secondary, #5D6772)',
                    }}
                  >
                    +{hiddenChipCount} more
                  </span>
                )}
              </>
            )
          ) : null}

          <input
            id={fieldId}
            ref={fieldRef}
            value={
              multiple
                ? query
                : open && searchable
                  ? query
                  : selectedOptions[0]?.label ?? ''
            }
            onChange={(event) => {
              if (!searchable) return;
              setQuery(event.target.value);
              setQueryDirty(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              open
                ? searchable
                  ? searchPlaceholder
                  : placeholder
                : selected.length > 0
                  ? ''
                  : placeholder
            }
            readOnly={!searchable}
            disabled={disabled}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete={searchable ? 'list' : undefined}
            aria-label={ariaLabel || label || placeholder}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={message ? messageId : undefined}
            aria-activedescendant={
              open && filtered[activeIndex] ? `${listId}-option-${activeIndex}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              minWidth: multiple ? 90 : 0,
              height: multiple ? 24 : 42,
              padding: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-main)',
              fontSize: 14,
              color:
                (multiple ? selected.length > 0 : Boolean(selectedOptions[0])) || query
                  ? 'var(--tuw-text-primary, #262626)'
                  : 'var(--tuw-text-tertiary, #9CA3AF)',
              textOverflow: 'ellipsis',
              cursor: disabled ? 'not-allowed' : searchable ? 'text' : 'pointer',
            }}
          />
        </div>

        <span
          onClick={(event) => {
            event.stopPropagation();
            if (disabled) return;
            if (open) close();
            else openPopover();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--tuw-text-secondary, #5D6772)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronDown size={16} />
        </span>
      </div>

      {error ? (
        <span id={messageId} style={errorStyle}>{error}</span>
      ) : helperText ? (
        <span id={messageId} style={hintStyle}>{helperText}</span>
      ) : null}

      {anim.visible && (
        <>
          <div
            aria-hidden="true"
            onClick={close}
            style={{ position: 'fixed', inset: 0, zIndex: 40, cursor: 'default' }}
          />
          <div ref={popoverRef} style={popoverStyle} onClick={(event) => event.stopPropagation()}>
            <div
              id={listId}
              role="listbox"
              aria-multiselectable={multiple || undefined}
              aria-label={ariaLabel || label || 'Options'}
              tabIndex={-1}
              style={{
                maxHeight: maxListHeight,
                overflowY: 'auto',
                padding: 6,
                outline: 'none',
                flex: '1 1 auto',
              }}
            >
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: '20px 12px',
                    textAlign: 'center',
                    fontSize: 13,
                    color: 'var(--tuw-text-secondary, #5D6772)',
                  }}
                >
                  {emptyText}
                </div>
              ) : (
                filtered.map((option, index) => {
                  const optionSelected = isSelected(option.value);
                  const active = index === activeIndex;
                  const restingBg = optionSelected
                    ? 'var(--tuw-bg-selected, #F8F5FF)'
                    : active
                      ? 'var(--tuw-bg-canvas, #F7F8F9)'
                      : 'transparent';
                  return (
                    <div
                      key={option.value}
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={optionSelected}
                      aria-disabled={option.disabled || undefined}
                      onClick={() => toggleValue(option)}
                      onMouseEnter={() => setActiveIndex(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        backgroundColor: restingBg,
                        opacity: option.disabled ? 0.5 : 1,
                        cursor: option.disabled ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.1s ease',
                        userSelect: 'none',
                      }}
                    >
                      {multiple && (
                        <Checkbox
                          bare
                          checked={optionSelected}
                          onChange={() => toggleValue(option)}
                          tabIndex={-1}
                          disabled={option.disabled}
                          aria-hidden="true"
                        />
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: optionSelected ? 600 : 500,
                            color: 'var(--tuw-text-primary, #262626)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {option.label}
                        </span>
                        {option.description && (
                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--tuw-text-secondary, #5D6772)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {option.description}
                          </span>
                        )}
                      </div>

                      {option.meta && (
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: 12,
                            color: 'var(--tuw-text-secondary, #5D6772)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {option.meta}
                        </span>
                      )}

                      {!multiple && optionSelected && (
                        <span style={{ display: 'inline-flex', flexShrink: 0, color: 'var(--tuw-action-primary, #7539FF)' }}>
                          <Check size={16} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {multiple && selected.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '8px 12px',
                  borderTop: '1px solid var(--tuw-border-subtle, #E5E7EB)',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  {selected.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => onSelectedChange([])}
                  style={{
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'var(--font-main)',
                    color: 'var(--tuw-action-primary, #7539FF)',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export interface SearchableSelectProps extends CommonProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchableSelect({ value, onChange, ...props }: SearchableSelectProps) {
  return (
    <SearchableSelectCore
      {...props}
      multiple={false}
      selected={value ? [value] : []}
      onSelectedChange={(next) => onChange(next[0] ?? '')}
    />
  );
}

export interface SearchableMultiSelectProps extends CommonProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function SearchableMultiSelect({ value, onChange, ...props }: SearchableMultiSelectProps) {
  return (
    <SearchableSelectCore {...props} multiple selected={value} onSelectedChange={onChange} />
  );
}
