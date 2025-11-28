# Deploy Backend to Cloud (Always Online)

This guide will help you deploy your backend so it's always accessible, even when your laptop is off.

## Option 1: Railway (Recommended - Easiest)

Railway offers a free tier with PostgreSQL included.

### Steps:

1. **Sign up for Railway:**
   - Go to https://railway.app
   - Sign up with GitHub (easiest)

2. **Create a New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (connect your repository)
   - OR select "Empty Project" and we'll set it up manually

3. **Add PostgreSQL Database:**
   - In your project, click "+ New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will create a PostgreSQL database
   - Click on the database, go to "Variables" tab
   - Copy the `DATABASE_URL` value

4. **Deploy Your Backend:**
   - Click "+ New" → "GitHub Repo" (or "Empty Service")
   - If using GitHub: Select your repository
   - Railway will auto-detect it's a Node.js app
   - Go to "Variables" tab and add these environment variables:

   ```
   PORT=5000
   NODE_ENV=production
   DATABASE_URL=<paste the DATABASE_URL from PostgreSQL service>
   JWT_SECRET=<generate a random string, at least 32 characters>
   JWT_EXPIRES_IN=7d
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   CORS_ORIGIN=*
   ```

5. **Configure Build Settings:**
   - Go to "Settings" → "Build"
   - Root Directory: `backend`
   - Build Command: `npm install && npm run prisma:generate`
   - Start Command: `npm start`

6. **Run Database Migrations:**
   - Go to "Settings" → "Deploy"
   - Add a "Deploy Hook" or use Railway CLI:
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   railway run npx prisma migrate deploy
   ```

7. **Get Your Backend URL:**
   - Once deployed, Railway will give you a URL like: `https://your-app.railway.app`
   - Your API will be at: `https://your-app.railway.app/api`

## Option 2: Render (Free Tier)

1. **Sign up:** https://render.com

2. **Create PostgreSQL Database:**
   - New → PostgreSQL
   - Copy the "Internal Database URL"

3. **Create Web Service:**
   - New → Web Service
   - Connect your GitHub repo
   - Settings:
     - Root Directory: `backend`
     - Build Command: `npm install && npm run prisma:generate && npm run build`
     - Start Command: `npm start`
   - Environment Variables:
     ```
     PORT=10000
     NODE_ENV=production
     DATABASE_URL=<your-postgres-url>
     JWT_SECRET=<random-string-32-chars>
     JWT_EXPIRES_IN=7d
     CLOUDINARY_CLOUD_NAME=<your-cloud-name>
     CLOUDINARY_API_KEY=<your-api-key>
     CLOUDINARY_API_SECRET=<your-api-secret>
     CORS_ORIGIN=*
     ```

4. **Run Migrations:**
   - Use Render Shell or add a one-time script

5. **Get URL:** `https://your-app.onrender.com/api`

## Option 3: Fly.io (Free Tier)

1. **Install Fly CLI:**
   ```bash
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Sign up:** https://fly.io

3. **Create app:**
   ```bash
   cd backend
   fly launch
   ```

4. **Add PostgreSQL:**
   ```bash
   fly postgres create
   fly postgres attach <postgres-app-name> -a <your-app-name>
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

## After Deployment

1. **Update your mobile app** (`mobile/src/config/api.ts`):
   ```typescript
   const API_URL = __DEV__ 
     ? 'https://your-app.railway.app/api'  // Your deployed backend URL
     : 'https://your-app.railway.app/api';
   ```

2. **Test the backend:**
   - Visit: `https://your-app.railway.app/api/health`
   - Should return: `{"status":"ok","message":"Love Library API is running"}`

3. **Build your APK** - it will now connect to the cloud backend!

## Important Notes

- **Free tiers have limits:** May sleep after inactivity (Render), or have usage limits
- **Database:** Make sure to run migrations after deployment
- **Environment Variables:** Keep your JWT_SECRET and Cloudinary secrets secure
- **CORS:** Set `CORS_ORIGIN=*` for development, restrict in production

## Quick Deploy Script (Railway)

If using Railway, you can also use their CLI:

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

