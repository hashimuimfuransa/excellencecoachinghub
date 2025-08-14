import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  LinearProgress,
  Paper,
  AppBar,
  Toolbar,
  Tab,
  Tabs,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Badge,
  Tooltip,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  School,
  Assignment,
  Quiz,
  Star,
  Person,
  Group,
  Analytics,
  Timeline,
  CheckCircle,
  Cancel,
  AccessTime,
  Grade,
  Leaderboard,
  WorkspacePremium as Medal,
  EmojiEvents as Trophy,
  WorkspacePremium,
  Celebration,
  AutoAwesome,
  Psychology,
  Speed,
  GpsFixed as Target,
  Insights,
  BarChart,
  PieChart,
  ShowChart,
  Refresh,
  FilterList,
  Download,
  Email,
  Feedback,
  Edit,
  Visibility,
  ArrowBack,
  Dashboard,
  TrendingFlat,
  LocalFireDepartment,
  Bolt,
  FlashOn,
  Search,
  GetApp,
  Print,
  Send,
  Comment,
  PersonAdd,
  Class,
  MenuBook,
  AdminPanelSettings,
  SupervisorAccount,
  ManageAccounts,
  Assessment,
  AssignmentTurnedIn
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { gradesService, StudentGrade, LeaderboardEntry, GradesFilter, LeaderboardFilter } from '../../services/gradesService';
import { courseService } from '../../services/courseService';
import { assessmentService } from '../../services/assessmentService';
import { assignmentService } from '../../services/assignmentService';

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
      id={`admin-leaderboard-tabpanel-${index}`}
      aria-labelledby={`admin-leaderboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface Course {
  _id: string;
  title: string;
  description: string;
  enrolledStudents: number;
  instructor: {
    firstName: string;
    lastName: string;
  };
}

interface AssessmentItem {
  _id: string;
  title: string;
  courseId: string;
  courseName: string;
  totalPoints: number;
  submissions: number;
}

interface AssignmentItem {
  _id: string;
  title: string;
  courseId: string;
  courseName: string;
  maxPoints: number;
  submissions: number;
}

const AdminLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [courseLeaderboards, setCourseLeaderboards] = useState<{ [courseId: string]: LeaderboardEntry[] }>({});
  const [assessmentLeaderboards, setAssessmentLeaderboards] = useState<{ [assessmentId: string]: LeaderboardEntry[] }>({});
  const [assignmentLeaderboards, setAssignmentLeaderboards] = useState<{ [assignmentId: string]: LeaderboardEntry[] }>({});
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Filters
  const [overallFilter, setOverallFilter] = useState<LeaderboardFilter>({
    type: 'overall',
    timeFilter: 'all',
    limit: 100
  });
  
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');

  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null);

  // Load data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOverallLeaderboard();
  }, [overallFilter]);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseLeaderboard(selectedCourse);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedAssessment) {
      loadAssessmentLeaderboard(selectedAssessment);
    }
  }, [selectedAssessment]);

  useEffect(() => {
    if (selectedAssignment) {
      loadAssignmentLeaderboard(selectedAssignment);
    }
  }, [selectedAssignment]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all courses
      const coursesResponse = await courseService.getAllCourses();
      setCourses(coursesResponse.courses || []);

      // Load all assessments
      const assessmentsResponse = await assessmentService.getAllAssessments();
      setAssessments(assessmentsResponse.assessments || []);

      // Load all assignments
      const assignmentsResponse = await assignmentService.getAllAssignments();
      setAssignments(assignmentsResponse.assignments || []);

      // Load overall leaderboard
      await loadOverallLeaderboard();

    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadOverallLeaderboard = async () => {
    try {
      const leaderboardData = await gradesService.getAdminLeaderboard(overallFilter);
      setOverallLeaderboard(leaderboardData);
    } catch (err: any) {
      console.error('Failed to load overall leaderboard:', err);
      setError(err.message || 'Failed to load overall leaderboard');
    }
  };

  const loadCourseLeaderboard = async (courseId: string) => {
    try {
      const leaderboardData = await gradesService.getCourseLeaderboard(courseId, { limit: 100 });
      setCourseLeaderboards(prev => ({ ...prev, [courseId]: leaderboardData }));
    } catch (err: any) {
      console.error('Failed to load course leaderboard:', err);
      setError(err.message || 'Failed to load course leaderboard');
    }
  };

  const loadAssessmentLeaderboard = async (assessmentId: string) => {
    try {
      const leaderboardData = await gradesService.getAssessmentLeaderboard(assessmentId, { limit: 100 });
      setAssessmentLeaderboards(prev => ({ ...prev, [assessmentId]: leaderboardData }));
    } catch (err: any) {
      console.error('Failed to load assessment leaderboard:', err);
      setError(err.message || 'Failed to load assessment leaderboard');
    }
  };

  const loadAssignmentLeaderboard = async (assignmentId: string) => {
    try {
      const leaderboardData = await gradesService.getAssignmentLeaderboard(assignmentId, { limit: 100 });
      setAssignmentLeaderboards(prev => ({ ...prev, [assignmentId]: leaderboardData }));
    } catch (err: any) {
      console.error('Failed to load assignment leaderboard:', err);
      setError(err.message || 'Failed to load assignment leaderboard');
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Get rank display
  const getRankDisplay = (rank: number) => {
    return gradesService.getRankDisplay(rank);
  };

  // Handle student details
  const handleViewStudentDetails = (student: LeaderboardEntry) => {
    setSelectedStudent(student);
    setDetailsDialogOpen(true);
  };

  // Export leaderboard
  const handleExportLeaderboard = () => {
    console.log('Exporting leaderboard...');
  };

  // Render leaderboard entry
  const renderLeaderboardEntry = (entry: LeaderboardEntry, showCourse: boolean = false) => {
    const rankDisplay = getRankDisplay(entry.rank);
    
    return (
      <Card 
        key={entry.studentId}
        sx={{ 
          mb: 2,
          border: '1px solid',
          borderColor: entry.rank <= 3 ? 'warning.main' : 'grey.300',
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Rank and Avatar */}
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                  <Typography variant="h3" sx={{ fontSize: '2.5rem' }}>
                    {rankDisplay.icon}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: rankDisplay.color }}>
                    #{entry.rank}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  width: 56, 
                  height: 56,
                  bgcolor: entry.rank <= 3 ? 'primary.main' : 'grey.400',
                  fontSize: '1.5rem'
                }}>
                  {entry.studentName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {entry.studentName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entry.studentEmail}
                  </Typography>
                  {showCourse && entry.courseName && (
                    <Typography variant="caption" color="text.secondary">
                      {entry.courseName}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Performance Stats */}
            <Grid item xs={12} sm={5}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {entry.averageScore}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Average Score
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {entry.totalPoints}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Points
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {entry.completedAssessments}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Assessments
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {entry.completedAssignments}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Assignments
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Badges and Actions */}
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Streak */}
                {entry.streak > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 0.5,
                    bgcolor: 'warning.50',
                    borderRadius: 1
                  }}>
                    <LocalFireDepartment sx={{ color: 'warning.main', mr: 0.5, fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {entry.streak} day streak
                    </Typography>
                  </Box>
                )}

                {/* Badges */}
                {entry.badges.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                    {entry.badges.slice(0, 2).map((badge, badgeIndex) => (
                      <Chip
                        key={badgeIndex}
                        label={badge}
                        size="small"
                        color="primary"
                        variant="outlined"
                        icon={<Star />}
                      />
                    ))}
                    {entry.badges.length > 2 && (
                      <Chip
                        label={`+${entry.badges.length - 2}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewStudentDetails(entry)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Send Message">
                    <IconButton size="small">
                      <Send />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard/admin')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <AdminPanelSettings color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            Admin Leaderboards & Performance Analytics
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExportLeaderboard}
            sx={{ mr: 2 }}
          >
            Export Data
          </Button>
          
          <IconButton onClick={loadInitialData} color="primary">
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Error/Success Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {overallLeaderboard.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {courses.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Courses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {assessments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Assessments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {assignments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Assignments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <AppBar position="static" color="default" elevation={0}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                icon={<EmojiEvents />}
                label="Overall Leaderboard"
                id="admin-leaderboard-tab-0"
                aria-controls="admin-leaderboard-tabpanel-0"
              />
              <Tab
                icon={<School />}
                label="Course Leaderboards"
                id="admin-leaderboard-tab-1"
                aria-controls="admin-leaderboard-tabpanel-1"
              />
              <Tab
                icon={<Quiz />}
                label="Assessment Leaderboards"
                id="admin-leaderboard-tab-2"
                aria-controls="admin-leaderboard-tabpanel-2"
              />
              <Tab
                icon={<Assignment />}
                label="Assignment Leaderboards"
                id="admin-leaderboard-tab-3"
                aria-controls="admin-leaderboard-tabpanel-3"
              />
              <Tab
                icon={<Analytics />}
                label="System Analytics"
                id="admin-leaderboard-tab-4"
                aria-controls="admin-leaderboard-tabpanel-4"
              />
            </Tabs>
          </AppBar>

          {/* Overall Leaderboard Tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={overallFilter.type || 'overall'}
                  label="Type"
                  onChange={(e) => setOverallFilter(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="overall">Overall Performance</MenuItem>
                  <MenuItem value="assessment">Assessment Scores</MenuItem>
                  <MenuItem value="assignment">Assignment Scores</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={overallFilter.timeFilter || 'all'}
                  label="Time Period"
                  onChange={(e) => setOverallFilter(prev => ({ ...prev, timeFilter: e.target.value as any }))}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="semester">This Semester</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Show Top</InputLabel>
                <Select
                  value={overallFilter.limit || 100}
                  label="Show Top"
                  onChange={(e) => setOverallFilter(prev => ({ ...prev, limit: Number(e.target.value) }))}
                >
                  <MenuItem value={25}>Top 25</MenuItem>
                  <MenuItem value={50}>Top 50</MenuItem>
                  <MenuItem value={100}>Top 100</MenuItem>
                  <MenuItem value={200}>Top 200</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Overall Leaderboard */}
            {overallLeaderboard.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Leaderboard sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Leaderboard Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Students need to complete assessments and assignments to appear on the leaderboard.
                </Typography>
              </Box>
            ) : (
              <Box>
                {overallLeaderboard.map((entry) => renderLeaderboardEntry(entry, true))}
              </Box>
            )}
          </TabPanel>

          {/* Course Leaderboards Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: 400 }}>
                <InputLabel>Select Course</InputLabel>
                <Select
                  value={selectedCourse}
                  label="Select Course"
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <MenuItem value="">Select a course...</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course._id} value={course._id}>
                      {course.title} - {course.instructor.firstName} {course.instructor.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {!selectedCourse ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <School sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a Course
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a course from the dropdown to view its leaderboard.
                </Typography>
              </Box>
            ) : courseLeaderboards[selectedCourse] ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {courses.find(c => c._id === selectedCourse)?.title} Leaderboard
                </Typography>
                {courseLeaderboards[selectedCourse].map((entry) => renderLeaderboardEntry(entry))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading course leaderboard...
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Assessment Leaderboards Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: 400 }}>
                <InputLabel>Select Assessment</InputLabel>
                <Select
                  value={selectedAssessment}
                  label="Select Assessment"
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                >
                  <MenuItem value="">Select an assessment...</MenuItem>
                  {assessments.map((assessment) => (
                    <MenuItem key={assessment._id} value={assessment._id}>
                      {assessment.title} - {assessment.courseName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {!selectedAssessment ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Quiz sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select an Assessment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose an assessment from the dropdown to view its leaderboard.
                </Typography>
              </Box>
            ) : assessmentLeaderboards[selectedAssessment] ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {assessments.find(a => a._id === selectedAssessment)?.title} Leaderboard
                </Typography>
                {assessmentLeaderboards[selectedAssessment].map((entry) => renderLeaderboardEntry(entry))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading assessment leaderboard...
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Assignment Leaderboards Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: 400 }}>
                <InputLabel>Select Assignment</InputLabel>
                <Select
                  value={selectedAssignment}
                  label="Select Assignment"
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                >
                  <MenuItem value="">Select an assignment...</MenuItem>
                  {assignments.map((assignment) => (
                    <MenuItem key={assignment._id} value={assignment._id}>
                      {assignment.title} - {assignment.courseName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {!selectedAssignment ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Assignment sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select an Assignment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose an assignment from the dropdown to view its leaderboard.
                </Typography>
              </Box>
            ) : assignmentLeaderboards[selectedAssignment] ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {assignments.find(a => a._id === selectedAssignment)?.title} Leaderboard
                </Typography>
                {assignmentLeaderboards[selectedAssignment].map((entry) => renderLeaderboardEntry(entry))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading assignment leaderboard...
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* System Analytics Tab */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Analytics sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                System Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive system analytics and performance insights coming soon.
              </Typography>
            </Box>
          </TabPanel>
        </Card>

        {/* Student Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {selectedStudent?.studentName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedStudent?.studentName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedStudent?.studentEmail}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedStudent && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Performance Metrics</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Current Rank" 
                        secondary={`#${selectedStudent.rank}`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Average Score" 
                        secondary={`${selectedStudent.averageScore}%`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Total Points" 
                        secondary={selectedStudent.totalPoints} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Activity Summary</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Completed Assessments" 
                        secondary={selectedStudent.completedAssessments} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Completed Assignments" 
                        secondary={selectedStudent.completedAssignments} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Current Streak" 
                        secondary={`${selectedStudent.streak} days`} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Achievements</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedStudent.badges.map((badge, index) => (
                      <Chip
                        key={index}
                        label={badge}
                        color="primary"
                        variant="outlined"
                        icon={<Star />}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            <Button variant="contained" startIcon={<Send />}>
              Send Message
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminLeaderboard;