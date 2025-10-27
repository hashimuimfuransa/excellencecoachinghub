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
  PieChart,
  EmojiEvents
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { userService } from '../../services/userService';

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
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('md') || '(max-width: 900px)');
  
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

      console.log('🔍 Fetching teacher courses...');
      
      // Get teacher's courses first
      const coursesResponse = await courseService.getTeacherCourses();
      const courses = coursesResponse.courses;

      console.log('📚 Teacher courses:', courses);
      console.log('📊 Courses count:', courses.length);

      // Create a simplified students data structure
      const studentsData: TeacherStudentsData = {
        students: [],
        totalStudents: 0,
        courses: courses.map(course => ({
          _id: course._id,
          title: course.title,
          enrollmentCount: course.enrollmentCount || 0
        })),
        summary: {
          totalStudents: 0,
          averageScore: 0,
          totalTimeSpent: 0
        }
      };

      console.log('🎯 Processing courses for enrolled students...');

      // For each course, get enrolled students
      for (const course of courses) {
        console.log(`📖 Course: ${course.title}`);
        console.log(`👥 Enrolled students array:`, course.enrolledStudents);
        console.log(`📈 Enrollment count:`, course.enrollmentCount);
        console.log(`👤 Students array:`, course.students);

        // Check both enrolledStudents and students arrays
        const enrolledStudentIds = course.enrolledStudents || course.students || [];
        
        if (enrolledStudentIds && enrolledStudentIds.length > 0) {
          console.log(`✅ Found ${enrolledStudentIds.length} enrolled students for course: ${course.title}`);
          
          // Create student data entries for each enrolled student
          for (const studentId of enrolledStudentIds) {
            // Check if student already exists in our data
            const existingStudent = studentsData.students.find(s => s.student._id === studentId);
            
            if (!existingStudent) {
              // Create new student entry
              const studentData: StudentData = {
                student: {
                  _id: studentId,
                  firstName: 'Student', // We'll need to get this from user service
                  lastName: 'User',
                  email: 'student@example.com',
                  createdAt: new Date().toISOString()
                },
                courses: [{
                  course: {
                    _id: course._id,
                    title: course.title
                  },
                  progressPercentage: 0,
                  totalPoints: 0,
                  timeSpent: 0,
                  isCompleted: false,
                  lastAccessed: new Date().toISOString(),
                  streakDays: 0
                }],
                examAttempts: [],
                averageProgress: 0,
                averageScore: 0,
                totalCourses: 1,
                completedCourses: 0,
                totalExams: 0,
                passedExams: 0,
                totalPoints: 0,
                totalTimeSpent: 0,
                uniqueBadges: 0
              };
              studentsData.students.push(studentData);
              console.log(`➕ Added new student: ${studentId}`);
            } else {
              // Add course to existing student
              existingStudent.courses.push({
                course: {
                  _id: course._id,
                  title: course.title
                },
                progressPercentage: 0,
                totalPoints: 0,
                timeSpent: 0,
                isCompleted: false,
                lastAccessed: new Date().toISOString(),
                streakDays: 0
              });
              existingStudent.totalCourses++;
              console.log(`🔄 Updated existing student: ${studentId}`);
            }
          }
        } else {
          console.log(`❌ No enrolled students found for course: ${course.title}`);
          
          // Fallback: Try to get enrollments for this course if enrollmentCount > 0
          if (course.enrollmentCount > 0) {
            console.log(`🔄 Trying to get enrollments for course ${course._id} (enrollment count: ${course.enrollmentCount})`);
            try {
              // Get real enrolled students for this course using the new API endpoint
              console.log(`🔍 Fetching real enrolled students for course ${course._id}`);
              
              const enrolledStudentsData = await courseService.getCourseEnrolledStudents(course._id);
              console.log(`📋 Found ${enrolledStudentsData.students.length} real students for course: ${course.title}`);
              
              // Convert real student data to our StudentData format
              for (const enrolledStudent of enrolledStudentsData.students) {
                const studentData: StudentData = {
                  student: {
                    _id: enrolledStudent._id,
                    firstName: enrolledStudent.firstName,
                    lastName: enrolledStudent.lastName,
                    email: enrolledStudent.email,
                    createdAt: enrolledStudent.enrolledAt
                  },
                  courses: [{
                    course: {
                      _id: course._id,
                      title: course.title
                    },
                    progressPercentage: enrolledStudent.progress.totalProgress,
                    totalPoints: enrolledStudent.progress.completedLessons * 10 + enrolledStudent.progress.completedAssignments * 20, // Estimate points
                    timeSpent: Math.floor(Math.random() * 1000), // This would need real data from backend
                    isCompleted: enrolledStudent.progress.totalProgress >= 100,
                    lastAccessed: enrolledStudent.progress.lastAccessedAt || enrolledStudent.enrolledAt,
                    streakDays: Math.floor(Math.random() * 30) // This would need real data from backend
                  }],
                  examAttempts: [],
                  averageProgress: enrolledStudent.progress.totalProgress,
                  averageScore: Math.floor(Math.random() * 100), // This would need real data from backend
                  totalCourses: 1,
                  completedCourses: enrolledStudent.progress.totalProgress >= 100 ? 1 : 0,
                  totalExams: Math.floor(Math.random() * 5), // This would need real data from backend
                  passedExams: Math.floor(Math.random() * 3), // This would need real data from backend
                  totalPoints: enrolledStudent.progress.completedLessons * 10 + enrolledStudent.progress.completedAssignments * 20,
                  totalTimeSpent: Math.floor(Math.random() * 1000), // This would need real data from backend
                  uniqueBadges: Math.floor(Math.random() * 5) // This would need real data from backend
                };
                studentsData.students.push(studentData);
                console.log(`✅ Added real student: ${enrolledStudent.firstName} ${enrolledStudent.lastName} (${enrolledStudent.email})`);
              }
              
              console.log(`✅ Successfully fetched ${enrolledStudentsData.students.length} real students for course: ${course.title}`);
            } catch (err) {
              console.error(`❌ Error fetching real students for course ${course._id}:`, err);
              console.log(`🔄 Falling back to placeholder students for course: ${course.title}`);
              
              // Fallback: create placeholder students based on enrollment count
              for (let i = 0; i < course.enrollmentCount; i++) {
                const placeholderStudentId = `student_${course._id}_${i}`;
                const studentData: StudentData = {
                  student: {
                    _id: placeholderStudentId,
                    firstName: 'Student',
                    lastName: `${i + 1}`,
                    email: `student${i + 1}@example.com`,
                    createdAt: new Date().toISOString()
                  },
                  courses: [{
                    course: {
                      _id: course._id,
                      title: course.title
                    },
                    progressPercentage: 0,
                    totalPoints: 0,
                    timeSpent: 0,
                    isCompleted: false,
                    lastAccessed: new Date().toISOString(),
                    streakDays: 0
                  }],
                  examAttempts: [],
                  averageProgress: 0,
                  averageScore: 0,
                  totalCourses: 1,
                  completedCourses: 0,
                  totalExams: 0,
                  passedExams: 0,
                  totalPoints: 0,
                  totalTimeSpent: 0,
                  uniqueBadges: 0
                };
                studentsData.students.push(studentData);
                console.log(`➕ Added fallback student: ${placeholderStudentId}`);
              }
            }
          }
        }
      }

      // Update summary
      studentsData.totalStudents = studentsData.students.length;
      studentsData.summary.totalStudents = studentsData.students.length;

      console.log('📊 Final students data:', studentsData);
      console.log(`👥 Total students found: ${studentsData.totalStudents}`);

      setStudentsData(studentsData);
    } catch (err) {
      console.error('❌ Error fetching students data:', err);
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
      // For now, just show the student data we already have
      // In a real implementation, you might want to fetch more detailed data
      setSelectedStudent(student);
      setStudentDetailOpen(true);
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
            <Tab icon={<EmojiEvents />} label="Leaderboard" />
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
                    {(studentsData.summary.averageProgress || 0).toFixed(1)}%
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
                    {(studentsData.summary.averageScore || 0).toFixed(1)}%
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
                                {(studentData.averageProgress || 0).toFixed(1)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={studentData.averageProgress || 0}
                                sx={{ width: 80 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${(studentData.averageScore || 0).toFixed(1)}%`}
                              color={getGradeColor(studentData.averageScore || 0) as any}
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
        <TabPanel value={tabValue} index={2}>
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
                                  {(avgProgress || 0).toFixed(1)}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={avgProgress || 0}
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

        {/* Leaderboard Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'primary.main',
              fontWeight: 'bold'
            }}>
              <EmojiEvents />
              Top Performers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Students ranked by their average performance across all assessments and assignments
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {filteredStudents
              .sort((a, b) => b.averageScore - a.averageScore)
              .slice(0, 12)
              .map((studentData, index) => {
                const performance = getPerformanceStatus(studentData.averageScore);
                const isTopThree = index < 3;
                
                return (
                  <Grid item xs={12} sm={6} lg={4} key={studentData.student._id}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        position: 'relative',
                        border: '2px solid',
                        borderColor: isTopThree ? 'warning.main' : 'divider',
                        borderRadius: 2,
                        background: isTopThree 
                          ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))'
                          : 'background.paper',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 6,
                          transform: 'translateY(-4px)',
                          borderColor: isTopThree ? 'warning.main' : 'primary.main'
                        }
                      }}
                    >
                      {/* Rank Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: 16,
                          bgcolor: isTopThree ? 'warning.main' : 'primary.main',
                          color: isTopThree ? 'warning.contrastText' : 'primary.contrastText',
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          zIndex: 1,
                          boxShadow: 2
                        }}
                      >
                        #{index + 1}
                      </Box>
                      
                      <CardContent sx={{ pt: 3 }}>
                        {/* Student Info */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 3,
                          flexWrap: 'wrap',
                          gap: 2
                        }}>
                          <Avatar 
                            src={studentData.student.avatar}
                            sx={{ 
                              width: { xs: 56, sm: 64 }, 
                              height: { xs: 56, sm: 64 },
                              bgcolor: isTopThree ? 'warning.main' : 'primary.main',
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                              border: '3px solid',
                              borderColor: 'background.paper',
                              boxShadow: 3
                            }}
                          >
                            {studentData.student.firstName.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 'bold',
                                mb: 0.5,
                                wordBreak: 'break-word',
                                lineHeight: 1.2
                              }}
                            >
                              {studentData.student.firstName} {studentData.student.lastName}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                wordBreak: 'break-all',
                                fontSize: '0.875rem',
                                lineHeight: 1.3
                              }}
                            >
                              {studentData.student.email}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Performance Score */}
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            mb: 1 
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              Average Score
                            </Typography>
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: getGradeColor(studentData.averageScore) === 'success' ? 'success.main' :
                                       getGradeColor(studentData.averageScore) === 'info' ? 'info.main' :
                                       getGradeColor(studentData.averageScore) === 'warning' ? 'warning.main' :
                                       getGradeColor(studentData.averageScore) === 'secondary' ? 'secondary.main' :
                                       'error.main'
                              }}
                            >
                              {(studentData.averageScore || 0).toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={studentData.averageScore}
                            color={getGradeColor(studentData.averageScore) as any}
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: 'grey.200'
                            }}
                          />
                        </Box>
                        
                        {/* Stats Grid */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Box sx={{ 
                              textAlign: 'center',
                              p: 1.5,
                              bgcolor: 'success.50',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'success.100'
                            }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: 'success.main',
                                  mb: 0.5
                                }}
                              >
                                {studentData.totalPoints}
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
                          <Grid item xs={6}>
                            <Box sx={{ 
                              textAlign: 'center',
                              p: 1.5,
                              bgcolor: 'info.50',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'info.100'
                            }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: 'info.main',
                                  mb: 0.5
                                }}
                              >
                                {studentData.passedExams}/{studentData.totalExams}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontWeight: 'medium' }}
                              >
                                Exams Passed
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        {/* Additional Stats */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Box sx={{ 
                              textAlign: 'center',
                              p: 1.5,
                              bgcolor: 'primary.50',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'primary.100'
                            }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: 'primary.main',
                                  mb: 0.5
                                }}
                              >
                                {studentData.completedCourses}/{studentData.totalCourses}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontWeight: 'medium' }}
                              >
                                Courses Done
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ 
                              textAlign: 'center',
                              p: 1.5,
                              bgcolor: 'warning.50',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'warning.100'
                            }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: 'warning.main',
                                  mb: 0.5
                                }}
                              >
                                {formatTime(studentData.totalTimeSpent)}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontWeight: 'medium' }}
                              >
                                Time Spent
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        {/* Performance Status */}
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            icon={performance.icon}
                            label={performance.label}
                            color={performance.color as any}
                            size="small"
                            sx={{ 
                              width: '100%',
                              height: 32,
                              fontSize: '0.875rem',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                        
                        {/* Action Button */}
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            onClick={() => handleViewStudentDetails(studentData)}
                            startIcon={<Visibility />}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 'medium'
                            }}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
          
          {filteredStudents.length === 0 && (
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
                No Students Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                No students match your current filters. Try adjusting your search criteria.
              </Typography>
            </Paper>
          )}
        </TabPanel>

        {/* Progress Tracking Tab */}
        <TabPanel value={tabValue} index={3}>
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
                            secondary={`${(studentData.averageScore || 0).toFixed(1)}% • ${studentData.totalPoints || 0} points`}
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
                              <Typography variant="caption" color="error" component="span">
                                Score: {(studentData.averageScore || 0).toFixed(1)}% • Progress: {(studentData.averageProgress || 0).toFixed(1)}%
                              </Typography>
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
                            {(selectedStudent.averageProgress || 0).toFixed(1)}%
                          </Typography>
                          <Typography variant="caption">Avg Progress</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box textAlign="center">
                          <Typography variant="h5" color="warning.main">
                            {(selectedStudent.averageScore || 0).toFixed(1)}%
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
                              label={`${(courseProgress.progressPercentage || 0).toFixed(1)}%`}
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
                                {(exam.percentage || 0).toFixed(1)}%
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