import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Person,
  Email,
  Phone,
  CalendarToday,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Grade,
  Message,
  Visibility,
  Edit,
  Delete,
  Block,
  Unblock,
  PersonAdd,
  Group,
  School,
  Work,
  LocationOn,
  AccessTime,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
  Share,
  Download,
  Upload,
  Sync,
  Refresh,
  Sort,
  ViewList,
  ViewModule,
  Fullscreen,
  FullscreenExit,
  ZoomIn,
  ZoomOut,
  FitScreen,
  AspectRatio,
  Crop,
  CropFree,
  CropSquare,
  CropPortrait,
  CropLandscape,
  CropRotate,
  RotateLeft,
  RotateRight,
  Flip,
  Transform,
  Straighten,
  Tune,
  Filter,
  FilterAlt,
  SortByAlpha,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  KeyboardArrowUp,
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  ExpandLess,
  ExpandMore,
  UnfoldMore,
  UnfoldLess,
  CheckCircleOutline,
  Cancel,
  Close,
  Done,
  DoneAll,
  Send,
  Reply,
  Forward,
  Archive,
  Unarchive,
  Flag,
  Report,
  PersonRemove,
  GroupAdd,
  GroupRemove,
  AdminPanelSettings,
  Security,
  PrivacyTip,
  Verified,
  VerifiedUser,
  Gavel,
  Balance,
  Scale,
  GpsFixed,
  MyLocation,
  Directions,
  Map,
  Terrain,
  Satellite,
  Streetview,
  Timeline,
  History,
  Event,
  EventNote,
  EventAvailable,
  EventBusy,
  Today,
  DateRange,
  CalendarMonth,
  CalendarViewDay,
  CalendarViewWeek,
  CalendarViewMonth,
  CalendarToday as CalendarTodayIcon,
  Timer,
  HourglassEmpty,
  HourglassFull,
  WatchLater,
  Update,
  Cached,
  Autorenew,
  Loop,
  Shuffle,
  Repeat,
  RepeatOne,
  FastRewind,
  FastForward,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  Computer,
  Business,
  DesignServices,
  Language,
  Science,
  Engineering,
  HealthAndSafety,
  Attractions,
  MusicNote,
  Palette,
  Build,
  Biotech,
  AccountBalance,
  Restaurant,
  DirectionsCar,
  Flight,
  Hotel,
  ShoppingCart,
  Pets,
  Nature,
  WbSunny,
  Cloud,
  Water,
  Eco,
  Recycling,
  Park,
  Forest,
  Beach,
  Mountain,
  City,
  Home,
  Work as WorkIcon,
  Favorite,
  ThumbUp,
  Comment,
  Bookmark as BookmarkIcon,
  MoreVert as MoreVertIcon,
  ContentCopy,
  OpenInNew,
  GetApp,
  CloudUpload,
  CloudDownload,
  SyncProblem,
  Error,
  Info
} from '@mui/icons-material';

// Styled Components
const StudentCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
  },
}));

// Interfaces
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  enrollmentDate: string;
  lastActive: string;
  progress: number;
  status: 'active' | 'inactive' | 'suspended';
  grade: number;
  completedLessons: number;
  totalLessons: number;
  timeSpent: number; // in minutes
  achievements: number;
  notes?: string;
}

interface StudentListProps {
  students: Student[];
  onStudentSelect: (student: Student) => void;
  onStudentEdit: (student: Student) => void;
  onStudentDelete: (studentId: string) => void;
  onStudentMessage: (student: Student) => void;
  onStudentGrade: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  onStudentSelect,
  onStudentEdit,
  onStudentDelete,
  onStudentMessage,
  onStudentGrade
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Filter and sort students
  const filteredStudents = students
    .filter(student => {
      const matchesSearch = 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'grade':
          comparison = a.grade - b.grade;
          break;
        case 'enrollment':
          comparison = new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime();
          break;
        case 'lastActive':
          comparison = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Handle student selection
  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setDetailsDialogOpen(true);
    onStudentSelect(student);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  // Format time spent
  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box>
      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
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
              sx={{ flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="progress">Progress</MenuItem>
                <MenuItem value="grade">Grade</MenuItem>
                <MenuItem value="enrollment">Enrollment</MenuItem>
                <MenuItem value="lastActive">Last Active</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      {/* Student List */}
      <Box>
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Person sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No students found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <StudentCard key={student.id}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Avatar */}
                  <Avatar
                    src={student.avatar}
                    sx={{ width: 56, height: 56 }}
                  >
                    {student.firstName[0]}{student.lastName[0]}
                  </Avatar>

                  {/* Student Info */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {student.firstName} {student.lastName}
                      </Typography>
                      <Chip
                        label={student.status}
                        color={getStatusColor(student.status) as any}
                        size="small"
                      />
                      {student.progress >= 80 && (
                        <Chip
                          icon={<Star />}
                          label="Top Performer"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {student.email}
                    </Typography>
                    
                    {/* Progress Bar */}
                    <Box sx={{ mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Progress
                        </Typography>
                        <Typography variant="body2" color={`${getProgressColor(student.progress)}.main`}>
                          {student.progress}%
                        </Typography>
                      </Stack>
                      <ProgressBar
                        variant="determinate"
                        value={student.progress}
                        color={getProgressColor(student.progress) as any}
                      />
                    </Box>
                    
                    {/* Stats */}
                    <Stack direction="row" spacing={2}>
                      <Typography variant="caption" color="text.secondary">
                        Grade: {student.grade}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Lessons: {student.completedLessons}/{student.totalLessons}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Time: {formatTimeSpent(student.timeSpent)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Achievements: {student.achievements}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                      <IconButton
                        onClick={() => handleStudentClick(student)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Send Message">
                      <IconButton
                        onClick={() => onStudentMessage(student)}
                      >
                        <Message />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Grade Student">
                      <IconButton
                        onClick={() => onStudentGrade(student)}
                      >
                        <Grade />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Student">
                      <IconButton
                        onClick={() => onStudentEdit(student)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More Actions">
                      <IconButton>
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </StudentCard>
          ))
        )}
      </Box>

      {/* Student Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Student Details
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                <Avatar
                  src={selectedStudent.avatar}
                  sx={{ width: 80, height: 80 }}
                >
                  {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedStudent.email}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={selectedStudent.status}
                      color={getStatusColor(selectedStudent.status) as any}
                    />
                    <Chip
                      label={`Grade: ${selectedStudent.grade}%`}
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>
                </Box>
              </Stack>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Progress Overview
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2">Overall Progress</Typography>
                      <Typography variant="body2" color={`${getProgressColor(selectedStudent.progress)}.main`}>
                        {selectedStudent.progress}%
                      </Typography>
                    </Stack>
                    <ProgressBar
                      variant="determinate"
                      value={selectedStudent.progress}
                      color={getProgressColor(selectedStudent.progress) as any}
                    />
                  </Box>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Completed Lessons
                      </Typography>
                      <Typography variant="h6">
                        {selectedStudent.completedLessons} / {selectedStudent.totalLessons}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Time Spent
                      </Typography>
                      <Typography variant="h6">
                        {formatTimeSpent(selectedStudent.timeSpent)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Achievements
                      </Typography>
                      <Typography variant="h6">
                        {selectedStudent.achievements}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Enrollment Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Enrollment Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedStudent.enrollmentDate)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Last Active
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedStudent.lastActive)}
                      </Typography>
                    </Box>
                    {selectedStudent.notes && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Notes
                        </Typography>
                        <Typography variant="body1">
                          {selectedStudent.notes}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => onStudentMessage(selectedStudent!)}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentList;
