# Love Library - Shared Diary & Photo Library App

A multi-platform application (iOS, Android, Web) that allows users to create shared libraries where they can upload photos with descriptions and send messages.

## Features

- 🔐 User authentication
- 📚 Create or join libraries (shared rooms)
- 📸 Upload photos with descriptions
- 💬 Real-time messaging within libraries
- 📱 Cross-platform (iOS, Android, Web)

## Tech Stack

### Frontend
- **Mobile**: React Native with Expo
- **Web**: React with TypeScript
- **UI Libraries**: React Native Paper (mobile), Material-UI (web)

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io
- **File Storage**: Cloudinary
- **Authentication**: JWT

## Project Structure

```
Love_Library/
├── backend/          # Express API server
├── mobile/           # React Native/Expo app
├── web/              # React web app
└── shared/           # Shared types and utilities
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Quick Start (Start Both Servers)

**Option 1: Using the startup script (Easiest)**
```bash
# Windows PowerShell
.\start.ps1

# Windows Command Prompt
start.bat
```

**Option 2: Using npm (if you have concurrently installed)**
```bash
npm install  # Install concurrently
npm start    # Starts both backend and web app
```

**Option 3: Manual start**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Web App
cd web
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npx prisma migrate dev
npm run dev
```

### Mobile Setup
```bash
cd mobile
npm install
npm start
```

### Web Setup
```bash
cd web
npm install
npm start
```

## Environment Variables

See `SETUP.md` for detailed setup instructions and environment variable configuration.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Libraries
- `POST /api/libraries` - Create a new library
- `POST /api/libraries/join` - Join a library by code
- `GET /api/libraries/my-libraries` - Get user's libraries
- `GET /api/libraries/:id` - Get library details

### Photos
- `POST /api/photos` - Upload a photo (multipart/form-data)
- `GET /api/photos/library/:libraryId` - Get photos for a library
- `DELETE /api/photos/:id` - Delete a photo

### Messages
- `GET /api/messages/library/:libraryId` - Get messages for a library
- Real-time messages via Socket.io

## Architecture

### Database Schema
- **User**: Stores user accounts (email, username, password)
- **Library**: Shared libraries/rooms with unique join codes
- **LibraryMember**: Many-to-many relationship between users and libraries
- **Photo**: Photos uploaded to libraries with descriptions
- **Message**: Messages sent within libraries

### Real-time Communication
Socket.io is used for real-time messaging. When a user sends a message:
1. Client emits `send-message` event
2. Server validates and saves to database
3. Server broadcasts `new-message` to all users in the library room

### Image Upload Flow
1. Client uploads image as multipart/form-data
2. Backend receives file buffer
3. File is uploaded to Cloudinary
4. Cloudinary URL is stored in database
5. URL is returned to client for display

## Development Notes

- The mobile app uses Expo for cross-platform development
- For local development, update API URLs to use your computer's IP address (not localhost) when testing on physical devices
- All passwords are hashed using bcrypt before storage
- JWT tokens are used for authentication and expire after 7 days (configurable)

## Next Steps

- [ ] Add photo editing capabilities
- [ ] Implement push notifications
- [ ] Add library settings and permissions
- [ ] Implement photo likes/reactions
- [ ] Add search functionality
- [ ] Implement library deletion
- [ ] Add user profiles and avatars

