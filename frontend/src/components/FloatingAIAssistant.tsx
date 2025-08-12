import React, { useState, useRef, useEffect } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Chip,
  Slide,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  SmartToy,
  Close,
  Send,
  Minimize,
  Fullscreen,
  FullscreenExit,
  Lightbulb,
  Help,
  Psychology,
  Quiz
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { useAuth } from '../hooks/useAuth';
import { aiAssistantService } from '../services/aiAssistantService';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface FloatingAIAssistantProps {
  context?: {
    page?: string;
    courseId?: string;
    lessonId?: string;
    content?: string;
    courseTitle?: string;
    courseCategory?: string;
    [key: string]: any; // Allow additional context properties
  };
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ context }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiServiceStatus, setAiServiceStatus] = useState<'available' | 'overloaded' | 'unknown'>('unknown');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      const contextInfo = context?.courseTitle ? `\n\nI see you're studying "${context.courseTitle}". I can provide specific help with this course!` : '';

      const welcomeMessage: Message = {
        id: 'welcome',
        text: `Hi ${user?.firstName || 'there'}! 👋 Welcome to your AI learning assistant!

I'm here to help you succeed on Excellence Coaching Hub. I can assist you with:

📚 **Learning Support:**
• Explain complex concepts in simple terms
• Create personalized practice quizzes
• Provide effective study strategies
• Help with assignments and homework

🎯 **Platform Guidance:**
• Show you how to use website features
• Guide you through courses and assessments
• Help you navigate live sessions
• Explain progress tracking

💬 **Conversational Help:**
• Answer any questions about your studies
• Provide motivation and encouragement
• Chat about learning strategies
• Discuss course-related topics${contextInfo}

What would you like to explore today?`,
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          'How do I use this platform?',
          'Explain a concept',
          'Create a practice quiz',
          'Give me study tips'
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [open, user, context]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Prepare context for AI
      const aiContext = {
        userMessage: inputText,
        context: context || {},
        previousMessages: messages.slice(-5) // Last 5 messages for context
      };

      const response = await aiAssistantService.sendMessage(aiContext);

      // Update AI service status based on response
      if (response.message.includes('overloaded') || response.message.includes('high demand')) {
        setAiServiceStatus('overloaded');
      } else {
        setAiServiceStatus('available');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      // Update status based on error type
      if (error.message?.includes('overloaded') || error.message?.includes('503')) {
        setAiServiceStatus('overloaded');
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. The AI service might be temporarily overloaded. Please try again in a few minutes.',
        isUser: false,
        timestamp: new Date(),
        suggestions: ['Try again later', 'Platform help', 'Study tips', 'Course navigation']
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    // Handle special suggestions that trigger specific AI functions
    if (suggestion.includes('Create a quiz')) {
      await handleQuizGeneration();
    } else if (suggestion.includes('Explain')) {
      setInputText(suggestion);
    } else {
      setInputText(suggestion);
    }
  };

  const handleQuizGeneration = async () => {
    if (loading) return;

    const quizMessage: Message = {
      id: Date.now().toString(),
      text: 'Generate a quiz based on my course content',
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, quizMessage]);
    setLoading(true);

    try {
      // Check if we have course content/notes to generate quiz from
      const hasContent = context?.courseTitle;
      const hasNotes = context?.content &&
                      context.content.length > 0 &&
                      !context.content.includes('No course content available') &&
                      context?.hasContent !== false;

      if (!hasContent) {
        const noContentMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `I'd love to create a quiz for you! However, I need some course content or notes to generate meaningful questions from.

Here's what you can do:
• Go to "Course Content" to access your learning materials
• Make sure you're enrolled in a course
• View some lessons or notes first
• Then come back and I'll create a quiz based on what you've studied!

Would you like me to help you navigate to your course content instead?`,
          isUser: false,
          timestamp: new Date(),
          suggestions: ['How to access course content?', 'Show me my courses', 'Help with navigation', 'Study tips instead']
        };
        setMessages(prev => [...prev, noContentMessage]);
        return;
      }

      if (!hasNotes) {
        const noNotesMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `I can see you're studying "${context?.courseTitle}", but I don't have access to specific course notes or content to generate a quiz from.

To create a meaningful quiz, I need:
• Course notes or lesson content
• Study materials you've been working with
• Specific topics you want to be tested on

You can:
• Go to your course content and study some materials first
• Tell me specific topics you want to practice
• Ask me to explain concepts instead

What specific topic from "${context?.courseTitle}" would you like help with?`,
          isUser: false,
          timestamp: new Date(),
          suggestions: ['Explain course concepts', 'How to access notes?', 'Study strategies', 'Help with topics']
        };
        setMessages(prev => [...prev, noNotesMessage]);
        return;
      }

      // Generate quiz based on actual content
      const topic = context?.courseTitle || 'course content';
      const contentSummary = context?.content || '';

      const response = await aiAssistantService.generateQuiz(topic, 'medium', 3, contentSummary);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Great! I've created a quiz based on your "${topic}" course content:\n\n${response.quiz}\n\nThis quiz is based on the materials you've been studying. How did you do?`,
        isUser: false,
        timestamp: new Date(),
        suggestions: ['Make it harder', 'Add more questions', 'Explain the answers', 'Different topics']
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error generating the quiz. Please make sure you have course content available and try again.',
        isUser: false,
        timestamp: new Date(),
        suggestions: ['Try again', 'Access course content', 'Ask for help', 'Study tips instead']
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="AI Assistant"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
          }
        }}
        onClick={() => setOpen(true)}
      >
        <SmartToy />
      </Fab>

      {/* AI Assistant Dialog */}
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setOpen(false)}
        fullScreen={fullscreen || isMobile}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: fullscreen ? '100vh' : minimized ? '60px' : '600px',
            maxHeight: fullscreen ? '100vh' : '80vh',
            transition: 'height 0.3s ease-in-out'
          }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1
          }}
        >
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1 }}>
              <Psychology />
            </Avatar>
            <Box>
              <Typography variant="h6">AI Learning Assistant</Typography>
              {aiServiceStatus === 'overloaded' && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  ⚠️ High demand - responses may be delayed
                </Typography>
              )}
              {aiServiceStatus === 'available' && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  ✅ AI service active
                </Typography>
              )}
            </Box>
          </Box>
          <Box>
            <IconButton
              size="small"
              onClick={toggleMinimize}
              sx={{ color: 'white', mr: 1 }}
            >
              <Minimize />
            </IconButton>
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              sx={{ color: 'white', mr: 1 }}
            >
              {fullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Content */}
        {!minimized && (
          <>
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: 2,
                  backgroundColor: '#f5f5f5'
                }}
              >
                {messages.map((message) => (
                  <Box key={message.id} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                        mb: 1
                      }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '70%',
                          backgroundColor: message.isUser ? '#2196F3' : 'white',
                          color: message.isUser ? 'white' : 'text.primary',
                          borderRadius: message.isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px'
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.text}
                        </Typography>
                      </Paper>
                    </Box>
                    
                    {/* Suggestions */}
                    {message.suggestions && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {message.suggestions.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            size="small"
                            onClick={() => handleSuggestionClick(suggestion)}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'white'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
                
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                    <Paper sx={{ p: 2, borderRadius: '20px 20px 20px 5px' }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                        Thinking...
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                <div ref={messagesEndRef} />
              </Box>
            </DialogContent>

            {/* Quick Actions */}
            <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Quick Actions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Help />}
                  onClick={() => setInputText('How do I use this platform?')}
                  disabled={loading}
                >
                  Platform Help
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Quiz />}
                  onClick={handleQuizGeneration}
                  disabled={loading}
                >
                  Generate Quiz
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Lightbulb />}
                  onClick={() => setInputText('Explain the main concepts')}
                  disabled={loading}
                >
                  Explain Concepts
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Psychology />}
                  onClick={() => setInputText('Give me study tips and strategies')}
                  disabled={loading}
                >
                  Study Tips
                </Button>
              </Box>
            </Box>

            {/* Input */}
            <DialogActions sx={{ p: 2, backgroundColor: 'white', borderTop: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="Ask me anything about your learning..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || loading}
                  sx={{
                    minWidth: '50px',
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                  }}
                >
                  <Send />
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default FloatingAIAssistant;
