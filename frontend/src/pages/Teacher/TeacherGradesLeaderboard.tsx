import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  useTheme,
  useMediaQuery,
  Collapse,
  CardActions,
  Skeleton
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
  Search,
  Visibility,
  Comment,
  ExpandMore,
  ExpandLess,
  Phone,
  LocationOn,
  CalendarToday,
  Schedule,
  TrendingFlat,
  ArrowBack,
  Dashboard,
  LocalFireDepartment,
  Bolt,
  FlashOn,
  GetApp,
  Print,
  Send,
  PersonAdd,
  Class,
  MenuBook
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { gradesService, StudentGrade, LeaderboardEntry, GradesFilter, LeaderboardFilter } from '../../services/gradesService';
import { courseService } from '../../services/courseService';

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
      id={`teacher-grades-tabpanel-${index}`}
      aria-labelledby={`teacher-grades-tab-${index}`}
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
}

const TeacherGradesLeaderboard: React.FC = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // State management
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(courseId || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);
  
  // Filters
  const [gradesFilter, setGradesFilter] = useState<GradesFilter>({
    type: 'all',
    timeFilter: 'all',
    status: 'all'
  });
  
  const [leaderboardFilter, setLeaderboardFilter] = useState<LeaderboardFilter>({
    type: 'overall',
    timeFilter: 'all',
    limit: 50
  });

  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Load data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadGradesData();
  }, [selectedCourse, gradesFilter]);

  useEffect(() => {
    loadLeaderboardData();
  }, [selectedCourse, leaderboardFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load teacher's courses
      const coursesResponse = await courseService.getTeacherCourses();
      setCourses(coursesResponse.courses || []);

    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadGradesData = async () => {
    try {
      let gradesData: StudentGrade[];
      
      if (selectedCourse === 'all') {
        gradesData = await gradesService.getTeacherGrades(gradesFilter);
      } else {
        gradesData = await gradesService.getTeacherCourseGrades(selectedCourse, gradesFilter);
      }
      
      setGrades(gradesData);
    } catch (err: any) {
      console.error('Failed to load grades:', err);
      setError(err.message || 'Failed to load grades');
    }
  };

  const loadLeaderboardData = async () => {
    try {
      let leaderboardData: LeaderboardEntry[];
      
      if (selectedCourse === 'all') {
        leaderboardData = await gradesService.getLeaderboard(leaderboardFilter);
      } else {
        leaderboardData = await gradesService.getCourseLeaderboard(selectedCourse, leaderboardFilter);
      }
      
      setLeaderboard(leaderboardData);
    } catch (err: any) {
      console.error('Failed to load leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter grades by search term
  const filteredGrades = grades.filter(grade =>
    grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grade.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (grade.assessmentTitle && grade.assessmentTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (grade.assignmentTitle && grade.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get paginated grades
  const paginatedGrades = filteredGrades.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get grade color
  const getGradeColor = (percentage: number) => {
    return gradesService.getGradeColor(percentage);
  };

  // Get rank display
  const getRankDisplay = (rank: number) => {
    return gradesService.getRankDisplay(rank);
  };

  // Export grades
  const handleExportGrades = () => {
    // Implementation for exporting grades to CSV/Excel
    console.log('Exporting grades...');
  };

  // Send feedback to student
  const handleSendFeedback = (grade: StudentGrade) => {
    // Implementation for sending feedback
    console.log('Sending feedback to:', grade.studentName);
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
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          <IconButton 
            onClick={() => navigate('/dashboard/teacher')} 
            sx={{ mr: { xs: 1, sm: 2 } }}
            color="primary"
          >
            <ArrowBack />
          </IconButton>
          
          {!isMobile && (
            <Grade color="primary" sx={{ mr: 2 }} />
          )}
          
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            sx={{ 
              flexGrow: 1, 
              color: 'primary.main', 
              fontWeight: 'bold',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {isMobile ? 'Grades & Performance' : 'Student Grades & Performance'}
          </Typography>
          
          {!isMobile && (
            <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
              <InputLabel>Course</InputLabel>
              <Select
                value={selectedCourse}
                label="Course"
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <MenuItem value="all">All Courses</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course._id} value={course._id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <IconButton onClick={loadGradesData} color="primary">
            <Refresh />
          </IconButton>
        </Toolbar>
        
        {/* Mobile Course Selector */}
        {isMobile && (
          <Box sx={{ px: 2, pb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Course</InputLabel>
              <Select
                value={selectedCourse}
                label="Course"
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <MenuItem value="all">All Courses</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course._id} value={course._id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
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
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  borderColor: 'primary.main'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Assignment sx={{ fontSize: { xs: 24, sm: 32 }, color: 'primary.main', mr: 1 }} />
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ fontWeight: 'bold', color: 'primary.main' }}
                  >
                    {loading ? <Skeleton width={40} /> : grades.length}
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                  Total Submissions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  borderColor: 'success.main'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <CheckCircle sx={{ fontSize: { xs: 24, sm: 32 }, color: 'success.main', mr: 1 }} />
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ fontWeight: 'bold', color: 'success.main' }}
                  >
                    {loading ? <Skeleton width={40} /> : grades.filter(g => g.status === 'graded').length}
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                  Graded
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  borderColor: 'warning.main'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Schedule sx={{ fontSize: { xs: 24, sm: 32 }, color: 'warning.main', mr: 1 }} />
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ fontWeight: 'bold', color: 'warning.main' }}
                  >
                    {loading ? <Skeleton width={40} /> : grades.filter(g => g.status === 'submitted').length}
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                  Pending Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  borderColor: 'info.main'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Analytics sx={{ fontSize: { xs: 24, sm: 32 }, color: 'info.main', mr: 1 }} />
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ fontWeight: 'bold', color: 'info.main' }}
                  >
                    {loading ? <Skeleton width={40} /> : 
                      `${grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length) : 0}%`
                    }
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                  Average Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <AppBar 
            position="static" 
            color="default" 
            elevation={0}
            sx={{ 
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
              sx={{
                '& .MuiTab-root': {
                  minHeight: { xs: 48, sm: 72 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 600
                }
              }}
            >
              <Tab
                icon={<Grade sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                label={isMobile ? "Grades" : "Student Grades"}
                id="teacher-grades-tab-0"
                aria-controls="teacher-grades-tabpanel-0"
                iconPosition={isMobile ? "top" : "start"}
              />
              <Tab
                icon={<Leaderboard sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                label={isMobile ? "Leaderboard" : "Class Leaderboard"}
                id="teacher-grades-tab-1"
                aria-controls="teacher-grades-tabpanel-1"
                iconPosition={isMobile ? "top" : "start"}
              />
              <Tab
                icon={<Analytics sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                label={isMobile ? "Analytics" : "Performance Analytics"}
                id="teacher-grades-tab-2"
                aria-controls="teacher-grades-tabpanel-2"
                iconPosition={isMobile ? "top" : "start"}
              />
            </Tabs>
          </AppBar>

          {/* Student Grades Tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Search and Filter Toggle */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Search students, assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    flexGrow: 1,
                    minWidth: { xs: '100%', sm: 250 }
                  }}
                />
                
                {isMobile && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    startIcon={<FilterList />}
                    endIcon={filtersExpanded ? <ExpandLess /> : <ExpandMore />}
                    sx={{ minWidth: 'auto' }}
                  >
                    Filters
                  </Button>
                )}
              </Box>
              
              {/* Collapsible Filters */}
              <Collapse in={filtersExpanded}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexWrap: 'wrap',
                  p: isMobile ? 2 : 0,
                  bgcolor: isMobile ? 'grey.50' : 'transparent',
                  borderRadius: isMobile ? 1 : 0,
                  border: isMobile ? '1px solid' : 'none',
                  borderColor: isMobile ? 'divider' : 'transparent'
                }}>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={gradesFilter.type || 'all'}
                      label="Type"
                      onChange={(e) => setGradesFilter(prev => ({ ...prev, type: e.target.value as any }))}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="assessment">Assessments</MenuItem>
                      <MenuItem value="assignment">Assignments</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={gradesFilter.status || 'all'}
                      label="Status"
                      onChange={(e) => setGradesFilter(prev => ({ ...prev, status: e.target.value as any }))}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="graded">Graded</MenuItem>
                      <MenuItem value="submitted">Pending</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                    <InputLabel>Time Period</InputLabel>
                    <Select
                      value={gradesFilter.timeFilter || 'all'}
                      label="Time Period"
                      onChange={(e) => setGradesFilter(prev => ({ ...prev, timeFilter: e.target.value as any }))}
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="week">This Week</MenuItem>
                      <MenuItem value="month">This Month</MenuItem>
                      <MenuItem value="semester">This Semester</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="outlined"
                    startIcon={<GetApp />}
                    onClick={handleExportGrades}
                    size="small"
                    sx={{ 
                      minWidth: { xs: '100%', sm: 'auto' },
                      mt: { xs: 1, sm: 0 }
                    }}
                  >
                    Export
                  </Button>
                </Box>
              </Collapse>
            </Box>

            {/* Grades Display - Responsive */}
            {paginatedGrades.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Grade sx={{ fontSize: 64, color: 'text.secondary' }} />
                  <Typography variant="h6" color="text.secondary">
                    No grades available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Grades will appear here once students start submitting assessments and assignments.
                  </Typography>
                </Box>
              </Paper>
            ) : (
              <>
                {/* Mobile Card View */}
                {isMobile ? (
                  <Stack spacing={2}>
                    {paginatedGrades.map((grade) => (
                      <Card 
                        key={grade._id} 
                        elevation={0}
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: 2,
                            borderColor: 'primary.main'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          {/* Student Info */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                              {grade.studentName.charAt(0)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {grade.studentName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {grade.studentEmail}
                              </Typography>
                            </Box>
                            <Chip
                              label={grade.grade}
                              color={getGradeColor(grade.percentage) as any}
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                          
                          {/* Assignment/Assessment Info */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                              {grade.assessmentTitle || grade.assignmentTitle}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Chip
                                label={grade.type.charAt(0).toUpperCase() + grade.type.slice(1)}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                              <Chip
                                label={grade.status.charAt(0).toUpperCase() + grade.status.slice(1)}
                                color={grade.status === 'graded' ? 'success' : 'warning'}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                          
                          {/* Score and Date */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Score
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {grade.score}/{grade.maxScore}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" color="text.secondary">
                                Submitted
                              </Typography>
                              <Typography variant="caption">
                                {format(new Date(grade.submittedAt), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Actions */}
                          <CardActions sx={{ p: 0, justifyContent: 'flex-end' }}>
                            <Tooltip title="View Details">
                              <IconButton size="small" color="primary">
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Send Feedback">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleSendFeedback(grade)}
                              >
                                <Comment />
                              </IconButton>
                            </Tooltip>
                          </CardActions>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  /* Desktop Table View */
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Assessment/Assignment</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Submitted</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedGrades.map((grade) => (
                    <TableRow key={grade._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {grade.studentName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {grade.studentName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {grade.studentEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {grade.assessmentTitle || grade.assignmentTitle}
                        </Typography>
                        {grade.courseName && (
                          <Typography variant="caption" color="text.secondary">
                            {grade.courseName}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={grade.type === 'assessment' ? <Quiz /> : <Assignment />}
                          label={grade.type.charAt(0).toUpperCase() + grade.type.slice(1)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {grade.score}/{grade.maxScore}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={grade.percentage}
                          color={getGradeColor(grade.percentage) as any}
                          sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={grade.grade}
                          color={getGradeColor(grade.percentage) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={grade.status.charAt(0).toUpperCase() + grade.status.slice(1)}
                          color={grade.status === 'graded' ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {format(new Date(grade.submittedAt), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Feedback">
                            <IconButton 
                              size="small" 
                              onClick={() => handleSendFeedback(grade)}
                            >
                              <Comment />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {/* Pagination for both mobile and desktop */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <TablePagination
                    rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25, 50]}
                    component="div"
                    count={filteredGrades.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                      '& .MuiTablePagination-toolbar': {
                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                        gap: isMobile ? 1 : 0
                      },
                      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                      }
                    }}
                  />
                </Box>
              </>
            )}
          </TabPanel>

          {/* Class Leaderboard Tab */}
          <TabPanel value={tabValue} index={1}>
            {/* Leaderboard Filters */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexWrap: 'wrap',
                alignItems: 'center',
                mb: isMobile ? 2 : 0
              }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'primary.main',
                  fontWeight: 'bold',
                  mb: { xs: 1, sm: 0 }
                }}>
                  <EmojiEvents />
                  Class Leaderboard
                </Typography>
                
                {isMobile && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    startIcon={<FilterList />}
                    endIcon={filtersExpanded ? <ExpandLess /> : <ExpandMore />}
                    sx={{ ml: 'auto' }}
                  >
                    Filters
                  </Button>
                )}
              </Box>
              
              <Collapse in={filtersExpanded}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexWrap: 'wrap',
                  p: isMobile ? 2 : 0,
                  bgcolor: isMobile ? 'grey.50' : 'transparent',
                  borderRadius: isMobile ? 1 : 0,
                  border: isMobile ? '1px solid' : 'none',
                  borderColor: isMobile ? 'divider' : 'transparent'
                }}>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={leaderboardFilter.type || 'overall'}
                      label="Type"
                      onChange={(e) => setLeaderboardFilter(prev => ({ ...prev, type: e.target.value as any }))}
                    >
                      <MenuItem value="overall">Overall Performance</MenuItem>
                      <MenuItem value="assessment">Assessment Scores</MenuItem>
                      <MenuItem value="assignment">Assignment Scores</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                    <InputLabel>Time Period</InputLabel>
                    <Select
                      value={leaderboardFilter.timeFilter || 'all'}
                      label="Time Period"
                      onChange={(e) => setLeaderboardFilter(prev => ({ ...prev, timeFilter: e.target.value as any }))}
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="week">This Week</MenuItem>
                      <MenuItem value="month">This Month</MenuItem>
                      <MenuItem value="semester">This Semester</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                    <InputLabel>Show Top</InputLabel>
                    <Select
                      value={leaderboardFilter.limit || 50}
                      label="Show Top"
                      onChange={(e) => setLeaderboardFilter(prev => ({ ...prev, limit: Number(e.target.value) }))}
                    >
                      <MenuItem value={10}>Top 10</MenuItem>
                      <MenuItem value={25}>Top 25</MenuItem>
                      <MenuItem value={50}>Top 50</MenuItem>
                      <MenuItem value={100}>All Students</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Collapse>
            </Box>

            {/* Leaderboard */}
            {leaderboard.length === 0 ? (
              <Paper 
                elevation={0}
                sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <EmojiEvents sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  No Leaderboard Data Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                  Students need to complete assessments and assignments to appear on the leaderboard. 
                  The leaderboard will automatically populate as submissions come in.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={isMobile ? 2 : 3}>
                {leaderboard.map((entry, index) => {
                  const rankDisplay = getRankDisplay(entry.rank);
                  const isTopThree = entry.rank <= 3;
                  
                  return (
                    <Card 
                      key={entry.studentId}
                      elevation={0}
                      sx={{ 
                        border: '2px solid',
                        borderColor: isTopThree ? 'warning.main' : 'divider',
                        borderRadius: 2,
                        background: isTopThree 
                          ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))'
                          : 'background.paper',
                        position: 'relative',
                        overflow: 'visible',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 6,
                          transform: 'translateY(-4px)',
                          borderColor: isTopThree ? 'warning.dark' : 'primary.main'
                        }
                      }}
                    >
                      {/* Top 3 Badge */}
                      {isTopThree && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: 16,
                            bgcolor: 'warning.main',
                            color: 'warning.contrastText',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            zIndex: 1
                          }}
                        >
                          TOP {entry.rank}
                        </Box>
                      )}
                      
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Grid container spacing={2} alignItems="center">
                          {/* Rank and Student Info */}
                          <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: { xs: 2, sm: 3 },
                              mb: { xs: 2, sm: 0 }
                            }}>
                              <Box sx={{ 
                                textAlign: 'center', 
                                minWidth: { xs: 50, sm: 60 },
                                position: 'relative'
                              }}>
                                <Typography 
                                  variant="h2" 
                                  sx={{ 
                                    fontSize: { xs: '1.5rem', sm: '2rem' },
                                    mb: 0.5
                                  }}
                                >
                                  {rankDisplay.icon}
                                </Typography>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 'bold', 
                                    color: rankDisplay.color,
                                    fontSize: { xs: '0.9rem', sm: '1.1rem' }
                                  }}
                                >
                                  #{entry.rank}
                                </Typography>
                              </Box>
                              
                              <Avatar sx={{ 
                                width: { xs: 48, sm: 56 }, 
                                height: { xs: 48, sm: 56 },
                                bgcolor: isTopThree ? 'warning.main' : 'primary.main',
                                fontSize: { xs: '1.2rem', sm: '1.5rem' },
                                fontWeight: 'bold'
                              }}>
                                {entry.studentName.charAt(0)}
                              </Avatar>
                              
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography 
                                  variant={isMobile ? "subtitle1" : "h6"} 
                                  sx={{ 
                                    fontWeight: 'bold',
                                    color: 'text.primary',
                                    mb: 0.5
                                  }}
                                >
                                  {entry.studentName}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                  {entry.studentEmail}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          
                          {/* Performance Stats */}
                          <Grid item xs={12} sm={6} md={8}>
                            <Grid container spacing={{ xs: 2, sm: 3 }}>
                              <Grid item xs={6} sm={3}>
                                <Box sx={{ 
                                  textAlign: 'center',
                                  p: { xs: 1, sm: 2 },
                                  bgcolor: 'primary.50',
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'primary.100'
                                }}>
                                  <Typography 
                                    variant={isMobile ? "h6" : "h5"} 
                                    sx={{ 
                                      fontWeight: 'bold', 
                                      color: 'primary.main',
                                      mb: 0.5
                                    }}
                                  >
                                    {entry.averageScore}%
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ fontWeight: 'medium' }}
                                  >
                                    Average Score
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6} sm={3}>
                                <Box sx={{ 
                                  textAlign: 'center',
                                  p: { xs: 1, sm: 2 },
                                  bgcolor: 'success.50',
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'success.100'
                                }}>
                                  <Typography 
                                    variant={isMobile ? "h6" : "h5"} 
                                    sx={{ 
                                      fontWeight: 'bold', 
                                      color: 'success.main',
                                      mb: 0.5
                                    }}
                                  >
                                    {entry.totalPoints}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ fontWeight: 'medium' }}
                                  >
                                    Total Points
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6} sm={3}>
                                <Box sx={{ 
                                  textAlign: 'center',
                                  p: { xs: 1, sm: 2 },
                                  bgcolor: 'info.50',
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'info.100'
                                }}>
                                  <Typography 
                                    variant={isMobile ? "h6" : "h5"} 
                                    sx={{ 
                                      fontWeight: 'bold', 
                                      color: 'info.main',
                                      mb: 0.5
                                    }}
                                  >
                                    {entry.completedAssessments}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ fontWeight: 'medium' }}
                                  >
                                    Completed
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6} sm={3}>
                                <Box sx={{ 
                                  textAlign: 'center',
                                  p: { xs: 1, sm: 2 },
                                  bgcolor: 'warning.50',
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'warning.100'
                                }}>
                                  <Typography 
                                    variant={isMobile ? "h6" : "h5"} 
                                    sx={{ 
                                      fontWeight: 'bold', 
                                      color: 'warning.main',
                                      mb: 0.5
                                    }}
                                  >
                                    {entry.streak || 0}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ fontWeight: 'medium' }}
                                  >
                                    Streak
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </TabPanel>

          {/* Performance Analytics Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Analytics sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Performance Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed analytics and insights will be available here soon.
              </Typography>
            </Box>
          </TabPanel>
        </Card>
      </Container>
    </Box>
  );
};

export default TeacherGradesLeaderboard;