import { adminListReviews } from '@tuw/heart/modules/catalog';
import { session } from '@/server/session';
import ReviewsView from './_components/ReviewsView';

// Review moderation (TL-BE-05.09): nothing shows on the storefront until approved.
export default async function ReviewsPage() {
  await session.requireStaff('product.update', '/products/reviews');
  return <ReviewsView initialReviews={await adminListReviews()} />;
}
