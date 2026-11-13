import type { Metadata } from 'next';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import CollectionCard from '@storefront/components/commerce/CollectionCard';
import EmptyState from '@storefront/components/ui/EmptyState';
import { getCollections } from '@/server/collections';

export const metadata: Metadata = {
  title: 'Collections | The Unplugged Wear',
  description: 'Browse The Unplugged Wear by collection: hoodies and sweats, everyday tees, and objects.',
};

// Published capsules come from the database (cached under the products tag),
// so the list is the same for everyone and needs no client store.
export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Capsule Series' },
          ]}
        />

        <div className="max-w-2xl my-6">
          <h1 className="text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-extrabold tracking-tight text-[#1A1A1A]">
            Capsule Collections
          </h1>
          <p className="text-sm text-[#666] mt-2 leading-relaxed">
            Our pieces grouped by type, each printed with the leaping deer after you order.
          </p>
        </div>

        {collections.length === 0 ? (
          <div className="pt-4">
            <EmptyState
              title="No capsules published yet"
              description="New capsules appear here as soon as the studio publishes them."
              actionLabel="Explore the shop"
              actionHref="/shop"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
