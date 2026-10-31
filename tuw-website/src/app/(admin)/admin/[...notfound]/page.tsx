import { notFound } from 'next/navigation';

// Catch-all for unmatched /admin URLs. It sits on the admin side of the boundary,
// so notFound() renders (admin)/not-found.tsx inside the admin root layout and the
// page keeps the admin stylesheet. The storefront catch-all never sees these paths
// because the static "admin" segment sorts first.
export default function AdminCatchAll() {
  notFound();
}
