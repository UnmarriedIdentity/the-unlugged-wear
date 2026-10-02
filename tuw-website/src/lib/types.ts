// Shared storefront types — replaces old src/types/ folder.
// TODO: generate Database from Supabase CLI, extend here.
export type Product = { id: string; slug: string; title: string; pricePaise: number };
export type Collection = { id: string; slug: string; title: string };
export type CartItem = { productId: string; qty: number };
export type Order = { id: string; status: string; totalPaise: number };
