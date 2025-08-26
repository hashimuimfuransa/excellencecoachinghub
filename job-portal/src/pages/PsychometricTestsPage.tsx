import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Skeleton,
  useTheme,
  alpha,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Autocomplete,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Snackbar
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import SimpleProfileGuard from '../components/SimpleProfileGuard';
import { userService } from '../services/userService';
import { psychometricTestService } from '../services/psychometricTestService';
import { jobService } from '../services/jobService';
// Removed old local AI service - now using backend API
interface JobTestBlueprint {
  categories: { name: string; weight: number }[];
  skills: string[];
  traits: string[];
  totalQuestions: number;
  difficulty: string;
  timeLimit: number;
  totalTimeLimit: number;
}

interface GeneratedQuestion {
  _id: string;
  question: string;
  type: string;
  options?: string[];
  traits: string[];
  weight: number;
  correctAnswer?: string;
  explanation?: string;
  category?: string;
  difficulty?: string;
}
import {
  Psychology,
  TrendingUp,
  Assessment,
  Timer,
  CheckCircle,
  Star,
  PlayArrow,
  Refresh,
  Download,
  Share,
  Info,
  EmojiEvents,
  School,
  Person,
  Group,
  Lightbulb,
  Speed,
  Visibility,
  Close,
  Work,
  SmartToy,
  AutoAwesome,
  AttachMoney,
  Groups,
  Flag,
  BarChart,
  MenuBook,
  AccountTree,
  Favorite,
  Lock,
  LockOpen,
  BookmarkBorder,
  RequestPage
} from '@mui/icons-material';
const RequestIcon = RequestPage;
const StartIcon = PlayArrow;
import { useNavigate } from 'react-router-dom';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  experienceLevel: string;
  jobType: string;
}

interface PsychometricTest {
  _id: string;
  title: string;
  description: string;
  type: 'personality' | 'cognitive' | 'aptitude' | 'skills' | 'behavioral' | 'comprehensive';
  timeLimit: number; // in minutes
  questions: TestQuestion[];
  industry?: string;
  jobRole?: string;
  isActive: boolean;
  createdBy: any;
  createdAt: string;
  updatedAt: string;
  // AI-generated test properties
  categories?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  targetSkills?: string[];
  targetTraits?: string[];
  jobSpecific?: boolean;
  blueprint?: {
    totalCategories: number;
    categoryCoverage: Array<{
      name: string;
      questionCount: number;
    }>;
  };
}

interface TestResult {
  _id: string;
  test: PsychometricTest;
  user: string;
  job?: Job;
  answers: Record<string, any>;
  scores: Record<string, number>;
  overallScore: number;
  interpretation: string;
  recommendations: string[];
  timeSpent: number;
  createdAt: string;
}

interface TestQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'scenario' | 'numerical' | 'logical' | 'verbal' | 'situational' | 'coding' | 'mechanical';
  options?: string[];
  scaleRange?: { min: number; max: number; labels: string[] };
  correctAnswer?: string | number;
  traits?: string[];
  weight: number;
  // Additional properties for AI-generated questions
  explanation?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  chartData?: any;
  codeSnippet?: string;
}

interface TestLevel {
  level: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: number;
  questionCount: number;
  cost: number; // Cost in FRW
}

interface PaymentInfo {
  level: number;
  cost: number;
  attemptsRemaining: number;
  lastPaymentDate?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  requestedAt?: string;
  approvedAt?: string;
  jobId?: string;
  jobTitle?: string;
  paymentKey?: string;
}

interface FreeTestCategory {
  id: string;
  title: string;
  description: string;
  testCount: number;
  questionCount: number;
  icon: React.ReactNode;
  color: string;
  difficulty: string;
  timeLimit: number;
  isFree: boolean;
}

// Free test categories
const freeTestCategories: FreeTestCategory[] = [
  {
    id: 'numerical',
    title: 'Numerical Reasoning',
    description: 'Numerical reasoning tests demonstrate your ability to deal with numbers quickly and accurately. These tests contain questions that assess your knowledge of ratios, percentages, number sequences, data interpretation, financial analysis and currency conversion',
    testCount: 30,
    questionCount: 480,
    icon: <BarChart />,
    color: '#2196f3',
    difficulty: 'Medium',
    timeLimit: 20,
    isFree: true
  },
  {
    id: 'verbal',
    title: 'Verbal Reasoning',
    description: 'Verbal reasoning tests assess your understanding and comprehension skills. You will be presented with a short passage of text which you\'ll be required to interpret before answering questions on. These are typically in the \'True, False, Cannot Say\' multiple choice format, although there are a range of alternatives too.',
    testCount: 30,
    questionCount: 450,
    icon: <MenuBook />,
    color: '#4caf50',
    difficulty: 'Medium',
    timeLimit: 18,
    isFree: true
  },
  {
    id: 'situational',
    title: 'Situational Judgement',
    description: 'Situational Judgement Tests assess how you approach situations encountered in the workplace. They are built around hypothetical scenarios to which you would be expected to react accordingly. Based on your answers it will be verified how aligned you are with values and behaviors of a particular company.',
    testCount: 50,
    questionCount: 480,
    icon: <Groups />,
    color: '#ff9800',
    difficulty: 'Medium',
    timeLimit: 25,
    isFree: true
  },
  {
    id: 'diagrammatic',
    title: 'Diagrammatic Reasoning',
    description: 'Diagrammatic reasoning tests assess your logical reasoning ability. The questions measure your ability to infer a set of rules from a flowchart or sequence of diagrams and then to apply those rules to a new situation.',
    testCount: 30,
    questionCount: 300,
    icon: <AccountTree />,
    color: '#9c27b0',
    difficulty: 'Hard',
    timeLimit: 20,
    isFree: true
  },
  {
    id: 'bigfive',
    title: 'Big Five',
    description: 'It is a common belief among psychologists that there are five basic dimensions of personality, often referred to as the "Big 5" personality traits. The five broad personality traits described by the theory are extraversion, agreeableness, openness, conscientiousness, and neuroticism. This test reveals where you are on the scale of each.',
    testCount: 1,
    questionCount: 60,
    icon: <Person />,
    color: '#607d8b',
    difficulty: 'Easy',
    timeLimit: 15,
    isFree: true
  },
  {
    id: 'resilience',
    title: 'Resilience',
    description: 'How resilient are you? Do you cope well with life\'s trials and tribulations, or do they throw you into turmoil? Resilience is the quality that allows us to "survive", and even gain strength from hardship. Take this resilience test to assess how resilient you are.',
    testCount: 1,
    questionCount: 25,
    icon: <Favorite />,
    color: '#e91e63',
    difficulty: 'Easy',
    timeLimit: 10,
    isFree: true
  }
];

// Test levels for job-specific paid tests
const testLevels: TestLevel[] = [
  {
    level: 1,
    title: 'Foundation Level',
    description: 'Basic assessment covering fundamental traits and abilities',
    difficulty: 'Easy',
    estimatedTime: 15,
    questionCount: 20,
    cost: 2000 // Base cost in FRW
  },
  {
    level: 2,
    title: 'Intermediate Level',
    description: 'Comprehensive evaluation with scenario-based questions',
    difficulty: 'Medium',
    estimatedTime: 30,
    questionCount: 40,
    cost: 4000 // Level 1 cost * 2
  },
  {
    level: 3,
    title: 'Advanced Level',
    description: 'In-depth analysis with complex situational assessments',
    difficulty: 'Hard',
    estimatedTime: 45,
    questionCount: 60,
    cost: 8000 // Level 2 cost * 2
  }
];

const PsychometricTestsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tests, setTests] = useState<PsychometricTest[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [freshUserData, setFreshUserData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [jobSelectionOpen, setJobSelectionOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<PsychometricTest | null>(null);
  const [takingTest, setTakingTest] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [generatedTests, setGeneratedTests] = useState<PsychometricTest[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTestLevel, setSelectedTestLevel] = useState<TestLevel | null>(null);
  const [userPayments, setUserPayments] = useState<PaymentInfo[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showTestCard, setShowTestCard] = useState(false);
  const [readyTest, setReadyTest] = useState<PsychometricTest | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [testBlueprint, setTestBlueprint] = useState<JobTestBlueprint | null>(null);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load data in the correct order to ensure jobs are available when processing payments
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // First, load basic data
        await Promise.all([
          fetchTests(),
          fetchResults(), 
          fetchUserData()
        ]);
        
        // Load jobs first (needed for payment processing)
        await fetchJobs();
        
        // Load initial payments from localStorage
        loadUserPayments();
        
        // Then refresh payments from backend (this will use the jobs data)
        setTimeout(() => {
          refreshUserPayments();
        }, 1000); // Small delay to ensure jobs state is updated
        
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Load saved payments from localStorage
  const loadUserPayments = () => {
    try {
      const saved = localStorage.getItem(`psychometric_payments_${user?._id}`);
      if (saved) {
        setUserPayments(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved payments:', error);
    }
  };

  // Save payments to localStorage
  const saveUserPayments = (payments: PaymentInfo[]) => {
    try {
      localStorage.setItem(`psychometric_payments_${user?._id}`, JSON.stringify(payments));
    } catch (error) {
      console.error('Error saving payments:', error);
    }
  };

  // Refresh user payments and check for status updates
  const refreshUserPayments = async () => {
    if (!user?._id) return;
    
    try {
      setRefreshing(true);
      
      // Get the current payments to compare status changes
      const currentPayments = [...userPayments];
      
      // Fetch latest payments from backend API
      const response = await psychometricTestService.getUserTestPurchases();
      
      console.log('🔍 Raw backend response:', response);
      console.log('🔍 Total payments received:', response?.length || 0);
      
      // Enhanced logging for each payment
      if (response && Array.isArray(response)) {
        response.forEach((payment: any, index: number) => {
          console.log(`💳 Payment ${index + 1}:`, {
            id: payment._id,
            status: payment.status,
            approvalStatus: payment.approvalStatus,
            testType: payment.testType,
            type: payment.type,
            service: payment.service,
            paymentKeys: Object.keys(payment).filter(key => 
              key.includes('job') || key.includes('Job') || key.includes('test') || key.includes('Test')
            ),
            allKeys: Object.keys(payment)
          });
        });
      }

      // If no payments found, try to check the specific payment ID mentioned by user
      if (!response || response.length === 0) {
        console.log('🔍 No payments found in primary endpoint, testing specific payment ID...');
        try {
          const specificPayment = await psychometricTestService.getPaymentById('68ada6c00799fee46cd1d1ce');
          if (specificPayment) {
            console.log('✅ Found specific payment by ID:', specificPayment);
            console.log('📋 Payment details:', {
              id: specificPayment._id,
              status: specificPayment.status,
              approvalStatus: specificPayment.approvalStatus,
              userId: specificPayment.userId,
              keys: Object.keys(specificPayment)
            });
          } else {
            console.log('❌ Specific payment ID 68ada6c00799fee46cd1d1ce not found or not accessible');
          }
        } catch (error) {
          console.error('❌ Error testing specific payment ID:', error);
        }
      }
      
      if (response && Array.isArray(response)) {
        // Ensure we have the latest jobs data before processing payments
        let currentJobs = jobs;
        if (currentJobs.length === 0) {
          console.log('🔄 No jobs in state, fetching fresh jobs data...');
          try {
            const jobsResponse = await jobService.getJobs({ status: 'active' });
            currentJobs = jobsResponse.data || [];
            setJobs(currentJobs); // Update state
          } catch (error) {
            console.error('Failed to fetch jobs for payment processing:', error);
            currentJobs = [];
          }
        }
        
        // Convert backend format to local format and ensure we have job information
        const updatedPayments: PaymentInfo[] = await Promise.all(
          response.map(async (purchase: any) => {
            console.log('🔍 Processing purchase (full object):', purchase);
            console.log('🔍 Processing purchase (key fields):', {
              id: purchase._id,
              paymentKey: purchase.paymentKey,
              jobId: purchase.jobId,
              testJobId: purchase.testJobId,
              job: purchase.job ? { _id: purchase.job._id, title: purchase.job.title } : null,
              test: purchase.test ? { _id: purchase.test._id, title: purchase.test.title, jobId: purchase.test.jobId } : null,
              level: purchase.level,
              cost: purchase.cost,
              amount: purchase.amount,
              approvalStatus: purchase.approvalStatus,
              // Check for other possible jobId fields
              targetJobId: purchase.targetJobId,
              relatedJobId: purchase.relatedJobId,
              metadata: purchase.metadata
            });

            // Extract information based on backend structure
            let jobInfo = purchase.job; // This is populated by backend
            let testInfo = purchase.test; // This is populated by backend
            let jobId = purchase.job?._id || purchase.jobId || purchase.testJobId || purchase.test?.jobId || purchase.targetJobId || purchase.relatedJobId;
            let testId = purchase.test?._id || purchase.testId;
            let paymentKey = purchase.paymentKey || purchase._id;
            let cost = purchase.amount || purchase.cost || 0; // Backend uses 'amount'
            let level = purchase.level || 1; // Extract level from purchase or default to 1
            
            console.log('📝 Extracted initial values:', {
              jobId,
              testId,
              paymentKey,
              level,
              hasJobInfo: !!jobInfo,
              hasTestInfo: !!testInfo
            });
            
            // If we have a paymentKey in format "jobId_level", extract level from it
            if (paymentKey && paymentKey.includes('_') && !purchase.level) {
              const parts = paymentKey.split('_');
              if (parts.length >= 2 && !isNaN(parseInt(parts[parts.length - 1]))) {
                level = parseInt(parts[parts.length - 1]);
                // Also extract jobId if it wasn't found
                if (!jobId && parts.length >= 2) {
                  jobId = parts.slice(0, -1).join('_'); // Join all parts except the last (level)
                }
              }
            }
            
            // IMPORTANT: If we still don't have job info after approval, but we have a job reference,
            // we need to make sure we fetch the actual job data from our jobs array or API
            if (!jobInfo && jobId) {
              console.log('🔍 No job info in purchase data, but we have jobId:', jobId);
              // Try to find the job in our current jobs array first
              const foundJob = currentJobs.find(j => j._id === jobId);
              if (foundJob) {
                console.log('✅ Found job in current jobs array:', foundJob.title);
                jobInfo = foundJob;
              } else {
                console.log('⚠️ Job not found in current jobs array for ID:', jobId);
                // We'll need to mark this for individual fetching later
              }
            }
            
            // Special handling for MongoDB ObjectId payment keys (newer backend format)
            // If paymentKey looks like a MongoDB ObjectId and we don't have other info,
            // we might need to extract job info from other fields or fetch from API
            if (paymentKey && paymentKey.length === 24 && !paymentKey.includes('_') && !jobInfo) {
              console.log('⚠️ PaymentKey appears to be MongoDB ObjectId format:', paymentKey);
              console.log('🔍 Looking for additional job context in purchase object...');
              
              // Look for job context in metadata, description, or other fields
              if (purchase.metadata && purchase.metadata.jobId) {
                jobId = purchase.metadata.jobId;
                console.log('📋 Found jobId in metadata:', jobId);
              } else if (purchase.description && purchase.description.includes('Job:')) {
                // Try to extract job info from description if available
                const jobMatch = purchase.description.match(/Job:\s*([^,\n]+)/);
                if (jobMatch) {
                  const jobTitle = jobMatch[1].trim();
                  console.log('📋 Extracted job title from description:', jobTitle);
                  // Try to find job by title
                  const jobByTitle = currentJobs.find(j => j.title.toLowerCase().includes(jobTitle.toLowerCase()));
                  if (jobByTitle) {
                    jobId = jobByTitle._id;
                    jobInfo = jobByTitle;
                    console.log('✅ Found job by title match:', jobByTitle.title);
                  }
                }
              }
            }
            
            // Create a paymentKey if missing - use job+level combination for uniqueness
            if (!paymentKey && jobId) {
              paymentKey = `${jobId}_${level}`;
            }
            
            // If job info is missing from the purchase, try to fetch it
            if (!jobInfo && jobId) {
              try {
                console.log('🔍 Missing job info for purchase, trying to fetch:', jobId);
                const job = currentJobs.find(j => j._id === jobId);
                if (job) {
                  jobInfo = job;
                  console.log('✅ Found job in current jobs array:', job.title);
                } else {
                  // Fallback - try to fetch individual job from API
                  console.log('⚠️ Job not found in current jobs array, fetching from API:', jobId);
                  try {
                    const fetchedJob = await jobService.getJobById(jobId);
                    if (fetchedJob) {
                      jobInfo = fetchedJob;
                      console.log('✅ Successfully fetched job from API:', fetchedJob.title);
                      
                      // Add the fetched job to our local jobs array to prevent future API calls
                      setJobs(prevJobs => {
                        const exists = prevJobs.some(j => j._id === fetchedJob._id);
                        if (!exists) {
                          console.log('📌 Adding fetched job to local jobs array');
                          return [...prevJobs, fetchedJob];
                        }
                        return prevJobs;
                      });
                    } else {
                      console.log('⚠️ API returned null/undefined for job ID:', jobId);
                    }
                  } catch (apiError) {
                    console.error('Failed to fetch job from API:', apiError);
                    console.log('🔍 Will attempt to use existing job title if available...');
                  }
                }
              } catch (error) {
                console.error('Error fetching individual job:', error);
              }
            }
            
            // Final fallback - if we still don't have job info but we have metadata about the job
            if (!jobInfo && !jobId) {
              console.log('⚠️ No job info and no job ID found, trying alternative methods...');
              
              // Try to extract any job information from the purchase object itself
              if (purchase.testTitle && purchase.testTitle !== 'Psychometric Assessment') {
                console.log('📋 Trying to use test title as job indicator:', purchase.testTitle);
                // See if test title contains job information
                const titleMatch = currentJobs.find(j => 
                  purchase.testTitle.toLowerCase().includes(j.title.toLowerCase()) ||
                  j.title.toLowerCase().includes(purchase.testTitle.toLowerCase())
                );
                if (titleMatch) {
                  console.log('✅ Found job by test title correlation:', titleMatch.title);
                  jobInfo = titleMatch;
                  jobId = titleMatch._id;
                }
              }
              
              // Try using any available context
              if (!jobInfo && purchase.context) {
                console.log('📋 Checking purchase context for job information...');
                // This would be backend-specific logic
              }
            }

            // Generate payment key if missing
            if (!paymentKey && jobId && purchase.level) {
              paymentKey = `${jobId}_${purchase.level}`;
            } else if (!paymentKey && purchase._id) {
              paymentKey = purchase._id; // Use purchase ID as fallback
            }

            // Map backend approval status to frontend format
            let mappedApprovalStatus = 'pending';
            let canRequestApproval = false;
            
            switch (purchase.approvalStatus) {
              case 'not_required':
                mappedApprovalStatus = 'approved'; // Can start test immediately
                canRequestApproval = false;
                break;
              case 'pending_approval':
                mappedApprovalStatus = 'pending';
                canRequestApproval = false; // Already requested
                break;
              case 'approved':
                mappedApprovalStatus = 'approved';
                canRequestApproval = false;
                break;
              case 'rejected':
                mappedApprovalStatus = 'rejected';
                canRequestApproval = true; // Can request again
                break;
              default:
                mappedApprovalStatus = 'pending';
                canRequestApproval = true; // Unknown state, allow request
            }

            const mappedPayment = {
              paymentKey: paymentKey || `unknown_${Date.now()}`,
              jobId: jobId || '',
              jobTitle: jobInfo?.title || testInfo?.title || 'Unknown Job',
              level: level, // Use the extracted level
              cost: cost,
              attemptsRemaining: purchase.remainingAttempts ?? (purchase.maxAttempts - purchase.attemptsUsed) ?? 3,
              approvalStatus: mappedApprovalStatus,
              canRequestApproval: canRequestApproval,
              requestedAt: purchase.approvalRequestedAt,
              approvedAt: purchase.approvedAt,
              rejectedAt: purchase.rejectedAt,
              lastPaymentDate: purchase.purchasedAt || purchase.createdAt || new Date().toISOString(),
              // Keep the original backend status for debugging
              originalApprovalStatus: purchase.approvalStatus,
            };

            console.log('✅ Mapped payment:', mappedPayment);
            return mappedPayment;
          })
        );

        // Check for status changes
        const statusChanges = updatedPayments.filter(updatedPayment => {
          const currentPayment = currentPayments.find(p => p.paymentKey === updatedPayment.paymentKey);
          return currentPayment && currentPayment.approvalStatus !== updatedPayment.approvalStatus;
        });

        // Show notifications for status changes
        statusChanges.forEach(payment => {
          if (payment.approvalStatus === 'approved') {
            setSnackbar({
              open: true,
              message: `Test "${payment.jobTitle} - Level ${payment.level}" has been approved! You can now start the test.`,
              severity: 'success'
            });
          } else if (payment.approvalStatus === 'rejected') {
            setSnackbar({
              open: true,
              message: `Test "${payment.jobTitle} - Level ${payment.level}" was rejected. Please contact support for details.`,
              severity: 'error'
            });
          }
        });

        // Update state with fresh data
        setUserPayments(updatedPayments);
        saveUserPayments(updatedPayments);
        
        console.log('📊 Refreshed user payments:', updatedPayments.length, 'payments');
        console.log('🔄 Status changes detected:', statusChanges.length);
      }
    } catch (error) {
      console.error('Error refreshing user payments:', error);
      // Don't show error snackbar for automatic refreshes to avoid spam
    } finally {
      setRefreshing(false);
    }
  };

  // Manual refresh with user feedback
  const handleManualRefresh = async () => {
    setSnackbar({
      open: true,
      message: 'Refreshing test status...',
      severity: 'info'
    });
    
    try {
      await refreshUserPayments();
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: 'Test status updated successfully!',
          severity: 'success'
        });
      }, 500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh status. Please try again.',
        severity: 'error'
      });
    }
  };

  // Auto-refresh effect for pending approvals
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    const pendingApprovals = userPayments.filter(p => p.approvalStatus === 'pending');
    
    if (pendingApprovals.length > 0) {
      console.log(`🔄 Setting up auto-refresh for ${pendingApprovals.length} pending approval(s)...`);
      
      // Determine refresh interval based on recency of approval requests
      const recentRequests = pendingApprovals.filter(p => {
        if (!p.requestedAt) return false;
        const requestTime = new Date(p.requestedAt);
        const now = new Date();
        const minutesAgo = (now.getTime() - requestTime.getTime()) / (1000 * 60);
        return minutesAgo < 5; // Recent if within last 5 minutes
      });
      
      const refreshInterval = recentRequests.length > 0 ? 5000 : 10000; // 5s for recent, 10s for older
      
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing payments for approval status updates...');
        console.log(`🚀 Using ${refreshInterval/1000}s interval (recent requests: ${recentRequests.length})`);
        refreshUserPayments();
      }, refreshInterval);
    } else if (interval) {
      console.log('✅ Clearing auto-refresh - no pending approvals');
      clearInterval(interval);
      interval = null;
    }
    
    return () => {
      if (interval) {
        console.log('🧹 Cleaning up auto-refresh interval');
        clearInterval(interval);
      }
    };
  }, [userPayments]);

  const fetchTests = async () => {
    try {
      const response = await psychometricTestService.getPsychometricTests({}, 1, 50);
      setTests(response.data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setTests([]);
    }
  };

  const fetchResults = async () => {
    try {
      const results = await psychometricTestService.getUserTestResults();
      setResults(results || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await jobService.getJobs({ status: 'active' });
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchUserData = async () => {
    try {
      if (user?._id) {
        const userData = await userService.getProfile(user._id);
        setFreshUserData(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFreeTest = (category: FreeTestCategory) => {
    // Create a serializable version of category excluding React elements
    const serializableCategory = {
      id: category.id,
      title: category.title,
      description: category.description,
      testCount: category.testCount,
      questionCount: category.questionCount,
      color: category.color,
      difficulty: category.difficulty,
      timeLimit: category.timeLimit,
      isFree: category.isFree
    };

    // Navigate to free test page
    navigate(`/test/free/${category.id}`, {
      state: {
        category: serializableCategory,
        returnUrl: '/app/tests'
      }
    });
  };

  const handleStartJobSpecificTest = () => {
    setJobSelectionOpen(true);
  };

  // New function specifically for starting approved saved assessments
  const handleStartApprovedTest = async (payment: PaymentInfo) => {
    try {
      console.log('🎯 Starting approved test for payment:', {
        jobId: payment.jobId,
        jobTitle: payment.jobTitle,
        level: payment.level,
        paymentKey: payment.paymentKey
      });

      // Check if we have a valid jobId
      if (!payment.jobId || payment.jobId.trim() === '') {
        console.error('❌ No job ID found in payment:', payment);
        
        // Try to extract jobId from paymentKey if it's in format "jobId_level"
        let extractedJobId = null;
        if (payment.paymentKey && payment.paymentKey.includes('_')) {
          const parts = payment.paymentKey.split('_');
          if (parts.length >= 2 && !isNaN(parseInt(parts[parts.length - 1]))) {
            extractedJobId = parts.slice(0, -1).join('_'); // All parts except the last (level)
          }
        }
        
        if (extractedJobId) {
          console.log('🔍 Extracted job ID from payment key:', extractedJobId);
          payment.jobId = extractedJobId; // Update the payment object
        } else {
          // If we can't extract jobId from paymentKey, this means the backend data is incomplete
          console.log('⚠️ Payment key appears to be a MongoDB ObjectId, trying alternative approaches...');
          console.log('📋 Searching for job by title or other criteria...');
          
          // Try to find job by title if available and not "Unknown Job"
          if (payment.jobTitle && payment.jobTitle !== 'Unknown Job') {
            console.log('🔍 Attempting to find job by title:', payment.jobTitle);
            
            // First try exact match
            let jobByTitle = jobs.find(j => j.title === payment.jobTitle);
            
            // If exact match fails, try partial match
            if (!jobByTitle) {
              jobByTitle = jobs.find(j => 
                j.title.toLowerCase().includes(payment.jobTitle.toLowerCase()) ||
                payment.jobTitle.toLowerCase().includes(j.title.toLowerCase())
              );
            }
            
            if (jobByTitle) {
              console.log('✅ Found job by title match:', jobByTitle._id, jobByTitle.title);
              payment.jobId = jobByTitle._id;
              // Update the payment object with correct job title
              payment.jobTitle = jobByTitle.title;
            } else {
              console.log('🔍 Job not found by title, refreshing jobs list...');
              setSnackbar({
                open: true,
                message: 'Updating job information, please wait...',
                severity: 'info'
              });
              
              // Refresh jobs and try again
              try {
                setLoadingJobs(true);
                await fetchJobs();
                
                // Wait for jobs state to update
                await new Promise(resolve => setTimeout(resolve, 500));
                setLoadingJobs(false);
                
                // Get updated jobs from the state after refresh
                const currentJobs = jobs.length > 0 ? jobs : await jobService.getJobs({ status: 'active' }).then(res => res.data || []);
                
                const refreshedJob = currentJobs.find(j => 
                  j.title === payment.jobTitle ||
                  j.title.toLowerCase().includes(payment.jobTitle.toLowerCase()) ||
                  payment.jobTitle.toLowerCase().includes(j.title.toLowerCase())
                );
                
                if (refreshedJob) {
                  console.log('✅ Found job after refresh:', refreshedJob._id, refreshedJob.title);
                  payment.jobId = refreshedJob._id;
                  payment.jobTitle = refreshedJob.title;
                } else {
                  throw new Error('Job not found after refresh');
                }
              } catch (error) {
                setLoadingJobs(false);
                console.error('Failed to refresh jobs:', error);
                setSnackbar({
                  open: true,
                  message: `Cannot find job "${payment.jobTitle}". The job may have been removed or renamed. Please try refreshing the page or contact support. (Payment ID: ${payment.paymentKey})`,
                  severity: 'error'
                });
                return;
              }
            }
          } else {
            // If no useful job title, try to refresh payments data first
            console.log('🔄 No useful job title, attempting to refresh payment data...');
            setSnackbar({
              open: true,
              message: 'Refreshing payment data to get complete job information...',
              severity: 'info'
            });
            
            try {
              await refreshUserPayments();
              
              // Find the updated payment after refresh
              const updatedPayments = JSON.parse(localStorage.getItem(`psychometric_payments_${user?._id}`) || '[]');
              const updatedPayment = updatedPayments.find(p => p.paymentKey === payment.paymentKey);
              
              if (updatedPayment && updatedPayment.jobId && updatedPayment.jobId !== payment.jobId) {
                console.log('✅ Found updated job ID after payment refresh:', updatedPayment.jobId);
                payment.jobId = updatedPayment.jobId;
                payment.jobTitle = updatedPayment.jobTitle;
              } else {
                throw new Error('No job information found after payment refresh');
              }
            } catch (error) {
              console.error('Failed to refresh payment data:', error);
              // Let's provide more specific guidance based on the payment ID
              console.error('🚨 Payment processing failed for ID:', payment.paymentKey);
              console.error('🚨 Current payment object:', JSON.stringify(payment, null, 2));
              
              setSnackbar({
                open: true,
                message: `Assessment data incomplete after approval. This often happens when backend data changes during approval. Please try refreshing the page or contact support with Payment ID: ${payment.paymentKey}`,
                severity: 'warning'
              });
              
              // Try one more automatic refresh before giving up
              console.log('🔄 Attempting one final data refresh...');
              try {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                await refreshUserPayments();
                setSnackbar({
                  open: true,
                  message: 'Data refreshed. Please try starting the test again.',
                  severity: 'info'
                });
              } catch (finalError) {
                console.error('Final refresh failed:', finalError);
              }
              return;
            }
          }
        }
      }

      setSnackbar({
        open: true,
        message: 'Loading saved assessment...',
        severity: 'info'
      });

      // First, ensure we have the job data
      let job = jobs.find(j => j._id === payment.jobId);
      
      if (!job && payment.jobId) {
        console.log('🔍 Job not found in current list, fetching from API...', payment.jobId);
        setSnackbar({
          open: true,
          message: 'Loading job information...',
          severity: 'info'
        });
        
        try {
          // Try to fetch the individual job first
          job = await jobService.getJobById(payment.jobId);
          console.log('✅ Fetched job from API:', job?.title);
          
          // Add the fetched job to our jobs array to prevent future fetches
          if (job) {
            setJobs(prevJobs => {
              const exists = prevJobs.some(j => j._id === job!._id);
              return exists ? prevJobs : [...prevJobs, job!];
            });
          }
        } catch (fetchError) {
          console.log('❌ Individual fetch failed, refreshing all jobs...', fetchError);
          // Fallback - refresh all jobs and try again
          setLoadingJobs(true);
          await fetchJobs();
          setLoadingJobs(false);
          job = jobs.find(j => j._id === payment.jobId);
        }
      }

      if (!job) {
        console.error('❌ Job not found after all attempts:', { 
          paymentJobId: payment.jobId, 
          availableJobIds: jobs.map(j => j._id).slice(0, 5) // Show first 5 for debugging
        });
        
        setSnackbar({
          open: true,
          message: `Job information not found (ID: ${payment.jobId}). The job may have been removed. Please contact support.`,
          severity: 'error'
        });
        return;
      }

      console.log('✅ Job found, setting up test for approved assessment:', {
        jobTitle: job.title,
        level: payment.level,
        paymentKey: payment.paymentKey
      });

      // Set the selected job and level from the saved payment
      setSelectedJob(job);
      setSelectedLevel(payment.level);
      
      // Clear any existing generated tests to force regeneration with correct job data
      setGeneratedTests([]);
      setTestBlueprint(null);
      setAiGeneratedQuestions([]);
      
      // Generate tests for this specific job and level
      setGeneratingTest(true);
      
      try {
        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate tests for the approved job
        await generateTestsForJob(job);
        
        // Show the test card when ready
        setShowTestCard(true);
        setCurrentTab(0); // Switch to free tests tab to show the test card
        
        setSnackbar({
          open: true,
          message: `Assessment ready for ${job.title} - Level ${payment.level}!`,
          severity: 'success'
        });
        
        console.log('✅ Approved test successfully prepared and ready to start');
        
      } catch (error) {
        console.error('❌ Error generating test for approved assessment:', error);
        setSnackbar({
          open: true,
          message: 'Failed to prepare the test. Please try again or contact support.',
          severity: 'error'
        });
      } finally {
        setGeneratingTest(false);
      }
      
    } catch (error) {
      console.error('❌ Error starting approved test:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load assessment. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleJobSelection = (job: Job) => {
    setSelectedJob(job);
    setJobSelectionOpen(false);
    setTestDialogOpen(true);
  };

  const handleLevelSelection = async (level: number) => {
    setSelectedLevel(level);
    
    // If tests are not generated yet or level changed, regenerate tests
    if (generatedTests.length === 0 || selectedLevel !== level) {
      setGeneratingTest(true);
      
      try {
        // Simulate AI processing time for generating tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate tests for the selected job if not already done
        if (selectedJob) {
          await generateTestsForJob(selectedJob);
        }
      } catch (error) {
        console.error('Error generating tests:', error);
      } finally {
        setGeneratingTest(false);
      }
    }
  };

  const generateTestsForJob = async (job: Job) => {
    try {
      // Extract skills from job description and requirements
      const extractSkillsFromText = (text: string): string[] => {
        const commonSkills = [
          'communication', 'leadership', 'teamwork', 'problem-solving', 'analytical thinking',
          'project management', 'time management', 'adaptability', 'creativity', 'attention to detail',
          'customer service', 'technical skills', 'data analysis', 'strategic planning', 'negotiation'
        ];
        
        const foundSkills = commonSkills.filter(skill => 
          text.toLowerCase().includes(skill.toLowerCase())
        );
        
        // Add job-specific skills based on title
        const jobTitle = job.title.toLowerCase();
        if (jobTitle.includes('developer') || jobTitle.includes('engineer')) {
          foundSkills.push('programming', 'software development', 'debugging');
        }
        if (jobTitle.includes('manager') || jobTitle.includes('lead')) {
          foundSkills.push('leadership', 'team management', 'decision making');
        }
        if (jobTitle.includes('analyst')) {
          foundSkills.push('data analysis', 'research', 'reporting');
        }
        if (jobTitle.includes('sales') || jobTitle.includes('marketing')) {
          foundSkills.push('sales', 'customer relations', 'market research');
        }
        
        return [...new Set(foundSkills)].slice(0, 8); // Maximum 8 skills
      };

      // Determine industry from company or job description
      const determineIndustry = (job: Job): string => {
        const text = `${job.title} ${job.description} ${job.company}`.toLowerCase();
        
        if (text.includes('tech') || text.includes('software') || text.includes('IT')) return 'Technology';
        if (text.includes('health') || text.includes('medical') || text.includes('hospital')) return 'Healthcare';
        if (text.includes('finance') || text.includes('bank') || text.includes('investment')) return 'Finance';
        if (text.includes('education') || text.includes('school') || text.includes('university')) return 'Education';
        if (text.includes('retail') || text.includes('store') || text.includes('shopping')) return 'Retail';
        if (text.includes('government') || text.includes('public') || text.includes('municipal')) return 'Government';
        if (text.includes('nonprofit') || text.includes('ngo') || text.includes('charity')) return 'Non-Profit';
        
        return 'General Business';
      };

      console.log('ðŸ” Analyzing job requirements and generating AI test...', job.title);

      // Step 1: Prepare parameters for backend AI generation
      const testParams = {
        jobTitle: job.title,
        jobDescription: job.description,
        requiredSkills: extractSkillsFromText(`${job.title} ${job.description} ${job.requirements || ''}`),
        experienceLevel: job.experienceLevel || 'mid-level',
        industry: determineIndustry(job),
        testType: 'comprehensive' as const,
        questionCount: 20,
        timeLimit: 30
      };

      console.log('ðŸ“‹ Test Parameters:', testParams);

      // Step 2: Generate AI test using backend API
      console.log('ðŸ¤– Generating AI-powered test via backend...');
      const { testId, test } = await psychometricTestService.generateJobSpecificTest(testParams);
      
      console.log('âœ… Generated AI Test:', {
        testId,
        title: test.title,
        questionsCount: test.questions.length,
        timeLimit: test.timeLimit
      });

      // Step 3: Convert to our format for consistency
      const convertedQuestions: TestQuestion[] = test.questions.map((q: any) => ({
        _id: q._id || q.id,
        question: q.question,
        type: q.type === 'multiple_choice' ? 'multiple_choice' :
              q.type === 'scale' ? 'scale' :
              q.type === 'true_false' ? 'multiple_choice' :
              q.type === 'scenario' ? 'scenario' :
              'multiple_choice', // default fallback
        options: q.options || (q.type === 'true_false' ? ['True', 'False'] : []),
        scaleRange: q.scaleRange || (q.type === 'scale' ? { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] } : undefined),
        traits: q.traits || ['general'],
        weight: q.weight || 1,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        category: q.category || 'general',
        difficulty: q.difficulty || 'medium'
      }));

      // Step 4: Create comprehensive test object using AI-generated data
      const intelligentTest: PsychometricTest = {
        _id: testId,
        title: test.title,
        description: test.description,
        type: test.type || 'comprehensive',
        timeLimit: test.timeLimit || 30,
        questions: convertedQuestions,
        industry: test.industry || testParams.industry,
        jobRole: job.title,
        isActive: true,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categories: test.categories || ['comprehensive'],
        difficulty: test.difficulty || 'moderate',
        targetSkills: testParams.requiredSkills,
        targetTraits: ['problem-solving', 'communication', 'teamwork'],
        jobSpecific: test.jobSpecific || true,
        blueprint: {
          totalCategories: test.categories?.length || 1,
          categoryCoverage: test.categories?.map((category: string) => ({
            name: category,
            questionCount: Math.floor(convertedQuestions.length / (test.categories?.length || 1))
          })) || [{ name: 'comprehensive', questionCount: convertedQuestions.length }]
        }
      };

      setGeneratedTests([intelligentTest]);
      
      // Update state for UI display
      setTestBlueprint({
        categories: test.categories?.map((cat: string) => ({ name: cat, weight: 1 })) || [{ name: 'comprehensive', weight: 1 }],
        skills: testParams.requiredSkills,
        traits: ['problem-solving', 'communication', 'teamwork'],
        totalQuestions: convertedQuestions.length,
        difficulty: test.difficulty || 'moderate',
        timeLimit: test.timeLimit || 30,
        totalTimeLimit: (test.timeLimit || 30) * 60
      });
      
      setAiGeneratedQuestions(convertedQuestions.map(q => ({
        _id: q._id,
        question: q.question,
        type: q.type,
        options: q.options,
        traits: q.traits,
        weight: q.weight,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        category: q.category,
        difficulty: q.difficulty
      })));

      console.log('ðŸŽ¯ AI Test Successfully Generated via Backend:', {
        title: intelligentTest.title,
        categories: intelligentTest.categories,
        questionCount: intelligentTest.questions.length,
        timeLimit: intelligentTest.timeLimit,
        difficulty: intelligentTest.difficulty,
        skills: testParams.requiredSkills,
        industry: testParams.industry
      });

    } catch (error) {
      console.error('âŒ Error generating AI-powered test:', error);
      // Fallback to basic test if AI generation fails
      const fallbackTest = await generateFallbackTest(job);
      setGeneratedTests([fallbackTest]);
    }
  };

  const generateFallbackTest = async (job: Job): Promise<PsychometricTest> => {
    return {
      _id: `fallback-${job._id}-${selectedLevel}`,
      title: `${job.title} Basic Assessment - Level ${selectedLevel}`,
      description: `Standard assessment for ${job.title} position at ${job.company}`,
      type: 'behavioral',
      timeLimit: testLevels[selectedLevel - 1].estimatedTime,
      questions: generateMockQuestions(testLevels[selectedLevel - 1].questionCount),
      industry: job.skills[0] || 'General',
      jobRole: job.title,
      isActive: true,
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const generateMockQuestions = (count: number): TestQuestion[] => {
    const questions: TestQuestion[] = [];
    
    for (let i = 0; i < count; i++) {
      questions.push({
        _id: `q-${i}`,
        question: `Assessment question ${i + 1} for this specific role. How would you approach this workplace scenario?`,
        type: 'multiple_choice',
        options: [
          'Strongly Disagree',
          'Disagree', 
          'Neutral',
          'Agree',
          'Strongly Agree'
        ],
        traits: ['analytical', 'leadership', 'teamwork'],
        weight: 1
      });
    }
    
    return questions;
  };

  const handleBeginTest = (test: PsychometricTest) => {
    // Check if user has paid for this level and has attempts remaining
    const testLevel = testLevels.find(level => level.level === selectedLevel);
    if (!testLevel || !selectedJob) return;

    // Create payment key for this specific job-level combination
    const paymentKey = `${selectedJob._id}_${selectedLevel}`;
    
    // Find payment for this specific job-level combination
    const paymentInfo = userPayments.find(p => 
      p.paymentKey === paymentKey && 
      p.approvalStatus === 'approved' && 
      p.attemptsRemaining > 0
    );
    
    if (!paymentInfo) {
      // Show payment dialog
      setSelectedTestLevel(testLevel);
      setPaymentDialogOpen(true);
      return;
    }

    // User has paid and has attempts remaining, show test card
    setReadyTest(test);
    setShowTestCard(true);
    setTestDialogOpen(false); // Close the level selection dialog
  };

  const handleStartActualTest = () => {
    if (!readyTest || !selectedJob) return;
    
    // Create payment key for this specific job-level combination
    const paymentKey = `${selectedJob._id}_${selectedLevel}`;
    
    // Decrease attempts remaining for the specific payment
    const updatedPayments = userPayments.map(p => 
      p.paymentKey === paymentKey && p.approvalStatus === 'approved' && p.attemptsRemaining > 0
        ? { ...p, attemptsRemaining: p.attemptsRemaining - 1 }
        : p
    );
    
    setUserPayments(updatedPayments);
    saveUserPayments(updatedPayments);
    
    // Create test data to pass to new page
    const testData = {
      test: readyTest,
      selectedJob,
      selectedLevel,
      user: user?._id,
      userPayments: updatedPayments,
      paymentKey
    };
    
    // Store test data in sessionStorage for the new page
    sessionStorage.setItem('psychometricTestData', JSON.stringify(testData));
    
    // Navigate to test page
    navigate(`/test/${readyTest._id}`, { 
      state: { 
        testData,
        returnUrl: '/app/tests'
      }
    });
  };

  const handlePayment = async () => {
    if (!selectedTestLevel || !selectedJob) return;
    
    setProcessingPayment(true);
    
    try {
      // Simulate payment processing (for now, just add to user payments)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Create a unique key for this job-level combination
      const paymentKey = `${selectedJob._id}_${selectedTestLevel.level}`;
      
      const newPayment: PaymentInfo & {
        jobId?: string;
        jobTitle?: string;
        paymentKey?: string;
      } = {
        level: selectedTestLevel.level,
        cost: selectedTestLevel.cost,
        attemptsRemaining: 3, // 3 attempts per payment
        lastPaymentDate: new Date().toISOString(),
        approvalStatus: 'pending',
        jobId: selectedJob._id,
        jobTitle: selectedJob.title,
        paymentKey: paymentKey
        // requestedAt will be set when user clicks "Request Approval"
      };
      
      // Always add new payment - don't update existing ones to allow multiple purchases
      const updatedPayments = [...userPayments, newPayment];
      
      setUserPayments(updatedPayments);
      saveUserPayments(updatedPayments);
      
      setPaymentDialogOpen(false);
      
      // Reset level selection to allow for new selections
      setSelectedLevel(1);
      setTestDialogOpen(false);
      
      // Switch to saved assessments tab to show the purchased assessment
      setCurrentTab(2);
      
      // Show success message with more details
      alert(`Payment successful for ${selectedJob.title} - Level ${selectedTestLevel.level}! Your assessment has been saved. Go to the Saved Assessments tab and click "Request Approval" to get admin approval before starting.`);
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleRequestApproval = async (paymentKey: string) => {
    try {
      console.log('🔄 Requesting approval for:', paymentKey);
      
      // Find the payment info for this payment key
      const payment = userPayments.find(p => p.paymentKey === paymentKey);
      if (!payment) {
        setSnackbar({
          open: true,
          message: 'Payment information not found',
          severity: 'error'
        });
        return;
      }

      // Use the actual purchase ID from the backend response (stored in paymentKey if it's the _id)
      const purchaseId = payment.paymentKey;
      console.log('📝 Using purchase ID:', purchaseId);

      // Make the real API call to request approval
      try {
        const response = await psychometricTestService.requestTestApproval(purchaseId);
        console.log('✅ Approval requested successfully:', response);
        
        // Update local state only if API call succeeds
        const updatedPayments = userPayments.map(p => 
          p.paymentKey === paymentKey 
            ? { 
                ...p, 
                approvalStatus: 'pending' as const,
                requestedAt: new Date().toISOString()
              }
            : p
        );
        
        setUserPayments(updatedPayments);
        saveUserPayments(updatedPayments);
        
        setSnackbar({
          open: true,
          message: `Approval request submitted for ${payment.jobTitle}! Admin will review soon.`,
          severity: 'success'
        });

        // Refresh the payments to get the latest status
        setTimeout(() => refreshUserPayments(), 1000);

      } catch (apiError) {
        console.warn('API call failed:', apiError);
        
        setSnackbar({
          open: true,
          message: 'Failed to request approval. Please try again or contact support.',
          severity: 'error'
        });
        
        alert(`Approval request saved locally for ${payment.jobTitle} - Level ${payment.level}! Your request will be processed when connection is restored.`);
      }
      
    } catch (error) {
      console.error('Error requesting approval:', error);
      alert('Failed to submit approval request. Please try again.');
    }
  };



  const getAttemptsRemaining = (level: number): number => {
    if (!selectedJob) return 0;
    const paymentKey = `${selectedJob._id}_${level}`;
    const paymentInfo = userPayments.find(p => 
      p.paymentKey === paymentKey && 
      p.approvalStatus === 'approved'
    );
    return paymentInfo ? paymentInfo.attemptsRemaining : 0;
  };

  const hasValidPayment = (level: number): boolean => {
    if (!selectedJob) return false;
    const paymentKey = `${selectedJob._id}_${level}`;
    const paymentInfo = userPayments.find(p => 
      p.paymentKey === paymentKey && 
      p.approvalStatus === 'approved'
    );
    return paymentInfo ? paymentInfo.attemptsRemaining > 0 : false;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (selectedTest && currentQuestion < selectedTest.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handleSubmitTest = async () => {
    if (!selectedTest) return;

    try {
      const result = await psychometricTestService.submitTest(selectedTest._id, answers);
      setTestResult(result);
      setTakingTest(false);
      setCurrentQuestion(0);
      setAnswers({});
      fetchResults(); // Refresh results
    } catch (error) {
      console.error('Error submitting test:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Job Selection Dialog
  const JobSelectionDialog = () => (
    <Dialog 
      open={jobSelectionOpen} 
      onClose={() => setJobSelectionOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          Select a Job Position
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose the job you want to take a psychometric test for
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loadingJobs ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {jobs.map((job) => (
              <Grid item xs={12} sm={6} key={job._id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s'
                  }}
                  onClick={() => handleJobSelection(job)}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {job.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {job.company} â€¢ {job.location}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {job.description.substring(0, 100)}...
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {job.skills.slice(0, 3).map((skill, index) => (
                        <Chip key={index} label={skill} size="small" />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setJobSelectionOpen(false)}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Test Level Dialog
  const TestLevelDialog = () => (
    <Dialog 
      open={testDialogOpen} 
      onClose={() => setTestDialogOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          Choose Assessment Level
        </Typography>
        {selectedJob && (
          <Typography variant="body2" color="text.secondary">
            Psychometric assessment for {selectedJob.title} at {selectedJob.company}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {generatingTest ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              ðŸ¤– AI Processing Your Selection...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Analyzing job requirements and generating personalized tests
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              p: 2, 
              bgcolor: 'primary.50', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'primary.200'
            }}>
              <SmartToy color="primary" />
              <Typography variant="body2" color="primary.main">
                Creating Level {selectedLevel} assessment for {selectedJob?.title}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {testLevels.map((testLevel, index) => {
              const test = generatedTests.find(t => t._id.includes(`-${testLevel.level}`));
              return (
                <Grid item xs={12} md={4} key={testLevel.level}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      border: selectedLevel === testLevel.level ? '2px solid' : '1px solid',
                      borderColor: selectedLevel === testLevel.level ? 'primary.main' : 'divider',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                    onClick={() => handleLevelSelection(testLevel.level)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            mx: 'auto',
                            mb: 2,
                            bgcolor: `${testLevel.level === 1 ? 'success' : testLevel.level === 2 ? 'warning' : 'error'}.main`
                          }}
                        >
                          <Typography variant="h4" fontWeight="bold">
                            {testLevel.level}
                          </Typography>
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {testLevel.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {testLevel.description}
                        </Typography>
                      </Box>
                      
                      <Stack spacing={1} alignItems="center">
                        <Typography variant="body2" display="flex" alignItems="center">
                          <Timer fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                          {testLevel.estimatedTime} minutes
                        </Typography>
                        <Typography variant="body2" display="flex" alignItems="center">
                          <Assessment fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                          {testLevel.questionCount} questions
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          <AttachMoney fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                          {testLevel.cost.toLocaleString()} FRW
                        </Typography>
                        {hasValidPayment(testLevel.level) && (
                          <Typography variant="body2" color="success.main">
                            <CheckCircle fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {getAttemptsRemaining(testLevel.level)} attempts remaining
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                      {test && (
                        <Button
                          variant={selectedLevel === testLevel.level ? "contained" : "outlined"}
                          startIcon={
                            generatingTest && selectedLevel === testLevel.level 
                              ? <CircularProgress size={20} /> 
                              : hasValidPayment(testLevel.level) 
                                ? <PlayArrow /> 
                                : <AttachMoney />
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBeginTest(test);
                          }}
                          color={hasValidPayment(testLevel.level) ? "primary" : "warning"}
                          disabled={generatingTest && selectedLevel === testLevel.level}
                        >
                          {generatingTest && selectedLevel === testLevel.level
                            ? 'Generating...'
                            : hasValidPayment(testLevel.level) 
                              ? `Start Level ${testLevel.level}` 
                              : `Pay ${testLevel.cost.toLocaleString()} FRW`}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTestDialogOpen(false)}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Test Ready Card
  const TestReadyCard = () => {
    if (!showTestCard || !readyTest) return null;

    const testLevel = testLevels.find(level => level.level === selectedLevel);
    const attemptsRemaining = getAttemptsRemaining(selectedLevel);

    return (
      <Dialog 
        open={showTestCard} 
        onClose={() => setShowTestCard(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                âœ… Test Ready!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your personalized assessment has been generated
              </Typography>
            </Box>
            <IconButton onClick={() => setShowTestCard(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>ðŸŽ‰ Assessment Generated Successfully!</AlertTitle>
            Your AI-powered psychometric test for <strong>{selectedJob?.title}</strong> is ready to begin.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.200' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Assessment />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {readyTest.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testLevel?.difficulty} Level Assessment
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Duration:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {readyTest.timeLimit} minutes
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Questions:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {readyTest.questions.length}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Job Role:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedJob?.title}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Company:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedJob?.company}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', bgcolor: 'warning.50', border: '2px solid', borderColor: 'warning.200' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <Timer />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Attempts Remaining
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Use them wisely
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box textAlign="center" py={2}>
                    <Typography variant="h2" fontWeight="bold" color="warning.main">
                      {attemptsRemaining}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      attempts left
                    </Typography>
                  </Box>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Each attempt will be recorded. Make sure you're in a quiet environment before starting.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>

            {/* Job-Specific Test Information */}
            {testBlueprint && readyTest?.jobSpecific && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.200' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        ðŸŽ¯
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          Job-Specific Assessment Blueprint
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tailored assessment based on role requirements
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography variant="subtitle2" color="primary.main" fontWeight="bold" gutterBottom>
                            ðŸŽ¯ Target Skills
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {testBlueprint.skills.slice(0, 6).map((skill, index) => (
                              <Chip
                                key={index}
                                label={skill}
                                size="small"
                                sx={{ 
                                  bgcolor: 'primary.100',
                                  color: 'primary.800',
                                  fontSize: '0.75rem'
                                }}
                              />
                            ))}
                            {testBlueprint.skills.length > 6 && (
                              <Chip
                                label={`+${testBlueprint.skills.length - 6} more`}
                                size="small"
                                sx={{ bgcolor: 'grey.200' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography variant="subtitle2" color="primary.main" fontWeight="bold" gutterBottom>
                            ðŸ“Š Assessment Categories
                          </Typography>
                          <Stack spacing={0.5}>
                            {testBlueprint.categories.map((category, index) => (
                              <Box key={index} display="flex" alignItems="center">
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.main',
                                    mr: 1
                                  }}
                                />
                                <Typography variant="body2" fontSize="0.8rem">
                                  {category.name}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography variant="subtitle2" color="primary.main" fontWeight="bold" gutterBottom>
                            ðŸ“ˆ Assessment Details
                          </Typography>
                          <Stack spacing={1}>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" fontSize="0.8rem">Difficulty:</Typography>
                              <Chip
                                label={testBlueprint.difficulty.toUpperCase()}
                                size="small"
                                color={
                                  testBlueprint.difficulty === 'easy' ? 'success' :
                                  testBlueprint.difficulty === 'medium' ? 'warning' : 'error'
                                }
                              />
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" fontSize="0.8rem">Categories:</Typography>
                              <Typography variant="body2" fontSize="0.8rem" fontWeight="medium">
                                {testBlueprint.categories.length}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" fontSize="0.8rem">Total Questions:</Typography>
                              <Typography variant="body2" fontSize="0.8rem" fontWeight="medium">
                                {testBlueprint.totalQuestions}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" fontSize="0.8rem">Est. Time:</Typography>
                              <Typography variant="body2" fontSize="0.8rem" fontWeight="medium">
                                {Math.ceil(testBlueprint.totalTimeLimit / 60)} min
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom color="primary.main">
                  ðŸ“‹ Test Instructions
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Find a quiet, distraction-free environment" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Ensure stable internet connection" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Answer all questions honestly and thoughtfully" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Complete the test in one session" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowTestCard(false)}
            variant="outlined"
          >
            Start Later
          </Button>
          <Button 
            variant="contained" 
            onClick={handleStartActualTest}
            startIcon={<PlayArrow />}
            size="large"
            sx={{ 
              px: 4,
              py: 1.5,
              background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
              boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
            }}
          >
            Start Test Now
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Payment Dialog
  const PaymentDialog = () => (
    <Dialog 
      open={paymentDialogOpen} 
      onClose={() => setPaymentDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          Complete Payment to Start Test
        </Typography>
        {selectedTestLevel && (
          <Typography variant="body2" color="text.secondary">
            {selectedTestLevel.title} - {selectedTestLevel.difficulty} Level
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {selectedTestLevel && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Payment Information</AlertTitle>
              Complete the payment to unlock 3 test attempts for this level. You can retake the test up to 3 times after payment.
            </Alert>

            <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Test Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Level:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedTestLevel.title}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Difficulty:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedTestLevel.difficulty}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Duration:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedTestLevel.estimatedTime} minutes
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Questions:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedTestLevel.questionCount}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" color="text.secondary">
                      Total Cost:
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {selectedTestLevel.cost.toLocaleString()} FRW
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Includes 3 test attempts
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <AlertTitle>Test Mode</AlertTitle>
              Payment processing is currently disabled for testing purposes. Click "Complete Payment" to proceed with the test.
            </Alert>

            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <CheckCircle color="success" />
              <Typography variant="body2">
                Secure payment processing
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <CheckCircle color="success" />
              <Typography variant="body2">
                3 test attempts included
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircle color="success" />
              <Typography variant="body2">
                Detailed results and recommendations
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={() => setPaymentDialogOpen(false)}
          disabled={processingPayment}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handlePayment}
          disabled={processingPayment}
          startIcon={processingPayment ? <CircularProgress size={20} /> : <AttachMoney />}
          sx={{ 
            px: 4,
            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
          }}
        >
          {processingPayment ? 'Processing...' : 'Complete Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (!user) {
    return null;
  }

  return (
    <SimpleProfileGuard feature="psychometricTests">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Psychometric Tests
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Discover your potential with professional assessments
          </Typography>
          
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <LockOpen />
                  Free Tests
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Lock />
                  Job-Specific Tests
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <BookmarkBorder />
                  Saved Assessments
                  <Badge badgeContent={userPayments.length} color="primary" />
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Free Tests Tab */}
        {currentTab === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 4 }}>
              <AlertTitle>Free Psychometric Tests</AlertTitle>
              Take these professional-grade assessments at no cost. Perfect for understanding your strengths and areas for development.
            </Alert>

            <Grid container spacing={3}>
              {freeTestCategories.map((category) => (
                <Grid item xs={12} md={6} lg={4} key={category.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        borderColor: category.color
                      },
                      transition: 'all 0.3s',
                      border: '2px solid',
                      borderColor: 'transparent'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: category.color, 
                            mr: 2,
                            width: 56,
                            height: 56
                          }}
                        >
                          {category.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {category.title}
                          </Typography>
                          <Chip 
                            label="FREE" 
                            size="small" 
                            color="success" 
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 80 }}>
                        {category.description.substring(0, 120)}...
                      </Typography>
                      
                      <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Tests:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {category.testCount}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Questions:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {category.questionCount}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Time:</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {category.timeLimit} min
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Difficulty:</Typography>
                          <Chip 
                            label={category.difficulty} 
                            size="small" 
                            color={
                              category.difficulty === 'Easy' ? 'success' :
                              category.difficulty === 'Medium' ? 'warning' : 'error'
                            }
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                    
                    <CardActions sx={{ p: 3, pt: 0 }}>
                      <Stack direction="row" spacing={1} width="100%">
                        <Button 
                          variant="outlined" 
                          startIcon={<Info />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/test/details/${category.id}`);
                          }}
                          sx={{ flex: 1 }}
                        >
                          Details
                        </Button>
                        <Button 
                          variant="contained" 
                          startIcon={<PlayArrow />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartFreeTest(category);
                          }}
                          sx={{ 
                            flex: 2,
                            bgcolor: category.color,
                            '&:hover': {
                              bgcolor: category.color,
                              filter: 'brightness(0.9)'
                            }
                          }}
                        >
                          Start Test
                        </Button>
                      </Stack>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Job-Specific Tests Tab */}
        {currentTab === 1 && (
          <Box>
            <Alert severity="warning" sx={{ mb: 4 }}>
              <AlertTitle>Job-Specific Psychometric Tests</AlertTitle>
              These AI-powered assessments are tailored to specific job positions. Each test costs between 2,000 - 8,000 FRW and includes 3 attempts.
            </Alert>

            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                <Work sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                AI-Powered Job Assessments
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                Get personalized psychometric tests tailored to specific job positions. Our AI analyzes job requirements and creates custom assessments to evaluate your fit for the role.
              </Typography>
              
              <Button 
                variant="contained" 
                size="large"
                startIcon={<SmartToy />}
                onClick={handleStartJobSpecificTest}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                }}
              >
                Start Job-Specific Assessment
              </Button>
            </Paper>
          </Box>
        )}

        {/* Saved Assessments Tab */}
        {currentTab === 2 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold">
                Saved Assessments
              </Typography>
              <Button
                variant="outlined"
                onClick={handleManualRefresh}
                disabled={refreshing}
                startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
              >
                {refreshing ? 'Refreshing...' : 'Refresh Status'}
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 4 }}>
              <AlertTitle>Saved Assessments</AlertTitle>
              Manage your purchased psychometric tests. Request approval when needed and start tests when ready.
            </Alert>

            {/* Pending Approvals Alert */}
            {userPayments.some(p => p.approvalStatus === 'pending') && (
              <Alert 
                severity="info" 
                sx={{ mb: 3 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : undefined}
                  >
                    {refreshing ? 'Refreshing...' : 'Check Status'}
                  </Button>
                }
              >
                <AlertTitle>Approval Status Updates</AlertTitle>
                You have {userPayments.filter(p => p.approvalStatus === 'pending').length} test(s) 
                pending admin approval. Status updates automatically every {
                  userPayments.some(p => {
                    if (!p.requestedAt) return false;
                    const requestTime = new Date(p.requestedAt);
                    const now = new Date();
                    const minutesAgo = (now.getTime() - requestTime.getTime()) / (1000 * 60);
                    return minutesAgo < 5;
                  }) ? '5' : '10'
                } seconds, or click "Check Status" to refresh immediately.
              </Alert>
            )}

            {userPayments.length === 0 ? (
              <Paper sx={{ p: 8, textAlign: 'center' }}>
                <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No saved assessments found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Purchase a job-specific test to get started with psychometric assessments.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setCurrentTab(1)}
                  startIcon={<SmartToy />}
                >
                  Browse Job-Specific Tests
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {userPayments.map((payment) => (
                  <Grid item xs={12} md={6} key={payment.paymentKey || `${payment.jobId}_${payment.level}`}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        border: payment.approvalStatus === 'approved' ? '2px solid' : '1px solid',
                        borderColor: payment.approvalStatus === 'approved' ? 'success.main' : 
                                     payment.approvalStatus === 'pending' ? 'warning.main' : 'error.main',
                        '&:hover': { 
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[8]
                        },
                        transition: 'all 0.3s'
                      }}
                    >
                      <CardContent>
                        {/* Header */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" fontWeight="bold">
                            Level {payment.level} Assessment
                          </Typography>
                          <Chip
                            label={payment.approvalStatus === 'approved' ? 'Approved' :
                                   payment.approvalStatus === 'pending' ? 'Pending' : 'Rejected'}
                            color={payment.approvalStatus === 'approved' ? 'success' :
                                   payment.approvalStatus === 'pending' ? 'warning' : 'error'}
                            size="small"
                            sx={{
                              ...(payment.approvalStatus === 'pending' && {
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': {
                                    opacity: 1,
                                  },
                                  '50%': {
                                    opacity: 0.6,
                                  },
                                  '100%': {
                                    opacity: 1,
                                  },
                                }
                              })
                            }}
                          />
                        </Box>

                        {/* Job Information */}
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Job Position
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {payment.jobTitle || 'Unknown Job'}
                          </Typography>
                          {process.env.NODE_ENV === 'development' && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Debug: JobID = {payment.jobId} | PaymentKey = {payment.paymentKey}
                            </Typography>
                          )}
                        </Box>

                        {/* Payment Details */}
                        <Box display="flex" justifyContent="space-between" mb={2}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Cost Paid
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {payment.cost.toLocaleString()} FRW
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="body2" color="text.secondary">
                              Attempts Left
                            </Typography>
                            <Typography 
                              variant="h6" 
                              fontWeight="bold" 
                              color={payment.attemptsRemaining > 0 ? 'success.main' : 'error.main'}
                            >
                              {payment.attemptsRemaining}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Payment Date */}
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                          Purchased on {new Date(payment.lastPaymentDate || '').toLocaleDateString()}
                        </Typography>

                        {/* Progress Bar */}
                        <Box mb={2}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="caption">Attempts Used</Typography>
                            <Typography variant="caption">
                              {3 - payment.attemptsRemaining} / 3
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={((3 - payment.attemptsRemaining) / 3) * 100}
                            sx={{ height: 4, borderRadius: 2 }}
                            color={payment.attemptsRemaining > 1 ? 'primary' : payment.attemptsRemaining === 1 ? 'warning' : 'error'}
                          />
                        </Box>
                      </CardContent>

                      {/* Action Buttons */}
                      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, flexDirection: 'column' }}>
                        {/* Request Approval Button */}
                        {payment.approvalStatus === 'pending' && !payment.requestedAt && (
                          <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            startIcon={<RequestIcon />}
                            onClick={() => handleRequestApproval(payment.paymentKey || `${payment.jobId}_${payment.level}`)}
                            fullWidth
                          >
                            Request Approval
                          </Button>
                        )}

                        {/* Pending Approval Message */}
                        {payment.approvalStatus === 'pending' && payment.requestedAt && (
                          <Alert 
                            severity="info" 
                            sx={{ 
                              mb: 1,
                              animation: 'fadeIn 0.3s ease-in',
                              '@keyframes fadeIn': {
                                '0%': { opacity: 0, transform: 'translateY(-10px)' },
                                '100%': { opacity: 1, transform: 'translateY(0)' }
                              }
                            }}
                          >
                            <Typography variant="body2" fontWeight="medium">
                              Approval requested on {new Date(payment.requestedAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              ⏱️ Automatic status updates every {
                                payment.requestedAt && new Date().getTime() - new Date(payment.requestedAt).getTime() < 5 * 60 * 1000 ? '5' : '10'
                              } seconds
                            </Typography>
                          </Alert>
                        )}



                        {/* Take Assessment Button */}
                        {payment.approvalStatus === 'approved' && payment.attemptsRemaining > 0 && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<StartIcon />}
                            onClick={() => handleStartApprovedTest(payment)}
                            fullWidth
                            disabled={generatingTest}
                          >
                            {generatingTest && selectedJob?.title === payment.jobTitle ? 
                              'Preparing Assessment...' : 
                              'Take Assessment'
                            }
                          </Button>
                        )}

                        {/* No Attempts Left */}
                        {payment.attemptsRemaining === 0 && (
                          <Alert severity="warning">
                            <Typography variant="body2">
                              No attempts remaining. Purchase again to retry.
                            </Typography>
                          </Alert>
                        )}

                        {/* Rejected Status */}
                        {payment.approvalStatus === 'rejected' && (
                          <Alert severity="error">
                            <Typography variant="body2">
                              Assessment was rejected. Contact support for details.
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        <JobSelectionDialog />
        <TestLevelDialog />
        <TestReadyCard />
        <PaymentDialog />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </SimpleProfileGuard>
  );
};

export default PsychometricTestsPage;
