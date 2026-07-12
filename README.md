# ROOH N RANG Admin

Editorial admin studio for managing clients, events, galleries, Google Drive sync, website content, selections, downloads, and preview processing.

## Structure

- `apps/admin` - Next.js admin application
- `packages/database` - shared Prisma client
- `prisma` - Supabase Postgres schema and migrations

Use `apps/admin` as the Vercel Root Directory. Environment credentials belong in Vercel or a local `.env` file and must never be committed.
