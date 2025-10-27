# D-ID Real-Time API Integration Guide

## Overview

This implementation adds D-ID Real-Time API support to create live video chat interview experiences with AI avatars. The system automatically falls back to TalkAvatar when D-ID is unavailable.

## Features

- **D-ID Real-Time API**: Live video streaming for real-time avatar interactions
- **Automatic Fallback**: Seamlessly switches to TalkAvatar when D-ID fails
- **Professional Responses**: AI-generated natural responses optimized for TTS
- **JSON Format**: Returns responses in the required format: `{text: string, avatar: 'did' | 'talkavatar'}`
- **Service Status**: Visual indicators showing which avatar service is active

## Setup Instructions

### 1. Environment Variables

Add these environment variables to your `.env` file:

```env
# D-ID Real-Time API Configuration
VITE_DID_API_URL=https://api.d-id.com
VITE_DID_API_KEY=your_did_api_key_here

# Existing TalkAvatar Configuration (fallback)
VITE_AVATARTALK_API_URL=https://avatartalk.ai/api/inference
VITE_AVATARTALK_API_KEY=your_avatartalk_api_key_here
```

### 2. D-ID API Key Setup

1. Sign up at [D-ID](https://www.d-id.com/)
2. Get your API key from the dashboard
3. Add it to your environment variables
4. Test the connection using the test component

### 3. Usage

#### Basic Usage

```typescript
import { avatarResponseHandler } from '../services/avatarResponseHandler';

// Process a question and get avatar response
const response = await avatarResponseHandler.processQuestion("What are your greatest strengths?");

console.log(response);
// Output: { text: "I have solid knowledge in that technical area...", avatar: "did" }
```

#### In Interview Components

The `DesktopInterviewInterface` now automatically:
- Tries D-ID Real-Time API first
- Falls back to TalkAvatar if D-ID fails
- Shows service status in the UI
- Handles cleanup of D-ID sessions

#### Real-Time Streaming

```typescript
import { didRealTimeService } from '../services/didRealTimeService';

// Generate response with D-ID
const didResponse = await didRealTimeService.generateInterviewResponse(question);

if (didResponse.success && didResponse.session_id) {
  // Start streaming
  const stream = await didRealTimeService.streamVideo(didResponse.session_id);
  // Play the stream...
}
```

## Components

### 1. `didRealTimeService.ts`
- Handles D-ID Real-Time API communication
- Manages streaming sessions
- Provides fallback mechanisms

### 2. `avatarResponseHandler.ts`
- Processes questions and generates professional responses
- Returns responses in the required JSON format
- Manages service selection (D-ID vs TalkAvatar)

### 3. `RealTimeInterviewInterface.tsx`
- New component for live video chat interviews
- Full-screen interface optimized for real-time interaction
- Integrated audio recording and processing

### 4. `DesktopInterviewInterface.tsx` (Updated)
- Enhanced with D-ID Real-Time API support
- Automatic fallback to TalkAvatar
- Visual service status indicators

### 5. `DIDRealTimeTest.tsx`
- Test component to verify D-ID integration
- Service status checking
- Response format validation

## API Response Format

All avatar responses follow this format:

```json
{
  "text": "The answer that the avatar will speak",
  "avatar": "did"
}
```

Where:
- `text`: Professional, concise response optimized for TTS
- `avatar`: Either "did" for D-ID Real-Time or "talkavatar" for fallback

## Testing

### 1. Test Component
Use the `DIDRealTimeTest` component to:
- Check service availability
- Test D-ID connection
- Verify response format
- Test fallback behavior

### 2. Service Status
The system automatically checks:
- D-ID API connectivity
- TalkAvatar service availability
- Displays status in the UI

## Error Handling

The system handles various error scenarios:

1. **D-ID API Unavailable**: Automatically falls back to TalkAvatar
2. **Network Issues**: Retries with shorter text
3. **Service Errors**: Shows user-friendly error messages
4. **Session Cleanup**: Properly closes D-ID sessions

## Performance Considerations

- **Caching**: TalkAvatar responses are cached for faster loading
- **Streaming**: D-ID streams video data for real-time experience
- **Fallback**: Quick fallback to TalkAvatar ensures reliability
- **Cleanup**: Proper resource cleanup prevents memory leaks

## Browser Compatibility

- **D-ID Real-Time**: Requires modern browsers with WebRTC support
- **TalkAvatar**: Works in all modern browsers
- **Fallback**: Ensures compatibility across all browsers

## Troubleshooting

### Common Issues

1. **D-ID Connection Failed**
   - Check API key configuration
   - Verify network connectivity
   - Check D-ID service status

2. **Fallback Not Working**
   - Verify TalkAvatar API key
   - Check service configuration
   - Review error logs

3. **Video Not Playing**
   - Check browser WebRTC support
   - Verify video codec support
   - Check network bandwidth

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

This will show detailed logs in the browser console.

## Future Enhancements

- **Multiple Avatars**: Support for different D-ID avatars
- **Voice Selection**: Custom voice options
- **Emotion Control**: Dynamic emotion based on question type
- **Analytics**: Track service usage and performance
- **Caching**: Cache D-ID responses for better performance

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify API key configuration
3. Test with the `DIDRealTimeTest` component
4. Review the service status indicators

The system is designed to be robust and provide a seamless experience even when services are unavailable.
