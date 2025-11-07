# PostgreSQL Database Setup Guide

This guide will help you set up a PostgreSQL database for production.

## Option 1: Vercel Postgres (Recommended for Vercel Deployments)

### Steps:
1. **Go to your Vercel project dashboard**
2. **Navigate to Storage tab**
3. **Click "Create Database"**
4. **Select "Postgres"**
5. **Choose a plan** (Hobby plan is free for small projects)
6. **Create the database**

### Automatic Setup:
- Vercel automatically creates a `POSTGRES_PRISMA_URL` environment variable
- Vercel automatically creates a `POSTGRES_URL_NON_POOLING` environment variable
- Use `POSTGRES_PRISMA_URL` for Prisma migrations
- Use `POSTGRES_URL_NON_POOLING` for direct connections

### Update your `.env` or Vercel Environment Variables:
```
DATABASE_URL="${POSTGRES_PRISMA_URL}"
```

### Run Migrations:
```bash
npx prisma migrate deploy
```

---

## Option 2: Supabase (Free Tier Available)

### Steps:
1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up / Log in**
3. **Create a new project**
4. **Wait for database to be provisioned** (~2 minutes)
5. **Go to Project Settings → Database**
6. **Copy the "Connection string"** (URI format)

### Update your `.env`:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Run Migrations:
```bash
npx prisma migrate deploy
```

---

## Option 3: Neon (Serverless PostgreSQL - Free Tier)

### Steps:
1. **Go to [neon.tech](https://neon.tech)**
2. **Sign up / Log in**
3. **Create a new project**
4. **Copy the connection string** from the dashboard

### Update your `.env`:
```
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"
```

### Run Migrations:
```bash
npx prisma migrate deploy
```

---

## Option 4: Railway (Easy Setup)

### Steps:
1. **Go to [railway.app](https://railway.app)**
2. **Sign up / Log in**
3. **Create a new project**
4. **Click "New" → "Database" → "PostgreSQL"**
5. **Copy the connection string** from the Variables tab

### Update your `.env`:
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway"
```

### Run Migrations:
```bash
npx prisma migrate deploy
```

---

## Option 5: AWS RDS / Google Cloud SQL / Azure Database

For enterprise setups, you can use managed PostgreSQL from:
- **AWS RDS PostgreSQL**
- **Google Cloud SQL for PostgreSQL**
- **Azure Database for PostgreSQL**

These require more setup but offer more control and scalability.

---

## Migration Steps (After Setting Up Database)

1. **Update Prisma Schema** (already done - changed from SQLite to PostgreSQL)
2. **Set DATABASE_URL** in your environment variables
3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```
4. **Push schema to database:**
   ```bash
   npx prisma db push
   ```
   OR create a migration:
   ```bash
   npx prisma migrate dev --name init
   ```
5. **For production, run:**
   ```bash
   npx prisma migrate deploy
   ```

---

## Important Notes

- **Never commit your `.env` file** with real credentials
- **Use environment variables** in your hosting platform
- **Test locally** with a local PostgreSQL instance before deploying
- **Backup regularly** - most providers offer automated backups
- **Connection pooling**: For serverless (Vercel), use connection pooling URLs when available

---

## Quick Start Recommendation

**For Vercel deployments:** Use **Vercel Postgres** (Option 1) - it's the easiest and most integrated.

**For other platforms or if you want more control:** Use **Supabase** (Option 2) or **Neon** (Option 3) - both have generous free tiers.

