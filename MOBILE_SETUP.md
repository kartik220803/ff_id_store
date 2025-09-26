# 📱 Mobile Development Setup Guide

## Quick Setup for Mobile Testing

### 1. Find Your Local IP Address

Run this command to get your computer's IP address:

```bash
# On Linux/Mac
hostname -I | awk '{print $1}'

# Or use our utility script
node get-ip.js
```

### 2. Update Client Environment Variables

Edit `client/.env` and replace `localhost` with your IP address:

```env
# Replace XXX.XXX.XXX.XXX with your actual IP address
REACT_APP_API_BASE_URL=http://XXX.XXX.XXX.XXX:5000/api
```

Example:
```env
REACT_APP_API_BASE_URL=http://192.168.1.100:5000/api
```

### 3. Start Both Servers

**Terminal 1 - Backend Server:**
```bash
cd server
npm start
```
This will start the backend on `0.0.0.0:5000`

**Terminal 2 - Frontend Server:**
```bash
cd client
npm start
```
This will start the frontend on `0.0.0.0:3000`

### 4. Access from Mobile

Make sure your mobile device is on the same WiFi network, then open:

- **Frontend**: `http://YOUR_IP:3000`
- **Backend API**: `http://YOUR_IP:5000`

### 5. Common Issues & Solutions

**Problem**: Can't access from mobile
**Solution**: 
- Check firewall settings
- Ensure both devices are on same WiFi
- Verify IP address is correct

**Problem**: CORS errors
**Solution**: The server is already configured with CORS enabled

**Problem**: API calls failing
**Solution**: Make sure the `.env` file has the correct IP address

### 6. Quick IP Check Script

```bash
# Run this to see all available URLs
node get-ip.js
```

### 7. Production Notes

For production deployment, make sure to:
- Set proper environment variables
- Configure proper CORS origins
- Use HTTPS in production
- Set up proper firewall rules

## Environment Variables Summary

**Server (.env):**
```env
PORT=5000
HOST=0.0.0.0
```

**Client (.env):**
```env
REACT_APP_API_BASE_URL=http://YOUR_IP:5000/api
```
