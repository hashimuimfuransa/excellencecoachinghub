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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
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
  Person,
  EmojiEvents,
  AdminPanelSettings
} from '@mui/icons-material';
import { EmojiEvents as Certificate } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { enhancedAssessmentService } from '../../services/enhancedAssessmentService';
import { useNavigate } from 'react-router-dom';

interface AdminProgressData {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    totalEnrollments: number;
    completedCourses: number;
    completionRate: number;
    averageProgress: number;
    totalTimeSpent: number;
    totalPoints: number;
  };
  topCourses: any[];
  topStudents: any[];
}

const AnalyticsReports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<AdminProgressData | null>(null);

  // Load admin progress data
  useEffect(() => {
    const loadAdminProgress = async () => {
      if (!user || user.role !== 'admin') return;

      try {
        setLoading(true);
        setError(null);

        const data = await enhancedAssessmentService.getAdminProgressOverview();
        setProgressData(data);

      } catch (err: any) {
        setError(err.message || 'Failed to load admin progress data');
      } finally {
        setLoading(false);
      }
    };

    loadAdminProgress();
  }, [user]);

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
          System Analytics & Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive overview of platform performance and student progress
        </Typography>
      </Box>

      {/* System Overview */}
      {progressData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <People color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{progressData.overview.totalStudents}</Typography>
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
                    <Typography variant="h4">{progressData.overview.totalCourses}</Typography>
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
                  <Certificate color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{progressData.overview.completedCourses}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed Courses
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
                    <Typography variant="h4">{progressData.overview.completionRate}%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completion Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Detailed Statistics */}
      {progressData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Additional Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="primary">
                        {progressData.overview.totalTeachers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Teachers
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="success.main">
                        {progressData.overview.averageProgress}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Progress
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="info.main">
                        {Math.round(progressData.overview.totalTimeSpent)}h
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Time Spent
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="warning.main">
                        {progressData.overview.totalPoints}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Points Earned
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <List>
                  <ListItem button onClick={() => navigate('/admin/user-management')}>
                    <ListItemIcon>
                      <People />
                    </ListItemIcon>
                    <ListItemText primary="User Management" />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/admin/course-management')}>
                    <ListItemIcon>
                      <School />
                    </ListItemIcon>
                    <ListItemText primary="Course Management" />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/admin/teacher-management')}>
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    <ListItemText primary="Teacher Management" />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/admin/proctoring-monitoring')}>
                    <ListItemIcon>
                      <VideoCall />
                    </ListItemIcon>
                    <ListItemText primary="Proctoring Monitoring" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Top Performing Courses */}
      {progressData && progressData.topCourses.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Performing Courses
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Average Progress</TableCell>
                    <TableCell>Total Students</TableCell>
                    <TableCell>Completed Students</TableCell>
                    <TableCell>Completion Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {progressData.topCourses.map((course) => (
                    <TableRow key={course.courseId}>
                      <TableCell>
                        <Typography variant="subtitle2">{course.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {course.averageProgress}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={course.averageProgress}
                            sx={{ width: 100, height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{course.totalStudents}</TableCell>
                      <TableCell>{course.completedStudents}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${course.completionRate}%`}
                          color={course.completionRate >= 80 ? 'success' : 
                                 course.completionRate >= 60 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Students */}
      {progressData && progressData.topStudents.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Performing Students
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Total Points</TableCell>
                    <TableCell>Average Progress</TableCell>
                    <TableCell>Completed Courses</TableCell>
                    <TableCell>Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {progressData.topStudents.map((student, index) => (
                    <TableRow key={student.studentId}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: index === 0 ? 'gold' : 
                                             index === 1 ? 'silver' : '#cd7f32',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              mr: 1
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography variant="subtitle2">{student.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" color="success.main">
                          {student.totalPoints}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {student.averageProgress}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={student.averageProgress}
                            sx={{ width: 100, height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{student.completedCourses}</TableCell>
                      <TableCell>
                        <Chip
                          label={student.averageProgress >= 90 ? 'Excellent' :
                                 student.averageProgress >= 80 ? 'Good' :
                                 student.averageProgress >= 70 ? 'Average' : 'Needs Improvement'}
                          color={student.averageProgress >= 90 ? 'success' :
                                 student.averageProgress >= 80 ? 'primary' :
                                 student.averageProgress >= 70 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* System Health Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Platform Status"
                    secondary="All systems operational"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <VideoCall color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Video Services"
                    secondary="Agora.io and 100ms active"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Assignment color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Assessment System"
                    secondary="AI grading operational"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Certificate color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Certificate Generation"
                    secondary="PDF generation active"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmojiEvents color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="New Certificate Issued"
                    secondary="Student completed Advanced JavaScript course"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <School color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="New Course Published"
                    secondary="React Advanced Patterns by Dr. Smith"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Person color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="New Teacher Approved"
                    secondary="Sarah Johnson - Web Development"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Grade color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Assessment Completed"
                    secondary="25 students completed Database Design quiz"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AnalyticsReports;
