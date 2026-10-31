import React from 'react';
import Link from 'next/link';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface SeeAllLinkProps {
  href: string;
  children?: React.ReactNode;
}

// Card header "See all" navigation treatment, in one place.
export function SeeAllLink({ href, children = 'See all' }: SeeAllLinkProps) {
  return (
    <Link href={href} className={styles.seeAllBtn} style={{ textDecoration: 'none' }}>
      {children}
    </Link>
  );
}
