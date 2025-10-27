/**
 * Recording Routes
 * Handles interview recording uploads and management
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadDir = path.join(__dirname, '../../uploads/recordings');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// In-memory storage for recordings metadata (in production, use a database)
const recordings: any[] = [];

/**
 * Upload interview recording
 */
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const recordingData = JSON.parse(req.body.recording || '{}');
    
    const recording = {
      id: recordingData.id || uuidv4(),
      sessionId: recordingData.sessionId,
      userId: recordingData.userId,
      jobTitle: recordingData.jobTitle,
      startTime: recordingData.startTime,
      endTime: recordingData.endTime,
      duration: recordingData.duration,
      videoUrl: `/api/recordings/video/${req.file.filename}`,
      thumbnailUrl: recordingData.thumbnailUrl,
      avatarService: recordingData.avatarService,
      quality: recordingData.quality,
      status: 'completed',
      questions: recordingData.questions || [],
      userResponses: recordingData.userResponses || [],
      createdAt: new Date(),
      filename: req.file.filename
    };

    // Store recording metadata
    recordings.push(recording);

    console.log('📁 Recording uploaded:', recording.id);

    res.json({
      success: true,
      recordingId: recording.id,
      recording
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload recording',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get user's recordings
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userRecordings = recordings.filter(r => r.userId === userId);
    
    res.json({
      success: true,
      recordings: userRecordings
    });

  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recordings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get specific recording
 */
router.get('/:recordingId', async (req, res) => {
  try {
    const { recordingId } = req.params;
    
    const recording = recordings.find(r => r.id === recordingId);
    
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    res.json({
      success: true,
      recording
    });

  } catch (error) {
    console.error('Get recording error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recording',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Stream video file
 */
router.get('/video/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/recordings', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/webm',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Serve entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/webm',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }

  } catch (error) {
    console.error('Video streaming error:', error);
    res.status(500).json({ 
      error: 'Failed to stream video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete recording
 */
router.delete('/:recordingId', async (req, res) => {
  try {
    const { recordingId } = req.params;
    
    const recordingIndex = recordings.findIndex(r => r.id === recordingId);
    
    if (recordingIndex === -1) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    const recording = recordings[recordingIndex];
    
    // Delete video file
    const filePath = path.join(__dirname, '../../uploads/recordings', recording.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove from metadata
    recordings.splice(recordingIndex, 1);
    
    console.log('🗑️ Recording deleted:', recordingId);
    
    res.json({
      success: true,
      message: 'Recording deleted successfully'
    });

  } catch (error) {
    console.error('Delete recording error:', error);
    res.status(500).json({ 
      error: 'Failed to delete recording',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all recordings (admin only)
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      recordings,
      total: recordings.length
    });

  } catch (error) {
    console.error('Get all recordings error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recordings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
