import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
  Collapse
} from '@mui/material';
import {
  ArrowBack,
  Grade,
  Search,
  FilterList,
  Refresh,
  EmojiEvents,
  Assignment,
  CheckCircle,
  Schedule,
  Analytics,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { gradesService, StudentGrade, LeaderboardEntry, GradesFilter, LeaderboardFilter } from '../../services/gradesService';
import { courseService } from '../../services/courseService';
import ResponsiveLeaderboardCard from '../../components/Leaderboard/ResponsiveLeaderboardCard';

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
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('md') || '(max-width: 900px)');
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(1); // Start with leaderboard tab
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(courseId || 'all');
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
    if (selectedCourse) {
      loadGradesData();
    }
  }, [selectedCourse, gradesFilter]);

  useEffect(() => {
    if (selectedCourse) {
      loadLeaderboardData();
    }
  }, [selectedCourse, leaderboardFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load teacher's courses
      const coursesResponse = await courseService.getTeacherCourses();
      setCourses(coursesResponse.courses || []);

      // Load initial grades and leaderboard data
      await Promise.all([
        loadGradesData(),
        loadLeaderboardData()
      ]);

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
      
      console.log('Loading leaderboard for course:', selectedCourse, 'with filters:', leaderboardFilter);
      
      if (selectedCourse === 'all') {
        leaderboardData = await gradesService.getLeaderboard(leaderboardFilter);
        console.log('Overall leaderboard data:', leaderboardData);
      } else {
        leaderboardData = await gradesService.getCourseLeaderboard(selectedCourse, leaderboardFilter);
        console.log('Course leaderboard data:', leaderboardData);
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

  // Handle course selection change
  const handleCourseChange = async (courseId: string) => {
    console.log('Course changed to:', courseId);
    setSelectedCourse(courseId);
    // Don't set loading to true here - let the useEffect handle the loading
    // The useEffect will trigger automatically when selectedCourse changes
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
    grade.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginated grades
  const paginatedGrades = filteredGrades.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get grade color
  const getGradeColor = (percentage: number) => {
    return gradesService.getGradeColor(percentage);
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
                onChange={(e) => handleCourseChange(e.target.value)}
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
                onChange={(e) => handleCourseChange(e.target.value)}
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
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Assignment sx={{ fontSize: { xs: 24, sm: 32 }, color: 'primary.main', mr: 1 }} />
                  <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {grades.length}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
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
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1), rgba(46, 125, 50, 0.05))'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <CheckCircle sx={{ fontSize: { xs: 24, sm: 32 }, color: 'success.main', mr: 1 }} />
                  <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {grades.filter(g => g.status === 'graded').length}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
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
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.1), rgba(237, 108, 2, 0.05))'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Schedule sx={{ fontSize: { xs: 24, sm: 32 }, color: 'warning.main', mr: 1 }} />
                  <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {grades.filter(g => g.status === 'submitted').length}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
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
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(2, 136, 209, 0.1), rgba(2, 136, 209, 0.05))'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Analytics sx={{ fontSize: { xs: 24, sm: 32 }, color: 'info.main', mr: 1 }} />
                  <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length) : 0}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                  Average Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant={isMobile ? "fullWidth" : "standard"}
              sx={{ px: 2 }}
            >
              <Tab 
                label="Grades" 
                icon={<Grade sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                iconPosition="start"
                sx={{ minHeight: { xs: 48, sm: 64 } }}
              />
              <Tab 
                label="Leaderboard" 
                icon={<EmojiEvents sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                iconPosition="start"
                sx={{ minHeight: { xs: 48, sm: 64 } }}
              />
              <Tab 
                label="Analytics" 
                icon={<Analytics sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                iconPosition="start"
                sx={{ minHeight: { xs: 48, sm: 64 } }}
              />
            </Tabs>
          </Box>

          {/* Grades Tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Search and Filters */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 2
              }}>
                <TextField
                  size="small"
                  placeholder="Search students, assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: { xs: '100%', sm: 300 } }}
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
                </Box>
              </Collapse>
            </Box>

            {/* Grades Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Assignment</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Submitted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedGrades.map((grade) => (
                    <TableRow key={`${grade.studentId}-${grade.assignmentId}`} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
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
                          {grade.assignmentTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={grade.type} 
                          size="small" 
                          variant="outlined"
                          color={grade.type === 'assessment' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>
                        {grade.percentage !== null ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: getGradeColor(grade.percentage)
                              }}
                            >
                              {grade.percentage}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({grade.score}/{grade.maxScore})
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not graded
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={grade.status} 
                          size="small"
                          color={grade.status === 'graded' ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(grade.submittedAt), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredGrades.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TabPanel>

          {/* Leaderboard Tab */}
          <TabPanel value={tabValue} index={1}>
            {/* Leaderboard Filters */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Student Leaderboard
                </Typography>
                
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
                    <InputLabel>Ranking Type</InputLabel>
                    <Select
                      value={leaderboardFilter.type || 'overall'}
                      label="Ranking Type"
                      onChange={(e) => setLeaderboardFilter(prev => ({ ...prev, type: e.target.value as any }))}
                    >
                      <MenuItem value="overall">Overall Performance</MenuItem>
                      <MenuItem value="assessments">Assessments Only</MenuItem>
                      <MenuItem value="assignments">Assignments Only</MenuItem>
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

            {/* Course Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {selectedCourse === 'all' 
                  ? 'Overall Leaderboard - All Courses' 
                  : `${courses.find(c => c._id === selectedCourse)?.title || 'Course'} Leaderboard`
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCourse === 'all' 
                  ? 'Rankings based on performance across all your courses'
                  : 'Rankings based on performance in this specific course'
                }
              </Typography>
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
                {leaderboard.map((entry, index) => (
                  <ResponsiveLeaderboardCard
                    key={entry.studentId}
                    entry={entry}
                    isCurrentUser={false}
                    showCourse={selectedCourse === 'all'}
                  />
                ))}
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