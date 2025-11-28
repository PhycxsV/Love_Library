# How to Run Database Migrations on Render

## The Problem
Your database tables don't exist yet. The error says: `The table 'public.User' does not exist in the current database.`

## Solution: Run Migrations

### Option 1: Use Render Shell (Easiest)

1. Go to https://render.com
2. Click on your backend service: **"love-library-backend"**
3. Click on **"Shell"** tab (or look for "Open Shell" button)
4. In the shell, run:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
5. Wait for it to complete - you should see messages like:
   ```
   ✅ Applied migration: 20251128043828_init
   ✅ Applied migration: 20251128063553_add_profile_photo
   ...
   ```

### Option 2: Wait for Auto-Migration (After Next Deploy)

I've updated the code to run migrations automatically. After the next deployment:
1. The migrations will run automatically on startup
2. Check the logs to see if they ran successfully

### Option 3: Manual Migration via Build Command

The `render.yaml` has been updated to run migrations during build. After pushing to GitHub:
1. Render will automatically rebuild
2. Migrations will run during the build process

## Verify Migrations Ran

After running migrations, check:
1. Go to Render → Your backend → **"Logs"** tab
2. Look for: `✅ Migrations completed`
3. Try logging in again - it should work now!

## If Migrations Still Fail

Check:
- ✅ `DATABASE_URL` is set in Render Environment variables
- ✅ The database is running (not sleeping)
- ✅ The connection string is correct

