# The Unplugged Wear Design System Guide (Figma V2 Canonical)

> **Design Source**: [Figma TUW File (Node 82:5702)](https://www.figma.com/design/WmpPcdGcXerVgqNpgr6Q6S/TUW?node-id=82-5702&p=f&t=HO2xZibML1C7lpHe-0)  
> **Interactive Live Specimen**: [`/design-system`](http://localhost:3007/design-system)

---

## 1. Design System Overview

The Unplugged Wear design system is built strictly from Figma Node `82:5702`:

- **Heading Typography (Upper Text)**: **Outfit** (`--font-heading`, Medium 500, uppercase) — used exclusively for `<h1>` through `<h6>`, hero titles, section headings, and brand mastheads.
- **Body & Everywhere Else (Lower Text)**: **Outfit** (`--font-sans`, `--font-body`, Medium 500 & Regular 400) — self-hosted via `next/font/local` and used across body text, navigation, buttons, cards, form controls, and metadata.
- **Figma Auto-Layout Frame (Sidebar Details)**:
  - **Position**: `X: 270`, `Y: 452`
  - **Auto Layout Flow**: Column (`direction: column`)
  - **Dimensions**: `Width: 1612px`, `Height: 529px`
  - **Gap**: `150px`
  - **Padding / Corner Radius**: `0px / 0px`
- **Figma Color Style System**:
  - **Primary Colors**:
    - `Primary 1 (Midnight Teal)`: `#002B3A`
    - `Primary 2 (Oceanic Teal)`: `#005B6C`
  - **Secondary Colors**:
    - `Secondary Mint`: `#82C3B7`
    - `Secondary Coral`: `#FF8B66`
    - `Secondary Sky Blue`: `#57AFFF`
    - `Secondary Violet Purple`: `#8364FF`
  - **Tertiary Colors**:
    - `Tertiary 1 (Deep Noir)`: `#0F0F0F`
    - `Tertiary 2 (Slate Gray)`: `#676767`
    - `Tertiary 3 (Light Gray)`: `#E8E8E8`
    - `Tertiary 4 (Warm Ivory)`: `#FCFAF6`
    - `Tertiary 5 (Pure White)`: `#FFFFFF`
  - **Canvas Artboard Dark**: `#00003F`

---

## 2. Using Tokens in CSS & CSS Modules

Tokens are globally available via `@theme` and `:root` in `globals.css`:

```css
/* Heading with Outfit uppercase */
h1, .heroHeading {
  font-family: var(--font-heading);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-tertiary-black); /* #0F0F0F */
}

/* Card surface with Figma tokens */
.myCard {
  background-color: var(--color-tertiary-offwhite); /* #FCFAF6 */
  color: var(--color-tertiary-black);               /* #0F0F0F */
  border: 1px solid var(--color-tertiary-light-gray);/* #E8E8E8 */
  font-family: var(--font-body);                   /* Outfit */
}

/* Primary CTA button with Midnight Teal */
.myActionButton {
  background-color: var(--color-primary-dark);      /* #002B3A */
  color: var(--color-tertiary-white);              /* #FFFFFF */
  font-family: var(--font-body);                   /* Outfit */
}
```

---

## 3. Typography Scale & CSS Classes

| Role | Font Family | Size | Line Height | Weight | CSS Utility Class |
|---|---|---|---|---|---|
| **Brand Masthead** | Outfit | 128px / responsive | 1.06em | Medium (500) | `.font-heading uppercase` |
| **Heading 1 (Page Title)** | Outfit | 32–40px | 1.2em | Medium (500) | `.font-heading text-4xl uppercase` |
| **Heading 2 (Section)** | Outfit | 28–48px | 1.2em | Medium (500) | `.font-heading text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-medium` |
| **Heading 3 (Subsection)** | Outfit | 18px | 1.3em | SemiBold (600) | `.font-heading text-lg font-semibold` |
| **Body Large** | Outfit | 16px | 24px | Regular (400) | `.font-sans text-base` |
| **Body Default** | Outfit | 14px | 22px | Regular (400) | `.font-sans text-sm` |
| **Control / Button** | Outfit | 14px | 20px | Medium (500) | `.font-sans font-medium text-sm` |
| **Caption / Metadata** | Outfit | 12px | 18px | Regular (400) | `.font-sans text-xs` |

Storefront homepage roles on top of this scale (size and weight only, full tables in `docs/DESIGN_SYSTEM.md`): section eyebrow **16px / 500**, product card name **18–20px / 500** and price **16px / 400** (fitting room names and prices stay **16px / 500**), section H2 **28–48px / 500**, card body **16px / 400**, CTA label **12px / 500**. Allowed weights are 300, 400, 500, 600 and 900 (footer signature only); homepage sections use no 700 or 800.

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
