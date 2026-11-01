// Policy copy for /policies/*. Every policy is a DRAFT until reviewed before
// launch; figures here must match what the storefront promises elsewhere
// (FREE_SHIPPING_THRESHOLD_INR, RETURN_WINDOW_DAYS, 2–3 day printing).
import { FREE_SHIPPING_THRESHOLD_INR, RETURN_WINDOW_DAYS } from './product';

export type PolicySlug = 'returns' | 'shipping' | 'privacy' | 'terms';

export interface PolicySection {
  id: string;
  title: string;
  paragraphs: string[];
  list?: string[];
  /** Optional link shown after the section text. */
  link?: { label: string; href: string };
}

export interface Policy {
  slug: PolicySlug;
  title: string;
  shortTitle: string;
  summary: string;
  /** "The short version" bullet points shown above the full text. */
  shortVersion: string[];
  lastUpdated: string;
  sections: PolicySection[];
}

const SUPPORT_EMAIL = 'studio@theunpluggedwear.com';
const FREE_FROM = `₹${FREE_SHIPPING_THRESHOLD_INR.toLocaleString('en-IN')}`;
const STANDARD_SHIPPING = '₹150';
const EXPRESS_SHIPPING = '₹250';

export const POLICIES: Policy[] = [
  {
    slug: 'returns',
    title: 'Returns & Exchanges',
    shortTitle: 'Returns',
    summary: `${RETURN_WINDOW_DAYS}-day returns on unworn clothing, and replacements for anything that arrives damaged or misprinted.`,
    shortVersion: [
      `Return or exchange unworn clothing within ${RETURN_WINDOW_DAYS} days of delivery.`,
      'Printed objects (mugs, cases, posters…) are replaced if they arrive damaged or misprinted.',
      'Start a return from your account; we arrange a pickup from your address.',
    ],
    lastUpdated: '1 Nov 2026',
    sections: [
      {
        id: 'window',
        title: 'Return window',
        paragraphs: [
          `You can ask to return or exchange clothing within ${RETURN_WINDOW_DAYS} days of the delivery date shown in your order tracking.`,
        ],
      },
      {
        id: 'condition',
        title: 'Condition of returned clothing',
        paragraphs: ['So the next person receives it as new, returned clothing must be:'],
        list: ['Unworn and unwashed', 'Free of marks, perfume and odours', 'Returned with its original tags and packaging where possible'],
      },
      {
        id: 'objects',
        title: 'Printed objects',
        paragraphs: [
          'Mugs, bottles, phone cases, posters, stationery and other objects are printed for you and can’t be returned for a change of mind.',
          'If one arrives damaged, misprinted or not as described, tell us within 7 days of delivery with a photo and we’ll send a replacement.',
        ],
      },
      {
        id: 'how',
        title: 'How to start a return',
        paragraphs: [
          'Open your account, find the order and choose “Request return”. We’ll confirm the request and arrange a courier pickup from your delivery address.',
        ],
        link: { label: 'Go to my account', href: '/account' },
      },
      {
        id: 'refunds',
        title: 'Refunds',
        paragraphs: [
          'Once your return reaches us and is checked, we refund the original payment method. Banks usually take 5–7 business days to show it.',
          'Shipping charges are refunded only if the item was damaged, misprinted or not as described.',
        ],
      },
    ],
  },
  {
    slug: 'shipping',
    title: 'Shipping & Delivery',
    shortTitle: 'Shipping',
    summary: `Printed in 2–3 business days, then delivered across India. Free delivery on orders over ${FREE_FROM}.`,
    shortVersion: [
      'Every piece is printed after you order it: allow 2–3 business days.',
      'Delivery then takes about 3–6 days, depending on where you are.',
      `Free standard delivery on orders over ${FREE_FROM}; otherwise ${STANDARD_SHIPPING}.`,
    ],
    lastUpdated: '1 Nov 2026',
    sections: [
      {
        id: 'printing',
        title: 'Printing time',
        paragraphs: [
          'Nothing is printed before you order. Our print partner in India prints, checks and packs your piece in 2–3 business days (Monday–Saturday).',
        ],
      },
      {
        id: 'delivery',
        title: 'Delivery time',
        paragraphs: [
          'After printing, orders are handed to a courier and usually arrive in 3–6 days. Remote areas can take a little longer.',
          'Enter your PIN code on any product page to see an estimated delivery date.',
        ],
      },
      {
        id: 'rates',
        title: 'Delivery charges',
        paragraphs: ['Delivery charges are shown in your bag before you pay:'],
        list: [
          `Standard delivery: free on orders over ${FREE_FROM}, otherwise ${STANDARD_SHIPPING}`,
          `Express delivery: ${EXPRESS_SHIPPING}`,
        ],
      },
      {
        id: 'tracking',
        title: 'Tracking your order',
        paragraphs: ['As soon as your order ships, we send a tracking number. You can also follow it any time on our tracking page.'],
        link: { label: 'Track an order', href: '/track-order' },
      },
      {
        id: 'where',
        title: 'Where we deliver',
        paragraphs: ['We currently deliver within India only. International delivery isn’t available yet.'],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    shortTitle: 'Privacy',
    summary: 'We collect only what we need to make and deliver your order, and we never sell your details.',
    shortVersion: [
      'We use your name, contact details and address to make and deliver your order.',
      'Card details are handled by our payment provider; we never see or store them.',
      'You can ask us to see or delete your data at any time.',
    ],
    lastUpdated: '1 Nov 2026',
    sections: [
      {
        id: 'collect',
        title: 'What we collect',
        paragraphs: ['When you order or create an account we collect:'],
        list: ['Name, email address and phone number', 'Delivery addresses', 'Order history and return requests'],
      },
      {
        id: 'use',
        title: 'How we use it',
        paragraphs: [
          'To print, ship and support your orders, to send order updates, and — only if you sign up — our newsletter. We share delivery details with our print partner and courier only so they can make and deliver your order.',
        ],
      },
      {
        id: 'payments',
        title: 'Payments',
        paragraphs: ['Payments are processed by our payment provider. We never see or store your full card number.'],
      },
      {
        id: 'tracking-tools',
        title: 'Cookies and tracking',
        paragraphs: [
          'We use only the storage needed to keep your bag, wishlist and sign-in working. We don’t use third-party advertising trackers.',
        ],
      },
      {
        id: 'rights',
        title: 'Your rights',
        paragraphs: [
          `Under India’s Digital Personal Data Protection Act, you can ask to see, correct or delete your personal data. Write to ${SUPPORT_EMAIL} and we’ll reply within 30 days.`,
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    shortTitle: 'Terms',
    summary: 'The terms for buying from and using The Unplugged Wear.',
    shortVersion: [
      'Prices are in Indian rupees and include GST.',
      'Each piece is printed for you, so small variations in print colour are normal.',
      'Returns follow our Returns & Exchanges policy.',
    ],
    lastUpdated: '1 Nov 2026',
    sections: [
      {
        id: 'agreement',
        title: 'Using this site',
        paragraphs: [
          'By using The Unplugged Wear website or placing an order, you agree to these terms. If you don’t agree, please don’t use the site.',
        ],
      },
      {
        id: 'printed-to-order',
        title: 'Printed to order',
        paragraphs: [
          'Every piece is printed after you order it. Because each one is printed individually, small differences in print colour and placement from the photos are normal.',
        ],
      },
      {
        id: 'pricing',
        title: 'Prices and orders',
        paragraphs: [
          'All prices are in Indian rupees (INR) and include GST. If a price is shown incorrectly, we’ll contact you before your order is printed, and you can cancel for a full refund.',
        ],
      },
      {
        id: 'returns',
        title: 'Returns',
        paragraphs: ['Returns, exchanges and replacements are covered by our Returns & Exchanges policy.'],
        link: { label: 'Read the returns policy', href: '/policies/returns' },
      },
      {
        id: 'liability',
        title: 'Liability',
        paragraphs: [
          'To the extent allowed by Indian law, our liability for any order is limited to the amount you paid for it.',
        ],
      },
    ],
  },
];

export const getPolicy = (slug: PolicySlug) => POLICIES.find((p) => p.slug === slug)!;
