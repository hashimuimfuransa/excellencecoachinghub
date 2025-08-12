# Gemini AI Integration Setup Guide

This guide explains how to set up Google's Gemini AI for the AI Assistant feature in the coaching platform.

## Prerequisites

1. Google account
2. Access to Google AI Studio (formerly MakerSuite)

## Setup Steps

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Choose "Create API key in new project" or select an existing project
5. Copy the generated API key

### 2. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and add your Gemini API key:
   ```
   REACT_APP_GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

### 3. Features Enabled with Gemini AI

Once configured, the AI Assistant will have enhanced capabilities:

#### **Smart Conversations**
- Context-aware responses based on current course/lesson
- Natural language understanding
- Personalized learning assistance

#### **Quiz Generation**
- Automatic quiz creation based on course topics
- Multiple difficulty levels (easy, medium, hard)
- Customizable question count
- Formatted questions with explanations

#### **Concept Explanations**
- Detailed explanations of complex topics
- Course-specific context
- Real-world examples
- Step-by-step breakdowns

#### **Study Assistance**
- Personalized study tips
- Learning path recommendations
- Progress-based suggestions

### 4. AI Assistant Features

The floating AI assistant (blue button in bottom-right corner) provides:

- **Quick Actions**: Generate Quiz, Explain Concepts, Study Tips
- **Context Awareness**: Knows what course/lesson student is viewing
- **Conversation History**: Maintains chat context
- **Smart Suggestions**: Contextual follow-up actions
- **Fallback Support**: Works even without API key (mock responses)

### 5. Usage Examples

#### Generate a Quiz
1. Click the AI Assistant button
2. Click "Generate Quiz" or type "Create a quiz on [topic]"
3. AI will generate questions based on current course content

#### Explain Concepts
1. Type "Explain [concept]" in the chat
2. AI provides detailed explanations with examples
3. Includes context from current course if available

#### Get Study Tips
1. Click "Study Tips" or ask "How should I study this?"
2. AI provides personalized recommendations
3. Based on course progress and difficulty level

### 6. API Usage and Limits

- **Free Tier**: 60 requests per minute
- **Rate Limiting**: Built-in error handling and fallbacks
- **Cost**: Free for moderate usage, pay-per-use for high volume
- **Fallback**: Mock responses when API is unavailable

### 7. Privacy and Security

- API key is stored in environment variables (not in code)
- No sensitive student data sent to Gemini
- Only course titles, topics, and questions are shared
- All conversations are processed securely

### 8. Troubleshooting

#### API Key Issues
- Ensure the key is correctly copied (no extra spaces)
- Check that the API key is enabled in Google AI Studio
- Verify the project has Gemini API access

#### Rate Limiting
- If you hit rate limits, the system falls back to mock responses
- Consider upgrading to paid tier for higher limits
- Implement request queuing for high-traffic scenarios

#### Network Issues
- The system gracefully handles network failures
- Falls back to enhanced mock responses
- Retry logic built into the service

### 9. Development vs Production

#### Development
- Use mock responses for testing without API calls
- Set `REACT_APP_GEMINI_API_KEY=""` to disable API calls
- All features work with intelligent fallbacks

#### Production
- Use real API key for full functionality
- Monitor API usage and costs
- Implement proper error logging

### 10. Future Enhancements

Planned improvements:
- Voice input/output
- Image analysis for visual learning materials
- Advanced proctoring integration
- Multi-language support
- Custom model fine-tuning

## Support

For issues with Gemini AI integration:
1. Check the browser console for error messages
2. Verify API key configuration
3. Test with mock responses first
4. Contact support with specific error details

The AI Assistant is designed to enhance the learning experience while maintaining reliability through intelligent fallbacks.
