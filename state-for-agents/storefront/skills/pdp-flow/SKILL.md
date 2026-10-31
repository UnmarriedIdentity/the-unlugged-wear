---
name: pdp-flow
description: Authority and procedures for building and maintaining the 11-step Product Detail Page (PDP) purchase-to-fulfillment lifecycle flow in tuw-website matching Figma Node 82:5702 / 319:7729.
---

# PDP Lifecycle Flow Skill (Figma Node 319:7729)

This skill governs the architecture, state synchronization, validation patterns, and fulfillment integration for the complete Product Detail Page journey in `tuw-website`.

---

## 1. Flow Overview & Node Reference

Every PDP interaction follows the 11-node lifecycle:

```
[1. Product Listing] ──► [2. PDP Route] ──► [3. Fetch by Slug] ──► [4. Render Gallery & Info]
                                                                            │
                                                                            ▼
[7. Cart Drawer/Page] ◄── [Add to Cart] ◄── [Valid: Yes] ◄── [5. Select Color & Size]
         │                                                      │
         ▼                                                 [Valid: No] ──► [Validation Alert]
   [8. Checkout]
         │
         ▼
[9. Order Creation] ──► [10. Admin Order Management] ──► [11. Qikink POD Fulfillment]
```

---

## 2. Component Directory Architecture

- **PDP Route Shell**: `src/app/products/[slug]/page.tsx`
- **Product Gallery**: `src/components/commerce/ProductGallery.tsx`
- **Variant Selector**: `src/components/commerce/VariantSelector.tsx`
- **Measurement Chart**: `src/components/commerce/SizeGuideModal.tsx` & inline table in `page.tsx`
- **Cart Management**: `src/components/layout/CartDrawer.tsx` & `src/app/cart/page.tsx`
- **Checkout Engine**: `src/app/checkout/page.tsx`
- **Order Confirmation**: `src/app/checkout/success/page.tsx`
- **Order History**: `src/app/account/orders/page.tsx` & `src/app/account/orders/[id]/page.tsx`
- **Fulfillment API**: `src/lib/qikink.ts` & `src/app/api/fulfillment/qikink/route.ts`

---

## 3. Implementation Patterns

### Colorway Synchronization
`VariantSelector` passes the selected shade to the parent `ProductDetailPage`, which feeds `selectedColorValue` into `ProductGallery`:
```tsx
// Synchronize gallery active image with selected colorway
useEffect(() => {
  if (!selectedColorValue) return;
  const matchingIndex = images.findIndex(
    (img) => img.color?.toLowerCase() === selectedColorValue.toLowerCase()
  );
  if (matchingIndex !== -1) {
    setActiveIndex(matchingIndex);
  }
}, [selectedColorValue, images]);
```

### Strict Variant Validation
```tsx
const handleAddToCart = () => {
  if (!selectedSize) {
    setValidationError('Please choose a size to continue.');
    return;
  }
  if (!selectedSize.inStock) {
    setValidationError('This size is currently sold out.');
    return;
  }
  setValidationError(null);
  addToCart({ ... });
};
```

### Fulfillment SKU Normalization
```tsx
const sku = `TUW-${item.productId}-${item.color}-${item.size}`
  .toUpperCase()
  .replace(/\s+/g, '-');
```

---

## 4. Verification Checklist

Before marking any PDP change complete:
1. `pnpm --dir tuw-website typecheck` is clean.
2. `pnpm --dir tuw-website test` passes all tests.
3. Swatching every colorway swaps the gallery image.
4. Clicking Add to Bag with no size selected renders `Please choose a size to continue.`
5. Adding a valid size opens `CartDrawer` immediately.
6. Checkout simulation creates an order viewable in `/account/orders`.
7. Qikink submission guards reject unpaid orders.

