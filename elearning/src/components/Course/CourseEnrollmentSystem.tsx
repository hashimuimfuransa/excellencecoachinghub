import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Stack,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  School,
  Person,
  Email,
  Phone,
  CalendarToday,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  Info,
  Warning,
  Error,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
  Share,
  Download,
  Upload,
  Sync,
  Refresh,
  Search,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
  FitScreen,
  AspectRatio,
  Crop,
  CropFree,
  CropSquare,
  CropPortrait,
  CropLandscape,
  CropRotate,
  RotateLeft,
  RotateRight,
  Flip,
  Transform,
  Straighten,
  Tune,
  Filter,
  FilterAlt,
  SortByAlpha,
  ArrowUpward,
  ArrowDownward,
  KeyboardArrowUp,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  ExpandLess,
  ExpandMore,
  UnfoldMore,
  UnfoldLess,
  CheckCircleOutline,
  Cancel,
  Close,
  Done,
  DoneAll,
  Send,
  Reply,
  Forward,
  Archive,
  Unarchive,
  Flag,
  Report,
  Block,
  Unblock,
  PersonAdd,
  PersonRemove,
  GroupAdd,
  GroupRemove,
  AdminPanelSettings,
  Security,
  PrivacyTip,
  Verified,
  VerifiedUser,
  Gavel,
  Balance,
  Scale,
  GpsFixed,
  LocationOn,
  MyLocation,
  Directions,
  Map,
  Terrain,
  Satellite,
  Streetview,
  Timeline,
  History,
  Event,
  EventNote,
  EventAvailable,
  EventBusy,
  Today,
  DateRange,
  CalendarMonth,
  CalendarViewDay,
  CalendarViewWeek,
  CalendarViewMonth,
  CalendarToday as CalendarTodayIcon,
  Timer,
  HourglassEmpty,
  HourglassFull,
  WatchLater,
  Update,
  Cached,
  Autorenew,
  Loop,
  Shuffle,
  Repeat,
  RepeatOne,
  FastRewind,
  FastForward,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  Computer,
  Business,
  DesignServices,
  Language,
  Science,
  Engineering,
  HealthAndSafety,
  Attractions,
  MusicNote,
  Palette,
  Build,
  Biotech,
  AccountBalance,
  Restaurant,
  DirectionsCar,
  Flight,
  Hotel,
  ShoppingCart,
  Pets,
  Nature,
  WbSunny,
  Cloud,
  Water,
  Eco,
  Recycling,
  Park,
  Forest,
  Beach,
  Mountain,
  City,
  Home,
  Work,
  Favorite,
  ThumbUp,
  Comment,
  Bookmark as BookmarkIcon,
  MoreVert,
  ContentCopy,
  OpenInNew,
  GetApp,
  CloudUpload,
  CloudDownload,
  SyncProblem,
  Notifications,
  NotificationsOff,
  MenuBook,
  VideoCall,
  Assignment,
  Quiz,
  Description,
  Psychology,
  Group,
  People,
  Analytics,
  Settings,
  Grade,
  TrendingUp,
  EmojiEvents,
  LocalLibrary,
  AutoStories,
  Lightbulb,
  Rocket,
  Diamond,
  WorkspacePremium,
  MilitaryTech,
  PsychologyAlt
} from '@mui/icons-material';

// Styled Components
const EnrollmentCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[8],
    transform: 'translateY(-4px)',
  },
}));

const StepCard = styled(Paper)(({ theme, isActive }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  border: `2px solid ${isActive ? theme.palette.primary.main : alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
  transition: 'all 0.3s ease',
}));

// Interfaces
interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    name: string;
    avatar?: string;
    bio: string;
  };
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  price: number;
  thumbnail?: string;
  features: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  curriculum: CurriculumItem[];
  reviews: Review[];
  rating: number;
  enrollmentCount: number;
}

interface CurriculumItem {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'live';
  duration: number;
  description: string;
}

interface Review {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
}

interface EnrollmentData {
  courseId: string;
  studentInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    education?: string;
    experience?: string;
    goals?: string;
  };
  paymentInfo: {
    method: 'card' | 'paypal' | 'bank_transfer';
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    billingAddress?: string;
  };
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    smsUpdates: boolean;
    marketingEmails: boolean;
  };
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

interface CourseEnrollmentSystemProps {
  courseId: string;
  onEnrollmentComplete: (enrollmentId: string) => void;
}

const CourseEnrollmentSystem: React.FC<CourseEnrollmentSystemProps> = ({
  courseId,
  onEnrollmentComplete
}) => {
  const theme = useTheme();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({
    courseId,
    studentInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      education: '',
      experience: '',
      goals: ''
    },
    paymentInfo: {
      method: 'card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      billingAddress: ''
    },
    preferences: {
      notifications: true,
      emailUpdates: true,
      smsUpdates: false,
      marketingEmails: false
    },
    termsAccepted: false,
    privacyAccepted: false
  });
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  // Load course data
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mock data - replace with actual API call
        const mockCourse: Course = {
          id: courseId,
          title: 'Complete Web Development Bootcamp',
          description: 'Learn full-stack web development from scratch with modern technologies including React, Node.js, and MongoDB.',
          instructor: {
            name: 'Dr. Sarah Johnson',
            avatar: '/avatars/instructor.jpg',
            bio: 'Senior Software Engineer with 10+ years of experience in web development and teaching.'
          },
          category: 'Programming',
          level: 'beginner',
          duration: 120,
          price: 299,
          thumbnail: '/course-thumbnails/web-dev.jpg',
          features: [
            '40+ hours of video content',
            'Hands-on projects',
            'Live Q&A sessions',
            'Certificate of completion',
            'Lifetime access',
            'Mobile and desktop access'
          ],
          prerequisites: [
            'Basic computer skills',
            'No programming experience required',
            'Willingness to learn'
          ],
          learningOutcomes: [
            'Build responsive websites',
            'Create web applications',
            'Understand frontend and backend development',
            'Deploy applications to the cloud',
            'Work with databases',
            'Implement user authentication'
          ],
          curriculum: [
            {
              id: 'module-1',
              title: 'HTML & CSS Fundamentals',
              type: 'video',
              duration: 8,
              description: 'Learn the basics of web markup and styling'
            },
            {
              id: 'module-2',
              title: 'JavaScript Basics',
              type: 'video',
              duration: 12,
              description: 'Master JavaScript programming fundamentals'
            },
            {
              id: 'module-3',
              title: 'React Development',
              type: 'video',
              duration: 15,
              description: 'Build modern user interfaces with React'
            },
            {
              id: 'module-4',
              title: 'Node.js Backend',
              type: 'video',
              duration: 10,
              description: 'Create server-side applications with Node.js'
            },
            {
              id: 'module-5',
              title: 'Database Integration',
              type: 'video',
              duration: 8,
              description: 'Work with MongoDB and database design'
            },
            {
              id: 'module-6',
              title: 'Final Project',
              type: 'assignment',
              duration: 20,
              description: 'Build a complete full-stack application'
            }
          ],
          reviews: [
            {
              id: 'review-1',
              studentName: 'John Doe',
              rating: 5,
              comment: 'Excellent course! The instructor explains everything clearly and the projects are very practical.',
              date: '2024-01-15'
            },
            {
              id: 'review-2',
              studentName: 'Jane Smith',
              rating: 5,
              comment: 'Great value for money. I learned so much and now I have a job as a web developer!',
              date: '2024-01-10'
            }
          ],
          rating: 4.8,
          enrollmentCount: 1250
        };

        setCourse(mockCourse);
      } catch (err) {
        console.error('Error loading course data:', err);
        setError('Failed to load course information');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  // Handle step navigation
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  // Handle form data changes
  const handleStudentInfoChange = (field: string, value: string) => {
    setEnrollmentData(prev => ({
      ...prev,
      studentInfo: {
        ...prev.studentInfo,
        [field]: value
      }
    }));
  };

  const handlePaymentInfoChange = (field: string, value: string) => {
    setEnrollmentData(prev => ({
      ...prev,
      paymentInfo: {
        ...prev.paymentInfo,
        [field]: value
      }
    }));
  };

  const handlePreferencesChange = (field: string, value: boolean) => {
    setEnrollmentData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  // Handle enrollment submission
  const handleEnrollmentSubmit = async () => {
    try {
      setEnrolling(true);
      
      // TODO: Implement API call to process enrollment
      console.log('Processing enrollment:', enrollmentData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEnrollmentSuccess(true);
      onEnrollmentComplete('enrollment-123');
    } catch (err) {
      console.error('Error processing enrollment:', err);
      setError('Failed to process enrollment. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  // Validation
  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return enrollmentData.studentInfo.firstName && 
               enrollmentData.studentInfo.lastName && 
               enrollmentData.studentInfo.email;
      case 1:
        return enrollmentData.paymentInfo.method === 'card' ? 
               enrollmentData.paymentInfo.cardNumber && 
               enrollmentData.paymentInfo.expiryDate && 
               enrollmentData.paymentInfo.cvv :
               true;
      case 2:
        return enrollmentData.termsAccepted && enrollmentData.privacyAccepted;
      default:
        return true;
    }
  };

  const steps = [
    'Student Information',
    'Payment Details',
    'Terms & Conditions',
    'Confirmation'
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading course information...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={() => window.location.reload()}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!course) {
    return (
      <Alert severity="info">
        Course not found. Please check the URL and try again.
      </Alert>
    );
  }

  if (enrollmentSuccess) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Enrollment Successful!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Welcome to {course.title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            You have successfully enrolled in the course. Check your email for confirmation and next steps.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<School />}
            onClick={() => window.location.href = `/course/${courseId}/learn`}
          >
            Start Learning
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Course Overview */}
      <EnrollmentCard sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                {course.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {course.description}
              </Typography>
              
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Chip
                  icon={<Person />}
                  label={course.instructor.name}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={course.category}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  label={course.level}
                  color="info"
                  variant="outlined"
                />
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {course.duration}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duration
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {course.rating}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rating
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                      {course.enrollmentCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Students
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      ${course.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Price
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  ${course.price}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  One-time payment
                </Typography>
                
                <List dense>
                  {course.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </EnrollmentCard>

      {/* Enrollment Steps */}
      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  onClick={() => handleStepClick(index)}
                  sx={{ cursor: 'pointer' }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box sx={{ minHeight: '400px' }}>
            {/* Step 0: Student Information */}
            {activeStep === 0 && (
              <StepCard isActive={activeStep === 0}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Student Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name"
                      value={enrollmentData.studentInfo.firstName}
                      onChange={(e) => handleStudentInfoChange('firstName', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name"
                      value={enrollmentData.studentInfo.lastName}
                      onChange={(e) => handleStudentInfoChange('lastName', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      type="email"
                      value={enrollmentData.studentInfo.email}
                      onChange={(e) => handleStudentInfoChange('email', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number"
                      value={enrollmentData.studentInfo.phone}
                      onChange={(e) => handleStudentInfoChange('phone', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date of Birth"
                      type="date"
                      value={enrollmentData.studentInfo.dateOfBirth}
                      onChange={(e) => handleStudentInfoChange('dateOfBirth', e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Education Level</InputLabel>
                      <Select
                        value={enrollmentData.studentInfo.education}
                        label="Education Level"
                        onChange={(e) => handleStudentInfoChange('education', e.target.value)}
                      >
                        <MenuItem value="high_school">High School</MenuItem>
                        <MenuItem value="bachelor">Bachelor's Degree</MenuItem>
                        <MenuItem value="master">Master's Degree</MenuItem>
                        <MenuItem value="phd">PhD</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Previous Experience"
                      value={enrollmentData.studentInfo.experience}
                      onChange={(e) => handleStudentInfoChange('experience', e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Tell us about your previous experience in this field..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Learning Goals"
                      value={enrollmentData.studentInfo.goals}
                      onChange={(e) => handleStudentInfoChange('goals', e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="What do you hope to achieve from this course?"
                    />
                  </Grid>
                </Grid>
              </StepCard>
            )}

            {/* Step 1: Payment Details */}
            {activeStep === 1 && (
              <StepCard isActive={activeStep === 1}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Payment Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        value={enrollmentData.paymentInfo.method}
                        label="Payment Method"
                        onChange={(e) => handlePaymentInfoChange('method', e.target.value)}
                      >
                        <MenuItem value="card">Credit/Debit Card</MenuItem>
                        <MenuItem value="paypal">PayPal</MenuItem>
                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {enrollmentData.paymentInfo.method === 'card' && (
                    <>
                      <Grid item xs={12}>
                        <TextField
                          label="Card Number"
                          value={enrollmentData.paymentInfo.cardNumber}
                          onChange={(e) => handlePaymentInfoChange('cardNumber', e.target.value)}
                          fullWidth
                          placeholder="1234 5678 9012 3456"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Expiry Date"
                          value={enrollmentData.paymentInfo.expiryDate}
                          onChange={(e) => handlePaymentInfoChange('expiryDate', e.target.value)}
                          fullWidth
                          placeholder="MM/YY"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="CVV"
                          value={enrollmentData.paymentInfo.cvv}
                          onChange={(e) => handlePaymentInfoChange('cvv', e.target.value)}
                          fullWidth
                          placeholder="123"
                        />
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Billing Address"
                      value={enrollmentData.paymentInfo.billingAddress}
                      onChange={(e) => handlePaymentInfoChange('billingAddress', e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </StepCard>
            )}

            {/* Step 2: Terms & Conditions */}
            {activeStep === 2 && (
              <StepCard isActive={activeStep === 2}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Terms & Conditions
                </Typography>
                
                <Paper sx={{ p: 3, mb: 3, maxHeight: '300px', overflowY: 'auto' }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Course Terms and Conditions</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    1. By enrolling in this course, you agree to complete all required assignments and assessments.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    2. Course materials are for personal use only and may not be shared or redistributed.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    3. Refunds are available within 30 days of enrollment if less than 20% of the course is completed.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    4. You must maintain academic integrity and complete all work independently.
                  </Typography>
                  <Typography variant="body2">
                    5. The instructor reserves the right to modify course content and schedule as needed.
                  </Typography>
                </Paper>

                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={enrollmentData.termsAccepted}
                        onChange={(e) => setEnrollmentData(prev => ({
                          ...prev,
                          termsAccepted: e.target.checked
                        }))}
                      />
                    }
                    label="I agree to the Terms and Conditions"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={enrollmentData.privacyAccepted}
                        onChange={(e) => setEnrollmentData(prev => ({
                          ...prev,
                          privacyAccepted: e.target.checked
                        }))}
                      />
                    }
                    label="I agree to the Privacy Policy"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={enrollmentData.preferences.notifications}
                        onChange={(e) => handlePreferencesChange('notifications', e.target.checked)}
                      />
                    }
                    label="Receive course notifications"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={enrollmentData.preferences.emailUpdates}
                        onChange={(e) => handlePreferencesChange('emailUpdates', e.target.checked)}
                      />
                    }
                    label="Receive email updates about the course"
                  />
                </Stack>
              </StepCard>
            )}

            {/* Step 3: Confirmation */}
            {activeStep === 3 && (
              <StepCard isActive={activeStep === 3}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Confirmation
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Student Information
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Name:</strong> {enrollmentData.studentInfo.firstName} {enrollmentData.studentInfo.lastName}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Email:</strong> {enrollmentData.studentInfo.email}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Phone:</strong> {enrollmentData.studentInfo.phone || 'Not provided'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Education:</strong> {enrollmentData.studentInfo.education || 'Not specified'}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Course Details
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Course:</strong> {course.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Instructor:</strong> {course.instructor.name}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Duration:</strong> {course.duration} hours
                      </Typography>
                      <Typography variant="body2">
                        <strong>Price:</strong> ${course.price}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </StepCard>
            )}
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleEnrollmentSubmit}
                disabled={enrolling || !isStepValid(activeStep)}
                startIcon={enrolling ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {enrolling ? 'Processing...' : 'Complete Enrollment'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid(activeStep)}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CourseEnrollmentSystem;
