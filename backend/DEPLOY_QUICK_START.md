# Quick Deploy Guide - Get Your Backend Online in 5 Minutes

## 🚀 Railway (Easiest - Recommended)

### Step 1: Sign Up
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (easiest way)

### Step 2: Add Database
1. Click "+ New" → "Database" → "Add PostgreSQL"
2. Wait for it to provision
3. Click on the PostgreSQL service
4. Go to "Variables" tab
5. **Copy the `DATABASE_URL`** - you'll need this!

### Step 3: Deploy Backend
1. Click "+ New" → "GitHub Repo"
2. Select your `Love_Library` repository
3. Railway will auto-detect it's Node.js
4. Go to "Settings" → "Root Directory" → Set to: `backend`
5. Go to "Variables" tab and add:

```
PORT=5000
NODE_ENV=production
DATABASE_URL=<paste the DATABASE_URL from PostgreSQL>
JWT_SECRET=<generate-random-32-char-string>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-key>
CLOUDINARY_API_SECRET=<your-cloudinary-secret>
CORS_ORIGIN=*
```

**To generate JWT_SECRET:**
- Windows PowerShell: `-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})`
- Or use: https://randomkeygen.com/

### Step 4: Configure Build
1. Go to "Settings" → "Build"
2. Build Command: `npm install && npm run prisma:generate`
3. Start Command: `npm start`

### Step 5: Run Database Migrations
1. Go to your backend service
2. Click "Deployments" tab
3. Click on the latest deployment
4. Click "View Logs"
5. In a new terminal on your computer:
   ```bash
   npm install -g @railway/cli
   railway login
   railway link  # Select your project
   railway run npx prisma migrate deploy
   ```

### Step 6: Get Your URL
1. Go to your backend service
2. Click "Settings" → "Networking"
3. Click "Generate Domain"
4. Copy the URL (e.g., `https://love-library-production.up.railway.app`)
5. Your API will be at: `https://love-library-production.up.railway.app/api`

### Step 7: Update Mobile App
1. Open `mobile/src/config/api.ts`
2. Replace the URL:
   ```typescript
   const API_URL = __DEV__ 
     ? 'https://your-app.railway.app/api'  // Your Railway URL
     : 'https://your-app.railway.app/api';
   ```

### Step 8: Test
1. Visit: `https://your-app.railway.app/api/health`
2. Should see: `{"status":"ok","message":"Love Library API is running"}`
3. Build your APK - it will work from anywhere! 🎉

## 📝 Notes

- **Free tier:** Railway gives you $5 free credit monthly
- **Always on:** Your backend stays online 24/7
- **Auto-deploy:** Push to GitHub = auto-deploy (if connected)
- **Database:** Included PostgreSQL, no setup needed

## 🔧 Troubleshooting

**Build fails?**
- Check logs in Railway dashboard
- Make sure Root Directory is set to `backend`
- Verify all environment variables are set

**Database connection fails?**
- Make sure `DATABASE_URL` is correct
- Run migrations: `railway run npx prisma migrate deploy`

**Can't connect from app?**
- Check CORS_ORIGIN is set to `*` (for development)
- Verify the URL in mobile app matches Railway URL

## 🎯 Alternative: Render.com

If Railway doesn't work, try Render:
1. Sign up: https://render.com
2. New → PostgreSQL (copy connection string)
3. New → Web Service → Connect GitHub repo
4. Root Directory: `backend`
5. Build: `npm install && npm run prisma:generate && npm run build`
6. Start: `npm start`
7. Add environment variables (same as Railway)
8. Get URL: `https://your-app.onrender.com/api`

**Note:** Render free tier sleeps after 15 min inactivity (wakes on first request)

