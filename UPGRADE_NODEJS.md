# Upgrade Node.js

## Current Issue
You have Node.js **12.22.12**, but this project requires **Node.js 18+**.

## How to Upgrade Node.js on Windows

### Option 1: Download from Official Website (Recommended)
1. Go to https://nodejs.org/
2. Download the **LTS version** (Long Term Support) - currently Node.js 20.x
3. Run the installer
4. Follow the installation wizard
5. **Restart your terminal/command prompt** after installation

### Option 2: Use Node Version Manager (nvm-windows)
If you want to manage multiple Node.js versions:

1. Download nvm-windows: https://github.com/coreybutler/nvm-windows/releases
2. Download the `nvm-setup.exe` installer
3. Run the installer
4. Open a new terminal and run:
   ```bash
   nvm install 20.11.0
   nvm use 20.11.0
   ```

## Verify Installation

After upgrading, verify in a **new terminal**:

```bash
node --version
```

You should see something like: `v20.11.0` or `v18.x.x`

## Then Continue Setup

After upgrading Node.js:

1. **Update your `.env` file** with your database password:
   ```env
   DATABASE_URL="postgresql://postgres:Amiel2022!@localhost:5432/love_library?schema=public"
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Set up database**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

---

**Note**: Make sure to close and reopen your terminal after installing Node.js so it picks up the new version!










