import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Snackbar,
  Badge,
  useTheme,
  alpha,
  Grid
} from '@mui/material';
import {
  Close,
  SmartToy,
  AttachMoney,
  CheckCircle,
  Schedule,
  Star,
  Lock,
  LockOpen,
  Assessment,
  Psychology,
  Timer,
  ArrowForward,
  Payment,
  Notifications,
  PlayArrow
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/paymentService';

// Custom Assessment Level Interface
interface CustomAssessmentLevel {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Intermediate' | 'Hard';
  price: number;
  currency: string;
  questionCount: number;
  timeLimit: number;
  features: string[];
  color: string;
  gradient: string;
  icon: React.ReactNode;
}

// Payment Method Interface
interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  fee: number;
  processingTime: string;
}

// User Purchase Interface
interface UserPurchase {
  levelId: string;
  purchaseId: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  attemptsRemaining: number;
  purchasedAt: string;
  approvedAt?: string;
}

interface CustomAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  onJobSelect?: () => void;
}

const CustomAssessmentDialog: React.FC<CustomAssessmentDialogProps> = ({
  open,
  onClose,
  onJobSelect
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  // State Management
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<CustomAssessmentLevel | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Assessment Levels Configuration
  const assessmentLevels: CustomAssessmentLevel[] = [
    {
      id: 'easy',
      name: 'Foundation Level',
      difficulty: 'Easy',
      price: 2000,
      currency: 'RWF',
      questionCount: 20,
      timeLimit: 25,
      features: [
        'Basic personality traits assessment',
        'Fundamental cognitive abilities',
        'Simple problem-solving scenarios',
        'Standard report with key insights'
      ],
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
      icon: <Star />
    },
    {
      id: 'intermediate',
      name: 'Professional Level',
      difficulty: 'Intermediate',
      price: 4000,
      currency: 'RWF',
      questionCount: 30,
      timeLimit: 40,
      features: [
        'Comprehensive personality profiling',
        'Advanced cognitive assessment',
        'Scenario-based evaluations',
        'Detailed analysis with recommendations',
        'Industry-specific insights'
      ],
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
      icon: <Assessment />
    },
    {
      id: 'hard',
      name: 'Executive Level',
      difficulty: 'Hard',
      price: 8000,
      currency: 'RWF',
      questionCount: 20,
      timeLimit: 30,
      features: [
        'Executive-level assessment',
        'Complex situational judgment',
        'Leadership capability analysis',
        'Strategic thinking evaluation',
        'Comprehensive competency mapping',
        'Premium detailed report with action plan'
      ],
      color: '#9C27B0',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
      icon: <Psychology />
    }
  ];

  // Load user purchases and payment methods
  useEffect(() => {
    if (open) {
      loadUserData();
    }
  }, [open]);

  const loadUserData = async () => {
    try {
      // Load user purchases from localStorage (in real app, this would be from API)
      const storedPurchases = localStorage.getItem(`customAssessmentPurchases_${user?._id}`);
      if (storedPurchases) {
        setUserPurchases(JSON.parse(storedPurchases));
      }

      // Load payment methods
      const methods: PaymentMethod[] = [
        {
          id: 'momo',
          name: 'MTN Mobile Money',
          description: 'Pay via MTN MoMo',
          icon: '📱',
          fee: 0,
          processingTime: 'Instant'
        },
        {
          id: 'airtel',
          name: 'Airtel Money',
          description: 'Pay via Airtel Money',
          icon: '💳',
          fee: 0,
          processingTime: 'Instant'
        },
        {
          id: 'card',
          name: 'Credit/Debit Card',
          description: 'Visa, Mastercard accepted',
          icon: '💳',
          fee: 100,
          processingTime: '1-2 minutes'
        }
      ];
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Check if user has valid purchase for level
  const hasValidPurchase = (levelId: string): boolean => {
    const purchase = userPurchases.find(p => 
      p.levelId === levelId && 
      p.approvalStatus === 'approved' && 
      p.attemptsRemaining > 0
    );
    return !!purchase;
  };

  // Get remaining attempts for level
  const getRemainingAttempts = (levelId: string): number => {
    const purchase = userPurchases.find(p => 
      p.levelId === levelId && 
      p.approvalStatus === 'approved'
    );
    return purchase?.attemptsRemaining || 0;
  };

  // Handle level selection
  const handleLevelSelect = (level: CustomAssessmentLevel) => {
    setSelectedLevel(level);
    
    if (hasValidPurchase(level.id)) {
      // User has valid purchase, skip to job selection
      setCurrentStep(3);
    } else {
      // User needs to purchase, go to payment step
      setCurrentStep(1);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setCurrentStep(2);
  };

  // Process payment
  const handlePayment = async () => {
    if (!selectedLevel || !selectedPaymentMethod) return;

    setProcessingPayment(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Create new purchase record
      const newPurchase: UserPurchase = {
        levelId: selectedLevel.id,
        purchaseId: `purchase_${Date.now()}`,
        approvalStatus: 'pending',
        attemptsRemaining: 3,
        purchasedAt: new Date().toISOString()
      };

      // Simulate instant approval for demo
      setTimeout(() => {
        newPurchase.approvalStatus = 'approved';
        newPurchase.approvedAt = new Date().toISOString();
        
        const updatedPurchases = [...userPurchases, newPurchase];
        setUserPurchases(updatedPurchases);
        
        // Save to localStorage
        localStorage.setItem(
          `customAssessmentPurchases_${user?._id}`,
          JSON.stringify(updatedPurchases)
        );

        // Show approval notification
        setNotificationMessage(
          `🎉 Payment approved! You can now take the ${selectedLevel.name} assessment. You have 3 attempts remaining.`
        );
        setShowNotification(true);
        setCurrentStep(3);
      }, 1000);

      // Move to approval waiting step
      setCurrentStep(2.5);

    } catch (error) {
      console.error('Payment failed:', error);
      setNotificationMessage('❌ Payment failed. Please try again.');
      setShowNotification(true);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle job selection
  const handleJobSelection = () => {
    onClose();
    if (onJobSelect) {
      onJobSelect();
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const steps = [
    'Select Assessment Level',
    'Choose Payment Method', 
    'Complete Payment',
    'Select Job & Generate Test'
  ];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                width: 48,
                height: 48
              }}>
                <SmartToy />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Custom Assessment Builder
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create personalized job-specific psychometric tests
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {/* Step Indicator */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={Math.floor(currentStep)} orientation="horizontal">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Step Content */}
          <Box sx={{ minHeight: 400 }}>
            {/* Step 0: Level Selection */}
            {currentStep === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Typography variant="h6" gutterBottom fontWeight="bold" textAlign="center">
                  Choose Your Assessment Level
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
                  Select the difficulty level that matches your requirements
                </Typography>

                <Grid container spacing={3}>
                  {assessmentLevels.map((level) => {
                    const hasValidAccess = hasValidPurchase(level.id);
                    const remainingAttempts = getRemainingAttempts(level.id);

                    return (
                      <Grid item xs={12} md={4} key={level.id}>
                        <Card
                          sx={{
                            position: 'relative',
                            cursor: 'pointer',
                            height: '100%',
                            background: hasValidAccess ? 
                              `linear-gradient(135deg, ${alpha(level.color, 0.1)} 0%, ${alpha(level.color, 0.05)} 100%)` :
                              'white',
                            border: `2px solid ${hasValidAccess ? level.color : alpha(level.color, 0.2)}`,
                            borderRadius: 3,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 12px 28px ${alpha(level.color, 0.25)}`,
                              border: `2px solid ${level.color}`
                            }
                          }}
                          onClick={() => handleLevelSelect(level)}
                        >
                          {hasValidAccess && (
                            <Badge
                              badgeContent={`${remainingAttempts} attempts left`}
                              color="success"
                              sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                zIndex: 1,
                                '& .MuiBadge-badge': {
                                  fontSize: '0.75rem',
                                  padding: '4px 8px'
                                }
                              }}
                            />
                          )}

                          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <Avatar sx={{ 
                                bgcolor: level.color,
                                background: level.gradient,
                                width: 48,
                                height: 48
                              }}>
                                {level.icon}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight="bold">
                                  {level.name}
                                </Typography>
                                <Chip 
                                  label={level.difficulty}
                                  size="small"
                                  sx={{ 
                                    bgcolor: alpha(level.color, 0.1),
                                    color: level.color,
                                    fontWeight: 'bold'
                                  }}
                                />
                              </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                              <Typography variant="h4" fontWeight="bold" color={level.color}>
                                {formatCurrency(level.price)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {level.questionCount} questions • {level.timeLimit} minutes
                              </Typography>
                            </Box>

                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                What's included:
                              </Typography>
                              {level.features.map((feature, index) => (
                                <Box key={index} display="flex" alignItems="center" gap={1} mb={0.5}>
                                  <CheckCircle sx={{ fontSize: 16, color: level.color }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {feature}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>

                            <Box sx={{ mt: 2 }}>
                              <Button
                                fullWidth
                                variant={hasValidAccess ? "outlined" : "contained"}
                                size="large"
                                startIcon={hasValidAccess ? <PlayArrow /> : <AttachMoney />}
                                sx={{
                                  bgcolor: hasValidAccess ? 'transparent' : level.color,
                                  borderColor: level.color,
                                  color: hasValidAccess ? level.color : 'white',
                                  '&:hover': {
                                    bgcolor: hasValidAccess ? alpha(level.color, 0.1) : alpha(level.color, 0.8)
                                  }
                                }}
                              >
                                {hasValidAccess ? 'Start Assessment' : 'Purchase & Start'}
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </motion.div>
            )}

            {/* Step 1: Payment Method Selection */}
            {currentStep === 1 && selectedLevel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box textAlign="center" sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Choose Payment Method
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select how you'd like to pay for {selectedLevel.name}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={`${selectedLevel.name} - ${formatCurrency(selectedLevel.price)}`}
                      color="primary"
                      size="medium"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>

                <Grid container spacing={3} justifyContent="center">
                  {paymentMethods.map((method) => (
                    <Grid item xs={12} sm={6} md={4} key={method.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: `2px solid ${selectedPaymentMethod === method.id ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.2)}`,
                          background: selectedPaymentMethod === method.id ? 
                            alpha(theme.palette.primary.main, 0.05) : 'white',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            border: `2px solid ${theme.palette.primary.main}`,
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[8]
                          }
                        }}
                        onClick={() => handlePaymentMethodSelect(method.id)}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <Typography variant="h2" sx={{ mb: 1 }}>
                            {method.icon}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {method.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {method.description}
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="primary.main" fontWeight="bold">
                              Fee: {method.fee === 0 ? 'Free' : formatCurrency(method.fee)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Processing: {method.processingTime}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            )}

            {/* Step 2: Payment Processing */}
            {currentStep === 2 && selectedLevel && selectedPaymentMethod && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box textAlign="center">
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Complete Payment
                  </Typography>
                  
                  <Box sx={{ mb: 4 }}>
                    <Card sx={{ maxWidth: 400, mx: 'auto', p: 3, border: `2px solid ${selectedLevel.color}` }}>
                      <Typography variant="h6" gutterBottom>Payment Summary</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Assessment Level:</Typography>
                        <Typography fontWeight="bold">{selectedLevel.name}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Price:</Typography>
                        <Typography fontWeight="bold">{formatCurrency(selectedLevel.price)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Attempts Included:</Typography>
                        <Typography fontWeight="bold">3</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography>Payment Method:</Typography>
                        <Typography fontWeight="bold">
                          {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="h6">Total:</Typography>
                        <Typography variant="h6" fontWeight="bold" color={selectedLevel.color}>
                          {formatCurrency(selectedLevel.price)}
                        </Typography>
                      </Box>
                    </Card>
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Payment />}
                    onClick={handlePayment}
                    disabled={processingPayment}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      background: selectedLevel.gradient
                    }}
                  >
                    {processingPayment ? 'Processing...' : `Pay ${formatCurrency(selectedLevel.price)}`}
                  </Button>

                  {processingPayment && (
                    <Box sx={{ mt: 3 }}>
                      <LinearProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Processing your payment...
                      </Typography>
                    </Box>
                  )}
                </Box>
              </motion.div>
            )}

            {/* Step 2.5: Approval Waiting */}
            {currentStep === 2.5 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box textAlign="center">
                  <Avatar sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 3,
                    bgcolor: 'warning.main',
                    animation: 'pulse 2s infinite'
                  }}>
                    <Schedule sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Payment Received - Awaiting Approval
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Your payment has been processed successfully. Our team is reviewing your request 
                    and will approve it shortly. You'll receive a notification once approved.
                  </Typography>
                  <LinearProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Typical approval time: 1-5 minutes
                  </Typography>
                </Box>
              </motion.div>
            )}

            {/* Step 3: Job Selection */}
            {currentStep === 3 && selectedLevel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box textAlign="center">
                  <Avatar sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 3,
                    bgcolor: 'success.main',
                    background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'
                  }}>
                    <CheckCircle sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Assessment Ready!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Your {selectedLevel.name} assessment has been approved and is ready to use. 
                    You have {getRemainingAttempts(selectedLevel.id)} attempts remaining.
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                    <Typography variant="body2">
                      <strong>Next Steps:</strong><br />
                      1. Select a job from our database or provide job details<br />
                      2. Our AI will generate a customized assessment<br />
                      3. Complete your personalized psychometric test<br />
                      4. Receive detailed insights and recommendations
                    </Typography>
                  </Alert>

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<ArrowForward />}
                    onClick={handleJobSelection}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      background: selectedLevel.gradient
                    }}
                  >
                    Select Job & Generate Test
                  </Button>
                </Box>
              </motion.div>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          {currentStep > 0 && currentStep < 3 && (
            <Button 
              onClick={() => setCurrentStep(currentStep - 1)}
              variant="outlined"
            >
              Back
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowNotification(false)} 
          severity="success"
          variant="filled"
          sx={{ minWidth: 300 }}
        >
          <Typography variant="body2">{notificationMessage}</Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default CustomAssessmentDialog;