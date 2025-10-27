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
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Stack,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Check,
  Close,
  Payment,
  School,
  WorkOutline,
  Psychology,
  Timeline,
  CardMembership,
  Star,
  AccessTime,
  Assignment,
  Refresh,
  AttachMoney,
  Speed,
  Schedule,
  Business,
  TrendingUp
} from '@mui/icons-material';
import { TestPackage, PaymentMethod, paymentService } from '../services/paymentService';

interface TestPackageSelectionProps {
  open: boolean;
  onClose: () => void;
  onPurchaseComplete: (purchaseId: string, packageLevel: string) => void;
}

const steps = ['Select Package', 'Job Details', 'Payment', 'Confirmation'];

const experienceLevels = [
  { value: 'entry-level', label: 'Entry Level (0-2 years)' },
  { value: 'mid-level', label: 'Mid Level (2-5 years)' },
  { value: 'senior-level', label: 'Senior Level (5-10 years)' },
  { value: 'executive', label: 'Executive Level (10+ years)' }
];

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Hospitality', 'Government', 'Non-profit', 'Consulting',
  'Marketing', 'Sales', 'Human Resources', 'Operations', 'Other'
];

export const TestPackageSelection: React.FC<TestPackageSelectionProps> = ({
  open,
  onClose,
  onPurchaseComplete
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [packages, setPackages] = useState<TestPackage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<TestPackage | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  // Job details form
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobDescription: '',
    industry: '',
    experienceLevel: 'mid-level'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadPackagesAndPaymentMethods();
      setActiveStep(0);
      setSelectedPackage(null);
      setSelectedPaymentMethod('');
      setFormData({
        jobTitle: '',
        jobDescription: '',
        industry: '',
        experienceLevel: 'mid-level'
      });
      setErrors({});
    }
  }, [open]);

  const loadPackagesAndPaymentMethods = async () => {
    setLoading(true);
    try {
      const [packagesData, paymentMethodsData] = await Promise.all([
        paymentService.getTestPackages(),
        paymentService.getPaymentMethods()
      ]);
      
      setPackages(packagesData);
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (activeStep === 0) {
      if (!selectedPackage) {
        newErrors.package = 'Please select a package';
      }
    } else if (activeStep === 1) {
      if (!formData.jobTitle.trim()) {
        newErrors.jobTitle = 'Job title is required';
      }
      if (!formData.industry) {
        newErrors.industry = 'Industry is required';
      }
    } else if (activeStep === 2) {
      if (!selectedPaymentMethod) {
        newErrors.paymentMethod = 'Please select a payment method';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (activeStep === 2) {
        handlePurchase();
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setPurchaseLoading(true);
    try {
      const purchaseData = {
        packageId: selectedPackage._id,
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        industry: formData.industry,
        experienceLevel: formData.experienceLevel as any,
        paymentMethod: selectedPaymentMethod
      };

      const result = await paymentService.purchaseTestPackage(purchaseData);
      setActiveStep(3); // Move to confirmation step
      
      // After a short delay, complete the purchase
      setTimeout(() => {
        onPurchaseComplete(result.purchase._id, selectedPackage.level);
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('Purchase failed:', error);
      setErrors({ purchase: error instanceof Error ? error.message : 'Purchase failed' });
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedPackage(null);
    setSelectedPaymentMethod('');
    setFormData({
      jobTitle: '',
      jobDescription: '',
      industry: '',
      experienceLevel: 'mid-level'
    });
    setErrors({});
    onClose();
  };

  const getPackageFeatures = (pkg: TestPackage) => [
    { icon: <Assignment />, text: `${pkg.features.questionCount} Questions`, key: 'questions' },
    { icon: <AccessTime />, text: `${pkg.features.timeLimit} Minutes`, key: 'time' },
    { icon: <Refresh />, text: `${pkg.features.attempts} Attempts`, key: 'attempts' },
    { icon: <Schedule />, text: `${pkg.features.validityDays} Days Valid`, key: 'validity' },
    ...(pkg.features.industrySpecific ? [{ icon: <Business />, text: 'Industry Specific', key: 'industry' }] : []),
    ...(pkg.features.detailedReports ? [{ icon: <Timeline />, text: 'Detailed Reports', key: 'reports' }] : []),
    ...(pkg.features.comparativeAnalysis ? [{ icon: <TrendingUp />, text: 'Comparative Analysis', key: 'analysis' }] : []),
    ...(pkg.features.certificateIncluded ? [{ icon: <CardMembership />, text: 'Certificate Included', key: 'certificate' }] : [])
  ];

  const renderPackageSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Your Assessment Package
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the package that best fits your needs. Each package includes AI-generated questions tailored to your specific job requirements.
      </Typography>
      
      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Card sx={{ height: 300 }}>
                <CardContent>
                  <CircularProgress />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {packages.map((pkg) => (
            <Grid item xs={12} sm={6} key={pkg._id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  border: selectedPackage?._id === pkg._id ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                  borderColor: selectedPackage?._id === pkg._id ? 'primary.main' : 'divider',
                  bgcolor: selectedPackage?._id === pkg._id ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
                onClick={() => setSelectedPackage(pkg)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      {paymentService.getPackageIcon(pkg.level)} {pkg.name}
                    </Typography>
                    <Chip
                      label={pkg.level.toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor: paymentService.getPackageBadgeColor(pkg.level),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {pkg.description}
                  </Typography>
                  
                  <Typography variant="h4" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                    {paymentService.formatCurrency(pkg.price, pkg.currency)}
                  </Typography>
                  
                  <List dense sx={{ p: 0 }}>
                    {getPackageFeatures(pkg).map((feature, index) => (
                      <ListItem key={feature.key} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {React.cloneElement(feature.icon, { 
                            sx: { fontSize: 16, color: 'primary.main' } 
                          })}
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature.text}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  {selectedPackage?._id === pkg._id && (
                    <Box mt={2} display="flex" justifyContent="center">
                      <Chip
                        icon={<Check />}
                        label="Selected"
                        color="primary"
                        variant="filled"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {errors.package && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.package}
        </Alert>
      )}
    </Box>
  );

  const renderJobDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Job Assessment Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide details about the position you're assessing for. This helps our AI create more relevant questions.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Job Title"
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            error={!!errors.jobTitle}
            helperText={errors.jobTitle}
            placeholder="e.g. Software Engineer, Marketing Manager, Sales Representative"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.industry}>
            <InputLabel>Industry</InputLabel>
            <Select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              label="Industry"
            >
              {industries.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  {industry}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Experience Level</InputLabel>
            <Select
              value={formData.experienceLevel}
              onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
              label="Experience Level"
            >
              {experienceLevels.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  {level.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Job Description (Optional)"
            value={formData.jobDescription}
            onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
            placeholder="Brief description of the role, key responsibilities, and requirements..."
            helperText="Providing a job description helps create more targeted assessment questions"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPaymentMethod = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Payment Method
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select your preferred payment method to complete the purchase.
      </Typography>
      
      <Grid container spacing={2}>
        {paymentMethods.map((method) => (
          <Grid item xs={12} sm={6} key={method.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedPaymentMethod === method.id ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                borderColor: selectedPaymentMethod === method.id ? 'primary.main' : 'divider',
                bgcolor: selectedPaymentMethod === method.id ? alpha(theme.palette.primary.main, 0.04) : 'background.paper'
              }}
              onClick={() => setSelectedPaymentMethod(method.id)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h4" sx={{ mr: 1 }}>{method.icon}</Typography>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {method.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {method.description}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Processing: {method.processingTime} • Fee: {method.fee}%
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
      
      {selectedPackage && (
        <Paper sx={{ p: 2, mt: 3, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
          <Typography variant="subtitle2" gutterBottom>
            Order Summary
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2">
              {selectedPackage.name} - {formData.jobTitle}
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {paymentService.formatCurrency(selectedPackage.price, selectedPackage.currency)}
            </Typography>
          </Box>
        </Paper>
      )}
      
      {errors.paymentMethod && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.paymentMethod}
        </Alert>
      )}
      
      {errors.purchase && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.purchase}
        </Alert>
      )}
    </Box>
  );

  const renderConfirmation = () => (
    <Box textAlign="center" py={4}>
      <Check sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Purchase Successful!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Your test package has been purchased successfully. You can now generate your personalized assessment.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        You will be redirected to the job selection screen shortly...
      </Typography>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={purchaseLoading ? undefined : handleClose}
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: 600 }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Purchase Assessment Package
          </Typography>
          {!purchaseLoading && (
            <IconButton onClick={handleClose} edge="end">
              <Close />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 1 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === 0 && renderPackageSelection()}
        {activeStep === 1 && renderJobDetails()}
        {activeStep === 2 && renderPaymentMethod()}
        {activeStep === 3 && renderConfirmation()}
      </DialogContent>
      
      {activeStep < 3 && (
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} disabled={purchaseLoading}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={purchaseLoading}>
              Back
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={purchaseLoading || loading}
            startIcon={purchaseLoading ? <CircularProgress size={16} /> : undefined}
          >
            {activeStep === 2 ? 'Complete Purchase' : 'Next'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};