import React, { useState, useRef, useEffect } from 'react';
import { Fab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Box, Paper, Avatar, IconButton, Chip, useTheme, useMediaQuery, CircularProgress, Tooltip, Collapse } from '@mui/material';
import { SmartToy, Close, Send, Minimize, Fullscreen, FullscreenExit, Lightbulb, Help, Psychology, Work } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { geminiAIService } from '../services/geminiAIService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

const FloatingAIAssistant: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showText, setShowText] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: `Hi there! 👋 Welcome to the Job Portal!

I'm your AI job search assistant and I'm here to help you with:

🎯 **Job Search:**
• Find the perfect job opportunities
• Optimize your job applications
• Improve your resume and cover letter
• Prepare for interviews

💼 **Career Guidance:**
• Career path recommendations
• Skill development advice
• Industry insights and trends
• Salary negotiation tips

🚀 **Platform Features:**
• How to use our job portal
• Setting up job alerts
• Company research tools
• Application tracking

What would you like to explore today?`,
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          'Find jobs for me',
          'Help with my resume',
          'Interview preparation',
          'Career advice'
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [open]);

  // Show text on hover for desktop
  const handleMouseEnter = () => {
    if (!isMobile) {
      setShowText(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowText(false);
    }
  };

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
      const response = await geminiAIService.sendMessage({
        message: inputText,
        context: {
          page: 'job-portal',
          platform: 'Excellence Coaching Hub Job Portal',
          features: ['job search', 'career guidance', 'resume help', 'interview preparation']
        }
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
        suggestions: response.suggestions || [
          'Find more jobs',
          'Resume help',
          'Interview tips',
          'Career guidance'
        ]
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again later.',
        isUser: false,
        timestamp: new Date(),
        suggestions: ['Try again', 'Job search help', 'Contact support']
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
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
      {/* Responsive Floating AI Assistant Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 20, md: 24 },
          left: { xs: 16, sm: 20, md: 24 }, // Position on left to avoid contact button
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0, sm: 1 },
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Conditional Text Label - Only show on hover for desktop */}
        <Collapse in={showText} orientation="horizontal" timeout={300}>
          <Box
            sx={{
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #1a1a2e, #16213e)'
                : 'linear-gradient(45deg, #ffffff, #f8f9fa)',
              color: theme.palette.mode === 'dark' ? '#4ade80' : '#667eea',
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              borderRadius: '20px',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                : '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(102, 126, 234, 0.3)'}`,
              backdropFilter: 'blur(10px)',
              mr: 1,
            }}
          >
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem' },
                whiteSpace: 'nowrap',
              }}
            >
              {isMobile ? 'Job AI' : 'Job Assistant'}
            </Typography>
          </Box>
        </Collapse>

        {/* Responsive Floating Action Button */}
        <Tooltip title={isMobile ? "AI Job Assistant" : ""} arrow placement="right">
          <Fab
            component={motion.button}
            whileHover={{ scale: isMobile ? 1.05 : 1.1 }}
            whileTap={{ scale: 0.95 }}
            color="primary"
            onClick={() => setOpen(true)}
            size={isMobile ? "medium" : "large"}
            sx={{
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
              width: { xs: 48, sm: 56, md: 64 },
              height: { xs: 48, sm: 56, md: 64 },
              '&:hover': {
                background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
                boxShadow: '0 12px 35px rgba(102, 126, 234, 0.6)',
              },
            }}
          >
            <Work sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }} />
          </Fab>
        </Tooltip>
      </Box>

      {/* Responsive AI Assistant Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullScreen={fullscreen || isMobile}
        maxWidth={isMobile ? "xs" : isTablet ? "sm" : "md"}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '20px',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.5)'
              : '0 20px 60px rgba(0, 0, 0, 0.15)',
            maxHeight: isMobile ? '100vh' : '90vh',
            margin: isMobile ? 0 : '32px',
            height: fullscreen ? '100vh' : minimized ? '60px' : 'auto',
            transition: 'height 0.3s ease-in-out'
          },
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
            py: { xs: 2, sm: 2.5, md: 3 },
            px: { xs: 2, sm: 3 },
            position: 'relative',
          }}
        >
          <Box display="flex" alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                mr: 2,
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              <Work sx={{ fontSize: { xs: 20, sm: 28 } }} />
            </Avatar>
            <Box>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{ fontWeight: 700, mb: 0.5 }}
              >
                AI Job Assistant
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: { xs: '0.7rem', sm: '0.8rem' }
                }}
              >
                💼 Your personal career guide
              </Typography>
            </Box>
          </Box>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {!isMobile && (
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
            )}
            {!isMobile && (
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
            )}
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
              <Close sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Content */}
        {!minimized && (
          <>
            <DialogContent sx={{ p: 0, maxHeight: isMobile ? 'calc(100vh - 120px)' : '70vh', overflow: 'auto' }}>
              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: { xs: 2, sm: 3 },
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
                          p: { xs: 1.5, sm: 2 },
                          maxWidth: '85%',
                          backgroundColor: message.isUser ? '#2196F3' : 'white',
                          color: message.isUser ? 'white' : 'text.primary',
                          borderRadius: message.isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px'
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                          }}
                        >
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
                              fontSize: { xs: '0.7rem', sm: '0.8rem' },
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
            <Box sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  mb: 1, 
                  display: 'block',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' }
                }}
              >
                Quick Actions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Work />}
                  onClick={() => setInputText('Find jobs for me')}
                  disabled={loading}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                >
                  Find Jobs
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Lightbulb />}
                  onClick={() => setInputText('Help with my resume')}
                  disabled={loading}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                >
                  Resume Help
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Psychology />}
                  onClick={() => setInputText('Interview preparation tips')}
                  disabled={loading}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                >
                  Interview Tips
                </Button>
              </Box>
            </Box>

            {/* Input */}
            <DialogActions sx={{ p: { xs: 2, sm: 3 }, backgroundColor: 'white', borderTop: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="Ask me anything about job search..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || loading}
                  sx={{
                    minWidth: { xs: '45px', sm: '50px' },
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    px: { xs: 1, sm: 2 }
                  }}
                >
                  <Send sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
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
