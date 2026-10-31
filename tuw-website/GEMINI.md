# The Unplugged Wear — Engineering & Design Intelligence

This workspace is configured with specialized skills and Model Context Protocol (MCP) tooling for web development, UI/UX design engineering, and Figma synchronization.

## 1. Active Skills Reference

The following specialized skills are installed in `.agents/skills/` and globally in `~/.gemini/config/skills/`:
- **`web-development`**: Next.js App Router, React 19, TypeScript strict mode, state management, caching, performance.
- **`ui-ux-design-systems`**: Atomic design systems, editorial slow-living luxury aesthetic, semantic color tokens, typography, micro-interactions.
- **`figma-to-code`**: Figma inspection via Figma MCP, auto-layout to Tailwind v4 translation, token mapping, and pixel-perfect reproduction.
- **`responsive-mobile-design`**: Mobile-first architecture, touch ergonomics (44x44px minimum hit targets), drawer navigation, viewports 360px–1440px+.
- **`accessibility-and-quality`**: WCAG 2.1 AA standards, keyboard navigation, focus management, ARIA patterns, contrast standards.

## 2. Figma MCP Integration

- **MCP Server**: `figma-developer-mcp` (Framelink MCP) is configured in `.agents/mcp_config.json` and globally in `~/.gemini/config/mcp_config.json`.
- **Usage**: When a Figma design, frame, or node URL is provided, use the MCP server to inspect layout, typography, fills, and dimensions before generating code.

## 3. Strict Quality Verification

Before completing any task, ensure the verification pipeline passes cleanly:
- `pnpm run typecheck`: Strict TypeScript check across both `tuw-admin` and `tuw-website`.
- `pnpm run test`: Node.js test runner validating monetary calculations, promo codes, and business invariants.
- `pnpm run build`: Production static and Turbopack route compilation.
