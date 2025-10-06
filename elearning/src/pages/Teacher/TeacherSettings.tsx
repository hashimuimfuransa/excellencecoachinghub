import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Person,
  Settings,
  School,
  Assessment,
  EmojiEvents,
  TrendingUp,
  AccessTime,
  Star,
  BookmarkBorder,
  Assignment,
  Grade,
  Timeline,
  Notifications,
  Language,
  Palette,
  Security,
  Visibility,
  People,
  BarChart,
  CheckCircle,
  Cancel,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { apiService } from '../../services/apiService';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface StudentData {
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    createdAt: string;
    lastLogin?: string;
  };
  courses: Array<{
    course: {
      _id: string;
      title: string;
    };
    progressPercentage: number;
    totalPoints: number;
    timeSpent: number;
    isCompleted: boolean;
    completionDate?: string;
    lastAccessed: string;
    streakDays: number;
  }>;
  examAttempts: Array<{
    quiz: {
      _id: string;
      title: string;
    };
    score: number;
    percentage: number;
    status: string;
    submittedAt: string;
    timeSpent: number;
    gradeLetter: string;
  }>;
  averageProgress: number;
  averageScore: number;
  totalCourses: number;
  completedCourses: number;
  totalExams: number;
  passedExams: number;
  totalPoints: number;
  totalTimeSpent: number;
  uniqueBadges: number;
}

interface TeacherStudentsData {
  students: StudentData[];
  totalStudents: number;
  courses: Array<{
    _id: string;
    title: string;
    enrollmentCount: number;
  }>;
  summary: {
    totalStudents: number;
    averageProgress: number;
    averageScore: number;
    totalTimeSpent: number;
  };
}

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    role: string;
  };
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    theme: string;
    language: string;
  };
}

const TeacherSettings: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('md') || '(max-width: 900px)');
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [studentsData, setStudentsData] = useState<TeacherStudentsData | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    avatar: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [studentsResponse, settingsResponse] = await Promise.all([
        apiService.get<TeacherStudentsData>('/settings/teacher/students'),
        apiService.get<UserSettings>('/settings/user')
      ]);

      if (studentsResponse.success) {
        setStudentsData(studentsResponse.data);
      }

      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
        setProfileForm({
          firstName: settingsResponse.data.profile.firstName,
          lastName: settingsResponse.data.profile.lastName,
          avatar: settingsResponse.data.profile.avatar || ''
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiService.put('/settings/user', {
        profile: profileForm
      });

      if (response.success) {
        setSuccess('Profile updated successfully!');
        setSettings(prev => prev ? {
          ...prev,
          profile: {
            ...prev.profile,
            ...profileForm
          }
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    try {
      const updatedPreferences = {
        emailNotifications: settings?.preferences.emailNotifications ?? true,
        pushNotifications: settings?.preferences.pushNotifications ?? true,
        theme: settings?.preferences.theme ?? 'light',
        language: settings?.preferences.language ?? 'en',
        [key]: value
      };

      const response = await apiService.put('/settings/user', {
        preferences: updatedPreferences
      });

      if (response.success) {
        setSettings(prev => prev ? {
          ...prev,
          preferences: updatedPreferences
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  };

  const handleViewStudentDetails = async (student: StudentData) => {
    try {
      const response = await apiService.get(`/settings/teacher/students/${student.student._id}`);
      if (response.success) {
        setSelectedStudent(response.data);
        setStudentDetailOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student details');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    if (percentage >= 60) return 'secondary';
    return 'error';
  };

  const getPerformanceStatus = (averageScore: number) => {
    if (averageScore >= 85) return { label: 'Excellent', color: 'success' };
    if (averageScore >= 75) return { label: 'Good', color: 'info' };
    if (averageScore >= 65) return { label: 'Average', color: 'warning' };
    return { label: 'Needs Improvement', color: 'error' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teacher Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            aria-label="settings tabs"
          >
            <Tab icon={<Person />} label="Profile" />
            <Tab 
              icon={
                <Badge badgeContent={studentsData?.totalStudents || 0} color="primary">
                  <People />
                </Badge>
              } 
              label="My Students" 
            />
            <Tab icon={<BarChart />} label="Analytics" />
            <Tab icon={<Settings />} label="Preferences" />
          </Tabs>
        </Box>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={settings?.profile.avatar}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  >
                    {settings?.profile.firstName?.[0]}{settings?.profile.lastName?.[0]}
                  </Avatar>
                  <Typography variant="h6">
                    {settings?.profile.firstName} {settings?.profile.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {settings?.profile.email}
                  </Typography>
                  <Chip 
                    label={settings?.profile.role?.toUpperCase()} 
                    color="primary" 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Edit Profile
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          lastName: e.target.value
                        }))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Avatar URL"
                        value={profileForm.avatar}
                        onChange={(e) => setProfileForm(prev => ({
                          ...prev,
                          avatar: e.target.value
                        }))}
                        helperText="Enter a URL for your profile picture"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={handleProfileUpdate}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : <Person />}
                      >
                        {saving ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* My Students Tab */}
        <TabPanel value={tabValue} index={1}>
          {studentsData && (
            <Grid container spacing={3}>
              {/* Summary Cards */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Students Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <People color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">{studentsData.summary.totalStudents}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Students
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">
                          {studentsData.summary.averageProgress.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg Progress
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Grade color="warning" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">
                          {studentsData.summary.averageScore.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg Score
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <AccessTime color="info" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">
                          {formatTime(studentsData.summary.totalTimeSpent)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Study Time
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* Students Table */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Student Performance
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell align="center">Courses</TableCell>
                            <TableCell align="center">Progress</TableCell>
                            <TableCell align="center">Avg Score</TableCell>
                            <TableCell align="center">Study Time</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {studentsData.students.map((studentData) => {
                            const status = getPerformanceStatus(studentData.averageScore);
                            return (
                              <TableRow key={studentData.student._id}>
                                <TableCell>
                                  <Box display="flex" alignItems="center">
                                    <Avatar
                                      src={studentData.student.avatar}
                                      sx={{ width: 40, height: 40, mr: 2 }}
                                    >
                                      {studentData.student.firstName[0]}{studentData.student.lastName[0]}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="subtitle2">
                                        {studentData.student.firstName} {studentData.student.lastName}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {studentData.student.email}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">
                                    {studentData.completedCourses}/{studentData.totalCourses}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Box>
                                    <Typography variant="body2" gutterBottom>
                                      {studentData.averageProgress.toFixed(1)}%
                                    </Typography>
                                    <LinearProgress
                                      variant="determinate"
                                      value={studentData.averageProgress}
                                      sx={{ width: 80 }}
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={`${studentData.averageScore.toFixed(1)}%`}
                                    color={getGradeColor(studentData.averageScore) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">
                                    {formatTime(studentData.totalTimeSpent)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={status.label}
                                    color={status.color as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewStudentDetails(studentData)}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          {studentsData && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Course Analytics
                    </Typography>
                    <Grid container spacing={2}>
                      {studentsData.courses.map((course) => (
                        <Grid item xs={12} sm={6} md={4} key={course._id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" gutterBottom>
                                {course.title}
                              </Typography>
                              <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">
                                  Enrolled Students
                                </Typography>
                                <Chip
                                  label={course.enrollmentCount}
                                  color="primary"
                                  size="small"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Distribution
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="success.main">
                            {studentsData.students.filter(s => s.averageScore >= 85).length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Excellent (85%+)
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="info.main">
                            {studentsData.students.filter(s => s.averageScore >= 75 && s.averageScore < 85).length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Good (75-84%)
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="warning.main">
                            {studentsData.students.filter(s => s.averageScore >= 65 && s.averageScore < 75).length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Average (65-74%)
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="error.main">
                            {studentsData.students.filter(s => s.averageScore < 65).length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Needs Help (&lt;65%)
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Notifications
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.preferences.emailNotifications || false}
                        onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.preferences.pushNotifications || false}
                        onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                      />
                    }
                    label="Push Notifications"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Palette sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Appearance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Theme and language preferences will be available in future updates.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Student Detail Dialog */}
      <Dialog
        open={studentDetailOpen}
        onClose={() => setStudentDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Student Performance Details
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    src={selectedStudent.student.avatar}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  >
                    {selectedStudent.student.firstName[0]}{selectedStudent.student.lastName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedStudent.student.firstName} {selectedStudent.student.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStudent.student.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Course Progress
                </Typography>
                {selectedStudent.courses.map((courseProgress) => (
                  <Box key={courseProgress.course._id} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body1">
                        {courseProgress.course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {courseProgress.progressPercentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={courseProgress.progressPercentage}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        {courseProgress.totalPoints} points • {formatTime(courseProgress.timeSpent)}
                      </Typography>
                      {courseProgress.isCompleted && (
                        <Chip label="Completed" color="success" size="small" />
                      )}
                    </Box>
                  </Box>
                ))}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Recent Exam Results
                </Typography>
                <List>
                  {selectedStudent.examAttempts.slice(0, 5).map((exam, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={exam.quiz.title}
                        secondary={`Score: ${exam.percentage.toFixed(1)}% • ${new Date(exam.submittedAt).toLocaleDateString()}`}
                      />
                      <Chip
                        label={exam.gradeLetter}
                        color={getGradeColor(exam.percentage) as any}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDetailOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherSettings;