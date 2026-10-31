# Frontend design system

## Font

Use Urbanist throughout the V2 admin interface. The storefront does not use it: `tuw-website` sets headings and body copy in Outfit, self-hosted through `next/font/local` (see "Storefront homepage type roles" below). Use separate app-level typography tokens so website styling can evolve independently. Source: https://fonts.google.com/specimen/Urbanist . Include the license if self-hosting. Do not mix Montserrat, Plus Jakarta Sans or Inter into V2 specimens.

## Type scale

| Role | Size | Line height | Weight |
|---|---:|---:|---:|
| Editorial display | 40–48px | 48–56px | 600 |
| Admin page title | 32px | 40px | 600 |
| Section heading | 24px | 32px | 600 |
| Subsection | 20px | 28px | 600 |
| Card heading | 18px | 26px | 600 |
| Body large | 16px | 24px | 400 |
| Body/table | 14px | 22px | 400 |
| Navigation/control | 14px | 20–22px | 500 |
| Metadata | 12px | 18px | 400 |

Use 700 sparingly for emphasis. Default letter spacing is zero. Use sentence case. Align numeric table columns right and use tabular numerals when supported. Check rupee symbols and long product names with the actual loaded font. Make display sizes responsive without shrinking essential body content.

## Storefront homepage type roles (size and weight only)

Authority for `tuw-website` homepage sections: header, hero, Our Philosophy, Explore the Collection, Customer Experience, Virtual Fitting Room, Product Recommendations, Stratosphere, footer. Headings (`.font-heading`) and body copy (`.font-sans`) both use Outfit. This section defines **font weight and font size only** — colour, letter spacing, spacing, borders and radii are not part of it.

### Allowed weights

| Weight | Used for |
|---:|---|
| 300 | Hero subtitle only |
| 400 | Hero headline, body copy, all section descriptions, names and meta |
| 500 | Every section H2, every eyebrow, product names, product prices, CTA labels |
| 600 | Card titles, emphasis pills, micro badges |
| 900 | Footer brand signature only (documented exception) |

`700` and `800` are not used anywhere in the homepage sections.

### Roles

| Role | Size | Weight | Class recipe |
|---|---:|---:|---|
| Section H2 | 28–48px responsive | 500 | `font-heading text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-medium tracking-tight` |
| Section eyebrow | 16px | 500 | `font-sans text-base font-medium uppercase` |
| Product card name (shop + homepage, Figma card) | 18px → 20px (cards 22rem and wider) | 500 | `text-lg @[22rem]:text-xl font-medium text-primary-dark` |
| Product card price | 16px | 400 | `text-base text-store-text-secondary tuw-tabular-nums` |
| Product name (fitting room) | 16px | 500 | `font-sans text-base font-medium` |
| Product price (fitting room) | 16px | 500 | `font-heading text-base font-medium tuw-tabular-nums` |
| Editorial card title | 18px | 600 | `font-heading text-lg font-semibold` |
| Card body | 16px | 400 | `font-sans text-base` |
| CTA / control label | 12–14px | 500 (600 on emphasis pills) | `font-sans text-xs font-medium uppercase` |
| Meta / footnote | 12px | 400 | `font-sans text-xs` |
| Micro badge | 12px | 600 | `text-2xs font-semibold` (12px floor, no smaller text) |

**Section H2** — one size for every section heading: 28px at 360px, 48px from 1024px up, weight 500 at every breakpoint.

**Section eyebrow** — 16px / 500. Tracking and colour stay whatever the section already uses.

### Section descriptions (all weight 400)

Descriptions keep the size already chosen for their section; they are not forced to one value.

| Section | Size |
|---|---|
| Explore Best Selling | 16px |
| Customer Experience | 16px mobile → 20px desktop (`text-base sm:text-xl`) |
| Virtual Fitting Room | 18px |
| Product Recommendations | 18px (frozen — do not change) |
| Stratosphere | 16px → 18px (`text-base sm:text-lg`) |

### Documented exceptions

- **Hero display**: bottom-centred campaign caption sized like luxury house heroes (Louis Vuitton 32px / 400, COS 35px). One `<h1>` at `font-normal text-[clamp(1.75rem,1.5vw+1.25rem,2.5rem)]` (28–40px / 400): one line from `md` up, two lines on phones. No kicker. Subtitle `text-sm font-light` (14px / 300). CTAs are underlined `text-xs` uppercase text links (500), 44px tall. Hero height is the viewport minus the header. The background video has a pause/play control (WCAG 2.2.2).
- **Our Philosophy headline**: `.philosophy-headline` in `globals.css`, Outfit (`--font-heading`) at `clamp(2.5rem,5.5vw,5rem)` (40–80px / 400). Display headline with its own size and tracking.
- **Footer**: statement `font-light` (16px / 300) and brand signature `font-black` (900) stay as they are.
- **Chrome outside the sections**: header wordmark, header micro badges, mobile menu, brand intro and footer link columns are not part of this pass.
- **Stratosphere CTA**: stays `text-sm font-semibold` (14px / 600).

## Admin semantic colours

| Role | Value |
|---|---|
| Canvas | #F7F8F9 |
| Surface | #FFFFFF |
| Primary text | #262626 |
| Secondary text | #5D6772 |
| Subtle divider/card border | #E2E4E6 |
| Control border | #90979F |
| Primary action | #7539FF |
| Primary hover | #6025DB |
| Selected background | #F8F5FF |
| On-primary text | #FFFFFF |
| Info text/background | #175CD3 / #F4F9FE |
| Success text/background | #187343 / #F4FBF7 |
| Warning text/background | #856300 / #FEFBF5 |
| Error text/background | #C91818 / #FEF4F4 |

Name tokens by role, for example `--color-text-primary`, not only by hex. Status badges always include text. A selected background also needs a clear text/icon or structural selection cue.

## Website colour direction

Use white and light neutral backgrounds, dark text and subdued borders. Use dark primary purchase buttons with readable white labels. Purple is an admin interaction accent; do not automatically apply it across the editorial storefront. Status colours may share semantic meaning without sharing all surface styling.

## Spacing and shape

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px. Admin radii: 4px small elements, 8px controls, 12px cards, 16px modals and fully rounded pills. Standard controls are 44px high; dense desktop rows may be shorter when their interactive targets remain usable. Use subtle borders rather than excessive shadows. Modal elevation may use a restrained shadow and scrim.

## Component states

Every interactive component needs default, hover, focus-visible, active, disabled and applicable loading states. Fields additionally support populated, required, invalid and read-only states. Focus must remain visible against adjacent surfaces. Disabled controls should explain why when the reason is not obvious.

## Layout and imagery

Website: editorial imagery, generous space, intentional catalog and consistent image ratios. Admin: compact information hierarchy, predictable alignment and visible operational statuses. Use licensed/local sample assets or clearly identified placeholders. Do not use another brand's marks or fabricate endorsements.

## Assets

V2 SVGs and the companion plugin are references for the admin foundations. Shared styles must be explicitly applied in code; SVG import alone does not create a functioning component library. Dark mode is outside this phase unless explicitly added later.
