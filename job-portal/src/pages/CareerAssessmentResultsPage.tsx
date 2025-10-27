import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  IconButton,
  Rating,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Psychology as PersonalityIcon,
  TrendingUp as GrowthIcon,
  Work as CareerIcon,
  School as LearningIcon,
  EmojiEvents as SuccessIcon,
  Lightbulb as InsightIcon,
  ExpandMore as ExpandIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  AttachMoney as SalaryIcon
} from '@mui/icons-material';

import careerGuidanceService from '../services/careerGuidanceService';

interface CareerAssessmentResults {
  assessmentInfo: {
    id: string;
    title: string;
    type: string;
    completedAt: Date;
  };
  results: {
    personalityProfile: {
      primaryType: string;
      traits: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
      };
      strengths: string[];
      developmentAreas: string[];
    };
    skillsAnalysis: {
      technicalSkills: Array<{
        skill: string;
        proficiency: number;
        category: string;
      }>;
      softSkills: Array<{
        skill: string;
        proficiency: number;
        importance: number;
      }>;
      skillGaps: string[];
    };
    jobReadinessScore: number;
    careerRecommendations: Array<{
      careerPath: string;
      matchPercentage: number;
      reasons: string[];
      requiredSkills: string[];
      averageSalary?: string;
      growthOutlook: string;
      industry: string;
    }>;
    learningRecommendations: Array<{
      courseName: string;
      provider: string;
      priority: 'high' | 'medium' | 'low';
      estimatedDuration: string;
      skillsToGain: string[];
      category: string;
    }>;
    jobMatches: Array<{
      jobTitle: string;
      company: string;
      matchPercentage: number;
      missingSkills: string[];
      readinessScore: number;
    }>;
    personalizedRoadmap?: {
      shortTerm: Array<{
        goal: string;
        timeline: string;
        actions: string[];
      }>;
      mediumTerm: Array<{
        goal: string;
        timeline: string;
        actions: string[];
      }>;
      longTerm: Array<{
        goal: string;
        timeline: string;
        actions: string[];
      }>;
    };
    aiInsights: {
      summary: string;
      keyRecommendations: string[];
      motivationalMessage: string;
      nextSteps: string[];
    };
    completedAt: Date;
  };
}

const CareerAssessmentResultsPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const [results, setResults] = useState<CareerAssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assessmentId) {
      loadResults();
    }
  }, [assessmentId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await careerGuidanceService.getAssessmentResults(assessmentId!);
      setResults(data);
    } catch (error) {
      console.error('Error loading assessment results:', error);
      setError('Failed to load assessment results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTraitColor = (value: number) => {
    if (value >= 80) return '#4caf50';
    if (value >= 60) return '#ff9800';
    return '#f44336';
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your career assessment results...
        </Typography>
      </Container>
    );
  }

  if (error || !results) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'No results found'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate('/app/career-guidance')}
        >
          Back to Career Guidance
        </Button>
      </Container>
    );
  }

  const { assessmentInfo, results: assessmentResults } = results;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/app/career-guidance')}
          sx={{ mb: 2 }}
        >
          Back to Career Guidance
        </Button>
        <Typography variant="h3" component="h1" gutterBottom>
          Your Career Assessment Results
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {assessmentInfo.title} - Completed on {new Date(assessmentInfo.completedAt).toLocaleDateString()}
        </Typography>
        
        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Download Report
          </Button>
          <Button variant="outlined" startIcon={<ShareIcon />}>
            Share Results
          </Button>
          <Button variant="outlined" startIcon={<BookmarkIcon />}>
            Save for Later
          </Button>
        </Stack>
      </Box>

      {/* AI Insights Summary */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InsightIcon sx={{ mr: 2, fontSize: 40 }} />
            <Typography variant="h5">AI-Powered Insights</Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem' }}>
            {assessmentResults.aiInsights.summary}
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic', opacity: 0.9 }}>
            "{assessmentResults.aiInsights.motivationalMessage}"
          </Typography>
        </CardContent>
      </Card>

      {/* Key Recommendations */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <StarIcon sx={{ mr: 1 }} color="primary" />
            Key Recommendations
          </Typography>
          <Grid container spacing={2}>
            {assessmentResults.aiInsights.keyRecommendations.map((recommendation, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body1">
                      {recommendation}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          {/* Personality Profile */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonalityIcon sx={{ mr: 1 }} color="primary" />
                Personality Profile
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                Primary Type: {assessmentResults.personalityProfile.primaryType}
              </Typography>
              
              {/* Personality Traits */}
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
                Personality Traits
              </Typography>
              {Object.entries(assessmentResults.personalityProfile.traits).map(([trait, value]) => (
                <Box key={trait} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {trait}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {value}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={value}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getTraitColor(value),
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
              ))}

              {/* Strengths */}
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Your Strengths
              </Typography>
              <Box sx={{ mb: 2 }}>
                {assessmentResults.personalityProfile.strengths.map((strength, index) => (
                  <Chip
                    key={index}
                    label={strength}
                    color="success"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>

              {/* Development Areas */}
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Development Areas
              </Typography>
              <Box>
                {assessmentResults.personalityProfile.developmentAreas.map((area, index) => (
                  <Chip
                    key={index}
                    label={area}
                    color="warning"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Skills Analysis */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <GrowthIcon sx={{ mr: 1 }} color="primary" />
                Skills Analysis
              </Typography>

              {/* Technical Skills */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Typography variant="h6">Technical Skills</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {assessmentResults.skillsAnalysis.technicalSkills.map((skill, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{skill.skill}</Typography>
                        <Typography variant="body2" color="primary">
                          {skill.category}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={skill.proficiency}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {skill.proficiency}% proficiency
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>

              {/* Soft Skills */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Typography variant="h6">Soft Skills</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {assessmentResults.skillsAnalysis.softSkills.map((skill, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{skill.skill}</Typography>
                        <Rating
                          value={skill.importance / 20}
                          readOnly
                          size="small"
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={skill.proficiency}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {skill.proficiency}% proficiency
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>

              {/* Skill Gaps */}
              {assessmentResults.skillsAnalysis.skillGaps.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Areas for Development
                  </Typography>
                  {assessmentResults.skillsAnalysis.skillGaps.map((gap, index) => (
                    <Chip
                      key={index}
                      label={gap}
                      color="info"
                      variant="outlined"
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Career Recommendations */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CareerIcon sx={{ mr: 1 }} color="primary" />
                Career Recommendations
              </Typography>
              {assessmentResults.careerRecommendations.slice(0, 3).map((career, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6">{career.careerPath}</Typography>
                      <Chip
                        label={`${career.matchPercentage}% match`}
                        color={career.matchPercentage >= 80 ? 'success' : career.matchPercentage >= 60 ? 'warning' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {career.industry} • {career.growthOutlook}
                    </Typography>
                    {career.averageSalary && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SalaryIcon sx={{ mr: 0.5, fontSize: 16 }} />
                        {career.averageSalary}
                      </Typography>
                    )}
                    <Typography variant="body2" gutterBottom>
                      <strong>Why it matches:</strong>
                    </Typography>
                    <List dense>
                      {career.reasons.slice(0, 3).map((reason, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 20 }}>
                            <CheckIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={reason}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Learning Recommendations */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <LearningIcon sx={{ mr: 1 }} color="primary" />
                Learning Recommendations
              </Typography>
              {assessmentResults.learningRecommendations.slice(0, 4).map((course, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6">{course.courseName}</Typography>
                      <Chip
                        label={course.priority}
                        size="small"
                        color={course.priority === 'high' ? 'error' : course.priority === 'medium' ? 'warning' : 'default'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {course.category} • {course.estimatedDuration} • {course.provider}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Skills to gain:</strong> {course.skillsToGain.join(', ')}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Personalized Roadmap */}
      {assessmentResults.personalizedRoadmap && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <SuccessIcon sx={{ mr: 1 }} color="primary" />
              Your Personalized Career Roadmap
            </Typography>
            
            <Grid container spacing={4}>
              {[
                { period: 'shortTerm', title: 'Short Term (0-6 months)', color: '#4caf50' },
                { period: 'mediumTerm', title: 'Medium Term (6-18 months)', color: '#ff9800' },
                { period: 'longTerm', title: 'Long Term (18+ months)', color: '#2196f3' }
              ].map(({ period, title, color }) => (
                <Grid item xs={12} md={4} key={period}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color }}>
                        {title}
                      </Typography>
                      {(assessmentResults.personalizedRoadmap![period as keyof typeof assessmentResults.personalizedRoadmap] || []).map((goal, index) => (
                        <Box key={index} sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {goal.goal}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Timeline: {goal.timeline}
                          </Typography>
                          <List dense>
                            {goal.actions.map((action, actionIndex) => (
                              <ListItem key={actionIndex} sx={{ py: 0.25, pl: 0 }}>
                                <ListItemIcon sx={{ minWidth: 20 }}>
                                  <CheckIcon fontSize="small" sx={{ color }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={action}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <GrowthIcon sx={{ mr: 1 }} color="primary" />
            Your Next Steps
          </Typography>
          <Grid container spacing={2}>
            {assessmentResults.aiInsights.nextSteps.map((step, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                      {index + 1}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {step}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/app/career-guidance')}
          >
            Explore More Career Tools
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};

export default CareerAssessmentResultsPage;