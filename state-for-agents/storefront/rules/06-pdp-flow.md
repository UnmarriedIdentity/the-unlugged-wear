# Rule 06 — Inviolable PDP Purchase-to-Fulfillment Lifecycle Flow (inviolable)

Every Product Detail Page (PDP) change and commerce refactor must strictly adhere to the 11-step lifecycle flow established in Figma Node `82:5702 / 319:7729`. No step in this flow may be bypassed, broken, or substituted.

---

## The 11-Step Lifecycle Flowchart

```
Product listing
      │
      ▼
Product details route (/products/[slug])
      │
      ▼
Fetch product by slug
      │
      ▼
Render gallery and product information
      │
      ▼
Select color and size
      │
      ▼
Valid variant? ─── No ───► Show validation message
      │
     Yes
      ▼
Add selected variant to cart
      │
      ▼
Cart drawer or cart page
      │
      ▼
Checkout (/checkout)
      │
      ▼
Order creation (TUW-XXXX)
      │
      ▼
Admin order management (/account/orders)
      │
      ▼
Qikink fulfillment integration (/api/fulfillment/qikink)
```

---

## Inviolable Protocol per Step

1. **Product Listing (`/shop`, `/collections`, Home)**:
   - All product cards (`ProductCard.tsx`) must link both image and title directly to `/products/[slug]`.
   - Never use static dummy anchors (`href="#"`).

2. **Product Details Route (`/products/[slug]`)**:
   - Must use Next.js App Router dynamic route parameter resolution (`use(params)` or `await params`).

3. **Fetch Product by Slug**:
   - Always query the store via `getProductBySlug(slug)`.
   - If unlisted, always render the tailored *Garment Not Found* screen with HTTP 200/clean React fallback and button to `/shop`.

4. **Render Gallery and Product Information**:
   - Must render the Figma split layout:
     - **Left Column**: Product purchase panel (Futura uppercase title, price, discount pill badge, shade swatches, size grid, Add to Bag, Express Checkout, Wishlist, Guarantee card).
     - **Center Column**: Primary large model photo with full-screen zoom lightbox modal (`Maximize2`).
     - **Right Column**: Vertical stack of secondary angle thumbnails (front view, back view, video reel).
   - Additional required sections: Trust Ribbon (3 pillars), Inline Measurement Guide Table (CM/IN toggle), Customer Reviews & Ratings breakdown (4.9 score, star distribution bars, 6 verified review cards), 2-Column FAQ Accordions (with active deep teal container), "YOU MIGHT ALSO LIKE" 3-card grid, and full-bleed lifestyle banner.

5. **Select Color and Size**:
   - Clicking a shade swatch must **dynamically update the gallery hero photo** to match that specific colorway.
   - Size selector must display real-time stock allocation badges, low-stock tags (`X left` when stock <= 3), and strikethrough for out-of-stock sizes.

6. **Valid Variant Check**:
   - **No**: If user clicks "Add to Bag" or "Express Checkout" without picking a size, immediately halt addition and display an inline validation error: `Please choose a size to continue.`
   - **No (Sold out)**: If selected size is out of stock, show `This size is currently sold out.`
   - **Yes**: Package complete variant object (`productId`, `title`, `color`, `size`, `priceINR`, `quantity`, `image`).

7. **Cart Drawer or Cart Page**:
   - Adding a variant must automatically open the slide-out `CartDrawer` with free-shipping threshold calculations (`₹3,000`), quantity increment/decrement, and item removal.
   - `/cart` page must mirror the exact same cart state and calculations.

8. **Checkout (`/checkout`)**:
   - Navigates cleanly to `/checkout` with multi-step validated address form, delivery speeds, promo code engine, and demo payment simulation (UPI, Card, COD).

9. **Order Creation (`createOrder`)**:
   - On payment simulation completion, generate unique order reference (`TUW-XXXX`), tracking ID (`EXP-XXXXXXXXX`), and carrier assignment (Delhivery Surface Express).
   - Clear shopping bag and navigate to `/checkout/success?order=TUW-XXXX`.

10. **Admin Order Management (`/account/orders`)**:
    - Created orders must persist to store and be queryable via customer order history (`/account/orders`), order detail view (`/account/orders/[id]`), and server API (`/api/orders/[id]`).

11. **Qikink Fulfillment Integration (`/api/fulfillment/qikink`)**:
    - Orders must route through `src/lib/qikink.ts`.
    - Automated SKU generation: `TUW-[PRODUCT]-[COLOR]-[SIZE]`.
    - Payment status guards: never submit unpaid or refunded orders to manufacturing.
    - Idempotency: prevent duplicate print submissions.
    - Graceful fallback: sandbox mode when live API credentials are not configured.

---

## Good / Bad

- ✅ Swatching a color updates both the swatch ring and the hero gallery image.
- ✅ Attempting to add an unselected size produces an inline error alert.
- ✅ Submitting checkout creates an order visible in `/account/orders`.
- ❌ Opening `/products/[slug]` with an unlinked color picker that does nothing to the gallery.
- ❌ Allowing "Add to Bag" without a valid size selection.
- ❌ Bypassing order creation directly to a hardcoded success page without saving the order.

---

## Enforcement

Every work report touching storefront product pages or commerce logic must state:  
`pdp-flow: <verification details across 11 lifecycle steps>`.  
A report without it is incomplete.

