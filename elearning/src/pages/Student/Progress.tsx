import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  School,
  Quiz,
  VideoCall
} from '@mui/icons-material';
import { EmojiEvents as Certificate } from '@mui/icons-material';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { enhancedAssessmentService } from '../../services/enhancedAssessmentService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`progress-tabpanel-${index}`}
      aria-labelledby={`progress-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StudentProgress: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [courseProgressDetails, setCourseProgressDetails] = useState<any[]>([]);

  // Load progress data
  useEffect(() => {
    const loadProgressData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch enrolled courses and progress
        const [coursesResponse, enrollmentsResponse] = await Promise.all([
          courseService.getEnrolledCourses(),
          enrollmentService.getMyEnrollments()
        ]);

        const enrolledCourses = coursesResponse.courses || [];
        const enrollments = enrollmentsResponse.enrollments || [];

        // Load detailed progress for each course
        const progressPromises = enrolledCourses.map(async (course: any) => {
          try {
            return await enhancedAssessmentService.getStudentCourseProgress(course._id);
          } catch (err) {
            console.warn(`Failed to load progress for course ${course._id}:`, err);
            return null;
          }
        });

        const courseProgressResults = await Promise.all(progressPromises);
        setCourseProgressDetails(courseProgressResults.filter(Boolean));

        // Calculate progress statistics
        const totalCourses = coursesResponse.courses?.length || 0;
        const completedCourses = enrollmentsResponse.enrollments?.filter(e => e.isCompleted).length || 0;
        const averageProgress = enrollmentsResponse.enrollments?.length > 0
          ? enrollmentsResponse.enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollmentsResponse.enrollments.length
          : 0;

        // Calculate enhanced statistics
        const validProgressResults = courseProgressResults.filter(progress => progress && progress.progress);
        const totalAssessments = validProgressResults.reduce((sum, progress) => 
          sum + (progress.progress?.assessments?.total || 0), 0);
        const completedAssessments = validProgressResults.reduce((sum, progress) => 
          sum + (progress.progress?.assessments?.completed || 0), 0);
        const totalSessions = validProgressResults.reduce((sum, progress) => 
          sum + (progress.progress?.sessions?.total || 0), 0);
        const attendedSessions = validProgressResults.reduce((sum, progress) => 
          sum + (progress.progress?.sessions?.attended || 0), 0);
        const eligibleCertificates = validProgressResults.filter(progress => 
          progress.progress?.requirements?.isEligibleForCertificate).length;

        setProgressData({
          totalCourses,
          completedCourses,
          averageProgress: Math.round(averageProgress),
          totalPoints: completedCourses * 100,
          totalAssessments,
          completedAssessments,
          totalSessions,
          attendedSessions,
          eligibleCertificates,
          averageScore: completedAssessments > 0 
            ? validProgressResults.reduce((sum, progress) => 
                sum + (progress.progress?.assessments?.averageScore || 0), 0) / completedAssessments
            : 0
        });

      } catch (err: any) {
        setError(err.message || 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, [user]);

  // Mock data for charts
  const performanceData = [
    { name: 'Week 1', score: 85 },
    { name: 'Week 2', score: 78 },
    { name: 'Week 3', score: 92 },
    { name: 'Week 4', score: 88 },
    { name: 'Week 5', score: 95 },
    { name: 'Week 6', score: 91 }
  ];

  const achievements = [
    { id: '1', name: 'First Course Completed', icon: '🎓', date: '2024-01-15', points: 100 },
    { id: '2', name: 'Quiz Master', icon: '🏆', date: '2024-01-20', points: 250 },
    { id: '3', name: 'Perfect Attendance', icon: '📅', date: '2024-01-25', points: 150 },
    { id: '4', name: 'Early Bird', icon: '🐦', date: '2024-01-28', points: 75 },
    { id: '5', name: 'Study Streak', icon: '🔥', date: '2024-02-01', points: 200 }
  ];

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Progress
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your learning journey and achievements
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Enhanced Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <School color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{progressData?.totalCourses || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enrolled Courses
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
                <Quiz color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{progressData?.completedAssessments || 0}/{progressData?.totalAssessments || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assessments Completed
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
                <VideoCall color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{progressData?.attendedSessions || 0}/{progressData?.totalSessions || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sessions Attended
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
                  <Typography variant="h4">{progressData?.eligibleCertificates || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Eligible Certificates
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Course Details" />
          <Tab label="Assessments" />
          <Tab label="Attendance" />
          <Tab label="Achievements" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Overview
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Progress Summary
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Overall Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progressData?.averageProgress || 0}
                    sx={{ mb: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {progressData?.averageProgress || 0}% Complete
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Score
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {Math.round(progressData?.averageScore || 0)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Points Earned
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {progressData?.totalPoints || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Course Details Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          {courseProgressDetails.map((courseProgress, index) => (
            <Grid item xs={12} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{courseProgress.courseTitle}</Typography>
                    <Chip
                      label={`${courseProgress.progress.overall}% Complete`}
                      color={courseProgress.progress.overall >= 80 ? 'success' : 'primary'}
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Assessment Progress
                      </Typography>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {courseProgress.progress.assessments.completed}/{courseProgress.progress.assessments.total}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={courseProgress.progress.assessments.total > 0 
                            ? (courseProgress.progress.assessments.completed / courseProgress.progress.assessments.total) * 100 
                            : 0}
                          sx={{ flexGrow: 1, mr: 1 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Average Score: {courseProgress.progress.assessments.averageScore}%
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Session Attendance
                      </Typography>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {courseProgress.progress.sessions.attended}/{courseProgress.progress.sessions.total}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={courseProgress.progress.sessions.attendanceRate}
                          sx={{ flexGrow: 1, mr: 1 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Attendance Rate: {courseProgress.progress.sessions.attendanceRate}%
                      </Typography>
                    </Grid>
                  </Grid>

                  {courseProgress.progress.requirements.isEligibleForCertificate && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      🎉 You are eligible for a certificate in this course!
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Assessments Tab */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Assessment History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Assessment</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courseProgressDetails.flatMap(courseProgress => 
                    courseProgress.progress.assessments.submissions
                      .filter((submission: any) => submission.submission)
                      .map((submission: any) => (
                        <TableRow key={submission.assessmentId}>
                          <TableCell>{courseProgress.courseTitle}</TableCell>
                          <TableCell>{submission.title}</TableCell>
                          <TableCell>
                            <Chip 
                              label={submission.type} 
                              size="small" 
                              color={submission.type === 'quiz' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>
                            {submission.submission.score ? `${submission.submission.score}%` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={submission.submission.status} 
                              size="small" 
                              color={submission.submission.status === 'completed' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            {submission.submission.submittedAt 
                              ? format(new Date(submission.submission.submittedAt), 'MMM dd, yyyy')
                              : 'N/A'
                            }
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Attendance Tab */}
      <TabPanel value={activeTab} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Session Attendance
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Session</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courseProgressDetails.flatMap(courseProgress => 
                    courseProgress.progress.sessions.records.map((record: any) => (
                      <TableRow key={record._id}>
                        <TableCell>{courseProgress.courseTitle}</TableCell>
                        <TableCell>{record.session?.title || 'N/A'}</TableCell>
                        <TableCell>
                          {record.session?.scheduledTime 
                            ? format(new Date(record.session.scheduledTime), 'MMM dd, yyyy HH:mm')
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          {record.session?.duration ? `${record.session.duration} min` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={record.status} 
                            size="small" 
                            color={record.status === 'present' ? 'success' : 
                                   record.status === 'late' ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Achievements Tab */}
      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          {achievements.map((achievement) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="h2" sx={{ mr: 2 }}>
                      {achievement.icon}
                    </Typography>
                    <Box>
                      <Typography variant="h6">{achievement.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.date}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    +{achievement.points} points earned
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default StudentProgress;
