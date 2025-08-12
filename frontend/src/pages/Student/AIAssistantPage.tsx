import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Chip,
  Alert,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  SmartToy,
  Lightbulb,
  Quiz,
  Help,
  School,
  Psychology,
  AutoAwesome,
  History,
  Clear,
  Send,
  TrendingUp
} from '@mui/icons-material';
import { aiAssistantService, IChatMessage, IStudySuggestion } from '../../services/aiAssistantService';
import { courseService } from '../../services/courseService';
import AIAssistant from '../../components/AIAssistant';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const AIAssistantPage: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [studySuggestions, setStudySuggestions] = useState<IStudySuggestion | null>(null);
  const [chatHistory, setChatHistory] = useState<IChatMessage[]>([]);
  const [isAIAvailable, setIsAIAvailable] = useState(true);

  // Form states
  const [conceptForm, setConceptForm] = useState({
    concept: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    courseId: ''
  });
  const [practiceForm, setPracticeForm] = useState({
    topic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    count: 5,
    courseId: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Check AI availability
      const availability = await aiAssistantService.checkAvailability();
      setIsAIAvailable(availability.available);

      // Load enrolled courses
      const coursesResponse = await courseService.getEnrolledCourses();
      setEnrolledCourses(coursesResponse.courses);

      // Load chat history
      const history = aiAssistantService.getChatHistory();
      setChatHistory(history);

    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    }
  };

  // Get study suggestions
  const getStudySuggestions = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);

      const suggestions = await aiAssistantService.getStudySuggestions(courseId);
      setStudySuggestions(suggestions);

    } catch (err: any) {
      setError(err.message || 'Failed to get study suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Explain concept
  const explainConcept = async () => {
    if (!conceptForm.concept.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const explanation = await aiAssistantService.explainConcept(
        conceptForm.concept,
        {
          difficulty: conceptForm.difficulty,
          courseId: conceptForm.courseId || undefined
        }
      );

      // Add to chat history
      const chatMessage: IChatMessage = {
        id: Date.now().toString(),
        question: `Explain: ${conceptForm.concept}`,
        response: explanation.explanation,
        timestamp: new Date(),
        context: `Difficulty: ${conceptForm.difficulty}`
      };

      setChatHistory(prev => [...prev, chatMessage]);
      aiAssistantService.saveChatHistory([...chatHistory, chatMessage]);

      // Clear form
      setConceptForm({ concept: '', difficulty: 'beginner', courseId: '' });

    } catch (err: any) {
      setError(err.message || 'Failed to explain concept');
    } finally {
      setLoading(false);
    }
  };

  // Generate practice questions
  const generatePracticeQuestions = async () => {
    if (!practiceForm.topic.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const questions = await aiAssistantService.generatePracticeQuestions({
        topic: practiceForm.topic,
        difficulty: practiceForm.difficulty,
        count: practiceForm.count,
        courseId: practiceForm.courseId || undefined
      });

      // Add to chat history
      const chatMessage: IChatMessage = {
        id: Date.now().toString(),
        question: `Generate ${practiceForm.count} practice questions about: ${practiceForm.topic}`,
        response: `Generated ${questions.questions.length} practice questions:\n\n${questions.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}`,
        timestamp: new Date(),
        context: `Topic: ${practiceForm.topic}, Difficulty: ${practiceForm.difficulty}`
      };

      setChatHistory(prev => [...prev, chatMessage]);
      aiAssistantService.saveChatHistory([...chatHistory, chatMessage]);

      // Clear form
      setPracticeForm({ topic: '', difficulty: 'medium', count: 5, courseId: '' });

    } catch (err: any) {
      setError(err.message || 'Failed to generate practice questions');
    } finally {
      setLoading(false);
    }
  };

  // Clear chat history
  const clearChatHistory = () => {
    setChatHistory([]);
    aiAssistantService.clearChatHistory();
  };

  if (!isAIAvailable) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 4 }}>
          AI Assistant is currently unavailable. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Study Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Get personalized help with your studies using AI-powered assistance
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main AI Assistant */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 600 }}>
            <AIAssistant
              isOpen={true}
              maxHeight={600}
              courseId={enrolledCourses[0]?._id}
            />
          </Card>
        </Grid>

        {/* Quick Tools */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Tools
              </Typography>
              
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                <Tab label="Explain" icon={<Psychology />} />
                <Tab label="Practice" icon={<Quiz />} />
                <Tab label="Suggestions" icon={<Lightbulb />} />
              </Tabs>

              {/* Explain Concept Tab */}
              <TabPanel value={activeTab} index={0}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Concept to explain"
                    placeholder="e.g., React hooks, photosynthesis, calculus..."
                    value={conceptForm.concept}
                    onChange={(e) => setConceptForm(prev => ({ ...prev, concept: e.target.value }))}
                  />
                  
                  <TextField
                    select
                    fullWidth
                    label="Difficulty Level"
                    value={conceptForm.difficulty}
                    onChange={(e) => setConceptForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    SelectProps={{ native: true }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </TextField>

                  <TextField
                    select
                    fullWidth
                    label="Course (Optional)"
                    value={conceptForm.courseId}
                    onChange={(e) => setConceptForm(prev => ({ ...prev, courseId: e.target.value }))}
                    SelectProps={{ native: true }}
                  >
                    <option value="">Any Course</option>
                    {enrolledCourses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </TextField>

                  <Button
                    variant="contained"
                    onClick={explainConcept}
                    disabled={!conceptForm.concept.trim() || loading}
                    startIcon={<Psychology />}
                  >
                    Explain Concept
                  </Button>
                </Box>
              </TabPanel>

              {/* Practice Questions Tab */}
              <TabPanel value={activeTab} index={1}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Topic for practice"
                    placeholder="e.g., JavaScript arrays, algebra..."
                    value={practiceForm.topic}
                    onChange={(e) => setPracticeForm(prev => ({ ...prev, topic: e.target.value }))}
                  />
                  
                  <TextField
                    select
                    fullWidth
                    label="Difficulty"
                    value={practiceForm.difficulty}
                    onChange={(e) => setPracticeForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    SelectProps={{ native: true }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </TextField>

                  <TextField
                    type="number"
                    fullWidth
                    label="Number of questions"
                    value={practiceForm.count}
                    onChange={(e) => setPracticeForm(prev => ({ ...prev, count: parseInt(e.target.value) || 5 }))}
                    inputProps={{ min: 1, max: 10 }}
                  />

                  <Button
                    variant="contained"
                    onClick={generatePracticeQuestions}
                    disabled={!practiceForm.topic.trim() || loading}
                    startIcon={<Quiz />}
                  >
                    Generate Questions
                  </Button>
                </Box>
              </TabPanel>

              {/* Study Suggestions Tab */}
              <TabPanel value={activeTab} index={2}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Get personalized study suggestions based on your progress
                  </Typography>

                  {enrolledCourses.map(course => (
                    <Button
                      key={course._id}
                      variant="outlined"
                      onClick={() => getStudySuggestions(course._id)}
                      disabled={loading}
                      startIcon={<TrendingUp />}
                      fullWidth
                    >
                      {course.title}
                    </Button>
                  ))}

                  {studySuggestions && (
                    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Study Suggestions:
                      </Typography>
                      <Typography variant="body2">
                        {studySuggestions.suggestions}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Progress: {studySuggestions.progressSummary.completedChapters}/{studySuggestions.progressSummary.totalChapters} chapters
                        </Typography>
                      </Box>
                    </Paper>
                  )}
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Conversations
                </Typography>
                <Tooltip title="Clear History">
                  <IconButton onClick={clearChatHistory} disabled={chatHistory.length === 0}>
                    <Clear />
                  </IconButton>
                </Tooltip>
              </Box>

              {chatHistory.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No conversation history yet. Start chatting with the AI assistant!
                </Typography>
              ) : (
                <List>
                  {chatHistory.slice(-5).reverse().map((message, index) => (
                    <React.Fragment key={message.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <SmartToy color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={message.question}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                {message.response.substring(0, 200)}
                                {message.response.length > 200 && '...'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {message.timestamp.toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(chatHistory.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Tips */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tips for Using AI Assistant
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Lightbulb color="primary" />
                    <Box>
                      <Typography variant="subtitle2">Be Specific</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ask specific questions about concepts you're struggling with
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Help color="primary" />
                    <Box>
                      <Typography variant="subtitle2">Ask for Examples</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Request examples and real-world applications
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Quiz color="primary" />
                    <Box>
                      <Typography variant="subtitle2">Practice Regularly</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Use practice questions to test your understanding
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <School color="primary" />
                    <Box>
                      <Typography variant="subtitle2">Context Matters</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Mention which course or topic you're studying
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AIAssistantPage;
