'use client';

import React, { forwardRef, useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  iconPrefix?: React.ReactNode;
  prefixIcon?: React.ReactNode;
  iconSuffix?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      iconPrefix,
      prefixIcon,
      iconSuffix,
      fullWidth = true,
      className = '',
      style = {},
      id,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          width: fullWidth ? '100%' : 'auto',
          boxSizing: 'border-box',
        }}
      >
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--tuw-text-primary, #262626)',
              fontFamily: 'var(--font-main)',
            }}
          >
            {label}
          </label>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '44px',
            backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
            border: error
              ? '1px solid var(--tuw-text-error, #C91818)'
              : isFocused
              ? '1px solid var(--tuw-action-primary, #7539FF)'
              : '1px solid var(--tuw-border-control, #90979F)',
            borderRadius: 'var(--tuw-radius-control, 8px)',
            padding: '0 14px',
            gap: '10px',
            boxShadow: error
              ? '0 0 0 3px rgba(201, 24, 24, 0.12)'
              : isFocused
              ? '0 0 0 3px rgba(117, 57, 255, 0.12)'
              : 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            boxSizing: 'border-box',
          }}
        >
          {(iconPrefix || prefixIcon) && (
            <span style={{ color: 'var(--tuw-text-secondary, #5D6772)', display: 'inline-flex' }}>
              {iconPrefix || prefixIcon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              fontFamily: 'var(--font-main)',
              color: 'var(--tuw-text-primary, #262626)',
              width: '100%',
              ...style,
            }}
            className={className}
            {...props}
          />

          {iconSuffix && (
            <span style={{ color: 'var(--tuw-text-secondary, #5D6772)', display: 'inline-flex' }}>
              {iconSuffix}
            </span>
          )}
        </div>

        {error && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--tuw-text-error, #C91818)',
              fontFamily: 'var(--font-main)',
              marginTop: '2px',
            }}
          >
            {error}
          </span>
        )}

        {!error && helperText && (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--tuw-text-secondary, #5D6772)',
              fontFamily: 'var(--font-main)',
              marginTop: '2px',
            }}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
