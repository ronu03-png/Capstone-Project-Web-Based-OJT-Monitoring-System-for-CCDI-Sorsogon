# Supabase Migration Guide

## What is Supabase?

Supabase is an **open-source Firebase alternative** that provides:

| Feature | What it does |
|---------|-------------|
| **PostgreSQL Database** | Your main data store (replaces Prisma Cloud DB) |
| **Auth** | User authentication with email/password, magic links, OAuth |
| **Storage** | File uploads (DTR attachments, profile photos) |
| **Real-time** | Live database subscriptions |
| **Edge Functions** | Serverless TypeScript functions |
| **Row Level Security** | Database-level access control |

## Migration Steps

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Choose your organization
5. Enter a project name (e.g., "ccdi-ojt-system")
6. Set a database password (save this!)
7. Choose a region closest to your users (e.g., Singapore for Philippines)
8. Click "Create new project"

Wait about 2 minutes for the database to be provisioned.

### Step 2: Get Your Connection String

1. In your Supabase dashboard, go to **Project Settings** (gear icon)
2. Click **Database** in the left sidebar
3. Scroll down to **Connection String**
4. Click **URI** tab
5. Copy the connection string. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Update Environment Variables

Open your `.env` file and update:

```env
# OLD (Prisma Cloud)
# DATABASE_URL="postgres://..."

# NEW (Supabase)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
SESSION_SECRET="ZtHwPGkPHxeszd9BuIjqMSbysgKJmW6zl2FZjaW1Fzc="
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 4: Push Schema to Supabase

Run these commands in your terminal:

```bash
# 1. Regenerate Prisma client for new connection
npx prisma generate

# 2. Push your schema to Supabase
npx prisma db push --accept-data-loss

# 3. (Optional) Seed with demo data
npx prisma db seed
```

### Step 5: Migrate Existing Data (If you have real data)

If you have production data to migrate:

```bash
# Export current database
npx tsx prisma/export-data.ts

# After updating .env to Supabase connection:
npx tsx prisma/import-data.ts
```

### Step 6: Verify Connection

```bash
# Open Prisma Studio connected to Supabase
npx prisma studio
```

You should see all your tables in Prisma Studio connected to Supabase.

### Step 7: Start Your App

```bash
npm run dev
```

The app now uses Supabase as the database backend.

---

## Using Supabase Auth (Optional Future Enhancement)

Currently your app uses custom JWT auth with `jose`. You can optionally migrate to **Supabase Auth** for:

- Built-in password reset emails
- OAuth (Google, GitHub login)
- Magic link login
- Email confirmation

This requires code changes to `src/lib/auth/session.ts` and login pages.

## Using Supabase Storage (Optional)

For DTR attachments and profile photos, you can use Supabase Storage instead of local file storage.

## Important Notes

- **Supabase has a free tier** with 500MB database, 1GB bandwidth
- **Connection pooling**: Supabase uses PgBouncer. If you get connection errors, add `?pgbouncer=true&connection_limit=1` to your DATABASE_URL
- **RLS (Row Level Security)**: You can enable database-level security rules in Supabase
- **Realtime**: You can subscribe to database changes for live notifications
