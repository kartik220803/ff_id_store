# Google OAuth Troubleshooting Guide

## Error: "Can't continue with Google.com Something went wrong"

This error typically occurs due to OAuth configuration issues. Follow these steps to fix it:

### 1. Check Your Google Cloud Console Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID and click the edit (pencil) icon

### 2. Update Authorized JavaScript Origins

Add ALL of these origins to your **Authorized JavaScript origins**:

```
http://localhost:3000
http://127.0.0.1:3000
http://192.168.1.35:3000
https://localhost:3000
```

**Important**: 
- Include both `localhost` and `127.0.0.1`
- Include your LAN IP address (192.168.1.35)
- Do NOT include trailing slashes (/)
- Make sure there are no extra spaces

### 3. Update Authorized Redirect URIs

Add these to your **Authorized redirect URIs**:

```
http://localhost:3000/
http://127.0.0.1:3000/
http://192.168.1.35:3000/
https://localhost:3000/
```

**Note**: Redirect URIs DO need trailing slashes (/)

### 4. Common Issues and Solutions

#### Issue: Invalid Client ID
- **Symptom**: Error during initialization
- **Solution**: Double-check your Client ID in `.env` file matches exactly with Google Console

#### Issue: Origin Not Allowed
- **Symptom**: "Can't continue with Google.com" error
- **Solution**: Make sure all possible origins are added (see step 2)

#### Issue: Chrome Extensions Interfering
- **Symptom**: "Failed to fetch" errors or popup issues
- **Solution**: Try in incognito mode or disable extensions temporarily

#### Issue: HTTPS vs HTTP
- **Symptom**: Mixed content errors
- **Solution**: Use consistent protocol (HTTP for development)

### 5. Testing Steps

1. **Clear browser cache and cookies**
2. **Restart your React development server**
3. **Try in incognito mode** to avoid extension interference
4. **Check browser console** for detailed error messages
5. **Test with different URLs**:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - `http://192.168.1.35:3000`

### 6. Verification Checklist

- [ ] Google Client ID is correct in `.env`
- [ ] All origins added to Google Console (no trailing slashes)
- [ ] All redirect URIs added to Google Console (with trailing slashes)
- [ ] Browser cache cleared
- [ ] Development server restarted
- [ ] Tested in incognito mode

### 7. Debug Information

Check your browser console for these logs:
- Current URL and domain
- Google Client ID (should not be 'your_actual_google_client_id_here')
- Google API initialization status
- Any specific error messages

### 8. Alternative Testing

If the issue persists:
1. Create a minimal test page with just Google login
2. Try a different Google account
3. Check if other OAuth providers (Facebook) work
4. Test on a different browser

### 9. Production Notes

For production deployment:
- Add your production domain to authorized origins
- Use HTTPS for production
- Consider using environment-specific OAuth clients
