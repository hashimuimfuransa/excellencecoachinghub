import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  AttachMoney,
  VideoCall,
  MenuBook,
  CheckCircle,
  Schedule,
  Group,
  Star,
  AccessTime,
  School,
  LiveTv,
  Description,
  Download,
  Quiz,
  Assignment,
  EmojiEvents,
  Savings
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const PricingCard = styled(Card)(({ theme, selected }: { theme: any; selected: boolean }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  transform: selected ? 'scale(1.02)' : 'scale(1)',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
  }
}));

const FeatureList = styled(List)(({ theme }) => ({
  '& .MuiListItem-root': {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5)
  }
}));

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: {
    firstName: string;
    lastName: string;
  };
  category: string;
  level: string;
  duration: number;
  notesPrice: number;
  liveSessionPrice: number;
  enrollmentDeadline: string;
  courseStartDate: string;
  rating: number;
  enrollmentCount: number;
  maxEnrollments?: number;
}

interface CourseEnrollmentDialogProps {
  open: boolean;
  course: Course | null;
  onClose: () => void;
  onEnroll: (courseId: string, enrollmentType: 'notes' | 'live_sessions' | 'both', amount: number) => void;
  loading?: boolean;
}

type EnrollmentType = 'notes' | 'live_sessions' | 'both';

const CourseEnrollmentDialog: React.FC<CourseEnrollmentDialogProps> = ({
  open,
  course,
  onClose,
  onEnroll,
  loading = false
}) => {
  const [selectedType, setSelectedType] = useState<EnrollmentType>('both');

  if (!course) return null;

  const bundlePrice = course.notesPrice + course.liveSessionPrice * 0.8; // 20% discount on bundle
  const savings = (course.notesPrice + course.liveSessionPrice) - bundlePrice;

  const getPrice = (type: EnrollmentType): number => {
    switch (type) {
      case 'notes':
        return course.notesPrice;
      case 'live_sessions':
        return course.liveSessionPrice;
      case 'both':
        return bundlePrice;
      default:
        return 0;
    }
  };

  const handleEnroll = () => {
    const amount = getPrice(selectedType);
    onEnroll(course._id, selectedType, amount);
  };

  const isEnrollmentOpen = new Date() < new Date(course.enrollmentDeadline);
  const enrollmentProgress = course.maxEnrollments 
    ? (course.enrollmentCount / course.maxEnrollments) * 100 
    : 0;

  const notesFeatures = [
    'Access to all course materials',
    'Downloadable PDF notes',
    'Interactive assignments',
    'Progress tracking',
    'Certificate upon completion',
    'Lifetime access to materials'
  ];

  const liveSessionFeatures = [
    'Live interactive sessions',
    'Real-time Q&A with instructor',
    'Session recordings',
    'Group discussions',
    'Live coding/demonstrations',
    'Personalized feedback'
  ];

  const bothFeatures = [
    ...notesFeatures,
    ...liveSessionFeatures,
    '20% discount on bundle',
    'Priority support',
    'Exclusive bonus materials'
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h5" gutterBottom>
            Enroll in {course.title}
          </Typography>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Chip
              icon={<School />}
              label={`${course.instructor.firstName} ${course.instructor.lastName}`}
              variant="outlined"
            />
            <Chip
              icon={<Star />}
              label={`${course.rating}/5 (${course.enrollmentCount} students)`}
              variant="outlined"
            />
            <Chip
              icon={<AccessTime />}
              label={`${course.duration} hours`}
              variant="outlined"
            />
            <Chip
              label={course.level}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Enrollment Status */}
        <Alert 
          severity={isEnrollmentOpen ? "info" : "warning"} 
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            {isEnrollmentOpen ? (
              <>
                <strong>Enrollment closes:</strong> {new Date(course.enrollmentDeadline).toLocaleDateString()} at {new Date(course.enrollmentDeadline).toLocaleTimeString()}
                <br />
                <strong>Course starts:</strong> {new Date(course.courseStartDate).toLocaleDateString()}
              </>
            ) : (
              'Enrollment for this course has closed.'
            )}
          </Typography>
          {course.maxEnrollments && (
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">
                  <strong>Enrollment Progress:</strong>
                </Typography>
                <Typography variant="body2">
                  {course.enrollmentCount} / {course.maxEnrollments} students
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={enrollmentProgress} 
                color={enrollmentProgress > 90 ? "error" : enrollmentProgress > 70 ? "warning" : "primary"}
              />
            </Box>
          )}
        </Alert>

        {/* Course Description */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="body1" paragraph>
            {course.description}
          </Typography>
        </Paper>

        {/* Pricing Options */}
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Choose Your Learning Path
        </Typography>

        <RadioGroup
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as EnrollmentType)}
        >
          <Grid container spacing={3}>
            {/* Notes Only */}
            <Grid item xs={12} md={4}>
              <FormControlLabel
                value="notes"
                control={<Radio sx={{ display: 'none' }} />}
                label=""
                sx={{ m: 0, width: '100%' }}
              />
              <PricingCard selected={selectedType === 'notes'} onClick={() => setSelectedType('notes')}>
                <CardContent>
                  <Box textAlign="center" mb={2}>
                    <MenuBook color="primary" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Notes & Materials
                    </Typography>
                    <Typography variant="h4" color="primary" gutterBottom>
                      RWF {course.notesPrice.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Self-paced learning
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <FeatureList dense>
                    {notesFeatures.map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </FeatureList>
                </CardContent>
              </PricingCard>
            </Grid>

            {/* Live Sessions Only */}
            <Grid item xs={12} md={4}>
              <FormControlLabel
                value="live_sessions"
                control={<Radio sx={{ display: 'none' }} />}
                label=""
                sx={{ m: 0, width: '100%' }}
              />
              <PricingCard selected={selectedType === 'live_sessions'} onClick={() => setSelectedType('live_sessions')}>
                <CardContent>
                  <Box textAlign="center" mb={2}>
                    <VideoCall color="primary" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      Live Sessions
                    </Typography>
                    <Typography variant="h4" color="primary" gutterBottom>
                      RWF {course.liveSessionPrice.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Interactive learning
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <FeatureList dense>
                    {liveSessionFeatures.map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </FeatureList>
                </CardContent>
              </PricingCard>
            </Grid>

            {/* Both (Bundle) */}
            <Grid item xs={12} md={4}>
              <FormControlLabel
                value="both"
                control={<Radio sx={{ display: 'none' }} />}
                label=""
                sx={{ m: 0, width: '100%' }}
              />
              <PricingCard selected={selectedType === 'both'} onClick={() => setSelectedType('both')}>
                <CardContent>
                  <Box textAlign="center" mb={2}>
                    <Box position="relative" display="inline-block">
                      <EmojiEvents color="primary" sx={{ fontSize: 48, mb: 1 }} />
                      <Chip
                        label="BEST VALUE"
                        color="success"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -20,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      Complete Package
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        RWF {(course.notesPrice + course.liveSessionPrice).toLocaleString()}
                      </Typography>
                      <Chip
                        icon={<Savings />}
                        label={`Save RWF ${savings.toLocaleString()}`}
                        color="success"
                        size="small"
                      />
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      RWF {bundlePrice.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Everything included
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <FeatureList dense>
                    {bothFeatures.slice(0, 6).map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    <ListItem>
                      <ListItemText 
                        primary={`+ ${bothFeatures.length - 6} more features`}
                        primaryTypographyProps={{ 
                          variant: 'body2', 
                          fontStyle: 'italic',
                          color: 'text.secondary'
                        }}
                      />
                    </ListItem>
                  </FeatureList>
                </CardContent>
              </PricingCard>
            </Grid>
          </Grid>
        </RadioGroup>

        {/* Payment Summary */}
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="h6" gutterBottom>
            Payment Summary
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body1">
              {selectedType === 'notes' && 'Notes & Materials Access'}
              {selectedType === 'live_sessions' && 'Live Sessions Access'}
              {selectedType === 'both' && 'Complete Package (Notes + Live Sessions)'}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              RWF {getPrice(selectedType).toLocaleString()}
            </Typography>
          </Box>
          {selectedType === 'both' && (
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              You save RWF {savings.toLocaleString()} with the bundle!
            </Typography>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleEnroll}
          variant="contained"
          size="large"
          disabled={loading || !isEnrollmentOpen}
          startIcon={<AttachMoney />}
          sx={{ minWidth: 200 }}
        >
          {loading ? 'Processing...' : `Enroll for RWF ${getPrice(selectedType).toLocaleString()}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseEnrollmentDialog;