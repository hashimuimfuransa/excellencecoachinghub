const express = require('express');
const router = express.Router();

// Store active streams
const activeStreams = new Map();

// Teacher: Start streaming endpoint
router.post('/start/:sessionId', async (req, res) => {
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
router.post('/chunk/:sessionId', async (req, res) => {
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

    // Keep only last 10 chunks (for buffering)
    if (stream.chunks.length > 10) {
      stream.chunks = stream.chunks.slice(-10);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Error uploading chunk:', error);
    res.status(500).json({ error: 'Failed to upload chunk' });
  }
});

// Student: Watch stream
router.get('/watch/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`📺 Student requesting stream for session ${sessionId}`);

    const stream = activeStreams.get(sessionId);
    if (!stream || !stream.isActive) {
      return res.status(404).json({ error: 'Stream not found or inactive' });
    }

    // Add viewer
    stream.viewers.add(req.ip);

    // Set headers for video streaming
    res.writeHead(200, {
      'Content-Type': 'video/webm',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send existing chunks first
    stream.chunks.forEach(chunk => {
      if (chunk.data) {
        const buffer = Buffer.from(chunk.data.split(',')[1], 'base64');
        res.write(buffer);
      }
    });

    // Keep connection open for new chunks
    const interval = setInterval(() => {
      const currentStream = activeStreams.get(sessionId);
      if (!currentStream || !currentStream.isActive) {
        clearInterval(interval);
        res.end();
        return;
      }

      // Send latest chunk if available
      const latestChunk = currentStream.chunks[currentStream.chunks.length - 1];
      if (latestChunk && latestChunk.timestamp > (req.lastChunkTime || 0)) {
        req.lastChunkTime = latestChunk.timestamp;
        if (latestChunk.data) {
          const buffer = Buffer.from(latestChunk.data.split(',')[1], 'base64');
          res.write(buffer);
        }
      }
    }, 100); // Check for new chunks every 100ms

    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(interval);
      if (stream.viewers) {
        stream.viewers.delete(req.ip);
      }
    });

  } catch (error) {
    console.error('❌ Error serving stream:', error);
    res.status(500).json({ error: 'Failed to serve stream' });
  }
});

// Get stream info
router.get('/info/:sessionId', (req, res) => {
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
router.post('/stop/:sessionId', (req, res) => {
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
router.get('/active', (req, res) => {
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

module.exports = router;
