import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';
import {
  transcribeAudio,
  checkSpeechServiceStatus,
  getSpeechServiceCapabilities
} from '../controllers/speechController';

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for audio files
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// All routes require authentication
router.use(auth);

/**
 * POST /api/speech/transcribe
 * Transcribe audio file to text using AI speech recognition
 * Accepts: audio file (webm, mp3, wav, etc.)
 * Returns: { transcript, confidence, duration, words? }
 */
router.post('/transcribe', upload.single('audio'), transcribeAudio);

/**
 * GET /api/speech/status
 * Check if speech-to-text service is available
 * Returns: { available, service, capabilities }
 */
router.get('/status', checkSpeechServiceStatus);

/**
 * GET /api/speech/capabilities
 * Get speech service capabilities and supported formats
 * Returns: { languages, formats, features }
 */
router.get('/capabilities', getSpeechServiceCapabilities);

export default router;