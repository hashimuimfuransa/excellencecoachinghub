import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Collapse,
  useTheme,
  Fade,
} from '@mui/material';
import {
  SmartToy,
  Close,
  Lightbulb,
  TrendingUp,
  AutoFixHigh,
  Send,
  ExpandMore,
  ExpandLess,
  Psychology,
  CheckCircle,
  Star,
  Help,
} from '@mui/icons-material';
import { CVData } from '../../services/cvBuilderService';
import cvBuilderService from '../../services/cvBuilderService';

interface AIGuidancePanelProps {
  currentStep: number;
  stepInfo: {
    label: string;
    description: string;
    aiTips: string[];
    estimatedTime: string;
  };
  cvData: CVData;
  onClose: () => void;
  onAIAction: (action: string, data: any) => void;
}

const AIGuidancePanel: React.FC<AIGuidancePanelProps> = ({
  currentStep,
  stepInfo,
  cvData,
  onClose,
  onAIAction,
}) => {
  const theme = useTheme();
  
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
  }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // Initialize with step-specific guidance
  useEffect(() => {
    const initialGuidance = getStepGuidance(currentStep);
    if (initialGuidance) {
      setChatHistory([{
        type: 'ai',
        message: initialGuidance,
        timestamp: new Date(),
      }]);
    }
  }, [currentStep]);

  const getStepGuidance = (step: number): string => {
    const guidanceMap = {
      0: `👋 Hi! I'm your AI CV assistant. Let's start building your professional CV!

For the Personal Information section, I recommend:
• Use a professional email address (firstname.lastname@domain.com)
• Include your phone number with country code
• Write a compelling professional summary (2-3 sentences)
• Add your LinkedIn profile if you have one

Would you like me to help generate a professional summary based on your experience?`,
      
      1: `Great! Now let's work on your Experience section - this is often the most important part of your CV.

Here's how to make it stand out:
• Start each bullet point with an action verb (managed, developed, increased)
• Include specific numbers and metrics wherever possible
• Focus on achievements, not just responsibilities
• Show career progression and growth

Need help writing compelling achievement statements? I can generate some based on your role and company!`,

      2: `Time to add your Education! Even if you're experienced, education shows your foundation.

Best practices:
• List in reverse chronological order (most recent first)
• Include GPA if it's 3.5+ or you're a recent graduate
• Add relevant coursework for your target role
• Include academic honors and activities

I can help you determine what education details to highlight for your target industry.`,

      3: `Skills are crucial for getting past ATS systems and catching recruiters' attention.

Pro tips:
• Include 6-12 relevant skills
• Mix technical and soft skills
• Be honest about your proficiency levels
• Include trending skills in your industry

Want me to suggest skills that are in-demand for your target role? Just tell me what position you're targeting!`,

      4: `Template selection can make or break your CV's impact!

Consider these factors:
• Industry norms (creative vs. conservative)
• ATS compatibility
• Your personal brand
• Role seniority level

I can recommend the best template based on your industry and role. What type of position are you targeting?`,

      5: `Final review time! Let's make sure your CV is perfect before export.

I'll analyze:
✓ Content quality and impact
✓ ATS compatibility 
✓ Industry alignment
✓ Missing opportunities

Ready for a comprehensive AI analysis of your CV?`,
    };

    return guidanceMap[step] || 'I\'m here to help you build an amazing CV! Ask me anything.';
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to chat
    setChatHistory(prev => [...prev, {
      type: 'user',
      message: userMessage,
      timestamp: new Date(),
    }]);

    setIsGenerating(true);

    try {
      // Generate context-aware response
      const context = `
Current Step: ${stepInfo.label}
CV Data Summary: 
- Name: ${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}
- Experience Count: ${cvData.experiences.length}
- Education Count: ${cvData.education.length}
- Skills Count: ${cvData.skills.length}
- Has Professional Summary: ${!!cvData.personalInfo.professionalSummary}

User Question: ${userMessage}

Please provide helpful, specific advice for building their CV. Be conversational and encouraging.`;

      const aiResponse = await cvBuilderService.generateAIContent(context, 'guidance');
      
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: aiResponse,
        timestamp: new Date(),
      }]);

    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: 'I apologize, but I\'m having trouble right now. Please try again in a moment, or feel free to proceed with the section using the tips provided!',
        timestamp: new Date(),
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setIsGenerating(true);
    
    try {
      let result;
      switch (action) {
        case 'generate-summary':
          if (cvData.personalInfo.firstName && cvData.personalInfo.lastName) {
            result = await cvBuilderService.generateProfessionalSummary(cvData);
            onAIAction('update-summary', result);
            setChatHistory(prev => [...prev, {
              type: 'ai',
              message: `✨ I've generated a professional summary for you! You can find it in the Personal Information section. Feel free to customize it to match your style.`,
              timestamp: new Date(),
            }]);
          } else {
            setChatHistory(prev => [...prev, {
              type: 'ai',
              message: 'Please add your name first, then I can generate a personalized professional summary for you!',
              timestamp: new Date(),
            }]);
          }
          break;

        case 'analyze-cv':
          result = await cvBuilderService.analyzeCV(cvData);
          setChatHistory(prev => [...prev, {
            type: 'ai',
            message: `📊 I've analyzed your CV! Overall score: ${result.score}/100. Here are the key areas to improve: ${result.suggestions.slice(0, 3).join(', ')}. Check the full analysis for detailed recommendations.`,
            timestamp: new Date(),
          }]);
          onAIAction('show-analysis', result);
          break;

        case 'suggest-skills':
          const jobTitle = cvData.experiences[0]?.jobTitle || '';
          if (jobTitle) {
            result = await cvBuilderService.getKeywordSuggestions('Technology', jobTitle);
            setChatHistory(prev => [...prev, {
              type: 'ai',
              message: `💡 Based on your role as ${jobTitle}, here are some in-demand skills you might want to add: ${result.slice(0, 8).join(', ')}. Select the ones that match your experience!`,
              timestamp: new Date(),
            }]);
            onAIAction('suggest-skills', result);
          } else {
            setChatHistory(prev => [...prev, {
              type: 'ai',
              message: 'Please add your current or target job title in the Experience section, then I can suggest relevant skills for you!',
              timestamp: new Date(),
            }]);
          }
          break;
      }
    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: 'I encountered an issue while processing your request. Please try again!',
        timestamp: new Date(),
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const getQuickActions = () => {
    const actions = [];
    
    if (currentStep === 0 && cvData.personalInfo.firstName && !cvData.personalInfo.professionalSummary) {
      actions.push({ id: 'generate-summary', label: 'Generate Professional Summary', icon: <AutoFixHigh /> });
    }
    
    if (currentStep === 3 && cvData.skills.length < 6) {
      actions.push({ id: 'suggest-skills', label: 'Suggest Skills', icon: <Star /> });
    }
    
    if (currentStep >= 3) {
      actions.push({ id: 'analyze-cv', label: 'Analyze My CV', icon: <Psychology /> });
    }
    
    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <Card sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToy sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              AI Assistant
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary">
          {stepInfo.label} • Est. {stepInfo.estimatedTime}
        </Typography>
      </CardContent>

      {/* Step Tips */}
      <CardContent sx={{ p: 0, flexShrink: 0 }}>
        <Button
          fullWidth
          onClick={() => setShowTips(!showTips)}
          endIcon={showTips ? <ExpandLess /> : <ExpandMore />}
          sx={{ justifyContent: 'space-between', p: 2, borderRadius: 0 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Lightbulb sx={{ mr: 1 }} />
            <Typography variant="subtitle2">Step Tips</Typography>
          </Box>
        </Button>
        
        <Collapse in={showTips}>
          <Box sx={{ p: 2, pt: 0 }}>
            <List dense>
              {stepInfo.aiTips.map((tip, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" sx={{ fontSize: 16 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {tip}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
      </CardContent>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <CardContent sx={{ p: 2, flexShrink: 0 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outlined"
                size="small"
                fullWidth
                startIcon={action.icon}
                onClick={() => handleQuickAction(action.id)}
                disabled={isGenerating}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </CardContent>
      )}

      <Divider />

      {/* Chat Interface */}
      <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Button
          fullWidth
          onClick={() => setShowChat(!showChat)}
          endIcon={showChat ? <ExpandLess /> : <ExpandMore />}
          sx={{ justifyContent: 'space-between', p: 2, borderRadius: 0 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToy sx={{ mr: 1 }} />
            <Typography variant="subtitle2">AI Chat</Typography>
          </Box>
        </Button>

        <Collapse in={showChat} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, pt: 0 }}>
            {chatHistory.map((message, index) => (
              <Fade in={true} key={index} timeout={300}>
                <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '85%',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: message.type === 'user' ? 'primary.main' : 'grey.100',
                      color: message.type === 'user' ? 'white' : 'text.primary',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        display: 'block',
                        mt: 0.5,
                        textAlign: message.type === 'user' ? 'right' : 'left',
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            ))}
            
            {isGenerating && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  AI is thinking...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Chat Input */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask me anything about building your CV..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                multiline
                maxRows={3}
                disabled={isGenerating}
              />
              <IconButton
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isGenerating}
                color="primary"
              >
                {isGenerating ? <CircularProgress size={20} /> : <Send />}
              </IconButton>
            </Box>
          </Box>
        </Collapse>
      </CardContent>

      {/* Help Footer */}
      <CardContent sx={{ p: 2, pt: 1, flexShrink: 0 }}>
        <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
          <Typography variant="caption">
            💡 I'm here to help you create a professional CV that stands out. Ask me questions, request content generation, or get personalized tips!
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default AIGuidancePanel;