import Link from 'next/link';
import { ArrowRight, FileText, Lock, RefreshCw, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import { POLICIES, type PolicySlug } from '@storefront/lib/policies';

const ICONS: Record<PolicySlug, LucideIcon> = {
  returns: RefreshCw,
  shipping: Truck,
  privacy: Lock,
  terms: FileText,
};

export default function PoliciesIndexPage() {
  return (
    <div className="min-h-screen flex flex-col bg-store-canvas text-store-charcoal">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Policies' }]} />

        <header className="mt-8 mb-10 max-w-2xl">
          <h1 className="font-heading text-[clamp(2rem,3vw+1rem,3rem)] font-medium tracking-tight text-store-charcoal">
            Policies
          </h1>
          <p className="mt-3 text-base sm:text-lg text-store-text-secondary leading-relaxed">
            How we ship, take returns and look after your details. Each one starts with a short version.
          </p>
          <p className="mt-4 text-sm text-store-text-secondary border-l-2 border-store-gold pl-3">
            Draft policies — to be reviewed before launch.
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {POLICIES.map((policy) => {
            const Icon = ICONS[policy.slug];
            return (
              <li key={policy.slug}>
                <Link
                  href={`/policies/${policy.slug}`}
                  className="group h-full flex flex-col gap-4 p-6 sm:p-8 bg-store-surface border border-store-card-border hover:border-store-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
                >
                  <Icon size={22} strokeWidth={1.5} aria-hidden="true" className="text-store-charcoal" />
                  <span className="flex-1">
                    <span className="block font-heading text-xl font-medium text-store-charcoal">{policy.title}</span>
                    <span className="block mt-2 text-sm text-store-text-secondary leading-relaxed">{policy.summary}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-store-charcoal">
                    Read policy
                    <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>

      <Footer />
    </div>
  );
}
