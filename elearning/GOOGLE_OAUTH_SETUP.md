# Google OAuth Setup Guide

## Current Issue
You're getting a 403 error: "The given origin is not allowed for the given client ID" when trying to use Google OAuth.

## Solution Steps

### 1. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (or create a new one)
3. Navigate to: **APIs & Services > Credentials**

### 2. Configure OAuth 2.0 Client ID
1. Find your OAuth 2.0 Client ID (or create a new one)
2. Click on the client ID to edit it
3. In the **Authorized JavaScript origins** section, add:
   ```
   http://localhost:3000
   http://127.0.0.1:3000
   https://your-production-domain.com
   ```

### 3. Configure Authorized Redirect URIs
Add these redirect URIs:
```
http://localhost:3000
http://127.0.0.1:3000
https://your-production-domain.com
```

### 4. Update Environment Variables
Create a `.env` file in the `elearning` directory:
```env
REACT_APP_GOOGLE_CLIENT_ID=your_actual_client_id_here
```

### 5. Alternative: Use ngrok for Testing
If you can't configure localhost, use ngrok:
1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 3000`
3. Use the ngrok URL in Google Console
4. Update your environment variable

### 6. Test the Configuration
1. Restart your development server
2. Try Google OAuth again
3. Check browser console for any remaining errors

## Current Client ID
The app is currently using: `192720000772-1qkm1i0lmg52b17vaslf0gm56lll3p0m.apps.googleusercontent.com`

## Rate Limiting Protection
The app now includes:
- 5-second cooldown between Google auth attempts
- Retry logic with exponential backoff for 429 errors
- Better error handling for OAuth failures

## Troubleshooting
- **403 Error**: Origin not allowed - configure JavaScript origins in Google Console
- **429 Error**: Too many requests - wait 5 seconds between attempts
- **CORS Error**: Use ngrok or configure proper origins
- **Popup Blocked**: Allow popups for localhost:3000
