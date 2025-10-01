# Database Setup Guide - Development & Production

## The Error You're Seeing

The error `Can't reach database server` means:
1. The Neon database URL in your `.env` is for production (Vercel deployment)
2. You're trying to run migrations locally, which can't reach the production DB
3. You need separate databases for development and production

## Solution: Separate Development & Production Databases

### Option 1: Use Local PostgreSQL for Development (Recommended)

#### Step 1: Install PostgreSQL Locally
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### Step 2: Create Local Database
```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE workshop_dev;

# Create user (optional)
CREATE USER workshop_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE workshop_dev TO workshop_user;

# Exit
\q
```

#### Step 3: Update `.env` File
```env
# Local Development Database
DATABASE_URL="postgresql://postgres:@localhost:5432/workshop_dev"

# Or if you created a user:
# DATABASE_URL="postgresql://workshop_user:your_password@localhost:5432/workshop_dev"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

#### Step 4: Run Migrations
```bash
npx prisma migrate dev
```

### Option 2: Use Neon for Both Dev & Production

#### Step 1: Create Two Neon Databases
1. Go to https://console.neon.tech
2. Create two projects:
   - `workshop-dev` (for development)
   - `workshop-prod` (for production)

#### Step 2: Get Connection Strings
- **Development**: Copy connection string from `workshop-dev`
- **Production**: Copy connection string from `workshop-prod`

#### Step 3: Update `.env` File (Local Development)
```env
# Development Database (Neon)
DATABASE_URL="postgresql://user:password@ep-xxx-dev.neon.tech/neondb?sslmode=require"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

#### Step 4: Configure Vercel (Production)
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add:
   - `DATABASE_URL` = Your production Neon connection string
   - `BLOB_READ_WRITE_TOKEN` = Your blob token

### Option 3: Use `.env.local` for Development

#### File Structure
```
.env              # Production values (committed to git - no secrets!)
.env.local        # Development values (gitignored - has secrets)
```

#### `.env` (Committed to Git)
```env
# This file can be committed - no actual secrets
# Production values are set in Vercel dashboard
DATABASE_URL="postgresql://placeholder"
BLOB_READ_WRITE_TOKEN="placeholder"
```

#### `.env.local` (NOT Committed - Add to .gitignore)
```env
# Local development database
DATABASE_URL="postgresql://postgres:@localhost:5432/workshop_dev"

# Vercel Blob token
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxx"
```

## Current Situation Fix

Based on your error, you have a **production Neon URL** in your `.env`. Here's what to do:

### Quick Fix:
1. **Keep production URL safe** - Copy it somewhere
2. **Replace with development URL** in `.env`:

```env
# For local PostgreSQL:
DATABASE_URL="postgresql://postgres:@localhost:5432/workshop_dev"

# OR for Neon development database:
DATABASE_URL="postgresql://user:pass@ep-xxx-dev.neon.tech/neondb?sslmode=require"

# Your blob token
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

3. **Run migrations**:
```bash
npx prisma migrate dev
```

4. **Add production URL to Vercel**:
   - Vercel Dashboard → Settings → Environment Variables
   - Add `DATABASE_URL` with production Neon URL

## Best Practice: Environment-Specific Files

### Create `.env.development` and `.env.production`

#### `.env.development`
```env
DATABASE_URL="postgresql://postgres:@localhost:5432/workshop_dev"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_dev_xxxxx"
```

#### `.env.production`
```env
# These are set in Vercel dashboard, not in file
# DATABASE_URL="postgresql://...neon.tech/neondb"
# BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
```

### Update `.gitignore`
```gitignore
.env
.env.local
.env.development
.env.production
.env*.local
```

## Recommended Setup for Your Project

Since you're using Vercel and Neon:

1. **Development**: Use local PostgreSQL
   ```env
   DATABASE_URL="postgresql://postgres:@localhost:5432/workshop_dev"
   ```

2. **Production**: Use Neon (set in Vercel dashboard)
   - Don't put production URL in `.env` file
   - Set it in Vercel environment variables

## Commands Reference

```bash
# Run migrations (development)
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Push schema without migration (development only)
npx prisma db push

# Open Prisma Studio to view data
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### "Can't reach database server"
- Check if PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL is correct
- For Neon: Check if database is active in Neon dashboard

### "SSL connection required"
- Add `?sslmode=require` to Neon URLs
- Example: `postgresql://user:pass@host/db?sslmode=require`

### Migrations fail
- Make sure database exists
- Check user has proper permissions
- Verify network connectivity for remote databases

## Next Steps

1. Choose your development database strategy (local PostgreSQL recommended)
2. Update `.env` with development database URL
3. Run `npx prisma migrate dev`
4. Keep production URL only in Vercel dashboard
5. Never commit `.env` files with real credentials

Your production database on Neon is safe - you just need a separate development database! 🚀