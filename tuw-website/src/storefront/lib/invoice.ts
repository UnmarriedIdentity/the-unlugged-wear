// Branded demo invoice as a PDF download. jsPDF is loaded only when a shopper
// asks for an invoice, so it never weighs down page loads. The built-in PDF
// fonts have no ₹ glyph, so amounts are written as "Rs.".
import type { Order } from './types';
import { formatShortDate } from './format';

const BRAND = 'The Unplugged Wear';
const SUPPORT_EMAIL = 'studio@theunpluggedwear.com';
const LOGO_URL = '/images/brand/deer.png';

// Storefront palette (charcoal text, muted grey, warm card border, gold accent).
const CHARCOAL: [number, number, number] = [26, 26, 26];
const MUTED: [number, number, number] = [107, 107, 107];
const BORDER: [number, number, number] = [226, 221, 207];
const CREAM: [number, number, number] = [244, 241, 234];
const GOLD: [number, number, number] = [200, 169, 106];

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Paid',
  pending: 'Payment due on delivery',
  failed: 'Payment failed',
  refunded: 'Refunded',
};

const linePaise = (item: Order['items'][number]) =>
  (item.priceMinorINR ?? Math.round(item.priceINR * 100)) * item.quantity;

/** "Rs. 6,098" or "Rs. 6,098.50" from integer paise. */
function rupees(paise: number) {
  const whole = paise % 100 === 0;
  return `Rs. ${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

async function loadLogo(): Promise<string | null> {
  try {
    const blob = await (await fetch(LOGO_URL)).blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadInvoicePdf(order: Order, customerEmail?: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 48; // page margin
  const right = pageW - M;
  let y = M;

  const text = (value: string, x: number, yy: number, opts: { size?: number; bold?: boolean; color?: [number, number, number]; align?: 'left' | 'right' | 'center' } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size ?? 10);
    doc.setTextColor(...(opts.color ?? CHARCOAL));
    doc.text(value, x, yy, { align: opts.align ?? 'left' });
  };
  const rule = (yy: number, color = BORDER) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.75);
    doc.line(M, yy, right, yy);
  };

  // ---- Header: logo + brand, invoice title ---------------------------------
  const logo = await loadLogo();
  if (logo) doc.addImage(logo, 'PNG', M, y - 6, 34, 34);
  text(BRAND.toUpperCase(), M + (logo ? 44 : 0), y + 10, { size: 13, bold: true });
  text('Everyday pieces, printed to order · Surat, India', M + (logo ? 44 : 0), y + 24, { size: 8.5, color: MUTED });
  text('INVOICE', right, y + 10, { size: 20, bold: true, align: 'right' });
  text(order.orderNumber, right, y + 24, { size: 9, color: MUTED, align: 'right' });
  y += 44;
  doc.setFillColor(...GOLD);
  doc.rect(M, y, pageW - 2 * M, 2, 'F');
  y += 18;

  // ---- Demo banner ----------------------------------------------------------
  doc.setFillColor(...CREAM);
  doc.setDrawColor(...BORDER);
  doc.rect(M, y, pageW - 2 * M, 26, 'FD');
  text('DEMO INVOICE — not a tax invoice. No payment was collected and nothing will be printed or shipped.', M + 10, y + 16.5, { size: 8.5 });
  y += 44;

  // ---- Order facts + bill to ------------------------------------------------
  const colW = (pageW - 2 * M) / 3;
  const facts: [string, string][] = [
    ['Order date', formatShortDate(order.date)],
    ['Payment', `${PAYMENT_LABELS[order.paymentStatus ?? 'paid'] ?? 'Paid'} · ${order.paymentMethod}`],
    ['Order reference', order.orderNumber],
  ];
  facts.forEach(([label, value], i) => {
    text(label.toUpperCase(), M + i * colW, y, { size: 7.5, color: MUTED });
    text(value, M + i * colW, y + 14, { size: 10 });
  });
  y += 38;

  const a = order.shippingAddress;
  text('BILL & SHIP TO', M, y, { size: 7.5, color: MUTED });
  const addressLines = [
    a.fullName,
    a.addressLine1,
    ...(a.addressLine2 ? [a.addressLine2] : []),
    `${a.city}, ${a.state} ${a.postalCode}`,
    a.country,
    a.phone,
    ...(customerEmail ? [customerEmail] : []),
  ];
  addressLines.forEach((line, i) => text(line, M, y + 14 + i * 13, { size: 10, bold: i === 0 }));
  text('FROM', M + 2 * colW, y, { size: 7.5, color: MUTED });
  [BRAND, 'Surat, Gujarat, India', SUPPORT_EMAIL].forEach((line, i) =>
    text(line, M + 2 * colW, y + 14 + i * 13, { size: 10, bold: i === 0 })
  );
  y += 14 + addressLines.length * 13 + 22;

  // ---- Items table ------------------------------------------------------------
  const cols = { item: M + 10, qty: right - 190, unit: right - 100, total: right - 10 };
  doc.setFillColor(...CHARCOAL);
  doc.rect(M, y, pageW - 2 * M, 24, 'F');
  text('ITEM', cols.item, y + 15.5, { size: 8, bold: true, color: [255, 255, 255] });
  text('QTY', cols.qty, y + 15.5, { size: 8, bold: true, color: [255, 255, 255], align: 'right' });
  text('UNIT PRICE', cols.unit, y + 15.5, { size: 8, bold: true, color: [255, 255, 255], align: 'right' });
  text('AMOUNT', cols.total, y + 15.5, { size: 8, bold: true, color: [255, 255, 255], align: 'right' });
  y += 24;

  order.items.forEach((item, i) => {
    const rowH = 38;
    if (y + rowH > pageH - 200) {
      doc.addPage();
      y = M;
    }
    if (i % 2 === 1) {
      doc.setFillColor(250, 249, 246);
      doc.rect(M, y, pageW - 2 * M, rowH, 'F');
    }
    const paise = linePaise(item);
    text(item.title, cols.item, y + 16, { size: 10, bold: true });
    text(`${item.color} · ${item.size}`, cols.item, y + 29, { size: 8.5, color: MUTED });
    text(String(item.quantity), cols.qty, y + 22, { size: 10, align: 'right' });
    text(rupees(paise / item.quantity), cols.unit, y + 22, { size: 10, align: 'right' });
    text(rupees(paise), cols.total, y + 22, { size: 10, align: 'right' });
    y += rowH;
    rule(y);
  });

  // ---- Totals ----------------------------------------------------------------
  const subtotal = order.items.reduce((sum, item) => sum + linePaise(item), 0);
  const discount = order.discountINR * 100;
  const shipping = order.shippingINR * 100;
  const total = subtotal - discount + shipping;
  y += 18;
  const labelX = right - 200;
  const totals: [string, string][] = [
    ['Items', rupees(subtotal)],
    ...(discount ? ([['Discount', `- ${rupees(discount)}`]] as [string, string][]) : []),
    ['Delivery', shipping ? rupees(shipping) : 'Free'],
    ['GST', 'Included in prices'],
  ];
  totals.forEach(([label, value]) => {
    text(label, labelX, y, { size: 10, color: MUTED });
    text(value, right - 10, y, { size: 10, align: 'right' });
    y += 16;
  });
  y += 4;
  doc.setFillColor(...CREAM);
  doc.rect(labelX - 10, y - 4, right - labelX + 10, 30, 'F');
  text(order.paymentStatus === 'pending' ? 'Due on delivery' : 'Total paid', labelX, y + 15, { size: 11, bold: true });
  text(rupees(total), right - 10, y + 15, { size: 13, bold: true, align: 'right' });

  // ---- Footer -------------------------------------------------------------------
  const fy = pageH - 70;
  rule(fy);
  text('Thank you for choosing pieces that are made only when they are wanted.', M, fy + 18, { size: 9 });
  text(`Questions? ${SUPPORT_EMAIL} · 14-day returns on unworn clothing · theunpluggedwear.com/policies/returns`, M, fy + 32, {
    size: 8,
    color: MUTED,
  });
  text('Demo invoice generated by the storefront preview. Not valid for tax purposes.', M, fy + 46, { size: 7.5, color: MUTED });

  doc.save(`${order.orderNumber}-invoice-demo.pdf`);
}
