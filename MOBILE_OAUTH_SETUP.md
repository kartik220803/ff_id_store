# Mobile Testing with Google OAuth - Setup Guide

## Problem
Google OAuth doesn't allow private IP addresses (192.168.x.x) in authorized JavaScript origins.

## Solution Options

### Option 1: Use localhost (Recommended for Desktop Testing)

1. **Update your Google Cloud Console**:
   - Remove `http://192.168.1.35:3000` from authorized origins
   - Keep only:
     ```
     http://localhost:3000
     http://127.0.0.1:3000
     ```

2. **Update React app**:
   - Already updated your `.env` to use `http://localhost:5000/api`
   - Already updated `package.json` to remove `HOST=0.0.0.0`

3. **Test on desktop**:
   ```bash
   cd /home/kartik/Documents/store/ff_id_store/client
   npm start
   ```
   - Access via: `http://localhost:3000`

### Option 2: Use ngrok for Mobile Testing

1. **Install ngrok**:
   ```bash
   # Download from https://ngrok.com/download
   # Or install via snap:
   sudo snap install ngrok
   ```

2. **Start your React app**:
   ```bash
   cd /home/kartik/Documents/store/ff_id_store/client
   npm start
   ```

3. **In another terminal, start ngrok**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the https URL** (e.g., `https://abc123.ngrok.io`)

5. **Add to Google Cloud Console**:
   - Authorized JavaScript origins: `https://abc123.ngrok.io`
   - Authorized redirect URIs: `https://abc123.ngrok.io/`

6. **Update your `.env`**:
   ```
   REACT_APP_API_BASE_URL=https://your-backend-ngrok-url.ngrok.io/api
   ```

### Option 3: Use a Custom Domain (Advanced)

1. **Edit hosts file** on both desktop and mobile:
   ```
   192.168.1.35  ffstore.local
   ```

2. **Add to Google Console**:
   ```
   http://ffstore.local:3000
   ```

## Current Recommended Steps:

1. **For now, test Google OAuth on desktop only**:
   - Use `http://localhost:3000`
   - Keep your authorized origins as:
     ```
     http://localhost:3000
     http://127.0.0.1:3000
     ```

2. **For mobile testing without social login**:
   - You can still test regular login/registration
   - Social login will only work via localhost on desktop

3. **For full mobile + social login testing**:
   - Use ngrok (Option 2) when you need to test social login on mobile devices

## Testing Commands:

```bash
# Start backend (if not running)
cd /home/kartik/Documents/store/ff_id_store/server
npm start

# Start frontend
cd /home/kartik/Documents/store/ff_id_store/client
npm start

# Access via: http://localhost:3000
# Google OAuth should work on desktop now
```
