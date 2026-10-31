import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Homepage typography guardrail (TL-WEB-037).
 *
 * Asserts the size/weight roles written into docs/DESIGN_SYSTEM.md
 * ("Storefront homepage type roles"):
 *   - section H2      28-48px (clamp) / 500
 *   - section eyebrow 16px / 500
 *   - product name    16px / 500
 *   - product price   16px / 500
 *   - descriptions    keep their per-section size at weight 400
 *   - no 700 / 800 inside a homepage section
 *   - hero display 400 / subtitle 300, footer signature 900 stay exceptions
 *
 * Colour, spacing, borders and radii are deliberately out of scope here.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const SECTION_FILES = [
  'src/app/(storefront)/page.tsx',
  'src/storefront/components/commerce/OurPhilosophy.tsx',
  'src/storefront/components/commerce/VirtualFittingRoom.tsx',
  'src/storefront/components/layout/BrandIntro.tsx',
];

const H2_SIZE = 'text-[clamp(1.75rem,4vw+0.5rem,3rem)]';

const read = (relative) => readFileSync(join(repoRoot, relative), 'utf8');

const sectionSources = SECTION_FILES.map((f) => ({ file: f, src: read(f) }));

const classAttrs = (src, tag) =>
  [...src.matchAll(new RegExp(`<${tag}[^>]*className="([^"]*)"`, 'g'))].map((m) => m[1]);

describe('Homepage typography roles (weight & size only)', () => {
  test('every homepage section h2 renders at 28-48px / weight 500', () => {
    const h2s = sectionSources.flatMap(({ file, src }) =>
      classAttrs(src, 'h2').map((cls) => ({ file, cls }))
    );

    const displayHeadlines = h2s.filter(({ cls }) => cls.includes('philosophy-headline'));
    const sectionHeadings = h2s.filter(({ cls }) => !cls.includes('philosophy-headline'));

    // Hero, Explore, Customer Experience, Recommendations, Stratosphere,
    // and Virtual Fitting Room. The footer brand signature
    // (footer.tsx) and the Our Philosophy display headline are
    // documented exceptions in docs/DESIGN_SYSTEM.md.
    assert.equal(displayHeadlines.length, 1, 'the Our Philosophy display headline stays an exception');
    assert.ok(
      displayHeadlines[0].cls.includes('philosophy-headline'),
      'Our Philosophy headline must keep its display exception class'
    );
    assert.ok(
      !displayHeadlines[0].cls.includes('font-bold'),
      'Our Philosophy display headline must not become bold'
    );

    assert.equal(sectionHeadings.length, 5, 'expected 5 homepage section h2 elements');
    for (const { file, cls } of sectionHeadings) {
      assert.ok(
        cls.includes(H2_SIZE),
        `${file} h2 must use the 28-48px clamp, got: ${cls}`
      );
      assert.ok(cls.includes('font-medium'), `${file} h2 must be font-medium (500): ${cls}`);
      assert.ok(!cls.includes('font-bold'), `${file} h2 must not be bold: ${cls}`);
      assert.ok(!cls.includes('font-semibold'), `${file} h2 must not be semibold: ${cls}`);
    }
  });

  test('every section eyebrow is 16px / weight 500', () => {
    assert.ok(
      !read('src/app/(storefront)/page.tsx').includes('SS26 • Slow-Living Atelier'),
      'hero must not bring back the SS26 kicker above the headline'
    );

    const eyebrows = [
      {
        name: 'Our Philosophy eyebrow',
        src: read('src/storefront/components/commerce/OurPhilosophy.tsx'),
        re: /text-base uppercase tracking-widest text-store-gold font-sans font-medium/,
      },
      {
        name: 'Virtual Fitting Room eyebrow',
        src: read('src/storefront/components/commerce/VirtualFittingRoom.tsx'),
        re: /text-base font-medium uppercase tracking-widest text-store-text-secondary font-sans/,
      },
    ];

    for (const eyebrow of eyebrows) {
      assert.ok(eyebrow.re.test(eyebrow.src), `${eyebrow.name} must be text-base (16px) / font-medium (500)`);
    }

    for (const { file, src } of sectionSources) {
      assert.ok(
        !src.includes('text-2xs uppercase tracking-editorial'),
        `${file} hero-sized eyebrow (10px) must not return`
      );
      assert.ok(!src.includes('font-sans font-bold'), `${file} must not use a 700 eyebrow`);
      assert.ok(!src.includes('font-semibold uppercase tracking-widest text-store-text-secondary'), `${file} must not use a 600 eyebrow`);
    }
  });

  test('product names and prices keep their agreed sizes and weights', () => {
    const page = read('src/app/(storefront)/page.tsx');
    const card = read('src/storefront/components/commerce/ProductCard.tsx');
    const vfr = read('src/storefront/components/commerce/VirtualFittingRoom.tsx');

    // Explore the Collection renders the shared Figma ProductCard (18-20px / 500 name, 16px / 400 price).
    assert.ok(page.includes('<ProductCard key={product.id} product={product} />'), 'homepage uses the shared ProductCard');
    const roles = [
      { name: 'Card product name (18-20px / 500)', src: card, re: /<h3 className="text-lg @\[22rem\]:text-xl font-medium text-primary-dark leading-snug">/ },
      { name: 'Card product price (16px / 400)', src: card, re: /<p className="text-base text-store-text-secondary tuw-tabular-nums">/ },
      { name: 'VFR card name', src: vfr, re: /<p className="font-sans text-base font-medium text-store-text-primary">\{look\.title\}<\/p>/ },
      { name: 'VFR card price', src: vfr, re: /<p className="font-heading font-medium text-base text-store-text-primary tuw-tabular-nums mt-1">/ },
      { name: 'VFR worn name', src: vfr, re: /<p className="font-heading text-base font-medium text-store-text-primary mt-1">/ },
      { name: 'VFR worn price', src: vfr, re: /<span className="tuw-tabular-nums font-medium">/ },
    ];

    for (const role of roles) {
      assert.ok(role.re.test(role.src), `${role.name} must keep its agreed size and weight`);
    }

    assert.ok(
      !/<span className="font-heading font-bold/.test(page),
      'Explore product price must not be font-bold (700)'
    );
    assert.ok(
      !/font-heading font-semibold text-base/.test(vfr),
      'VFR prices must not be font-semibold (600)'
    );
  });

  test('section descriptions keep their agreed sizes at weight 400', () => {
    const page = read('src/app/(storefront)/page.tsx');
    const vfr = read('src/storefront/components/commerce/VirtualFittingRoom.tsx');

    const descriptions = [
      { name: 'Explore description (16px)', src: page, re: /<p className="text-base text-store-text-secondary font-sans leading-relaxed">/ },
      { name: 'Customer Experience description (16 -> 20px)', src: page, re: /<p className="text-base sm:text-xl text-white\/70 font-sans leading-relaxed">/ },
      { name: 'Recommendations description (18px, frozen)', src: page, re: /<p className="text-lg text-store-text-secondary font-sans mt-1">/ },
      { name: 'Stratosphere description (16 -> 18px)', src: page, re: /<p className="text-base sm:text-lg text-white\/80 max-w-xl mx-auto leading-relaxed font-sans">/ },
      { name: 'VFR description (18px)', src: vfr, re: /<p className="text-lg text-store-text-secondary font-sans mt-2 max-w-lg">/ },
    ];

    for (const description of descriptions) {
      assert.ok(description.re.test(description.src), `${description.name} must stay unchanged`);
    }
  });

  test('no 700 or 800 weight utility appears inside a homepage section file', () => {
    for (const { file, src } of sectionSources) {
      assert.ok(
        !/font-bold/.test(src),
        `${file} must not use font-bold (700) — allowed weights are 300/400/500/600/900`
      );
      assert.ok(!/font-extrabold/.test(src), `${file} must not use font-extrabold (800)`);
    }
  });

  test('documented exceptions stay intact: hero display, hero subtitle, footer signature', () => {
    const page = read('src/app/(storefront)/page.tsx');
    const footer = read('src/storefront/components/layout/Footer.tsx');

    assert.ok(
      /<h1 className="font-heading font-normal text-\[clamp\(1\.75rem,1\.5vw\+1\.25rem,2\.5rem\)\]/.test(page),
      'hero headline stays a 28-40px / 400 caption (luxury-house scale, not a billboard)'
    );
    assert.ok(/text-sm text-white\/75 font-sans font-light/.test(page), 'hero subtitle stays 14px / 300');
    assert.ok(page.includes("'Pause background video'"), 'looping hero video keeps its pause control (WCAG 2.2.2)');
    assert.ok(/font-heading font-black uppercase jitter-brand-signature/.test(footer), 'footer brand signature stays 900');
  });

  test('the design system docs publish the same roles', () => {
    const designSystem = read('docs/DESIGN_SYSTEM.md');
    const usage = read('DESIGN_SYSTEM_USAGE.md');
    // Agent state lives at the repo root, split per surface.
    const skill = read('../state-for-agents/storefront/skills/design-system/SKILL.md');
    const specimen = read('src/app/(storefront)/design-system/page.tsx');

    for (const doc of [designSystem, usage, skill]) {
      assert.ok(doc.includes('28–48px'), 'docs must publish the 28-48px section H2 range');
      assert.ok(doc.includes('500'), 'docs must publish weight 500 for section headings');
    }

    assert.ok(designSystem.includes('Storefront homepage type roles'), 'DESIGN_SYSTEM.md must document the homepage roles');
    assert.ok(designSystem.includes(H2_SIZE), 'DESIGN_SYSTEM.md must publish the exact H2 clamp');
    assert.ok(designSystem.includes('Product Recommendations | 18px (frozen'), 'DESIGN_SYSTEM.md must keep the frozen Recommendations description');

    assert.ok(!specimen.includes('800 (ExtraBold)'), 'type specimen must not advertise 800');
    assert.ok(!specimen.includes('700 (Bold)'), 'type specimen must not advertise 700');
    assert.ok(specimen.includes('28–40px'), 'type specimen must advertise the 28-40px hero display');
    assert.ok(specimen.includes('500 (Medium)'), 'type specimen must advertise weight 500');
  });
});


describe('Honest demo authentication', () => {
  test('login and register state demo status and fake no third-party sign-in', () => {
    const login = read('src/app/(storefront)/login/page.tsx');
    const register = read('src/app/(storefront)/register/page.tsx');
    assert.ok(login.includes('demoNotice="Demo sign-in'), 'login must state it is a demo sign-in');
    assert.ok(register.includes('demoNotice="Demo sign-up'), 'register must state it is a demo sign-up');
    for (const src of [login, register]) {
      assert.ok(!/Sign in with (Google|Apple)/.test(src), 'no simulated Google/Apple sign-in buttons');
      assert.ok(src.includes('noValidate'), 'forms use inline errors instead of browser bubbles');
    }
    assert.ok(login.includes("next.startsWith('/') && !next.startsWith('//')"), 'login ?next= only allows same-site paths');
  });
});
