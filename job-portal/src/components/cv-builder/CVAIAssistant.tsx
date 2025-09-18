import React, { useState, useEffect } from 'react';
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
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
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
  Person,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'ai'; message: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownGreeting, setHasShownGreeting] = useState(false);
  const [chatScrollElement, setChatScrollElement] = useState<HTMLElement | null>(null);
  const [optimizationJob, setOptimizationJob] = useState({
    title: '',
    description: '',
    requirements: [''],
  });

  // Show personalized greeting when chat tab is opened
  useEffect(() => {
    if (activeTab === 2 && !hasShownGreeting && chatHistory.length === 0) {
      setHasShownGreeting(true);
      
      const experiences = cvData.experience || cvData.experiences || [];
      const userName = cvData.personalInfo.firstName || 'there';
      
      let greeting = `Hello ${userName}! 👋 I'm here to help you create an outstanding CV. `;
      
      if (experiences.length === 0) {
        greeting += "I notice you haven't added any work experience yet. Would you like help writing compelling experience entries, or do you have questions about what to include if you're just starting your career?";
      } else if (!cvData.personalInfo.professionalSummary) {
        greeting += "I see you have work experience listed. Would you like me to help you create a powerful professional summary that highlights your key strengths?";
      } else {
        greeting += "I can see you've made good progress on your CV! I'm here to help you optimize it further. What specific aspect would you like to improve?";
      }
      
      setTimeout(() => {
        setChatHistory([{ type: 'ai', message: greeting }]);
      }, 500);
    }
  }, [activeTab, hasShownGreeting, chatHistory.length, cvData]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatScrollElement && chatHistory.length > 0) {
      setTimeout(() => {
        chatScrollElement.scrollTop = chatScrollElement.scrollHeight;
      }, 100);
    }
  }, [chatHistory, chatScrollElement]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { type: 'user', message: userMessage }]);
    
    setIsLoading(true);
    try {
      // Create a better context-aware prompt
      const contextPrompt = createContextualPrompt(cvData, userMessage);
      
      const response = await cvBuilderService.generateAIContent(
        contextPrompt,
        'chat'
      );
      setChatHistory(prev => [...prev, { type: 'ai', message: response }]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        message: 'I apologize, but I encountered an issue while processing your request. This might be due to network connectivity or AI service limitations. Please try again in a few moments, or try rephrasing your question.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create contextual prompts based on CV data
  const createContextualPrompt = (cvData: CVData, userQuestion: string): string => {
    const experiences = cvData.experience || cvData.experiences || [];
    const skillsArray = Array.isArray(cvData.skills) 
      ? cvData.skills 
      : [
          ...(cvData.skills?.technical || []),
          ...(cvData.skills?.soft || []),
          ...(cvData.skills?.languages || [])
        ];

    const context = {
      name: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`.trim(),
      experienceCount: experiences.length,
      hasExperience: experiences.length > 0,
      latestJob: experiences[0]?.jobTitle || 'No experience listed',
      skillsCount: skillsArray.length,
      hasEducation: cvData.education && cvData.education.length > 0,
      hasSummary: !!cvData.personalInfo.professionalSummary,
      hasProjects: cvData.projects && cvData.projects.length > 0
    };

    return `You are an expert CV/Resume consultant helping ${context.name || 'a job seeker'}. 

CURRENT CV PROFILE:
- Experience: ${context.experienceCount} positions listed${context.hasExperience ? `, most recent: ${context.latestJob}` : ' (needs work experience)'}
- Skills: ${context.skillsCount} skills listed${context.skillsCount < 5 ? ' (consider adding more)' : ''}
- Education: ${context.hasEducation ? 'Provided' : 'Missing (needs education background)'}
- Professional Summary: ${context.hasSummary ? 'Included' : 'Missing (highly recommended)'}
- Projects: ${context.hasProjects ? 'Included' : 'None listed (consider adding relevant projects)'}

USER QUESTION: "${userQuestion}"

INSTRUCTIONS:
1. Provide specific, actionable advice tailored to their profile
2. If they ask about improvements, focus on the weakest areas first
3. Give concrete examples and specific wording suggestions
4. Keep responses concise but comprehensive (2-4 paragraphs max)
5. If asking about skills/experience, suggest industry-relevant additions
6. Always encourage and be constructive

Respond as a friendly, knowledgeable CV expert:`;
  };

  // Generate smart quick questions based on CV content
  const getSmartQuickQuestions = (cvData: CVData): string[] => {
    const experiences = cvData.experience || cvData.experiences || [];
    const skillsArray = Array.isArray(cvData.skills) 
      ? cvData.skills 
      : [
          ...(cvData.skills?.technical || []),
          ...(cvData.skills?.soft || []),
          ...(cvData.skills?.languages || [])
        ];

    const questions = [];

    // Personalized questions based on CV gaps
    if (!cvData.personalInfo.professionalSummary) {
      questions.push('Help me write a compelling professional summary');
    } else if (cvData.personalInfo.professionalSummary.length < 100) {
      questions.push('How can I improve my professional summary?');
    }

    if (experiences.length === 0) {
      questions.push('I have no work experience - what should I include?');
    } else if (experiences.length > 0 && experiences.some(exp => !exp.achievements || exp.achievements.length === 0)) {
      questions.push('How can I make my work experience more impactful?');
    }

    if (skillsArray.length < 5) {
      questions.push('What skills should I add to my CV?');
    } else {
      questions.push('How should I organize my skills section?');
    }

    if (!cvData.projects || cvData.projects.length === 0) {
      questions.push('Should I include personal projects?');
    }

    // Always include some general helpful questions
    questions.push('Tips for ATS optimization');
    questions.push('What are common CV mistakes to avoid?');
    questions.push('How long should my CV be?');

    // Return first 4 questions to fit the UI
    return questions.slice(0, 4);
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
      maxWidth={isMobile ? false : "lg"}
      fullWidth={!isMobile}
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          height: isMobile ? '100vh' : '90vh',
          borderRadius: isMobile ? 0 : 3,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.grey[900]})`
            : `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
          backdropFilter: 'blur(20px)',
        }
      }}
      TransitionComponent={Fade}
      transitionDuration={300}
    >
      <DialogTitle 
        sx={{ 
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.primary.dark}20, ${theme.palette.secondary.dark}20)`
            : `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          p: { xs: 2, md: 3 }
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Zoom in={open}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box 
                sx={{
                  p: 1,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}30`
                }}
              >
                <SmartToy sx={{ color: 'white', fontSize: { xs: 20, md: 24 } }} />
              </Box>
              <Box>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700 }}>
                  AI CV Assistant
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Your intelligent career companion
                </Typography>
              </Box>
            </Box>
          </Zoom>
          <IconButton 
            onClick={onClose}
            sx={{ 
              bgcolor: theme.palette.action.hover,
              '&:hover': {
                bgcolor: theme.palette.action.selected,
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '100%' }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' 
            ? theme.palette.background.paper 
            : theme.palette.background.default 
        }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minHeight: { xs: 48, md: 56 },
                fontWeight: 600
              }
            }}
          >
            <Tab 
              label={isSmallMobile ? "Analysis" : "Analysis"} 
              icon={<Psychology sx={{ fontSize: { xs: 18, md: 24 } }} />} 
              iconPosition={isSmallMobile ? "top" : "start"}
            />
            <Tab 
              label={isSmallMobile ? "Optimize" : "Job Optimization"} 
              icon={<TrendingUp sx={{ fontSize: { xs: 18, md: 24 } }} />} 
              iconPosition={isSmallMobile ? "top" : "start"}
            />
            <Tab 
              label={isSmallMobile ? "Chat" : "AI Chat"} 
              icon={<SmartToy sx={{ fontSize: { xs: 18, md: 24 } }} />} 
              iconPosition={isSmallMobile ? "top" : "start"}
            />
          </Tabs>
        </Box>

        <Box sx={{ 
          p: { xs: 2, md: 3 }, 
          height: isMobile ? 'calc(100vh - 200px)' : '60vh', 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.primary.main,
            borderRadius: 4,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          },
        }}>
          {/* Analysis Tab */}
          {activeTab === 0 && (
            <Box>
              {analysis ? (
                <Stack spacing={{ xs: 2, md: 3 }}>
                  {/* CV Score - Enhanced */}
                  <Zoom in={activeTab === 0}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 3,
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(135deg, ${theme.palette.grey[900]}, ${theme.palette.grey[800]})`
                          : `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
                          <Box textAlign="center">
                            <Box
                              sx={{
                                position: 'relative',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2
                              }}
                            >
                              <CircularProgress
                                variant="determinate"
                                value={100}
                                size={isMobile ? 100 : 120}
                                thickness={3}
                                sx={{ color: theme.palette.grey[300], position: 'absolute' }}
                              />
                              <CircularProgress
                                variant="determinate"
                                value={analysis.score}
                                size={isMobile ? 100 : 120}
                                thickness={3}
                                color={analysis.score >= 80 ? 'success' : analysis.score >= 60 ? 'warning' : 'error'}
                                sx={{
                                  '& .MuiCircularProgress-circle': {
                                    strokeLinecap: 'round',
                                  },
                                }}
                              />
                              <Box
                                sx={{
                                  position: 'absolute',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexDirection: 'column'
                                }}
                              >
                                <Typography variant={isMobile ? "h3" : "h2"} color="primary" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                                  {analysis.score}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  SCORE
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant={isMobile ? "subtitle1" : "h6"} color="text.secondary" sx={{ fontWeight: 600 }}>
                              {analysis.score >= 80 ? '🎉 Excellent CV!' : 
                               analysis.score >= 60 ? '👍 Good CV with room for improvement' : 
                               '🚀 Needs significant improvements'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Zoom>

                  {/* Improvements - Enhanced */}
                  <Card
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.grey[900]}, ${theme.palette.grey[800]})`
                        : `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: theme.palette.warning.main,
                            color: 'white'
                          }}
                        >
                          <TrendingUp sx={{ fontSize: { xs: 20, md: 24 } }} />
                        </Box>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 700 }}>
                          Priority Improvements
                        </Typography>
                      </Box>
                      
                      <Stack spacing={1.5}>
                        {analysis.improvements.map((improvement, index) => (
                          <Accordion 
                            key={index}
                            elevation={0}
                            sx={{
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 2,
                              '&:before': { display: 'none' },
                              bgcolor: 'transparent'
                            }}
                          >
                            <AccordionSummary 
                              expandIcon={<ExpandMore />}
                              sx={{ py: 1.5 }}
                            >
                              <Box display="flex" alignItems="center" gap={1.5} width="100%">
                                <Box
                                  sx={{
                                    p: 0.5,
                                    borderRadius: 1,
                                    bgcolor: `${getPriorityColor(improvement.priority)}.main`,
                                    color: 'white'
                                  }}
                                >
                                  {getPriorityIcon(improvement.priority)}
                                </Box>
                                <Typography sx={{ flexGrow: 1, fontWeight: 600, fontSize: { xs: '0.875rem', md: '1rem' } }}>
                                  {improvement.section}
                                </Typography>
                                <Chip
                                  label={improvement.priority.toUpperCase()}
                                  size="small"
                                  color={getPriorityColor(improvement.priority)}
                                  sx={{ 
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    height: { xs: 24, md: 28 }
                                  }}
                                />
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                              <Typography variant="body2" color="text.secondary" mb={2} sx={{ lineHeight: 1.6 }}>
                                {improvement.suggestion}
                              </Typography>
                              <Button
                                size={isMobile ? "small" : "medium"}
                                variant="outlined"
                                startIcon={<AutoFixHigh />}
                                onClick={() => handleImproveSuggestion(improvement.suggestion, improvement.priority)}
                                disabled={isLoading}
                                sx={{ 
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600
                                }}
                              >
                                {isLoading ? 'Generating...' : 'Get AI Suggestions'}
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
                ref={(el) => setChatScrollElement(el)}
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  p: { xs: 1.5, md: 2 },
                  bgcolor: theme.palette.mode === 'dark' 
                    ? theme.palette.grey[900] 
                    : theme.palette.grey[50],
                  maxHeight: isMobile ? '300px' : '400px',
                  backgroundImage: theme.palette.mode === 'dark'
                    ? 'none'
                    : `radial-gradient(circle at 25px 25px, ${theme.palette.grey[200]} 2px, transparent 0), radial-gradient(circle at 75px 75px, ${theme.palette.grey[200]} 2px, transparent 0)`,
                  backgroundSize: '100px 100px',
                  scrollBehavior: 'smooth'
                }}
              >
                {chatHistory.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Box
                      sx={{
                        width: { xs: 60, md: 80 },
                        height: { xs: 60, md: 80 },
                        borderRadius: '50%',
                        bgcolor: theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: `0 8px 32px ${theme.palette.primary.main}20`
                      }}
                    >
                      <SmartToy sx={{ fontSize: { xs: 32, md: 40 }, color: 'white' }} />
                    </Box>
                    <Typography variant={isMobile ? "body1" : "h6"} color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
                      Hi! I'm your AI CV assistant 👋
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Ask me anything about improving your CV!
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Try: "How can I improve my professional summary?" or "What skills should I add?"
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {chatHistory.map((chat, index) => (
                      <Fade in={true} key={index} timeout={300 + index * 100}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: chat.type === 'user' ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-end',
                            gap: 1
                          }}
                        >
                          {chat.type === 'ai' && (
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                bgcolor: theme.palette.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <SmartToy sx={{ fontSize: 16, color: 'white' }} />
                            </Box>
                          )}
                          <Card
                            elevation={0}
                            sx={{
                              maxWidth: '85%',
                              bgcolor: chat.type === 'user' 
                                ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                                : theme.palette.mode === 'dark' 
                                  ? theme.palette.grey[800] 
                                  : 'white',
                              color: chat.type === 'user' ? 'white' : 'text.primary',
                              border: chat.type === 'ai' ? `1px solid ${theme.palette.divider}` : 'none',
                              borderRadius: chat.type === 'user' 
                                ? '18px 18px 4px 18px' 
                                : '18px 18px 18px 4px',
                              boxShadow: chat.type === 'user' 
                                ? `0 4px 12px ${theme.palette.primary.main}20`
                                : theme.palette.mode === 'dark'
                                  ? `0 2px 8px ${theme.palette.common.black}30`
                                  : '0 2px 8px rgba(0,0,0,0.08)'
                            }}
                          >
                            <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  whiteSpace: 'pre-wrap',
                                  fontSize: { xs: '0.875rem', md: '0.9rem' },
                                  lineHeight: 1.5
                                }}
                              >
                                {chat.message}
                              </Typography>
                              {chat.type === 'ai' && (
                                <IconButton
                                  size="small"
                                  onClick={() => navigator.clipboard.writeText(chat.message)}
                                  sx={{ 
                                    mt: 1, 
                                    color: 'inherit', 
                                    opacity: 0.6,
                                    '&:hover': { opacity: 1 },
                                    transition: 'opacity 0.2s'
                                  }}
                                >
                                  <ContentCopy fontSize="small" />
                                </IconButton>
                              )}
                            </CardContent>
                          </Card>
                          {chat.type === 'user' && (
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                bgcolor: theme.palette.grey[400],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <Person sx={{ fontSize: 16, color: 'white' }} />
                            </Box>
                          )}
                        </Box>
                      </Fade>
                    ))}
                    {isLoading && (
                      <Box display="flex" justifyContent="flex-start" alignItems="flex-end" gap={1}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <SmartToy sx={{ fontSize: 16, color: 'white' }} />
                        </Box>
                        <Card 
                          elevation={0}
                          sx={{ 
                            bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : 'white',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '18px 18px 18px 4px'
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CircularProgress size={16} />
                              <Typography variant="body2">AI is thinking...</Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    )}
                  </Stack>
                )}
              </Box>
              
              {/* Enhanced Chat Input */}
              <Box 
                display="flex" 
                gap={1.5}
                sx={{
                  p: { xs: 1.5, md: 2 },
                  bgcolor: theme.palette.mode === 'dark' 
                    ? theme.palette.grey[800] 
                    : theme.palette.background.paper,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(0,0,0,0.3)' 
                    : '0 4px 20px rgba(0,0,0,0.08)'
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Ask me anything about your CV..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  multiline
                  maxRows={isMobile ? 2 : 3}
                  size={isMobile ? "small" : "medium"}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlineInput-root': {
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.background.default,
                      '& fieldset': {
                        borderColor: 'transparent',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.light,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim() || isLoading}
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    minWidth: { xs: 44, md: 56 }, 
                    height: { xs: 44, md: 56 },
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: `0 4px 12px ${theme.palette.primary.main}30`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                      transform: 'scale(1.05)',
                    },
                    '&:disabled': {
                      background: theme.palette.action.disabledBackground,
                      transform: 'none'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                  ) : (
                    <Send sx={{ fontSize: { xs: 18, md: 20 } }} />
                  )}
                </Button>
              </Box>

              {/* Enhanced Quick Questions */}
              <Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  gutterBottom 
                  sx={{ fontWeight: 600, mb: 1.5 }}
                >
                  💡 Try asking:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {getSmartQuickQuestions(cvData).map((question, index) => (
                    <Chip
                      key={index}
                      label={question}
                      size="small"
                      variant="outlined"
                      onClick={() => setChatMessage(question)}
                      sx={{ 
                        cursor: 'pointer',
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                        height: { xs: 28, md: 32 },
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText,
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 8px ${theme.palette.primary.main}20`
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: { xs: 2, md: 3 },
          gap: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' 
            ? theme.palette.background.paper 
            : theme.palette.background.default,
          flexDirection: isMobile ? 'column' : 'row'
        }}
      >
        <Button 
          onClick={onClose}
          variant="outlined"
          fullWidth={isMobile}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Close Assistant
        </Button>
        {activeTab === 0 && (
          <Button 
            variant="contained" 
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
            fullWidth={isMobile}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
              }
            }}
          >
            Re-analyze CV
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CVAIAssistant;