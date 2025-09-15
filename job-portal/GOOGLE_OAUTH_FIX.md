# Google OAuth Configuration Fix

## Issue
The current Google Client ID `1047746653439-m4of7hq0g0ftiret6arulu5i07dcv17b.apps.googleusercontent.com` is returning:
- 403 Forbidden error
- "The given client ID is not found" message

## Solution
You need to create a new Google OAuth Client ID with proper configuration.

## Steps to Fix

### 1. Go to Google Cloud Console
1. Visit https://console.cloud.google.com/
2. Create a new project or select existing project

### 2. Enable Google Identity Services
1. Go to APIs & Services > Library
2. Search for "Google Identity" or "Google+ API"
3. Enable the Google Identity Services API

### 3. Create OAuth Client ID
1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth Client ID"
3. Select "Web application"
4. Configure as follows:

**Authorized JavaScript origins:**
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (alternative dev port)
- `https://yourdomain.com` (production domain)
- `https://exjobnet.com` (if this is your production domain)

**Authorized redirect URIs:**
- `http://localhost:5173/auth/callback`
- `http://localhost:3000/auth/callback`
- `https://yourdomain.com/auth/callback`
- `https://exjobnet.com/auth/callback`

### 4. Update Environment Variables
Replace the client ID in:
- `job-portal/.env`
- `job-portal/.env.production` (if exists)

```
VITE_GOOGLE_CLIENT_ID=your_new_client_id_here.apps.googleusercontent.com
```

### 5. Test Configuration
1. Restart the development server
2. Try Google authentication
3. Check browser console for any remaining errors

## Security Notes
- Never commit real client IDs to version control
- Use different client IDs for development and production
- Regularly rotate OAuth credentials