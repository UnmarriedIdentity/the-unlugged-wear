# Token Refactor Tracker (`tuw-admin` → Tailwind v4 `auth-*`)

Legend: ✅ done + pushed · 🟡 done, uncommitted · ⬜ todo.
Gates per block: zero-hex/bracket grep · `typecheck` · `test` 4/4 ·
`build` 38/38 · built-CSS token proof · screenshots 360/1024/1440px +
`?state=` variants. Push target is always `origin v2`; `main` is never touched.

## Login (`LoginPage.tsx` + `login-*`)

| Block | Status | Commit | Tokens added | Notes |
|---|---|---|---|---|
| Buttons (9 classes) | ✅ | `ef392b0` | button palette/radii/type/containers | incl. `@layer base` reset fix (was: invisible buttons) |
| Inputs (12 classes) | ✅ | `b4e3fe6` | input type/tracking/field-gap; ternary border swaps | error state retains input |
| Layout shell (7 classes) | ✅ | `f61fac1` | `auth-hero`; overlay/wash art exceptions | 49.444/50.556 fractions kept; media trimmed to type rules |
| Controls row (5) | ⬜ | — | reuse ink/teal + checkbox radius | `rememberRow/checkboxBox(+Checked)/rememberText/forgotPasswordRow/resetLink` |
| Divider (3) | ⬜ | — | `auth-divider/muted` (exist) | batch with controls row |
| Hero type + header (8) | ⬜ | — | 3–4 text tokens (clamp headline `38→64px`) | `brandTitle/heroHeadline/heroSubtitle/headerBlock/logoBadge/logoMonogram/formTitle/formSubtitle` |
| Secondary views (9) | ⬜ | — | reuse + maybe `auth-reset` container | `resetCard/resetInput*/backLink/recoveryCard/recoveryPill/recoveryTextBlock/recoveryHeading/recoveryDescription` |

## Naming

| Item | Status | Notes |
|---|---|---|
| Button family `ink` → `button` | ⬜ | add `auth-button` (`#242424`) + `auth-button-hover` (`#141414`); migrate 5 buttons; delete `ink-hover`; signup hover reuses `auth-pure` |
| Shared-use comments | ⬜ | annotate dual-role tokens (e.g. social type on labels) |

## Next: Signup (`SignUpPage.tsx` + `signup-*`, 53 classes)

Passes: shell → social+inputs → terms+submit → verify/OTP.
New tokens (verbatim, outliers kept): `otp-line #C6EAA0`, `terms-line #E7EEEE`
(distinct from login `E7EFEF`), `terms-check 5px` (distinct from login 6px),
`terms/otp text`, `verify container 350px`, `otp shadow ring`.
`?state=default/filled/verify-empty/verify-filled`; OTP auto-advance/paste
logic untouched.

## Later queue

1. UI primitives (`Button`/`Card`/`Badge`/`Input` → control `8px`, `cn()` adoption).
2. `sub-*` shared pages (one radius audit; Pagination `6px` outlier).
3. `Sidebar`/`Header`/`DashboardShell` chrome.
4. `home-*` vs shell dedupe (dead `home-sidebar/topBar` candidates).
5. Bucket-B decision (Reel-feature removal: restore or keep?).
6. `.gitattributes` to permanently silence CRLF noise.

## Watchlist — DO NOT COMMIT

- **Bucket B** (prior bulk-incident leftovers): 4 `tuw-website` text diffs
  (`ProductGallery`, `fixtures`, `[slug]/page`, `ProductCard`, `types` —
  Reel/`videoUrl` removal) + 8 deleted binaries (`product/*`,
  `tuw-website/public/products/*`, root `WhatsApp…jpeg`).
- **Bucket C** (~110 files): CRLF-only noise (`core.autocrlf=true`, no
  `.gitattributes`). Invisible under `git diff --ignore-cr-at-eol`.
