# Facebook Login Setup - Next Steps

## You've completed the first part correctly!

✅ **What you've done:**
- Created a Facebook app
- Selected "Authenticate and request data from users with Facebook Login"
- This automatically configured Facebook Login for your app

## Next Steps to Complete Setup:

### 1. Configure Facebook Login Settings
After selecting your use case, you should now see Facebook Login in your app dashboard:

1. In your Facebook app dashboard, look for **"Facebook Login"** in the left sidebar
2. Click on **"Facebook Login"** → **"Settings"**
3. Add your Valid OAuth Redirect URIs:
   ```
   http://localhost:3000/
   http://192.168.1.35:3000/
   ```

### 2. Get Your App ID
1. In your Facebook app dashboard, go to **"Settings"** → **"Basic"**
2. Copy your **App ID**
3. Update your `.env` file:
   ```
   REACT_APP_FACEBOOK_APP_ID=your_actual_app_id_here
   ```

### 3. Configure App Domain (Optional but Recommended)
1. In **"Settings"** → **"Basic"**
2. Add your domains to **"App Domains"**:
   ```
   localhost
   192.168.1.35
   ```

### 4. Make Your App Live (For Production)
When you're ready for production:
1. Go to **"App Review"** → **"Permissions and Features"**
2. Request review for **"public_profile"** and **"email"** permissions
3. Switch your app from **"Development"** to **"Live"** mode

## Current Status Check:
- ✅ Google Login: Configured and ready
- ⏳ Facebook Login: Needs App ID in `.env` file

## Test Your Setup:
1. Update the `REACT_APP_FACEBOOK_APP_ID` in your `.env` file
2. Restart your React development server: `npm start`
3. Go to `http://192.168.1.35:3000/login`
4. Test both Google and Facebook login buttons

## Troubleshooting:
- If Facebook login doesn't work, check the browser console for errors
- Make sure your redirect URIs match exactly (including trailing slashes)
- Ensure your app is in the correct mode (Development for testing)
