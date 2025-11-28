# Setup Instructions

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Cloudinary account (for image uploads)
- npm or yarn package manager

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development

DATABASE_URL="postgresql://user:password@localhost:5432/love_library?schema=public"

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

CORS_ORIGIN=http://localhost:3000,http://localhost:19006
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

## Mobile App Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Update the API URL in `src/config/api.ts` if needed (defaults to `http://localhost:5000/api` for development)

4. Start the Expo development server:
```bash
npm start
```

5. Use the Expo Go app on your phone to scan the QR code, or press `i` for iOS simulator, `a` for Android emulator.

**Note:** For mobile to connect to localhost backend, you'll need to:
- Use your computer's local IP address instead of `localhost` in the API config
- Or use a tool like ngrok to expose your local backend

## Web App Setup

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Update the API URL in `src/config/api.ts` if needed (defaults to `http://localhost:5000/api` for development)

4. Start the development server:
```bash
npm run dev
```

The web app will run on `http://localhost:3000`

## Cloudinary Setup

1. Sign up for a free account at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add them to your backend `.env` file

## Database Setup

1. Install PostgreSQL if you haven't already
2. Create a new database:
```sql
CREATE DATABASE love_library;
```
3. Update the `DATABASE_URL` in your backend `.env` file with your PostgreSQL credentials

## Testing the Setup

1. Start the backend server
2. Start either the mobile or web app
3. Create an account
4. Create a library
5. Share the library code with another account
6. Upload photos and send messages!

## Troubleshooting

### Backend won't start
- Check that PostgreSQL is running
- Verify your DATABASE_URL is correct
- Make sure all environment variables are set

### Mobile app can't connect to backend
- Use your computer's local IP address (e.g., `192.168.1.100:5000`) instead of `localhost`
- Check that your phone and computer are on the same network
- Verify CORS settings in backend `.env`

### Image uploads failing
- Verify Cloudinary credentials in `.env`
- Check that the image file size is under 10MB










