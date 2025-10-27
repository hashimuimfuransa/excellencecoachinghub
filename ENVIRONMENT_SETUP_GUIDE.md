# Environment Configuration for D-ID Real-Time Interview System

## Required Environment Variables

### Frontend (.env)
```env
# D-ID Real-Time API Configuration
VITE_DID_API_URL=https://api.d-id.com
VITE_DID_API_KEY=your_did_api_key_here

# Existing TalkAvatar Configuration (fallback)
VITE_AVATARTALK_API_URL=https://avatartalk.ai/api/inference
VITE_AVATARTALK_API_KEY=your_avatartalk_api_key_here

# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env)
```env
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

## Setup Instructions

1. **Get D-ID API Key**
   - Sign up at [D-ID](https://www.d-id.com/)
   - Get your API key from the dashboard
   - Add it to your environment variables

2. **Install Dependencies**
   ```bash
   # Frontend
   cd job-portal
   npm install

   # Backend
   cd backend
   npm install
   ```

3. **Create Upload Directory**
   ```bash
   mkdir -p backend/uploads/recordings
   ```

4. **Start Development Servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd job-portal
   npm run dev
   ```

## Testing the System

1. **Test D-ID Connection**
   - Use the `DIDRealTimeTest` component
   - Check service status indicators
   - Verify fallback to TalkAvatar

2. **Test Recording**
   - Start an interview session
   - Click "Record Session" button
   - Verify recording controls work
   - Check video history after completion

3. **Test Video History**
   - Access interview history
   - Play recorded videos
   - Test download and delete functionality

## Troubleshooting

### Common Issues

1. **D-ID API Key Not Working**
   - Verify API key is correct
   - Check API key permissions
   - Ensure sufficient credits

2. **Recording Not Working**
   - Check browser permissions for screen/microphone
   - Verify MediaRecorder API support
   - Check file size limits

3. **Video Not Playing**
   - Check video format support
   - Verify file upload completed
   - Check network connectivity

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Limited support (may need fallbacks)
- **Mobile**: Limited support for screen recording

## Production Deployment

1. **Environment Variables**
   - Set production API keys
   - Configure production database
   - Set up file storage (AWS S3, etc.)

2. **File Storage**
   - Use cloud storage for video files
   - Implement CDN for video streaming
   - Set up backup systems

3. **Security**
   - Enable HTTPS
   - Set up proper CORS
   - Implement rate limiting
   - Add authentication middleware

## Performance Optimization

1. **Video Compression**
   - Implement server-side compression
   - Use appropriate codecs
   - Optimize quality settings

2. **Caching**
   - Cache avatar responses
   - Implement video CDN
   - Use browser caching

3. **Monitoring**
   - Track API usage
   - Monitor file storage
   - Set up error tracking
