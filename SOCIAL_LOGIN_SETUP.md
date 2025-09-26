# Google and Facebook OAuth Setup Instructions

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials and create an OAuth 2.0 client ID
5. Add your domain to authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `http://192.168.1.35:3000` (for LAN testing)
   - Your production domain
6. Copy the Client ID and update the `.env` file:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
   ```

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Select "Authenticate and request data from users with Facebook Login" as your use case
4. Add Facebook Login product to your app
5. In Facebook Login settings, add your domain to valid OAuth redirect URIs:
   - `http://localhost:3000` (for development)
   - `http://192.168.1.35:3000` (for LAN testing)
   - Your production domain
6. Copy the App ID and update the `.env` file:
   ```
   REACT_APP_FACEBOOK_APP_ID=your_actual_facebook_app_id_here
   ```

**Note:** After selecting "Authenticate and request data from users with Facebook Login", you won't see an "add a product" option - this is correct! The login functionality is automatically configured when you select this use case.

## Important Notes

- The social login currently creates/logs in users automatically
- Social login users are marked as email verified by default
- Avatar from social platforms is saved to user profile
- For production, you should add proper token verification on the backend
- Make sure to restart the React development server after updating `.env` file

## Testing

1. Update the `.env` file with your actual OAuth credentials
2. Restart the React development server: `npm start`
3. Navigate to `/login` or `/register`
4. Test the Google and Facebook login buttons
