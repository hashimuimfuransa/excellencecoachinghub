import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Divider,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  CardActions,
  CardMedia,
  Fade,
  Zoom,
  Slide,
  Collapse,
  useTheme,
  useMediaQuery,
  alpha,
  styled
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Publish,
  Unpublished,
  MoreVert,
  Search,
  FilterList,
  Download,
  Upload,
  Assessment,
  School,
  TrendingUp,
  People,
  Timer,
  CloudUpload,
  FileUpload,
  Description,
  PictureAsPdf,
  Image,
  TextSnippet,
  AutoFixHigh,
  SmartToy,
  ContentCopy,
  Refresh,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  ExpandLess,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
  Share,
  GetApp,
  Print,
  Archive,
  Restore,
  Settings,
  Tune,
  ViewModule,
  ViewList,
  Sort,
  FilterAlt,
  Close,
  Save,
  Cancel,
  Check,
  AddCircle,
  RemoveCircle,
  Schedule,
  AccessTime,
  Today,
  DateRange,
  Event,
  Timeline,
  Send,
  Mail,
  Email,
  AttachEmail,
  Reply,
  ReplyAll,
  Forward,
  Link,
  LinkOff,
  InsertLink,
  InsertPhoto,
  InsertDriveFile,
  InsertEmoticon,
  InsertChart,
  InsertComment,
  InsertInvitation,
  InsertPageBreak,
  Quiz
} from '@mui/icons-material';
import { superAdminService } from '../../services/superAdminService';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
  },
}));

const GradientCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: 16,
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    pointerEvents: 'none',
  },
}));

const UploadArea = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragActive',
})<{ isDragActive: boolean }>(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
  borderRadius: 12,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
}));

const AnimatedFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: 1000,
  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
  color: 'white',
  '&:hover': {
    background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
    transform: 'scale(1.1)',
  },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const StatCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  color: 'white',
  borderRadius: 16,
  overflow: 'hidden',
  position: 'relative',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 8px 25px rgba(102, 126, 234, 0.3)'
      : '0 8px 25px rgba(0,0,0,0.15)',
  },
}));

interface PastPaper {
  _id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  year: number;
  examBoard?: string;
  duration: number;
  totalMarks: number;
  totalAttempts: number;
  averageScore: number;
  difficultyRating: number;
  isPublished: boolean;
  publishedAt?: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  questions: any[];
  createdAt: string;
}

const PastPaperManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<PastPaper | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPaper, setMenuPaper] = useState<PastPaper | null>(null);
  
  // File upload and extraction states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState(0);
  const [expandedPaper, setExpandedPaper] = useState<string | false>(false);
  
  // Custom input states
  const [customSubject, setCustomSubject] = useState('');
  const [customLevel, setCustomLevel] = useState('');
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [showCustomLevel, setShowCustomLevel] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [customLevels, setCustomLevels] = useState<string[]>([]);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // Helper function to truncate description
  const truncateDescription = (text: string): string => {
    return text.length > 1000 ? text.substring(0, 997) + '...' : text;
  };

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    level: 'O-Level',
    year: new Date().getFullYear(),
    examBoard: '',
    duration: 60,
    totalMarks: 100,
    difficultyRating: 1,
    tags: [] as string[],
    isPublished: false,
    allowMultipleAttempts: true,
    showResultsImmediately: true,
    showCorrectAnswers: true,
    showExplanations: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    provideFeedback: true,
    feedbackType: 'immediate'
  });

  const defaultSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
    'Geography', 'Economics', 'Computer Science', 'Business Studies',
    'Psychology', 'Sociology', 'Literature', 'Art', 'Music', 'Physical Education',
    'Accounting', 'Statistics', 'Engineering', 'Medicine', 'Law', 'Architecture',
    'Agriculture', 'Environmental Science', 'Political Science', 'Philosophy',
    'Anthropology', 'Linguistics', 'Journalism', 'Communications', 'Marketing',
    'Finance', 'Management', 'International Relations', 'Public Health',
    'Nursing', 'Education', 'Social Work', 'Criminology', 'Tourism',
    'Hospitality', 'Sports Science', 'Nutrition', 'Dentistry', 'Veterinary Science'
  ];

  const defaultLevels = [
    'O-Level', 'A-Level', 'University', 'Professional', 'General',
    'Primary', 'Secondary', 'High School', 'College', 'Graduate',
    'Postgraduate', 'Doctorate', 'Certificate', 'Diploma', 'Foundation',
    'Intermediate', 'Advanced', 'Beginner', 'Expert', 'Master'
  ];

  // Combined arrays with custom items
  const subjects = [...defaultSubjects, ...customSubjects];
  const levels = [...defaultLevels, ...customLevels];

  const examBoards = [
    'Cambridge', 'Edexcel', 'AQA', 'OCR', 'WJEC', 'SQA', 'CCEA', 'Pearson'
  ];

  useEffect(() => {
    loadPastPapers();
  }, [page, searchTerm, statusFilter, subjectFilter, levelFilter]);

  const loadPastPapers = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getPastPapers({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter === 'published',
        subject: subjectFilter || undefined,
        level: levelFilter || undefined
      });

      if (response.success) {
        setPastPapers(response.data.pastPapers);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load past papers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaper = () => {
    setSelectedPaper(null);
    setFormData({
      title: '',
      description: '',
      subject: '',
      level: 'O-Level',
      year: new Date().getFullYear(),
      examBoard: '',
      duration: 60,
      totalMarks: 100,
      difficultyRating: 1,
      tags: [],
      isPublished: false,
      allowMultipleAttempts: true,
      showResultsImmediately: true,
      showCorrectAnswers: true,
      showExplanations: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      provideFeedback: true,
      feedbackType: 'immediate'
    });
    setGeneratedQuestions([]);
    setDialogOpen(true);
  };

  const handleEditPaper = (paper: PastPaper) => {
    setSelectedPaper(paper);
    setFormData({
      title: paper.title,
      description: paper.description,
      subject: paper.subject,
      level: paper.level,
      year: paper.year,
      examBoard: paper.examBoard || '',
      duration: paper.duration,
      totalMarks: paper.totalMarks,
      difficultyRating: (paper as any).difficultyRating || 1,
      tags: (paper as any).tags || [],
      isPublished: paper.isPublished,
      allowMultipleAttempts: true,
      showResultsImmediately: true,
      showCorrectAnswers: true,
      showExplanations: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      provideFeedback: true,
      feedbackType: 'immediate'
    });
    // Load questions and ensure they have points field
    const questions = (paper as any).questions || [];
    const questionsWithPoints = questions.map((q: any) => ({
      ...q,
      points: q.points || q.marks || 1
    }));
    setGeneratedQuestions(questionsWithPoints);
    setDialogOpen(true);
  };

  const handleSavePaper = async () => {
    try {
      // Truncate description if too long (max 1000 characters)
      const truncatedDescription = truncateDescription(formData.description);
      
      const paperData = {
        ...formData,
        description: truncatedDescription,
        questions: generatedQuestions.filter(q => q.question.trim() !== '')
      };
      
      if (selectedPaper) {
        await superAdminService.updatePastPaper(selectedPaper._id, paperData);
        setSuccess('Past paper updated successfully');
      } else {
        await superAdminService.createPastPaper(paperData);
        setSuccess('Past paper created successfully');
      }
      setDialogOpen(false);
      loadPastPapers();
    } catch (err: any) {
      setError(err.message || 'Failed to save past paper');
    }
  };

  const handleDeletePaper = async () => {
    if (!selectedPaper) return;

    try {
      await superAdminService.deletePastPaper(selectedPaper._id);
      setSuccess('Past paper deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPaper(null);
      loadPastPapers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete past paper');
    }
  };

  const handlePublishPaper = async (paper: PastPaper) => {
    try {
      if (paper.isPublished) {
        await superAdminService.unpublishPastPaper(paper._id);
        setSuccess('Past paper unpublished successfully');
      } else {
        await superAdminService.publishPastPaper(paper._id);
        setSuccess('Past paper published successfully');
      }
      loadPastPapers();
    } catch (err: any) {
      // Check if it's the questions validation error
      if (err.message && err.message.includes('without questions')) {
        setError('Cannot publish past paper without questions. Please add questions to the past paper before publishing.');
      } else {
      setError(err.message || 'Failed to update publication status');
      }
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, paper: PastPaper) => {
    setMenuAnchor(event.currentTarget);
    setMenuPaper(paper);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuPaper(null);
  };

  const getStatusColor = (isPublished: boolean) => {
    return isPublished ? 'success' : 'default';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'O-Level': return 'primary';
      case 'A-Level': return 'secondary';
      case 'University': return 'success';
      case 'Professional': return 'warning';
      case 'General': return 'info';
      default: return 'default';
    }
  };

  // File upload and extraction methods
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type.startsWith('image/') || 
      file.type === 'text/plain' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type.startsWith('image/') || 
      file.type === 'text/plain' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/plain') {
        // For text files, read as text
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        // For images, we would typically use OCR here
        resolve(`[IMAGE FILE: ${file.name}]\nFile size: ${(file.size / 1024 / 1024).toFixed(2)} MB\nType: ${file.type}\n\nOCR processing would extract text from this image.`);
      } else if (file.type === 'application/pdf' || file.type.includes('word') || file.type.includes('document') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
        // For PDF and Word documents, use the backend document processor service
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const textContent = await extractTextUsingBackendService(arrayBuffer, file.name, file.type);
            if (textContent && textContent.length > 50) {
              resolve(textContent);
            } else {
              resolve(`[${file.type.includes('pdf') ? 'PDF' : 'WORD'} FILE: ${file.name}]\nFile size: ${(file.size / 1024 / 1024).toFixed(2)} MB\nType: ${file.type}\n\nDocument processing failed. Please try converting to .txt format.`);
            }
          } catch (error) {
            console.error('Error processing document:', error);
            resolve(`[${file.type.includes('pdf') ? 'PDF' : 'WORD'} FILE: ${file.name}]\nFile size: ${(file.size / 1024 / 1024).toFixed(2)} MB\nType: ${file.type}\n\nDocument processing failed. Please try converting to .txt format.`);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read document'));
        reader.readAsArrayBuffer(file);
      } else {
        // For other file types, try to read as text
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content && content.length > 50 && !content.includes('')) {
            resolve(content);
          } else {
            resolve(`[FILE: ${file.name}]\nFile size: ${(file.size / 1024 / 1024).toFixed(2)} MB\nType: ${file.type}\n\nFile type not supported for text extraction. Please use .txt format.`);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      }
    });
  };

  // Helper function to extract text using the backend document processor service
  const extractTextUsingBackendService = async (arrayBuffer: ArrayBuffer, fileName: string, mimeType: string): Promise<string> => {
    try {
      console.log(`📄 Processing document using backend service: ${fileName} (${mimeType})`);
      
      // Convert ArrayBuffer to base64 for API call
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));
      
      // Use the existing API service for proper authentication
      const response = await superAdminService.extractTextFromDocument({
        fileData: base64,
        fileName: fileName,
        mimeType: mimeType
      });
      
      if (response.success && response.extractedText) {
        console.log(`✅ Successfully extracted ${response.extractedText.length} characters from ${fileName}`);
        return response.extractedText;
      } else {
        console.log(`❌ Backend extraction failed for ${fileName}:`, response.error);
        return '';
      }
    } catch (error) {
      console.error('Error calling backend document processor:', error);
      return '';
    }
  };

  // Function to parse text and generate questions using AI
  const parseTextToQuestions = async (text: string): Promise<any[]> => {
    console.log('Parsing text for questions using AI:', text.substring(0, 200) + '...');
    console.log('Full text length:', text.length);
    
    try {
      // Use AI to parse and structure questions
      const questions = await parseQuestionsWithAI(text);
      console.log(`AI generated ${questions.length} questions`);
      
      // Log each question for debugging
      questions.forEach((q, index) => {
        console.log(`Question ${index + 1}:`, q.question.substring(0, 100) + '...');
      });
      
      return questions;
    } catch (error: any) {
      console.error('AI parsing failed, falling back to basic parsing:', error);
      
      // Check if it's a quota exceeded error
      if (error.message?.includes('QUOTA_EXCEEDED')) {
        console.warn('⚠️ Gemini AI quota exceeded. Using basic parsing instead.');
        setError('AI service quota exceeded. Using basic text parsing instead.');
      } else if (error.message?.includes('FORBIDDEN')) {
        console.warn('⚠️ Gemini AI access forbidden. Using basic parsing instead.');
        setError('AI service access denied. Using basic text parsing instead.');
      }
      
      // Fallback to basic parsing if AI fails
      const basicQuestions = parseQuestionsBasic(text);
      console.log(`Basic parsing generated ${basicQuestions.length} questions`);
      
      // Log each question for debugging
      basicQuestions.forEach((q, index) => {
        console.log(`Basic Question ${index + 1}:`, q.question.substring(0, 100) + '...');
      });
      
      return basicQuestions;
    }
  };

  // Helper function to add delay between AI requests
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // AI-powered question parsing
  const parseQuestionsWithAI = async (text: string): Promise<any[]> => {
    try {
      // Add a small delay to prevent hitting quota limits
      await delay(2000); // 2 second delay
      const prompt = `
        IMPORTANT: You must separate each individual question from this exam document. Do NOT combine multiple questions into one.

        Instructions:
        1. Look for question patterns like:
           - Questions starting with numbers (1., 2., 3., etc.)
           - Questions starting with letters (a), b), c), etc.)
           - Questions ending with question marks (?)
           - Questions with "Choose", "Select", "What", "How", "Why", "Explain", "Calculate", "Solve"
        
        2. For each individual question found, extract:
           - The complete question text (only that specific question)
           - Question type (multiple-choice, true-false, short-answer, essay)
           - Options (if multiple choice: A), B), C), D) or A., B., C., D.)
           - Correct answer (if available)
           - Section/topic
           - Estimated marks (1-5 points)
        
        3. Each question should be a separate object in the JSON array
        4. Do NOT combine the entire document into one question
        5. If you find 10 questions, return 10 separate question objects
        
        Return ONLY a JSON array with this exact structure:
        [
          {
            "id": "q1",
            "question": "Complete individual question text here",
            "type": "multiple-choice",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option B",
            "section": "Subject Topic",
            "marks": 2,
            "points": 2
          },
          {
            "id": "q2",
            "question": "Another complete individual question text here",
            "type": "short-answer",
            "options": [],
            "correctAnswer": "",
            "section": "Subject Topic",
            "marks": 3,
            "points": 3
          }
        ]
        
        Document content to analyze:
        ${text}
      `;

      const response = await superAdminService.generateAIContent(prompt);
      
      if (response && response.content) {
        try {
          // Try to parse the AI response as JSON
          const questions = JSON.parse(response.content);
          if (Array.isArray(questions)) {
            return questions.map((q, index) => ({
              id: q.id || `q${index + 1}`,
              question: q.question || '',
              type: q.type || 'short-answer',
              options: q.options || [],
              correctAnswer: q.correctAnswer || '',
              section: q.section || 'General',
              marks: q.marks || 1,
              points: q.points || q.marks || 1 // Add points field
            }));
          }
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError);
        }
      }
      
      // If AI response is not valid JSON, try to extract questions from text
      return extractQuestionsFromAIText(response?.content || '');
      
    } catch (error) {
      console.error('AI question parsing failed:', error);
      throw error;
    }
  };

  // Extract questions from AI text response (fallback)
  const extractQuestionsFromAIText = (aiText: string): any[] => {
    const questions: any[] = [];
    const lines = aiText.split('\n').filter(line => line.trim());
    
    let currentQuestion: any = null;
    let questionNumber = 1;
    
    for (const line of lines) {
      // Look for question patterns in AI response
      const questionMatch = line.match(/^\d+[\.\)]\s*(.+)/i) || 
                          line.match(/^Question\s*\d*[\.\)]\s*(.+)/i) ||
                          line.match(/^Q\d*[\.\)]\s*(.+)/i);
      
      if (questionMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        
        currentQuestion = {
          id: `q${questionNumber}`,
          question: questionMatch[1].trim(),
          type: 'short-answer',
          options: [],
          correctAnswer: '',
          section: 'General',
          marks: 1,
          points: 1
        };
        questionNumber++;
      } else if (currentQuestion && line.match(/^[A-D][\.\)]\s*(.+)/i)) {
        const optionMatch = line.match(/^[A-D][\.\)]\s*(.+)/i);
        if (optionMatch) {
          currentQuestion.options.push(optionMatch[1].trim());
          currentQuestion.type = 'multiple-choice';
        }
      } else if (currentQuestion && line.toLowerCase().includes('answer:')) {
        const answerMatch = line.match(/answer:\s*(.+)/i);
        if (answerMatch) {
          currentQuestion.correctAnswer = answerMatch[1].trim();
        }
      }
    }
    
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    
    return questions;
  };

  // Basic question parsing (fallback)
  const parseQuestionsBasic = (text: string): any[] => {
    console.log('Using basic question parsing...');
    
    const questions: any[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentQuestion: any = null;
    let questionNumber = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect question patterns - more comprehensive matching
      const questionMatch = line.match(/^(\d+[\.\)]\s*|Q\d*[\.\)]\s*|Question\s*\d*[\.\)]\s*|^\d+\.\s*|^[a-z][\.\)]\s*|^[ivx]+[\.\)]\s*)(.+)/i) ||
                           // Questions ending with question marks
                           (line.includes('?') && line.length > 10) ||
                           // Questions starting with common question words
                           /^(What|How|Why|When|Where|Which|Who|Explain|Describe|Calculate|Solve|Define|List|Compare|Analyze|Discuss)/i.test(line);
      
      if (questionMatch) {
        // Save previous question if exists
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        
        // Extract question text
        let questionText = '';
        if (questionMatch[2]) {
          questionText = questionMatch[2].trim();
        } else if (line.includes('?')) {
          questionText = line.trim();
        } else {
          questionText = line.trim();
        }
        
        // Start new question
        currentQuestion = {
          id: `q${questionNumber}`,
          question: questionText,
          type: 'multiple-choice',
          options: [],
          correctAnswer: '',
          section: 'General',
          marks: 1,
          points: 1
        };
        questionNumber++;
        continue;
      }
      
      // Detect multiple choice options (A), B), C), D) or A., B., C., D.)
      const optionMatch = line.match(/^([A-D][\.\)]\s*)(.+)/i);
      if (optionMatch && currentQuestion) {
        currentQuestion.options.push(optionMatch[2].trim());
        continue;
      }
      
      // Detect true/false questions
      if (currentQuestion && (line.toLowerCase().includes('true') || line.toLowerCase().includes('false'))) {
        if (!currentQuestion.options.includes('True')) {
          currentQuestion.options = ['True', 'False'];
          currentQuestion.type = 'true-false';
        }
        continue;
      }
      
      // Detect short answer questions (questions ending with ? or containing "what", "how", "why", "explain")
      if (currentQuestion && (line.includes('?') || 
          /(what|how|why|explain|describe|define|calculate|solve)/i.test(line))) {
        currentQuestion.type = 'short-answer';
        currentQuestion.options = [];
        continue;
      }
      
      // Detect essay questions
      if (currentQuestion && (line.toLowerCase().includes('essay') || 
          line.toLowerCase().includes('discuss') || 
          line.toLowerCase().includes('analyze'))) {
        currentQuestion.type = 'essay';
        currentQuestion.options = [];
        continue;
      }
      
      // Detect answer patterns
      if (currentQuestion && line.match(/^(answer|correct answer|solution)[\s:]/i)) {
        const answerMatch = line.match(/^(answer|correct answer|solution)[\s:]\s*(.+)/i);
        if (answerMatch) {
          currentQuestion.correctAnswer = answerMatch[2].trim();
        }
        continue;
      }
      
      // If we have a current question and this line doesn't match any pattern,
      // append it to the question text
      if (currentQuestion && !line.match(/^[A-D][\.\)]/i) && !line.match(/^(answer|correct answer|solution)/i)) {
        currentQuestion.question += ' ' + line;
      }
    }
    
    // Add the last question
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    
    // If no structured questions found, try to split by sentences and create questions
    if (questions.length === 0) {
      console.log('No structured questions found, creating from sentences...');
      
      // Split text into sentences and look for question patterns
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      let questionIndex = 1;
      
      for (const sentence of sentences) {
        const cleanSentence = sentence.trim().replace(/\s+/g, ' ');
        
        // Check if this sentence looks like a question
        if (cleanSentence.includes('?') || 
            /^(What|How|Why|When|Where|Which|Who|Explain|Describe|Calculate|Solve|Define|List|Compare|Analyze|Discuss)/i.test(cleanSentence) ||
            cleanSentence.length > 50) {
          
          questions.push({
            id: `q${questionIndex}`,
            question: cleanSentence.endsWith('?') ? cleanSentence : cleanSentence + '?',
            type: 'short-answer',
            options: [],
            correctAnswer: '',
            section: 'General',
            marks: 2,
            points: 2
          });
          questionIndex++;
        }
      }
      
      // If still no questions, split by paragraphs as last resort
      if (questions.length === 0) {
        console.log('Creating questions from paragraphs as last resort...');
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 30);
        paragraphs.forEach((paragraph, index) => {
          if (paragraph.trim().length > 20) {
            const cleanParagraph = paragraph.trim().replace(/\s+/g, ' ');
            questions.push({
              id: `q${index + 1}`,
              question: `Question ${index + 1}: ${cleanParagraph.substring(0, 150)}${cleanParagraph.length > 150 ? '...' : ''}`,
              type: 'short-answer',
              options: [],
              correctAnswer: '',
              section: 'General',
              marks: 2,
              points: 2
            });
          }
        });
      }
    }
    
    console.log(`Basic parsing generated ${questions.length} questions`);
    return questions;
  };

  const processUploadedFiles = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setExtractedText('');
    setGeneratedQuestions([]);
    
    try {
      let allExtractedText = '';
      let allQuestions: any[] = [];
      let processedCount = 0;
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        try {
          const extracted = await extractTextFromFile(file);
          allExtractedText += `\n\n--- ${file.name} ---\n${extracted}`;
          
          // Generate questions from extracted text for all file types
          if (extracted && !extracted.startsWith('[')) {
            console.log(`Processing file: ${file.name}, Type: ${file.type}`);
            const questions = await parseTextToQuestions(extracted);
            allQuestions = [...allQuestions, ...questions];
            console.log(`Generated ${questions.length} questions from ${file.name}`);
          } else {
            console.log(`Skipping question generation for ${file.name} - no extractable text content`);
          }
          
          processedCount++;
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          allExtractedText += `\n\n--- ${file.name} ---\n[ERROR: Failed to process this file]`;
        }
        
        setUploadProgress(((i + 1) / uploadedFiles.length) * 100);
      }
      
      // Truncate description if too long (max 1000 characters)
      const truncatedText = truncateDescription(allExtractedText);
      
      setExtractedText(truncatedText);
      setGeneratedQuestions(allQuestions);
      
      if (processedCount === uploadedFiles.length) {
        setSuccess(`Successfully processed all ${uploadedFiles.length} file(s) and generated ${allQuestions.length} questions`);
      } else {
        setSuccess(`Processed ${processedCount} of ${uploadedFiles.length} file(s) and generated ${allQuestions.length} questions (some files had errors)`);
      }
      
      // Auto-populate form with extracted text if there's content
      if (allExtractedText.trim()) {
        setFormData(prev => {
          const newDescription = prev.description + (prev.description ? '\n\n' : '') + allExtractedText;
          // Truncate description if too long (max 1000 characters)
          const truncatedDescription = truncateDescription(newDescription);
          
          return {
            ...prev,
            description: truncatedDescription
          };
        });
      }
      
    } catch (error) {
      console.error('Error processing files:', error);
      setError('Failed to process uploaded files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setUploadedFiles([]);
    setExtractedText('');
  };

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 }, 
      minHeight: '100vh', 
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      color: theme.palette.mode === 'dark' ? 'text.primary' : 'inherit'
    }}>
      {/* Header Section */}
      <GradientCard sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
              <Assessment sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
        Past Papers Management
      </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                Create, manage, and analyze past examination papers
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<ViewModule />}
              onClick={() => setViewMode('grid')}
              sx={{ 
                bgcolor: viewMode === 'grid' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Grid
            </Button>
            <Button
              variant="outlined"
              startIcon={<ViewList />}
              onClick={() => setViewMode('list')}
              sx={{ 
                bgcolor: viewMode === 'list' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              List
            </Button>
          </Box>
        </Box>
      </GradientCard>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Fade in timeout={600}>
            <StatCard sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 600 }}>
                    Total Papers
                  </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {pastPapers.length}
                  </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                      Examination papers
                    </Typography>
                </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <School sx={{ fontSize: 28 }} />
                  </Avatar>
              </Box>
            </CardContent>
            </StatCard>
          </Fade>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Fade in timeout={800}>
            <StatCard sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 600 }}>
                    Published
                  </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {pastPapers.filter(p => p.isPublished).length}
                  </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                      Available to students
                    </Typography>
                </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <Publish sx={{ fontSize: 28 }} />
                  </Avatar>
              </Box>
            </CardContent>
            </StatCard>
          </Fade>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Fade in timeout={1000}>
            <StatCard sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 600 }}>
                    Total Attempts
                  </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {pastPapers.reduce((sum, p) => sum + p.totalAttempts, 0)}
                  </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                      Student attempts
                    </Typography>
                </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <People sx={{ fontSize: 28 }} />
                  </Avatar>
              </Box>
            </CardContent>
            </StatCard>
          </Fade>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Fade in timeout={1200}>
            <StatCard sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 600 }}>
                    Avg Score
                  </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {pastPapers.length > 0 
                      ? Math.round(pastPapers.reduce((sum, p) => sum + p.averageScore, 0) / pastPapers.length)
                      : 0}%
                  </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                      Performance average
                    </Typography>
                </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <TrendingUp sx={{ fontSize: 28 }} />
                  </Avatar>
              </Box>
            </CardContent>
            </StatCard>
          </Fade>
        </Box>
      </Box>

      {/* Enhanced Filters and Actions */}
      <StyledCard sx={{ 
        mb: 3,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'white',
        border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        backdropFilter: theme.palette.mode === 'dark' ? 'blur(10px)' : 'none'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterAlt />
              Filters & Search
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadPastPapers}
                size="small"
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreatePaper}
                size="small"
                sx={{ 
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                  }
                }}
              >
                Add Paper
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                placeholder="Search past papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  sx: { borderRadius: 2 }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={subjectFilter}
                  onChange={(e) => {
                    setSubjectFilter(e.target.value);
                  }}
                  label="Subject"
                  sx={{ 
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white',
                  }}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {defaultSubjects.map(subject => (
                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                  ))}
                  {customSubjects.length > 0 && [
                    <Divider key="custom-divider" sx={{ my: 1 }} />,
                    ...customSubjects.map(subject => (
                      <MenuItem key={`custom-${subject}`} value={subject}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            {subject}
                          </Typography>
                          <Chip label="Custom" size="small" color="primary" variant="outlined" />
                        </Box>
                      </MenuItem>
                    ))
                  ]}
                  <MenuItem 
                    value=""
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCustomSubject(true);
                    }}
                    sx={{ 
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      mt: 1,
                      pt: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Add /> Add Custom Subject
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={levelFilter}
                  onChange={(e) => {
                    setLevelFilter(e.target.value);
                  }}
                  label="Level"
                  sx={{ 
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white',
                  }}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {defaultLevels.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                  {customLevels.length > 0 && [
                    <Divider key="custom-level-divider" sx={{ my: 1 }} />,
                    ...customLevels.map(level => (
                      <MenuItem key={`custom-${level}`} value={level}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            {level}
                          </Typography>
                          <Chip label="Custom" size="small" color="primary" variant="outlined" />
                        </Box>
                      </MenuItem>
                    ))
                  ]}
                  <MenuItem 
                    value=""
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCustomLevel(true);
                    }}
                    sx={{ 
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      mt: 1,
                      pt: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Add /> Add Custom Level
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Button
                variant="outlined"
                startIcon={<Tune />}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                More Filters
              </Button>
            </Box>
          </Box>
        </CardContent>
      </StyledCard>

      {/* Past Papers Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Attempts</TableCell>
                <TableCell>Avg Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : pastPapers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No past papers found
                  </TableCell>
                </TableRow>
              ) : (
                pastPapers.map((paper) => (
                  <TableRow key={paper._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {paper.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {paper.description.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{paper.subject}</TableCell>
                    <TableCell>
                      <Chip
                        label={paper.level}
                        color={getLevelColor(paper.level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{paper.year}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Timer sx={{ fontSize: 16 }} />
                        {paper.duration} min
                      </Box>
                    </TableCell>
                    <TableCell>{paper.totalAttempts}</TableCell>
                    <TableCell>
                      <Typography color={paper.averageScore >= 70 ? 'success.main' : 'error.main'}>
                        {Math.round(paper.averageScore)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip
                        label={paper.isPublished ? 'Published' : 'Draft'}
                        color={getStatusColor(paper.isPublished) as any}
                        size="small"
                      />
                        <Typography variant="caption" color="text.secondary">
                          Questions: {(paper as any).questions?.length || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditPaper(paper)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={
                          paper.isPublished 
                            ? 'Unpublish' 
                            : ((paper as any).questions?.length || 0) === 0 
                              ? 'Cannot publish - No questions added' 
                              : 'Publish'
                        }>
                          <IconButton
                            size="small"
                            onClick={() => handlePublishPaper(paper)}
                            disabled={!paper.isPublished && ((paper as any).questions?.length || 0) === 0}
                          >
                            {paper.isPublished ? <Unpublished /> : <Publish />}
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, paper)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Enhanced Create/Edit Dialog with File Upload */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3, 
            minHeight: '80vh',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'white',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
            backdropFilter: theme.palette.mode === 'dark' ? 'blur(10px)' : 'none'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            {selectedPaper ? <Edit /> : <Add />}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {selectedPaper ? 'Edit Past Paper' : 'Create New Past Paper'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {selectedPaper ? 'Update paper details and settings' : 'Add a new examination paper with questions and settings'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Basic Info" icon={<Description />} />
            <Tab label="File Upload" icon={<CloudUpload />} />
            <Tab label="Questions" icon={<Quiz />} />
            <Tab label="Settings" icon={<Settings />} />
          </Tabs>

          {/* Basic Information Tab */}
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                  label="Paper Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Mathematics O-Level 2023"
                  sx={{ borderRadius: 2 }}
              />
              </Box>
              <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                  rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the paper content, topics covered, and any special instructions..."
                  sx={{ borderRadius: 2 }}
              />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subject}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                    }}
                  label="Subject"
                    sx={{ 
                      borderRadius: 2,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white',
                    }}
                >
                    {defaultSubjects.map(subject => (
                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                  ))}
                    {customSubjects.length > 0 && [
                      <Divider key="form-custom-divider" sx={{ my: 1 }} />,
                      ...customSubjects.map(subject => (
                        <MenuItem key={`form-custom-${subject}`} value={subject}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              {subject}
                            </Typography>
                            <Chip label="Custom" size="small" color="primary" variant="outlined" />
                          </Box>
                        </MenuItem>
                      ))
                    ]}
                    <MenuItem 
                      value=""
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCustomSubject(true);
                      }}
                      sx={{ 
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        mt: 1,
                        pt: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Add /> Add Custom Subject
                      </Box>
                    </MenuItem>
                </Select>
              </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={formData.level}
                    onChange={(e) => {
                      setFormData({ ...formData, level: e.target.value });
                    }}
                  label="Level"
                    sx={{ 
                      borderRadius: 2,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'white',
                    }}
                >
                    {defaultLevels.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                    {customLevels.length > 0 && [
                      <Divider key="form-level-divider" sx={{ my: 1 }} />,
                      ...customLevels.map(level => (
                        <MenuItem key={`form-custom-${level}`} value={level}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              {level}
                            </Typography>
                            <Chip label="Custom" size="small" color="primary" variant="outlined" />
                          </Box>
                        </MenuItem>
                      ))
                    ]}
                    <MenuItem 
                      value=""
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCustomLevel(true);
                      }}
                      sx={{ 
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        mt: 1,
                        pt: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Add /> Add Custom Level
                      </Box>
                    </MenuItem>
                </Select>
              </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  sx={{ borderRadius: 2 }}
              />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <FormControl fullWidth>
                <InputLabel>Exam Board</InputLabel>
                <Select
                  value={formData.examBoard}
                  onChange={(e) => setFormData({ ...formData, examBoard: e.target.value })}
                  label="Exam Board"
                    sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">None</MenuItem>
                  {examBoards.map(board => (
                    <MenuItem key={board} value={board}>{board}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              </Box>
            </Box>
          )}

          {/* File Upload Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CloudUpload />
                Upload Past Paper Files
              </Typography>
              
              {/* Drag and Drop Upload Area */}
              <UploadArea
                isDragActive={isDragActive}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {isDragActive ? 'Drop files here' : 'Drag & drop files here or click to browse'}
                  </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Supports PDF, Word documents, images, and text files
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Tip:</strong> For best results with Word documents, save them as .txt files first. 
                  Word document text extraction is experimental and may not work perfectly.
                </Typography>
              </Alert>
              {generatedQuestions.length > 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Successfully generated {generatedQuestions.length} questions from uploaded files! 
                    Check the Questions tab to review and edit them.
                  </Typography>
                </Alert>
              )}
                  <Button variant="contained" startIcon={<FileUpload />}>
                    Choose Files
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </Box>
              </UploadArea>

              {/* Upload Progress */}
              {isUploading && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Processing files... {Math.round(uploadProgress)}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 1 }} />
                </Box>
              )}

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      Uploaded Files ({uploadedFiles.length})
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Close />}
                      onClick={clearFiles}
                    >
                      Clear All
                    </Button>
                  </Box>
                  
                  {/* Call to Action Alert */}
                  <Alert 
                    severity="info" 
                    sx={{ mb: 2 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        startIcon={<Quiz />}
                        onClick={processUploadedFiles}
                        disabled={isUploading}
                      >
                        Extract Questions Now
                      </Button>
                    }
                  >
                    <Typography variant="body2">
                      Ready to extract questions from your uploaded files? Click the button to process them and generate structured questions.
                    </Typography>
                  </Alert>
                  <List>
                    {uploadedFiles.map((file, index) => (
                      <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 1 }}>
                        <ListItemAvatar>
                          <Avatar>
                            {file.type.startsWith('image/') ? <Image /> :
                             file.type === 'application/pdf' ? <PictureAsPdf /> :
                             file.type.includes('word') ? <Description /> :
                             <TextSnippet />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => removeFile(index)} color="error">
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<Quiz />}
                      onClick={processUploadedFiles}
                      disabled={isUploading}
                      sx={{
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                        }
                      }}
                    >
                      {isUploading ? 'Processing...' : 'Extract Questions'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<AutoFixHigh />}
                      onClick={processUploadedFiles}
                      disabled={isUploading}
                    >
                      Extract Text Only
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SmartToy />}
                      disabled={!extractedText}
                    >
                      AI Process
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Quiz />}
                      onClick={async () => {
                        if (extractedText) {
                          const testQuestions = await parseTextToQuestions(extractedText);
                          setGeneratedQuestions(testQuestions);
                          setSuccess(`Generated ${testQuestions.length} test questions from extracted text`);
                        }
                      }}
                      disabled={!extractedText}
                    >
                      Test Parse
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={async () => {
                        const manualText = prompt('Enter the exam content manually (paste the text here):');
                        if (manualText && manualText.trim()) {
                          const questions = await parseTextToQuestions(manualText);
                          setGeneratedQuestions(questions);
                          setSuccess(`Generated ${questions.length} questions from manual input`);
                        }
                      }}
                    >
                      Manual Input
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Extracted Text Preview */}
              {extractedText && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Extracted Text Preview
                  </Typography>
                  <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {extractedText}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}

          {/* Questions Tab */}
          {activeTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Questions Management ({generatedQuestions.length} questions)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<Add />}
                    onClick={() => {
                      const newQuestion = {
                        id: `q${generatedQuestions.length + 1}`,
                        question: '',
                        type: 'multiple-choice',
                        options: ['', '', '', ''],
                        correctAnswer: '',
                        section: 'General',
                        marks: 1
                      };
                      setGeneratedQuestions(prev => [...prev, newQuestion]);
                    }}
                  >
                    Add Question
                  </Button>
                  {generatedQuestions.length > 0 && (
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => setGeneratedQuestions([])}
                    >
                      Clear All
                    </Button>
                  )}
                </Box>
              </Box>
              
              {generatedQuestions.length === 0 ? (
                <Box sx={{ 
                  border: '2px dashed', 
                  borderColor: 'divider', 
                  borderRadius: 2, 
                  p: 4, 
                  textAlign: 'center',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
                }}>
                  <Quiz sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Questions Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Upload text files to auto-generate questions, or add them manually.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<Add />}
                    onClick={() => {
                      const newQuestion = {
                        id: 'q1',
                        question: '',
                        type: 'multiple-choice',
                        options: ['', '', '', ''],
                        correctAnswer: '',
                        section: 'General',
                        marks: 1
                      };
                      setGeneratedQuestions([newQuestion]);
                    }}
                  >
                    Add First Question
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {generatedQuestions.map((question, index) => (
                    <Card key={question.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Question {index + 1}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => setGeneratedQuestions(prev => prev.filter((_, i) => i !== index))}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                      
                      <TextField
                        fullWidth
                        label="Question"
                        value={question.question}
                        onChange={(e) => {
                          const updated = [...generatedQuestions];
                          updated[index].question = e.target.value;
                          setGeneratedQuestions(updated);
                        }}
                        multiline
                        rows={2}
                        sx={{ mb: 2 }}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl sx={{ minWidth: 120 }}>
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={question.type}
                            onChange={(e) => {
                              const updated = [...generatedQuestions];
                              updated[index].type = e.target.value;
                              if (e.target.value === 'true-false') {
                                updated[index].options = ['True', 'False'];
                              } else if (e.target.value === 'short-answer' || e.target.value === 'essay') {
                                updated[index].options = [];
                              } else if (e.target.value === 'multiple-choice') {
                                updated[index].options = ['', '', '', ''];
                              }
                              setGeneratedQuestions(updated);
                            }}
                            label="Type"
                          >
                            <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                            <MenuItem value="true-false">True/False</MenuItem>
                            <MenuItem value="short-answer">Short Answer</MenuItem>
                            <MenuItem value="essay">Essay</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <TextField
                          label="Marks"
                          type="number"
                          value={question.marks}
                          onChange={(e) => {
                            const updated = [...generatedQuestions];
                            updated[index].marks = parseInt(e.target.value) || 1;
                            setGeneratedQuestions(updated);
                          }}
                          sx={{ width: 100 }}
                        />
                      </Box>
                      
                      {question.type === 'multiple-choice' && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                          <Typography variant="subtitle2">Options:</Typography>
                          {question.options.map((option, optIndex) => (
                            <Box key={optIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ minWidth: 20 }}>
                                {String.fromCharCode(65 + optIndex)}.
                              </Typography>
                              <TextField
                                fullWidth
                                size="small"
                                value={option}
                                onChange={(e) => {
                                  const updated = [...generatedQuestions];
                                  updated[index].options[optIndex] = e.target.value;
                                  setGeneratedQuestions(updated);
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              />
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      <TextField
                        fullWidth
                        label="Correct Answer"
                        value={question.correctAnswer}
                        onChange={(e) => {
                          const updated = [...generatedQuestions];
                          updated[index].correctAnswer = e.target.value;
                          setGeneratedQuestions(updated);
                        }}
                        placeholder="Enter the correct answer"
                      />
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Settings Tab */}
          {activeTab === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  sx={{ borderRadius: 2 }}
              />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Total Marks"
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                  sx={{ borderRadius: 2 }}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Difficulty Rating (1-5)"
                  type="number"
                  value={formData.difficultyRating}
                  onChange={(e) => setFormData({ ...formData, difficultyRating: Math.max(1, Math.min(5, parseInt(e.target.value) || 1)) })}
                  inputProps={{ min: 1, max: 5 }}
                  sx={{ borderRadius: 2 }}
                  helperText="1 = Easy, 5 = Very Hard"
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Publication Settings
                </Typography>
              </Box>
              <Box sx={{ width: '100%' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  />
                }
                  label="Publish immediately"
              />
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSavePaper} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            {selectedPaper ? 'Update Paper' : 'Create Paper'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Past Paper</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedPaper?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeletePaper} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          // View details
        }}>
          <ListItemIcon>
            <Visibility />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          // Download
        }}>
          <ListItemIcon>
            <Download />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          setSelectedPaper(menuPaper);
          setDeleteDialogOpen(true);
        }}>
          <ListItemIcon>
            <Delete />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {uploadedFiles.length > 0 && !isUploading && (
          <AnimatedFab
            color="secondary"
            aria-label="extract questions"
            onClick={processUploadedFiles}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              }
            }}
          >
            <Quiz />
          </AnimatedFab>
        )}
        <AnimatedFab
          color="primary"
          aria-label="add"
          onClick={handleCreatePaper}
        >
          <Add />
        </AnimatedFab>
      </Box>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error"
          sx={{ borderRadius: 2 }}
        >
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccess(null)} 
          severity="success"
          sx={{ borderRadius: 2 }}
        >
          {success}
        </Alert>
      </Snackbar>

      {/* Custom Subject Input Dialog */}
      <Dialog 
        open={showCustomSubject} 
        onClose={() => setShowCustomSubject(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'white',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
            backdropFilter: theme.palette.mode === 'dark' ? 'blur(10px)' : 'none'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Add />
          Add Custom Subject
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Subject Name"
            fullWidth
            variant="outlined"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="e.g., Advanced Mathematics, Environmental Science"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomSubject(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (customSubject.trim()) {
                const newSubject = customSubject.trim();
                // Add to custom subjects if not already present
                if (!customSubjects.includes(newSubject) && !defaultSubjects.includes(newSubject)) {
                  setCustomSubjects(prev => [...prev, newSubject]);
                }
                // Update filter
                setSubjectFilter(newSubject);
                // Update form data if dialog is open
                if (dialogOpen) {
                  setFormData({ ...formData, subject: newSubject });
                }
                setCustomSubject('');
                setShowCustomSubject(false);
                setSuccess(`Custom subject "${newSubject}" added successfully!`);
              }
            }}
            variant="contained"
            disabled={!customSubject.trim()}
          >
            Add Subject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Level Input Dialog */}
      <Dialog 
        open={showCustomLevel} 
        onClose={() => setShowCustomLevel(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'white',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
            backdropFilter: theme.palette.mode === 'dark' ? 'blur(10px)' : 'none'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Add />
          Add Custom Level
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Level Name"
            fullWidth
            variant="outlined"
            value={customLevel}
            onChange={(e) => setCustomLevel(e.target.value)}
            placeholder="e.g., Level 0, Foundation, Intermediate, Expert"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomLevel(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (customLevel.trim()) {
                const newLevel = customLevel.trim();
                // Add to custom levels if not already present
                if (!customLevels.includes(newLevel) && !defaultLevels.includes(newLevel)) {
                  setCustomLevels(prev => [...prev, newLevel]);
                }
                // Update filter
                setLevelFilter(newLevel);
                // Update form data if dialog is open
                if (dialogOpen) {
                  setFormData({ ...formData, level: newLevel });
                }
                setCustomLevel('');
                setShowCustomLevel(false);
                setSuccess(`Custom level "${newLevel}" added successfully!`);
              }
            }}
            variant="contained"
            disabled={!customLevel.trim()}
          >
            Add Level
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PastPaperManagement;
