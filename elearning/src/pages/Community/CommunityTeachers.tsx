import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Button,
  Stack,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  Rating,
  useTheme,
  alpha,
  styled,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  School,
  Person,
  Star,
  StarBorder,
  Message,
  VideoCall,
  Email,
  LocationOn,
  Work,
  Psychology,
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
  Bookmark,
  Share,
  Download,
  Upload,
  Sync,
  Refresh,
  Search,
  FilterList,
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
  Block,
  Unblock,
  PersonAdd,
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
  CalendarToday,
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
  People,
  Analytics,
  Settings,
  Info,
  CheckCircle,
  Schedule,
  Grade,
  Assignment,
  Quiz,
  VideoCall as VideoCallIcon,
  Description,
  MenuBook,
  Group,
  TrendingUp,
  EmojiEvents,
  LocalLibrary,
  AutoStories,
  Lightbulb,
  Rocket,
  Diamond,
  WorkspacePremium,
  MilitaryTech,
  PsychologyAlt,
  MoreVert
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { communityService, ITeacher } from '../../services/communityService';

// Styled Components
const TeacherCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[8],
    transform: 'translateY(-4px)',
  },
}));

const TeacherProfileCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}05, ${theme.palette.secondary.main}05)`,
}));

// Interfaces
// Use ITeacher from communityService
type Teacher = ITeacher;

interface CommunityTeachersProps {}

const CommunityTeachers: React.FC<CommunityTeachersProps> = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [followingLoading, setFollowingLoading] = useState<string | null>(null);

  // Load teachers
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is authenticated
        if (!user) {
          console.warn('User not authenticated, skipping teachers load');
          setLoading(false);
          return;
        }

        console.log('Loading teachers for user:', user);
        
        // Use searchTeachers for search term, otherwise use getTeachers with filters
        let response;
        if (searchTerm) {
          response = await communityService.searchTeachers(searchTerm, 1, 12);
          console.log('Teachers search results:', response);
        } else {
          response = await communityService.getTeachers(1, 12, {
            specialty: specialtyFilter || undefined
          });
          console.log('Teachers filter results:', response);
        }
        
        if (response?.teachers) {
          setTeachers(response.teachers);
        }
      } catch (error) {
        console.error('Error loading teachers:', error);
        setError('Failed to load teachers. Please try again.');
        toast.error('Failed to load teachers');
      } finally {
        setLoading(false);
      }
    };

    loadTeachers();
  }, [user, searchTerm, specialtyFilter]);

  // Handle chat with teacher
  const handleChatWithTeacher = (teacher: Teacher) => {
    console.log('💬 Navigating to chat with teacher:', teacher.name, teacher.id);
    // Store teacher info in session/local storage if needed
    sessionStorage.setItem('selectedChatTeacher', JSON.stringify(teacher));
    navigate('/community/chat', { state: { teacherId: teacher.id } });
    setTeacherDialogOpen(false);
  };

  // Handle teacher actions
  const handleFollowTeacher = async (teacherId: string) => {
    try {
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) return;

      setFollowingLoading(teacherId);

      if (teacher.isFollowing) {
        await communityService.unfollowTeacher(teacherId);
        setTeachers(prev => prev.map(t => 
          t.id === teacherId 
            ? { ...t, isFollowing: false }
            : t
        ));
        toast.success(`Unfollowed ${teacher.name}`);
        console.log('✅ Unfollowed teacher:', teacher.name);
      } else {
        await communityService.followTeacher(teacherId);
        setTeachers(prev => prev.map(t => 
          t.id === teacherId 
            ? { ...t, isFollowing: true }
            : t
        ));
        toast.success(`Following ${teacher.name}`);
        console.log('✅ Following teacher:', teacher.name);
      }
      
      // Update selectedTeacher if it's the one being followed
      if (selectedTeacher?.id === teacherId) {
        setSelectedTeacher(prev => prev ? { ...prev, isFollowing: !prev.isFollowing } : null);
      }
    } catch (error) {
      console.error('Error following teacher:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowingLoading(null);
    }
  };

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setTeacherDialogOpen(true);
  };

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.specialties.some(specialty => specialty.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSpecialty = !specialtyFilter || teacher.specialties.includes(specialtyFilter);
    return matchesSearch && matchesSpecialty;
  });

  // Get specialty color
  const getSpecialtyColor = (specialty: string) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error'];
    const index = specialty.length % colors.length;
    return colors[index];
  };

  const renderTeacherCard = (teacher: Teacher) => (
    <TeacherCard key={teacher.id}>
      <CardContent>
        {/* Teacher Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: { xs: 10, sm: 12 },
                  height: { xs: 10, sm: 12 },
                  borderRadius: '50%',
                  backgroundColor: teacher.isOnline ? 'success.main' : 'grey.400',
                  border: `2px solid ${theme.palette.background.paper}`,
                }}
              />
            }
          >
            <Avatar
              src={teacher.avatar}
              sx={{ width: { xs: 48, sm: 56, md: 60 }, height: { xs: 48, sm: 56, md: 60 } }}
            >
              {teacher.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
          </Badge>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {teacher.name}
              </Typography>
              {teacher.isVerified && <Verified color="primary" sx={{ fontSize: { xs: 16, sm: 20 } }} />}
              {teacher.isFollowing && <Star color="warning" sx={{ fontSize: { xs: 16, sm: 20 } }} />}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {teacher.title}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              <Rating value={teacher.rating} precision={0.1} size="small" readOnly />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                ({teacher.totalRatings} reviews)
              </Typography>
            </Stack>
          </Box>
          <IconButton onClick={() => handleTeacherClick(teacher)} size="small">
            <MoreVert />
          </IconButton>
        </Stack>

        {/* Bio */}
        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {teacher.bio}
        </Typography>

        {/* Specialties */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {teacher.specialties.slice(0, 3).map((specialty) => (
            <Chip
              key={specialty}
              label={specialty}
              size="small"
              color={getSpecialtyColor(specialty) as any}
              variant="outlined"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            />
          ))}
          {teacher.specialties.length > 3 && (
            <Chip
              label={`+${teacher.specialties.length - 3} more`}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            />
          )}
        </Stack>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {teacher.coursesCount}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Courses
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {teacher.studentsCount.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Students
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="info.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {teacher.experience}+
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Years
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Actions */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<Message />}
            fullWidth
            onClick={() => handleChatWithTeacher(teacher)}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Message
          </Button>
          <Button
            variant="outlined"
            startIcon={followingLoading === teacher.id ? <CircularProgress size={20} /> : (teacher.isFollowing ? <Star /> : <StarBorder />)}
            onClick={() => handleFollowTeacher(teacher.id)}
            disabled={followingLoading === teacher.id}
            color={teacher.isFollowing ? 'warning' : 'inherit'}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {teacher.isFollowing ? 'Following' : 'Follow'}
          </Button>
        </Stack>
      </CardContent>
    </TeacherCard>
  );

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      maxWidth: 1200, 
      mx: 'auto',
      width: '100%'
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Teachers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect with expert instructors and learn from the best
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              placeholder="Search teachers by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Specialty</InputLabel>
              <Select
                value={specialtyFilter}
                label="Specialty"
                onChange={(e) => setSpecialtyFilter(e.target.value)}
              >
                <MenuItem value="">All Specialties</MenuItem>
                <MenuItem value="React">React</MenuItem>
                <MenuItem value="Python">Python</MenuItem>
                <MenuItem value="UI Design">UI Design</MenuItem>
                <MenuItem value="Machine Learning">Machine Learning</MenuItem>
                <MenuItem value="JavaScript">JavaScript</MenuItem>
                <MenuItem value="Data Science">Data Science</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              fullWidth
            >
              More Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Teachers" />
        <Tab label="Following" />
        <Tab label="Online Now" />
        <Tab label="Top Rated" />
      </Tabs>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Teachers Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Loading teachers...</Typography>
          </Stack>
        </Box>
      ) : filteredTeachers.length === 0 ? (
        <Box display="flex" justifyContent="center" py={8}>
          <Typography color="text.secondary">No teachers found. Try adjusting your search or filters.</Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {activeTab === 0 && filteredTeachers.map((teacher) => (
            <Grid item xs={12} sm={6} md={4} key={teacher.id}>
              {renderTeacherCard(teacher)}
            </Grid>
          ))}
          
          {activeTab === 1 && filteredTeachers.filter(t => t.isFollowing).map((teacher) => (
            <Grid item xs={12} sm={6} md={4} key={teacher.id}>
              {renderTeacherCard(teacher)}
            </Grid>
          ))}
          
          {activeTab === 2 && filteredTeachers.filter(t => t.isOnline).map((teacher) => (
            <Grid item xs={12} sm={6} md={4} key={teacher.id}>
              {renderTeacherCard(teacher)}
            </Grid>
          ))}
          
          {activeTab === 3 && filteredTeachers.sort((a, b) => b.rating - a.rating).map((teacher) => (
            <Grid item xs={12} sm={6} md={4} key={teacher.id}>
              {renderTeacherCard(teacher)}
            </Grid>
          ))}
          
          {activeTab === 0 && filteredTeachers.length === 0 && (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No teachers found. Try adjusting your search.</Typography>
              </Box>
            </Grid>
          )}
          
          {activeTab === 1 && filteredTeachers.filter(t => t.isFollowing).length === 0 && (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">You aren't following any teachers yet.</Typography>
              </Box>
            </Grid>
          )}
          
          {activeTab === 2 && filteredTeachers.filter(t => t.isOnline).length === 0 && (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No teachers are online right now.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Teacher Profile Dialog */}
      <Dialog
        open={teacherDialogOpen}
        onClose={() => setTeacherDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={selectedTeacher?.avatar}
              sx={{ width: 60, height: 60 }}
            >
              {selectedTeacher?.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {selectedTeacher?.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {selectedTeacher?.title}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedTeacher && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    About
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                    {selectedTeacher.bio}
                  </Typography>
                  
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Specialties
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                    {selectedTeacher.specialties.map((specialty) => (
                      <Chip
                        key={specialty}
                        label={specialty}
                        color={getSpecialtyColor(specialty) as any}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                  
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Education
                  </Typography>
                  <List dense>
                    {selectedTeacher.education.map((edu, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText primary={edu} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Statistics
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {selectedTeacher.coursesCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Courses
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {selectedTeacher.studentsCount.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Students
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Recent Courses
                  </Typography>
                  <List dense>
                    {selectedTeacher.recentCourses.map((course) => (
                      <ListItem key={course.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={course.title}
                          secondary={
                            <Stack direction="row" spacing={2}>
                              <Typography variant="caption">
                                {course.students} students
                              </Typography>
                              <Rating value={course.rating} precision={0.1} size="small" readOnly />
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeacherDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<Message />}
            onClick={() => selectedTeacher && handleChatWithTeacher(selectedTeacher)}
          >
            Send Message
          </Button>
          <Button
            variant="outlined"
            startIcon={followingLoading === selectedTeacher?.id ? <CircularProgress size={20} /> : (selectedTeacher?.isFollowing ? <Star /> : <StarBorder />)}
            onClick={() => selectedTeacher && handleFollowTeacher(selectedTeacher.id)}
            disabled={followingLoading === selectedTeacher?.id}
            color={selectedTeacher?.isFollowing ? 'warning' : 'inherit'}
          >
            {selectedTeacher?.isFollowing ? 'Following' : 'Follow'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityTeachers;
