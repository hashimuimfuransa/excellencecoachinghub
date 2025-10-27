import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Collapse,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Clear,
  ExpandMore,
  ExpandLess,
  Help,
  Lightbulb,
  Quiz,
  School,
  MoreVert,
  History,
  Delete
} from '@mui/icons-material';
import { format } from 'date-fns';
import { aiAssistantService, IChatMessage } from '../services/aiAssistantService';

interface AIAssistantProps {
  courseId?: string;
  topic?: string;
  isOpen?: boolean;
  onClose?: () => void;
  maxHeight?: number;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  courseId,
  topic,
  isOpen = true,
  onClose,
  maxHeight = 600
}) => {
  // State management
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history and check availability on mount
  useEffect(() => {
    const loadData = async () => {
      // Load chat history
      const history = aiAssistantService.getChatHistory();
      setMessages(history);

      // Check AI availability
      try {
        const availability = await aiAssistantService.checkAvailability();
        setIsAvailable(availability.available);
        if (!availability.available) {
          setError(availability.message);
        }
      } catch (err) {
        setIsAvailable(false);
        setError('AI Assistant is currently unavailable');
      }
    };

    loadData();
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      aiAssistantService.saveChatHistory(messages);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!currentQuestion.trim() || loading || !isAvailable) return;

    // Validate question
    const validation = aiAssistantService.validateQuestion(currentQuestion);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid question');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build context from recent messages
      const context = aiAssistantService.buildContext(messages);
      
      // Send question to AI
      const response = await aiAssistantService.chatWithAI({
        question: currentQuestion,
        context: context || undefined,
        courseId
      });

      // Add message to chat
      setMessages(prev => [...prev, response]);
      setCurrentQuestion('');
      setShowSuggestions(false);

      // Focus input for next question
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

    } catch (err: any) {
      setError(err.message || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setCurrentQuestion(question);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    setMessages([]);
    aiAssistantService.clearChatHistory();
    setShowSuggestions(true);
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const suggestedQuestions = aiAssistantService.getSuggestedQuestions(courseId, topic);

  if (!isOpen) return null;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: maxHeight,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <SmartToy fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              AI Study Assistant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isAvailable ? 'Online' : 'Offline'}
            </Typography>
          </Box>
        </Box>

        <Box>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleClearChat}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Clear Chat</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        {/* Welcome message */}
        {messages.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <SmartToy sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              Hello! I'm your AI Study Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              I'm here to help you understand concepts, explain topics, and guide your learning.
              Ask me anything about your studies!
            </Typography>
            
            {/* Suggested questions */}
            <Collapse in={showSuggestions}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Try asking:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {suggestedQuestions.slice(0, 4).map((question, index) => (
                    <Chip
                      key={index}
                      label={question}
                      variant="outlined"
                      size="small"
                      onClick={() => handleSuggestedQuestion(question)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Chat messages */}
        {messages.map((message) => (
          <Box key={message.id}>
            {/* User question */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              mb: 1 
            }}>
              <Box sx={{ 
                maxWidth: '80%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1
              }}>
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  borderRadius: 2,
                  borderBottomRightRadius: 0.5
                }}>
                  <Typography variant="body2">
                    {message.question}
                  </Typography>
                </Paper>
                <Avatar sx={{ bgcolor: 'grey.300', width: 24, height: 24 }}>
                  <Person fontSize="small" />
                </Avatar>
              </Box>
            </Box>

            {/* AI response */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-start', 
              mb: 2 
            }}>
              <Box sx={{ 
                maxWidth: '80%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1
              }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
                  <SmartToy fontSize="small" />
                </Avatar>
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  borderBottomLeftRadius: 0.5
                }}>
                  <Typography 
                    variant="body2" 
                    dangerouslySetInnerHTML={{ 
                      __html: aiAssistantService.formatResponse(message.response) 
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {format(message.timestamp, 'HH:mm')}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </Box>
        ))}

        {/* Loading indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
                <SmartToy fontSize="small" />
              </Avatar>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Thinking...
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Error message */}
      {error && (
        <Box sx={{ p: 1 }}>
          <Alert
            severity="error"
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Input area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={3}
            placeholder={isAvailable ? "Ask me anything about your studies..." : "AI Assistant is offline"}
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading || !isAvailable}
            size="small"
          />
          <Tooltip title="Send message">
            <span>
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!currentQuestion.trim() || loading || !isAvailable}
              >
                {loading ? <CircularProgress size={20} /> : <Send />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Quick actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Tooltip title="Get study suggestions">
            <Chip
              icon={<Lightbulb />}
              label="Study Tips"
              size="small"
              variant="outlined"
              onClick={() => handleSuggestedQuestion("Can you give me some study tips for this course?")}
              disabled={loading || !isAvailable}
            />
          </Tooltip>
          <Tooltip title="Explain a concept">
            <Chip
              icon={<Help />}
              label="Explain"
              size="small"
              variant="outlined"
              onClick={() => handleSuggestedQuestion("Can you explain this concept in simple terms?")}
              disabled={loading || !isAvailable}
            />
          </Tooltip>
          <Tooltip title="Practice questions">
            <Chip
              icon={<Quiz />}
              label="Practice"
              size="small"
              variant="outlined"
              onClick={() => handleSuggestedQuestion("Can you create some practice questions for me?")}
              disabled={loading || !isAvailable}
            />
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default AIAssistant;
