import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Psychology,
  Lightbulb,
  Work,
  School,
  AttachMoney,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import SkillAssessmentCard from '../components/career/SkillAssessmentCard';
import { careerInsightService, CareerInsight, CareerRecommendations } from '../services/careerInsightService';

const CareerInsightsPage: React.FC = () => {
  const theme = useTheme();
  const [insights, setInsights] = useState<CareerInsight | null>(null);
  const [recommendations, setRecommendations] = useState<CareerRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const [insightsRes, recommendationsRes] = await Promise.all([
        careerInsightService.getCareerInsights(),
        careerInsightService.getCareerRecommendations(),
      ]);

      setInsights(insightsRes.data);
      setRecommendations(recommendationsRes.data);
    } catch (err) {
      setError('Failed to load career insights. Please try again.');
      console.error('Error loading career insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high': return theme.palette.success.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Career Insights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover your strengths, identify growth opportunities, and plan your career path
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Skills Assessment */}
          <Grid item xs={12} md={8}>
            {insights && (
              <SkillAssessmentCard
                skills={[
                  ...insights.skillsAssessment.technicalSkills,
                  ...insights.skillsAssessment.softSkills,
                ]}
                overallScore={insights.skillsAssessment.overallScore}
                onSkillUpdate={loadInsights}
              />
            )}
          </Grid>

          {/* Market Insights */}
          <Grid item xs={12} md={4}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              sx={{ borderRadius: 2 }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TrendingUp color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Market Insights
                  </Typography>
                </Box>

                {insights && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Salary Range
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {insights.marketInsights.salaryRange.currency} {' '}
                        {insights.marketInsights.salaryRange.min.toLocaleString()} - {' '}
                        {insights.marketInsights.salaryRange.max.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Market Demand
                      </Typography>
                      <Chip
                        label={insights.marketInsights.demandLevel.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: `${getDemandColor(insights.marketInsights.demandLevel)}20`,
                          color: getDemandColor(insights.marketInsights.demandLevel),
                          border: `1px solid ${getDemandColor(insights.marketInsights.demandLevel)}`,
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Growth Potential
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {insights.marketInsights.growthPotential.replace('_', ' ')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Job Recommendations */}
          <Grid item xs={12} md={6}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              sx={{ borderRadius: 2, height: 'fit-content' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Work color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Job Recommendations
                  </Typography>
                </Box>

                {recommendations?.jobRecommendations.length ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {recommendations.jobRecommendations.slice(0, 3).map((job, index) => (
                      <Box
                        key={job._id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.05)' 
                            : 'rgba(0,0,0,0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255,255,255,0.1)' 
                              : 'rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                          {job.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {job.company} • {job.location}
                        </Typography>
                        <Chip 
                          label={job.experienceLevel} 
                          size="small" 
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Complete your skills assessment to get personalized job recommendations
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Skill Gaps & Recommendations */}
          <Grid item xs={12} md={6}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              sx={{ borderRadius: 2, height: 'fit-content' }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Lightbulb color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Growth Recommendations
                  </Typography>
                </Box>

                {recommendations && (
                  <Box>
                    {recommendations.skillGaps.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Skills to Learn
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {recommendations.skillGaps.slice(0, 5).map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {recommendations.recommendations.skillsToImprove.length > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          Areas to Improve
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {recommendations.recommendations.skillsToImprove.slice(0, 4).map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              variant="outlined"
                              color="info"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Career Path */}
          <Grid item xs={12}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              sx={{ borderRadius: 2 }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <School color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Career Progression Path
                  </Typography>
                </Box>

                {insights?.careerPath.careerProgression.length ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {insights.careerPath.careerProgression.map((step, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {step.role}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Timeline: {step.timeline}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {step.requirements.map((req, reqIndex) => (
                              <Chip
                                key={reqIndex}
                                label={req}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    Complete your skills assessment to get a personalized career progression path
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default CareerInsightsPage;