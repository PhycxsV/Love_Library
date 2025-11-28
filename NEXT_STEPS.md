# Next Steps - Getting Your Love Library App Running

Follow these steps in order to get your app fully functional:

## Step 1: Set Up PostgreSQL Database

### Option A: Local PostgreSQL (Recommended for Development)
1. **Install PostgreSQL** (if not already installed):
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Or use PostgreSQL installer for Windows
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

2. **Create the database**:
   ```sql
   CREATE DATABASE love_library;
   ```

### Option B: Free Cloud PostgreSQL (Recommended for Production)
- **Supabase** (Free tier): https://supabase.com
  - Create account → New Project → Copy connection string
- **Railway** (Free tier): https://railway.app
  - New Project → Add PostgreSQL → Copy connection string
- **Neon** (Free tier): https://neon.tech
  - Create account → Create project → Copy connection string

## Step 2: Set Up Cloudinary (For Image Uploads)

1. **Create free account**: https://cloudinary.com/users/register/free
2. **Get credentials** from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

## Step 3: Configure Backend Environment

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create `.env` file:
   ```bash
   # Copy the example (if it exists) or create new
   ```

3. Edit `.env` with your values:
   ```env
   PORT=5000
   NODE_ENV=development

   # PostgreSQL Database URL
   # Local: postgresql://username:password@localhost:5432/love_library?schema=public
   # Cloud: (paste your connection string from Supabase/Railway/Neon)
   DATABASE_URL="postgresql://user:password@localhost:5432/love_library?schema=public"

   # JWT Secret (generate a random string)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
   JWT_EXPIRES_IN=7d

   # Cloudinary Credentials
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # CORS Origins (add your frontend URLs)
   CORS_ORIGIN=http://localhost:3000,http://localhost:19006
   ```

## Step 4: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 5: Set Up Database Schema

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

## Step 6: Start Backend Server

```bash
npm run dev
```

You should see: `🚀 Server running on port 5000`

Test it: Open http://localhost:5000/api/health

## Step 7: Set Up Mobile App

1. Navigate to mobile directory:
   ```bash
   cd ../mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. **Important**: Update API URL in `src/config/api.ts`:
   - For physical device: Use your computer's IP address (e.g., `http://192.168.1.100:5000/api`)
   - For emulator: `http://localhost:5000/api` or `http://10.0.2.2:5000/api` (Android)

4. Start Expo:
   ```bash
   npm start
   ```

5. Scan QR code with Expo Go app, or press:
   - `i` for iOS simulator
   - `a` for Android emulator

## Step 8: Set Up Web App

1. Navigate to web directory:
   ```bash
   cd ../web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Step 9: Test the Application

1. **Create an account** (first user)
2. **Create a library** - note the join code
3. **Create second account** (in incognito/another device)
4. **Join library** using the code
5. **Upload a photo** with description
6. **Send messages** - should appear in real-time

## Step 10: Troubleshooting

### Backend won't start
- ✅ Check PostgreSQL is running
- ✅ Verify DATABASE_URL is correct
- ✅ Check all environment variables are set
- ✅ Check port 5000 is not in use

### Database connection errors
- ✅ Verify PostgreSQL is running
- ✅ Check username/password in DATABASE_URL
- ✅ Ensure database `love_library` exists
- ✅ Check firewall/network settings

### Mobile can't connect to backend
- ✅ Use computer's IP address instead of `localhost`
- ✅ Ensure phone and computer are on same WiFi
- ✅ Check CORS_ORIGIN includes your mobile URL
- ✅ Verify backend is running

### Image upload fails
- ✅ Verify Cloudinary credentials
- ✅ Check image file size (max 10MB)
- ✅ Verify CLOUDINARY_* environment variables

### Real-time messaging not working
- ✅ Check Socket.io connection in browser console
- ✅ Verify JWT token is being sent
- ✅ Check backend Socket.io logs

## Step 11: Production Deployment (When Ready)

### Backend Deployment Options:
1. **Railway** (Easiest): https://railway.app
   - Connect GitHub repo
   - Add PostgreSQL service
   - Set environment variables
   - Auto-deploys on push

2. **Render**: https://render.com
   - Free tier available
   - PostgreSQL included

3. **Fly.io**: https://fly.io
   - Free tier available

### Frontend Deployment:
- **Web**: Vercel or Netlify (free)
- **Mobile**: Expo EAS Build (free tier available)

## Quick Start Checklist

- [ ] PostgreSQL installed/running or cloud database created
- [ ] Cloudinary account created and credentials obtained
- [ ] Backend `.env` file configured
- [ ] Backend dependencies installed
- [ ] Database migrations run successfully
- [ ] Backend server running on port 5000
- [ ] Mobile app dependencies installed
- [ ] Mobile API URL configured (if using physical device)
- [ ] Web app dependencies installed
- [ ] Tested creating account and library
- [ ] Tested joining library with second account
- [ ] Tested photo upload
- [ ] Tested real-time messaging

## Need Help?

- Check the `SETUP.md` file for more details
- Review `ARCHITECTURE.md` for system overview
- Check backend logs for errors
- Verify all environment variables are set correctly

