# Agent Guidelines & Project Rules — The Unplugged Wear

## 1. Strict Dependency & Package Version Policy

1. **No Version Demotions/Downgrades**:
   - Under **no circumstances** should any package, dependency, devDependency, or toolchain version in any `package.json` (`root`, `tuw-admin`, `tuw-website`) be demoted or downgraded to an older version.
   - Do not replace modern versions (e.g., `next: 16.3.8`, `react: ^19.0.0`, `tailwindcss: ^4.1.0`, `typescript: ^5.7.0`, `pnpm@10.34.6`) with older versions (such as Next.js 14/15, React 18, Tailwind CSS v3, etc.).

2. **Resolution Strategy**:
   - Resolve any build, typing, or runtime errors using modern, forward-compatible syntax, APIs, and patterns suitable for Next.js 16+, React 19, and Tailwind CSS v4.
   - Downgrading dependencies is strictly prohibited.

---

## 2. Scope & Boundaries

- Build the UI-only phase across the two applications: `tuw-website/` (customer storefront) and `tuw-admin/` (operations workspace).
- Backend connections, live authentication, payment processing, and fulfillment integration are deferred to subsequent phases.
- Demo state is handled deterministically via local storage adapters with explicit reset-demo controls.

---

## 3. Brand & Visual Design Standards

- **Brand Name**: Use the exact, canonical name **“The Unplugged Wear”**.
- **Admin App (`tuw-admin`)**: Pure Urbanist typography scale and full compliance with the 18-role semantic color tokens (`--tuw-*`) from the V2 design system (`DESIGN_SYSTEM.md`).
- **Storefront App (`tuw-website`)**: Calm editorial slow-living luxury aesthetic, warm ivory canvas (`#FAF9F6`), charcoal typography (`#1A1A1A`), dark purchase CTAs (`#111111`), and refined gold accents (`#C8A96A`). Admin purple (`#7539FF`) must never be applied to storefront purchase buttons.
- **Tone & Marketing Restraint**: Zero discount-led banners, countdown timers, artificial urgency, or fabricated customer reviews.

---

## 4. Architecture & Modularity

- **Zero Cross-App Source Imports**: `tuw-website/` and `tuw-admin/` must remain completely independent applications. Neither app may import source code, components, or styles from the other.
- **Component Primitives**: Implement and reuse atomic UI primitives (`Button`, `Badge`, `Input`, `Card`, `Modal`, `Drawer`, `Select`, `Switch`, etc.).
- **Mock Adapters**: Keep deterministic fixtures and mock state managers (`src/mocks/`) strictly isolated from UI components.

---

## 5. Implementation Behaviour & Interaction Quality

- **No Dead Controls**: Every button, link, switch, and form control must provide observable feedback (state change, navigation, dialog/modal reveal, or validation notice).
- **Truthful Demo Feedback**: Simulated payments, file uploads, staff mutations, and contact submissions must clearly state demo status (e.g., *"Demo checkout sandbox — no payment will be collected"*).
- **Preserve User Input**: When a simulated action fails (e.g. payment decline), input values in forms must be retained.

---

## 6. Data Integrity & Minor-Unit Rules

- **Deterministic Fixtures**: Use realistic fictitious identities (`@example.com` domains, Indian mobile numbers, Indiranagar addresses).
- **Integer Minor Units**: Store and calculate monetary amounts using integer minor units (paise: e.g. `priceINR: 3899` maps to `priceMinorINR: 389900`) to avoid floating-point inaccuracies.
- **State Separation**: Maintain strict independence between `paymentStatus` (`paid`, `pending`, `failed`, `refunded`), `fulfillmentStatus` (`queued`, `printing`, `shipped`, `delivered`, `submission_failed`), and `returnStatus`.
- **Reset Demo Support**: Both applications must provide an accessible Reset Demo State action that clears localStorage keys and restores baseline fixtures.

---

## 7. Quality, Testing & Verification

- **Automated Verification**:
  - `pnpm run typecheck`: Strict TypeScript checking (`tsc --noEmit`) across both workspaces.
  - `pnpm run test`: Native Node test runner (`node --test`) validating monetary calculations, promo discounts, variant keys, and status invariants.
  - `pnpm run build`: Production static compilation pre-rendering all routes cleanly.
- **Responsive & Accessibility**:
  - Pixel-perfect adaptability across 360px (mobile), 768px (tablet), 1024px (laptop), and 1440px+ (desktop).
  - WCAG 2.1 AA accessibility (keyboard navigation, focus rings, contrast ratios, and semantic HTML).

---

## 8. Documentation

- Maintain real, copy-pasteable setup and run commands in root and application `README.md` files.
- Keep policy copy, terms, and unresolved business specifications explicitly marked as draft notices.
- Document verified behavior with evidence in `UI_CHECKLIST.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
