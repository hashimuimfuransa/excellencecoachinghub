// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import { connectDatabase } from '@/utils/database';
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';
import { globalAsyncErrorCatcher } from '@/middleware/asyncHandler';
import { setupSocketIO } from '@/services/socketService';
import { setSocketIO } from '@/services/notificationService';
import { liveSessionScheduler } from '@/services/liveSessionScheduler';
import { validateCloudinaryConfig } from '@/config/cloudinary';
import videoProviderService from '@/services/videoProviderService';

// Import routes
import authRoutes from '@/routes/authRoutes';
import userRoutes from '@/routes/userRoutes';
import courseRoutes from '@/routes/courseRoutes';
import notificationRoutes from '@/routes/notificationRoutes';
import analyticsRoutes from '@/routes/analyticsRoutes';
import enrollmentRoutes from '@/routes/enrollmentRoutes';
import progressRoutes from '@/routes/progressRoutes';
import liveSessionRoutes from '@/routes/liveSessionRoutes';
import teacherLiveSessionRoutes from '@/routes/teacherLiveSessionRoutes';
import studentLiveSessionRoutes from '@/routes/studentLiveSessionRoutes';
import liveStreamRoutes from '@/routes/liveStreamRoutes';
import proctoringRoutes from '@/routes/proctoringRoutes';
import assessmentRoutes from '@/routes/enhancedAssessmentRoutes';
import regularAssessmentRoutes from '@/routes/assessmentRoutes';
import studentRoutes from '@/routes/studentRoutes';
import teacherProfileRoutes from '@/routes/teacherProfileRoutes';
import quizRoutes from '@/routes/quizRoutes';
import feedbackRoutes from '@/routes/feedbackRoutes';
import supportRoutes from '@/routes/supportRoutes';
import videoRoutes from '@/routes/videoRoutes';
import settingsRoutes from '@/routes/settings';
import aiRoutes from '@/routes/aiRoutes';
import aiAssistantRoutes from '@/routes/aiAssistantRoutes';
import courseContentRoutes from '@/routes/courseContentRoutes';
import courseNotesRoutes from '@/routes/courseNotesRoutes';
import courseMaterialsRoutes from '@/routes/courseMaterials';



const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://excellencecoachinghub.onrender.com',
      process.env['FRONTEND_URL'] || 'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Required for WebRTC
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https:"]
    }
  }
}));

// Rate limiting - Temporarily disabled for debugging
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '10000'), // Very high limit for debugging
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for all endpoints during debugging
    return true; // Disable rate limiting completely
  }
});
app.use('/api/', limiter);

// CORS configuration - More permissive for debugging
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://excellencecoachinghub.onrender.com',
      process.env['FRONTEND_URL'] || 'http://localhost:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for debugging
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Total-Count',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['X-Total-Count', 'Authorization']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Global async error catcher
app.use(globalAsyncErrorCatcher);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(mongoSanitize()); // Prevent NoSQL injection attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution attacks

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Handle common static file requests that browsers make automatically
app.get('/favicon.ico', (_req, res) => {
  res.status(204).end(); // No content
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow:');
});

// Handle logo files (these should be served by frontend, but just in case)
app.get('/logo*.webp', (_req, res) => {
  res.status(404).json({ success: false, error: 'Static files should be served by frontend' });
});

app.get('/logo*.png', (_req, res) => {
  res.status(404).json({ success: false, error: 'Static files should be served by frontend' });
});

// Root route handler
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Excellence Coaching Hub API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth/login',
      documentation: 'https://excellencecoachinghubbackend.onrender.com/api'
    }
  });
});

// Test endpoint to verify API is working
app.get('/api/test', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Simple auth test endpoint
app.post('/api/auth/test', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth endpoint accessible',
    timestamp: new Date().toISOString()
  });
});

// Account locking has been disabled - no unlock endpoint needed

// API routes
console.log('🔄 Mounting API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/live-sessions', liveSessionRoutes);
app.use('/api/teacher/live-sessions', teacherLiveSessionRoutes);
app.use('/api/student/live-sessions', studentLiveSessionRoutes);
app.use('/api/live-stream', liveStreamRoutes);
app.use('/api/proctoring', proctoringRoutes);
app.use('/api/enhanced-assessments', assessmentRoutes);
app.use('/api/assessments', regularAssessmentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teacher-profiles', teacherProfileRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/course-content', courseContentRoutes);
app.use('/api/course-notes', courseNotesRoutes);
app.use('/api/course-materials', courseMaterialsRoutes);

console.log('✅ All routes mounted successfully');

// Setup Socket.IO
setupSocketIO(io);

// Set Socket.IO instance for notification service
setSocketIO(io);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize video provider service
    await videoProviderService.initialize();

    // Validate Cloudinary configuration
    const cloudinaryConfigured = validateCloudinaryConfig();

    // Configure server timeouts for slow networks
    server.timeout = 0; // Disable server timeout
    server.keepAliveTimeout = 0; // Disable keep-alive timeout
    server.headersTimeout = 0; // Disable headers timeout

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
      console.log(`☁️ Cloudinary: ${cloudinaryConfigured ? 'Configured' : 'Not configured (avatar upload disabled)'}`);
      console.log(`⏱️ Server timeouts: Disabled for slow networks`);

      // Start the live session scheduler
      liveSessionScheduler.start();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections - Don't exit in development
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);

  // In development, log the error but don't exit to maintain server stability
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Server continuing in development mode...');
  } else {
    // In production, gracefully shutdown
    console.log('🛑 Shutting down due to unhandled rejection in production...');
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions - Don't exit in development
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack trace:', err.stack);

  // In development, log the error but don't exit to maintain server stability
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Server continuing in development mode...');
  } else {
    // In production, we might want to exit after cleanup
    console.log('🛑 Shutting down due to uncaught exception in production...');
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

startServer();

export { app, io };
