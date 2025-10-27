import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

// Store active streams in memory (in production, use Redis or database)
const activeStreams = new Map<string, {
  teacherId: string;
  startTime: Date;
  isActive: boolean;
  chunks: Array<{ data: string; timestamp: number }>;
  viewers: Set<string>;
}>();

// Teacher: Start streaming endpoint
router.post('/start/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { teacherId } = req.body;

    console.log(`🎥 Starting HLS stream for session ${sessionId} by teacher ${teacherId}`);

    // Create stream entry
    activeStreams.set(sessionId, {
      teacherId,
      startTime: new Date(),
      isActive: true,
      chunks: [],
      viewers: new Set()
    });

    res.json({
      success: true,
      message: 'Stream started successfully',
      streamUrl: `/api/live-stream/watch/${sessionId}`
    });

  } catch (error) {
    console.error('❌ Error starting stream:', error);
    res.status(500).json({ error: 'Failed to start stream' });
  }
});

// Teacher: Upload video chunk
router.post('/chunk/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { chunk, timestamp } = req.body;

    const stream = activeStreams.get(sessionId);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Add chunk to stream
    stream.chunks.push({
      data: chunk,
      timestamp: timestamp || Date.now()
    });

    // Keep only last 20 chunks (for buffering)
    if (stream.chunks.length > 20) {
      stream.chunks = stream.chunks.slice(-20);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error uploading chunk:', error);
    res.status(500).json({ error: 'Failed to upload chunk' });
  }
});

// Student: Get stream data (JSON endpoint for easier handling)
router.get('/data/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`📺 Student requesting stream data for session ${sessionId}`);

    const stream = activeStreams.get(sessionId);
    if (!stream || !stream.isActive) {
      return res.status(404).json({ error: 'Stream not found or inactive' });
    }

    // Add viewer
    stream.viewers.add(req.ip || 'unknown');

    // Return latest chunks
    const latestChunks = stream.chunks.slice(-5); // Last 5 chunks

    res.json({
      success: true,
      isActive: stream.isActive,
      chunks: latestChunks,
      viewers: stream.viewers.size,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Error serving stream data:', error);
    res.status(500).json({ error: 'Failed to serve stream data' });
  }
});

// Get stream info
router.get('/info/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const stream = activeStreams.get(sessionId);

    if (!stream) {
      return res.json({
        isActive: false,
        viewers: 0
      });
    }

    res.json({
      isActive: stream.isActive,
      viewers: stream.viewers.size,
      startTime: stream.startTime,
      chunksCount: stream.chunks.length
    });

  } catch (error) {
    console.error('❌ Error getting stream info:', error);
    res.status(500).json({ error: 'Failed to get stream info' });
  }
});

// Teacher: Stop streaming
router.post('/stop/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`🛑 Stopping stream for session ${sessionId}`);

    const stream = activeStreams.get(sessionId);
    if (stream) {
      stream.isActive = false;
      // Clean up after 5 minutes
      setTimeout(() => {
        activeStreams.delete(sessionId);
      }, 5 * 60 * 1000);
    }

    res.json({ success: true, message: 'Stream stopped' });

  } catch (error) {
    console.error('❌ Error stopping stream:', error);
    res.status(500).json({ error: 'Failed to stop stream' });
  }
});

// Get all active streams (for debugging)
router.get('/active', (req: Request, res: Response) => {
  try {
    const streams = Array.from(activeStreams.entries()).map(([sessionId, stream]) => ({
      sessionId,
      isActive: stream.isActive,
      viewers: stream.viewers.size,
      startTime: stream.startTime,
      chunksCount: stream.chunks.length
    }));

    res.json({ streams });

  } catch (error) {
    console.error('❌ Error getting active streams:', error);
    res.status(500).json({ error: 'Failed to get active streams' });
  }
});

export default router;
