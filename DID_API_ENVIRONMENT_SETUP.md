# Environment Configuration for D-ID Real-Time API

## Frontend Environment Variables (.env)

Add these variables to your `job-portal/.env` file:

```env
# D-ID Real-Time API Configuration
VITE_DID_API_URL=https://api.d-id.com
VITE_DID_API_KEY=your_did_api_key_here

# TalkAvatar Configuration (fallback only)
VITE_AVATARTALK_API_URL=https://avatartalk.ai/api/inference
VITE_AVATARTALK_API_KEY=your_avatartalk_api_key_here

# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

## Backend Environment Variables (.env)

Add these variables to your `backend/.env` file:

```env
# D-ID Real-Time API Configuration
DID_API_URL=https://api.d-id.com
DID_API_KEY=your_did_api_key_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/excellencecoachinghub

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# File Upload Configuration
MAX_FILE_SIZE=500MB
UPLOAD_DIR=./uploads/recordings

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## How to Get D-ID API Key

1. **Sign up at D-ID**: Go to [https://www.d-id.com/](https://www.d-id.com/)
2. **Create Account**: Sign up for a D-ID account
3. **Get API Key**: Navigate to your dashboard and copy your API key
4. **Add Credits**: Make sure you have sufficient credits for API usage

## D-ID API Key Format

Your D-ID API key should look like this:
```
sk-1234567890abcdef1234567890abcdef12345678
```

## Priority Order

The system will use APIs in this order:
1. **D-ID Real-Time API** (Primary - for live video chat)
2. **TalkAvatar** (Fallback - for pre-recorded videos)

## Testing Your Setup

1. **Check Environment Variables**:
   ```bash
   # Frontend
   cd job-portal
   npm run dev
   
   # Backend  
   cd backend
   npm run dev
   ```

2. **Test D-ID Connection**:
   - Use the `DIDRealTimeTest` component
   - Check browser console for connection status
   - Verify "D-ID Real-Time" appears in avatar service indicators

3. **Verify in Desktop Interview**:
   - Start an interview session
   - Look for "D-ID Real-Time" chip in the avatar area
   - Should see live video streaming instead of pre-recorded videos

## Troubleshooting

### Common Issues:

1. **"D-ID API key not configured"**
   - Check your `.env` file has `VITE_DID_API_KEY`
   - Restart your development server after adding the key
   - Verify the key is correct (starts with `sk-`)

2. **"D-ID connection failed"**
   - Check your internet connection
   - Verify you have sufficient D-ID credits
   - Check D-ID service status

3. **Falling back to TalkAvatar**
   - This is normal behavior when D-ID is unavailable
   - Check console logs for specific error messages
   - Verify API key permissions

## Production Setup

For production deployment:

1. **Set Environment Variables**:
   ```bash
   # Set production D-ID API key
   export VITE_DID_API_KEY=your_production_did_key
   export DID_API_KEY=your_production_did_key
   ```

2. **Update CORS Origins**:
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Monitor Usage**:
   - Track D-ID API usage in your dashboard
   - Set up alerts for quota limits
   - Monitor fallback frequency

## Cost Considerations

- **D-ID Real-Time**: Pay-per-use, more expensive but real-time
- **TalkAvatar**: Fixed cost, pre-recorded videos
- **Fallback Strategy**: Ensures reliability while optimizing costs
