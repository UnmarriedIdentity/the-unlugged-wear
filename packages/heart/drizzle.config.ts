import { defineConfig } from 'drizzle-kit';

// Types only: the schema is owned by db/migrate/*.sql. `pnpm db:types` pulls
// the live schema into src/platform/db/generated/ after `pnpm db:migrate`.
export default defineConfig({
  dialect: 'postgresql',
  out: './src/platform/db/generated',
  dbCredentials: { url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '').replace('sslmode=require', 'sslmode=verify-full') },
  schemaFilter: ['public'],
  tablesFilter: ['!schema_migrations', '!*_default', '!*_20[0-9][0-9]_[0-9][0-9]'],
});
