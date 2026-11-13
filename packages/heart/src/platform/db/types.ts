import { customType } from 'drizzle-orm/pg-core';

/** Postgres tsvector (generated search columns; read-only in code). */
export const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });
