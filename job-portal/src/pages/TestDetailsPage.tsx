import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Stack,
  Chip,
  Avatar,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  AlertTitle,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  CheckCircle,
  Star,
  TrendingUp,
  Assessment,
  Timer,
  Psychology,
  BarChart,
  MenuBook,
  AccountTree,
  Groups,
  Person,
  Favorite,
  Warning,
  Info,
  School,
  Business,
  Speed,
  Analytics,
  ExpandMore,
  EmojiEvents,
  Lightbulb,
  GpsFixed
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

interface TestDetail {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  difficulty: string;
  timeLimit: number;
  questionCount: number;
  isFree: boolean;
  importance: {
    title: string;
    description: string;
    keyPoints: string[];
  };
  skillsAssessed: {
    title: string;
    description: string;
    skills: string[];
  };
  testSpecs: {
    title: string;
    description: string;
    subjects: string[];
    providers: string[];
    examples: {
      question: string;
      answer: string;
      explanation: string;
    }[];
  };
  preparation: {
    title: string;
    description: string;
    tips: string[];
  };
  statistics: {
    passRate: number;
    averageScore: number;
    topPercentile: number;
  };
}

const testDetails: Record<string, TestDetail> = {
  numerical: {
    id: 'numerical',
    title: 'Numerical Reasoning Test',
    description: 'Numerical reasoning tests demonstrate your ability to deal with numbers quickly and accurately. These tests contain questions that assess your knowledge of ratios, percentages, number sequences, data interpretation, financial analysis and currency conversion.',
    icon: <BarChart />,
    color: '#2196f3',
    difficulty: 'Medium',
    timeLimit: 20,
    questionCount: 480,
    isFree: true,
    importance: {
      title: 'Why a High Score is Crucial',
      description: 'It is important to note that your results will be calculated in relation to other test takers; thus, it is crucial to score as high as possible to edge out the competition.',
      keyPoints: [
        'Those who fail to land in the top 20 percentile of test-takers will not even be invited for an interview',
        'Results are calculated relative to other candidates, making high performance essential',
        'Coming fully prepared is crucial to beat out the competition',
        'Many employers use this as a primary screening tool before interviews'
      ]
    },
    skillsAssessed: {
      title: 'Understanding the Numerical Reasoning Test',
      description: 'When translated into business jargon, the above skills will give a strong indication to your future employer regarding your abilities related to essential business skills.',
      skills: [
        'Critical Thinking',
        'Quick Analysis and Evaluation',
        'Problem Identification',
        'Communicating Via Tables and Graphs',
        'Designing and Implementing Alternative Solutions',
        'Performing and Communicating Estimates',
        'Data Interpretation and Analysis',
        'Financial Analysis and Forecasting'
      ]
    },
    testSpecs: {
      title: 'Numerical Reasoning Test Specifications',
      description: 'It is important to understand that numerical reasoning tests are not singular and insular tests. Furthermore, the test usually comes packaged with verbal reasoning and other exams.',
      subjects: [
        'Addition and Subtraction',
        'Division and Multiplication',
        'Ratios and Proportions',
        'Percentages and Fractions',
        'Inflation and Rebasing',
        'Reading Tables and Graphs',
        'Converting Currency',
        'Statistical Analysis',
        'Trend Analysis',
        'Financial Calculations'
      ],
      providers: [
        'SHL (Saville & Holdsworth)',
        'Cubiks (AON)',
        'Talent Q (Korn Ferry)',
        'Criteria Corp',
        'Wonderlic',
        'Human Systems Technology (HST)',
        'PSI Services',
        'Pearson TalentLens'
      ],
      examples: [
        {
          question: 'The average age of the 20 kids in class is 9 years. What is the sum of their ages?',
          answer: '180 years',
          explanation: 'Using the formula: (sum of items) = average × (number of items), so 9 × 20 = 180 years.'
        },
        {
          question: 'Complete the sequence: A5 | C3 | E1 | ?',
          answer: 'G-1',
          explanation: 'The letters increase by 2 positions (A→C→E→G) while the numbers decrease by 2 (5→3→1→-1).'
        },
        {
          question: 'If sales increased by 15% from $200,000 to reach the current figure, what is the current sales amount?',
          answer: '$230,000',
          explanation: 'Current sales = $200,000 × (1 + 0.15) = $200,000 × 1.15 = $230,000.'
        }
      ]
    },
    preparation: {
      title: 'Comprehensive Test Preparation',
      description: 'Our all-inclusive Numerical Reasoning Test Practice PrepPack™ will fully prepare you for every element of the test, including a range of difficulty levels from basic to operational, managerial, and advanced.',
      tips: [
        'Practice with timed conditions to improve speed and accuracy',
        'Master basic arithmetic operations without a calculator',
        'Learn to quickly interpret charts, graphs, and tables',
        'Understand percentage calculations and ratio problems',
        'Practice currency conversion and inflation adjustments',
        'Develop pattern recognition skills for number sequences',
        'Focus on reading questions carefully to avoid misinterpretation',
        'Use elimination techniques for multiple-choice questions'
      ]
    },
    statistics: {
      passRate: 65,
      averageScore: 72,
      topPercentile: 85
    }
  },
  verbal: {
    id: 'verbal',
    title: 'Verbal Reasoning Test',
    description: 'Verbal reasoning tests assess your understanding and comprehension skills. You will be presented with a short passage of text which you\'ll be required to interpret before answering questions.',
    icon: <MenuBook />,
    color: '#4caf50',
    difficulty: 'Medium',
    timeLimit: 18,
    questionCount: 450,
    isFree: true,
    importance: {
      title: 'Why Verbal Reasoning Matters',
      description: 'Verbal reasoning is fundamental to most professional roles, as it demonstrates your ability to process information, make logical deductions, and communicate effectively.',
      keyPoints: [
        'Essential for roles requiring strong communication skills',
        'Indicates ability to process complex written information',
        'Shows logical thinking and analytical capabilities',
        'Critical for management and leadership positions'
      ]
    },
    skillsAssessed: {
      title: 'Skills Evaluated in Verbal Reasoning',
      description: 'These tests measure various aspects of verbal intelligence and communication abilities that are crucial in the workplace.',
      skills: [
        'Reading Comprehension',
        'Critical Analysis',
        'Logical Deduction',
        'Information Processing',
        'Attention to Detail',
        'Inference Making',
        'Vocabulary Understanding',
        'Argument Evaluation'
      ]
    },
    testSpecs: {
      title: 'Verbal Reasoning Test Format',
      description: 'Verbal reasoning tests typically present passages followed by statements that you must evaluate as True, False, or Cannot Say.',
      subjects: [
        'Reading Comprehension',
        'Critical Reasoning',
        'Logical Deduction',
        'Inference Questions',
        'Assumption Identification',
        'Argument Analysis',
        'Vocabulary in Context',
        'Passage Interpretation'
      ],
      providers: [
        'SHL Verbal Reasoning',
        'Kenexa Verbal Reasoning',
        'Cubiks Verbal Reasoning',
        'Talent Q Elements',
        'Saville Swift Analysis'
      ],
      examples: [
        {
          question: 'Based on the passage: "The company launched a new product last quarter which received positive reviews." Statement: "The product was successful."',
          answer: 'Cannot Say',
          explanation: 'While the product received positive reviews, we cannot definitively conclude it was successful without sales or other success metrics.'
        }
      ]
    },
    preparation: {
      title: 'Verbal Reasoning Preparation Strategy',
      description: 'Effective preparation focuses on improving reading speed, comprehension, and logical analysis skills.',
      tips: [
        'Practice reading complex texts quickly and accurately',
        'Learn to distinguish between facts and opinions',
        'Master the True/False/Cannot Say format',
        'Improve vocabulary through regular reading',
        'Practice identifying key information in passages',
        'Develop skills in logical reasoning and inference',
        'Time management is crucial - practice under timed conditions',
        'Focus on understanding rather than memorizing details'
      ]
    },
    statistics: {
      passRate: 70,
      averageScore: 75,
      topPercentile: 88
    }
  },
  situational: {
    id: 'situational',
    title: 'Situational Judgement Test',
    description: 'Situational Judgement Tests assess how you approach situations encountered in the workplace. They are built around hypothetical scenarios to which you would be expected to react accordingly.',
    icon: <Groups />,
    color: '#ff9800',
    difficulty: 'Medium',
    timeLimit: 25,
    questionCount: 480,
    isFree: true,
    importance: {
      title: 'Why Situational Judgement is Critical',
      description: 'These tests evaluate your alignment with company values and your ability to make sound decisions in workplace scenarios.',
      keyPoints: [
        'Assesses cultural fit with the organization',
        'Evaluates decision-making under pressure',
        'Shows understanding of professional behavior',
        'Indicates leadership and teamwork potential'
      ]
    },
    skillsAssessed: {
      title: 'Competencies Measured',
      description: 'Situational judgement tests evaluate various workplace competencies and behavioral traits.',
      skills: [
        'Decision Making',
        'Problem Solving',
        'Leadership Potential',
        'Teamwork and Collaboration',
        'Communication Skills',
        'Conflict Resolution',
        'Ethical Reasoning',
        'Adaptability and Flexibility'
      ]
    },
    testSpecs: {
      title: 'Test Structure and Content',
      description: 'These tests present workplace scenarios with multiple response options, asking you to choose the most or least appropriate action.',
      subjects: [
        'Team Management',
        'Customer Service',
        'Conflict Resolution',
        'Ethical Dilemmas',
        'Time Management',
        'Communication Challenges',
        'Leadership Scenarios',
        'Problem-Solving Situations'
      ],
      providers: [
        'SHL Situational Judgement',
        'Talent Q Dimensions',
        'Cubiks Situational Judgement',
        'PSI Situational Judgement'
      ],
      examples: [
        {
          question: 'A team member consistently misses deadlines, affecting the entire project. What would you do?',
          answer: 'Speak privately with the team member to understand the issues and offer support',
          explanation: 'This approach addresses the problem directly while maintaining professional relationships and seeking to understand root causes.'
        }
      ]
    },
    preparation: {
      title: 'Preparation for Situational Judgement',
      description: 'Success requires understanding workplace dynamics and demonstrating sound professional judgement.',
      tips: [
        'Research the company\'s values and culture',
        'Think about ideal workplace behaviors',
        'Consider multiple perspectives in each scenario',
        'Focus on collaborative and constructive approaches',
        'Avoid extreme responses',
        'Think about long-term consequences of actions',
        'Practice with various workplace scenarios',
        'Develop emotional intelligence and empathy'
      ]
    },
    statistics: {
      passRate: 68,
      averageScore: 73,
      topPercentile: 86
    }
  },
  diagrammatic: {
    id: 'diagrammatic',
    title: 'Diagrammatic Reasoning Test',
    description: 'Diagrammatic reasoning tests assess your logical reasoning ability. The questions measure your ability to infer a set of rules from a flowchart or sequence of diagrams.',
    icon: <AccountTree />,
    color: '#9c27b0',
    difficulty: 'Hard',
    timeLimit: 20,
    questionCount: 300,
    isFree: true,
    importance: {
      title: 'Why Diagrammatic Reasoning Matters',
      description: 'These tests evaluate your ability to think logically and systematically, skills essential for technical and analytical roles.',
      keyPoints: [
        'Critical for technical and engineering positions',
        'Assesses logical and systematic thinking',
        'Evaluates pattern recognition abilities',
        'Important for process improvement roles'
      ]
    },
    skillsAssessed: {
      title: 'Cognitive Abilities Tested',
      description: 'Diagrammatic reasoning tests measure abstract thinking and logical processing capabilities.',
      skills: [
        'Abstract Reasoning',
        'Pattern Recognition',
        'Logical Processing',
        'Sequential Thinking',
        'Rule Identification',
        'Process Analysis',
        'Visual-Spatial Intelligence',
        'Systematic Problem Solving'
      ]
    },
    testSpecs: {
      title: 'Test Format and Content',
      description: 'These tests use flowcharts, sequences, and diagrams to assess logical reasoning without relying on verbal or numerical content.',
      subjects: [
        'Flowchart Logic',
        'Sequence Completion',
        'Pattern Identification',
        'Rule Application',
        'Process Mapping',
        'Logical Operators',
        'Transformation Rules',
        'Abstract Sequences'
      ],
      providers: [
        'SHL Diagrammatic Reasoning',
        'Kenexa Logical Reasoning',
        'Cubiks Logiks',
        'Talent Q Elements'
      ],
      examples: [
        {
          question: 'In a flowchart, if input A goes through processes X and Y, what would be the output?',
          answer: 'Follow the logical sequence through each transformation',
          explanation: 'Trace the input through each step, applying the rules shown in the diagram systematically.'
        }
      ]
    },
    preparation: {
      title: 'Diagrammatic Reasoning Preparation',
      description: 'Success requires developing pattern recognition skills and logical thinking abilities.',
      tips: [
        'Practice identifying patterns in sequences',
        'Learn to work with flowcharts and process diagrams',
        'Develop systematic approaches to problem-solving',
        'Practice with abstract reasoning puzzles',
        'Improve visual-spatial processing skills',
        'Learn common logical operators and transformations',
        'Practice under timed conditions',
        'Focus on accuracy over speed initially'
      ]
    },
    statistics: {
      passRate: 55,
      averageScore: 68,
      topPercentile: 82
    }
  },
  bigfive: {
    id: 'bigfive',
    title: 'Big Five Personality Test',
    description: 'The Big Five personality traits are extraversion, agreeableness, openness, conscientiousness, and neuroticism. This test reveals where you are on the scale of each trait.',
    icon: <Person />,
    color: '#607d8b',
    difficulty: 'Easy',
    timeLimit: 15,
    questionCount: 60,
    isFree: true,
    importance: {
      title: 'Why Personality Assessment Matters',
      description: 'Understanding your personality profile helps employers assess cultural fit and predict job performance in specific roles.',
      keyPoints: [
        'Predicts job performance and satisfaction',
        'Assesses cultural fit with team and organization',
        'Helps in role-specific candidate selection',
        'Provides insights for personal development'
      ]
    },
    skillsAssessed: {
      title: 'The Five Personality Dimensions',
      description: 'The Big Five model measures five broad dimensions of personality that influence behavior and performance.',
      skills: [
        'Extraversion - Social energy and assertiveness',
        'Agreeableness - Cooperation and trust',
        'Conscientiousness - Organization and dependability',
        'Neuroticism - Emotional stability',
        'Openness - Creativity and intellectual curiosity'
      ]
    },
    testSpecs: {
      title: 'Personality Assessment Format',
      description: 'The test uses statements about behavior and preferences that you rate on agreement scales.',
      subjects: [
        'Social Behavior',
        'Work Style Preferences',
        'Emotional Responses',
        'Thinking Patterns',
        'Interpersonal Relations',
        'Stress Management',
        'Innovation and Creativity',
        'Goal Orientation'
      ],
      providers: [
        'NEO-PI-R',
        'Big Five Inventory (BFI)',
        'HEXACO Personality Inventory',
        'International Personality Item Pool'
      ],
      examples: [
        {
          question: 'I see myself as someone who is talkative.',
          answer: 'Rate on a 5-point scale from Strongly Disagree to Strongly Agree',
          explanation: 'This measures the Extraversion dimension, specifically social assertiveness and communication style.'
        }
      ]
    },
    preparation: {
      title: 'Personality Test Preparation',
      description: 'While you cannot study for personality tests, you can prepare by understanding what employers are looking for.',
      tips: [
        'Answer honestly - consistency checks will detect fake responses',
        'Consider the job requirements when responding',
        'Think about your typical behavior, not ideal behavior',
        'Be consistent across similar questions',
        'Avoid extreme responses unless truly applicable',
        'Consider how your personality fits the role',
        'Reflect on your work style and preferences',
        'Understand that there are no right or wrong answers'
      ]
    },
    statistics: {
      passRate: 85,
      averageScore: 78,
      topPercentile: 90
    }
  },
  resilience: {
    id: 'resilience',
    title: 'Resilience Assessment',
    description: 'How resilient are you? This test assesses your ability to cope with life\'s trials and tribulations, and your capacity to gain strength from hardship.',
    icon: <Favorite />,
    color: '#e91e63',
    difficulty: 'Easy',
    timeLimit: 10,
    questionCount: 25,
    isFree: true,
    importance: {
      title: 'Why Resilience is Crucial in the Workplace',
      description: 'Resilience is the quality that allows us to survive and thrive in challenging situations, making it essential for career success.',
      keyPoints: [
        'Critical for handling workplace stress and pressure',
        'Indicates ability to recover from setbacks',
        'Shows adaptability to change and uncertainty',
        'Predicts long-term career success and satisfaction'
      ]
    },
    skillsAssessed: {
      title: 'Resilience Components Measured',
      description: 'This assessment evaluates various aspects of psychological resilience and coping mechanisms.',
      skills: [
        'Stress Management',
        'Emotional Regulation',
        'Adaptability',
        'Problem-Solving Under Pressure',
        'Optimism and Positive Thinking',
        'Self-Efficacy',
        'Social Support Utilization',
        'Recovery and Bounce-Back Ability'
      ]
    },
    testSpecs: {
      title: 'Resilience Assessment Structure',
      description: 'The test evaluates how you typically respond to challenges, setbacks, and stressful situations.',
      subjects: [
        'Stress Response',
        'Coping Strategies',
        'Emotional Control',
        'Problem-Solving Approach',
        'Support Seeking Behavior',
        'Optimism and Hope',
        'Self-Confidence',
        'Recovery Patterns'
      ],
      providers: [
        'Connor-Davidson Resilience Scale',
        'Brief Resilience Scale',
        'Resilience Scale for Adults',
        'Workplace Resilience Index'
      ],
      examples: [
        {
          question: 'When faced with a setback, I bounce back quickly.',
          answer: 'Rate from Never to Always',
          explanation: 'This measures your typical recovery pattern and ability to maintain performance under adversity.'
        }
      ]
    },
    preparation: {
      title: 'Building and Demonstrating Resilience',
      description: 'While resilience is partly innate, it can be developed and demonstrated effectively in assessments.',
      tips: [
        'Reflect on past challenges you\'ve overcome',
        'Consider your typical coping strategies',
        'Think about how you handle stress and pressure',
        'Be honest about your emotional responses',
        'Consider your support networks and how you use them',
        'Reflect on your problem-solving approaches',
        'Think about your recovery patterns after setbacks',
        'Consider your overall optimism and outlook'
      ]
    },
    statistics: {
      passRate: 75,
      averageScore: 76,
      topPercentile: 88
    }
  }
};

const TestDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const location = useLocation();
  
  const [testDetail, setTestDetail] = useState<TestDetail | null>(null);

  useEffect(() => {
    if (categoryId && testDetails[categoryId]) {
      setTestDetail(testDetails[categoryId]);
    } else {
      navigate('/app/tests');
    }
  }, [categoryId, navigate]);

  const handleStartTest = () => {
    if (testDetail) {
      // Create a serializable version of testDetail excluding React elements
      const serializableTestDetail = {
        id: testDetail.id,
        title: testDetail.title,
        description: testDetail.description,
        color: testDetail.color,
        difficulty: testDetail.difficulty,
        timeLimit: testDetail.timeLimit,
        questionCount: testDetail.questionCount,
        isFree: testDetail.isFree,
        importance: testDetail.importance,
        skillsAssessed: testDetail.skillsAssessed,
        testSpecs: testDetail.testSpecs,
        preparation: testDetail.preparation,
        statistics: testDetail.statistics
      };

      navigate(`/test/free/${testDetail.id}`, {
        state: {
          category: serializableTestDetail,
          returnUrl: '/app/tests'
        }
      });
    }
  };

  if (!testDetail) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading test details...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/app/tests')}
            sx={{ mb: 2 }}
          >
            Back to Tests
          </Button>
          
          <Paper sx={{ p: 4, mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: testDetail.color, 
                      mr: 3 
                    }}
                  >
                    {testDetail.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                      {testDetail.title}
                    </Typography>
                    <Stack direction="row" spacing={1} mb={2}>
                      <Chip label="FREE" color="success" />
                      <Chip label={testDetail.difficulty} color="primary" />
                      <Chip label={`${testDetail.timeLimit} min`} variant="outlined" />
                    </Stack>
                  </Box>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {testDetail.description}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                    {testDetail.statistics.averageScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Score
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={testDetail.statistics.averageScore} 
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={handleStartTest}
                    sx={{ 
                      bgcolor: testDetail.color,
                      '&:hover': {
                        bgcolor: testDetail.color,
                        filter: 'brightness(0.9)'
                      }
                    }}
                    fullWidth
                  >
                    Start Test Now
                  </Button>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Test Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {testDetail.statistics.passRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pass Rate
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <GpsFixed sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {testDetail.statistics.topPercentile}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Top 20% Score
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {testDetail.questionCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Practice Questions
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed Sections */}
        <Stack spacing={3}>
          {/* Importance Section */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center">
                <Warning sx={{ color: 'error.main', mr: 2 }} />
                <Typography variant="h5" fontWeight="bold">
                  {testDetail.importance.title}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>Critical Success Factor</AlertTitle>
                {testDetail.importance.description}
              </Alert>
              <List>
                {testDetail.importance.keyPoints.map((point, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="error" />
                    </ListItemIcon>
                    <ListItemText primary={point} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Skills Assessed */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center">
                <Psychology sx={{ color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" fontWeight="bold">
                  {testDetail.skillsAssessed.title}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {testDetail.skillsAssessed.description}
              </Typography>
              <Grid container spacing={2}>
                {testDetail.skillsAssessed.skills.map((skill, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ p: 2, height: '100%' }}>
                      <Box display="flex" alignItems="center">
                        <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                        <Typography variant="body2" fontWeight="medium">
                          {skill}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Test Specifications */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center">
                <Info sx={{ color: 'info.main', mr: 2 }} />
                <Typography variant="h5" fontWeight="bold">
                  {testDetail.testSpecs.title}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {testDetail.testSpecs.description}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Test Subjects Covered:
                  </Typography>
                  <List dense>
                    {testDetail.testSpecs.subjects.map((subject, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Star sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText primary={subject} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Test Providers:
                  </Typography>
                  <List dense>
                    {testDetail.testSpecs.providers.map((provider, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Business sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText primary={provider} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>

              {/* Examples */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Example Questions:
              </Typography>
              {testDetail.testSpecs.examples.map((example, index) => (
                <Card key={index} sx={{ mb: 2, p: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Question {index + 1}:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {example.question}
                  </Typography>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    Answer: {example.answer}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Explanation:</strong> {example.explanation}
                  </Typography>
                </Card>
              ))}
            </AccordionDetails>
          </Accordion>

          {/* Preparation Guide */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center">
                <Lightbulb sx={{ color: 'warning.main', mr: 2 }} />
                <Typography variant="h5" fontWeight="bold">
                  {testDetail.preparation.title}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Preparation Strategy</AlertTitle>
                {testDetail.preparation.description}
              </Alert>
              <Typography variant="h6" gutterBottom>
                Key Preparation Tips:
              </Typography>
              <List>
                {testDetail.preparation.tips.map((tip, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={tip} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Stack>

        {/* Call to Action */}
        <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Ready to Test Your Skills?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start your {testDetail.title} now and see how you compare to other candidates.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStartTest}
            sx={{ 
              px: 6,
              py: 2,
              bgcolor: testDetail.color,
              '&:hover': {
                bgcolor: testDetail.color,
                filter: 'brightness(0.9)'
              }
            }}
          >
            Start {testDetail.title}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default TestDetailsPage;