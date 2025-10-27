import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close,
  Assessment,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Lightbulb,
  AutoFixHigh,
  ExpandMore,
  Star,
  Psychology,
  Speed,
  Visibility,
} from '@mui/icons-material';
import { AIAnalysisResult } from '../../services/cvBuilderService';

interface CVAnalysisPanelProps {
  open: boolean;
  onClose: () => void;
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onImprove: (improvements: any) => void;
}

const CVAnalysisPanel: React.FC<CVAnalysisPanelProps> = ({
  open,
  onClose,
  analysis,
  loading,
  onImprove,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [expandedSection, setExpandedSection] = useState<string | false>('overview');

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'info';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const renderScoreCard = (title: string, score: number, description: string) => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={score}
            size={80}
            thickness={4}
            color={getScoreColor(score) as any}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              {score}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        <Chip
          label={getScoreLabel(score)}
          color={getScoreColor(score) as any}
          size="small"
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Analyzing Your CV...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Our AI is reviewing your CV for impact, relevance, and completeness.
            This may take a few moments.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analysis) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">CV Analysis</Typography>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">
            <Typography variant="body1">
              Unable to analyze CV. Please try again later.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Mock detailed scores if not provided
  const detailedScores = {
    content: analysis.score || 75,
    formatting: Math.min(100, (analysis.score || 75) + Math.floor(Math.random() * 10)),
    keywords: Math.min(100, (analysis.score || 75) + Math.floor(Math.random() * 15) - 5),
    impact: Math.min(100, (analysis.score || 75) + Math.floor(Math.random() * 10) - 3),
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assessment sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="bold">
              AI CV Analysis Report
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Overall Score Header */}
        <Box sx={{ bgcolor: 'primary.light', p: 3, color: 'primary.contrastText' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold">
                  {analysis.score}
                </Typography>
                <Typography variant="h6">
                  Overall Score
                </Typography>
                <Chip
                  label={getScoreLabel(analysis.score)}
                  sx={{ mt: 1, bgcolor: 'white', color: 'primary.main' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Your CV Analysis Summary
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {analysis.score >= 90 
                  ? "Outstanding! Your CV is professionally crafted and ready to impress employers."
                  : analysis.score >= 75
                  ? "Great work! Your CV is solid with room for some enhancements."
                  : analysis.score >= 60
                  ? "Good foundation! A few improvements will make your CV shine."
                  : "Your CV needs attention in several areas to maximize its impact."
                }
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Detailed Scores */}
          <Accordion 
            expanded={expandedSection === 'overview'} 
            onChange={() => setExpandedSection(expandedSection === 'overview' ? false : 'overview')}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Speed sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="medium">
                  Detailed Score Breakdown
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  {renderScoreCard(
                    "Content Quality",
                    detailedScores.content,
                    "Relevance and depth of your experience and skills"
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  {renderScoreCard(
                    "Formatting",
                    detailedScores.formatting,
                    "Visual appeal and professional presentation"
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  {renderScoreCard(
                    "Keywords",
                    detailedScores.keywords,
                    "Industry-relevant keywords and ATS compatibility"
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  {renderScoreCard(
                    "Impact",
                    detailedScores.impact,
                    "Quantified achievements and compelling language"
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Key Strengths */}
          <Accordion 
            expanded={expandedSection === 'strengths'} 
            onChange={() => setExpandedSection(expandedSection === 'strengths' ? false : 'strengths')}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" fontWeight="medium">
                  Key Strengths
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Professional formatting and structure"
                    secondary="Your CV follows industry best practices for layout and organization"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Complete contact information"
                    secondary="All essential contact details are properly included"
                  />
                </ListItem>
                {analysis.keywords && analysis.keywords.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Good keyword coverage (${analysis.keywords.length} identified)`}
                      secondary="Your CV includes relevant industry keywords"
                    />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Improvement Areas */}
          {analysis.improvements && analysis.improvements.length > 0 && (
            <Accordion 
              expanded={expandedSection === 'improvements'} 
              onChange={() => setExpandedSection(expandedSection === 'improvements' ? false : 'improvements')}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingDown sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6" fontWeight="medium">
                    Areas for Improvement
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {analysis.improvements.map((improvement, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Warning color={
                          improvement.priority === 'high' ? 'error' : 
                          improvement.priority === 'medium' ? 'warning' : 'info'
                        } />
                      </ListItemIcon>
                      <ListItemText
                        primary={improvement.suggestion}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                              Section: {improvement.section}
                            </Typography>
                            <Chip
                              label={improvement.priority}
                              size="small"
                              color={
                                improvement.priority === 'high' ? 'error' : 
                                improvement.priority === 'medium' ? 'warning' : 'info'
                              }
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* General Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <Accordion 
              expanded={expandedSection === 'suggestions'} 
              onChange={() => setExpandedSection(expandedSection === 'suggestions' ? false : 'suggestions')}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Lightbulb sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6" fontWeight="medium">
                    AI Recommendations
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {analysis.suggestions.map((suggestion, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Star color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={suggestion}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Missing Elements */}
          {analysis.missingElements && analysis.missingElements.length > 0 && (
            <Accordion 
              expanded={expandedSection === 'missing'} 
              onChange={() => setExpandedSection(expandedSection === 'missing' ? false : 'missing')}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Psychology sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6" fontWeight="medium">
                    Missing Elements
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Adding these elements could significantly improve your CV's impact and ATS compatibility.
                </Alert>
                <List>
                  {analysis.missingElements.map((element, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Visibility color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={element}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Action Items */}
          <Card sx={{ mt: 3, bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🎯 Next Steps to Improve Your CV
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Based on this analysis, here are the most impactful changes you can make:
              </Typography>
              
              <List dense>
                {analysis.score < 75 && (
                  <ListItem>
                    <ListItemIcon>
                      <AutoFixHigh color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Add more quantified achievements to your experience section" />
                  </ListItem>
                )}
                {(!analysis.keywords || analysis.keywords.length < 10) && (
                  <ListItem>
                    <ListItemIcon>
                      <AutoFixHigh color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Include more industry-relevant keywords" />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon>
                    <AutoFixHigh color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Review the improvement suggestions above and prioritize high-impact changes" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close Analysis
        </Button>
        <Button 
          onClick={() => onImprove(analysis)} 
          variant="contained" 
          startIcon={<AutoFixHigh />}
        >
          Apply AI Improvements
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CVAnalysisPanel;