import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Chip,
  Stack,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  SmartToy,
  Close,
  TrendingUp,
  Lightbulb,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Star,
  Send,
  AutoFixHigh,
  Psychology,
  Search,
  School,
  Work,
  ExpandMore,
  ContentCopy,
  Refresh,
} from '@mui/icons-material';
import { CVData, AIAnalysisResult } from '../../services/cvBuilderService';
import cvBuilderService from '../../services/cvBuilderService';

interface CVAIAssistantProps {
  open: boolean;
  onClose: () => void;
  cvData: CVData;
  analysis: AIAnalysisResult | null;
  onUpdateCV: (cvData: CVData) => void;
}

const CVAIAssistant: React.FC<CVAIAssistantProps> = ({
  open,
  onClose,
  cvData,
  analysis,
  onUpdateCV,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'ai'; message: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizationJob, setOptimizationJob] = useState({
    title: '',
    description: '',
    requirements: [''],
  });

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { type: 'user', message: userMessage }]);
    
    setIsLoading(true);
    try {
      const response = await cvBuilderService.generateAIContent(
        `Based on the user's CV data: ${JSON.stringify(cvData)}, please answer this question: ${userMessage}`,
        'chat'
      );
      setChatHistory(prev => [...prev, { type: 'ai', message: response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        message: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeForJob = async () => {
    if (!optimizationJob.title.trim()) return;

    setIsLoading(true);
    try {
      const result = await cvBuilderService.optimizeForJob({
        cvData,
        targetJob: optimizationJob,
      });
      onUpdateCV(result.optimizedCV);
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: `I've optimized your CV for the ${optimizationJob.title} position. Key improvements include better keyword alignment, enhanced achievements, and tailored content structure.`
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: 'Sorry, I couldn\'t optimize your CV at the moment. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImproveSuggestion = async (suggestion: string, priority: string) => {
    setIsLoading(true);
    try {
      const response = await cvBuilderService.generateAIContent(
        `Based on this CV improvement suggestion: "${suggestion}", generate specific actionable content for the user's CV. Current CV data: ${JSON.stringify(cvData)}`,
        'improvement'
      );
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: `Here's how to improve "${suggestion}":\n\n${response}`
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: 'Sorry, I couldn\'t generate improvement suggestions at the moment.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <ErrorIcon />;
      case 'medium': return <Warning />;
      case 'low': return <Lightbulb />;
      default: return <CheckCircle />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '90vh',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="between">
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToy color="primary" />
            <Typography variant="h6">AI CV Assistant</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Analysis" icon={<Psychology />} />
            <Tab label="Job Optimization" icon={<TrendingUp />} />
            <Tab label="AI Chat" icon={<SmartToy />} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3, height: '60vh', overflow: 'auto' }}>
          {/* Analysis Tab */}
          {activeTab === 0 && (
            <Box>
              {analysis ? (
                <Stack spacing={3}>
                  {/* CV Score */}
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                        <Box textAlign="center">
                          <Typography variant="h2" color="primary" sx={{ fontWeight: 'bold' }}>
                            {analysis.score}
                          </Typography>
                          <Typography variant="h6" color="textSecondary">
                            CV Score
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={analysis.score}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={analysis.score >= 80 ? 'success' : analysis.score >= 60 ? 'warning' : 'error'}
                      />
                      <Box mt={1} textAlign="center">
                        <Typography variant="body2" color="textSecondary">
                          {analysis.score >= 80 ? 'Excellent CV!' : 
                           analysis.score >= 60 ? 'Good CV with room for improvement' : 
                           'Needs significant improvements'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Improvements */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Priority Improvements
                      </Typography>
                      
                      <Stack spacing={2}>
                        {analysis.improvements.map((improvement, index) => (
                          <Accordion key={index}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Box display="flex" alignItems="center" gap={1} width="100%">
                                {getPriorityIcon(improvement.priority)}
                                <Typography sx={{ flexGrow: 1 }}>
                                  {improvement.section}
                                </Typography>
                                <Chip
                                  label={improvement.priority}
                                  size="small"
                                  color={getPriorityColor(improvement.priority)}
                                />
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Typography variant="body2" color="textSecondary" mb={2}>
                                {improvement.suggestion}
                              </Typography>
                              <Button
                                size="small"
                                startIcon={<AutoFixHigh />}
                                onClick={() => handleImproveSuggestion(improvement.suggestion, improvement.priority)}
                                disabled={isLoading}
                              >
                                Get AI Suggestions
                              </Button>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Keywords */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Detected Keywords
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {analysis.keywords.map((keyword, index) => (
                          <Chip
                            key={index}
                            label={keyword}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Missing Elements */}
                  {analysis.missingElements.length > 0 && (
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="warning.main">
                          Missing Elements
                        </Typography>
                        <List>
                          {analysis.missingElements.map((element, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Warning color="warning" />
                              </ListItemIcon>
                              <ListItemText primary={element} />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              ) : (
                <Box textAlign="center" py={4}>
                  <Psychology sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No Analysis Available
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Click the analyze button to get AI-powered insights about your CV
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Job Optimization Tab */}
          {activeTab === 1 && (
            <Stack spacing={3}>
              <Typography variant="h6">Optimize CV for Specific Job</Typography>
              
              <TextField
                fullWidth
                label="Job Title"
                value={optimizationJob.title}
                onChange={(e) => setOptimizationJob(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Job Description"
                value={optimizationJob.description}
                onChange={(e) => setOptimizationJob(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Paste the job description here..."
              />
              
              <Button
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={16} /> : <TrendingUp />}
                onClick={handleOptimizeForJob}
                disabled={!optimizationJob.title.trim() || isLoading}
                fullWidth
              >
                {isLoading ? 'Optimizing...' : 'Optimize CV for This Job'}
              </Button>
              
              <Alert severity="info">
                The AI will analyze the job requirements and suggest improvements to better match your CV to the position.
              </Alert>
            </Stack>
          )}

          {/* AI Chat Tab */}
          {activeTab === 2 && (
            <Stack spacing={2} height="100%">
              {/* Chat History */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'background.default',
                  maxHeight: '400px',
                }}
              >
                {chatHistory.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <SmartToy sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                      Hi! I'm your AI CV assistant. Ask me anything about your CV!
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Try asking: "How can I improve my professional summary?" or "What skills should I add for a tech role?"
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {chatHistory.map((chat, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: chat.type === 'user' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Card
                          sx={{
                            maxWidth: '80%',
                            bgcolor: chat.type === 'user' ? 'primary.main' : 'background.paper',
                            color: chat.type === 'user' ? 'white' : 'text.primary',
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {chat.message}
                            </Typography>
                            {chat.type === 'ai' && (
                              <IconButton
                                size="small"
                                onClick={() => navigator.clipboard.writeText(chat.message)}
                                sx={{ mt: 1, color: 'inherit', opacity: 0.7 }}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            )}
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                    {isLoading && (
                      <Box display="flex" justifyContent="flex-start">
                        <Card sx={{ bgcolor: 'background.paper' }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CircularProgress size={16} />
                              <Typography variant="body2">AI is typing...</Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    )}
                  </Stack>
                )}
              </Box>
              
              {/* Chat Input */}
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  placeholder="Ask me anything about your CV..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  multiline
                  maxRows={3}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim() || isLoading}
                  sx={{ minWidth: 48, px: 2 }}
                >
                  <Send />
                </Button>
              </Box>

              {/* Quick Questions */}
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Quick questions:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {[
                    'How can I improve my professional summary?',
                    'What skills are missing for tech roles?',
                    'How to make my experience more impactful?',
                    'Tips for ATS optimization?',
                  ].map((question, index) => (
                    <Chip
                      key={index}
                      label={question}
                      size="small"
                      variant="outlined"
                      onClick={() => setChatMessage(question)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {activeTab === 0 && (
          <Button 
            variant="contained" 
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Re-analyze CV
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CVAIAssistant;