# PostgreSQL Setup Guide

## Option 1: Free Cloud PostgreSQL (Recommended - Easiest)

### Supabase (Recommended)
1. Go to https://supabase.com
2. Click "Start your project" → Sign up (free)
3. Click "New Project"
4. Fill in:
   - **Name**: love-library (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click "Create new project" (takes ~2 minutes)
6. Once ready, go to **Project Settings** → **Database**
7. Scroll to **Connection string** → Select **URI**
8. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
9. Replace `[YOUR-PASSWORD]` with the password you created
10. Paste into your `backend/.env` file as `DATABASE_URL`

### Railway (Alternative)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Click "Add Service" → Select "PostgreSQL"
5. Click on the PostgreSQL service
6. Go to **Variables** tab
7. Copy the `DATABASE_URL` value
8. Paste into your `backend/.env` file

### Neon (Alternative)
1. Go to https://neon.tech
2. Sign up
3. Click "Create a project"
4. Copy the connection string
5. Paste into your `backend/.env` file

---

## Option 2: Local PostgreSQL

### Install PostgreSQL on Windows

1. **Download PostgreSQL**:
   - Go to https://www.postgresql.org/download/windows/
   - Download the installer (e.g., "Download the installer")
   - Or use: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Run the installer**:
   - Run the downloaded `.exe` file
   - Follow the installation wizard
   - **Important**: Remember the password you set for the `postgres` user!
   - Default port: 5432 (keep this)
   - Default locale: (keep default)

3. **Verify installation**:
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - Should show version number

4. **Create the database**:
   - Open **pgAdmin** (installed with PostgreSQL) or use command line:
   ```bash
   psql -U postgres
   ```
   - Enter your password when prompted
   - Run:
   ```sql
   CREATE DATABASE love_library;
   ```
   - Exit: `\q`

5. **Update your `.env` file**:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/love_library?schema=public"
   ```
   Replace `YOUR_PASSWORD` with the password you set during installation.

---

## Quick Test

After setting up, test the connection:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
```

If successful, you'll see:
- ✅ Prisma Client generated
- ✅ Database migrations applied
- ✅ Tables created

---

## Which Should You Choose?

**Choose Cloud (Supabase/Railway/Neon) if:**
- ✅ You want the easiest setup
- ✅ You don't want to install anything locally
- ✅ You want to access database from anywhere
- ✅ You want automatic backups
- ✅ You're planning to deploy later

**Choose Local if:**
- ✅ You want to work completely offline
- ✅ You prefer local development
- ✅ You want full control over the database

**My Recommendation**: Start with **Supabase** - it's free, easy, and you can always switch later!










