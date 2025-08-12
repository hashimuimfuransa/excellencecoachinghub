import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  ArrowBack,
  MenuBook,
  Quiz,
  CheckCircle,
  RadioButtonUnchecked,
  ExpandMore,
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
  Assignment
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { courseNotesService } from '../../services/courseNotesService';
import { progressService } from '../../services/progressService';
import { aiService } from '../../services/aiService';
import { gamificationService } from '../../services/gamificationService';

interface NoteSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isCompleted: boolean;
  estimatedReadTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  keyPoints: string[];
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

const CourseNotesStudyPage: React.FC = () => {
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

  // Reading state
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

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
        const notesData = await courseNotesService.getCourseNotes(id);
        if (notesData && notesData.sections) {
          const sections = await Promise.all(
            notesData.sections.map(async (section: any, index: number) => {
              // Get completion status from progress service
              const isCompleted = await progressService.isSectionCompleted(id, section.id);
              
              return {
                id: section.id,
                title: section.title,
                content: section.content,
                order: index,
                isCompleted,
                estimatedReadTime: calculateReadTime(section.content),
                difficulty: section.difficulty || 'medium',
                keyPoints: extractKeyPoints(section.content)
              };
            })
          );
          
          setNoteSections(sections);
          if (sections.length > 0) {
            setCurrentSection(sections[0]);
            setCurrentSectionIndex(0);
          }
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
    // Simple extraction - in real implementation, use AI
    const sentences = content.split('.').filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  };

  // Load study statistics
  const loadStudyStats = async () => {
    if (!id) return;

    try {
      const stats = await gamificationService.getStudyStats(id);
      setStudyStats(stats || {
        totalSections: noteSections.length,
        completedSections: noteSections.filter(s => s.isCompleted).length,
        totalReadTime: 0,
        currentStreak: 0,
        pointsEarned: 0,
        badgesEarned: [],
        averageQuizScore: 0,
        studyLevel: 1
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

      // Mark as completed in backend
      await progressService.markSectionCompleted(id, sectionId, readTime);

      // Update local state
      setNoteSections(prev => 
        prev.map(section => 
          section.id === sectionId 
            ? { ...section, isCompleted: true }
            : section
        )
      );

      // Award points and check for badges
      await gamificationService.awardReadingPoints(id, sectionId, readTime);
      
      // Reload stats
      await loadStudyStats();

      // Show completion celebration
      showCompletionCelebration();

    } catch (error) {
      console.error('Failed to mark section as completed:', error);
    }
  };

  // Generate AI quiz for current section
  const generateAIQuiz = async (section: NoteSection) => {
    if (!id) return;

    try {
      setQuizLoading(true);
      
      // Generate quiz using AI service
      const quizData = await aiService.generateSectionQuiz({
        courseId: id,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionContent: section.content,
        difficulty: section.difficulty,
        questionCount: 5
      });

      setCurrentQuiz(quizData);
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

  // Submit quiz answers
  const submitQuiz = async () => {
    if (!currentQuiz || !id) return;

    try {
      const results = await aiService.evaluateQuizAnswers({
        courseId: id,
        sectionId: currentQuiz.sectionId,
        quizId: currentQuiz.id,
        answers: quizAnswers
      });

      setQuizResults(results);
      setShowQuizResults(true);

      // Award points based on performance
      await gamificationService.awardQuizPoints(id, currentQuiz.sectionId, results.score);
      
      // Reload stats
      await loadStudyStats();

    } catch (error) {
      console.error('Failed to submit quiz:', error);
      setError('Failed to submit quiz. Please try again.');
    }
  };

  // Show completion celebration
  const showCompletionCelebration = () => {
    // Simple celebration - in real implementation, use animations
    console.log('🎉 Section completed!');
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Course not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/dashboard/student/course/${id}`)}
          variant="outlined"
        >
          Back to Course
        </Button>
      </Container>
    );
  }

  const levelInfo = getStudyLevelInfo();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/dashboard/student/course/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to Course
        </Button>

        <Grid container spacing={3}>
          {/* Course Info */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBook color="primary" />
                  {course.title} - Study Notes
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Interactive study experience with AI-generated quizzes and gamification
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip 
                    label={`${studyStats.completedSections}/${studyStats.totalSections} Sections`}
                    color="primary"
                    icon={<CheckCircle />}
                  />
                  <Chip 
                    label={`${studyStats.totalReadTime} min read`}
                    variant="outlined"
                    icon={<Timer />}
                  />
                  <Chip 
                    label={`${studyStats.currentStreak} day streak`}
                    color="secondary"
                    icon={<TrendingUp />}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Study Stats */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEvents color="warning" />
                  Study Level {levelInfo.level}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={levelInfo.progress}
                  sx={{ mb: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {levelInfo.pointsNeeded} points to next level
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary.main">
                      {studyStats.pointsEarned}
                    </Typography>
                    <Typography variant="caption">Points</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="secondary.main">
                      {studyStats.badgesEarned.length}
                    </Typography>
                    <Typography variant="caption">Badges</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">
                      {studyStats.averageQuizScore}%
                    </Typography>
                    <Typography variant="caption">Avg Score</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {/* Sections List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Course Sections
              </Typography>
              <Stepper orientation="vertical" activeStep={currentSectionIndex}>
                {noteSections.map((section, index) => (
                  <Step key={section.id} completed={section.isCompleted}>
                    <StepLabel
                      onClick={() => startReading(section, index)}
                      sx={{ cursor: 'pointer' }}
                      StepIconComponent={() => (
                        section.isCompleted ? 
                          <CheckCircle color="success" /> : 
                          <RadioButtonUnchecked color="action" />
                      )}
                    >
                      <Box>
                        <Typography variant="body1">
                          {section.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip 
                            size="small"
                            label={section.difficulty}
                            color={getDifficultyColor(section.difficulty) as any}
                          />
                          <Chip 
                            size="small"
                            label={`${section.estimatedReadTime} min`}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        Key points covered in this section
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Section Content */}
        <Grid item xs={12} md={8}>
          {currentSection ? (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {currentSection.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip 
                        label={currentSection.difficulty}
                        color={getDifficultyColor(currentSection.difficulty) as any}
                        size="small"
                      />
                      <Chip 
                        label={`${currentSection.estimatedReadTime} min read`}
                        variant="outlined"
                        size="small"
                        icon={<Timer />}
                      />
                      {currentSection.isCompleted && (
                        <Chip 
                          label="Completed"
                          color="success"
                          size="small"
                          icon={<CheckCircle />}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Generate AI Quiz">
                      <IconButton 
                        color="primary"
                        onClick={() => generateAIQuiz(currentSection)}
                        disabled={quizLoading}
                      >
                        {quizLoading ? <CircularProgress size={24} /> : <Psychology />}
                      </IconButton>
                    </Tooltip>
                    {!currentSection.isCompleted && (
                      <Button
                        variant="contained"
                        startIcon={<CheckCircle />}
                        onClick={() => markSectionCompleted(currentSection.id)}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Key Points */}
                <Accordion sx={{ mb: 3 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Lightbulb color="warning" />
                      Key Points
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {currentSection.keyPoints.map((point, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Star color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={point} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* Section Content */}
                <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                    {currentSection.content}
                  </Typography>
                </Paper>

                {/* Navigation */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    disabled={currentSectionIndex === 0}
                    onClick={() => {
                      const prevIndex = currentSectionIndex - 1;
                      startReading(noteSections[prevIndex], prevIndex);
                    }}
                  >
                    Previous Section
                  </Button>
                  <Button
                    disabled={currentSectionIndex === noteSections.length - 1}
                    onClick={() => {
                      const nextIndex = currentSectionIndex + 1;
                      startReading(noteSections[nextIndex], nextIndex);
                    }}
                    variant="contained"
                  >
                    Next Section
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <MenuBook sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a section to start studying
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* AI Quiz Dialog */}
      <Dialog 
        open={quizDialogOpen} 
        onClose={() => setQuizDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" />
          AI-Generated Quiz: {currentSection?.title}
        </DialogTitle>
        <DialogContent>
          {currentQuiz && !showQuizResults && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Answer all questions to test your understanding of this section.
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {currentQuiz.questions.map((question, index) => (
                <Box key={question.id} sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {index + 1}. {question.question}
                  </Typography>
                  
                  {question.type === 'multiple-choice' && question.options && (
                    <Box sx={{ ml: 2 }}>
                      {question.options.map((option, optionIndex) => (
                        <Box key={optionIndex} sx={{ mb: 1 }}>
                          <Button
                            variant={quizAnswers[question.id] === option ? 'contained' : 'outlined'}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [question.id]: option }))}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  {question.type === 'true-false' && (
                    <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant={quizAnswers[question.id] === 'true' ? 'contained' : 'outlined'}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, [question.id]: 'true' }))}
                      >
                        True
                      </Button>
                      <Button
                        variant={quizAnswers[question.id] === 'false' ? 'contained' : 'outlined'}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, [question.id]: 'false' }))}
                      >
                        False
                      </Button>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {showQuizResults && quizResults && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" color="primary.main" gutterBottom>
                  {quizResults.score}%
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {quizResults.score >= 80 ? '🎉 Excellent!' : 
                   quizResults.score >= 60 ? '👍 Good job!' : '📚 Keep studying!'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You got {quizResults.correctAnswers} out of {currentQuiz?.questions.length} questions correct
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Question Review */}
              {currentQuiz?.questions.map((question, index) => (
                <Box key={question.id} sx={{ mb: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    {index + 1}. {question.question}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={quizResults.answers[question.id].isCorrect ? 'success.main' : 'error.main'}
                    gutterBottom
                  >
                    Your answer: {quizResults.answers[question.id].userAnswer}
                    {quizResults.answers[question.id].isCorrect ? ' ✓' : ' ✗'}
                  </Typography>
                  {!quizResults.answers[question.id].isCorrect && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Correct answer: {question.correctAnswer}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {question.explanation}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!showQuizResults ? (
            <>
              <Button onClick={() => setQuizDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitQuiz}
                variant="contained"
                disabled={Object.keys(quizAnswers).length !== currentQuiz?.questions.length}
              >
                Submit Quiz
              </Button>
            </>
          ) : (
            <Button onClick={() => setQuizDialogOpen(false)} variant="contained">
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseNotesStudyPage;