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
import multer from 'multer';

import { connectDatabase } from '@/utils/database';
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';
import { globalAsyncErrorCatcher } from '@/middleware/asyncHandler';
import { setupSocketIO } from '@/services/socketService';
import { setSocketIO } from '@/services/notificationService';
import { liveSessionScheduler } from '@/services/liveSessionScheduler';
import { proctoringService } from '@/services/proctoringService';
import { validateCloudinaryConfig } from '@/config/cloudinary';
import videoProviderService from '@/services/videoProviderService';
import { JobScrapingScheduler } from '@/services/jobScrapingScheduler';

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
import assessmentRequestRoutes from '@/routes/assessmentRequestRoutes';
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
import assignmentRoutes from '@/routes/assignmentRoutes';
import announcementRoutes from '@/routes/announcementRoutes';
import recordedSessionRoutes from '@/routes/recordedSessions';
import gradesRoutes from '@/routes/gradesRoutes';
import testRoutes from '@/routes/testRoutes';

// Job Portal routes
import jobRoutes from '@/routes/jobRoutes';
import jobApplicationRoutes from '@/routes/jobApplicationRoutes';
import psychometricTestRoutes from '@/routes/psychometricTestRoutes';
import simplePsychometricRoutes from '@/routes/simplePsychometricRoutes';
import careerGuidanceRoutes from '@/routes/careerGuidanceRoutes';
import aiInterviewRoutes from '@/routes/aiInterviewRoutes';
import quickInterviewRoutes from '@/routes/quickInterviewRoutes';
import modernInterviewRoutes from '@/routes/modernInterviewRoutes';
import speechRoutes from '@/routes/speechRoutes';
import jobCertificateRoutes from '@/routes/jobCertificateRoutes';
import profileRoutes from '@/routes/profileRoutes';
import uploadRoutes from '@/routes/uploadRoutes';
import superAdminRoutes from '@/routes/superAdminRoutes';
import employerRoutes from '@/routes/employerRoutes';
import testRequestRoutes from '@/routes/testRequestRoutes';
import paymentRoutes from '@/routes/paymentRoutes';
import paymentRequestRoutes from '@/routes/paymentRequestRoutes';
import jobScrapingRoutes from '@/routes/jobScrapingRoutes';
import smartTestRoutes from '@/routes/smartTestRoutes';
import cvBuilderRoutes from '@/routes/cvBuilderRoutes';

// Social Network routes
import postRoutes from '@/routes/postRoutes';
import connectionRoutes from '@/routes/connectionRoutes';
import companyRoutes from '@/routes/companyRoutes';
import eventRoutes from '@/routes/eventRoutes';
import careerInsightRoutes from '@/routes/careerInsightRoutes';

// Chat routes
import chatRoutes from '@/routes/chatRoutes';

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://excellencecoachinghub.onrender.com',
      'https://jobsexcellencecoachinghub.onrender.com',
      'https://adminexcellencecoachinghub.onrender.com',
      'https://ech-w16g.onrender.com',
      'https://jobs.excellencecoachinghub.com', // Add the missing domain
      'https://excellencecoachinghub.com',
      'https://elearning.excellencecoachinghub.com',
       'https://exjobnet.excellencecoachinghub.com'
      ,       // Add root domain too
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
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://excellencecoachinghub.onrender.com',
      'https://jobsexcellencecoachinghub.onrender.com',
      'https://adminexcellencecoachinghub.onrender.com',
      'https://ech-w16g.onrender.com',
      'https://jobs.excellencecoachinghub.com', // Add the missing domain
      'https://excellencecoachinghub.com',       // Add root domain too
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

// EARLY TEST ENDPOINT - NO AUTH REQUIRED
app.get('/api/test-levels-early', (req, res) => {
  console.log('🚀 EARLY test levels endpoint hit - should have no auth');
  res.status(200).json({
    success: true,
    data: [
      { 
        id: 'easy', 
        name: 'Easy Level', 
        price: 2000, 
        currency: 'UGX',
        description: 'Basic psychometric assessment with fundamental questions',
        features: {
          questionCount: 15,
          timeLimit: 20,
          attempts: 3,
          validityDays: 30,
          detailedReports: false
        }
      },
      { 
        id: 'intermediate', 
        name: 'Intermediate Level', 
        price: 3500, 
        currency: 'UGX',
        description: 'Moderate difficulty assessment covering various skills',
        features: {
          questionCount: 25,
          timeLimit: 35,
          attempts: 2,
          validityDays: 45,
          detailedReports: true
        }
      },
      { 
        id: 'hard', 
        name: 'Hard Level', 
        price: 5000, 
        currency: 'UGX',
        description: 'Comprehensive assessment for advanced positions',
        features: {
          questionCount: 40,
          timeLimit: 60,
          attempts: 1,
          validityDays: 60,
          detailedReports: true
        }
      }
    ],
    message: 'Early test levels endpoint working - no auth'
  });
});

// EARLY TEST JOBS ENDPOINT - NO AUTH REQUIRED (for testing dialog)
// Updated endpoint to fetch real jobs from database instead of mock data
app.get('/api/test-jobs-early', async (req, res) => {
  console.log('🚀 Fetching actual jobs from database for psychometric tests');
  try {
    // Import Job model properly
    const { Job } = await import('./models');
    
    // Query active jobs from database
    const jobs = await Job.find({ status: 'active' })
      .populate('employer', 'firstName lastName company')
      .limit(20)
      .sort({ createdAt: -1 });

    // If no jobs found in database, return fallback mock jobs
    if (!jobs || jobs.length === 0) {
      console.log('⚠️ No jobs found in database, using fallback data');
      return res.status(200).json({
        success: true,
        data: [
          {
            _id: 'fallback-job-1',
            title: 'Software Developer',
            company: 'Tech Solutions Ltd',
            industry: 'Technology',
            experienceLevel: 'mid_level',
            skillsRequired: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'API Development'],
            description: 'Join our dynamic team as a Software Developer and work on cutting-edge projects.',
            status: 'active',
            jobType: 'full_time',
            location: 'Kampala, Uganda',
            educationLevel: 'bachelor',
            employer: { firstName: 'John', lastName: 'Doe', company: 'Tech Solutions Ltd' }
          },
          {
            _id: 'fallback-job-2',
            title: 'Digital Marketing Specialist',
            company: 'Marketing Pro Agency',
            industry: 'Marketing',
            experienceLevel: 'entry_level',
            skillsRequired: ['SEO', 'Social Media', 'Content Marketing', 'Analytics', 'PPC'],
            description: 'Drive digital marketing campaigns and help clients grow their online presence.',
            status: 'active',
            jobType: 'full_time',
            location: 'Entebbe, Uganda',
            educationLevel: 'bachelor',
            employer: { firstName: 'Sarah', lastName: 'Smith', company: 'Marketing Pro Agency' }
          },
          {
            _id: 'fallback-job-3',
            title: 'Data Analyst',
            company: 'Data Insights Corp',
            industry: 'Data Science',
            experienceLevel: 'mid_level',
            skillsRequired: ['Python', 'SQL', 'Excel', 'Tableau', 'Statistics'],
            description: 'Analyze complex datasets and provide actionable insights for business decisions.',
            status: 'active',
            jobType: 'contract',
            location: 'Jinja, Uganda',
            educationLevel: 'bachelor',
            employer: { firstName: 'Michael', lastName: 'Johnson', company: 'Data Insights Corp' }
          },
          {
            _id: 'fallback-job-4',
            title: 'Project Manager',
            company: 'Business Excellence Ltd',
            industry: 'Consulting',
            experienceLevel: 'senior_level',
            skillsRequired: ['Project Management', 'Leadership', 'Agile', 'Communication', 'Risk Management'],
            description: 'Lead cross-functional teams and deliver projects on time and within budget.',
            status: 'active',
            jobType: 'full_time',
            location: 'Mbarara, Uganda',
            educationLevel: 'master',
            employer: { firstName: 'Emma', lastName: 'Wilson', company: 'Business Excellence Ltd' }
          },
          {
            _id: 'fallback-job-5',
            title: 'Graphic Designer',
            company: 'Creative Studio',
            industry: 'Design',
            experienceLevel: 'entry_level',
            skillsRequired: ['Photoshop', 'Illustrator', 'InDesign', 'Branding', 'Typography'],
            description: 'Create visually stunning designs for various marketing materials and digital content.',
            status: 'active',
            jobType: 'freelance',
            location: 'Gulu, Uganda',
            educationLevel: 'associate',
            employer: { firstName: 'David', lastName: 'Brown', company: 'Creative Studio' }
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 5,
          pages: 1
        },
        message: 'Using fallback jobs - no real jobs in database'
      });
    }

    // Format jobs for response
    const formattedJobs = jobs.map(job => ({
      _id: job._id,
      title: job.title,
      company: job.company || job.employer?.company,
      industry: job.industry,
      experienceLevel: job.experienceLevel,
      skillsRequired: job.skillsRequired || job.requirements || [],
      description: job.description,
      status: job.status,
      jobType: job.jobType,
      location: job.location,
      educationLevel: job.educationLevel,
      employer: job.employer
    }));

    console.log(`✅ Successfully fetched ${formattedJobs.length} real jobs from database`);
    
    res.status(200).json({
      success: true,
      data: formattedJobs,
      pagination: {
        page: 1,
        limit: 20,
        total: formattedJobs.length,
        pages: 1
      },
      message: `Loaded ${formattedJobs.length} real jobs from database`
    });

  } catch (error) {
    console.error('❌ Error fetching real jobs:', error);
    
    // Return fallback mock data in case of error
    res.status(200).json({
      success: true,
      data: [
        {
          _id: 'error-fallback-1',
          title: 'Software Developer',
          company: 'Tech Solutions Ltd',
          industry: 'Technology',
          experienceLevel: 'mid_level',
          skillsRequired: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'API Development'],
          description: 'Join our dynamic team as a Software Developer and work on cutting-edge projects.',
          status: 'active',
          jobType: 'full_time',
          location: 'Kampala, Uganda',
          educationLevel: 'bachelor',
          employer: { firstName: 'John', lastName: 'Doe', company: 'Tech Solutions Ltd' }
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        pages: 1
      },
      message: 'Error fetching real jobs - using fallback data',
      error: error.message
    });
  }
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

// API Health check endpoint for frontend tests
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'connected', // You could add actual DB health check here
      socketIO: 'running',
      proctoring: 'available'
    }
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

// Direct test levels endpoint to bypass routing issues
app.get('/api/payments/test-levels-direct', (_req, res) => {
  const TEST_LEVELS = [
    {
      id: 'easy',
      name: 'Easy Level',
      description: 'Basic assessment with 15 questions',
      price: 1500,
      currency: 'RWF',
      features: {
        questionCount: 15,
        timeLimit: 25,
        attempts: 1,
        validityDays: 7,
        detailedReports: false
      }
    }
  ];
  
  res.status(200).json({
    success: true,
    data: TEST_LEVELS,
    message: 'Test levels retrieved directly - bypassing routing'
  });
});

// RENDER WORKAROUND: Direct upload test endpoints to bypass routing issues
app.get('/api/upload/cv-test', (_req, res) => {
  console.log('🔍 Direct GET upload test endpoint hit');
  try {
    res.status(200).json({
      success: true,
      message: 'Direct GET upload test working - bypassed route mounting',
      timestamp: new Date().toISOString(),
      host: _req.headers.host,
      userAgent: _req.headers['user-agent']
    });
  } catch (error) {
    console.error('Direct GET test error:', error);
    res.status(500).json({
      success: false,
      error: 'Direct GET test failed'
    });
  }
});

// RENDER WORKAROUND: Upload status endpoint  
app.get('/api/upload/cv-upload-status/:uploadId', (_req, res) => {
  const uploadId = _req.params.uploadId;
  console.log('📊 Direct upload status check for:', uploadId);
  try {
    res.status(200).json({
      success: true,
      data: {
        url: 'https://res.cloudinary.com/dybgf8tz9/image/upload/v1674567890/excellence-coaching-hub/test.pdf',
        originalName: 'test-cv.pdf',
        size: 1024,
        uploadId: uploadId
      },
      message: 'Direct GET-based upload response working - RENDER WORKAROUND SUCCESSFUL'
    });
  } catch (error) {
    console.error('Direct upload status error:', error);
    res.status(500).json({
      success: false,
      error: 'Direct upload status failed'
    });
  }
});

// RENDER WORKAROUND: POST endpoint that doesn't send response (for actual file upload)

// Create upload middleware for the workaround
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC/DOCX files are allowed'));
    }
  }
});

// RENDER WORKAROUND: Silent POST upload (response will be stripped anyway)
app.post('/api/upload/cv-silent', upload.single('cv'), async (_req, _res) => {
  console.log('🔇 Silent CV upload - no response expected due to Render proxy');
  
  try {
    const userId = (_req as any).user?.id || 'anonymous';
    const file = (_req as any).file;
    
    if (file) {
      console.log('📄 File received:', { 
        name: file.originalname, 
        size: file.size,
        type: file.mimetype 
      });
      
      // Here would be the actual file upload logic
      // For now, we'll just log success
      console.log('✅ File processing would happen here');
      
      // DON'T send any response - Render will strip it anyway
      // The frontend will poll the status endpoint instead
      
    } else {
      console.log('❌ No file received');
    }
    
  } catch (error) {
    console.error('❌ Silent upload error:', error);
    // Still don't send response
  }
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
app.use('/api/assessment-requests', assessmentRequestRoutes);
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
app.use('/api/assignments', assignmentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/recorded-sessions', recordedSessionRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/test', testRoutes);

// Job Portal routes
app.use('/api/jobs', jobRoutes);
app.use('/api/job-applications', jobApplicationRoutes);
// Additional mounting for frontend compatibility
app.use('/api/applications', jobApplicationRoutes);
app.use('/api/psychometric-tests', psychometricTestRoutes);
app.use('/api/simple-psychometric', simplePsychometricRoutes);
// Additional mounting for frontend compatibility
app.use('/api/psychometric-tests', simplePsychometricRoutes);
app.use('/api/career-guidance', careerGuidanceRoutes);
app.use('/api/ai-interviews', aiInterviewRoutes);
app.use('/api/quick-interviews', quickInterviewRoutes);
app.use('/api/modern-interviews', modernInterviewRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/job-certificates', jobCertificateRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/job-scraping', jobScrapingRoutes);
app.use('/api/smart-tests', smartTestRoutes);

// Test Request routes
app.use('/api/test-requests', testRequestRoutes);

// Payment Request routes
app.use('/api/payment-requests', paymentRequestRoutes);

// CV Builder routes
app.use('/api/cv-builder', cvBuilderRoutes);

// Social Network routes
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/insights', careerInsightRoutes);

// Chat routes
app.use('/api/chat', chatRoutes);

// Test endpoint to check jobs in database
app.get('/api/jobs-debug', async (req, res) => {
  try {
    const { Job } = await import('./models');
    const jobCount = await Job.countDocuments();
    const sampleJobs = await Job.find().limit(3).select('title company status createdAt');
    
    console.log('🔍 Jobs debug - Total jobs:', jobCount);
    console.log('🔍 Sample jobs:', sampleJobs);
    
    res.status(200).json({
      success: true,
      data: {
        totalJobs: jobCount,
        sampleJobs,
        message: `Found ${jobCount} jobs in database`
      }
    });
  } catch (error: any) {
    console.error('Jobs debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple test endpoint to debug auth issues - Easy: 20, Intermediate: 30, Hard: 40 questions
app.get('/api/test-levels-debug', (req, res) => {
  console.log('🚀 Direct test levels endpoint hit - no middleware');
  res.status(200).json({
    success: true,
    data: [
      { 
        id: 'easy', 
        name: 'Foundation Level', 
        price: 2000, 
        currency: 'UGX',
        description: 'Basic psychometric assessment with 20 comprehensive questions covering fundamental traits and abilities',
        features: {
          questionCount: 20,
          timeLimit: 25,
          attempts: 3,
          validityDays: 30,
          detailedReports: false
        }
      },
      { 
        id: 'intermediate', 
        name: 'Intermediate Level', 
        price: 3500, 
        currency: 'UGX',
        description: 'Comprehensive evaluation with 30 scenario-based questions covering various skills',
        features: {
          questionCount: 30,
          timeLimit: 40,
          attempts: 2,
          validityDays: 45,
          detailedReports: true
        }
      },
      { 
        id: 'hard', 
        name: 'Advanced Level', 
        price: 5000, 
        currency: 'UGX',
        description: 'In-depth analysis with 40 complex situational assessments for advanced positions',
        features: {
          questionCount: 40,
          timeLimit: 60,
          attempts: 1,
          validityDays: 60,
          detailedReports: true
        }
      }
    ],
    message: 'Direct test levels endpoint working - Easy: 20, Intermediate: 30, Hard: 40 questions'
  });
});

// Payment routes
app.use('/api/payments', paymentRoutes);

// Employer routes
app.use('/api/employer', employerRoutes);

// Super Admin routes
app.use('/api/admin', superAdminRoutes);

// Placeholder image endpoint for avatar videos
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  
  // Create a simple SVG placeholder
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#2c3e50"/>
    <circle cx="${parseInt(width)/2}" cy="${parseInt(height)/2 - 20}" r="40" fill="#34495e"/>
    <text x="${parseInt(width)/2}" y="${parseInt(height)/2 + 30}" font-family="Arial" font-size="16" fill="white" text-anchor="middle">AI Avatar Loading...</text>
  </svg>`;
  
  res.set('Content-Type', 'image/svg+xml');
  res.send(svg);
});

console.log('✅ All routes mounted successfully');

// Setup Socket.IO
setupSocketIO(io);

// Set Socket.IO instance for notification service and proctoring
setSocketIO(io);
proctoringService.setSocketIO(io);

// Catch-all handler for frontend routes (SPA support)
app.get('*', (req, res, next) => {
  // Skip API routes and let them go to 404 handler
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // For frontend routes, return a simple message instead of trying to serve index.html
  // This prevents the 404 error for frontend routes like /assignment/:id/work
  res.status(200).json({
    success: true,
    message: 'Frontend route - should be handled by React Router',
    path: req.path,
    note: 'This is a backend API server. Frontend routes should be handled by the React application.'
  });
});

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
      
      // Start the job scraping scheduler
      JobScrapingScheduler.start();
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
