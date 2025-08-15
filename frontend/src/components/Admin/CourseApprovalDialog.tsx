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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Switch,
  FormControlLabel,
  DateTimePicker
} from '@mui/material';
import {
  AttachMoney,
  VideoCall,
  MenuBook,
  Schedule,
  Warning,
  CheckCircle,
  Cancel,
  Info
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker as MuiDateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category: string;
  level: string;
  duration: number;
  status: string;
  createdAt: string;
}

interface CourseApprovalDialogProps {
  open: boolean;
  course: Course | null;
  onClose: () => void;
  onApprove: (courseId: string, approvalData: ApprovalData) => void;
  onReject: (courseId: string, reason: string) => void;
  loading?: boolean;
}

interface ApprovalData {
  notesPrice: number;
  liveSessionPrice: number;
  enrollmentDeadline: Date | null;
  courseStartDate: Date | null;
  maxEnrollments?: number;
  enableEarlyBird?: boolean;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: Date | null;
}

const CourseApprovalDialog: React.FC<CourseApprovalDialogProps> = ({
  open,
  course,
  onClose,
  onApprove,
  onReject,
  loading = false
}) => {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalData, setApprovalData] = useState<ApprovalData>({
    notesPrice: 0,
    liveSessionPrice: 0,
    enrollmentDeadline: null,
    courseStartDate: null,
    maxEnrollments: 100,
    enableEarlyBird: false,
    earlyBirdPrice: 0,
    earlyBirdDeadline: null
  });

  const handleClose = () => {
    setAction(null);
    setRejectionReason('');
    setApprovalData({
      notesPrice: 0,
      liveSessionPrice: 0,
      enrollmentDeadline: null,
      courseStartDate: null,
      maxEnrollments: 100,
      enableEarlyBird: false,
      earlyBirdPrice: 0,
      earlyBirdDeadline: null
    });
    onClose();
  };

  const handleApprove = () => {
    if (course) {
      onApprove(course._id, approvalData);
      handleClose();
    }
  };

  const handleReject = () => {
    if (course && rejectionReason.trim()) {
      onReject(course._id, rejectionReason);
      handleClose();
    }
  };

  const updateApprovalData = (field: keyof ApprovalData, value: any) => {
    setApprovalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!course) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Course Approval</Typography>
            <Chip
              label={course.status.toUpperCase()}
              color={course.status === 'pending' ? 'warning' : 'default'}
              variant="outlined"
            />
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Course Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                {course.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {course.description}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Instructor:</strong> {course.instructor.firstName} {course.instructor.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Email:</strong> {course.instructor.email}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Category:</strong> {course.category}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Level:</strong> {course.level}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {course.duration} hours
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Submitted:</strong> {new Date(course.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Action Selection */}
          {!action && (
            <Box display="flex" gap={2} mb={3}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => setAction('approve')}
                fullWidth
              >
                Approve Course
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Cancel />}
                onClick={() => setAction('reject')}
                fullWidth
              >
                Reject Course
              </Button>
            </Box>
          )}

          {/* Approval Form */}
          {action === 'approve' && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Set the pricing structure and enrollment settings for this course. 
                  Students will be able to choose between notes access and live session access.
                </Typography>
              </Alert>

              <Grid container spacing={3}>
                {/* Pricing Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoney color="primary" />
                    Pricing Structure
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Notes Access Price"
                    type="number"
                    value={approvalData.notesPrice}
                    onChange={(e) => updateApprovalData('notesPrice', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">RWF</InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <MenuBook color="primary" />
                        </InputAdornment>
                      )
                    }}
                    helperText="Price for accessing all course notes and materials"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Live Sessions Price"
                    type="number"
                    value={approvalData.liveSessionPrice}
                    onChange={(e) => updateApprovalData('liveSessionPrice', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">RWF</InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <VideoCall color="primary" />
                        </InputAdornment>
                      )
                    }}
                    helperText="Price for accessing live sessions and recordings"
                  />
                </Grid>

                {/* Early Bird Pricing */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={approvalData.enableEarlyBird}
                        onChange={(e) => updateApprovalData('enableEarlyBird', e.target.checked)}
                      />
                    }
                    label="Enable Early Bird Pricing"
                  />
                </Grid>

                {approvalData.enableEarlyBird && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Early Bird Discount (%)"
                        type="number"
                        value={approvalData.earlyBirdPrice}
                        onChange={(e) => updateApprovalData('earlyBirdPrice', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                        inputProps={{ min: 0, max: 50 }}
                        helperText="Discount percentage for early enrollments"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <MuiDateTimePicker
                        label="Early Bird Deadline"
                        value={approvalData.earlyBirdDeadline}
                        onChange={(date) => updateApprovalData('earlyBirdDeadline', date)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </Grid>
                  </>
                )}

                {/* Schedule Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <Schedule color="primary" />
                    Course Schedule
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <MuiDateTimePicker
                    label="Enrollment Deadline"
                    value={approvalData.enrollmentDeadline}
                    onChange={(date) => updateApprovalData('enrollmentDeadline', date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        helperText="When enrollment closes for this course"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <MuiDateTimePicker
                    label="Course Start Date"
                    value={approvalData.courseStartDate}
                    onChange={(date) => updateApprovalData('courseStartDate', date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        helperText="When the course officially begins"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Maximum Enrollments"
                    type="number"
                    value={approvalData.maxEnrollments}
                    onChange={(e) => updateApprovalData('maxEnrollments', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 1, max: 1000 }}
                    helperText="Maximum number of students that can enroll"
                  />
                </Grid>

                {/* Pricing Summary */}
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: 'grey.50', mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Pricing Summary
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Notes Access:</strong> RWF {approvalData.notesPrice.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Live Sessions:</strong> RWF {approvalData.liveSessionPrice.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Both (Bundle):</strong> RWF {(approvalData.notesPrice + approvalData.liveSessionPrice * 0.8).toLocaleString()}
                            <Chip label="20% off" size="small" color="success" sx={{ ml: 1 }} />
                          </Typography>
                        </Grid>
                        {approvalData.enableEarlyBird && (
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Early Bird Discount:</strong> {approvalData.earlyBirdPrice}% off
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Rejection Form */}
          {action === 'reject' && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Please provide a clear reason for rejection. This will help the instructor improve their course.
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Rejection Reason"
                multiline
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this course is being rejected and what needs to be improved..."
                required
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          
          {action === 'approve' && (
            <Button
              onClick={handleApprove}
              variant="contained"
              color="success"
              disabled={loading || !approvalData.enrollmentDeadline || !approvalData.courseStartDate}
              startIcon={<CheckCircle />}
            >
              {loading ? 'Approving...' : 'Approve Course'}
            </Button>
          )}
          
          {action === 'reject' && (
            <Button
              onClick={handleReject}
              variant="contained"
              color="error"
              disabled={loading || !rejectionReason.trim()}
              startIcon={<Cancel />}
            >
              {loading ? 'Rejecting...' : 'Reject Course'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CourseApprovalDialog;