// Shared domain types — replaces old src/types/ folder.
// TODO: derive Database row types from db/migrate (shared Neon schema), extend here.
export type Product = { id: string; title: string; pricePaise: number };
export type Order = { id: string; status: string; totalPaise: number };
export type Customer = { id: string; email: string };
