# Standalone Psychometric AI Engine

This document explains how to use the standalone psychometric AI engine that's separate from the central AI management system.

## Overview

The standalone psychometric AI engine is designed specifically for generating psychometric tests. It has its own API key management, rate limiting, and fallback mechanisms to ensure reliable test generation even when the central AI system is unavailable.

## Key Components

### 1. Psychometric AI Engine (`psychometricAIEngine.ts`)

This is the core engine that handles communication with the AI service (Google Gemini). It includes:

- Dedicated API key management
- Rate limiting (3 requests per minute, 300 daily)
- Automatic fallback between API keys
- Built-in retry mechanisms
- Queue management for request processing

### 2. Psychometric Test Generator (`psychometricTestGenerator.ts`)

This service builds on the AI engine to generate psychometric tests with:

- Specialized prompt engineering for psychometric assessments
- Question validation and cleanup
- Fallback question generation when AI is unavailable
- Duplicate question detection and prevention

### 3. Standalone Psychometric Controller (`standalonePsychometricController.ts`)

This controller provides API endpoints for:

- Generating psychometric tests using the standalone engine
- Checking system status and availability

### 4. Routes (`standalonePsychometricRoutes.ts`)

Defines the API routes for the standalone psychometric engine.

## Setup

### Environment Variables

To use the standalone psychometric engine, you need to set these environment variables:

```env
# Primary API key for psychometric tests (falls back to GEMINI_API_KEY if not set)
PSYCHOMETRIC_GEMINI_API_KEY=your_gemini_api_key_here

# Fallback API keys (comma-separated, falls back to FALLBACK_API_KEYS if not set)
PSYCHOMETRIC_FALLBACK_API_KEYS=key1,key2,key3
```

If these are not set, the engine will use the standard `GEMINI_API_KEY` and `FALLBACK_API_KEYS` environment variables.

## Usage

### API Endpoints

The standalone psychometric engine is available at: `/api/standalone-psychometric`

#### Generate Test
```
POST /api/standalone-psychometric/generate-test
```

Request body:
```json
{
  "jobId": "job_id_here",
  "levelId": "intermediate", // easy, intermediate, hard
  "categories": ["teamwork", "problem_solving", "communication"]
}
```

#### Check Status (Admin only)
```
GET /api/standalone-psychometric/status
```

### Direct Service Usage

You can also use the services directly in your code:

```typescript
import { psychometricTestGenerator } from '@/services/psychometricTestGenerator';

// Generate a psychometric test
const test = await psychometricTestGenerator.generatePsychometricTest({
  jobTitle: "Software Developer",
  jobDescription: "Develop web applications using modern technologies",
  industry: "Technology",
  experienceLevel: "mid_level",
  skills: ["JavaScript", "React", "Node.js"],
  questionCount: 20,
  testLevel: "intermediate",
  timeLimit: 30,
  userId: "user_id_here",
  jobId: "job_id_here",
  categories: ["problem_solving", "teamwork", "communication"]
});
```

## Fallback Mechanisms

The standalone engine includes robust fallback mechanisms:

1. **API Key Fallback**: Automatically switches to backup API keys when quota is exceeded
2. **Question Fallback**: Generates simple fallback questions when AI generation fails
3. **Model Fallback**: Uses different AI models if the primary one is unavailable

## Rate Limiting

To prevent quota exhaustion, the engine implements:

- 3 requests per minute maximum
- 300 requests per day per API key
- 20-second minimum interval between requests
- Automatic queue management

## Testing

### Test Scripts

Two test scripts are included:

1. `test-standalone-psychometric.js` - Tests the AI engine directly
2. `test-psychometric-generator.js` - Tests the test generator service

Run them with:
```bash
node backend/test-standalone-psychometric.js
node backend/test-psychometric-generator.js
```

### Manual Testing

You can test the endpoints manually:

1. Start the backend server
2. Make a POST request to `/api/standalone-psychometric/generate-test` with appropriate job data
3. Check the response for generated test data

## Benefits

1. **Isolation**: Separate from the central AI system, so issues don't affect other AI features
2. **Dedicated Resources**: Own API keys and quota management
3. **Specialized Prompts**: Optimized specifically for psychometric test generation
4. **Reliability**: Built-in fallbacks ensure tests can always be generated
5. **Performance**: Rate limiting prevents quota exhaustion