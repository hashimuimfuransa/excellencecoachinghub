import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  useTheme,
  TextField,
  InputAdornment,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Autocomplete,
  Stack,
  Tabs,
  Tab
} from '@mui/material';
import {
  School,
  Work,
  Timer,
  QuestionAnswer,
  Assessment,
  TrendingUp,
  CheckCircle,
  Build,
  PlayArrow,
  Refresh,
  Info,
  Psychology,
  Speed,
  Search,
  FilterList,
  LocationOn,
  Business,
  Star,
  Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/jobService';
import { smartTestService } from '../services/smartTestService';

interface Job {
  _id: string;
  title: string;
  company: string;
  industry?: string;
  location: string;
  experienceLevel: string;
  skills: string[];
  description: string;
}

interface SmartTest {
  _id: string;
  testId: string;
  title: string;
  description: string;
  jobId: string;
  jobTitle: string;
  company: string;
  questionCount: number;
  timeLimit: number;
  difficulty: string;
  skillsRequired: string[];
  createdAt: string;
  isAdminUploaded?: boolean;
  uploadedBy?: string;
}

interface AdminSmartTest {
  _id: string;
  testId: string;
  title: string;
  description: string;
  jobTitle: string;
  company: string;
  industry: string;
  questionCount: number;
  timeLimit: number;
  difficulty: string;
  skillsRequired: string[];
  createdAt: string;
  uploadedBy: string;
  isActive: boolean;
}

const SmartTestPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSmartTests, setUserSmartTests] = useState<SmartTest[]>([]);
  const [adminSmartTests, setAdminSmartTests] = useState<AdminSmartTest[]>([]);
  const [tabValue, setTabValue] = useState(0);
  
  // Job filtering state
  const [jobSearch, setJobSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('');
  
  // Dialog state
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [showStartTestDialog, setShowStartTestDialog] = useState(false);
  const [generatedTestId, setGeneratedTestId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
    fetchUserSmartTests();
    fetchAdminSmartTests();
  }, []);

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = [...jobs];

    // Search filter
    if (jobSearch) {
      const searchLower = jobSearch.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Industry filter
    if (industryFilter) {
      filtered = filtered.filter(job =>
        job.industry?.toLowerCase().includes(industryFilter.toLowerCase())
      );
    }

    // Experience level filter
    if (experienceLevelFilter) {
      filtered = filtered.filter(job =>
        job.experienceLevel.toLowerCase() === experienceLevelFilter.toLowerCase()
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, jobSearch, locationFilter, industryFilter, experienceLevelFilter]);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await jobService.getJobsForStudent(1, 100); // Fetch more jobs for better filtering
      setJobs(response.data);
      setFilteredJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  // Get unique values for filter options
  const getUniqueLocations = () => {
    return Array.from(new Set(jobs.map(job => job.location).filter(Boolean)));
  };

  const getUniqueIndustries = () => {
    return Array.from(new Set(jobs.map(job => job.industry).filter(Boolean)));
  };

  const getUniqueExperienceLevels = () => {
    return Array.from(new Set(jobs.map(job => job.experienceLevel).filter(Boolean)));
  };

  const clearFilters = () => {
    setJobSearch('');
    setLocationFilter('');
    setIndustryFilter('');
    setExperienceLevelFilter('');
    setSelectedJob(null);
  };

  const fetchUserSmartTests = async () => {
    try {
      const tests = await smartTestService.getUserSmartTests();
      setUserSmartTests(tests);
    } catch (error) {
      console.error('Error fetching smart tests:', error);
    }
  };

  const fetchAdminSmartTests = async () => {
    try {
      const tests = await smartTestService.getAdminSmartTests();
      setAdminSmartTests(tests);
    } catch (error) {
      console.error('Error fetching admin smart tests:', error);
      // Don't show error for admin tests if endpoint doesn't exist yet
    }
  };

  const handleGenerateTest = async () => {
    if (!selectedJob) {
      setError('Please select a job first');
      return;
    }

    try {
      setGeneratingTest(true);
      setError(null);

      const testData = {
        jobId: selectedJob._id,
        difficulty: 'intermediate' as 'basic' | 'intermediate' | 'advanced',
        questionCount
      };

      console.log('Generating smart test with data:', testData);
      
      const result = await smartTestService.generateSmartTest(testData);
      console.log('Smart test generated:', result);

      // Refresh user tests
      await fetchUserSmartTests();

      // Close dialog and show success
      setShowGenerateDialog(false);
      clearFilters();
      
      // Show success message and option to start test immediately
      setGeneratedTestId(result.testId);
      setShowStartTestDialog(true);

    } catch (error: any) {
      console.error('Error generating test:', error);
      setError(error.response?.data?.error || 'Failed to generate test');
    } finally {
      setGeneratingTest(false);
    }
  };

  const startTest = async (testId: string) => {
    try {
      setLoading(true);
      const session = await smartTestService.startSmartTest(testId);
      
      // Navigate to test taking page
      navigate('/take-smart-test', {
        state: {
          sessionId: session.sessionId,
          test: session.test
        }
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGeneratedTest = async () => {
    if (generatedTestId) {
      setShowStartTestDialog(false);
      await startTest(generatedTestId);
    }
  };

  const handleViewTestsLater = () => {
    setShowStartTestDialog(false);
    setGeneratedTestId(null);
    // Tests are already refreshed, so user will see the new test in the list
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'basic': return theme.palette.success.main;
      case 'intermediate': return theme.palette.warning.main;
      case 'advanced': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getDifficultyIcon = (level: string) => {
    switch (level) {
      case 'basic': return <School />;
      case 'intermediate': return <Work />;
      case 'advanced': return <Psychology />;
      default: return <Assessment />;
    }
  };



  if (loadingJobs) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Smart Job Preparation Tests
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Generate AI-powered tests tailored to specific job positions to prepare for real interviews and assessments
        </Typography>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Smart Tests are different from Psychometric Tests:</strong> These tests focus on job-specific knowledge, 
            technical skills, and practical scenarios you'll encounter in your target role.
          </Typography>
        </Alert>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={`My Generated Tests (${userSmartTests.length})`} 
            icon={<Build />}
          />
          <Tab 
            label={`Admin Tests (${adminSmartTests.length})`} 
            icon={<School />}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <>
          {/* Action Buttons */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Build sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Generate New Test
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create a personalized preparation test for any job position
              </Typography>
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => setShowGenerateDialog(true)}
                disabled={jobs.length === 0}
                startIcon={<Build />}
                sx={{ mt: 2 }}
              >
                Generate Smart Test
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Assessment sx={{ fontSize: 48, color: theme.palette.secondary.main, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                View Results
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Review your performance and get insights
              </Typography>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={() => navigate('/app/smart-test-results')}
                startIcon={<TrendingUp />}
                sx={{ mt: 2 }}
              >
                View Results
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* My Smart Tests */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            My Smart Tests ({userSmartTests.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUserSmartTests}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {userSmartTests.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Assessment sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Smart Tests Generated Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Generate your first smart test to start preparing for job interviews
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => setShowGenerateDialog(true)}
                disabled={jobs.length === 0}
              >
                Generate Your First Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {userSmartTests.map((test) => (
              <Grid item xs={12} md={6} lg={4} key={test._id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      {getDifficultyIcon(test.difficulty)}
                      <Box ml={1}>
                        <Typography variant="h6" component="div" noWrap>
                          {test.jobTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {test.company}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box mb={2}>
                      <Chip 
                        label={test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
                        size="small"
                        sx={{ 
                          backgroundColor: getDifficultyColor(test.difficulty),
                          color: 'white',
                          mb: 1,
                          mr: 1
                        }}
                      />
                      <Chip 
                        label={`${test.questionCount} Questions`}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1, mr: 1 }}
                      />
                      <Chip 
                        label={`${test.timeLimit} min`}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      Skills: {test.skillsRequired.join(', ')}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(test.createdAt).toLocaleDateString()}
                    </Typography>

                    <Box mt={3}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<PlayArrow />}
                        onClick={() => startTest(test.testId)}
                        disabled={loading}
                      >
                        {loading ? 'Starting...' : 'Start Test'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
        </>
      )}

      {/* Admin Tests Tab */}
      {tabValue === 1 && (
        <Box mb={4}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Admin Uploaded Tests ({adminSmartTests.length})
          </Typography>
          
          {adminSmartTests.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <School sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Admin Tests Available
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Check back later for tests uploaded by administrators for specific job positions
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {adminSmartTests.map((test) => (
                <Grid item xs={12} md={6} lg={4} key={test._id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        {getDifficultyIcon(test.difficulty)}
                        <Box ml={1}>
                          <Typography variant="h6" component="div" noWrap>
                            {test.jobTitle}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {test.company} • {test.industry}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                        {test.title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        {test.description}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Box mb={2}>
                        <Chip 
                          label={test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
                          size="small"
                          sx={{ 
                            backgroundColor: getDifficultyColor(test.difficulty),
                            color: 'white',
                            mb: 1,
                            mr: 1
                          }}
                        />
                        <Chip 
                          label={`${test.questionCount} Questions`}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1, mr: 1 }}
                        />
                        <Chip 
                          label={`${test.timeLimit} min`}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        Skills: {test.skillsRequired.join(', ')}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        Uploaded: {new Date(test.createdAt).toLocaleDateString()}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary">
                        By: {test.uploadedBy}
                      </Typography>

                      <Box mt={3}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<PlayArrow />}
                          onClick={() => startTest(test.testId)}
                          disabled={loading || !test.isActive}
                        >
                          {!test.isActive ? 'Test Inactive' : loading ? 'Starting...' : 'Start Test'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Generate Test Dialog - Enhanced */}
      <Dialog 
        open={showGenerateDialog} 
        onClose={() => !generatingTest && setShowGenerateDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                <Build />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Generate Smart Test
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a personalized test for your target job position
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => !generatingTest && setShowGenerateDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3 }}>
          <Grid container spacing={3}>
            {/* Job Filters Section */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterList sx={{ mr: 1 }} />
                  Find Your Target Job
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Search Jobs"
                      placeholder="Job title, company, or skills..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={getUniqueLocations()}
                      value={locationFilter}
                      onChange={(_, value) => setLocationFilter(value || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Location"
                          placeholder="Select location..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationOn />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={getUniqueIndustries()}
                      value={industryFilter}
                      onChange={(_, value) => setIndustryFilter(value || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Industry"
                          placeholder="Select industry..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <Business />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={getUniqueExperienceLevels()}
                      value={experienceLevelFilter}
                      onChange={(_, value) => setExperienceLevelFilter(value || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Experience Level"
                          placeholder="Select experience level..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <TrendingUp />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Found {filteredJobs.length} jobs
                  </Typography>
                  <Button
                    size="small"
                    onClick={clearFilters}
                    disabled={!jobSearch && !locationFilter && !industryFilter && !experienceLevelFilter}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Job Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Job Position
              </Typography>
              
              <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {filteredJobs.length === 0 ? (
                  <Box p={4} textAlign="center">
                    <Work sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
                    <Typography color="text.secondary">
                      No jobs found. Try adjusting your filters.
                    </Typography>
                  </Box>
                ) : (
                  filteredJobs.map((job) => (
                    <Box
                      key={job._id}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        backgroundColor: selectedJob?._id === job._id ? theme.palette.primary.main : 'transparent',
                        color: selectedJob?._id === job._id ? theme.palette.primary.contrastText : 'inherit',
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover
                        },
                        '&:last-child': {
                          borderBottom: 0
                        }
                      }}
                      onClick={() => setSelectedJob(job)}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {job.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {job.company} • {job.location}
                          </Typography>
                          
                          <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                            {job.industry && (
                              <Chip 
                                label={job.industry} 
                                size="small" 
                                variant="outlined"
                                icon={<Business />}
                              />
                            )}
                            <Chip 
                              label={job.experienceLevel} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                            {job.skills.slice(0, 3).map((skill) => (
                              <Chip
                                key={skill}
                                label={skill}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                            {job.skills.length > 3 && (
                              <Chip
                                label={`+${job.skills.length - 3} more`}
                                size="small"
                                variant="outlined"
                                color="secondary"
                              />
                            )}
                          </Stack>
                        </Box>
                        
                        {selectedJob?._id === job._id && (
                          <CheckCircle sx={{ color: theme.palette.primary.contrastText }} />
                        )}
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Grid>

            {/* Selected Job Details */}
            {selectedJob && (
              <Grid item xs={12}>
                <Alert 
                  severity="success" 
                  variant="filled"
                >
                  <Box>
                    <Typography variant="body1" fontWeight="medium" gutterBottom>
                      Selected: {selectedJob.title} at {selectedJob.company}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Industry:</strong> {selectedJob.industry || 'Not specified'} •{' '}
                      <strong>Experience:</strong> {selectedJob.experienceLevel} •{' '}
                      <strong>Location:</strong> {selectedJob.location}
                    </Typography>
                    {selectedJob.skills.length > 0 && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Skills to be tested:</strong> {selectedJob.skills.join(', ')}
                      </Typography>
                    )}
                  </Box>
                </Alert>
              </Grid>
            )}

            {/* Test Configuration */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Test Configuration
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Number of Questions</InputLabel>
                      <Select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        label="Number of Questions"
                      >
                        <MenuItem value={15}>15 Questions (~20 min)</MenuItem>
                        <MenuItem value={20}>20 Questions (~25 min)</MenuItem>
                        <MenuItem value={25}>25 Questions (~35 min)</MenuItem>
                        <MenuItem value={30}>30 Questions (~45 min)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>Standard Difficulty:</strong> Test will be automatically adjusted to match the job requirements and your profile.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {generatingTest && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Generating Your Smart Test...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    AI is creating personalized questions based on the job requirements
                  </Typography>
                  <LinearProgress sx={{ mt: 2 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    This may take 30-60 seconds
                  </Typography>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setShowGenerateDialog(false)}
            disabled={generatingTest}
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateTest}
            variant="contained"
            disabled={!selectedJob || generatingTest}
            startIcon={generatingTest ? <CircularProgress size={16} /> : <Build />}
            size="large"
            sx={{ px: 4 }}
          >
            {generatingTest ? 'Generating...' : 'Generate Smart Test'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog - Start Generated Test */}
      <Dialog
        open={showStartTestDialog}
        onClose={() => setShowStartTestDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h4" component="div" gutterBottom>
            Smart Test Generated Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your personalized job preparation test is ready
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Your test has been saved and you can access it anytime from your smart tests list.
            </Typography>
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            What would you like to do now?
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 3, pt: 0 }}>
          <Button 
            onClick={handleViewTestsLater}
            variant="outlined"
            size="large"
            startIcon={<Info />}
          >
            View Tests Later
          </Button>
          <Button 
            onClick={handleStartGeneratedTest}
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            sx={{ px: 4 }}
          >
            Start Test Now
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SmartTestPage;