import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People,
  School,
  TrendingUp,
  Search,
  Email,
  Visibility,
  Message,
  FilterList
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';

interface StudentData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  enrolledCourses: {
    courseId: string;
    courseName: string;
    progress: number;
    enrolledAt: string;
    lastActive: string;
  }[];
  totalProgress: number;
  isActive: boolean;
}

const TeacherStudents: React.FC = () => {
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== 'teacher') return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Load teacher's courses
        const coursesResponse = await courseService.getAllCourses({
          instructor: user._id,
          status: 'approved',
          limit: 50
        });
        
        setCourses(coursesResponse.courses);
        
        // Process student data from enrolled courses
        const studentMap = new Map<string, StudentData>();
        
        coursesResponse.courses.forEach(course => {
          if (course.enrolledStudents) {
            course.enrolledStudents.forEach((student: any) => {
              const studentId = typeof student === 'string' ? student : student._id;
              const studentData = typeof student === 'object' ? student : null;
              
              if (studentData) {
                if (!studentMap.has(studentId)) {
                  studentMap.set(studentId, {
                    _id: studentId,
                    firstName: studentData.firstName || 'Unknown',
                    lastName: studentData.lastName || 'Student',
                    email: studentData.email || '',
                    avatar: studentData.avatar,
                    enrolledCourses: [],
                    totalProgress: 0,
                    isActive: true
                  });
                }
                
                const existingStudent = studentMap.get(studentId)!;
                existingStudent.enrolledCourses.push({
                  courseId: course._id,
                  courseName: course.title,
                  progress: Math.floor(Math.random() * 100), // Mock progress
                  enrolledAt: course.createdAt,
                  lastActive: new Date().toISOString()
                });
              }
            });
          }
        });
        
        // Calculate total progress for each student
        const studentsArray = Array.from(studentMap.values()).map(student => ({
          ...student,
          totalProgress: student.enrolledCourses.length > 0 
            ? Math.round(student.enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / student.enrolledCourses.length)
            : 0
        }));
        
        setStudents(studentsArray);
        
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === 'all' || 
      student.enrolledCourses.some(course => course.courseId === selectedCourse);
    
    return matchesSearch && matchesCourse;
  });

  // Statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.isActive).length;
  const averageProgress = students.length > 0 
    ? Math.round(students.reduce((sum, s) => sum + s.totalProgress, 0) / students.length)
    : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'info';
    if (progress >= 40) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          My Students
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track student progress and engagement across your courses
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{totalStudents}</Typography>
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
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{activeStudents}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Students
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
                <School color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{courses.length}</Typography>
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
                <TrendingUp color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{averageProgress}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Course</InputLabel>
                <Select
                  value={selectedCourse}
                  label="Filter by Course"
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
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCourse('all');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <Box textAlign="center" py={4}>
              <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {students.length === 0 ? 'No students yet' : 'No students found'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {students.length === 0 
                  ? 'Students will appear here once they enroll in your courses.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell align="center">Enrolled Courses</TableCell>
                    <TableCell align="center">Overall Progress</TableCell>
                    <TableCell align="center">Last Active</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar
                            src={student.avatar}
                            sx={{ mr: 2 }}
                          >
                            {student.firstName[0]}{student.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {student.firstName} {student.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={student.enrolledCourses.length} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            {student.totalProgress}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={student.totalProgress}
                            color={getProgressColor(student.totalProgress) as any}
                            sx={{ width: 80 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {formatDate(student.enrolledCourses[0]?.lastActive || new Date().toISOString())}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Message">
                          <IconButton size="small">
                            <Message />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Email">
                          <IconButton 
                            size="small"
                            onClick={() => window.open(`mailto:${student.email}`)}
                          >
                            <Email />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default TeacherStudents;
