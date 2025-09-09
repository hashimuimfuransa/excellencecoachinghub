import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Stack,
  Avatar,
  useTheme,
  alpha,
  Paper,
  Skeleton
} from '@mui/material';
import {
  Work,
  LocationOn,
  AttachMoney,
  Schedule,
  Business,
  ArrowForward,
  TrendingUp,
  Search,
  School,
  Psychology
} from '@mui/icons-material';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: string;
  experienceLevel: string;
  educationLevel: string;
  skills: string[];
  status: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  applicationDeadline?: string;
  employer: {
    _id: string;
    firstName: string;
    lastName: string;
    company?: string;
  };
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  isCurated: boolean;
}

const TrendingJobsSection: React.FC = () => {
  const theme = useTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingJobs = async () => {
      setLoading(true);
      try {
        // Use direct fetch for public endpoints to avoid auth headers
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/jobs?limit=6`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success && result.data) {
          // The API returns a paginated response, so result.data is an array
          const jobsData = Array.isArray(result.data) ? result.data : [];
          // Filter out any null or invalid job entries
          const validJobs = jobsData.filter((job: any) => job && job._id && job.title);
          setJobs(validJobs);
        } else {
          throw new Error('Failed to fetch jobs data');
        }
      } catch (error) {
        console.error('Error fetching trending jobs:', error);
        // Set empty array if API fails - this allows the section to still render
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingJobs();
  }, []);

  const handleViewMoreJobs = () => {
    window.open('https://exjobnet.com/jobs', '_blank');
  };

  const formatSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary || salary.min === undefined || salary.max === undefined || !salary.currency) return 'Competitive salary';
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.currency} ${salary.max.toLocaleString()}`;
  };

  const formatJobType = (jobType: string) => {
    return jobType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const isJobUrgent = (applicationDeadline?: string) => {
    if (!applicationDeadline) return false;
    const deadline = new Date(applicationDeadline);
    const now = new Date();
    const diffInDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 7 && diffInDays > 0;
  };

  return (
    <Box id="trending-jobs" sx={{ py: 8, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        {/* Section Header */}
        <Box textAlign="center" mb={6}>
          <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: '12px',
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TrendingUp sx={{ color: theme.palette.primary.main, fontSize: '28px' }} />
            </Box>
            <Typography variant="h3" component="h2" fontWeight="bold" color="primary.main">
              Trending Jobs
            </Typography>
          </Box>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}
          >
            Discover the most in-demand positions from top companies. These opportunities 
            are getting lots of applications - apply today!
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ gap: 2, mb: 1 }}>
            <Paper 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                bgcolor: alpha(theme.palette.success.main, 0.05),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 2
              }}
            >
              <Typography variant="body2" color="success.main" fontWeight="medium">
                🔥 Hot Jobs Updated Every Hour
              </Typography>
            </Paper>
            
            <Paper 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 2
              }}
            >
              <School sx={{ fontSize: 18, mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="body2" color="primary.main" fontWeight="medium">
                We also provide preparation coaching for jobs
              </Typography>
            </Paper>
          </Stack>
        </Box>

        {/* Jobs Grid */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
                    <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                    <Skeleton variant="text" height={24} sx={{ mb: 2 }} />
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Skeleton variant="rounded" width={60} height={24} />
                      <Skeleton variant="rounded" width={60} height={24} />
                      <Skeleton variant="rounded" width={60} height={24} />
                    </Stack>
                    <Skeleton variant="rectangular" height={36} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : jobs.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No trending jobs available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later for new opportunities
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {jobs.filter(job => job && job._id).slice(0, 6).map((job) => (
              <Grid item xs={12} md={4} key={job._id}>
                <Card 
                  sx={{ 
                    height: 500, // Fixed height for all cards
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    }
                  }}
                  onClick={handleViewMoreJobs}
                >
                  <CardContent sx={{ p: 3, pb: '24px !important', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Company Logo and Badges */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        }}
                      >
                        <Business sx={{ color: theme.palette.primary.main }} />
                      </Avatar>
                      <Stack direction="row" spacing={0.5}>
                        {isJobUrgent(job.applicationDeadline) && (
                          <Chip
                            label="Urgent"
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              color: theme.palette.error.main,
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                        {job.isCurated && (
                          <Chip
                            label="Curated"
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.main,
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </Stack>
                    </Box>

                    {/* Job Title and Company */}
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      gutterBottom
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '3rem' // Fixed height for consistency
                      }}
                    >
                      {job.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      gutterBottom
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minHeight: '1.5rem'
                      }}
                    >
                      {job.employer?.company || (job.employer ? `${job.employer.firstName} ${job.employer.lastName}` : 'Company Name Not Available')}
                    </Typography>

                    {/* Job Details */}
                    <Stack spacing={1} sx={{ mb: 2, minHeight: '5rem' }}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <LocationOn sx={{ fontSize: '16px', color: 'text.secondary' }} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}
                        >
                          {job.location}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <AttachMoney sx={{ fontSize: '16px', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatSalary(job.salary)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Schedule sx={{ fontSize: '16px', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatJobType(job.jobType)} • {getTimeAgo(job.createdAt)}
                        </Typography>
                      </Box>
                      {/* Add Deadline */}
                      {job.applicationDeadline && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Schedule 
                            sx={{ 
                              fontSize: '16px', 
                              color: isJobUrgent(job.applicationDeadline) ? 'error.main' : 'text.secondary'
                            }} 
                          />
                          <Typography 
                            variant="body2" 
                            color={isJobUrgent(job.applicationDeadline) ? 'error.main' : 'text.secondary'}
                            fontWeight={isJobUrgent(job.applicationDeadline) ? 600 : 'normal'}
                          >
                            Deadline: {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Not specified'}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {/* Skills */}
                    <Stack 
                      direction="row" 
                      spacing={0.5} 
                      flexWrap="wrap" 
                      sx={{ 
                        gap: 0.5, 
                        mb: 2, 
                        minHeight: '2rem', 
                        maxHeight: '4rem', 
                        overflow: 'hidden' 
                      }}
                    >
                      {(job.skills || []).slice(0, 3).map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.7rem',
                            height: '24px',
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderColor: alpha(theme.palette.primary.main, 0.2),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        />
                      ))}
                      {(job.skills || []).length > 3 && (
                        <Chip
                          label={`+${(job.skills || []).length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.7rem',
                            height: '24px',
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderColor: alpha(theme.palette.primary.main, 0.2),
                          }}
                        />
                      )}
                    </Stack>

                    {/* Spacer to push button to bottom */}
                    <Box sx={{ flexGrow: 1 }} />

                    {/* View Details Button */}
                    <Button
                      variant="outlined"
                      fullWidth
                      endIcon={<ArrowForward />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMoreJobs();
                      }}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                        py: 1,
                        borderWidth: 1,
                        '&:hover': {
                          borderWidth: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.05)
                        }
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* View All Jobs Button */}
        <Box textAlign="center" mt={6}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Search />}
            onClick={handleViewMoreJobs}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}
          >
            Find More Jobs
          </Button>
        </Box>

        {/* Bottom CTA */}
        <Box 
          sx={{ 
            mt: 6,
            p: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
            Ready to Land Your Dream Job?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Join thousands of job seekers who found their perfect match through our platform. 
            Get personalized preparation coaching to increase your chances of success!
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.open('https://exjobnet.com/jobs', '_blank')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5
              }}
            >
              Start Your Job Search
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Psychology />}
              onClick={() => window.open('https://exjobnet.com/Register', '_blank')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5
              }}
            >
              Get Job Preparation Coaching
            </Button>
          </Stack>
          
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              💡 Our preparation coaching includes mock interviews, skill assessments, and personalized learning paths
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default TrendingJobsSection;