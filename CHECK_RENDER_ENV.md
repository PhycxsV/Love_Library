# How to Check and Set Environment Variables on Render

## Check if JWT_SECRET is Set

1. Go to https://render.com
2. Click on your backend service: **"love-library-backend"**
3. Click on the **"Environment"** tab
4. Look for `JWT_SECRET` in the list

## If JWT_SECRET is Missing

### Step 1: Generate a JWT Secret

**Option A: Using Node.js (if you have it installed)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B: Using PowerShell (Windows)**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Option C: Online Generator**
- Go to https://randomkeygen.com/
- Use a "CodeIgniter Encryption Keys" (256-bit)

### Step 2: Add to Render

1. In Render dashboard → Your backend service → **"Environment"** tab
2. Click **"Add Environment Variable"** or **"Edit"** if it exists
3. Set:
   - **Key**: `JWT_SECRET`
   - **Value**: (paste the generated secret)
4. Click **"Save Changes"**
5. Render will automatically restart your backend

## Required Environment Variables

Make sure ALL of these are set in Render:

✅ **Required:**
- `JWT_SECRET` - Random 32+ character string
- `DATABASE_URL` - Should be auto-set by Render (from your PostgreSQL database)
- `NODE_ENV` - Should be `production`
- `PORT` - Should be `10000` (or whatever Render assigned)
- `CORS_ORIGIN` - Should include your Vercel URLs

✅ **Optional (for image uploads):**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## After Setting JWT_SECRET

1. Wait 1-2 minutes for Render to restart
2. Try logging in again
3. Check the logs if it still fails

