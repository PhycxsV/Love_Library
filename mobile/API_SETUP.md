# Mobile API Setup for APK Testing

## Quick Setup

1. **Start your backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Get your computer's IP address:**
   ```bash
   cd backend
   npm run get-ip
   ```
   This will show your local network IP (e.g., `192.168.1.100`)

3. **Update the API URL in `mobile/src/config/api.ts`:**
   
   Change this line:
   ```typescript
   const API_URL = __DEV__ 
     ? 'http://localhost:5000/api' 
     : 'https://your-production-api.com/api';
   ```
   
   To use your local IP:
   ```typescript
   const API_URL = __DEV__ 
     ? 'http://192.168.1.100:5000/api'  // Replace with YOUR IP from step 2
     : 'https://your-production-api.com/api';
   ```

4. **Make sure your phone is on the same WiFi network as your computer**

5. **Build and test your APK**

## Alternative: Use ngrok for External Access

If you want to access from anywhere (not just same WiFi):

1. **Install ngrok:**
   - Download from https://ngrok.com/download
   - Or use: `npm install -g ngrok`

2. **Start your backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 5000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Update API URL in `mobile/src/config/api.ts`:**
   ```typescript
   const API_URL = __DEV__ 
     ? 'https://abc123.ngrok.io/api'  // Your ngrok URL
     : 'https://your-production-api.com/api';
   ```

## Testing

- **Same WiFi**: Use your local IP (faster, no internet needed)
- **Different network/Internet**: Use ngrok (slower, requires internet)

## Troubleshooting

- **Can't connect?** Make sure:
  - Backend is running (`npm run dev` in backend folder)
  - Phone and computer are on same WiFi (for local IP)
  - Firewall allows connections on port 5000
  - You're using the correct IP address

- **Find your IP manually:**
  - Windows: Open Command Prompt, type `ipconfig`, look for "IPv4 Address"
  - Mac/Linux: Open Terminal, type `ifconfig` or `ip addr`, look for inet address

