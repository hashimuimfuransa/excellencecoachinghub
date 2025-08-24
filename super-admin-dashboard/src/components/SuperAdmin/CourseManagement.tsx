import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Badge,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  Rating,
  Paper
} from '@mui/material';
import {
  Search,
  FilterList,
  School,
  Add,
  Visibility,
  Edit,
  Delete,
  Block,
  CheckCircle,
  MoreVert,
  Download,
  Upload,
  Person,
  Schedule,
  People,
  Assignment,
  TrendingUp,
  TrendingDown,
  Warning,
  Error,
  Info,
  Refresh,
  Star,
  StarBorder,
  Flag,
  Share,
  Archive,
  Unarchive,
  Publish,
  Create,
  Pause,
  PlayArrow,
  VideoLibrary,
  Quiz,
  CardMembership,
  Group,
  AccessTime,
  Language,
  Category,
  BookmarkBorder,
  Bookmark
} from '@mui/icons-material';
import type { Course } from '../../types/course';
import type { User } from '../../types/user';
import { superAdminService } from '../../services/superAdminService';

interface CourseManagementProps {
  onCourseSelect?: (course: Course) => void;
}

interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  completionRate: number;
  averageRating: number;
  topInstructors: Array<{ instructor: string; courses: number; students: number; rating: number }>;
  topCategories: Array<{ category: string; courses: number; enrollments: number }>;
}

interface CourseFilter {
  search: string;
  category: string;
  level: string;
  status: string;
  instructor: string;
  featured: boolean;
  minRating: number;
}

interface ExtendedCourse extends Course {
  status: 'active' | 'draft' | 'archived';
  enrollments: number;
  completions: number;
  rating: number;
  reviews: number;
  featured: boolean;
  price?: number;
  currency?: string;
  language: string;
  lastUpdated: string;
}

const CourseManagement: React.FC<CourseManagementProps> = ({ onCourseSelect }) => {
  const [courses, setCourses] = useState<ExtendedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCourses, setTotalCourses] = useState(0);
  const [stats, setStats] = useState<CourseStats>({
    totalCourses: 0,
    activeCourses: 0,
    draftCourses: 0,
    totalEnrollments: 0,
    completionRate: 0,
    averageRating: 0,
    topInstructors: [],
    topCategories: []
  });

  const [filters, setFilters] = useState<CourseFilter>({
    search: '',
    category: '',
    level: '',
    status: '',
    instructor: '',
    featured: false,
    minRating: 0
  });

  const [selectedCourse, setSelectedCourse] = useState<ExtendedCourse | null>(null);
  const [courseDialog, setCourseDialog] = useState({
    open: false,
    mode: 'view' as 'view' | 'edit' | 'create',
    course: null as ExtendedCourse | null
  });

  const [actionMenu, setActionMenu] = useState<{
    anchorEl: HTMLElement | null;
    course: ExtendedCourse | null;
  }>({ anchorEl: null, course: null });

  const [bulkActions, setBulkActions] = useState({
    selectedCourses: [] as string[],
    selectAll: false
  });

  useEffect(() => {
    loadCourses();
    loadStats();
  }, [page, rowsPerPage, filters]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getAllCourses({
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        status: filters.status || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      console.log('🔍 CourseManagement: Raw API response:', response);

      // Handle different possible response structures
      let coursesData: Course[] = [];
      let totalCount = 0;

      if (response) {
        // Check if response has courses directly
        if (response.courses && Array.isArray(response.courses)) {
          coursesData = response.courses;
          totalCount = response.total || response.courses.length;
        }
        // Check if response has data.courses structure
        else if (response.data && response.data.courses && Array.isArray(response.data.courses)) {
          coursesData = response.data.courses;
          totalCount = response.data.total || response.data.courses.length;
        }
        // Check if response is directly an array
        else if (Array.isArray(response)) {
          coursesData = response;
          totalCount = response.length;
        }
        // Check if response has success and data structure
        else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            coursesData = response.data;
            totalCount = response.data.length;
          } else if (response.data.courses) {
            coursesData = response.data.courses;
            totalCount = response.data.total || response.data.courses.length;
          }
        }
      }

      console.log('🔍 CourseManagement: Extracted courses data:', coursesData);
      console.log('🔍 CourseManagement: Total count:', totalCount);

      // Transform API data to ExtendedCourse format
      const transformedCourses: ExtendedCourse[] = coursesData.map(course => ({
        ...course,
        status: 'active', // Default status
        enrollments: Math.floor(Math.random() * 2000) + 100, // Mock data for now
        completions: Math.floor(Math.random() * 1500) + 50, // Mock data for now
        rating: Math.floor(Math.random() * 20) / 10 + 4, // Mock rating 4.0-5.0
        reviews: Math.floor(Math.random() * 500) + 50, // Mock reviews
        featured: Math.random() > 0.7, // 30% chance of being featured
        price: Math.floor(Math.random() * 200) + 50, // Mock price $50-$250
        currency: 'USD',
        language: 'English',
        lastUpdated: course.updatedAt || new Date().toISOString()
      }));

      setCourses(transformedCourses);
      setTotalCourses(totalCount);
    } catch (error) {
      console.error('Error loading courses:', error);
      // Fallback to mock data if API fails
      const mockCourses: ExtendedCourse[] = [
        {
          _id: '1',
          title: 'Complete React Development Course',
          description: 'Learn React from basics to advanced concepts including hooks, context, and testing.',
          category: 'Web Development',
          level: 'Intermediate',
          duration: 40,
          instructor: {
            _id: 'inst1',
            firstName: 'Dr. Sarah',
            lastName: 'Johnson',
            email: 'sarah@university.edu',
            role: 'teacher' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          status: 'active',
          enrollments: 1247,
          completions: 892,
          rating: 4.8,
          reviews: 234,
          featured: true,
          price: 99,
          currency: 'USD',
          language: 'English',
          lastUpdated: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          _id: '2',
          title: 'Python for Data Science',
          description: 'Master Python programming for data analysis, visualization, and machine learning.',
          category: 'Data Science',
          level: 'Beginner',
          duration: 35,
          instructor: {
            _id: 'inst2',
            firstName: 'Prof. Michael',
            lastName: 'Chen',
            email: 'michael@techuni.edu',
            role: 'teacher' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          status: 'active',
          enrollments: 2156,
          completions: 1634,
          rating: 4.6,
          reviews: 456,
          featured: false,
          price: 79,
          currency: 'USD',
          language: 'English',
          lastUpdated: '2024-01-18T14:30:00Z',
          createdAt: '2024-01-05T09:00:00Z',
          updatedAt: '2024-01-18T14:30:00Z'
        },
        {
          _id: '3',
          title: 'Digital Marketing Fundamentals',
          description: 'Learn the essentials of digital marketing including SEO, social media, and analytics.',
          category: 'Marketing',
          level: 'Beginner',
          duration: 25,
          instructor: {
            _id: 'inst3',
            firstName: 'Lisa',
            lastName: 'Rodriguez',
            email: 'lisa@marketingpro.com',
            role: 'teacher' as any,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          status: 'draft',
          enrollments: 0,
          completions: 0,
          rating: 0,
          reviews: 0,
          featured: false,
          price: 59,
          currency: 'USD',
          language: 'English',
          lastUpdated: '2024-01-20T11:15:00Z',
          createdAt: '2024-01-20T11:15:00Z',
          updatedAt: '2024-01-20T11:15:00Z'
        }
      ];

      setCourses(mockCourses);
      setTotalCourses(mockCourses.length);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('🔍 CourseManagement: Loading real course stats...');
      const statsData = await superAdminService.getCourseStats();
      console.log('📊 CourseManagement: Loaded stats:', statsData);
      
      setStats({
        totalCourses: statsData.totalCourses || 0,
        activeCourses: statsData.activeCourses || 0,
        draftCourses: statsData.draftCourses || 0,
        totalEnrollments: statsData.totalEnrollments || 0,
        completionRate: statsData.completionRate || 0,
        averageRating: statsData.averageRating || 0,
        topInstructors: statsData.topInstructors || [],
        topCategories: statsData.topCategories || []
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to basic stats if API fails
      setStats({
        totalCourses: 0,
        activeCourses: 0,
        draftCourses: 0,
        totalEnrollments: 0,
        completionRate: 0,
        averageRating: 0,
        topInstructors: [],
        topCategories: []
      });
    }
  };

  const handleFilterChange = (field: keyof CourseFilter, value: string | boolean | number) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleCourseAction = (action: string, course: ExtendedCourse) => {
    setActionMenu({ anchorEl: null, course: null });
    
    switch (action) {
      case 'view':
        setCourseDialog({ open: true, mode: 'view', course });
        break;
      case 'edit':
        setCourseDialog({ open: true, mode: 'edit', course });
        break;
      case 'activate':
        handleActivateCourse(course);
        break;
      case 'archive':
        handleArchiveCourse(course);
        break;
      case 'feature':
        handleFeatureCourse(course);
        break;
      case 'delete':
        handleDeleteCourse(course);
        break;
      case 'duplicate':
        handleDuplicateCourse(course);
        break;
      case 'analytics':
        handleViewAnalytics(course);
        break;
    }
  };

  const handleActivateCourse = async (course: ExtendedCourse) => {
    try {
      console.log('Activating course:', course.title);
      loadCourses();
    } catch (error) {
      console.error('Error activating course:', error);
    }
  };

  const handleArchiveCourse = async (course: ExtendedCourse) => {
    try {
      console.log('Archiving course:', course.title);
      loadCourses();
    } catch (error) {
      console.error('Error archiving course:', error);
    }
  };

  const handleFeatureCourse = async (course: ExtendedCourse) => {
    try {
      console.log('Featuring course:', course.title);
      loadCourses();
    } catch (error) {
      console.error('Error featuring course:', error);
    }
  };

  const handleDeleteCourse = async (course: ExtendedCourse) => {
    if (window.confirm(`Are you sure you want to delete "${course.title}"?`)) {
      try {
        console.log('Deleting course:', course.title);
        loadCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const handleDuplicateCourse = async (course: ExtendedCourse) => {
    try {
      console.log('Duplicating course:', course.title);
      loadCourses();
    } catch (error) {
      console.error('Error duplicating course:', error);
    }
  };

  const handleViewAnalytics = (course: ExtendedCourse) => {
    console.log('Viewing analytics for course:', course.title);
  };

  const handleBulkAction = (action: string) => {
    const selectedCourseIds = bulkActions.selectedCourses;
    if (selectedCourseIds.length === 0) return;

    switch (action) {
      case 'activate':
        console.log('Bulk activating courses:', selectedCourseIds);
        break;
      case 'archive':
        console.log('Bulk archiving courses:', selectedCourseIds);
        break;
      case 'feature':
        console.log('Bulk featuring courses:', selectedCourseIds);
        break;
      case 'delete':
        if (window.confirm(`Delete ${selectedCourseIds.length} selected courses?`)) {
          console.log('Bulk deleting courses:', selectedCourseIds);
        }
        break;
      case 'export':
        console.log('Exporting selected courses:', selectedCourseIds);
        break;
    }
    
    setBulkActions({ selectedCourses: [], selectAll: false });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'default';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="success" />;
      case 'draft':
        return <Create />;
      case 'archived':
        return <Archive color="error" />;
      default:
        return <Info />;
    }
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'Free';
    return `${currency || '$'}${price}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Courses"
            value={stats.totalCourses}
            icon={<School />}
            color="primary"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Courses"
            value={stats.activeCourses}
            icon={<CheckCircle />}
            color="success"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Enrollments"
            value={stats.totalEnrollments}
            icon={<People />}
            color="info"
            trend={15}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            subtitle={`Avg Rating: ${stats.averageRating}`}
            icon={<CardMembership />}
            color="warning"
            trend={5}
          />
        </Grid>
      </Grid>

      {/* Top Instructors and Categories */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Instructors
              </Typography>
              <List>
                {Array.isArray(stats.topInstructors) && stats.topInstructors.slice(0, 5).map((instructor, index) => (
                  <ListItem key={instructor.instructor}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={instructor.instructor}
                      secondary={`${instructor.courses} courses, ${instructor.students} students`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating value={instructor.rating} readOnly size="small" />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {instructor.rating}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Categories
              </Typography>
              <List>
                {Array.isArray(stats.topCategories) && stats.topCategories.map((category, index) => (
                  <ListItem key={category.category}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <Category />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={category.category}
                      secondary={`${category.courses} courses, ${category.enrollments} enrollments`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search courses..."
              variant="outlined"
              size="small"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 250 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Web Development">Web Development</MenuItem>
                <MenuItem value="Data Science">Data Science</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Business">Business</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Level</InputLabel>
              <Select
                value={filters.level}
                label="Level"
                onChange={(e) => handleFilterChange('level', e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                />
              }
              label="Featured Only"
            />

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCourseDialog({ open: true, mode: 'create', course: null })}
            >
              Create Course
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleBulkAction('export')}
            >
              Export
            </Button>

            <IconButton onClick={loadCourses}>
              <Refresh />
            </IconButton>
          </Box>

          {/* Bulk Actions */}
          {bulkActions.selectedCourses.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>
                  {bulkActions.selectedCourses.length} course(s) selected
                </Typography>
                <Button size="small" onClick={() => handleBulkAction('activate')}>
                  Activate
                </Button>
                <Button size="small" onClick={() => handleBulkAction('feature')}>
                  Feature
                </Button>
                <Button size="small" onClick={() => handleBulkAction('archive')}>
                  Archive
                </Button>
                <Button size="small" color="error" onClick={() => handleBulkAction('delete')}>
                  Delete
                </Button>
                <Button size="small" onClick={() => setBulkActions({ selectedCourses: [], selectAll: false })}>
                  Clear
                </Button>
              </Box>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading && <LinearProgress />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Switch
                      checked={bulkActions.selectAll}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setBulkActions({
                          selectAll: checked,
                          selectedCourses: checked && Array.isArray(courses) ? courses.map(c => c._id) : []
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Instructor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Enrollments</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(courses) && courses.map((course) => (
                  <TableRow key={course._id} hover>
                    <TableCell padding="checkbox">
                      <Switch
                        checked={bulkActions.selectedCourses.includes(course._id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBulkActions(prev => ({
                            selectAll: false,
                            selectedCourses: checked
                              ? [...prev.selectedCourses, course._id]
                              : prev.selectedCourses.filter(id => id !== course._id)
                          }));
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <VideoLibrary />
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {course.title}
                            </Typography>
                            {course.featured && (
                              <Tooltip title="Featured Course">
                                <Star color="warning" fontSize="small" />
                              </Tooltip>
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {course.category} • {course.level}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <AccessTime fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {course.duration} hours • {course.language}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {course.instructor?.firstName} {course.instructor?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.instructor?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(course.status)}
                        label={course.status.toUpperCase()}
                        color={getStatusColor(course.status) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {course.enrollments.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {course.completions} completed ({Math.round((course.completions / course.enrollments) * 100) || 0}%)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={course.rating} readOnly size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {course.rating} ({course.reviews})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatPrice(course.price, course.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleCourseAction('view', course)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Course">
                          <IconButton
                            size="small"
                            onClick={() => handleCourseAction('edit', course)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => setActionMenu({ anchorEl: e.currentTarget, course })}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCourses}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={() => setActionMenu({ anchorEl: null, course: null })}
      >
        <MenuItem onClick={() => handleCourseAction('view', actionMenu.course!)}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCourseAction('edit', actionMenu.course!)}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Course</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCourseAction('analytics', actionMenu.course!)}>
          <ListItemIcon><TrendingUp /></ListItemIcon>
          <ListItemText>View Analytics</ListItemText>
        </MenuItem>
        <Divider />
        {actionMenu.course?.status === 'active' ? (
          <MenuItem onClick={() => handleCourseAction('archive', actionMenu.course!)}>
            <ListItemIcon><Archive /></ListItemIcon>
            <ListItemText>Archive Course</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleCourseAction('activate', actionMenu.course!)}>
            <ListItemIcon><CheckCircle /></ListItemIcon>
            <ListItemText>Activate Course</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleCourseAction('feature', actionMenu.course!)}>
          <ListItemIcon>{actionMenu.course?.featured ? <StarBorder /> : <Star />}</ListItemIcon>
          <ListItemText>{actionMenu.course?.featured ? 'Unfeature' : 'Feature'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCourseAction('duplicate', actionMenu.course!)}>
          <ListItemIcon><Share /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleCourseAction('delete', actionMenu.course!)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete Course</ListItemText>
        </MenuItem>
      </Menu>

      {/* Course Dialog */}
      <Dialog
        open={courseDialog.open}
        onClose={() => setCourseDialog({ open: false, mode: 'view', course: null })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {courseDialog.mode === 'create' ? 'Create New Course' :
           courseDialog.mode === 'edit' ? 'Edit Course' : 'Course Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Course Title"
                variant="outlined"
                defaultValue={courseDialog.course?.title}
                disabled={courseDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  defaultValue={courseDialog.course?.category || ''}
                  disabled={courseDialog.mode === 'view'}
                >
                  <MenuItem value="Web Development">Web Development</MenuItem>
                  <MenuItem value="Data Science">Data Science</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Business">Business</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  label="Level"
                  defaultValue={courseDialog.course?.level || ''}
                  disabled={courseDialog.mode === 'view'}
                >
                  <MenuItem value="Beginner">Beginner</MenuItem>
                  <MenuItem value="Intermediate">Intermediate</MenuItem>
                  <MenuItem value="Advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                variant="outlined"
                defaultValue={courseDialog.course?.description}
                disabled={courseDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (hours)"
                type="number"
                variant="outlined"
                defaultValue={courseDialog.course?.duration}
                disabled={courseDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                variant="outlined"
                defaultValue={(courseDialog.course as ExtendedCourse)?.price}
                disabled={courseDialog.mode === 'view'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  label="Language"
                  defaultValue={(courseDialog.course as ExtendedCourse)?.language || 'English'}
                  disabled={courseDialog.mode === 'view'}
                >
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Spanish">Spanish</MenuItem>
                  <MenuItem value="French">French</MenuItem>
                  <MenuItem value="German">German</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={(courseDialog.course as ExtendedCourse)?.featured}
                    disabled={courseDialog.mode === 'view'}
                  />
                }
                label="Featured Course"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourseDialog({ open: false, mode: 'view', course: null })}>
            Cancel
          </Button>
          {courseDialog.mode !== 'view' && (
            <Button variant="contained">
              {courseDialog.mode === 'create' ? 'Create Course' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseManagement;