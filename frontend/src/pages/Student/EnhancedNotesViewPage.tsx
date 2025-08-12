import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Slide,
  Zoom,
  Collapse,
  Avatar,
  Stack,
  Container,
  TextField
} from '@mui/material';
import {
  ArrowBack,
  MenuBook,
  Quiz,
  CheckCircle,
  RadioButtonUnchecked,
  PlayArrow,
  EmojiEvents,
  Star,
  TrendingUp,
  Psychology,
  AutoAwesome,
  Timer,
  School,
  Lightbulb,
  Speed,
  Assignment,
  BookmarkBorder,
  Bookmark,
  Share,
  Print,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  Pause,
  SkipNext,
  SkipPrevious,
  Close,
  Celebration,
  LocalFireDepartment,
  Diamond,
  Bolt,
  Favorite,
  ThumbUp
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { courseNotesService } from '../../services/courseNotesService';
import { progressService } from '../../services/progressService';
import { aiService } from '../../services/aiService';

interface NoteSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isCompleted: boolean;
  estimatedReadTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  keyPoints: string[];
  isBookmarked?: boolean;
}

interface StudyStats {
  totalSections: number;
  completedSections: number;
  totalReadTime: number;
  currentStreak: number;
  pointsEarned: number;
  badgesEarned: string[];
  averageQuizScore: number;
  studyLevel: number;
}

interface AIQuiz {
  id: string;
  sectionId: string;
  questions: Array<{
    id: string;
    question: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer';
    options?: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  totalQuestions: number;
  estimatedTime: number;
}

const EnhancedNotesViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [noteSections, setNoteSections] = useState<NoteSection[]>([]);
  const [currentSection, setCurrentSection] = useState<NoteSection | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [studyStats, setStudyStats] = useState<StudyStats>({
    totalSections: 0,
    completedSections: 0,
    totalReadTime: 0,
    currentStreak: 0,
    pointsEarned: 0,
    badgesEarned: [],
    averageQuizScore: 0,
    studyLevel: 1
  });

  // Quiz state
  const [currentQuiz, setCurrentQuiz] = useState<AIQuiz | null>(null);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<any>(null);
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Load course notes and progress
  useEffect(() => {
    const loadCourseNotes = async () => {
      if (!user || !id) {
        setError('Please log in to access course notes');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load course details
        const courseData = await courseService.getPublicCourseById(id);
        setCourse(courseData);

        // Load course notes
        console.log('Loading course notes for course ID:', id);
        const notesData = await courseNotesService.getCourseNotes(id);
        console.log('Course notes response:', notesData);
        
        if (notesData && notesData.courseNotes) {
          const sections = notesData.courseNotes.flatMap((note: any) => 
            note.sections?.map((section: any, index: number) => ({
              id: section.id || `${note._id}-${index}`,
              title: section.title,
              content: section.content,
              order: index,
              isCompleted: note.progress?.sectionsCompleted?.includes(section.id) || false,
              estimatedReadTime: calculateReadTime(section.content),
              difficulty: section.difficulty || 'medium',
              keyPoints: extractKeyPoints(section.content),
              isBookmarked: note.progress?.bookmarks?.some((b: any) => b.sectionId === section.id) || false
            })) || []
          );
          
          setNoteSections(sections);
          if (sections.length > 0) {
            setCurrentSection(sections[0]);
            setCurrentSectionIndex(0);
          }
        } else {
          console.log('No course notes found or empty response');
          setError('No course notes available for this course. Please contact your instructor.');
        }

        // Load study statistics
        await loadStudyStats();

      } catch (err: any) {
        console.error('Course notes loading failed:', err);
        setError(err.message || 'Failed to load course notes');
      } finally {
        setLoading(false);
      }
    };

    loadCourseNotes();
  }, [id, user]);

  // Calculate estimated reading time
  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  // Extract key points from content
  const extractKeyPoints = (content: string): string[] => {
    const sentences = content.split('.').filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  };

  // Load study statistics
  const loadStudyStats = async () => {
    if (!id) return;

    try {
      // Mock data for now - replace with actual service call
      setStudyStats({
        totalSections: noteSections.length,
        completedSections: noteSections.filter(s => s.isCompleted).length,
        totalReadTime: 45,
        currentStreak: 3,
        pointsEarned: 1250,
        badgesEarned: ['Speed Reader', 'Quiz Master', 'Consistent Learner'],
        averageQuizScore: 85,
        studyLevel: 5
      });
    } catch (error) {
      console.error('Failed to load study stats:', error);
    }
  };

  // Start reading a section
  const startReading = (section: NoteSection, index: number) => {
    setCurrentSection(section);
    setCurrentSectionIndex(index);
    setReadingStartTime(new Date());
    setReadingProgress(0);
  };

  // Mark section as completed
  const markSectionCompleted = async (sectionId: string) => {
    if (!id) return;

    try {
      // Calculate reading time
      const readTime = readingStartTime ? 
        Math.round((new Date().getTime() - readingStartTime.getTime()) / 60000) : 0;

      // Update local state
      setNoteSections(prev => 
        prev.map(section => 
          section.id === sectionId 
            ? { ...section, isCompleted: true }
            : section
        )
      );

      // Show celebration
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);

      // Move to next section
      if (currentSectionIndex < noteSections.length - 1) {
        const nextSection = noteSections[currentSectionIndex + 1];
        startReading(nextSection, currentSectionIndex + 1);
      }

    } catch (error) {
      console.error('Failed to mark section as completed:', error);
    }
  };

  // Generate AI quiz for current section
  const generateAIQuiz = async (section: NoteSection) => {
    if (!id) return;

    try {
      setQuizLoading(true);
      
      // Call the real AI service to generate quiz
      const quizData = await aiService.generateSectionQuiz({
        courseId: id,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionContent: section.content,
        difficulty: section.difficulty,
        questionCount: 5
      });

      // Transform the response to match our interface
      const aiQuiz: AIQuiz = {
        id: quizData.id,
        sectionId: quizData.sectionId,
        questions: quizData.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty
        })),
        totalQuestions: quizData.totalQuestions,
        estimatedTime: quizData.estimatedTime
      };

      setCurrentQuiz(aiQuiz);
      setQuizAnswers({});
      setQuizResults(null);
      setShowQuizResults(false);
      setQuizDialogOpen(true);

    } catch (error) {
      console.error('Failed to generate AI quiz:', error);
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };

  // Check if quiz is sufficiently answered
  const isQuizAnswered = () => {
    if (!currentQuiz) return false;
    
    // For multiple choice and true/false, require all questions to be answered
    const requiredQuestions = currentQuiz.questions.filter(q => 
      q.type === 'multiple-choice' || q.type === 'true-false'
    );
    
    const answeredRequired = requiredQuestions.every(q => 
      quizAnswers[q.id] && quizAnswers[q.id].trim() !== ''
    );
    
    // For short answer, we allow submission even if not all are answered
    // (they'll just get 0 points for unanswered questions)
    return answeredRequired;
  };

  // Submit quiz answers
  const submitQuiz = async () => {
    if (!currentQuiz || !id) return;

    try {
      // Call the real AI service to evaluate answers
      const evaluation = await aiService.evaluateQuizAnswers({
        courseId: id,
        sectionId: currentQuiz.sectionId,
        quizId: currentQuiz.id,
        answers: quizAnswers,
        questions: currentQuiz.questions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          correctAnswer: q.correctAnswer,
          points: 10, // Default points per question
          explanation: q.explanation
        }))
      });

      const results = {
        score: evaluation.percentage,
        correctAnswers: evaluation.detailedResults.filter((r: any) => r.isCorrect).length,
        totalQuestions: currentQuiz.questions.length,
        pointsEarned: evaluation.earnedPoints,
        totalPoints: evaluation.totalPoints,
        passed: evaluation.passed,
        feedback: evaluation.feedback,
        detailedResults: evaluation.detailedResults
      };

      setQuizResults(results);
      setShowQuizResults(true);

    } catch (error) {
      console.error('Failed to submit quiz:', error);
      setError('Failed to submit quiz. Please try again.');
    }
  };

  // Toggle bookmark
  const toggleBookmark = (sectionId: string) => {
    setNoteSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, isBookmarked: !section.isBookmarked }
          : section
      )
    );
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  // Get study level info
  const getStudyLevelInfo = () => {
    const level = studyStats.studyLevel;
    const pointsForNextLevel = level * 100;
    const currentLevelPoints = studyStats.pointsEarned % 100;
    
    return {
      level,
      currentPoints: currentLevelPoints,
      pointsNeeded: pointsForNextLevel - currentLevelPoints,
      progress: (currentLevelPoints / pointsForNextLevel) * 100
    };
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Box sx={{ minHeight: '100vh', p: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Course not found'}
          </Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/course/${id}`)}
            variant="contained"
            sx={{ bgcolor: 'white', color: 'primary.main' }}
          >
            Back to Course
          </Button>
        </Container>
      </Box>
    );
  }

  const levelInfo = getStudyLevelInfo();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isFullscreen 
        ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Celebration Animation */}
      <Zoom in={showCelebration}>
        <Box sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          textAlign: 'center'
        }}>
          <Celebration sx={{ fontSize: 100, color: '#FFD700', mb: 2 }} />
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            🎉 Section Completed! 🎉
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', mt: 1 }}>
            +50 XP Earned!
          </Typography>
        </Box>
      </Zoom>

      {/* Header Bar */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          borderRadius: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate(`/course/${id}`)}
              sx={{ color: 'white' }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              {course.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Study Stats */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<LocalFireDepartment />}
                label={`${studyStats.currentStreak} day streak`}
                sx={{ bgcolor: '#FF6B35', color: 'white' }}
              />
              <Chip
                icon={<Diamond />}
                label={`Level ${studyStats.studyLevel}`}
                sx={{ bgcolor: '#9C27B0', color: 'white' }}
              />
              <Chip
                icon={<Star />}
                label={`${studyStats.pointsEarned} XP`}
                sx={{ bgcolor: '#FFD700', color: 'black' }}
              />
            </Box>

            <IconButton 
              onClick={() => setIsFullscreen(!isFullscreen)}
              sx={{ color: 'white' }}
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth={isFullscreen ? false : "xl"} sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Sidebar - Section Navigation */}
          {!isFullscreen && (
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                background: 'rgba(255,255,255,0.1)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MenuBook />
                    Course Sections
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={(studyStats.completedSections / studyStats.totalSections) * 100}
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />
                  
                  <Typography variant="body2" sx={{ color: 'white', mb: 3 }}>
                    {studyStats.completedSections} of {studyStats.totalSections} completed
                  </Typography>

                  <List>
                    {noteSections.map((section, index) => (
                      <ListItemButton
                        key={section.id}
                        selected={currentSectionIndex === index}
                        onClick={() => startReading(section, index)}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: currentSectionIndex === index ? 'rgba(255,255,255,0.2)' : 'transparent',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                      >
                        <ListItemIcon>
                          {section.isCompleted ? (
                            <CheckCircle sx={{ color: '#4CAF50' }} />
                          ) : (
                            <RadioButtonUnchecked sx={{ color: 'white' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={section.title}
                          secondary={`${section.estimatedReadTime} min read`}
                          primaryTypographyProps={{ color: 'white', fontSize: '0.9rem' }}
                          secondaryTypographyProps={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}
                        />
                        <Chip
                          label={section.difficulty}
                          size="small"
                          color={getDifficultyColor(section.difficulty) as any}
                          sx={{ ml: 1 }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Main Content Area */}
          <Grid item xs={12} md={isFullscreen ? 12 : 9}>
            {currentSection && (
              <Card sx={{ 
                background: 'rgba(255,255,255,0.95)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                minHeight: '70vh'
              }}>
                <CardContent sx={{ p: 4 }}>
                  {/* Section Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {currentSection.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Chip
                          icon={<Timer />}
                          label={`${currentSection.estimatedReadTime} min read`}
                          variant="outlined"
                        />
                        <Chip
                          label={currentSection.difficulty}
                          color={getDifficultyColor(currentSection.difficulty) as any}
                        />
                        {currentSection.isCompleted && (
                          <Chip
                            icon={<CheckCircle />}
                            label="Completed"
                            color="success"
                          />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        onClick={() => toggleBookmark(currentSection.id)}
                        color={currentSection.isBookmarked ? 'primary' : 'default'}
                      >
                        {currentSection.isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                      </IconButton>
                      <IconButton><Share /></IconButton>
                      <IconButton><Print /></IconButton>
                    </Box>
                  </Box>

                  {/* Key Points */}
                  <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'white' }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Lightbulb />
                      Key Points
                    </Typography>
                    <List dense>
                      {currentSection.keyPoints.map((point, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Star sx={{ color: 'white', fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText primary={point} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>

                  {/* Content */}
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      lineHeight: 1.8, 
                      fontSize: '1.1rem',
                      textAlign: 'justify',
                      mb: 4
                    }}
                  >
                    {currentSection.content}
                  </Typography>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Psychology />}
                        onClick={() => generateAIQuiz(currentSection)}
                        disabled={quizLoading}
                        sx={{ 
                          background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
                          boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)'
                        }}
                      >
                        {quizLoading ? 'Generating...' : 'AI Quiz'}
                      </Button>
                      
                      {!currentSection.isCompleted && (
                        <Button
                          variant="contained"
                          startIcon={<CheckCircle />}
                          onClick={() => markSectionCompleted(currentSection.id)}
                          color="success"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        disabled={currentSectionIndex === 0}
                        onClick={() => {
                          if (currentSectionIndex > 0) {
                            startReading(noteSections[currentSectionIndex - 1], currentSectionIndex - 1);
                          }
                        }}
                      >
                        <SkipPrevious />
                      </IconButton>
                      <IconButton 
                        disabled={currentSectionIndex === noteSections.length - 1}
                        onClick={() => {
                          if (currentSectionIndex < noteSections.length - 1) {
                            startReading(noteSections[currentSectionIndex + 1], currentSectionIndex + 1);
                          }
                        }}
                      >
                        <SkipNext />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Quiz Dialog */}
      <Dialog 
        open={quizDialogOpen} 
        onClose={() => setQuizDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome />
          AI Generated Quiz
          <IconButton 
            onClick={() => setQuizDialogOpen(false)}
            sx={{ ml: 'auto', color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {currentQuiz && !showQuizResults && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Test your understanding of "{currentSection?.title}"
              </Typography>
              
              {currentQuiz.questions.map((question, index) => (
                <Card key={question.id} sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', flex: 1 }}>
                        {index + 1}. {question.question}
                      </Typography>
                      <Chip
                        label={question.type === 'multiple-choice' ? 'Multiple Choice' : 
                              question.type === 'true-false' ? 'True/False' : 
                              'Short Answer'}
                        size="small"
                        sx={{
                          bgcolor: question.type === 'multiple-choice' ? 'rgba(33, 150, 243, 0.8)' :
                                   question.type === 'true-false' ? 'rgba(76, 175, 80, 0.8)' :
                                   'rgba(156, 39, 176, 0.8)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    {/* Multiple Choice and True/False Questions */}
                    {(question.type === 'multiple-choice' || question.type === 'true-false') && question.options?.map((option, optionIndex) => (
                      <Button
                        key={optionIndex}
                        variant={quizAnswers[question.id] === option ? 'contained' : 'outlined'}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, [question.id]: option }))}
                        sx={{ 
                          display: 'block', 
                          width: '100%', 
                          mb: 1, 
                          textAlign: 'left',
                          color: 'white',
                          borderColor: 'white',
                          '&.MuiButton-contained': {
                            bgcolor: 'rgba(255,255,255,0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.3)',
                            }
                          }
                        }}
                      >
                        {option}
                      </Button>
                    ))}
                    
                    {/* Short Answer Questions */}
                    {question.type === 'short-answer' && (
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Type your answer here..."
                        value={quizAnswers[question.id] || ''}
                        onChange={(e) => setQuizAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': {
                              borderColor: 'rgba(255,255,255,0.5)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255,255,255,0.7)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'white',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255,255,255,0.7)',
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'white',
                            '&::placeholder': {
                              color: 'rgba(255,255,255,0.5)',
                              opacity: 1,
                            },
                          },
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {showQuizResults && quizResults && (
            <Box>
              {/* Overall Results */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <EmojiEvents sx={{ fontSize: 80, color: '#FFD700', mb: 2 }} />
                <Typography variant="h4" sx={{ mb: 2 }}>
                  Quiz Complete!
                </Typography>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Score: {quizResults.score}%
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {quizResults.correctAnswers} out of {quizResults.totalQuestions} correct
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  +{quizResults.pointsEarned} XP Earned!
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  {quizResults.feedback}
                </Typography>
              </Box>

              {/* Detailed Results */}
              {quizResults.detailedResults && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                    Detailed Results
                  </Typography>
                  {quizResults.detailedResults.map((result: any, index: number) => (
                    <Card key={result.questionId} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                          <Typography variant="body2" sx={{ 
                            bgcolor: result.isCorrect ? 'success.main' : 'error.main',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            minWidth: 'fit-content'
                          }}>
                            {result.pointsEarned}/{result.pointsPossible} pts
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {index + 1}. {result.question}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                            Your Answer:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'white', 
                            bgcolor: 'rgba(255,255,255,0.1)', 
                            p: 1, 
                            borderRadius: 1,
                            fontStyle: result.studentAnswer ? 'normal' : 'italic'
                          }}>
                            {result.studentAnswer || 'No answer provided'}
                          </Typography>
                        </Box>

                        {!result.isCorrect && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                              Correct Answer:
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: 'white', 
                              bgcolor: 'rgba(76, 175, 80, 0.2)', 
                              p: 1, 
                              borderRadius: 1 
                            }}>
                              {result.correctAnswer}
                            </Typography>
                          </Box>
                        )}

                        <Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                            Feedback:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'white', 
                            bgcolor: 'rgba(255,255,255,0.05)', 
                            p: 1, 
                            borderRadius: 1 
                          }}>
                            {result.feedback}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!showQuizResults ? (
            <Button 
              onClick={submitQuiz}
              variant="contained"
              disabled={!currentQuiz || !isQuizAnswered()}
              sx={{ bgcolor: 'white', color: 'primary.main' }}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button 
              onClick={() => setQuizDialogOpen(false)}
              variant="contained"
              sx={{ bgcolor: 'white', color: 'primary.main' }}
            >
              Continue Learning
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Floating Progress Indicator */}
      {!isFullscreen && (
        <Fab
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
            {Math.round((studyStats.completedSections / studyStats.totalSections) * 100)}%
          </Typography>
        </Fab>
      )}
    </Box>
  );
};

export default EnhancedNotesViewPage;