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
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
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
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  Email,
  Phone,
  TrendingUp,
  TrendingDown,
  School,
  Assessment,
  AccessTime,
  Star,
  Grade,
  CheckCircle,
  Cancel,
  Warning,
  ExpandMore,
  Download,
  Print,
  Message,
  PersonAdd,
  Sort,
  Timeline,
  BarChart,
  PieChart
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
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
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

const StudentManagement: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentsData, setStudentsData] = useState<TeacherStudentsData | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterPerformance, setFilterPerformance] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchStudentsData();
  }, []);

  useEffect(() => {
    if (studentsData) {
      applyFiltersAndSort();
    }
  }, [studentsData, searchTerm, filterCourse, filterPerformance, sortBy, sortOrder]);

  const fetchStudentsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get<TeacherStudentsData>('/settings/teacher/students');

      if (response.success) {
        setStudentsData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students data');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    if (!studentsData) return;

    let filtered = [...studentsData.students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(studentData =>
        `${studentData.student.firstName} ${studentData.student.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        studentData.student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply course filter
    if (filterCourse) {
      filtered = filtered.filter(studentData =>
        studentData.courses.some(course => course.course._id === filterCourse)
      );
    }

    // Apply performance filter
    if (filterPerformance) {
      filtered = filtered.filter(studentData => {
        switch (filterPerformance) {
          case 'excellent':
            return studentData.averageScore >= 85;
          case 'good':
            return studentData.averageScore >= 75 && studentData.averageScore < 85;
          case 'average':
            return studentData.averageScore >= 65 && studentData.averageScore < 75;
          case 'needs-help':
            return studentData.averageScore < 65;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = `${a.student.firstName} ${a.student.lastName}`;
          bValue = `${b.student.firstName} ${b.student.lastName}`;
          break;
        case 'progress':
          aValue = a.averageProgress;
          bValue = b.averageProgress;
          break;
        case 'score':
          aValue = a.averageScore;
          bValue = b.averageScore;
          break;
        case 'points':
          aValue = a.totalPoints;
          bValue = b.totalPoints;
          break;
        case 'time':
          aValue = a.totalTimeSpent;
          bValue = b.totalTimeSpent;
          break;
        default:
          aValue = a.student.firstName;
          bValue = b.student.firstName;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    setFilteredStudents(filtered);
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
    if (averageScore >= 85) return { label: 'Excellent', color: 'success', icon: <TrendingUp /> };
    if (averageScore >= 75) return { label: 'Good', color: 'info', icon: <CheckCircle /> };
    if (averageScore >= 65) return { label: 'Average', color: 'warning', icon: <Warning /> };
    return { label: 'Needs Help', color: 'error', icon: <TrendingDown /> };
  };

  const getEngagementLevel = (timeSpent: number, averageTime: number) => {
    if (timeSpent > averageTime * 1.2) return { label: 'High', color: 'success' };
    if (timeSpent > averageTime * 0.8) return { label: 'Medium', color: 'info' };
    return { label: 'Low', color: 'warning' };
  };

  const exportStudentData = () => {
    // Implementation for exporting student data
    console.log('Exporting student data...');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!studentsData) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">Failed to load student data</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Student Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportStudentData}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            aria-label="student management tabs"
          >
            <Tab 
              icon={
                <Badge badgeContent={studentsData.totalStudents} color="primary">
                  <School />
                </Badge>
              } 
              label="All Students" 
            />
            <Tab icon={<BarChart />} label="Performance Analytics" />
            <Tab icon={<Timeline />} label="Progress Tracking" />
          </Tabs>
        </Box>

        {/* All Students Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
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

          {/* Filters and Search */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Course</InputLabel>
                    <Select
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                      label="Course"
                    >
                      <MenuItem value="">All Courses</MenuItem>
                      {studentsData.courses.map((course) => (
                        <MenuItem key={course._id} value={course._id}>
                          {course.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Performance</InputLabel>
                    <Select
                      value={filterPerformance}
                      onChange={(e) => setFilterPerformance(e.target.value)}
                      label="Performance"
                    >
                      <MenuItem value="">All Levels</MenuItem>
                      <MenuItem value="excellent">Excellent (85%+)</MenuItem>
                      <MenuItem value="good">Good (75-84%)</MenuItem>
                      <MenuItem value="average">Average (65-74%)</MenuItem>
                      <MenuItem value="needs-help">Needs Help (&lt;65%)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      label="Sort By"
                    >
                      <MenuItem value="name">Name</MenuItem>
                      <MenuItem value="progress">Progress</MenuItem>
                      <MenuItem value="score">Score</MenuItem>
                      <MenuItem value="points">Points</MenuItem>
                      <MenuItem value="time">Study Time</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={1}>
                  <IconButton
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    color="primary"
                  >
                    <Sort sx={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
                  </IconButton>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredStudents.length} of {studentsData.totalStudents} students
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell align="center">Courses</TableCell>
                      <TableCell align="center">Progress</TableCell>
                      <TableCell align="center">Avg Score</TableCell>
                      <TableCell align="center">Study Time</TableCell>
                      <TableCell align="center">Engagement</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((studentData) => {
                      const status = getPerformanceStatus(studentData.averageScore);
                      const engagement = getEngagementLevel(
                        studentData.totalTimeSpent, 
                        studentsData.summary.totalTimeSpent / studentsData.totalStudents
                      );
                      
                      return (
                        <TableRow key={studentData.student._id} hover>
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
                            <Typography variant="caption" color="text.secondary">
                              completed
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
                              label={engagement.label}
                              color={engagement.color as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={status.label}>
                              <Chip
                                icon={status.icon}
                                label={status.label}
                                color={status.color as any}
                                size="small"
                              />
                            </Tooltip>
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
                            <Tooltip title="Send Message">
                              <IconButton size="small">
                                <Message />
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
        </TabPanel>

        {/* Performance Analytics Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Performance Distribution */}
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
                          {filteredStudents.filter(s => s.averageScore >= 85).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Excellent (85%+)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {filteredStudents.filter(s => s.averageScore >= 75 && s.averageScore < 85).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Good (75-84%)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {filteredStudents.filter(s => s.averageScore >= 65 && s.averageScore < 75).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Average (65-74%)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="error.main">
                          {filteredStudents.filter(s => s.averageScore < 65).length}
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

            {/* Course Analytics */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Course Enrollment & Performance
                  </Typography>
                  <Grid container spacing={2}>
                    {studentsData.courses.map((course) => {
                      const courseStudents = filteredStudents.filter(s => 
                        s.courses.some(c => c.course._id === course._id)
                      );
                      const avgProgress = courseStudents.length > 0 
                        ? courseStudents.reduce((sum, s) => {
                            const courseProgress = s.courses.find(c => c.course._id === course._id);
                            return sum + (courseProgress?.progressPercentage || 0);
                          }, 0) / courseStudents.length
                        : 0;

                      return (
                        <Grid item xs={12} sm={6} md={4} key={course._id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" gutterBottom>
                                {course.title}
                              </Typography>
                              <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">
                                  Enrolled
                                </Typography>
                                <Chip
                                  label={courseStudents.length}
                                  color="primary"
                                  size="small"
                                />
                              </Box>
                              <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">
                                  Avg Progress
                                </Typography>
                                <Typography variant="body2">
                                  {avgProgress.toFixed(1)}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={avgProgress}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Progress Tracking Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {/* Top Performers */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Performers
                  </Typography>
                  <List>
                    {filteredStudents
                      .sort((a, b) => b.averageScore - a.averageScore)
                      .slice(0, 5)
                      .map((studentData, index) => (
                        <ListItem key={studentData.student._id}>
                          <ListItemAvatar>
                            <Badge badgeContent={index + 1} color="primary">
                              <Avatar src={studentData.student.avatar}>
                                {studentData.student.firstName[0]}{studentData.student.lastName[0]}
                              </Avatar>
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${studentData.student.firstName} ${studentData.student.lastName}`}
                            secondary={`${studentData.averageScore.toFixed(1)}% • ${studentData.totalPoints} points`}
                          />
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Students Needing Attention */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Students Needing Attention
                  </Typography>
                  <List>
                    {filteredStudents
                      .filter(s => s.averageScore < 70 || s.averageProgress < 50)
                      .sort((a, b) => a.averageScore - b.averageScore)
                      .slice(0, 5)
                      .map((studentData) => (
                        <ListItem key={studentData.student._id}>
                          <ListItemAvatar>
                            <Avatar src={studentData.student.avatar}>
                              {studentData.student.firstName[0]}{studentData.student.lastName[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${studentData.student.firstName} ${studentData.student.lastName}`}
                            secondary={
                              <Box>
                                <Typography variant="caption" color="error">
                                  Score: {studentData.averageScore.toFixed(1)}% • Progress: {studentData.averageProgress.toFixed(1)}%
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Student Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This feature will show recent student activities, submissions, and progress updates.
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
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            {selectedStudent && (
              <>
                <Avatar
                  src={selectedStudent.student.avatar}
                  sx={{ width: 50, height: 50, mr: 2 }}
                >
                  {selectedStudent.student.firstName[0]}{selectedStudent.student.lastName[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedStudent.student.firstName} {selectedStudent.student.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed Performance Report
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Grid container spacing={3}>
              {/* Student Info */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Student Information
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Email:</strong> {selectedStudent.student.email}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Joined:</strong> {new Date(selectedStudent.student.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Last Login:</strong> {
                        selectedStudent.student.lastLogin 
                          ? new Date(selectedStudent.student.lastLogin).toLocaleDateString()
                          : 'Never'
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Performance Summary */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                          <Typography variant="h5" color="primary">
                            {selectedStudent.totalCourses}
                          </Typography>
                          <Typography variant="caption">Courses</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                          <Typography variant="h5" color="success.main">
                            {selectedStudent.averageProgress.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption">Avg Progress</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                          <Typography variant="h5" color="warning.main">
                            {selectedStudent.averageScore.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption">Avg Score</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                          <Typography variant="h5" color="info.main">
                            {formatTime(selectedStudent.totalTimeSpent)}
                          </Typography>
                          <Typography variant="caption">Study Time</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Course Progress */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Course Progress
                    </Typography>
                    {selectedStudent.courses.map((courseProgress) => (
                      <Accordion key={courseProgress.course._id}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box display="flex" alignItems="center" width="100%">
                            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                              {courseProgress.course.title}
                            </Typography>
                            <Chip
                              label={`${courseProgress.progressPercentage.toFixed(1)}%`}
                              color={courseProgress.isCompleted ? 'success' : 'primary'}
                              size="small"
                              sx={{ mr: 2 }}
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <LinearProgress
                                variant="determinate"
                                value={courseProgress.progressPercentage}
                                sx={{ height: 8, borderRadius: 4, mb: 2 }}
                              />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                Points Earned
                              </Typography>
                              <Typography variant="h6">
                                {courseProgress.totalPoints}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                Time Spent
                              </Typography>
                              <Typography variant="h6">
                                {formatTime(courseProgress.timeSpent)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                Streak Days
                              </Typography>
                              <Typography variant="h6">
                                {courseProgress.streakDays}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                Last Accessed
                              </Typography>
                              <Typography variant="body2">
                                {new Date(courseProgress.lastAccessed).toLocaleDateString()}
                              </Typography>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Exam Results */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Exam Results
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Quiz</TableCell>
                            <TableCell align="center">Score</TableCell>
                            <TableCell align="center">Grade</TableCell>
                            <TableCell align="center">Time</TableCell>
                            <TableCell align="center">Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedStudent.examAttempts.slice(0, 10).map((exam, index) => (
                            <TableRow key={index}>
                              <TableCell>{exam.quiz.title}</TableCell>
                              <TableCell align="center">
                                {exam.percentage.toFixed(1)}%
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={exam.gradeLetter}
                                  color={getGradeColor(exam.percentage) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                {formatTime(exam.timeSpent)}
                              </TableCell>
                              <TableCell align="center">
                                {new Date(exam.submittedAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDetailOpen(false)}>
            Close
          </Button>
          <Button variant="contained" startIcon={<Message />}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentManagement;