import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Button
} from '@mui/material';
import {
  TrendingUp,
  People,
  School,
  Star,
  AccessTime,
  Assignment,
  CheckCircle,
  Timeline,
  BarChart,
  PieChart,
  VideoCall,
  Grade,
  Person
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { enhancedAssessmentService } from '../../services/enhancedAssessmentService';
import { useNavigate } from 'react-router-dom';

interface AnalyticsData {
  totalStudents: number;
  totalCourses: number;
  averageRating: number;
  totalRevenue: number;
  coursePerformance: {
    courseId: string;
    courseName: string;
    enrollments: number;
    completionRate: number;
    averageProgress: number;
    rating: number;
  }[];
  monthlyStats: {
    month: string;
    enrollments: number;
    revenue: number;
    completions: number;
  }[];
  topPerformingCourses: {
    courseId: string;
    courseName: string;
    metric: number;
    metricType: 'enrollments' | 'rating' | 'completion';
  }[];
}

const TeacherAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courseProgressData, setCourseProgressData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Load teacher's courses and analytics
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Load teacher's courses
        const coursesResponse = await courseService.getTeacherCourses({
          instructor: user._id
        });

        setCourses(coursesResponse.courses);

        // Calculate analytics data
        const totalStudents = coursesResponse.courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0);
        const totalCourses = coursesResponse.courses.length;
        const averageRating = 4.5; // This would come from actual ratings

        setAnalyticsData({
          totalStudents,
          totalCourses,
          averageRating,
          totalRevenue: totalStudents * 50, // Mock revenue calculation
          coursePerformance: coursesResponse.courses.map(course => ({
            courseId: course._id,
            courseName: course.title,
            enrollments: course.enrollmentCount || 0,
            completionRate: Math.random() * 100, // Mock data
            averageProgress: Math.random() * 100, // Mock data
            rating: 4.5 // Mock data
          })),
          monthlyStats: [
            { month: 'Jan', enrollments: 15, revenue: 750, completions: 8 },
            { month: 'Feb', enrollments: 22, revenue: 1100, completions: 12 },
            { month: 'Mar', enrollments: 18, revenue: 900, completions: 10 },
            { month: 'Apr', enrollments: 25, revenue: 1250, completions: 15 },
            { month: 'May', enrollments: 30, revenue: 1500, completions: 20 },
            { month: 'Jun', enrollments: 28, revenue: 1400, completions: 18 }
          ],
          topPerformingCourses: coursesResponse.courses.slice(0, 5).map(course => ({
            courseId: course._id,
            courseName: course.title,
            metric: course.enrollmentCount || 0,
            metricType: 'enrollments'
          }))
        });

      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [user]);

  // Load course progress data when course is selected
  useEffect(() => {
    const loadCourseProgress = async () => {
      if (!selectedCourse) {
        setCourseProgressData(null);
        return;
      }

      try {
        const progressData = await enhancedAssessmentService.getTeacherCourseProgress(selectedCourse);
        setCourseProgressData(progressData);
      } catch (err: any) {
        console.error('Failed to load course progress:', err);
        setError('Failed to load course progress data');
      }
    };

    loadCourseProgress();
  }, [selectedCourse]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Teacher Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your courses, student progress, and performance metrics
        </Typography>
      </Box>

      {/* Course Selection */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Course for Detailed Analysis
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Course</InputLabel>
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              label="Course"
            >
              <MenuItem value="">
                    <em>Select a course</em>
                  </MenuItem>
              {courses.map((course) => (
                <MenuItem key={course._id} value={course._id}>
                  {course.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      {analyticsData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <People color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{analyticsData.totalStudents}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Students
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <School color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{analyticsData.totalCourses}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Courses
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Star color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{analyticsData.averageRating}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Rating
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">${analyticsData.totalRevenue}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Course Progress Details */}
      {courseProgressData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {courseProgressData.courseTitle} - Progress Overview
                </Typography>
                
                {/* Course Overview Stats */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {courseProgressData.overview.totalStudents}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Students
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {courseProgressData.overview.completedStudents}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {courseProgressData.overview.completionRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completion Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {courseProgressData.overview.averageProgress}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Progress
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Student Progress Table */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Student Progress
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Time Spent</TableCell>
                        <TableCell>Points</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Activity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {courseProgressData.studentProgress.map((student: any) => (
                        <TableRow key={student.studentId}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Person sx={{ mr: 1 }} />
                              {student.studentName}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" sx={{ mr: 1 }}>
                                {student.progressPercentage}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={student.progressPercentage}
                                sx={{ width: 100, height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {Math.round(student.totalTimeSpent / 60)}h {student.totalTimeSpent % 60}m
                          </TableCell>
                          <TableCell>{student.totalPoints}</TableCell>
                          <TableCell>
                            <Chip
                              label={student.isCompleted ? 'Completed' : 'In Progress'}
                              color={student.isCompleted ? 'success' : 'primary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {student.lastAccessed ? new Date(student.lastAccessed).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Assessment Statistics */}
                {courseProgressData.assessmentStats.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Assessment Statistics
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Assessment</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Submissions</TableCell>
                            <TableCell>Average Score</TableCell>
                            <TableCell>Pass Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {courseProgressData.assessmentStats.map((assessment: any) => (
                            <TableRow key={assessment.assessmentId}>
                              <TableCell>{assessment.title}</TableCell>
                              <TableCell>
                                <Chip
                                  label={assessment.type}
                                  size="small"
                                  color={assessment.type === 'quiz' ? 'primary' : 'secondary'}
                                />
                              </TableCell>
                              <TableCell>{assessment.totalSubmissions}</TableCell>
                              <TableCell>{assessment.averageScore}%</TableCell>
                              <TableCell>{assessment.passRate}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Course Performance Overview */}
      {analyticsData && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Course Performance
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Course</TableCell>
                        <TableCell>Enrollments</TableCell>
                        <TableCell>Completion Rate</TableCell>
                        <TableCell>Average Progress</TableCell>
                        <TableCell>Rating</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.coursePerformance.map((course) => (
                        <TableRow key={course.courseId}>
                          <TableCell>{course.courseName}</TableCell>
                          <TableCell>{course.enrollments}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" sx={{ mr: 1 }}>
                                {course.completionRate.toFixed(1)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={course.completionRate}
                                sx={{ width: 100, height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" sx={{ mr: 1 }}>
                                {course.averageProgress.toFixed(1)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={course.averageProgress}
                                sx={{ width: 100, height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Star color="warning" sx={{ mr: 0.5 }} />
                              {course.rating}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <List>
                  <ListItem button onClick={() => navigate('/teacher/courses')}>
                    <ListItemIcon>
                      <School />
                    </ListItemIcon>
                    <ListItemText primary="Manage Courses" />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/teacher/assessments')}>
                    <ListItemIcon>
                      <Assignment />
                    </ListItemIcon>
                    <ListItemText primary="Create Assessment" />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/teacher/live-sessions')}>
                    <ListItemIcon>
                      <VideoCall />
                    </ListItemIcon>
                    <ListItemText primary="Schedule Session" />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/teacher/students')}>
                    <ListItemIcon>
                      <People />
                    </ListItemIcon>
                    <ListItemText primary="View Students" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default TeacherAnalytics;
