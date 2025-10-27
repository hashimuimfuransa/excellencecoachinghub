import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Stack,
  alpha,
  useTheme,
  Paper,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Check,
  Close,
  Payment,
  Psychology,
  AccessTime,
  Assignment,
  Refresh,
  AttachMoney,
  Speed,
  Schedule,
  School,
  Star,
  TrendingUp,
  WorkOutline,
  CheckCircle,
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { paymentService } from '../services/paymentService';
import { jobService } from '../services/jobService';

interface TestLevel {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: {
    questionCount: number;
    timeLimit: number;
    attempts: number;
    validityDays: number;
    detailedReports: boolean;
  };
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  processingTime: string;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  industry: string;
  description?: string;
  skillsRequired: string[];
  experienceLevel: string;
}

interface SimplifiedTestSelectionProps {
  open: boolean;
  onClose: () => void;
  onTestStart: (testSessionId: string) => void;
}

const steps = ['Select Level', 'Choose Job', 'Generate Test']; // Payment temporarily removed for testing

export const SimplifiedTestSelection: React.FC<SimplifiedTestSelectionProps> = ({
  open,
  onClose,
  onTestStart
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // State
  const [testLevels, setTestLevels] = useState<TestLevel[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Selections
  const [selectedLevel, setSelectedLevel] = useState<TestLevel | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [experienceFilter, setExperienceFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const [error, setError] = useState<string>('');
  const [purchaseId, setPurchaseId] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadInitialData();
      resetState();
    }
  }, [open]);

  const resetState = () => {
    setActiveStep(0);
    setSelectedLevel(null);
    setSelectedPaymentMethod('');
    setSelectedJob(null);
    setSearchTerm('');
    setIndustryFilter('');
    setExperienceFilter('');
    setShowFilters(false);
    setError('');
    setPurchaseId('');
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load real data from APIs but skip payment methods for now
      const [testLevelsData, jobsData] = await Promise.all([
        paymentService.getTestLevels(),
        // Temporarily use test jobs endpoint to ensure dialog works
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/test-jobs-early`)
          .then(res => res.json())
      ]);

      setTestLevels(Array.isArray(testLevelsData) ? testLevelsData : []);
      
      // Ensure jobs is always an array - backend returns { success, data: jobs[], pagination }
      const jobsArray = jobsData?.data || jobsData?.jobs || jobsData;
      setJobs(Array.isArray(jobsArray) ? jobsArray : []);
      
      // Skip payment methods for now - will be added later
      setPaymentMethods([]);
      
      console.log('Loaded test levels:', testLevelsData);
      console.log('Loaded jobs:', jobsData);
      console.log('Jobs array set to:', Array.isArray(jobsArray) ? jobsArray : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load test options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedLevel) {
      setError('Please select a test level');
      return;
    }
    if (activeStep === 1 && !selectedJob) {
      setError('Please select a job to test for');
      return;
    }

    setError('');
    
    if (activeStep === 2) {
      // Generate test (payment step removed)
      handleGenerateTest();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handlePayment = async () => {
    if (!selectedLevel) return;

    setProcessing(true);
    try {
      const result = await paymentService.purchaseTestLevel({
        levelId: selectedLevel.id,
        paymentMethodId: selectedPaymentMethod
      });
      
      setPurchaseId(result.data.purchaseId);
      setActiveStep(prev => prev + 1);
      
    } catch (error: any) {
      console.error('Payment failed:', error);
      setError(error.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateTest = async () => {
    if (!selectedJob || !selectedLevel) return;

    setProcessing(true);
    try {
      // Generate test using real API but skip payment for now
      const result = await paymentService.generatePsychometricTest({
        jobId: selectedJob._id,
        levelId: selectedLevel.id
      });
      
      // Close dialog and start test
      onTestStart(result.data.testSessionId);
      onClose();
      
    } catch (error: any) {
      console.error('Test generation failed:', error);
      setError(error.response?.data?.error || 'Failed to generate test. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  const getLevelIcon = (levelId: string) => {
    switch (levelId) {
      case 'easy': return '🟢';
      case 'intermediate': return '🟡';
      case 'hard': return '🔴';
      default: return '📝';
    }
  };

  const getLevelColor = (levelId: string) => {
    switch (levelId) {
      case 'easy': return '#4caf50';
      case 'intermediate': return '#ff9800';
      case 'hard': return '#f44336';
      default: return '#2196f3';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency === 'RWF' ? 'RWF' : '$'} ${amount.toLocaleString()}`;
  };

  // Get unique industries from jobs
  const getUniqueIndustries = () => {
    const industries = jobs.map(job => job.industry).filter(Boolean);
    return [...new Set(industries)].sort();
  };

  // Get unique experience levels from jobs
  const getUniqueExperienceLevels = () => {
    const levels = jobs.map(job => job.experienceLevel).filter(Boolean);
    return [...new Set(levels)].sort();
  };

  // Filter jobs based on search term and filters
  const getFilteredJobs = () => {
    return jobs.filter(job => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skillsRequired?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

      // Industry filter
      const matchesIndustry = !industryFilter || job.industry === industryFilter;

      // Experience filter
      const matchesExperience = !experienceFilter || job.experienceLevel === experienceFilter;

      return matchesSearch && matchesIndustry && matchesExperience;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setIndustryFilter('');
    setExperienceFilter('');
  };

  const renderLevelSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Your Assessment Level
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the difficulty level that matches your target position. Higher levels include more questions and detailed reports.
      </Typography>
      
      <Grid container spacing={2}>
        {testLevels.map((level) => (
          <Grid size={{ xs: 12, md: 4 }} key={level.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                border: selectedLevel?.id === level.id ? `2px solid ${getLevelColor(level.id)}` : '1px solid',
                borderColor: selectedLevel?.id === level.id ? getLevelColor(level.id) : 'divider',
                bgcolor: selectedLevel?.id === level.id ? alpha(getLevelColor(level.id), 0.08) : 'background.paper',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4]
                }
              }}
              onClick={() => setSelectedLevel(level)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    {getLevelIcon(level.id)} {level.name}
                  </Typography>
                  <Chip
                    label={level.id.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: getLevelColor(level.id),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {level.description}
                </Typography>
                
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 2, color: getLevelColor(level.id) }}>
                  {formatCurrency(level.price, level.currency)}
                </Typography>
                
                <List dense sx={{ p: 0 }}>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Assignment sx={{ fontSize: 16, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${level.features.questionCount} Questions`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <AccessTime sx={{ fontSize: 16, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${level.features.timeLimit} Minutes`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Refresh sx={{ fontSize: 16, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${level.features.attempts} Attempts`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Schedule sx={{ fontSize: 16, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Valid for ${level.features.validityDays} days`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  {level.features.detailedReports && (
                    <ListItem sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <TrendingUp sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Detailed Reports"
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  )}
                </List>
                
                {selectedLevel?.id === level.id && (
                  <Box mt={2} display="flex" justifyContent="center">
                    <Chip
                      icon={<Check />}
                      label="Selected"
                      sx={{
                        bgcolor: getLevelColor(level.id),
                        color: 'white'
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderPaymentSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Payment Method
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose how you'd like to pay for your {selectedLevel?.name} assessment.
      </Typography>

      {selectedLevel && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(getLevelColor(selectedLevel.id), 0.08) }}>
          <Typography variant="body1" fontWeight="bold">
            Selected: {selectedLevel.name}
          </Typography>
          <Typography variant="h5" color="primary" fontWeight="bold">
            Total: {formatCurrency(selectedLevel.price, selectedLevel.currency)}
          </Typography>
        </Paper>
      )}

      <Grid container spacing={2}>
        {paymentMethods.map((method) => (
          <Grid size={{ xs: 12, sm: 6 }} key={method.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedPaymentMethod === method.id ? '2px solid' : '1px solid',
                borderColor: selectedPaymentMethod === method.id ? 'primary.main' : 'divider',
                bgcolor: selectedPaymentMethod === method.id ? alpha(theme.palette.primary.main, 0.04) : 'background.paper'
              }}
              onClick={() => setSelectedPaymentMethod(method.id)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h6" sx={{ mr: 1 }}>{method.icon}</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {method.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Processing time: {method.processingTime}
                </Typography>
                {selectedPaymentMethod === method.id && (
                  <Box mt={1}>
                    <Chip icon={<Check />} label="Selected" color="primary" size="small" />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderJobSelection = () => {
    const filteredJobs = getFilteredJobs();
    const uniqueIndustries = getUniqueIndustries();
    const uniqueExperienceLevels = getUniqueExperienceLevels();
    const hasActiveFilters = searchTerm || industryFilter || experienceFilter;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Select Job Position
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose the job position you want to be assessed for. AI will generate questions specific to this role.
        </Typography>

        {/* Search and Filter Controls */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search by job title, company, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchTerm('')}
                    edge="end"
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />

          {/* Filter Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
            <Button
              startIcon={<FilterList />}
              endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
              size="small"
            >
              Advanced Filters
            </Button>
            
            {hasActiveFilters && (
              <Button
                startIcon={<Clear />}
                onClick={clearFilters}
                variant="text"
                size="small"
                color="secondary"
              >
                Clear All Filters
              </Button>
            )}
          </Box>

          {/* Filter Controls */}
          <Collapse in={showFilters}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Industry</InputLabel>
                  <Select
                    value={industryFilter}
                    label="Industry"
                    onChange={(e) => setIndustryFilter(e.target.value)}
                  >
                    <MenuItem value="">All Industries</MenuItem>
                    {uniqueIndustries.map((industry) => (
                      <MenuItem key={industry} value={industry}>
                        {industry}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={experienceFilter}
                    label="Experience Level"
                    onChange={(e) => setExperienceFilter(e.target.value)}
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    {uniqueExperienceLevels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Results Summary */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredJobs.length} of {jobs.length} positions
            {hasActiveFilters && (
              <Chip 
                label="Filtered" 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }} 
              />
            )}
          </Typography>
        </Box>

        {/* Job Cards */}
        {filteredJobs.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No jobs found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Try adjusting your search terms or filters
            </Typography>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outlined">
                Clear Filters
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={2} sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredJobs.map((job) => (
              <Grid size={{ xs: 12, sm: 6 }} key={job._id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedJob?._id === job._id ? '2px solid' : '1px solid',
                    borderColor: selectedJob?._id === job._id ? 'primary.main' : 'divider',
                    bgcolor: selectedJob?._id === job._id ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                  onClick={() => setSelectedJob(job)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, pr: 1 }}>
                        {job.title}
                      </Typography>
                      {selectedJob?._id === job._id && (
                        <CheckCircle color="primary" sx={{ fontSize: 20 }} />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>{job.company}</strong> • {job.industry}
                    </Typography>
                    
                    <Chip 
                      label={job.experienceLevel} 
                      size="small" 
                      color="secondary"
                      sx={{ mb: 1 }}
                    />
                    
                    {job.skillsRequired?.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Required Skills:
                        </Typography>
                        {job.skillsRequired.slice(0, 3).map((skill) => (
                          <Chip 
                            key={skill} 
                            label={skill} 
                            size="small" 
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }} 
                          />
                        ))}
                        {job.skillsRequired.length > 3 && (
                          <Chip 
                            label={`+${job.skillsRequired.length - 3} more`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    )}
                    
                    {selectedJob?._id === job._id && (
                      <Box mt={2}>
                        <Chip 
                          icon={<Check />} 
                          label="Selected for Assessment" 
                          color="primary" 
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  const renderGenerateTest = () => (
    <Box textAlign="center">
      <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Ready to Generate Your Test!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        AI will create a personalized assessment based on your selected job position and difficulty level.
      </Typography>

      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body2" gutterBottom>
          <strong>Level:</strong> {selectedLevel?.name}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Job:</strong> {selectedJob?.title} at {selectedJob?.company}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Questions:</strong> {selectedLevel?.features.questionCount}
        </Typography>
        <Typography variant="body2">
          <strong>Time Limit:</strong> {selectedLevel?.features.timeLimit} minutes
        </Typography>
      </Paper>
    </Box>
  );

  const getStepContent = () => {
    switch (activeStep) {
      case 0: return renderLevelSelection();
      case 1: return renderJobSelection();
      case 2: return renderGenerateTest();
      default: return null;
    }
  };

  const getNextButtonText = () => {
    switch (activeStep) {
      case 0: return 'Choose Job';
      case 1: return 'Continue';
      case 2: return processing ? 'Generating Test...' : 'Start Assessment';
      default: return 'Next';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          Take Psychometric Assessment
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : (
          getStepContent()
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={processing}>
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={processing || loading}
          startIcon={processing ? <CircularProgress size={16} /> : undefined}
        >
          {getNextButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};