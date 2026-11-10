'use client';

import { useEffect, useState } from 'react';

// The year is filled in after mount: Cache Components prerenders the footer,
// and a render-time `new Date()` would freeze the build year into the shell.
// SITE_LAUNCH_YEAR is the honest value until the browser updates it.
const SITE_LAUNCH_YEAR = 2026;

export function CopyrightYear() {
  const [year, setYear] = useState(SITE_LAUNCH_YEAR);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <>{year}</>;
}
