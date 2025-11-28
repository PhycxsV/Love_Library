# How to Keep Your Render Backend Awake

## The Problem
On Render's free tier, your backend automatically sleeps after **15 minutes of inactivity**. When you access the app after it's been sleeping:
- ✅ It will **automatically wake up** when you make a request
- ⚠️ But the **first request takes 30-60 seconds** (cold start delay)
- ✅ After that, it's fast again

## Solutions

### Option 1: Use a Free Uptime Monitoring Service (Recommended)

These services will ping your backend every few minutes to keep it awake:

#### **UptimeRobot** (Free - 50 monitors)
1. Go to https://uptimerobot.com
2. Sign up for free
3. Click "Add New Monitor"
4. Choose "HTTP(s)" type
5. Enter:
   - **Friendly Name**: Love Library Backend
   - **URL**: `https://love-library-a28m.onrender.com/api/health`
   - **Monitoring Interval**: 5 minutes
6. Click "Create Monitor"

#### **cron-job.org** (Free)
1. Go to https://cron-job.org
2. Sign up for free
3. Click "Create cronjob"
4. Enter:
   - **Title**: Keep Render Backend Awake
   - **URL**: `https://love-library-a28m.onrender.com/api/health`
   - **Schedule**: Every 5 minutes (`*/5 * * * *`)
5. Click "Create"

#### **Pingdom** (Free tier available)
1. Go to https://www.pingdom.com
2. Sign up for free account
3. Add a new uptime check
4. Set it to ping every 5 minutes

### Option 2: Upgrade to Paid Tier (No Sleep)
- Go to Render dashboard
- Click on your backend service
- Go to "Settings" → "Change Instance Type"
- Select a paid plan (Starter is ~$7/month)
- Your backend will never sleep

### Option 3: Manual Wake-Up
If you don't want to set up monitoring:
1. Just access your app normally
2. Wait 30-60 seconds for the first request
3. After that, it's fast

## Recommended Setup
**Use UptimeRobot** - it's free, reliable, and easy to set up. Just ping your health endpoint every 5 minutes.

Your health endpoint: `https://love-library-a28m.onrender.com/api/health`

