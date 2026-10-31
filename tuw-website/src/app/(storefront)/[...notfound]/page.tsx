import { notFound } from 'next/navigation';

// Catch-all for unmatched storefront URLs. Route groups only apply their own
// not-found.tsx when something inside the group calls notFound(), so without this
// an unknown path falls through to Next's bare built-in 404. Bouncing through
// notFound() renders (storefront)/not-found.tsx inside the storefront root layout,
// which keeps the storefront stylesheet and never touches the admin surface.
export default function StorefrontCatchAll() {
  notFound();
}
