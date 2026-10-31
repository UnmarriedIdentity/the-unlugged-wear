import { notFound } from 'next/navigation';

// Catch-all for unmatched storefront URLs. A page only reaches the app's
// not-found.tsx when something calls notFound(), so without this an unknown path
// falls through to Next's bare built-in 404. Bouncing through notFound() renders
// src/app/not-found.tsx inside the storefront root layout, which keeps the
// storefront stylesheet in the document.
export default function StorefrontCatchAll() {
  notFound();
}
