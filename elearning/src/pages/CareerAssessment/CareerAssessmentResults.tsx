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
  Tooltip,
  AppBar,
  Toolbar
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
  AttachMoney as SalaryIcon,
  MenuBook as CourseIcon,
  Assignment as AssignmentIcon,
  Timeline as RoadmapIcon,
  AutoAwesome as AIIcon,
  Schedule
} from '@mui/icons-material';

import careerGuidanceService from '../../services/careerGuidanceService';

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
      title: string;
      company?: string;
      location?: string;
      matchPercentage: number;
      salaryRange?: string;
      requirements: string[];
      benefits?: string[];
    }>;
    personalizedRoadmap: {
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

const CareerAssessmentResults: React.FC = () => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6">Career Assessment Results</Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your career assessment results...
          </Typography>
        </Container>
      </>
    );
  }

  if (error || !results) {
    return (
      <>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6">Career Assessment Results</Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'No results found'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<BackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Container>
      </>
    );
  }

  const { assessmentInfo, results: assessmentResults } = results;

  return (
    <>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Career Assessment Results
          </Typography>
          <IconButton color="inherit">
            <DownloadIcon />
          </IconButton>
          <IconButton color="inherit">
            <ShareIcon />
          </IconButton>
          <IconButton color="inherit">
            <BookmarkIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Results Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Your Career Profile & Insights
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {assessmentInfo.title} - Completed on {new Date(assessmentInfo.completedAt).toLocaleDateString()}
          </Typography>
        </Box>

        {/* AI Insights Summary */}
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AIIcon sx={{ mr: 2, fontSize: 40 }} />
              <Typography variant="h4">AI-Powered Career Insights</Typography>
            </Box>
            <Typography variant="h6" sx={{ mb: 3, lineHeight: 1.6 }}>
              {assessmentResults.aiInsights.summary}
            </Typography>
            <Typography variant="h5" sx={{ fontStyle: 'italic', opacity: 0.9, textAlign: 'center', p: 2 }}>
              "{assessmentResults.aiInsights.motivationalMessage}"
            </Typography>
          </CardContent>
        </Card>

        {/* Key Recommendations */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <StarIcon sx={{ mr: 1, fontSize: 36 }} color="primary" />
              Key Recommendations for Your Success
            </Typography>
            <Grid container spacing={3}>
              {assessmentResults.aiInsights.keyRecommendations.map((recommendation, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined" sx={{ height: '100%', border: '2px solid', borderColor: 'primary.main' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                          {index + 1}
                        </Avatar>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {recommendation}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          <Grid item xs={12} lg={6}>
            {/* Personality Profile */}
            <Card sx={{ mb: 4, height: 'fit-content' }}>
              <CardContent>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PersonalityIcon sx={{ mr: 1, fontSize: 36 }} color="primary" />
                  Your Personality Profile
                </Typography>
                
                <Card variant="outlined" sx={{ mb: 3, bgcolor: 'primary.50' }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {assessmentResults.personalityProfile.primaryType}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Your Primary Personality Type
                    </Typography>
                  </CardContent>
                </Card>

                {/* Personality Traits */}
                <Typography variant="h5" sx={{ mt: 4, mb: 3 }}>
                  Personality Dimensions
                </Typography>
                {Object.entries(assessmentResults.personalityProfile.traits).map(([trait, value]) => (
                  <Box key={trait} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {trait}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: getTraitColor(value) }}>
                        {value}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={value}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getTraitColor(value),
                          borderRadius: 6
                        }
                      }}
                    />
                  </Box>
                ))}

                {/* Strengths */}
                <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                  Your Key Strengths
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {assessmentResults.personalityProfile.strengths.map((strength, index) => (
                    <Chip
                      key={index}
                      label={strength}
                      color="success"
                      variant="outlined"
                      sx={{ m: 0.5, fontSize: '0.9rem', height: 36 }}
                    />
                  ))}
                </Box>

                {/* Development Areas */}
                <Typography variant="h5" sx={{ mt: 3, mb: 2 }}>
                  Growth Opportunities
                </Typography>
                <Box>
                  {assessmentResults.personalityProfile.developmentAreas.map((area, index) => (
                    <Chip
                      key={index}
                      label={area}
                      color="warning"
                      variant="outlined"
                      sx={{ m: 0.5, fontSize: '0.9rem', height: 36 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Skills Analysis */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <GrowthIcon sx={{ mr: 1, fontSize: 36 }} color="primary" />
                  Skills Analysis
                </Typography>

                {/* Technical Skills */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandIcon />}>
                    <Typography variant="h5">Technical Skills</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {assessmentResults.skillsAnalysis.technicalSkills.map((skill, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">{skill.skill}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={skill.category}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Typography variant="h6" color="primary" fontWeight="bold">
                              {skill.proficiency}%
                            </Typography>
                          </Stack>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={skill.proficiency}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>

                {/* Soft Skills */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandIcon />}>
                    <Typography variant="h5">Soft Skills</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {assessmentResults.skillsAnalysis.softSkills.map((skill, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">{skill.skill}</Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                Importance:
                              </Typography>
                              <Rating
                                value={skill.importance / 20}
                                readOnly
                                size="small"
                              />
                            </Box>
                            <Typography variant="h6" color="primary" fontWeight="bold">
                              {skill.proficiency}%
                            </Typography>
                          </Stack>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={skill.proficiency}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>

                {/* Skill Gaps */}
                {assessmentResults.skillsAnalysis.skillGaps.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" gutterBottom>
                      Skills to Develop
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Focus on these areas to enhance your career prospects
                    </Alert>
                    {assessmentResults.skillsAnalysis.skillGaps.map((gap, index) => (
                      <Chip
                        key={index}
                        label={gap}
                        color="info"
                        variant="outlined"
                        sx={{ m: 0.5, fontSize: '0.9rem', height: 36 }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            {/* Career Recommendations */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CareerIcon sx={{ mr: 1, fontSize: 36 }} color="primary" />
                  Top Career Matches
                </Typography>
                {assessmentResults.careerRecommendations.slice(0, 4).map((career, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 3, border: '2px solid #f0f0f0' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h5" color="primary">
                          {career.careerPath}
                        </Typography>
                        <Chip
                          label={`${career.matchPercentage}% match`}
                          color={career.matchPercentage >= 80 ? 'success' : career.matchPercentage >= 60 ? 'warning' : 'default'}
                          sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                        />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ display: 'inline', mr: 2 }}>
                          <strong>Industry:</strong> {career.industry}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ display: 'inline' }}>
                          <strong>Growth:</strong> {career.growthOutlook}
                        </Typography>
                      </Box>
                      {career.averageSalary && (
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'success.main', fontWeight: 'bold' }}>
                          <SalaryIcon sx={{ mr: 0.5, fontSize: 20 }} />
                          Average Salary: {career.averageSalary}
                        </Typography>
                      )}
                      <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
                        Why this career fits you:
                      </Typography>
                      <List dense>
                        {career.reasons.map((reason, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <CheckIcon fontSize="small" color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary={reason}
                              primaryTypographyProps={{ variant: 'body1' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Required Skills:
                        </Typography>
                        {career.requiredSkills.slice(0, 6).map((skill, skillIndex) => (
                          <Chip
                            key={skillIndex}
                            label={skill}
                            size="small"
                            variant="outlined"
                            sx={{ m: 0.25 }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Learning Recommendations */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LearningIcon sx={{ mr: 1, fontSize: 36 }} color="primary" />
                  Recommended Learning Path
                </Typography>
                {assessmentResults.learningRecommendations.slice(0, 5).map((course, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1, pr: 2 }}>
                          {course.courseName}
                        </Typography>
                        <Chip
                          label={course.priority}
                          size="small"
                          color={getPriorityColor(course.priority) as any}
                          sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}
                        />
                      </Box>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Chip
                          icon={<CourseIcon />}
                          label={course.category}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<Schedule />}
                          label={course.estimatedDuration}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={course.provider}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Stack>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Skills to gain:</strong> {course.skillsToGain.join(', ')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" color="primary">
                        Explore Course
                      </Button>
                      <Button size="small" variant="outlined">
                        Add to Learning Plan
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Personalized Roadmap */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <RoadmapIcon sx={{ mr: 1, fontSize: 36 }} color="primary" />
              Your Personalized Career Roadmap
            </Typography>
            
            <Grid container spacing={4}>
              {[
                { period: 'shortTerm', title: 'Short Term Goals', subtitle: '0-6 months', color: '#4caf50', icon: '🎯' },
                { period: 'mediumTerm', title: 'Medium Term Goals', subtitle: '6-18 months', color: '#ff9800', icon: '📈' },
                { period: 'longTerm', title: 'Long Term Vision', subtitle: '18+ months', color: '#2196f3', icon: '🌟' }
              ].map(({ period, title, subtitle, color, icon }) => (
                <Grid item xs={12} md={4} key={period}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      height: '100%', 
                      border: `3px solid ${color}`,
                      borderRadius: 2
                    }}
                  >
                    <CardContent>
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography variant="h2" sx={{ mb: 1 }}>
                          {icon}
                        </Typography>
                        <Typography variant="h5" sx={{ color, fontWeight: 'bold' }}>
                          {title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {subtitle}
                        </Typography>
                      </Box>
                      {(assessmentResults.personalizedRoadmap[period as keyof typeof assessmentResults.personalizedRoadmap] || []).map((goal, index) => (
                        <Box key={index} sx={{ mb: 3 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                            {goal.goal}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            ⏱️ Timeline: {goal.timeline}
                          </Typography>
                          <List dense>
                            {goal.actions.map((action, actionIndex) => (
                              <ListItem key={actionIndex} sx={{ py: 0.25, pl: 0 }}>
                                <ListItemIcon sx={{ minWidth: 24 }}>
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

        {/* Next Steps */}
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <GrowthIcon sx={{ mr: 1, fontSize: 36 }} />
              Your Action Plan - Next Steps
            </Typography>
            <Grid container spacing={3}>
              {assessmentResults.aiInsights.nextSteps.map((step, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card sx={{ height: '100%', bgcolor: 'rgba(255,255,255,0.95)', color: 'text.primary' }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar 
                        sx={{ 
                          mx: 'auto', 
                          mb: 2, 
                          bgcolor: '#f5576c', 
                          width: 48, 
                          height: 48,
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.4 }}>
                        {step}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
          <CardActions sx={{ justifyContent: 'center', pb: 4 }}>
            <Button
              variant="contained"
              size="large"
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main', 
                px: 4, 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
              onClick={() => navigate('/dashboard')}
            >
              Continue Your Learning Journey
            </Button>
          </CardActions>
        </Card>
      </Container>
    </>
  );
};

export default CareerAssessmentResults;