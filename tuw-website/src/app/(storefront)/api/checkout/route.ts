import { NextRequest, NextResponse } from 'next/server';
import { STORE_PRODUCTS } from '@/mocks/fixtures';

const FREE_SHIPPING_THRESHOLD_PAISE = 300000; // ₹3,000.00
const STANDARD_SHIPPING_FEE_PAISE = 15000; // ₹150.00

interface CartItemInput {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

interface CheckoutPayload {
  items: CartItemInput[];
  promoCode?: string;
  customer?: {
    email: string;
    fullName: string;
    phone: string;
  };
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutPayload = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Cannot checkout an empty shopping bag.' },
        { status: 400 }
      );
    }

    let subtotalPaise = 0;
    const validatedItems = [];

    for (const item of body.items) {
      if (!item.productId || !item.size || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Invalid product or variant selection provided.' },
          { status: 400 }
        );
      }

      const catalogProduct = STORE_PRODUCTS.find((p) => p.id === item.productId);
      if (!catalogProduct || catalogProduct.publicationStatus === 'draft') {
        return NextResponse.json(
          { error: `Garment '${item.productId}' is not available for purchase.` },
          { status: 400 }
        );
      }

      // Validate size stock
      const sizeEntry = catalogProduct.sizes.find((s) => s.size === item.size);
      if (!sizeEntry || !sizeEntry.inStock || sizeEntry.stockCount < item.quantity) {
        return NextResponse.json(
          {
            error: `Size ${item.size} for '${catalogProduct.title}' is currently out of stock.`,
          },
          { status: 409 }
        );
      }

      // Validate color
      const colorEntry = catalogProduct.colors.find((c) => c.value === item.color || c.name === item.color);
      const selectedColor = colorEntry ? colorEntry.name : catalogProduct.colors[0]?.name || item.color;

      const unitPricePaise =
        catalogProduct.priceMinorINR ?? catalogProduct.priceINR * 100;
      const lineTotalPaise = unitPricePaise * Math.floor(item.quantity);

      subtotalPaise += lineTotalPaise;

      validatedItems.push({
        id: `${catalogProduct.id}-${item.color}-${item.size}`,
        productId: catalogProduct.id,
        title: catalogProduct.title,
        color: selectedColor,
        size: item.size,
        quantity: Math.floor(item.quantity),
        priceINR: Math.round(unitPricePaise / 100),
        priceMinorINR: unitPricePaise,
        image: catalogProduct.images[0]?.url || '/products/1.jpeg',
      });
    }

    // Server-side promo calculation
    let discountPaise = 0;
    let validPromoApplied = false;
    if (body.promoCode) {
      const codeClean = body.promoCode.trim().toUpperCase();
      if (codeClean === 'UNPLUG10') {
        discountPaise = Math.round(subtotalPaise * 0.1);
        validPromoApplied = true;
      }
    }

    // Shipping fee determination
    const shippingFeePaise =
      subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : STANDARD_SHIPPING_FEE_PAISE;

    const totalPaise = subtotalPaise - discountPaise + shippingFeePaise;

    // Generate deterministic or random reference
    const orderNumber = `TUW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      success: true,
      orderNumber,
      currency: 'INR',
      subtotalMinorINR: subtotalPaise,
      subtotalINR: Math.round(subtotalPaise / 100),
      discountMinorINR: discountPaise,
      discountINR: Math.round(discountPaise / 100),
      shippingFeeMinorINR: shippingFeePaise,
      shippingFeeINR: Math.round(shippingFeePaise / 100),
      totalMinorINR: totalPaise,
      totalINR: Math.round(totalPaise / 100),
      promoApplied: validPromoApplied,
      items: validatedItems,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json(
      { error: 'Failed to process checkout validation.', details: message },
      { status: 500 }
    );
  }
}
