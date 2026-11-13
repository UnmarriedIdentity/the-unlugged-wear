import 'server-only';
import { AppError } from '../../platform/errors/index.ts';
import { fulfillmentAdapters, type FulfillmentPartner } from './adapters.ts';

export * from './adapters.ts';

/** Adapter for a product's partner (products.partner_provider → slug). */
export function getFulfillmentPartner(slug: string): FulfillmentPartner {
  const partner = fulfillmentAdapters.find((a) => a.slug === slug);
  if (!partner) throw new AppError('RULE_VIOLATION', `No fulfilment adapter for "${slug}" yet (integrations phase).`);
  return partner;
}
