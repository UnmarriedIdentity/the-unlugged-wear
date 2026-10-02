# TUW V2 Urbanist Design System Guide

> **Design Source**: [Figma TUW File (Node 1:26969)](https://www.figma.com/design/WmpPcdGcXerVgqNpgr6Q6S/TUW?node-id=1-26969&p=f&t=G4MM3KfsMyZpS186-0)  
> **Interactive Live Specimen**: [`/design-system`](http://localhost:3000/design-system)

---

## 1. Design System Overview

The Unplugged Wear design system is built strictly on **Urbanist** typography and a clean 18-role semantic color foundation.

- **Primary Font**: Urbanist (Google Fonts / `@font-urbanist`)
- **Semantic Colors**: 18 designated functional roles (Canvas `#F7F8F9`, Surface `#FFFFFF`, Primary Text `#262626`, Action `#7539FF`, etc.)
- **Spacing Scale**: 4, 8, 12, 16, 24, 32, 48, 64px (`--tuw-space-*` or `--tuw-spacing-*`)
- **Radii**: 4px (small/badges), 8px (controls/buttons/inputs), 12px (cards), 16px (modals), 9999px (pills)

---

## 2. Using Tokens in CSS & CSS Modules

Tokens are globally available via `tokens.css`. Both the clean token syntax and the exact Figma Web Code Syntax are supported:

```css
/* Card surface with subtle border and primary text */
.myCard {
  background-color: var(--tuw-bg-surface);        /* or var(--tuw-color-bg-surface) */
  color: var(--tuw-text-primary);                 /* or var(--tuw-color-text-primary) */
  border: 1px solid var(--tuw-border-subtle);     /* or var(--tuw-color-border-subtle) */
  border-radius: var(--tuw-radius-card);          /* 12px */
  padding: var(--tuw-space-24);                   /* 24px */
}

/* Primary purple action button */
.myActionButton {
  background-color: var(--tuw-action-primary);    /* #7539FF */
  color: var(--tuw-text-on-primary);              /* #FFFFFF */
  border-radius: var(--tuw-radius-control);       /* 8px */
}

.myActionButton:hover {
  background-color: var(--tuw-action-hover);      /* #6025DB */
}
```

---

## 3. Typography Scale & CSS Classes

| Role | Font Size | Line Height | Weight | CSS Utility Class |
|---|---|---|---|---|
| **Display** | 40px | 44px | 700 | `.tuw-type-display` |
| **Heading 1 (Page Title)** | 32px | 40px | 600 | `.tuw-type-heading-page` / `.tuw-type-h1` |
| **Heading 2 (Section)** | 24px | 32px | 600 | `.tuw-type-heading-section` / `.tuw-type-h2` |
| **Heading 3 (Subsection)** | 20px | 28px | 600 | `.tuw-type-heading-subsection` / `.tuw-type-h3` |
| **Heading 4 (Card Heading)** | 18px | 26px | 600 | `.tuw-type-heading-card` / `.tuw-type-h4` |
| **Body Large** | 16px | 24px | 400 | `.tuw-type-body-large` |
| **Body Default** | 14px | 22px | 400 | `.tuw-type-body-default` / `.tuw-type-body` |
| **Label / Control** | 14px | 20px | 500 | `.tuw-type-label-control` |
| **Caption / Default** | 12px | 18px | 400 | `.tuw-type-caption-default` / `.tuw-type-caption` |

### Example in JSX/TSX:

```tsx
<h1 className="tuw-type-heading-page">Orders & Fulfillment</h1>
<p className="tuw-type-body-large">Manage recent orders and fulfillment logistics.</p>
```

---

## 4. Reusable UI Primitives (`@/components/ui`)

All primitives are located in `src/components/ui/` and adhere strictly to the Figma specifications:

### Button

```tsx
import { Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

<Button variant="primary" size="md">Save Changes</Button>
<Button variant="secondary" size="md">Cancel</Button>
<Button variant="dark" size="md">Purchase Now</Button>
<Button variant="danger" size="md">Delete Account</Button>
<Button variant="primary" size="sm" icon={<ArrowRight size={14} />}>Next</Button>
```

### Badge

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Fulfilled</Badge>
<Badge variant="warning">Pending Confirmation</Badge>
<Badge variant="info">In Transit</Badge>
<Badge variant="danger">Payment Failed</Badge>
<Badge variant="neutral">Draft</Badge>
```

### Input

```tsx
import { Input } from '@/components/ui';
import { Search } from 'lucide-react';

<Input
  label="Customer Name"
  placeholder="John Doe"
  helperText="As printed on invoice"
/>

<Input
  placeholder="Search SKU..."
  iconPrefix={<Search size={16} />}
/>

<Input
  label="Promo Code"
  defaultValue="INVALID"
  error="Discount code expired"
/>
```

### Cards & Tables

```tsx
import { ContentCard, StatCard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';

<StatCard
  label="Monthly Revenue"
  value="₹1,24,800"
  trend="+14.2% vs last month"
  trendType="up"
/>

<ContentCard>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Order</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>#1042</TableCell>
        <TableCell><Badge variant="success">Paid</Badge></TableCell>
      </TableRow>
    </TableBody>
  </Table>
</ContentCard>
```

---

## 5. TypeScript Token Constants (`@/design-system`)

```tsx
import { COLORS, RADII, SPACING, TYPOGRAPHY, FIGMA_META } from '@/design-system';

console.log(COLORS.actionPrimary); // '#7539FF'
console.log(FIGMA_META.nodeId);    // '1-26969'
```

---

## 6. Figma API Integration & MCP Notes

- When querying Figma REST API directly via the MCP server (`figma-developer-mcp`), Figma personal access tokens on free/starter tiers may hit Figma's 429 rate limit.
- To update your Figma API Key for live queries:
  1. Open your user MCP configuration: `c:\Users\rmdu0\.gemini\config\mcp_config.json`
  2. Update `FIGMA_API_KEY` under the `figma` server configuration.
- The project is fully independent of live API rate limits: all Figma design system tokens, SVG specimens, and component primitives are bundled directly in the codebase.
