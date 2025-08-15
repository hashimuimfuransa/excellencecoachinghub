import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface TestData {
  userRole: string;
  enrollmentCount: number;
  enrollments: Array<{
    courseTitle: string;
    enrollmentType: string;
    paymentStatus: string;
    enrolledAt: string;
  }>;
  availableCourses: Array<{
    title: string;
    notesPrice: number;
    liveSessionPrice: number;
    enrollmentDeadline: string;
  }>;
}

const EnrollmentTest: React.FC = () => {
  const { user } = useAuth();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/test/enrollment-test', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTestData(data.data);
      } else {
        throw new Error(data.error || 'Test failed');
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setError(err.message || 'Failed to run test');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      runTest();
    }
  }, [user]);

  if (!user) {
    return (
      <Alert severity="warning">
        Please log in to run the enrollment test.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Enrollment System Test
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={runTest} 
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={20} /> : 'Run Test'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {testData && (
        <Grid container spacing={3}>
          {/* User Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Information
                </Typography>
                <Typography variant="body1">
                  <strong>Role:</strong> {testData.userRole}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Enrollments:</strong> {testData.enrollmentCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Current Enrollments */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Enrollments
                </Typography>
                {testData.enrollments.length === 0 ? (
                  <Typography color="text.secondary">
                    No enrollments found
                  </Typography>
                ) : (
                  testData.enrollments.map((enrollment, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        {enrollment.courseTitle}
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
                        <Chip 
                          label={enrollment.enrollmentType} 
                          size="small" 
                          color="primary" 
                        />
                        <Chip 
                          label={enrollment.paymentStatus} 
                          size="small" 
                          color={enrollment.paymentStatus === 'completed' ? 'success' : 'warning'}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </Typography>
                      {index < testData.enrollments.length - 1 && <Divider sx={{ mt: 1 }} />}
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Available Courses */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Courses
                </Typography>
                {testData.availableCourses.length === 0 ? (
                  <Typography color="text.secondary">
                    No approved courses available
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {testData.availableCourses.map((course, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              {course.title}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Notes Price:</strong> RWF {course.notesPrice?.toLocaleString() || 'Not set'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Live Sessions Price:</strong> RWF {course.liveSessionPrice?.toLocaleString() || 'Not set'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Bundle Price:</strong> RWF {course.notesPrice && course.liveSessionPrice 
                                ? (course.notesPrice + course.liveSessionPrice * 0.8).toLocaleString()
                                : 'Not available'
                              }
                            </Typography>
                            {course.enrollmentDeadline && (
                              <Typography variant="caption" color="text.secondary">
                                Enrollment ends: {new Date(course.enrollmentDeadline).toLocaleDateString()}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default EnrollmentTest;