import React, { useState, useEffect } from 'react';
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
  useTheme,
  useMediaQuery,
  Collapse,
  CardActions,
  Skeleton,
  alpha
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
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
  ExpandMore,
  ExpandLess,
  LocalFireDepartment,
  Bolt,
  FlashOn,
  ArrowBack,
  Dashboard,
  Visibility,
  Comment,
  Send,
  PersonAdd,
  Class,
  MenuBook
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { gradesService, LeaderboardEntry, LeaderboardFilter } from '../../services/gradesService';
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
      id={`student-leaderboard-tabpanel-${index}`}
      aria-labelledby={`student-leaderboard-tab-${index}`}
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

const StudentLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // State management
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [courseLeaderboards, setCourseLeaderboards] = useState<{ [courseId: string]: LeaderboardEntry[] }>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);
  
  // Filters
  const [overallFilter, setOverallFilter] = useState<LeaderboardFilter>({
    type: 'overall',
    timeFilter: 'all',
    limit: 100
  });
  
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  // Load data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOverallLeaderboard();
  }, [overallFilter]);

  useEffect(() => {
    if (selectedCourse !== 'all') {
      loadCourseLeaderboard(selectedCourse);
    }
  }, [selectedCourse]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load student's enrolled courses
      const coursesResponse = await courseService.getEnrolledCourses();
      setCourses(coursesResponse.courses || []);

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
      const leaderboardData = await gradesService.getLeaderboard(overallFilter);
      setOverallLeaderboard(leaderboardData);
    } catch (err: any) {
      console.error('Failed to load overall leaderboard:', err);
      setError(err.message || 'Failed to load overall leaderboard');
    }
  };

  const loadCourseLeaderboard = async (courseId: string) => {
    try {
      console.log('Loading course leaderboard for courseId:', courseId);
      const leaderboardData = await gradesService.getCourseLeaderboard(courseId, { limit: 50 });
      console.log('Course leaderboard data received:', leaderboardData);
      setCourseLeaderboards(prev => ({ ...prev, [courseId]: leaderboardData }));
    } catch (err: any) {
      console.error('Failed to load course leaderboard:', err);
      setError(err.message || 'Failed to load course leaderboard');
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle course selection change
  const handleCourseChange = async (courseId: string) => {
    console.log('Student leaderboard: Course changed to:', courseId);
    setSelectedCourse(courseId);
    if (courseId !== 'all' && !courseLeaderboards[courseId]) {
      console.log('Loading course leaderboard for:', courseId);
      await loadCourseLeaderboard(courseId);
    } else if (courseId !== 'all') {
      console.log('Course leaderboard already cached for:', courseId);
    }
  };

  // Get rank display
  const getRankDisplay = (rank: number) => {
    return gradesService.getRankDisplay(rank);
  };

  // Find current user in leaderboard
  const getCurrentUserRank = (leaderboard: LeaderboardEntry[]) => {
    return leaderboard.find(entry => entry.studentId === user?.id);
  };

  // Render leaderboard entry
  const renderLeaderboardEntry = (entry: LeaderboardEntry, isCurrentUser: boolean = false) => {
    return (
      <ResponsiveLeaderboardCard
        key={entry.studentId}
        entry={entry}
        isCurrentUser={isCurrentUser}
        showCourse={tabValue === 1} // Show course info in course-specific leaderboard
      />
    );
  };

  // Legacy render function (keeping for reference)
  const renderLeaderboardEntryOld = (entry: LeaderboardEntry, isCurrentUser: boolean = false) => {
    const rankDisplay = getRankDisplay(entry.rank);
    const isTopThree = entry.rank <= 3;
    
    return (
      <Card 
        key={entry.studentId}
        elevation={0}
        sx={{ 
          border: '2px solid',
          borderColor: isCurrentUser ? 'primary.main' : 
                      isTopThree ? 'warning.main' : 'divider',
          borderRadius: 2,
          background: isCurrentUser 
            ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))'
            : isTopThree 
              ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))'
              : 'background.paper',
          position: 'relative',
          overflow: 'visible',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-4px)',
            borderColor: isCurrentUser ? 'primary.dark' : 
                        isTopThree ? 'warning.dark' : 'primary.main'
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
        
        {/* Current User Badge */}
        {isCurrentUser && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              left: 16,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              zIndex: 1
            }}
          >
            YOU
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
                  bgcolor: isCurrentUser ? 'primary.main' : 
                          isTopThree ? 'warning.main' : 'grey.400',
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
                      Assessments
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
                      {entry.completedAssignments}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontWeight: 'medium' }}
                    >
                      Assignments
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Badges */}
          {entry.badges && entry.badges.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 2 }}>
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

          {/* Improvement indicator */}
          {entry.improvement !== 0 && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mt: 1,
              p: 0.5,
              bgcolor: entry.improvement > 0 ? 'success.50' : 
                       entry.improvement < 0 ? 'error.50' : 'grey.50',
              borderRadius: 1
            }}>
              {entry.improvement > 0 ? (
                <TrendingUp color="success" sx={{ mr: 0.5, fontSize: 16 }} />
              ) : entry.improvement < 0 ? (
                <TrendingDown color="error" sx={{ mr: 0.5, fontSize: 16 }} />
              ) : (
                <TrendingFlat color="disabled" sx={{ mr: 0.5, fontSize: 16 }} />
              )}
              <Typography 
                variant="caption" 
                color={entry.improvement > 0 ? 'success.main' : 
                       entry.improvement < 0 ? 'error.main' : 'text.secondary'}
                sx={{ fontWeight: 'bold' }}
              >
                {entry.improvement > 0 ? '+' : ''}{entry.improvement}%
              </Typography>
            </Box>
          )}
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

  const currentUserOverall = getCurrentUserRank(overallLeaderboard);

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
            onClick={() => navigate('/dashboard/student')} 
            sx={{ mr: { xs: 1, sm: 2 } }}
            color="primary"
          >
            <ArrowBack />
          </IconButton>
          
          {!isMobile && (
            <EmojiEvents color="primary" sx={{ mr: 2 }} />
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
            {isMobile ? 'Leaderboards' : 'Student Leaderboards'}
          </Typography>
          
          {currentUserOverall && !isMobile && (
            <Chip
              icon={<Trophy />}
              label={`Your Rank: #${currentUserOverall.rank}`}
              color="primary"
              variant="outlined"
              sx={{ mr: 2 }}
            />
          )}
          
          <IconButton onClick={loadInitialData} color="primary">
            <Refresh />
          </IconButton>
        </Toolbar>
        
        {/* Mobile User Rank */}
        {currentUserOverall && isMobile && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Chip
              icon={<Trophy />}
              label={`Your Current Rank: #${currentUserOverall.rank}`}
              color="primary"
              variant="filled"
              sx={{ 
                width: '100%',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            />
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

        {/* Current User Performance Card */}
        {currentUserOverall && (
          <Card 
            elevation={0}
            sx={{ 
              mb: 4, 
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))',
              border: '2px solid', 
              borderColor: 'primary.main',
              borderRadius: 2
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3,
                flexWrap: 'wrap'
              }}>
                <Trophy sx={{ fontSize: { xs: 28, sm: 32 }, color: 'primary.main' }} />
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    flexGrow: 1
                  }}
                >
                  Your Performance Summary
                </Typography>
                <Chip
                  label={`Rank #${currentUserOverall.rank}`}
                  color="primary"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ 
                    textAlign: 'center',
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main',
                        mb: 0.5
                      }}
                    >
                      #{currentUserOverall.rank}
                    </Typography>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      color="text.secondary"
                      sx={{ fontWeight: 'medium' }}
                    >
                      Current Rank
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ 
                    textAlign: 'center',
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: 'success.main',
                        mb: 0.5
                      }}
                    >
                      {currentUserOverall.averageScore}%
                    </Typography>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      color="text.secondary"
                      sx={{ fontWeight: 'medium' }}
                    >
                      Average Score
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ 
                    textAlign: 'center',
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: 'info.main',
                        mb: 0.5
                      }}
                    >
                      {currentUserOverall.totalPoints}
                    </Typography>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      color="text.secondary"
                      sx={{ fontWeight: 'medium' }}
                    >
                      Total Points
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ 
                    textAlign: 'center',
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography 
                      variant={isMobile ? "h5" : "h4"} 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: 'warning.main',
                        mb: 0.5
                      }}
                    >
                      {currentUserOverall.completedAssessments + currentUserOverall.completedAssignments}
                    </Typography>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      color="text.secondary"
                      sx={{ fontWeight: 'medium' }}
                    >
                      Completed
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

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
                icon={<EmojiEvents sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                label={isMobile ? "Overall" : "Overall Leaderboard"}
                id="student-leaderboard-tab-0"
                aria-controls="student-leaderboard-tabpanel-0"
                iconPosition={isMobile ? "top" : "start"}
              />
              <Tab
                icon={<School sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                label={isMobile ? "Courses" : "Course Leaderboards"}
                id="student-leaderboard-tab-1"
                aria-controls="student-leaderboard-tabpanel-1"
                iconPosition={isMobile ? "top" : "start"}
              />
              <Tab
                icon={<Analytics sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                label={isMobile ? "Insights" : "Performance Insights"}
                id="student-leaderboard-tab-2"
                aria-controls="student-leaderboard-tabpanel-2"
                iconPosition={isMobile ? "top" : "start"}
              />
            </Tabs>
          </AppBar>

          {/* Overall Leaderboard Tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Filters */}
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
                  Overall Leaderboard
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
                  pt: isMobile ? 2 : 0
                }}>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
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
                    
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
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
                    
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                      <InputLabel>Show Top</InputLabel>
                      <Select
                        value={overallFilter.limit || 100}
                        label="Show Top"
                        onChange={(e) => setOverallFilter(prev => ({ ...prev, limit: Number(e.target.value) }))}
                      >
                        <MenuItem value={10}>Top 10</MenuItem>
                        <MenuItem value={25}>Top 25</MenuItem>
                        <MenuItem value={50}>Top 50</MenuItem>
                        <MenuItem value={100}>Top 100</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Collapse>
              </Box>

            {/* Overall Leaderboard */}
            {overallLeaderboard.length === 0 ? (
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
                  Complete assessments and assignments to appear on the leaderboard. 
                  Your progress will be tracked and compared with other students.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={isMobile ? 2 : 3}>
                {overallLeaderboard.map((entry) => 
                  renderLeaderboardEntry(entry, entry.studentId === user?.id)
                )}
              </Stack>
            )}
          </TabPanel>

          {/* Course Leaderboards Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 300 } }}>
                <InputLabel>Select Course</InputLabel>
                <Select
                  value={selectedCourse}
                  label="Select Course"
                  onChange={(e) => handleCourseChange(e.target.value)}
                >
                  <MenuItem value="all">Select a course...</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course._id} value={course._id}>
                      {course.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {selectedCourse === 'all' ? (
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
                {/* Course Header */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {courses.find(c => c._id === selectedCourse)?.title} Leaderboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rankings based on performance in this specific course
                  </Typography>
                </Box>

                {/* Current User Position (if not in top visible entries) */}
                {(() => {
                  const currentUserEntry = getCurrentUserRank(courseLeaderboards[selectedCourse]);
                  const isInTopEntries = currentUserEntry && currentUserEntry.rank <= 10;
                  
                  return currentUserEntry && !isInTopEntries ? (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Your Position:
                      </Typography>
                      {renderLeaderboardEntry(currentUserEntry, true)}
                    </Box>
                  ) : null;
                })()}

                {/* Leaderboard Entries */}
                <Stack spacing={2}>
                  {courseLeaderboards[selectedCourse].length > 0 ? (
                    courseLeaderboards[selectedCourse].map((entry) => 
                      renderLeaderboardEntry(entry, entry.studentId === user?.id)
                    )
                  ) : (
                    <Paper 
                      elevation={0}
                      sx={{ 
                        textAlign: 'center', 
                        py: 6,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2
                      }}
                    >
                      <EmojiEvents sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Rankings Yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                        Complete assessments and assignments in this course to appear on the leaderboard.
                      </Typography>
                    </Paper>
                  )}
                </Stack>
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

          {/* Performance Insights Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Analytics sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Performance Insights
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed performance analytics and insights coming soon.
              </Typography>
            </Box>
          </TabPanel>
        </Card>
      </Container>
    </Box>
  );
};

export default StudentLeaderboard;