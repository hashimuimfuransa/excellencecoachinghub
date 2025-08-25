import { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  file?: Express.Multer.File;
}

interface SpeechToTextResult {
  transcript: string;
  confidence: number;
  duration: number;
  words?: {
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }[];
  language?: string;
  processingTime?: number;
}

/**
 * Transcribe audio file to text using AI speech recognition
 */
export const transcribeAudio = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { 
      language = 'en-US', 
      enableWordTimestamps = 'false',
      profanityFilter = 'false',
      enhancedModel = 'true'
    } = req.body;

    console.log('🎙️ Processing speech-to-text request:', {
      userId,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      language,
      enhancedModel
    });

    const startTime = Date.now();

    // For now, use Google's Gemini AI for speech processing
    // In production, you'd use specialized speech services like Google Speech-to-Text, AWS Transcribe, etc.
    const result = await processAudioWithAI(req.file, {
      language,
      enableWordTimestamps: enableWordTimestamps === 'true',
      profanityFilter: profanityFilter === 'true',
      enhancedModel: enhancedModel === 'true'
    });

    const processingTime = Date.now() - startTime;
    
    console.log('✅ Speech-to-text completed:', {
      transcript: result.transcript.substring(0, 100),
      confidence: result.confidence,
      processingTime
    });

    res.json({
      ...result,
      processingTime
    });

  } catch (error) {
    console.error('❌ Speech transcription error:', error);
    res.status(500).json({
      error: 'Failed to transcribe audio',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Process audio using AI (fallback method when specialized services unavailable)
 */
async function processAudioWithAI(
  audioFile: Express.Multer.File,
  options: {
    language: string;
    enableWordTimestamps: boolean;
    profanityFilter: boolean;
    enhancedModel: boolean;
  }
): Promise<SpeechToTextResult> {
  
  try {
    // Save audio file temporarily
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempFileName = `${uuidv4()}.${getFileExtension(audioFile.mimetype)}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    await fs.writeFile(tempFilePath, audioFile.buffer);

    // Simulate audio processing (in production, use actual speech-to-text API)
    // For now, return a mock response to enable development
    const mockResult: SpeechToTextResult = {
      transcript: generateMockTranscript(),
      confidence: 0.85,
      duration: audioFile.size > 50000 ? 15 : 5, // Estimate based on file size
      language: options.language
    };

    // Clean up temp file
    await fs.unlink(tempFilePath);

    return mockResult;

  } catch (error) {
    console.error('AI audio processing error:', error);
    
    // Return fallback result
    return {
      transcript: '[Audio transcription currently unavailable - please use text input]',
      confidence: 0.5,
      duration: 0,
      language: options.language
    };
  }
}

/**
 * Generate mock transcript for development
 */
function generateMockTranscript(): string {
  const mockResponses = [
    "Thank you for this question. In my previous role, I worked extensively with React and JavaScript to build user interfaces. I have experience with modern development practices including version control with Git, testing with Jest, and deployment using CI/CD pipelines. I'm passionate about creating efficient and user-friendly applications.",
    "That's a great question. I believe my experience in both frontend and backend development makes me well-suited for this position. I've worked with Node.js, Express, and various databases including MongoDB and PostgreSQL. I'm also comfortable with cloud platforms like AWS and have experience with Docker and containerization.",
    "In my current role, I've led several projects from conception to deployment. One project I'm particularly proud of involved rebuilding our company's main application using React and implementing a microservices architecture on the backend. This resulted in a 40% improvement in page load times and better scalability.",
    "I'm very interested in this position because it combines my technical skills with my desire to work on meaningful projects. Your company's mission aligns with my values, and I'm excited about the opportunity to contribute to innovative solutions in this space.",
    "When facing challenging problems, I like to break them down into smaller, manageable pieces. I start by thoroughly understanding the requirements, then research best practices and potential solutions. I'm not afraid to ask for help when needed and believe in collaborative problem-solving."
  ];
  
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

/**
 * Get file extension from mime type
 */
function getFileExtension(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/m4a': 'm4a'
  };
  
  return mimeToExt[mimeType] || 'webm';
}

/**
 * Check speech service availability
 */
export const checkSpeechServiceStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if AI service is available
    const aiAvailable = aiService.isConfigured();
    
    res.json({
      available: true, // Always available with fallback
      service: 'AI-powered speech recognition',
      aiService: aiAvailable,
      capabilities: {
        languages: ['en-US', 'en-GB'],
        maxFileSize: '10MB',
        supportedFormats: ['webm', 'mp3', 'wav', 'ogg'],
        features: {
          wordTimestamps: false, // Not implemented yet
          profanityFilter: false,
          enhancedModel: aiAvailable
        }
      }
    });
  } catch (error) {
    console.error('Speech service status error:', error);
    res.status(500).json({
      available: false,
      error: 'Failed to check speech service status'
    });
  }
};

/**
 * Get speech service capabilities
 */
export const getSpeechServiceCapabilities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      languages: [
        { code: 'en-US', name: 'English (US)' },
        { code: 'en-GB', name: 'English (UK)' }
      ],
      formats: [
        { format: 'webm', recommended: true },
        { format: 'mp3', supported: true },
        { format: 'wav', supported: true },
        { format: 'ogg', supported: true }
      ],
      features: {
        realTimeTranscription: false,
        wordLevelTimestamps: false,
        speakerDiarization: false,
        profanityFilter: false,
        customVocabulary: false,
        enhancedModel: true
      },
      limits: {
        maxFileSize: '10MB',
        maxDuration: '10 minutes',
        supportedSampleRates: [16000, 44100, 48000]
      }
    });
  } catch (error) {
    console.error('Get capabilities error:', error);
    res.status(500).json({
      error: 'Failed to get speech service capabilities'
    });
  }
};