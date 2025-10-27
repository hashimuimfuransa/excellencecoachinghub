# Google Authentication Setup

This document explains how to set up Google authentication for the Excellence Coaching Hub homepage.

## Current Implementation

The current implementation includes a **demo/development version** of Google authentication that works without requiring actual Google OAuth setup. This is perfect for development and testing.

### Features

- ✅ Google Sign-In button on Login page
- ✅ Google Sign-Up button on Register page  
- ✅ Demo authentication flow with confirmation dialog
- ✅ Automatic user creation and login
- ✅ Token storage and session management
- ✅ Redirect to dashboard after successful authentication

### How It Works (Development Mode)

1. User clicks "Continue with Google" button
2. A confirmation dialog appears explaining this is a demo
3. User clicks OK to proceed or Cancel to abort
4. System creates a demo user account with Google-like data
5. User is automatically logged in and redirected to dashboard

### Demo User Data

When using the demo authentication, the following user data is created:

```javascript
{
  _id: 'demo_google_user_[timestamp]',
  firstName: 'John',
  lastName: 'Doe', 
  email: 'john.doe@gmail.com',
  role: 'student',
  isEmailVerified: true,
  profilePicture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
  createdAt: '[current_date]'
}
```

## Production Setup (When Ready)

To enable real Google authentication in production, follow these steps:

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API and Google Identity Services
4. Go to "Credentials" section
5. Create OAuth 2.0 Client ID
6. Add your domain to authorized origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
7. Add redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback`

### 2. Environment Configuration

Update your `.env` file with the real Google Client ID:

```env
VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

### 3. Backend Integration

The frontend sends authentication data to `/auth/google` endpoint. Your backend should:

1. Verify the Google token/credential
2. Extract user information
3. Create or update user in your database
4. Return JWT token for your application

### 4. Code Updates for Production

To enable real Google authentication, update `googleAuthSimple.ts`:

1. Remove the demo confirmation dialog
2. Implement actual Google Identity Services integration
3. Handle real OAuth flow with popups or redirects
4. Send real credentials to backend

## Environment Variables

```env
# Required for Google Authentication
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# API Configuration  
VITE_API_URL=http://localhost:5000/api
```

## File Structure

```
src/
├── services/
│   ├── socialAuthService.ts      # Main social auth service
│   ├── googleAuthSimple.ts       # Simple Google auth implementation
│   └── authService.ts            # General auth service
├── contexts/
│   └── AuthContext.tsx           # Auth context with Google methods
└── pages/
    ├── LoginPage.tsx             # Login page with Google button
    ├── RegisterPage.tsx          # Register page with Google button
    └── PostLoginPage.tsx         # Dashboard after login
```

## Testing

1. Start the development server: `npm run dev`
2. Navigate to login or register page
3. Click "Continue with Google" button
4. Confirm the demo dialog
5. Verify successful login and redirect to dashboard

## Security Notes

- The current demo implementation is for development only
- Never use client-side JWT parsing in production
- Always verify tokens on the backend
- Use HTTPS in production
- Implement proper CORS headers
- Store sensitive data securely

## Troubleshooting

### Common Issues

1. **"Google Client ID not configured"**
   - Check your `.env` file has `VITE_GOOGLE_CLIENT_ID`
   - Restart the development server after adding env vars

2. **"Authentication cancelled by user"**
   - User clicked Cancel in the demo dialog
   - This is expected behavior

3. **CORS errors (in production)**
   - Add your domain to Google Cloud Console authorized origins
   - Ensure backend sends proper CORS headers

### Support

For issues with Google authentication setup, check:
- Google Cloud Console configuration
- Environment variables
- Network/firewall settings
- Browser popup blockers