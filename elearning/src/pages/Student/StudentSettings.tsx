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
  ListItemIcon,
  Tab,
  Tabs,
  useTheme,
  useMediaQuery
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
  Security
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

interface StudentPerformance {
  overview: {
    totalCourses: number;
    completedCourses: number;
    totalPoints: number;
    totalTimeSpent: number;
    averageProgress: number;
    totalExams: number;
    passedExams: number;
    averageScore: number;
    totalBadges: number;
  };
  courses: Array<{
    course: {
      _id: string;
      title: string;
      thumbnail?: string;
    };
    progressPercentage: number;
    totalPoints: number;
    timeSpent: number;
    isCompleted: boolean;
    completionDate?: string;
    lastAccessed: string;
    streakDays: number;
  }>;
  examHistory: Array<{
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
    attemptNumber: number;
  }>;
  badges: Array<{
    _id: string;
    name: string;
    icon: string;
    points: number;
    type: string;
  }>;
  recentActivity: Array<{
    type: string;
    title: string;
    progress?: number;
    score?: number;
    date: string;
  }>;
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

const StudentSettings: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [performance, setPerformance] = useState<StudentPerformance | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
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

      const [performanceResponse, settingsResponse] = await Promise.all([
        apiService.get<StudentPerformance>('/settings/student/performance'),
        apiService.get<UserSettings>('/settings/user')
      ]);

      if (performanceResponse.success) {
        setPerformance(performanceResponse.data);
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
        Student Settings
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
            <Tab icon={<TrendingUp />} label="Performance" />
            <Tab icon={<Assessment />} label="Exam History" />
            <Tab icon={<EmojiEvents />} label="Achievements" />
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

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={1}>
          {performance && (
            <Grid container spacing={3}>
              {/* Overview Cards */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Performance Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">{performance.overview.totalCourses}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Courses
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Star color="warning" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">{performance.overview.totalPoints}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Points
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <AccessTime color="info" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">
                          {formatTime(performance.overview.totalTimeSpent)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Study Time
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Grade color="success" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4">
                          {performance.overview.averageScore.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Average Score
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* Course Progress */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Course Progress
                    </Typography>
                    {performance.courses.map((courseProgress) => (
                      <Box key={courseProgress.course._id} sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle1">
                            {courseProgress.course.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {courseProgress.progressPercentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={courseProgress.progressPercentage}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Box display="flex" justifyContent="space-between" mt={1}>
                          <Typography variant="caption" color="text.secondary">
                            {courseProgress.totalPoints} points • {formatTime(courseProgress.timeSpent)}
                          </Typography>
                          {courseProgress.isCompleted && (
                            <Chip label="Completed" color="success" size="small" />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Activity */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    <List>
                      {performance.recentActivity.slice(0, 5).map((activity, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {activity.type === 'course_progress' ? <BookmarkBorder /> : <Assignment />}
                          </ListItemIcon>
                          <ListItemText
                            primary={activity.title}
                            secondary={new Date(activity.date).toLocaleDateString()}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Exam History Tab */}
        <TabPanel value={tabValue} index={2}>
          {performance && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Exam History
                </Typography>
                <Grid container spacing={2}>
                  {performance.examHistory.map((exam, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {exam.quiz.title}
                          </Typography>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Chip
                              label={`${exam.percentage.toFixed(1)}%`}
                              color={getGradeColor(exam.percentage) as any}
                              size="small"
                            />
                            <Typography variant="h6" color={getGradeColor(exam.percentage) === 'error' ? 'error' : 'success'}>
                              {exam.gradeLetter}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Score: {exam.score} points
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Time: {formatTime(exam.timeSpent)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Attempt: #{exam.attemptNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(exam.submittedAt).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Achievements Tab */}
        <TabPanel value={tabValue} index={3}>
          {performance && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Earned Badges
                    </Typography>
                    <Grid container spacing={2}>
                      {performance.badges.map((badge) => (
                        <Grid item xs={6} sm={4} md={3} key={badge._id}>
                          <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                            <EmojiEvents color="warning" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="subtitle2" gutterBottom>
                              {badge.name}
                            </Typography>
                            <Chip
                              label={`${badge.points} pts`}
                              color="primary"
                              size="small"
                            />
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    {performance.badges.length === 0 && (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                        No badges earned yet. Keep learning to unlock achievements!
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={4}>
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
    </Container>
  );
};

export default StudentSettings;