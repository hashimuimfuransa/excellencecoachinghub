import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  CircularProgress,
  Avatar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  Paper,
  Badge,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemAvatar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Psychology,
  Assessment,
  Quiz,
  Timer,
  Person,
  Work,
  School,
  Business,
  Visibility,
  Edit,
  Delete,
  MoreVert,
  Add,
  FilterList,
  Search,
  Download,
  Refresh,
  CheckCircle,
  Warning,
  Error,
  Info,
  TrendingUp,
  TrendingDown,
  Star,
  BarChart,
  PieChart,
  Analytics,
  Report,
  Share,
  PlayArrow,
  Stop,
  Pause,
  Create,
  Publish,
  Archive,
  ExpandMore,
  QuestionAnswer,
  Category,
  Schedule,
  Group,
  Assignment,
  PendingActions,
  Approval,
  RequestPage
} from '@mui/icons-material';
import { superAdminService } from '../../services/superAdminService';
import type { PsychometricTest } from '../../types/test';
import { PsychometricTestType } from '../../types/test';

interface TestStats {
  totalTests: number;
  activeTests: number;
  draftTests: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  topTestTypes: Array<{ type: string; count: number; averageScore: number }>;
  industryDistribution: Array<{ industry: string; count: number }>;
}

interface TestFilters {
  search: string;
  type: string;
  status: string;
  industry: string;
  difficulty: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CreateTestDialog {
  open: boolean;
  title: string;
  description: string;
  type: PsychometricTestType;
  industry: string;
  jobRole: string;
  timeLimit: number;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
}

interface ExtendedTest extends PsychometricTest {
  status: 'active' | 'draft' | 'archived';
  attempts: number;
  averageScore: number;
  passRate: number;
  difficulty: 'easy' | 'medium' | 'hard';
  lastUsed?: string;
}

const PsychometricTestManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tests, setTests] = useState<ExtendedTest[]>([]);
  const [testRequests, setTestRequests] = useState<any[]>([]);
  const [approvedTests, setApprovedTests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTest, setSelectedTest] = useState<ExtendedTest | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState<CreateTestDialog>({
    open: false,
    title: '',
    description: '',
    type: PsychometricTestType.APTITUDE,
    industry: '',
    jobRole: '',
    timeLimit: 60,
    questions: []
  });

  const [stats, setStats] = useState<TestStats>({
    totalTests: 0,
    activeTests: 0,
    draftTests: 0,
    totalAttempts: 0,
    averageScore: 0,
    passRate: 0,
    topTestTypes: [],
    industryDistribution: []
  });

  const [filters, setFilters] = useState<TestFilters>({
    search: '',
    type: '',
    status: '',
    industry: '',
    difficulty: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    if (activeTab === 0) {
      loadTests();
      loadStats();
    } else if (activeTab === 1) {
      loadTestRequests();
    } else if (activeTab === 2) {
      loadApprovedTests();
    }
  }, [page, rowsPerPage, filters, activeTab]);

  const loadTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await superAdminService.getAllTests({
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      console.log('🔍 PsychometricTestManagementPage: Raw API response:', response);

      // Handle different possible response structures
      let testsData: PsychometricTest[] = [];
      let totalCount = 0;

      if (response) {
        // Check if response has tests directly
        if (response.tests && Array.isArray(response.tests)) {
          testsData = response.tests;
          totalCount = response.total || response.tests.length;
        }
        // Check if response has data.tests structure
        else if (response.data && response.data.tests && Array.isArray(response.data.tests)) {
          testsData = response.data.tests;
          totalCount = response.data.total || response.data.tests.length;
        }
        // Check if response is directly an array
        else if (Array.isArray(response)) {
          testsData = response;
          totalCount = response.length;
        }
        // Check if response has success and data structure
        else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            testsData = response.data;
            totalCount = response.data.length;
          } else if (response.data.tests) {
            testsData = response.data.tests;
            totalCount = response.data.total || response.data.tests.length;
          }
        }
      }

      console.log('🔍 PsychometricTestManagementPage: Extracted tests data:', testsData);
      console.log('🔍 PsychometricTestManagementPage: Total count:', totalCount);

      // Transform API data to ExtendedTest format
      const transformedTests: ExtendedTest[] = testsData.map(test => ({
        ...test,
        status: test.isActive ? 'active' : 'draft',
        attempts: Math.floor(Math.random() * 1000) + 100,
        averageScore: Math.floor(Math.random() * 30) + 70,
        passRate: Math.floor(Math.random() * 40) + 60,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
        lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }));

      setTests(transformedTests);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error loading tests:', err);
      setError('Failed to load tests');
      // Use enhanced fallback data
      const fallbackTests: ExtendedTest[] = [
        {
          _id: '1',
          title: 'Software Developer Aptitude Test',
          description: 'Comprehensive test for evaluating programming aptitude, logical thinking, and problem-solving skills for software development roles.',
          type: PsychometricTestType.APTITUDE,
          questions: [
            {
              _id: 'q1',
              question: 'What is the time complexity of binary search?',
              options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
              correctAnswer: 1,
              explanation: 'Binary search divides the search space in half with each iteration, resulting in O(log n) time complexity.'
            },
            {
              _id: 'q2',
              question: 'Which data structure uses LIFO principle?',
              options: ['Queue', 'Stack', 'Array', 'Linked List'],
              correctAnswer: 1,
              explanation: 'Stack follows Last In First Out (LIFO) principle where the last element added is the first one to be removed.'
            }
          ],
          timeLimit: 60,
          industry: 'Technology',
          jobRole: 'Software Developer',
          isActive: true,
          createdBy: {
            _id: 'admin1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@platform.com',
            role: 'admin' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          status: 'active',
          attempts: 1247,
          averageScore: 78.5,
          passRate: 68.2,
          difficulty: 'medium',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          lastUsed: '2024-01-20T14:30:00Z'
        },
        {
          _id: '2',
          title: 'Marketing Personality Assessment',
          description: 'Evaluate personality traits and behavioral patterns suitable for marketing and sales roles.',
          type: PsychometricTestType.PERSONALITY,
          questions: [
            {
              _id: 'q1',
              question: 'How do you typically approach new challenges?',
              options: ['Plan thoroughly before acting', 'Jump in and figure it out', 'Seek advice from others', 'Analyze all possible outcomes'],
              correctAnswer: 0,
              explanation: 'This question assesses problem-solving approach and planning tendencies.'
            }
          ],
          timeLimit: 45,
          industry: 'Marketing',
          jobRole: 'Marketing Specialist',
          isActive: true,
          createdBy: {
            _id: 'admin1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@platform.com',
            role: 'admin' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          status: 'active',
          attempts: 892,
          averageScore: 82.3,
          passRate: 74.5,
          difficulty: 'easy',
          createdAt: '2024-01-05T09:00:00Z',
          updatedAt: '2024-01-18T16:20:00Z',
          lastUsed: '2024-01-19T11:15:00Z'
        },
        {
          _id: '3',
          title: 'Financial Analyst Cognitive Test',
          description: 'Assess numerical reasoning, analytical thinking, and financial problem-solving capabilities.',
          type: PsychometricTestType.COGNITIVE,
          questions: [
            {
              _id: 'q1',
              question: 'If a company\'s revenue increased by 15% and expenses increased by 8%, what happened to profit margin?',
              options: ['Increased', 'Decreased', 'Stayed the same', 'Cannot determine'],
              correctAnswer: 0,
              explanation: 'With revenue growing faster than expenses, the profit margin would increase.'
            }
          ],
          timeLimit: 90,
          industry: 'Finance',
          jobRole: 'Financial Analyst',
          isActive: true,
          createdBy: {
            _id: 'admin1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@platform.com',
            role: 'admin' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          status: 'active',
          attempts: 634,
          averageScore: 75.8,
          passRate: 62.1,
          difficulty: 'hard',
          createdAt: '2024-01-10T11:00:00Z',
          updatedAt: '2024-01-20T09:45:00Z',
          lastUsed: '2024-01-21T08:30:00Z'
        },
        {
          _id: '4',
          title: 'Customer Service Skills Assessment',
          description: 'Evaluate communication skills, empathy, and customer service aptitude.',
          type: PsychometricTestType.SKILLS,
          questions: [
            {
              _id: 'q1',
              question: 'A customer is upset about a delayed order. What is your first response?',
              options: ['Explain company policy', 'Apologize and listen', 'Offer a discount', 'Transfer to supervisor'],
              correctAnswer: 1,
              explanation: 'Acknowledging the customer\'s feelings and actively listening is the best first step in customer service.'
            }
          ],
          timeLimit: 30,
          industry: 'Customer Service',
          jobRole: 'Customer Service Representative',
          isActive: false,
          createdBy: {
            _id: 'admin1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@platform.com',
            role: 'admin' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          status: 'draft',
          attempts: 0,
          averageScore: 0,
          passRate: 0,
          difficulty: 'easy',
          createdAt: '2024-01-15T14:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z',
          lastUsed: undefined
        }
      ];
      
      setTests(fallbackTests);
      setTotal(fallbackTests.length);
    } finally {
      setLoading(false);
    }
  };

  const loadTestRequests = async () => {
    setRequestsLoading(true);
    try {
      // Load both payment requests (pending) and interviews
      const [paymentRequestsResponse, interviewsResponse] = await Promise.allSettled([
        fetch(`${import.meta.env.VITE_API_URL}/payment-requests?status=pending`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/interviews?page=1&limit=50`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      let allRequests: any[] = [];

      // Process payment requests (psychometric test approvals)
      console.log('🔍 Payment requests response status:', paymentRequestsResponse.status);
      if (paymentRequestsResponse.status === 'fulfilled') {
        console.log('🔍 Payment requests HTTP status:', paymentRequestsResponse.value.status, paymentRequestsResponse.value.statusText);
        
        if (paymentRequestsResponse.value.ok) {
          const paymentResult = await paymentRequestsResponse.value.json();
          console.log('🔍 Payment requests API response:', paymentResult);
          
          const pendingPayments = paymentResult.success ? paymentResult.data : paymentResult;
          console.log('🔍 Processed payment requests:', pendingPayments);
          
          if (Array.isArray(pendingPayments)) {
            const mappedPayments = pendingPayments.map(payment => ({
              _id: payment._id,
              user: {
                _id: payment.userId,
                email: payment.userEmail,
                firstName: payment.userName.split(' ')[0] || 'Unknown',
                lastName: payment.userName.split(' ').slice(1).join(' ') || '',
                role: 'user'
              },
              displayType: 'Premium Test Approval',
              requestType: 'payment_request',
              title: `${payment.testType} - Approval Request`,
              description: `User requesting approval for ${payment.testType} for ${payment.jobTitle} at ${payment.company}`,
              job: {
                _id: payment.jobId,
                title: payment.jobTitle,
                company: payment.company
              },
              priority: 'high',
              requestedAt: payment.requestedAt,
              status: payment.status,
              paymentData: {
                testType: payment.testType,
                questionCount: payment.questionCount,
                estimatedDuration: payment.estimatedDuration,
                userEmail: payment.userEmail,
                userName: payment.userName
              },
              specifications: {
                testType: payment.testType,
                questionCount: payment.questionCount,
                duration: payment.estimatedDuration
              }
            }));
            allRequests = [...allRequests, ...mappedPayments];
            console.log('🔍 Mapped payment requests:', mappedPayments);
          }
        } else {
          console.error('❌ Payment requests API error:', paymentRequestsResponse.value.status, paymentRequestsResponse.value.statusText);
        }
      } else {
        console.error('❌ Payment requests fetch failed:', paymentRequestsResponse.reason);
      }

      // Process interviews
      if (interviewsResponse.status === 'fulfilled' && interviewsResponse.value.ok) {
        const interviewResult = await interviewsResponse.value.json();
        const interviews = interviewResult.success ? 
          (interviewResult.data?.interviews || interviewResult.data) : 
          interviewResult.interviews || interviewResult;
        
        if (Array.isArray(interviews)) {
          allRequests = [...allRequests, ...interviews.map(interview => ({
            _id: interview._id,
            user: interview.candidateId || interview.candidate,
            displayType: 'AI Interview',
            requestType: 'ai_interview',
            title: `Interview - ${interview.jobId?.title || 'Job Position'}`,
            description: `AI interview session for ${interview.jobId?.title || 'position'}`,
            job: interview.jobId,
            priority: interview.status === 'completed' ? 'low' : 
                     interview.status === 'in_progress' ? 'high' : 'normal',
            requestedAt: interview.createdAt || interview.startTime,
            status: interview.status,
            specifications: {
              testType: 'interview',
              duration: interview.duration || 30,
              score: interview.overallScore || null,
              difficulty: interview.difficulty || 'medium'
            }
          }))];
        }
      }

      console.log('🔍 PsychometricTestManagementPage: Final requests found:', allRequests.length);
      
      // Don't use fallback data - show real data only
      if (allRequests.length === 0) {
        console.log('ℹ️ No test requests found from API - displaying empty state');
      }

      // Check for duplicate IDs and log them
      const ids = allRequests.map(r => r._id);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.warn('🚨 Found duplicate request IDs:', duplicateIds);
        console.warn('🚨 Full requests with duplicate IDs:', allRequests.filter(r => duplicateIds.includes(r._id)));
      }

      // Sort by priority and date
      allRequests.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
        const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
      });

      setTestRequests(allRequests);
      console.log('Loaded requests and interviews:', allRequests);
    } catch (error) {
      console.error('Error loading test requests and interviews:', error);
      // Don't use fallback data on error - show empty state
      setTestRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadApprovedTests = async () => {
    setApprovedLoading(true);
    try {
      // Fetch approved payment requests
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payment-requests?status=approved`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Approved tests response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Approved tests API response:', result);
        
        const approvedData = result.success ? result.data : result;
        console.log('🔍 Processed approved tests:', approvedData);
        
        if (Array.isArray(approvedData)) {
          const mappedApproved = approvedData.map(payment => ({
            _id: payment._id,
            user: {
              _id: payment.userId,
              email: payment.userEmail,
              firstName: payment.userName.split(' ')[0] || 'Unknown',
              lastName: payment.userName.split(' ').slice(1).join(' ') || '',
              role: 'user'
            },
            displayType: 'Approved Test',
            requestType: 'payment_request',
            title: `${payment.testType} - Approved`,
            description: `User approved to take ${payment.testType} for ${payment.jobTitle} at ${payment.company}`,
            job: {
              _id: payment.jobId,
              title: payment.jobTitle,
              company: payment.company
            },
            priority: 'normal',
            approvedAt: payment.approvedAt,
            requestedAt: payment.requestedAt,
            status: 'approved',
            approvedBy: payment.approvedBy,
            paymentData: {
              testType: payment.testType,
              questionCount: payment.questionCount,
              estimatedDuration: payment.estimatedDuration,
              userEmail: payment.userEmail,
              userName: payment.userName
            },
            specifications: {
              testType: payment.testType,
              questionCount: payment.questionCount,
              duration: payment.estimatedDuration
            }
          }));
          
          // Sort by approval date (most recent first)
          mappedApproved.sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());
          
          setApprovedTests(mappedApproved);
        } else {
          setApprovedTests([]);
        }
      } else {
        console.error('Failed to fetch approved tests:', response.statusText);
        setApprovedTests([]);
      }
    } catch (error) {
      console.error('Error loading approved tests:', error);
      setApprovedTests([]);
    } finally {
      setApprovedLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      // Find the request to determine its type
      const request = testRequests.find(req => req._id === requestId);
      if (!request) {
        console.error('Request not found:', requestId);
        return;
      }

      let response;
      
      if (request.requestType === 'payment_request') {
        // Handle payment request approval/rejection
        response = await fetch(`${import.meta.env.VITE_API_URL}/payment-requests/${requestId}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: action === 'approve' ? 'approved' : 'rejected',
            adminNotes: notes
          })
        });
      } else {
        // Handle regular test request approval/rejection
        response = await fetch(`${import.meta.env.VITE_API_URL}/test-requests/${requestId}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: action === 'approve' ? 'approved' : 'rejected',
            adminNotes: notes
          })
        });
      }

      if (response.ok) {
        // Remove the request from the list
        setTestRequests(prev => prev.filter(req => req._id !== requestId));
        
        // For regular test requests, generate the test after approval
        if (action === 'approve' && request.requestType !== 'test_purchase_approval') {
          await fetch(`${import.meta.env.VITE_API_URL}/test-requests/${requestId}/generate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        // If action was approve, refresh the approved tests tab
        if (action === 'approve') {
          loadApprovedTests();
        }
        
        console.log(`✅ Successfully ${action}ed ${request.displayType}:`, requestId);
      } else {
        const errorResult = await response.json();
        console.error(`❌ Failed to ${action} ${request.displayType}:`, errorResult);
      }
    } catch (error) {
      console.error('Error handling request action:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from tests data
      const active = tests.filter(t => t.status === 'active');
      const draft = tests.filter(t => t.status === 'draft');
      
      const totalAttempts = tests.reduce((sum, t) => sum + t.attempts, 0);
      const avgScore = tests.length > 0 
        ? tests.reduce((sum, t) => sum + t.averageScore, 0) / tests.length 
        : 0;
      
      const passRate = tests.length > 0
        ? tests.reduce((sum, t) => sum + t.passRate, 0) / tests.length
        : 0;

      // Group by test type
      const typeGroups = tests.reduce((acc, test) => {
        const type = test.type;
        if (!acc[type]) {
          acc[type] = { count: 0, totalScore: 0 };
        }
        acc[type].count++;
        acc[type].totalScore += test.averageScore;
        return acc;
      }, {} as Record<string, { count: number; totalScore: number }>);

      const topTestTypes = Object.entries(typeGroups).map(([type, data]) => ({
        type,
        count: data.count,
        averageScore: data.totalScore / data.count
      }));

      // Group by industry
      const industryGroups = tests.reduce((acc, test) => {
        const industry = test.industry;
        if (!acc[industry]) {
          acc[industry] = 0;
        }
        acc[industry]++;
        return acc;
      }, {} as Record<string, number>);

      const industryDistribution = Object.entries(industryGroups).map(([industry, count]) => ({
        industry,
        count
      }));

      setStats({
        totalTests: tests.length,
        activeTests: active.length,
        draftTests: draft.length,
        totalAttempts,
        averageScore: avgScore,
        passRate,
        topTestTypes,
        industryDistribution
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key: keyof TestFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'draft': return <Edit />;
      case 'archived': return <Archive />;
      default: return <Info />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: PsychometricTestType) => {
    switch (type) {
      case PsychometricTestType.APTITUDE: return <Psychology />;
      case PsychometricTestType.PERSONALITY: return <Person />;
      case PsychometricTestType.COGNITIVE: return <Quiz />;
      case PsychometricTestType.SKILLS: return <Assignment />;
      default: return <Assessment />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Psychometric Test Management...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2,
        p: 3,
        color: 'white'
      }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <Psychology sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Psychometric Test Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Create, manage, and analyze psychometric assessments • Advanced test builder and analytics
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`${stats.totalTests} Total Tests`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
          <Chip 
            label={`${stats.activeTests} Active`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
          <Chip 
            label={`${stats.totalAttempts.toLocaleString()} Attempts`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
          <Chip 
            label={`${stats.averageScore.toFixed(1)} Avg Score`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tests"
            value={stats.totalTests}
            icon={<Assessment />}
            color="primary"
            trend={15}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tests"
            value={stats.activeTests}
            icon={<CheckCircle />}
            color="success"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Attempts"
            value={stats.totalAttempts}
            icon={<Group />}
            color="info"
            trend={22}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pass Rate"
            value={`${stats.passRate.toFixed(1)}%`}
            icon={<TrendingUp />}
            color="warning"
            trend={5}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<Assessment />} 
            label="Test Management" 
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
          <Tab 
            icon={
              <Badge badgeContent={testRequests.length} color="error" max={99}>
                <PendingActions />
              </Badge>
            } 
            label="Pending Requests" 
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
          <Tab 
            icon={
              <Badge badgeContent={approvedTests.length} color="success" max={99}>
                <CheckCircle />
              </Badge>
            } 
            label="Approved Tests" 
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Filters and Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search tests..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value={PsychometricTestType.APTITUDE}>Aptitude</MenuItem>
                  <MenuItem value={PsychometricTestType.PERSONALITY}>Personality</MenuItem>
                  <MenuItem value={PsychometricTestType.COGNITIVE}>Cognitive</MenuItem>
                  <MenuItem value={PsychometricTestType.SKILLS}>Skills</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Industry</InputLabel>
                <Select
                  value={filters.industry}
                  label="Industry"
                  onChange={(e) => handleFilterChange('industry', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Healthcare">Healthcare</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialog({ ...createDialog, open: true })}
                >
                  Create Test
                </Button>
                <IconButton onClick={() => loadTests()}>
                  <Refresh />
                </IconButton>
                <IconButton>
                  <Download />
                </IconButton>
                <IconButton>
                  <Analytics />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Details</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Attempts</TableCell>
                  <TableCell>Avg Score</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {getTypeIcon(test.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {test.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {test.timeLimit} minutes • {test.questions.length} questions
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(test.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(test.type)}
                        label={test.type.replace('_', ' ').toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {test.industry}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {test.jobRole}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(test.status)}
                        label={test.status.toUpperCase()}
                        color={getStatusColor(test.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={test.difficulty.toUpperCase()}
                        color={getDifficultyColor(test.difficulty) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {test.attempts.toLocaleString()}
                      </Typography>
                      {test.lastUsed && (
                        <Typography variant="caption" color="text.secondary">
                          Last: {formatDate(test.lastUsed)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {test.averageScore.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({test.passRate.toFixed(1)}% pass)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedTest(test);
                              setDetailDialog(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Test">
                          <IconButton size="small" color="primary">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        {test.status === 'active' && (
                          <Tooltip title="Take Test">
                            <IconButton size="small" color="success">
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              setAnchorEl(e.currentTarget);
                              setSelectedTest(test);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

        </>
      )}

      {/* Tab 2: Test Requests */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Test Requests & Interviews ({testRequests.length})
              </Typography>
              <Button
                startIcon={<Refresh />}
                onClick={loadTestRequests}
                disabled={requestsLoading}
              >
                Refresh
              </Button>
            </Box>

            {requestsLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Loading test requests...
                </Typography>
              </Box>
            ) : testRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <PendingActions sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Test Requests or Interviews
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All test requests have been processed and no recent interviews found.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {testRequests.map((request, index) => (
                  <Grid item xs={12} md={6} lg={4} key={`request-${request._id}-${index}`}>
                    <Card 
                      variant="outlined"
                      sx={{ 
                        height: '100%',
                        position: 'relative',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2
                        }
                      }}
                    >
                      {/* Priority Badge */}
                      <Chip
                        label={request.priority.toUpperCase()}
                        color={request.priority === 'high' ? 'error' : request.priority === 'normal' ? 'warning' : 'default'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 1
                        }}
                      />

                      <CardContent sx={{ pb: 1 }}>
                        <Stack spacing={2}>
                          {/* Header */}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, pr: 8 }}>
                              <Chip
                                size="small"
                                label={request.displayType}
                                color={request.requestType === 'ai_interview' ? 'secondary' : 'primary'}
                                icon={request.requestType === 'ai_interview' ? <QuestionAnswer /> : <Psychology />}
                                sx={{ mr: 2 }}
                              />
                              <Chip
                                size="small"
                                label={request.status.toUpperCase()}
                                color={
                                  request.status === 'completed' ? 'success' :
                                  request.status === 'pending' ? 'warning' :
                                  request.status === 'in_progress' ? 'info' : 'default'
                                }
                                variant="outlined"
                              />
                            </Box>
                            <Typography variant="h6" sx={{ pr: 8 }}>
                              {request.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {request.description}
                            </Typography>
                          </Box>

                          {/* User Info */}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                              {request.user.firstName[0]}{request.user.lastName[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {request.user.firstName} {request.user.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.user.email}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Job Info */}
                          {request.job && (
                            <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Work sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="subtitle2">
                                  {request.job.title}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {request.job.company}
                              </Typography>
                            </Box>
                          )}

                          {/* Specifications */}
                          {request.specifications && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                {request.requestType === 'ai_interview' ? 'Interview Details' : 'Test Specifications'}
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip 
                                  size="small" 
                                  label={request.specifications.testType} 
                                  color="info"
                                />
                                <Chip 
                                  size="small" 
                                  label={`${request.specifications.duration}min`} 
                                  variant="outlined"
                                />
                                {request.specifications.questionCount && (
                                  <Chip 
                                    size="small" 
                                    label={`${request.specifications.questionCount}Q`} 
                                    variant="outlined"
                                  />
                                )}
                                {request.specifications.score && (
                                  <Chip 
                                    size="small" 
                                    label={`Score: ${request.specifications.score}%`} 
                                    color="success"
                                    icon={<Star />}
                                  />
                                )}
                                <Chip 
                                  size="small" 
                                  label={request.specifications.difficulty} 
                                  color={
                                    request.specifications.difficulty === 'hard' ? 'error' :
                                    request.specifications.difficulty === 'medium' ? 'warning' : 'success'
                                  }
                                />
                              </Stack>
                            </Box>
                          )}

                          {/* Requested Date */}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Schedule sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              Requested {new Date(request.requestedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>

                      {/* Actions */}
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Stack direction="row" spacing={1}>
                          {request.requestType === 'ai_interview' ? (
                            // Interview actions
                            <>
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<Visibility />}
                                sx={{ flex: 1 }}
                                onClick={() => {
                                  console.log('View interview details:', request);
                                }}
                              >
                                View Details
                              </Button>
                              {request.status === 'completed' && (
                                <Button
                                  variant="contained"
                                  color="info"
                                  size="small"
                                  startIcon={<Download />}
                                  sx={{ flex: 1 }}
                                  onClick={() => {
                                    console.log('Download interview report:', request);
                                  }}
                                >
                                  Report
                                </Button>
                              )}
                            </>
                          ) : (
                            // Test request actions
                            <>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<Approval />}
                                onClick={() => handleRequestAction(request._id, 'approve')}
                                sx={{ flex: 1 }}
                                disabled={request.status !== 'pending'}
                              >
                                {request.status === 'pending' ? 'Approve' : 'Approved'}
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Delete />}
                                onClick={() => handleRequestAction(request._id, 'reject')}
                                sx={{ flex: 1 }}
                                disabled={request.status !== 'pending'}
                              >
                                {request.status === 'pending' ? 'Reject' : 'Rejected'}
                              </Button>
                            </>
                          )}
                        </Stack>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Approved Tests */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Approved Tests ({approvedTests.length})
              </Typography>
              <Button
                startIcon={<Refresh />}
                onClick={loadApprovedTests}
                disabled={approvedLoading}
              >
                Refresh
              </Button>
            </Box>

            {approvedLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading approved tests...
                </Typography>
              </Box>
            ) : approvedTests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CheckCircle sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No approved tests found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved psychometric tests will appear here.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {approvedTests.map((approved, index) => (
                  <Grid item xs={12} md={6} lg={4} key={`approved-${approved._id}-${index}`}>
                    <Card
                      elevation={2}
                      sx={{
                        height: '100%',
                        border: '2px solid',
                        borderColor: 'success.main',
                        '&:hover': {
                          boxShadow: 6,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
                            {approved.title}
                          </Typography>
                          <Chip
                            label="APPROVED"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" paragraph>
                          {approved.description}
                        </Typography>

                        {/* User Information */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {approved.user?.firstName} {approved.user?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {approved.user?.email}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Job Information */}
                        {approved.job && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Work sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {approved.job.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                at {approved.job.company}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {/* Test Information */}
                        <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1, mb: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Psychology sx={{ color: 'success.main' }} />
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight="medium">
                                {approved.test?.title || 'Psychometric Test'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Type: {approved.specifications?.testType || 'N/A'}
                              </Typography>
                            </Box>
                            {approved.specifications?.amount && (
                              <Chip
                                label={`$${approved.specifications.amount}`}
                                size="small"
                                variant="outlined"
                                color="success"
                              />
                            )}
                          </Stack>
                        </Box>

                        {/* Timing Information */}
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Schedule sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                            <Typography variant="caption" color="text.secondary">
                              Approved: {new Date(approved.approvedAt).toLocaleDateString()} at {new Date(approved.approvedAt).toLocaleTimeString()}
                            </Typography>
                          </Box>
                          {approved.requestedAt && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Schedule sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                              <Typography variant="caption" color="text.secondary">
                                Requested: {new Date(approved.requestedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          )}
                          {approved.approvedBy && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Person sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                              <Typography variant="caption" color="text.secondary">
                                Approved by: {approved.approvedBy.firstName} {approved.approvedBy.lastName}
                              </Typography>
                            </Box>
                          )}
                        </Stack>

                        {/* Attempts Information */}
                        {approved.specifications?.attemptsRemaining !== undefined && (
                          <Box sx={{ mt: 2, p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                            <Typography variant="caption" color="info.main" fontWeight="medium">
                              Attempts Remaining: {approved.specifications.attemptsRemaining}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Test</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><Analytics /></ListItemIcon>
          <ListItemText>View Analytics</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><Share /></ListItemIcon>
          <ListItemText>Share Test</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><Archive /></ListItemIcon>
          <ListItemText>Archive Test</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete Test</ListItemText>
        </MenuItem>
      </Menu>

      {/* Test Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Test Details - {selectedTest?.title}
        </DialogTitle>
        <DialogContent>
          {selectedTest && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">Description</Typography>
                      <Typography variant="body2">{selectedTest.description}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Type</Typography>
                      <Chip
                        icon={getTypeIcon(selectedTest.type)}
                        label={selectedTest.type.replace('_', ' ').toUpperCase()}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Industry & Role</Typography>
                      <Typography variant="body2">{selectedTest.industry} - {selectedTest.jobRole}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Time Limit</Typography>
                      <Typography variant="body2">{selectedTest.timeLimit} minutes</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">Total Attempts</Typography>
                      <Typography variant="h6">{selectedTest.attempts.toLocaleString()}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Average Score</Typography>
                      <Typography variant="h6">{selectedTest.averageScore.toFixed(1)}%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Pass Rate</Typography>
                      <Typography variant="h6">{selectedTest.passRate.toFixed(1)}%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Difficulty</Typography>
                      <Chip
                        label={selectedTest.difficulty.toUpperCase()}
                        color={getDifficultyColor(selectedTest.difficulty) as any}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Test Questions ({selectedTest.questions.length})
                </Typography>
                <Stack spacing={2}>
                  {selectedTest.questions.map((question, index) => (
                    <Accordion key={question._id}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle2">
                          Question {index + 1}: {question.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1}>
                          <Typography variant="subtitle2">Options:</Typography>
                          <List dense>
                            {question.options.map((option, optIndex) => (
                              <ListItem key={optIndex}>
                                <ListItemAvatar>
                                  <Avatar
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      bgcolor: optIndex === question.correctAnswer ? 'success.main' : 'grey.300',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {String.fromCharCode(65 + optIndex)}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={option}
                                  sx={{
                                    color: optIndex === question.correctAnswer ? 'success.main' : 'text.primary'
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                          <Box>
                            <Typography variant="subtitle2">Explanation:</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {question.explanation}
                            </Typography>
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Edit />}>
            Edit Test
          </Button>
          <Button variant="contained" startIcon={<Analytics />}>
            View Analytics
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PsychometricTestManagementPage;