'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Info, Mail, Printer } from 'lucide-react';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import { getPolicies, type PolicySlug } from '@storefront/lib/policies';
import { useSiteSettings } from '@storefront/lib/site-settings';

/** Shared layout for every /policies/* page: summary, contents, numbered sections, help. */
export default function PolicyPage({ slug }: { slug: PolicySlug }) {
  const settings = useSiteSettings();
  const policies = getPolicies({ supportEmail: settings.supportEmail, freeThresholdPaise: settings.shipping.freeThresholdPaise, standardFeePaise: settings.shipping.standardFeePaise });
  const policy = policies.find((p) => p.slug === slug)!;
  const others = policies.filter((p) => p.slug !== slug);
  const [activeId, setActiveId] = useState(policy.sections[0]?.id);

  // Highlight the section currently being read in the contents list.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    policy.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [policy]);

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas text-store-charcoal">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Policies', href: '/policies' },
            { label: policy.title },
          ]}
        />

        <header className="mt-8 mb-10 max-w-3xl">
          <h1 className="font-heading text-[clamp(2rem,3vw+1rem,3rem)] font-medium tracking-tight text-store-charcoal">
            {policy.title}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-store-text-secondary leading-relaxed">{policy.summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-store-text-secondary">
            <span>Last updated {policy.lastUpdated}</span>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-store-charcoal underline-offset-4 decoration-store-gold hover:underline cursor-pointer print:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
            >
              <Printer size={14} aria-hidden="true" />
              Print this policy
            </button>
          </div>
          <p className="mt-5 flex items-start gap-2 text-sm text-store-text-secondary border-l-2 border-store-gold pl-3">
            <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            Draft policy — to be reviewed before launch. The final wording may change.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
          <nav aria-label="On this page" className="lg:sticky lg:top-28 print:hidden">
            <p className="text-xs uppercase tracking-wider text-store-text-secondary mb-3">On this page</p>
            <ol className="space-y-1 border-l border-store-card-border">
              {policy.sections.map((section, idx) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={activeId === section.id ? 'location' : undefined}
                    className={`block -ml-px pl-4 py-1.5 text-sm border-l-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold ${
                      activeId === section.id
                        ? 'border-store-charcoal text-store-charcoal font-medium'
                        : 'border-transparent text-store-text-secondary hover:text-store-charcoal'
                    }`}
                  >
                    {idx + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 max-w-3xl space-y-10">
            <section aria-labelledby="short-version" className="p-6 sm:p-8 bg-store-cream border border-store-card-border">
              <h2 id="short-version" className="text-base font-medium text-store-charcoal">
                The short version
              </h2>
              <ul className="mt-3 space-y-2 text-base text-store-text-secondary leading-relaxed list-disc pl-5">
                {policy.shortVersion.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>

            {policy.sections.map((section, idx) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28">
                <h2 id={`${section.id}-title`} className="font-heading text-xl sm:text-2xl font-medium text-store-charcoal">
                  <span className="text-store-text-secondary tuw-tabular-nums mr-2">{idx + 1}.</span>
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-base text-store-text-secondary leading-relaxed">
                  {section.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {section.list && (
                    <ul className="list-disc pl-5 space-y-1.5">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.link && (
                    <Link
                      href={section.link.href}
                      className="inline-flex items-center gap-1.5 font-medium text-store-charcoal underline underline-offset-4 decoration-store-gold hover:decoration-store-charcoal"
                    >
                      {section.link.label}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </section>
            ))}

            <section aria-labelledby="policy-help" className="pt-10 border-t border-store-card-border print:hidden">
              <h2 id="policy-help" className="font-heading text-xl font-medium text-store-charcoal">
                Still have a question?
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#111111] text-white text-sm font-medium hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
                >
                  <Mail size={16} aria-hidden="true" />
                  Contact us
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center h-11 px-6 rounded-full border border-store-border bg-store-surface text-sm font-medium text-store-charcoal hover:border-store-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
                >
                  Read the FAQ
                </Link>
              </div>
              <p className="mt-8 text-xs uppercase tracking-wider text-store-text-secondary">Other policies</p>
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {others.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/policies/${p.slug}`}
                      className="group flex items-center justify-between gap-3 p-4 bg-store-surface border border-store-card-border hover:border-store-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
                    >
                      <span className="text-sm font-medium text-store-charcoal">{p.title}</span>
                      <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
