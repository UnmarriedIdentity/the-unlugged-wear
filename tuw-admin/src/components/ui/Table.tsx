'use client';

import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ children, style = {}, className = '', ...props }: TableProps) {
  return (
    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontFamily: 'var(--font-main)',
          fontSize: '14px',
          color: 'var(--tuw-text-primary, #262626)',
          ...style,
        }}
        className={className}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, style = {}, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      style={{
        borderBottom: '1px solid var(--tuw-border-subtle, #E5E7EB)',
        ...style,
      }}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, style = {}, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody style={{ ...style }} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  style = {},
  hoverable = true,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { hoverable?: boolean }) {
  return (
    <tr
      style={{
        borderBottom: '1px solid var(--tuw-border-subtle, #E5E7EB)',
        transition: 'background-color 0.1s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, style = {}, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      style={{
        padding: '14px 16px',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--tuw-text-primary, #262626)',
        letterSpacing: 'normal',
        fontFamily: 'var(--font-main)',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, style = {}, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      style={{
        padding: '16px',
        fontSize: '14px',
        fontWeight: 400,
        color: 'var(--tuw-text-primary, #262626)',
        verticalAlign: 'middle',
        fontFamily: 'var(--font-main)',
        ...style,
      }}
      {...props}
    >
      {children}
    </td>
  );
}
