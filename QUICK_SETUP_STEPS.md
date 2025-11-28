# Quick Setup Steps - pgAdmin

## Step 1: Connect to Server (You're doing this now!)

1. In pgAdmin, right-click **"Servers"** in the left sidebar
2. Click **"Create"** → **"Server..."**
3. **General tab**:
   - Name: `PostgreSQL` (or any name you like)
4. **Connection tab**:
   - Host name/address: `localhost`
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `postgres`
   - Password: **[Enter your PostgreSQL password]**
   - ✅ Check "Save password" (optional, but helpful)
5. Click **"Save"**

You should now see your server in the left sidebar!

---

## Step 2: Create the Database

1. In the left sidebar, **expand your server** (click the arrow)
2. **Expand "Databases"**
3. **Right-click on "Databases"** → **"Create"** → **"Database..."**
4. Fill in:
   - **Database**: `love_library`
   - **Owner**: `postgres` (default - keep this)
5. Click **"Save"**

You should now see `love_library` in your databases list!

---

## Step 3: Update Your .env File

Open `backend\.env` and update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/love_library?schema=public"
```

**Replace `YOUR_PASSWORD`** with your actual PostgreSQL password!

---

## Step 4: Test Everything

Run these commands:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
```

If you see:
- ✅ Prisma Client generated
- ✅ Database migrations applied
- ✅ Tables created

**You're all set!** 🎉

---

## Troubleshooting

**Can't connect?**
- Make sure PostgreSQL service is running (check Windows Services)
- Verify password is correct
- Try port 5432

**Forgot password?**
- You may need to reset it or reinstall PostgreSQL
- Or check if you saved it somewhere during installation










