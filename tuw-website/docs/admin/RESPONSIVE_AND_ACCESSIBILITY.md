# Responsive layout and accessibility

## Responsive acceptance

Check representative widths around 360, 390, 768, 1024 and 1440px, plus intermediate widths. These are review sizes rather than an assumption about framework breakpoints. Pages must not overflow horizontally except intentionally scrollable data regions.

Website grids move from a compact mobile arrangement to wider desktop columns. Filters become a drawer when space is limited. Checkout becomes a readable single-column flow on mobile. Admin navigation becomes collapsible/drawer-based; metric cards wrap; forms stack; tables use readable cards or labelled horizontal scroll where appropriate.

## Text and layout resilience

Check long product/customer names, long currency amounts, missing images and validation messages. Allow text wrapping where useful. Truncation needs a practical route to the full value. Support browser zoom and larger text without hiding essential controls. Avoid fixed-height content boxes that clip text.

## Accessibility target

Aim for WCAG 2.2 AA. Check normal text contrast of at least 4.5:1, large text at least 3:1, and required control boundaries/focus indicators against adjacent colours. Subtle decorative dividers do not substitute for readable input boundaries. Do not convey meaning by colour alone.

## Interaction

Use native buttons, links and form elements where possible. All actions work with keyboard input and have visible focus. Dialogs/drawers manage focus, support escape when appropriate, and restore focus to the trigger. Modal interactions must not leave background controls usable. Provide meaningful names for icon buttons.

## Forms and feedback

Associate labels with inputs. Link helper/error messages using appropriate descriptions. Mark invalid fields programmatically and announce submission feedback politely. Focus a useful error summary or invalid field after failed submission. Avoid announcing every minor visual update.

## Content

Provide a skip-to-content link, semantic landmarks and a logical heading hierarchy. Images need contextual alt text; decorative images use empty alt text. Charts need labels and an equivalent textual summary or table. Tables use headers and relevant accessible descriptions.

## Motion

Respect reduced-motion preferences. Avoid unnecessary parallax, flashing, auto-playing distractions or motion that blocks checkout and admin work.

## Review methods

Combine keyboard walkthroughs, browser zoom, visual contrast checks, automated accessibility scanning where available and representative screen-reader checks. Record actual verification performed; do not claim conformance from an automated scan alone.
