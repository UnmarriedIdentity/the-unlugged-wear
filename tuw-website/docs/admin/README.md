# The Unplugged Wear — Frontend UI documentation

This documentation defines the first implementation phase: two separate frontend applications, `tuw-website/` and `tuw-admin/`. Build realistic, responsive interfaces using mock data and local interactions. The current folder scaffold is not yet a runnable application.

## Read in this order

1. UI_SCOPE.md — deliverables and boundaries.
2. WEBSITE_UI.md or ADMIN_UI.md — application requirements.
3. DESIGN_SYSTEM.md — visual foundations.
4. COMPONENTS.md — reusable component inventory.
5. MOCK_DATA.md — sample data and simulation rules.
6. RESPONSIVE_AND_ACCESSIBILITY.md — cross-screen requirements.
7. UI_CHECKLIST.md — acceptance checks.
8. AGENTS.md — implementation conventions.

## Project folders

- `tuw-website/`: customer storefront; its own routes, components, styles, mock fixtures and configuration.
- `tuw-admin/`: staff interface; its own routes, components, styles, mock fixtures and configuration.
- Keep a copy of these documents in a common documentation folder, or copy the applicable documents into each application's `docs/` directory. Place AGENTS.md at the repository root, or in each app root when they are separate repositories.

## Starting implementation

Initialize each application with the selected stable Next.js, TypeScript and Tailwind versions. Record the actual install/run/build commands in each app README after setup; this document does not imply scripts already exist. Configure Urbanist using bundled font files with their license or an approved font loader. Implement shared visual foundations before screens.

## Preview expectations

Each application must run independently. Mock sessions and test scenarios should be clearly identified as preview behaviour. No live payments, customer messages, production uploads, or real orders are part of this phase.

## Related design assets

Use the supplied V2 Urbanist admin design-system SVG, typography SVG and Figma plugin as references. The SVGs are visual specimens; importing them does not automatically create Figma variables or implement components. Website visual direction is defined separately in DESIGN_SYSTEM.md.
