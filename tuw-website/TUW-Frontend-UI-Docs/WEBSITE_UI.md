# Website UI requirements

## Direction

The Unplugged Wear is a premium, minimal POD lifestyle brand. Use restrained editorial imagery, generous space, neutral surfaces and concise copy. Avoid discount-led banners, fabricated testimonials, countdowns and artificial scarcity. Urbanist is the frontend default for this phase; maintain separate website tokens from the admin.

## Layout

Use a consistent header, footer, navigation, cart drawer and mobile menu. Header includes the brand, shop access, search, account and cart. Footer includes brand story, help, policies and contact. Do not invent real addresses, credentials or social links.

## Page requirements

| Page | Required UI and interaction |
|---|---|
| Home | Editorial hero, selected essentials, brand story, purposeful product links |
| Shop/collection | Product grid, category/size/colour filters, sort, result count, clear filters |
| Product | Gallery, price, colour/size choices, size guide, availability, quantity, add to cart, product/care/fulfillment details |
| Search | Query input, product results, no-results state and suggested routes |
| Cart | Variant details, quantity/remove controls, totals and checkout link |
| Checkout | Contact, address, shipping and payment-preview choices; validated inputs; order review |
| Confirmation | Mock order reference, purchased items, totals and next steps |
| Wishlist | Save/remove products and navigate to available variants |
| Auth | Validated login/register/recovery/reset forms with clear simulation feedback |
| Account | Profile, address book, orders/detail, return requests and security preview |
| Tracking | Mock reference lookup with a text-based shipment timeline |
| About | Slow-living positioning, intentional catalog and POD explanation |
| Journal | Article cards, category navigation and readable article layout |
| Contact | Validated contact form with simulated submission feedback |
| FAQ/size guide | Accessible disclosures and clear size tables |
| Policies | Draft layout and explicitly marked placeholder policy copy pending business approval |

## Product interactions

Require a valid size/colour combination before adding to cart. Display selected variant and available sizes clearly. Preserve quantity and variant identity through cart and checkout. Respect mock unavailable variants. Product images need meaningful descriptions; no unsupported quality claims.

## Checkout simulation

Use a demo payment step with success/failure/cancel scenarios. Display “Demo checkout — no payment will be collected.” Do not request actual card numbers or payment credentials. COD is an optional visual scenario marked pending business confirmation. Successful simulation creates a mock order and updates local order history.

## Responsive priorities

Mobile supports a usable product gallery, filter drawer and accessible cart flow. Desktop uses editorial width and a clear checkout summary. Product purchase controls must not obscure content or focused fields.

## States

Implement loading, no results, empty cart/wishlist, unavailable variant, invalid input, mock payment failure, unknown tracking reference and successful submission. Retain input when a simulated action fails.
