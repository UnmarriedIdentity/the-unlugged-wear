# Frontend design system

## Font

Use Urbanist throughout the V2 admin interface and as the website default in this UI phase. Use separate app-level typography tokens so website styling can evolve independently. Source: https://fonts.google.com/specimen/Urbanist . Include the license if self-hosting. Do not mix Montserrat, Plus Jakarta Sans or Inter into V2 specimens.

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
