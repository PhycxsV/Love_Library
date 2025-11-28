# Setting Up Local PostgreSQL for Love Library

## Step 1: Open pgAdmin

1. **Find pgAdmin**:
   - Search for "pgAdmin" in Windows Start menu
   - Or look in: `C:\Program Files\PostgreSQL\[version]\pgAdmin 4\`
   - Double-click to open

2. **Set Master Password** (first time only):
   - pgAdmin will ask for a master password
   - This is just for pgAdmin, not your database
   - Set any password you'll remember (or leave blank)

## Step 2: Connect to PostgreSQL Server

1. In pgAdmin, you'll see a server in the left sidebar:
   - Usually named "PostgreSQL [version]" or "PostgreSQL 16"
   
2. **Click on the server** → It will ask for password
   - Enter the password you set during PostgreSQL installation
   - Check "Save password" if you want
   - Click "OK"

## Step 3: Create the Database

1. **Right-click on "Databases"** (under your server)
2. Click **"Create"** → **"Database..."**
3. Fill in:
   - **Database name**: `love_library`
   - **Owner**: `postgres` (default)
4. Click **"Save"**

## Step 4: Get Your Connection String

Your connection string format is:
```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/love_library?schema=public
```

**Replace `YOUR_PASSWORD`** with the password you set during PostgreSQL installation.

## Step 5: Update Your .env File

Open `backend\.env` and update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/love_library?schema=public"
```

**Important**: Replace `YOUR_PASSWORD` with your actual PostgreSQL password!

## Step 6: Test the Connection

Run these commands in your terminal:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
```

If successful, you'll see:
- ✅ Prisma Client generated
- ✅ Database tables created
- ✅ Ready to use!

---

## Alternative: Using Command Line (if you prefer)

If you want to use command line instead:

1. **Find PostgreSQL bin folder** (usually):
   ```
   C:\Program Files\PostgreSQL\[version]\bin
   ```

2. **Add to PATH** (optional):
   - Search "Environment Variables" in Windows
   - Edit "Path" → Add PostgreSQL bin folder
   - Restart terminal

3. **Create database**:
   ```bash
   psql -U postgres
   # Enter password when prompted
   CREATE DATABASE love_library;
   \q
   ```

---

## Troubleshooting

**Can't find pgAdmin?**
- Check Start menu for "pgAdmin 4"
- Or reinstall PostgreSQL and make sure to install pgAdmin

**Forgot PostgreSQL password?**
- You'll need to reset it or reinstall PostgreSQL
- Or check if you wrote it down during installation

**Connection refused?**
- Make sure PostgreSQL service is running:
  - Open Services (Win+R → services.msc)
  - Find "postgresql-x64-[version]"
  - Right-click → Start (if stopped)

**Port 5432 already in use?**
- Another PostgreSQL instance might be running
- Or change port in PostgreSQL config

