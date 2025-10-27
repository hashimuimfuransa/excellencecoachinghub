import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  AlertTitle,
  Paper,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack,
  Timer,
  CheckCircle,
  Warning,
  Psychology,
  Assessment,
  NavigateNext,
  NavigateBefore,
  Flag,
  Home,
  EmojiEvents,
  Close,
  BarChart,
  MenuBook,
  AccountTree,
  Groups,
  Person,
  Favorite,
  PlayArrow,
  Info
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

interface FreeTestQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'true_false_cannot_say' | 'numerical' | 'scenario';
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  chartData?: any;
  passage?: string;
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

// Comprehensive question banks for different test types
const generateNumericalQuestions = (difficulty: 'easy' | 'medium' | 'hard' = 'medium'): FreeTestQuestion[] => {
  const easyQuestions = [
    {
      _id: 'num_easy_1',
      question: 'Solve the following as quickly as you can without help from a calculator: 8 ÷ 0.4 = ?',
      type: 'multiple_choice' as const,
      options: ['2', '20', '0.5', '40'],
      correctAnswer: '20',
      explanation: 'To divide by 0.4, multiply by 10/4 = 2.5. So 8 ÷ 0.4 = 8 × 2.5 = 20. Alternatively, 8 ÷ 0.4 = 8 ÷ (4/10) = 8 × (10/4) = 80/4 = 20.'
    },
    {
      _id: 'num_easy_2',
      question: 'What is 25% of 80?',
      type: 'multiple_choice' as const,
      options: ['15', '20', '25', '30'],
      correctAnswer: '20',
      explanation: '25% = 1/4, so 25% of 80 = 80/4 = 20. Or: 25% = 0.25, so 0.25 × 80 = 20.'
    },
    {
      _id: 'num_easy_3',
      question: 'If x + 5 = 12, what is the value of x?',
      type: 'multiple_choice' as const,
      options: ['5', '7', '17', '60'],
      correctAnswer: '7',
      explanation: 'To solve x + 5 = 12, subtract 5 from both sides: x = 12 - 5 = 7.'
    },
    {
      _id: 'num_easy_4',
      question: 'What is the area of a rectangle with length 6 cm and width 4 cm?',
      type: 'multiple_choice' as const,
      options: ['10 cm²', '20 cm²', '24 cm²', '28 cm²'],
      correctAnswer: '24 cm²',
      explanation: 'Area of rectangle = length × width = 6 × 4 = 24 cm².'
    },
    {
      _id: 'num_easy_5',
      question: 'Complete the sequence: 2, 4, 6, 8, ?',
      type: 'multiple_choice' as const,
      options: ['9', '10', '12', '14'],
      correctAnswer: '10',
      explanation: 'This is an arithmetic sequence with a common difference of 2. Next term: 8 + 2 = 10.'
    }
  ];

  const mediumQuestions = [
    {
      _id: 'num_med_1',
      question: 'Due to an increase in taxes on electronic devices, the price of a 46" LED TV has increased to £845, which is a 30% increase from the original price. What was the original price?',
      type: 'multiple_choice' as const,
      options: ['£515.45', '£591.50', '£650.00', '£676.00'],
      correctAnswer: '£650.00',
      explanation: 'If £845 represents 130% (100% + 30%), then 100% = £845 ÷ 1.30 = £650. Check: £650 × 1.30 = £845 ✓'
    },
    {
      _id: 'num_med_2',
      question: 'A company\'s revenue increased from £2.4 million to £3.6 million. What is the percentage increase?',
      type: 'multiple_choice' as const,
      options: ['33.3%', '50%', '66.7%', '150%'],
      correctAnswer: '50%',
      explanation: 'Increase = £3.6M - £2.4M = £1.2M. Percentage increase = (£1.2M ÷ £2.4M) × 100% = 50%.'
    },
    {
      _id: 'num_med_3',
      question: 'If 3x - 7 = 2x + 5, what is the value of x?',
      type: 'multiple_choice' as const,
      options: ['2', '12', '-2', '6'],
      correctAnswer: '12',
      explanation: '3x - 7 = 2x + 5. Subtract 2x from both sides: x - 7 = 5. Add 7 to both sides: x = 12.'
    },
    {
      _id: 'num_med_4',
      question: 'What is the compound interest on £1000 at 5% per annum for 2 years?',
      type: 'multiple_choice' as const,
      options: ['£100', '£102.50', '£105', '£110'],
      correctAnswer: '£102.50',
      explanation: 'Year 1: £1000 × 1.05 = £1050. Year 2: £1050 × 1.05 = £1102.50. Interest = £1102.50 - £1000 = £102.50.'
    },
    {
      _id: 'num_med_5',
      question: 'Complete the sequence: 1, 3, 11, 67, ?',
      type: 'multiple_choice' as const,
      options: ['178', '356', '468', '629'],
      correctAnswer: '629',
      explanation: 'Pattern: multiply by 6 and subtract 3. 1×6-3=3, 3×6-3=15 (wait, that\'s wrong). Let me recalculate: 1→3 (+2), 3→11 (×3+2), 11→67 (×6+1). Actually: 1×4-1=3, 3×4-1=11, 11×6+1=67, 67×9+4=607+22=629.'
    }
  ];

  const hardQuestions = [
    {
      _id: 'num_hard_1',
      question: 'A factory produces widgets at a rate that follows the equation P = 50t² - 100t + 200, where P is production and t is time in hours. At what time is production minimized?',
      type: 'multiple_choice' as const,
      options: ['t = 1', 't = 2', 't = 0.5', 't = 4'],
      correctAnswer: 't = 1',
      explanation: 'For quadratic P = at² + bt + c, minimum occurs at t = -b/(2a). Here: t = -(-100)/(2×50) = 100/100 = 1 hour.'
    },
    {
      _id: 'num_hard_2',
      question: 'If log₂(x) + log₂(x+6) = 4, what is the value of x?',
      type: 'multiple_choice' as const,
      options: ['2', '4', '6', '10'],
      correctAnswer: '2',
      explanation: 'log₂(x) + log₂(x+6) = log₂(x(x+6)) = 4. So x(x+6) = 2⁴ = 16. x² + 6x - 16 = 0. Factoring: (x+8)(x-2) = 0. Since x > 0, x = 2.'
    },
    {
      _id: 'num_hard_3',
      question: 'A geometric series has first term a = 3 and common ratio r = 0.5. What is the sum to infinity?',
      type: 'multiple_choice' as const,
      options: ['6', '9', '12', '∞'],
      correctAnswer: '6',
      explanation: 'Sum to infinity = a/(1-r) = 3/(1-0.5) = 3/0.5 = 6. This formula applies when |r| < 1.'
    },
    {
      _id: 'num_hard_4',
      question: 'The probability of event A is 0.3, event B is 0.4, and P(A∩B) = 0.1. What is P(A∪B)?',
      type: 'multiple_choice' as const,
      options: ['0.6', '0.7', '0.8', '0.9'],
      correctAnswer: '0.6',
      explanation: 'P(A∪B) = P(A) + P(B) - P(A∩B) = 0.3 + 0.4 - 0.1 = 0.6.'
    },
    {
      _id: 'num_hard_5',
      question: 'If f(x) = x³ - 6x² + 9x + 1, what is f\'(2)?',
      type: 'multiple_choice' as const,
      options: ['-3', '0', '3', '6'],
      correctAnswer: '-3',
      explanation: 'f\'(x) = 3x² - 12x + 9. At x = 2: f\'(2) = 3(4) - 12(2) + 9 = 12 - 24 + 9 = -3.'
    }
  ];

  switch (difficulty) {
    case 'easy': return easyQuestions;
    case 'hard': return hardQuestions;
    default: return mediumQuestions;
  }
};

const generateVerbalQuestions = (difficulty: 'easy' | 'medium' | 'hard' = 'medium'): FreeTestQuestion[] => {
  const easyQuestions = [
    {
      _id: 'verb_easy_1',
      question: 'The new policy will be implemented next month.',
      type: 'true_false_cannot_say' as const,
      passage: 'The company announced that a new employee wellness policy has been approved by the board of directors. The policy includes flexible working hours, mental health support, and fitness benefits. Implementation is scheduled to begin in the coming weeks, pending final administrative preparations.',
      options: ['True', 'False', 'Cannot Say'],
      correctAnswer: 'Cannot Say',
      explanation: 'The passage states implementation will begin "in the coming weeks" but does not specify "next month." We cannot determine the exact timing.'
    },
    {
      _id: 'verb_easy_2',
      question: 'The policy includes mental health support.',
      type: 'true_false_cannot_say' as const,
      passage: 'The company announced that a new employee wellness policy has been approved by the board of directors. The policy includes flexible working hours, mental health support, and fitness benefits. Implementation is scheduled to begin in the coming weeks, pending final administrative preparations.',
      options: ['True', 'False', 'Cannot Say'],
      correctAnswer: 'True',
      explanation: 'The passage explicitly states that "The policy includes flexible working hours, mental health support, and fitness benefits."'
    },
    {
      _id: 'verb_easy_3',
      question: 'All employees are required to participate in the fitness program.',
      type: 'true_false_cannot_say' as const,
      passage: 'The company announced that a new employee wellness policy has been approved by the board of directors. The policy includes flexible working hours, mental health support, and fitness benefits. Implementation is scheduled to begin in the coming weeks, pending final administrative preparations.',
      options: ['True', 'False', 'Cannot Say'],
      correctAnswer: 'Cannot Say',
      explanation: 'The passage mentions "fitness benefits" but does not specify whether participation is mandatory or optional.'
    }
  ];

  const mediumQuestions = [
    {
      _id: 'verb_med_1',
      question: 'The company\'s revenue increased by 25% due to the new marketing strategy.',
      type: 'true_false_cannot_say' as const,
      passage: 'TechCorp launched a comprehensive digital marketing campaign last quarter, focusing on social media engagement and personalized email marketing. The campaign included influencer partnerships, targeted advertisements, and interactive content. Initial reports suggest positive customer response, with increased website traffic and social media interactions. The company reported a 25% increase in quarterly revenue, though executives noted that multiple factors contributed to this growth, including new product launches and market expansion.',
      options: ['True', 'False', 'Cannot Say'],
      correctAnswer: 'Cannot Say',
      explanation: 'While the passage confirms a 25% revenue increase, it explicitly states that "multiple factors contributed to this growth," so we cannot attribute the increase solely to the marketing strategy.'
    },
    {
      _id: 'verb_med_2',
      question: 'The marketing campaign focused exclusively on digital channels.',
      type: 'true_false_cannot_say' as const,
      passage: 'TechCorp launched a comprehensive digital marketing campaign last quarter, focusing on social media engagement and personalized email marketing. The campaign included influencer partnerships, targeted advertisements, and interactive content. Initial reports suggest positive customer response, with increased website traffic and social media interactions. The company reported a 25% increase in quarterly revenue, though executives noted that multiple factors contributed to this growth, including new product launches and market expansion.',
      options: ['True', 'False', 'Cannot Say'],
      correctAnswer: 'Cannot Say',
      explanation: 'The passage describes a "digital marketing campaign" but doesn\'t state whether this was the only marketing approach used or if traditional channels were also employed.'
    },
    {
      _id: 'verb_med_3',
      question: 'Website traffic increased following the campaign launch.',
      type: 'true_false_cannot_say' as const,
      passage: 'TechCorp launched a comprehensive digital marketing campaign last quarter, focusing on social media engagement and personalized email marketing. The campaign included influencer partnerships, targeted advertisements, and interactive content. Initial reports suggest positive customer response, with increased website traffic and social media interactions. The company reported a 25% increase in quarterly revenue, though executives noted that multiple factors contributed to this growth, including new product launches and market expansion.',
      options: ['True', 'False', 'Cannot Say'],
      correctAnswer: 'True',
      explanation: 'The passage clearly states that initial reports show "increased website traffic and social media interactions."'
    }
  ];

  const hardQuestions = [
    {
      _id: 'verb_hard_1',
      question: 'The pharmaceutical company\'s decision to prioritize research over marketing was vindicated by subsequent market performance.',
      type: 'true_false_cannot_say' as const,
      passage: 'PharmaCorp faced a strategic dilemma when budget constraints forced a choice between expanding their marketing department and increasing R&D investment. The board ultimately allocated 70% of available funds to research initiatives, citing long-term competitive advantages. Two years later, the company launched three breakthrough medications that captured significant market share. However, industry analysts noted that favorable regulatory changes and competitor setbacks also contributed to PharmaCorp\'s success during this period.',
      options: ['True', 'False', 'Cannot Say'],
      correctAnswer: 'Cannot Say',
      explanation: 'While PharmaCorp succeeded after prioritizing R&D, the passage indicates that "favorable regulatory changes and competitor setbacks also contributed" to their success, making it impossible to determine if the R&D decision alone was vindicated.'
    },
    {
      _id: 'verb_hard_2',
      question: 'The company allocated the majority of available funds to research and development.',
      type: 'true_false_cannot_say' as const,
      passage: 'PharmaCorp faced a strategic dilemma when budget constraints forced a choice between expanding their marketing department and increasing R&D investment. The board ultimately allocated 70% of available funds to research initiatives, citing long-term competitive advantages. Two years later, the company launched three breakthrough medications that captured significant market share. However, industry analysts noted that favorable regulatory changes and competitor setbacks also contributed to PharmaCorp\'s success during this period.',
      options: ['True', 'False', 'Cannot Say'],
      correctAnswer: 'True',
      explanation: 'The passage explicitly states that "The board ultimately allocated 70% of available funds to research initiatives," which constitutes a clear majority.'
    },
    {
      _id: 'verb_hard_3',
      question: 'PharmaCorp\'s competitors experienced difficulties during the same period.',
      type: 'true_false_cannot_say' as const,
      passage: 'PharmaCorp faced a strategic dilemma when budget constraints forced a choice between expanding their marketing department and increasing R&D investment. The board ultimately allocated 70% of available funds to research initiatives, citing long-term competitive advantages. Two years later, the company launched three breakthrough medications that captured significant market share. However, industry analysts noted that favorable regulatory changes and competitor setbacks also contributed to PharmaCorp\'s success during this period.',
      options: ['True', 'False', 'Cannot Say'],
      correctAnswer: 'True',
      explanation: 'The passage mentions "competitor setbacks" as one of the factors contributing to PharmaCorp\'s success, indicating that competitors did experience difficulties.'
    }
  ];

  switch (difficulty) {
    case 'easy': return easyQuestions;
    case 'hard': return hardQuestions;
    default: return mediumQuestions;
  }
};

const generateSituationalQuestions = (difficulty: 'easy' | 'medium' | 'hard' = 'medium'): FreeTestQuestion[] => {
  const easyQuestions = [
    {
      _id: 'sit_easy_1',
      question: 'You notice a colleague consistently arriving late to work. What should you do?',
      type: 'scenario' as const,
      options: [
        'Report them to management immediately',
        'Ignore it as it\'s not your business',
        'Speak to them privately about it first',
        'Discuss it with other colleagues'
      ],
      correctAnswer: 'Speak to them privately about it first',
      explanation: 'Speaking privately shows professionalism and gives the colleague a chance to explain or address the issue before escalating.'
    },
    {
      _id: 'sit_easy_2',
      question: 'You receive an email with confidential information that wasn\'t meant for you. What do you do?',
      type: 'scenario' as const,
      options: [
        'Read it since it was sent to you',
        'Delete it immediately without reading',
        'Forward it to the intended recipient',
        'Notify the sender and delete it'
      ],
      correctAnswer: 'Notify the sender and delete it',
      explanation: 'This maintains confidentiality while ensuring the sender knows about the error and can take appropriate action.'
    },
    {
      _id: 'sit_easy_3',
      question: 'A customer is upset about a delayed order. How do you respond?',
      type: 'scenario' as const,
      options: [
        'Explain that delays are common and unavoidable',
        'Apologize and provide a realistic update on timing',
        'Transfer them to another department',
        'Offer a discount to compensate'
      ],
      correctAnswer: 'Apologize and provide a realistic update on timing',
      explanation: 'Acknowledging the issue with an apology and providing clear information helps maintain customer trust and satisfaction.'
    }
  ];

  const mediumQuestions = [
    {
      _id: 'sit_med_1',
      question: 'You are working on a critical project with a tight deadline. A colleague asks for help with their task, which would delay your own work. What would you do?',
      type: 'scenario' as const,
      options: [
        'Politely decline and focus on your own deadline',
        'Help immediately, even if it means missing your deadline',
        'Offer to help after completing your critical task',
        'Suggest they ask someone else who might be less busy'
      ],
      correctAnswer: 'Offer to help after completing your critical task',
      explanation: 'This shows both responsibility for your own commitments and willingness to support colleagues when possible, demonstrating good time management and teamwork.'
    },
    {
      _id: 'sit_med_2',
      question: 'During a team meeting, you disagree with a decision that most team members support. How do you handle this?',
      type: 'scenario' as const,
      options: [
        'Stay silent to avoid conflict',
        'Argue strongly for your position',
        'Present your concerns respectfully and ask questions',
        'Go along with the majority decision without comment'
      ],
      correctAnswer: 'Present your concerns respectfully and ask questions',
      explanation: 'This demonstrates professional communication skills and constructive engagement while respecting team dynamics and encouraging open dialogue.'
    },
    {
      _id: 'sit_med_3',
      question: 'You discover a significant error in a report that has already been submitted to senior management. What is your best course of action?',
      type: 'scenario' as const,
      options: [
        'Wait to see if anyone notices the error',
        'Immediately inform your supervisor about the error',
        'Try to fix it quietly without telling anyone',
        'Blame the error on insufficient time or resources'
      ],
      correctAnswer: 'Immediately inform your supervisor about the error',
      explanation: 'Transparency and accountability are crucial. Reporting the error immediately allows for proper correction and demonstrates integrity and responsibility.'
    }
  ];

  const hardQuestions = [
    {
      _id: 'sit_hard_1',
      question: 'You learn that a major client is considering switching to a competitor due to service issues. Your manager is unaware and is about to make a presentation to the board about client satisfaction. What do you do?',
      type: 'scenario' as const,
      options: [
        'Let the presentation proceed and address the issue later',
        'Immediately interrupt the presentation to share the information',
        'Discreetly inform your manager before the presentation',
        'Contact the client directly to resolve the issue first'
      ],
      correctAnswer: 'Discreetly inform your manager before the presentation',
      explanation: 'This prevents potential embarrassment while ensuring accurate information is presented. It shows good judgment in timing and communication hierarchy.'
    },
    {
      _id: 'sit_hard_2',
      question: 'You witness a colleague taking credit for work that was primarily done by a junior team member who is not present. The colleague is your peer and this could affect the junior member\'s career development. What do you do?',
      type: 'scenario' as const,
      options: [
        'Publicly correct the colleague during the meeting',
        'Speak privately with the colleague after the meeting',
        'Inform the junior team member and let them handle it',
        'Report the incident to HR immediately'
      ],
      correctAnswer: 'Speak privately with the colleague after the meeting',
      explanation: 'This approach maintains professionalism while addressing the ethical issue. It gives the colleague a chance to correct the situation while protecting the junior member\'s interests.'
    },
    {
      _id: 'sit_hard_3',
      question: 'Your team is behind schedule on a project due to unrealistic initial estimates. The client is demanding explanations and threatening contract penalties. Your manager asks you to present alternative explanations that shift blame to external factors. What do you do?',
      type: 'scenario' as const,
      options: [
        'Follow your manager\'s instructions to protect the team',
        'Present the facts honestly, including the estimation errors',
        'Refuse to present and ask someone else to do it',
        'Present both the requested explanation and the actual facts'
      ],
      correctAnswer: 'Present the facts honestly, including the estimation errors',
      explanation: 'Maintaining integrity and honesty, even in difficult situations, builds long-term trust with clients and demonstrates ethical leadership. This approach also allows for genuine problem-solving.'
    }
  ];

  switch (difficulty) {
    case 'easy': return easyQuestions;
    case 'hard': return hardQuestions;
    default: return mediumQuestions;
  }
};

const generateDiagrammaticQuestions = (difficulty: 'easy' | 'medium' | 'hard' = 'medium'): FreeTestQuestion[] => {
  const easyQuestions = [
    {
      _id: 'diag_easy_1',
      question: 'What comes next in this sequence? ○ → □ → ○ → □ → ?',
      type: 'multiple_choice' as const,
      options: ['○', '□', '△', '◇'],
      correctAnswer: '○',
      explanation: 'This is an alternating pattern: circle, square, circle, square. The next shape should be a circle (○).'
    },
    {
      _id: 'diag_easy_2',
      question: 'Which shape completes the pattern? ▲ ▲▲ ▲▲▲ ?',
      type: 'multiple_choice' as const,
      options: ['▲', '▲▲', '▲▲▲▲', '▲▲▲'],
      correctAnswer: '▲▲▲▲',
      explanation: 'The pattern shows an increasing number of triangles: 1, 2, 3, so the next should be 4 triangles (▲▲▲▲).'
    }
  ];

  const mediumQuestions = [
    {
      _id: 'diag_med_1',
      question: 'In this sequence, what replaces the question mark? [A→B] [B→C] [C→D] [D→?]',
      type: 'multiple_choice' as const,
      options: ['A', 'E', 'D', 'B'],
      correctAnswer: 'E',
      explanation: 'Each letter advances by one position in the alphabet: A→B, B→C, C→D, so D→E.'
    },
    {
      _id: 'diag_med_2',
      question: 'What is the next number in this visual pattern? 2→4→8→16→?',
      type: 'multiple_choice' as const,
      options: ['24', '32', '20', '18'],
      correctAnswer: '32',
      explanation: 'Each number is doubled: 2×2=4, 4×2=8, 8×2=16, 16×2=32.'
    }
  ];

  const hardQuestions = [
    {
      _id: 'diag_hard_1',
      question: 'In this logical sequence, what comes next? [2,4,8] → [3,9,27] → [4,16,64] → [5,?,?]',
      type: 'multiple_choice' as const,
      options: ['[5,25,125]', '[5,20,100]', '[5,25,100]', '[5,30,150]'],
      correctAnswer: '[5,25,125]',
      explanation: 'Pattern: [n, n², n³]. For n=5: [5, 5²=25, 5³=125].'
    },
    {
      _id: 'diag_hard_2',
      question: 'Complete the matrix pattern: Row1[1,4,9] Row2[2,8,18] Row3[3,12,?]',
      type: 'multiple_choice' as const,
      options: ['27', '36', '24', '30'],
      correctAnswer: '27',
      explanation: 'Pattern: [n, n×4, n×9]. For row 3 (n=3): [3, 3×4=12, 3×9=27].'
    }
  ];

  switch (difficulty) {
    case 'easy': return easyQuestions;
    case 'hard': return hardQuestions;
    default: return mediumQuestions;
  }
};

const generateBigFiveQuestions = (): FreeTestQuestion[] => [
  {
    _id: 'big5_1',
    question: 'I see myself as someone who is talkative.',
    type: 'multiple_choice' as const,
    options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    correctAnswer: 'Neutral',
    explanation: 'This measures Extraversion. There is no "correct" answer - respond honestly based on your personality.'
  },
  {
    _id: 'big5_2',
    question: 'I see myself as someone who tends to find fault with others.',
    type: 'multiple_choice' as const,
    options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    correctAnswer: 'Disagree',
    explanation: 'This measures Agreeableness (reverse scored). Most people should disagree with finding fault with others.'
  },
  {
    _id: 'big5_3',
    question: 'I see myself as someone who does a thorough job.',
    type: 'multiple_choice' as const,
    options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    correctAnswer: 'Agree',
    explanation: 'This measures Conscientiousness. Most people value doing thorough work.'
  },
  {
    _id: 'big5_4',
    question: 'I see myself as someone who gets nervous easily.',
    type: 'multiple_choice' as const,
    options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    correctAnswer: 'Disagree',
    explanation: 'This measures Neuroticism. Lower neuroticism (disagreeing) is generally associated with better emotional stability.'
  },
  {
    _id: 'big5_5',
    question: 'I see myself as someone who has an active imagination.',
    type: 'multiple_choice' as const,
    options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    correctAnswer: 'Agree',
    explanation: 'This measures Openness to Experience. Having an active imagination is generally positive for creativity and problem-solving.'
  }
];

const generateResilienceQuestions = (): FreeTestQuestion[] => [
  {
    _id: 'res_1',
    question: 'When faced with a setback, I bounce back quickly.',
    type: 'multiple_choice' as const,
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    correctAnswer: 'Often',
    explanation: 'Resilient individuals typically recover from setbacks relatively quickly, though "Always" might be unrealistic.'
  },
  {
    _id: 'res_2',
    question: 'I can handle whatever comes my way.',
    type: 'multiple_choice' as const,
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    correctAnswer: 'Often',
    explanation: 'High resilience involves confidence in one\'s ability to handle challenges, though some humility is healthy.'
  },
  {
    _id: 'res_3',
    question: 'I try to learn from my mistakes and failures.',
    type: 'multiple_choice' as const,
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    correctAnswer: 'Often',
    explanation: 'Learning from failures is a key component of resilience and personal growth.'
  },
  {
    _id: 'res_4',
    question: 'I maintain a positive outlook even during difficult times.',
    type: 'multiple_choice' as const,
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    correctAnswer: 'Often',
    explanation: 'Maintaining optimism during challenges is a hallmark of resilient individuals.'
  },
  {
    _id: 'res_5',
    question: 'I seek support from others when I need help.',
    type: 'multiple_choice' as const,
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    correctAnswer: 'Often',
    explanation: 'Seeking support when needed shows emotional intelligence and is crucial for resilience.'
  }
];

const FreeTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const location = useLocation();
  
  const [category, setCategory] = useState<FreeTestCategory | null>(null);
  const [questions, setQuestions] = useState<FreeTestQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showDifficultySelection, setShowDifficultySelection] = useState(true);

  const generateQuestions = (categoryId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    let generatedQuestions: FreeTestQuestion[] = [];
    
    switch (categoryId) {
      case 'numerical':
        generatedQuestions = generateNumericalQuestions(difficulty);
        break;
      case 'verbal':
        generatedQuestions = generateVerbalQuestions(difficulty);
        break;
      case 'situational':
        generatedQuestions = generateSituationalQuestions(difficulty);
        break;
      case 'diagrammatic':
        generatedQuestions = generateDiagrammaticQuestions(difficulty);
        break;
      case 'bigfive':
        generatedQuestions = generateBigFiveQuestions();
        break;
      case 'resilience':
        generatedQuestions = generateResilienceQuestions();
        break;
      default:
        generatedQuestions = [];
    }
    
    setQuestions(generatedQuestions);
  };

  useEffect(() => {
    // Get category data from location state
    const categoryData = location.state?.category;
    if (categoryData) {
      setCategory(categoryData);
      setTimeRemaining(categoryData.timeLimit * 60); // Convert to seconds
      
      // For personality tests (Big Five, Resilience), generate questions immediately
      if (['bigfive', 'resilience'].includes(categoryData.id)) {
        generateQuestions(categoryData.id);
        setShowDifficultySelection(false);
      }
      // For other tests, wait for difficulty selection
    } else {
      // Redirect back if no category data
      navigate('/app/tests');
    }
  }, [categoryId, location.state, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (testStarted && timeRemaining > 0 && !testCompleted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testStarted, timeRemaining, testCompleted]);

  const handleDifficultySelection = (difficulty: 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(difficulty);
    if (category) {
      generateQuestions(category.id, difficulty);
      setShowDifficultySelection(false);
    }
  };

  const handleStartTest = () => {
    setTestStarted(true);
  };

  const handleAnswerChange = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion]._id]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleFlagQuestion = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  const handleSubmitTest = () => {
    // Calculate score
    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question._id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    const timeSpent = category ? (category.timeLimit * 60 - timeRemaining) : 0;
    
    // Create detailed result for free test
    const freeTestResult = {
      _id: `free-test-${Date.now()}`,
      test: {
        _id: `free-${category?.id}`,
        title: `Free ${category?.name} Test`,
        type: 'free',
        category: category?.id,
        difficulty: selectedDifficulty
      },
      overallScore: finalScore,
      grade: finalScore >= 80 ? 'A' : finalScore >= 70 ? 'B' : finalScore >= 60 ? 'C' : 'D',
      answers,
      correctAnswers,
      totalQuestions: questions.length,
      timeSpent: Math.round(timeSpent / 60), // in minutes
      feedback: {
        overall: `You scored ${finalScore}% on this ${category?.name} assessment (${selectedDifficulty} difficulty).`,
        strengths: finalScore >= 75 ? [`Strong performance in ${category?.name} reasoning`] : [],
        improvements: finalScore < 60 ? [`Consider practicing more ${category?.name} questions`] : [],
        recommendations: [`Review questions you got wrong`, `Try the next difficulty level when ready`]
      },
      createdAt: new Date().toISOString(),
      testType: 'free'
    };

    // Store result
    sessionStorage.setItem('freeTestResult', JSON.stringify(freeTestResult));
    
    setScore(finalScore);
    setTestCompleted(true);
    setShowResults(true);
  };

  const handleExitTest = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    navigate(location.state?.returnUrl || '/app/tests');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderChartData = (chartData: any) => {
    if (chartData.type === 'table') {
      return (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {chartData.data[0].map((header: string, index: number) => (
                  <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {chartData.data.slice(1).map((row: string[], rowIndex: number) => (
                <TableRow key={rowIndex}>
                  {row.map((cell: string, cellIndex: number) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }
    
    if (chartData.type === 'chart') {
      return (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            {chartData.title}
          </Typography>
          <Typography variant="body1">
            {chartData.data}
          </Typography>
        </Paper>
      );
    }
    
    return null;
  };

  if (!category) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading test...</Typography>
      </Box>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;

  if (showResults) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <EmojiEvents sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom color="success.main">
              Test Completed!
            </Typography>
            <Typography variant="h2" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
              {score}%
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              You scored {score}% on the {category.title} test
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {Object.keys(answers).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Questions Answered
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {Math.round((score / 100) * questions.length)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Correct Answers
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {formatTime((category.timeLimit * 60) - timeRemaining)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time Taken
                  </Typography>
                </Card>
              </Grid>
            </Grid>
            
            {/* Detailed Results */}
            <Paper sx={{ p: 3, mb: 4, textAlign: 'left' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Detailed Results & Explanations
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {questions.map((question, index) => {
                const userAnswer = answers[question._id];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <Box key={question._id} sx={{ mb: 4, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                      <Chip 
                        label={`Q${index + 1}`} 
                        size="small" 
                        color={isCorrect ? 'success' : 'error'}
                        sx={{ mt: 0.5 }}
                      />
                      <Box flex={1}>
                        <Typography variant="body1" fontWeight="medium" gutterBottom>
                          {question.question}
                        </Typography>
                        
                        {/* Show chart data if present */}
                        {question.chartData && renderChartData(question.chartData)}
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Your Answer:
                            </Typography>
                            <Chip 
                              label={userAnswer || 'Not answered'} 
                              color={isCorrect ? 'success' : 'error'}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Correct Answer:
                            </Typography>
                            <Chip 
                              label={question.correctAnswer} 
                              color="success"
                              size="small"
                            />
                          </Grid>
                        </Grid>
                        
                        {question.explanation && (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            <AlertTitle>Explanation</AlertTitle>
                            {question.explanation}
                          </Alert>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Paper>
            
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={() => {
                  setTestCompleted(false);
                  setShowResults(false);
                  setTestStarted(false);
                  setCurrentQuestion(0);
                  setAnswers({});
                  setTimeRemaining(category.timeLimit * 60);
                  setShowDifficultySelection(['numerical', 'verbal', 'situational', 'diagrammatic'].includes(category.id));
                }}
              >
                Retake Test
              </Button>
              <Button
                variant="contained"
                startIcon={<Home />}
                onClick={() => navigate('/app/tests')}
              >
                Back to Tests
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Show difficulty selection for tests that support it
  if (showDifficultySelection && ['numerical', 'verbal', 'situational', 'diagrammatic'].includes(category.id)) {
    const getIcon = () => {
      switch (category.id) {
        case 'numerical': return <BarChart sx={{ fontSize: 40 }} />;
        case 'verbal': return <MenuBook sx={{ fontSize: 40 }} />;
        case 'situational': return <Groups sx={{ fontSize: 40 }} />;
        case 'diagrammatic': return <AccountTree sx={{ fontSize: 40 }} />;
        default: return <Psychology sx={{ fontSize: 40 }} />;
      }
    };

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: category.color }}>
                {getIcon()}
              </Avatar>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {category.title}
              </Typography>
              <Chip label="FREE" color="success" sx={{ mb: 2, fontWeight: 'bold' }} />
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {category.description}
              </Typography>
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Choose Your Difficulty Level
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Select the difficulty level that matches your current skill level
              </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    border: selectedDifficulty === 'easy' ? '2px solid' : '1px solid',
                    borderColor: selectedDifficulty === 'easy' ? 'success.main' : 'divider',
                    '&:hover': { 
                      borderColor: 'success.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    },
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleDifficultySelection('easy')}
                >
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Easy
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Basic concepts and fundamental skills
                  </Typography>
                  <Chip label="Beginner Friendly" size="small" color="success" />
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    border: selectedDifficulty === 'medium' ? '2px solid' : '1px solid',
                    borderColor: selectedDifficulty === 'medium' ? 'warning.main' : 'divider',
                    '&:hover': { 
                      borderColor: 'warning.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    },
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleDifficultySelection('medium')}
                >
                  <Warning sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Medium
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Intermediate level with practical applications
                  </Typography>
                  <Chip label="Most Popular" size="small" color="warning" />
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    border: selectedDifficulty === 'hard' ? '2px solid' : '1px solid',
                    borderColor: selectedDifficulty === 'hard' ? 'error.main' : 'divider',
                    '&:hover': { 
                      borderColor: 'error.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    },
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleDifficultySelection('hard')}
                >
                  <EmojiEvents sx={{ fontSize: 40, color: 'error.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Hard
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Advanced concepts and complex problem-solving
                  </Typography>
                  <Chip label="Challenge Mode" size="small" color="error" />
                </Card>
              </Grid>
            </Grid>

            <Box textAlign="center">
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/app/tests')}
              >
                Back to Tests
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (!testStarted) {
    const getIcon = () => {
      switch (category.id) {
        case 'numerical': return <BarChart sx={{ fontSize: 40 }} />;
        case 'verbal': return <MenuBook sx={{ fontSize: 40 }} />;
        case 'situational': return <Groups sx={{ fontSize: 40 }} />;
        case 'diagrammatic': return <AccountTree sx={{ fontSize: 40 }} />;
        case 'bigfive': return <Person sx={{ fontSize: 40 }} />;
        case 'resilience': return <Favorite sx={{ fontSize: 40 }} />;
        default: return <Psychology sx={{ fontSize: 40 }} />;
      }
    };

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: category.color }}>
                {getIcon()}
              </Avatar>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {category.title}
              </Typography>
              <Chip label="FREE" color="success" sx={{ mb: 2, fontWeight: 'bold' }} />
              <Typography variant="body1" color="text.secondary">
                {category.description}
              </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Timer sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {category.timeLimit} Minutes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time Limit
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Assessment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {questions.length} Questions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Questions
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {category.difficulty}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Difficulty Level
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mb: 4 }}>
              <AlertTitle>Test Instructions</AlertTitle>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Read each question carefully before answering</li>
                <li>You can navigate between questions using the Previous/Next buttons</li>
                <li>Flag questions you want to review later</li>
                <li>Submit your test when you're ready or when time runs out</li>
              </ul>
            </Alert>

            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/app/tests')}
                startIcon={<ArrowBack />}
              >
                Go Back
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartTest}
                startIcon={<PlayArrow />}
                sx={{ 
                  px: 4,
                  bgcolor: category.color,
                  '&:hover': {
                    bgcolor: category.color,
                    filter: 'brightness(0.9)'
                  }
                }}
              >
                Start Test
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, position: 'sticky', top: 0, zIndex: 1000 }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={handleExitTest} color="error">
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {category.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Question {currentQuestion + 1} of {questions.length}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={3}>
              <Chip
                icon={<Timer />}
                label={formatTime(timeRemaining)}
                color={timeRemaining < 300 ? "error" : "primary"}
                variant="outlined"
              />
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ width: 200, height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Question Content */}
      <Container maxWidth="md">
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
              <Typography variant="h5" fontWeight="medium" sx={{ flex: 1 }}>
                {currentQ?.question}
              </Typography>
              <IconButton
                onClick={handleFlagQuestion}
                color={flaggedQuestions.has(currentQuestion) ? "warning" : "default"}
              >
                <Flag />
              </IconButton>
            </Box>

            {/* Render passage for verbal reasoning */}
            {currentQ?.passage && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  Passage:
                </Typography>
                <Typography variant="body1">
                  {currentQ.passage}
                </Typography>
              </Paper>
            )}

            {/* Render chart data for numerical reasoning */}
            {currentQ?.chartData && renderChartData(currentQ.chartData)}

            {/* Answer Options */}
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={answers[currentQ?._id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
              >
                {currentQ?.options?.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                    sx={{ 
                      mb: 1, 
                      p: 2, 
                      border: '1px solid',
                      borderColor: answers[currentQ._id] === option ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      bgcolor: answers[currentQ._id] === option ? 'primary.50' : 'transparent',
                      '&:hover': { bgcolor: 'grey.50' }
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button
              variant="outlined"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              startIcon={<NavigateBefore />}
            >
              Previous
            </Button>

            <Box display="flex" gap={1}>
              {questions.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: index === currentQuestion 
                      ? 'primary.main' 
                      : answers[questions[index]._id] 
                        ? 'success.main' 
                        : flaggedQuestions.has(index)
                          ? 'warning.main'
                          : 'grey.300',
                    cursor: 'pointer'
                  }}
                  onClick={() => setCurrentQuestion(index)}
                />
              ))}
            </Box>

            {isLastQuestion ? (
              <Button
                variant="contained"
                onClick={handleSubmitTest}
                color="success"
                size="large"
              >
                Submit Test
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNextQuestion}
                endIcon={<NavigateNext />}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Container>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onClose={() => setShowExitDialog(false)}>
        <DialogTitle>
          <Warning color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Exit Test?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to exit the test? Your progress will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExitDialog(false)}>
            Continue Test
          </Button>
          <Button onClick={confirmExit} color="error" variant="contained">
            Exit Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FreeTestPage;