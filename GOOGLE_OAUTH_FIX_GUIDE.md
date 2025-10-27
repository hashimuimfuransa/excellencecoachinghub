# 🔧 Google OAuth Fix Guide

## ❌ **Current Error**
```
[GSI_LOGGER]: The given client ID is not found.
Failed to load resource: the server responded with a status of 403
```

## 🎯 **Root Cause**
The Google OAuth client ID is either:
1. **Not configured** in Google Cloud Console
2. **Not authorized** for your domain (localhost)
3. **Invalid or expired** client ID
4. **Missing environment variable** configuration

## ✅ **Solution Steps**

### **Step 1: Create/Update Environment File**

Create a `.env` file in the `elearning` directory:

```bash
# elearning/.env
REACT_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

### **Step 2: Get a Valid Google Client ID**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select or create a project**
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     ```
     http://localhost:3000
     http://127.0.0.1:3000
     https://yourdomain.com (for production)
     ```
   - Add authorized redirect URIs:
     ```
     http://localhost:3000/auth/callback
     https://yourdomain.com/auth/callback
     ```

### **Step 3: Update Environment Variable**

Replace `your_actual_google_client_id_here` with your actual client ID:

```bash
# Example
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

### **Step 4: Restart Development Server**

```bash
cd elearning
npm start
```

## 🔍 **Verification**

After following these steps, you should see in the browser console:

```
✅ Google Identity Services already loaded
🔧 Google Client ID: 123456789-abcdefghijklmnopqrstuvwxyz123456...
```

Instead of the error messages.

## 🚨 **Common Issues & Solutions**

### **Issue 1: Still getting 403 error**
**Solution**: Make sure your domain is added to "Authorized JavaScript origins" in Google Console

### **Issue 2: Client ID not found**
**Solution**: Double-check the client ID format - it should end with `.apps.googleusercontent.com`

### **Issue 3: CORS errors**
**Solution**: Add your exact domain (including port) to authorized origins:
- `http://localhost:3000` (not just `localhost`)
- `http://127.0.0.1:3000`

### **Issue 4: Environment variable not loading**
**Solution**: 
1. Make sure the `.env` file is in the `elearning` directory (not root)
2. Restart the development server after creating `.env`
3. Check that the variable name starts with `REACT_APP_`

## 🛠️ **Alternative: Use ngrok for Testing**

If you can't configure localhost, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start your app
cd elearning
npm start

# In another terminal, create tunnel
ngrok http 3000

# Use the ngrok URL in Google Console authorized origins
# Example: https://abc123.ngrok.io
```

## 📋 **Quick Checklist**

- [ ] Created `.env` file in `elearning` directory
- [ ] Added `REACT_APP_GOOGLE_CLIENT_ID` with valid client ID
- [ ] Configured Google Cloud Console OAuth credentials
- [ ] Added localhost to authorized JavaScript origins
- [ ] Restarted development server
- [ ] Verified no console errors

## 🎉 **Expected Result**

After fixing, Google Sign-In should work without errors and you should see the Google sign-in button render properly.

## 📞 **Need Help?**

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify your Google Cloud Console configuration
3. Make sure your client ID is active and not expired
4. Try using a different browser or incognito mode
