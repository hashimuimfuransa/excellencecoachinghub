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
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom
} from '@mui/material';
import {
  SmartToy,
  Lightbulb,
  Help,
  School,
  Psychology,
  AutoAwesome,
  History,
  Clear,
  Send,
  TrendingUp,
  MenuBook,
  Support,
  Chat,
  Explore
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '300px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: -1,
      }
    }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
        {/* Enhanced Header */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 6, textAlign: 'center', color: 'white' }}>
            <Zoom in timeout={1000}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
              >
                <Psychology sx={{ fontSize: 40 }} />
              </Avatar>
            </Zoom>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
              AI Learning Assistant
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', maxWidth: 600, mx: 'auto' }}>
              Your personal study companion powered by advanced AI. Get instant help with concepts, 
              study strategies, and personalized learning guidance.
            </Typography>
          </Box>
        </Fade>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Main AI Assistant */}
          <Grid item xs={12} lg={8}>
            <Fade in timeout={1200}>
              <Card 
                sx={{ 
                  height: 600, 
                  borderRadius: 4,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <AIAssistant
                  isOpen={true}
                  maxHeight={600}
                  courseId={enrolledCourses[0]?._id}
                />
              </Card>
            </Fade>
          </Grid>

          {/* Enhanced Quick Tools */}
          <Grid item xs={12} lg={4}>
            <Fade in timeout={1400}>
              <Card 
                sx={{ 
                  borderRadius: 4,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <AutoAwesome />
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Quick Tools
                    </Typography>
                  </Box>
                  
                  <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                    sx={{ 
                      mb: 3,
                      '& .MuiTab-root': {
                        borderRadius: 2,
                        mx: 0.5,
                        minHeight: 48
                      }
                    }}
                  >
                    <Tab label="Explain" icon={<Psychology />} />
                    <Tab label="Study Tips" icon={<Lightbulb />} />
                    <Tab label="Help" icon={<Support />} />
                  </Tabs>

                  {/* Explain Concept Tab */}
                  <TabPanel value={activeTab} index={0}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        fullWidth
                        label="What would you like me to explain?"
                        placeholder="e.g., React hooks, photosynthesis, calculus..."
                        value={conceptForm.concept}
                        onChange={(e) => setConceptForm(prev => ({ ...prev, concept: e.target.value }))}
                        variant="outlined"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                      
                      <TextField
                        select
                        fullWidth
                        label="Difficulty Level"
                        value={conceptForm.difficulty}
                        onChange={(e) => setConceptForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                        SelectProps={{ native: true }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </TextField>

                      <TextField
                        select
                        fullWidth
                        label="Course Context (Optional)"
                        value={conceptForm.courseId}
                        onChange={(e) => setConceptForm(prev => ({ ...prev, courseId: e.target.value }))}
                        SelectProps={{ native: true }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
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
                        size="large"
                        sx={{ 
                          borderRadius: 3,
                          py: 1.5,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                          }
                        }}
                      >
                        Explain Concept
                      </Button>
                    </Box>
                  </TabPanel>

                  {/* Study Tips Tab */}
                  <TabPanel value={activeTab} index={1}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        Get personalized study suggestions based on your enrolled courses
                      </Typography>

                      {enrolledCourses.length === 0 ? (
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            borderRadius: 2,
                            bgcolor: 'grey.50'
                          }}
                        >
                          <School sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                          <Typography variant="body1" color="text.secondary">
                            No enrolled courses found. Enroll in courses to get personalized study tips!
                          </Typography>
                        </Paper>
                      ) : (
                        enrolledCourses.map(course => (
                          <Button
                            key={course._id}
                            variant="outlined"
                            onClick={() => getStudySuggestions(course._id)}
                            disabled={loading}
                            startIcon={<MenuBook />}
                            fullWidth
                            sx={{ 
                              borderRadius: 2,
                              py: 1.5,
                              justifyContent: 'flex-start',
                              textAlign: 'left'
                            }}
                          >
                            Get tips for {course.title}
                          </Button>
                        ))
                      )}

                      {studySuggestions && (
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            mt: 2,
                            borderRadius: 2,
                            bgcolor: 'primary.50',
                            border: '1px solid',
                            borderColor: 'primary.200'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Lightbulb sx={{ color: 'primary.main', mr: 1 }} />
                            <Typography variant="h6" color="primary.main">
                              Study Suggestions
                            </Typography>
                          </Box>
                          <Typography variant="body2" paragraph>
                            {studySuggestions.suggestions}
                          </Typography>
                          
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progress: {studySuggestions.progressSummary.completedChapters}/{studySuggestions.progressSummary.totalChapters} chapters completed
                            </Typography>
                          </Box>
                        </Paper>
                      )}
                    </Box>
                  </TabPanel>

                  {/* Help Tab */}
                  <TabPanel value={activeTab} index={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        Need help with the platform or your studies?
                      </Typography>

                      <List sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                        <ListItem>
                          <ListItemIcon>
                            <Chat color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Chat with AI" 
                            secondary="Ask any question in the main chat"
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemIcon>
                            <MenuBook color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Course Help" 
                            secondary="Get explanations for course concepts"
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemIcon>
                            <Explore color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Platform Guide" 
                            secondary="Learn how to use all features"
                          />
                        </ListItem>
                      </List>
                    </Box>
                  </TabPanel>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Enhanced Chat History */}
          <Grid item xs={12}>
            <Fade in timeout={1600}>
              <Card 
                sx={{ 
                  borderRadius: 4,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                        <History />
                      </Avatar>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Recent Conversations
                      </Typography>
                    </Box>
                    <Tooltip title="Clear History">
                      <IconButton 
                        onClick={clearChatHistory} 
                        disabled={chatHistory.length === 0}
                        sx={{ 
                          bgcolor: 'grey.100',
                          '&:hover': { bgcolor: 'grey.200' }
                        }}
                      >
                        <Clear />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {chatHistory.length === 0 ? (
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 6, 
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: 'grey.50'
                      }}
                    >
                      <SmartToy sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No conversations yet
                      </Typography>
                      <Typography color="text.secondary">
                        Start chatting with the AI assistant to see your conversation history here!
                      </Typography>
                    </Paper>
                  ) : (
                    <List sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                      {chatHistory.slice(-5).reverse().map((message, index) => (
                        <React.Fragment key={message.id}>
                          <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                            <ListItemIcon>
                              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                <SmartToy sx={{ fontSize: 18 }} />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                  {message.question}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary" paragraph>
                                    {message.response.substring(0, 200)}
                                    {message.response.length > 200 && '...'}
                                  </Typography>
                                  <Chip 
                                    label={message.timestamp.toLocaleString()}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
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
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AIAssistantPage;