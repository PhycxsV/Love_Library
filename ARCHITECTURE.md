# Architecture Overview

## System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │     │    Web      │     │   Backend   │
│  (Expo)     │────▶│  (React)    │────▶│  (Express)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                    ┌─────────────┐
                                    │ PostgreSQL  │
                                    └─────────────┘
                                              │
                                              ▼
                                    ┌─────────────┐
                                    │ Cloudinary  │
                                    └─────────────┘
```

## Data Flow

### Authentication Flow
1. User submits credentials (email/password)
2. Backend validates and hashes password
3. JWT token generated and returned
4. Token stored in AsyncStorage (mobile) or localStorage (web)
5. Token included in all subsequent API requests

### Library Creation Flow
1. User creates library with name/description
2. Backend generates unique 6-character code
3. Library record created in database
4. Creator added as "owner" member
5. Library returned to client with code

### Photo Upload Flow
1. User selects image from device/gallery
2. Image converted to FormData
3. POST request to `/api/photos` with multipart/form-data
4. Backend receives file buffer
5. File uploaded to Cloudinary
6. Cloudinary URL stored in database
7. Photo record returned to client

### Real-time Messaging Flow
1. Client connects to Socket.io server with JWT token
2. Client joins library room: `join-library` event
3. User types message and sends: `send-message` event
4. Server validates user is library member
5. Message saved to database
6. Server broadcasts `new-message` to all room members
7. All connected clients receive message in real-time

## Database Relationships

```
User
  ├── LibraryMember (many-to-many with Library)
  ├── Photo (one-to-many)
  └── Message (one-to-many)

Library
  ├── LibraryMember (many-to-many with User)
  ├── Photo (one-to-many)
  └── Message (one-to-many)
```

## Security Considerations

1. **Password Hashing**: All passwords hashed with bcrypt (10 rounds)
2. **JWT Tokens**: Signed with secret key, expire after 7 days
3. **Authorization**: Middleware checks JWT on protected routes
4. **Library Access**: Users must be members to access library data
5. **File Upload**: Limited to 10MB, images only
6. **CORS**: Configured to allow only specified origins

## Scalability Considerations

- **Database**: PostgreSQL with proper indexing on foreign keys
- **File Storage**: Cloudinary handles CDN and image optimization
- **Real-time**: Socket.io rooms allow efficient message broadcasting
- **Stateless API**: JWT tokens allow horizontal scaling

## Future Enhancements

1. **Caching**: Add Redis for frequently accessed data
2. **Image Optimization**: Automatic thumbnail generation
3. **Notifications**: Push notifications for new messages/photos
4. **Search**: Full-text search for messages and descriptions
5. **Analytics**: Track library activity and usage








