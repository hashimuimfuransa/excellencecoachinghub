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
  Badge
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
  LockOpen
} from '@mui/icons-material';
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

  useEffect(() => {
    fetchTests();
    fetchResults();
    fetchJobs();
    fetchUserData();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await psychometricTestService.getTests();
      setTests(response.data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await psychometricTestService.getResults();
      setResults(response.data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
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

      console.log('🔍 Analyzing job requirements and generating AI test...', job.title);

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

      console.log('📋 Test Parameters:', testParams);

      // Step 2: Generate AI test using backend API
      console.log('🤖 Generating AI-powered test via backend...');
      const { testId, test } = await psychometricTestService.generateJobSpecificTest(testParams);
      
      console.log('✅ Generated AI Test:', {
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

      console.log('🎯 AI Test Successfully Generated via Backend:', {
        title: intelligentTest.title,
        categories: intelligentTest.categories,
        questionCount: intelligentTest.questions.length,
        timeLimit: intelligentTest.timeLimit,
        difficulty: intelligentTest.difficulty,
        skills: testParams.requiredSkills,
        industry: testParams.industry
      });

    } catch (error) {
      console.error('❌ Error generating AI-powered test:', error);
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
    if (!testLevel) return;

    const paymentInfo = userPayments.find(p => p.level === selectedLevel);
    
    if (!paymentInfo || paymentInfo.attemptsRemaining <= 0) {
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
    if (!readyTest) return;
    
    // Decrease attempts remaining
    setUserPayments(prev => prev.map(p => 
      p.level === selectedLevel 
        ? { ...p, attemptsRemaining: p.attemptsRemaining - 1 }
        : p
    ));
    
    // Create test data to pass to new page
    const testData = {
      test: readyTest,
      selectedJob,
      selectedLevel,
      user: user?._id,
      userPayments
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
    if (!selectedTestLevel) return;
    
    setProcessingPayment(true);
    
    try {
      // Simulate payment processing (for now, just add to user payments)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const newPayment: PaymentInfo = {
        level: selectedTestLevel.level,
        cost: selectedTestLevel.cost,
        attemptsRemaining: 3, // 3 attempts per payment
        lastPaymentDate: new Date().toISOString()
      };
      
      setUserPayments(prev => {
        const existing = prev.find(p => p.level === selectedTestLevel.level);
        if (existing) {
          return prev.map(p => 
            p.level === selectedTestLevel.level 
              ? { ...p, attemptsRemaining: 3, lastPaymentDate: new Date().toISOString() }
              : p
          );
        } else {
          return [...prev, newPayment];
        }
      });
      
      setPaymentDialogOpen(false);
      
      // Now show the test card
      const test = generatedTests.find(t => t._id.includes(`-${selectedTestLevel.level}`));
      if (test) {
        setReadyTest(test);
        setShowTestCard(true);
      }
      
    } catch (error) {
      console.error('Payment failed:', error);
      // Handle payment error
    } finally {
      setProcessingPayment(false);
    }
  };

  const getAttemptsRemaining = (level: number): number => {
    const paymentInfo = userPayments.find(p => p.level === level);
    return paymentInfo ? paymentInfo.attemptsRemaining : 0;
  };

  const hasValidPayment = (level: number): boolean => {
    const paymentInfo = userPayments.find(p => p.level === level);
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
                      {job.company} • {job.location}
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
              🤖 AI Processing Your Selection...
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
                ✅ Test Ready!
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
            <AlertTitle>🎉 Assessment Generated Successfully!</AlertTitle>
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
                        🎯
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
                            🎯 Target Skills
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
                            📊 Assessment Categories
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
                            📈 Assessment Details
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
                  📋 Test Instructions
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
                        boxShadow: theme.shadows[8]
                      },
                      transition: 'all 0.3s',
                      border: '2px solid',
                      borderColor: 'transparent',
                      '&:hover': {
                        borderColor: category.color
                      }
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

        <JobSelectionDialog />
        <TestLevelDialog />
        <TestReadyCard />
        <PaymentDialog />
      </Container>
    </SimpleProfileGuard>
  );
};

export default PsychometricTestsPage;