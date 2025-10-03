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
  Psychology
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
• Provide effective study strategies and tips
• Help with assignments and homework
• Break down difficult topics step by step

🎯 **Platform Guidance:**
• Show you how to use website features
• Guide you through courses and materials
• Help you navigate live sessions
• Explain progress tracking and features

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
          'Give me study tips',
          'Help with assignments'
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
    // Handle special suggestions
    if (suggestion.includes('Explain')) {
      setInputText(suggestion);
    } else {
      setInputText(suggestion);
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
      {/* Enhanced Floating Action Button */}
      <Fab
        color="primary"
        aria-label="AI Assistant"
        sx={{
          position: 'fixed',
          bottom: { xs: 100, sm: 100, md: 24 }, // Adjusted for mobile bottom nav
          right: 24,
          zIndex: 1000,
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            transform: 'scale(1.1) translateY(-2px)',
            boxShadow: '0 12px 40px rgba(102, 126, 234, 0.6)',
          },
          '&:active': {
            transform: 'scale(1.05)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%',
            zIndex: -1,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover::before': {
            opacity: 0.7,
          }
        }}
        onClick={() => setOpen(true)}
      >
        <SmartToy sx={{ fontSize: 32, color: 'white' }} />
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
        {/* Enhanced Header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              zIndex: 0,
            }
          }}
        >
          <Box display="flex" alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                mr: 2,
                width: 48,
                height: 48,
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              <Psychology sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                AI Learning Assistant
              </Typography>
              {aiServiceStatus === 'overloaded' && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>
                  ⚠️ High demand - responses may be delayed
                </Typography>
              )}
              {aiServiceStatus === 'available' && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>
                  ✅ Ready to help you learn
                </Typography>
              )}
              {aiServiceStatus === 'unknown' && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>
                  🤖 Your personal study companion
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <IconButton
              size="small"
              onClick={toggleMinimize}
              sx={{ 
                color: 'white', 
                mr: 1,
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Minimize />
            </IconButton>
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              sx={{ 
                color: 'white', 
                mr: 1,
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {fullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
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
