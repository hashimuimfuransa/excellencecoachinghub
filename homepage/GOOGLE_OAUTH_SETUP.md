# Google OAuth Setup Guide

This guide will help you set up real Google OAuth authentication for development and production.

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Excellence Coaching Hub"
4. Click "Create"

### 1.2 Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Google+ API** (for user profile info)
   - **Google Identity Services** (for authentication)

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: Excellence Coaching Hub
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Add scopes:
   - `openid`
   - `email` 
   - `profile`
5. Add test users (your email addresses for testing)
6. Save and continue

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Set name: "Excellence Coaching Hub Web Client"
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:5173
   https://yourdomain.com
   ```
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000
   http://localhost:5173
   https://yourdomain.com
   ```
7. Click "Create"
8. **Copy the Client ID** - you'll need this for your .env file

## Step 2: Environment Configuration

Update your `.env` file with the real Google Client ID:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=1047746653439-m4of7hq0g0ftiret6arulu5i07dcv17b.apps.googleusercontent.com

# API Configuration
VITE_API_URL=http://localhost:5000/api
```

## Step 3: Test the Implementation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page
3. Click "Continue with Google"
4. You should see the Google OAuth popup/dialog
5. Sign in with your Google account
6. Grant permissions when prompted
7. You should be redirected back and logged in

## Step 4: Troubleshooting Common Issues

### Issue 1: "This app isn't verified"
**Solution**: This is normal during development. Click "Advanced" → "Go to Excellence Coaching Hub (unsafe)" to continue.

### Issue 2: "Error 400: redirect_uri_mismatch"
**Solution**: 
- Check that your redirect URIs in Google Console match exactly
- Make sure you're using the correct port (3000 or 5173)
- No trailing slashes in URLs

### Issue 3: "Error 403: access_denied"
**Solution**:
- Add your email as a test user in OAuth consent screen
- Make sure the app is in "Testing" mode, not "Production"

### Issue 4: CORS errors
**Solution**:
- Add your domain to "Authorized JavaScript origins"
- Make sure you're using HTTPS in production

### Issue 5: "popup_blocked_by_browser"
**Solution**:
- Allow popups for your site
- Try using the One Tap flow instead

## Step 5: Production Deployment

### 5.1 Update OAuth Settings
1. Add your production domain to authorized origins
2. Update redirect URIs with production URLs
3. Set OAuth consent screen to "Production" when ready

### 5.2 Environment Variables
```env
# Production
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_API_URL=https://api.yourdomain.com
```

### 5.3 Security Considerations
- Never expose client secrets in frontend code
- Always verify tokens on your backend
- Use HTTPS in production
- Implement proper CORS headers
- Store tokens securely

## Step 6: Backend Integration (Optional)

If you want to verify tokens on your backend:

```javascript
// Example Node.js backend verification
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload;
}
```

## Current Implementation Features

✅ **Real Google OAuth Integration**
- Uses Google Identity Services
- Supports both One Tap and popup flows
- Handles real user data from Google
- Proper error handling and fallbacks

✅ **Development Ready**
- Works with localhost
- Detailed console logging for debugging
- Graceful error handling

✅ **Production Ready**
- Secure token handling
- CORS-compliant implementation
- Scalable architecture

## Testing Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] Client ID created and added to .env
- [ ] Test user added (your email)
- [ ] Development server running
- [ ] Google sign-in button appears
- [ ] Clicking button opens Google popup
- [ ] Can sign in with Google account
- [ ] Redirected to dashboard after login
- [ ] User data appears correctly
- [ ] Can log out and log back in

## Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify your Google Cloud Console configuration
3. Ensure your .env file has the correct Client ID
4. Make sure popups are allowed in your browser
5. Try incognito/private browsing mode

For additional help, refer to:
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)