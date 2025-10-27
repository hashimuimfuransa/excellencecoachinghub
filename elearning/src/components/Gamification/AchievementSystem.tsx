import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Stack,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  alpha,
  styled,
  Badge
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  StarBorder,
  TrendingUp,
  School,
  Assignment,
  Quiz,
  VideoCall,
  Description,
  Psychology,
  MenuBook,
  Timer,
  CheckCircle,
  Lock,
  LockOpen,
  Grade,
  Group,
  Person,
  CalendarToday,
  AccessTime,
  LocalLibrary,
  AutoStories,
  Lightbulb,
  Rocket,
  Diamond,
  WorkspacePremium,
  MilitaryTech,
  PsychologyAlt,
  Science,
  Computer,
  Business,
  DesignServices,
  Language,
  Sports,
  MusicNote,
  Palette,
  Build,
  Biotech,
  AccountBalance,
  Engineering,
  HealthAndSafety,
  Restaurant,
  DirectionsCar,
  Flight,
  Hotel,
  ShoppingCart,
  Attractions,
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
  Work,
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
  LocationOn,
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
  Notifications,
  NotificationsOff,
  Info,
  Warning,
  Error
} from '@mui/icons-material';

// Styled Components
const AchievementCard = styled(Card)(({ theme, isUnlocked }) => ({
  background: isUnlocked 
    ? `linear-gradient(135deg, ${theme.palette.warning.main}08, ${theme.palette.error.main}08)`
    : `linear-gradient(135deg, ${theme.palette.grey[100]}, ${theme.palette.grey[200]})`,
  border: `1px solid ${isUnlocked ? alpha(theme.palette.warning.main, 0.3) : alpha(theme.palette.grey[400], 0.3)}`,
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  '&::before': isUnlocked ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
  } : {},
}));

const LevelCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
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
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'engagement' | 'milestone' | 'special';
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  requirements: AchievementRequirement[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementRequirement {
  type: 'lessons_completed' | 'time_spent' | 'quiz_score' | 'streak' | 'points_earned';
  target: number;
  current: number;
  description: string;
}

interface Level {
  level: number;
  name: string;
  pointsRequired: number;
  currentPoints: number;
  nextLevelPoints: number;
  benefits: string[];
  icon: string;
}

interface GamificationStats {
  totalPoints: number;
  currentLevel: Level;
  achievements: Achievement[];
  recentAchievements: Achievement[];
  streak: number;
  longestStreak: number;
  totalTimeSpent: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  averageScore: number;
}

interface AchievementSystemProps {
  userId: string;
  courseId?: string;
}

const AchievementSystem: React.FC<AchievementSystemProps> = ({
  userId,
  courseId
}) => {
  const theme = useTheme();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [achievementDialogOpen, setAchievementDialogOpen] = useState(false);

  // Load gamification data
  useEffect(() => {
    const loadGamificationData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mock data - replace with actual API call
        const mockStats: GamificationStats = {
          totalPoints: 1250,
          currentLevel: {
            level: 5,
            name: 'Advanced Learner',
            pointsRequired: 1000,
            currentPoints: 1250,
            nextLevelPoints: 1500,
            benefits: ['Access to advanced content', 'Priority support', 'Exclusive badges'],
            icon: '🎓'
          },
          streak: 7,
          longestStreak: 15,
          totalTimeSpent: 1250, // minutes
          lessonsCompleted: 23,
          quizzesPassed: 8,
          averageScore: 85,
          achievements: [
            {
              id: 'achievement-1',
              title: 'First Steps',
              description: 'Complete your first lesson',
              icon: '🎯',
              category: 'milestone',
              points: 10,
              isUnlocked: true,
              unlockedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 100,
              requirements: [
                {
                  type: 'lessons_completed',
                  target: 1,
                  current: 1,
                  description: 'Complete 1 lesson'
                }
              ],
              rarity: 'common'
            },
            {
              id: 'achievement-2',
              title: 'Quiz Master',
              description: 'Score 80% or higher on 5 quizzes',
              icon: '🏆',
              category: 'learning',
              points: 50,
              isUnlocked: true,
              unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 100,
              requirements: [
                {
                  type: 'quiz_score',
                  target: 5,
                  current: 5,
                  description: 'Score 80%+ on 5 quizzes'
                }
              ],
              rarity: 'rare'
            },
            {
              id: 'achievement-3',
              title: 'Dedicated Learner',
              description: 'Maintain a 7-day learning streak',
              icon: '🔥',
              category: 'engagement',
              points: 100,
              isUnlocked: true,
              unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 100,
              requirements: [
                {
                  type: 'streak',
                  target: 7,
                  current: 7,
                  description: 'Maintain 7-day streak'
                }
              ],
              rarity: 'epic'
            },
            {
              id: 'achievement-4',
              title: 'Knowledge Seeker',
              description: 'Complete 25 lessons',
              icon: '📚',
              category: 'learning',
              points: 75,
              isUnlocked: false,
              progress: 92,
              requirements: [
                {
                  type: 'lessons_completed',
                  target: 25,
                  current: 23,
                  description: 'Complete 25 lessons'
                }
              ],
              rarity: 'rare'
            },
            {
              id: 'achievement-5',
              title: 'Time Master',
              description: 'Spend 20 hours learning',
              icon: '⏰',
              category: 'engagement',
              points: 150,
              isUnlocked: false,
              progress: 65,
              requirements: [
                {
                  type: 'time_spent',
                  target: 1200, // 20 hours in minutes
                  current: 780,
                  description: 'Spend 20 hours learning'
                }
              ],
              rarity: 'epic'
            },
            {
              id: 'achievement-6',
              title: 'Perfectionist',
              description: 'Achieve 95% average score',
              icon: '💎',
              category: 'learning',
              points: 200,
              isUnlocked: false,
              progress: 89,
              requirements: [
                {
                  type: 'quiz_score',
                  target: 95,
                  current: 85,
                  description: 'Achieve 95% average score'
                }
              ],
              rarity: 'legendary'
            }
          ],
          recentAchievements: []
        };

        setStats(mockStats);
      } catch (err) {
        console.error('Error loading gamification data:', err);
        setError('Failed to load gamification data');
      } finally {
        setLoading(false);
      }
    };

    loadGamificationData();
  }, [userId, courseId]);

  // Handle achievement click
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setAchievementDialogOpen(true);
  };

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'default';
      case 'rare': return 'primary';
      case 'epic': return 'secondary';
      case 'legendary': return 'warning';
      default: return 'default';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning': return <School />;
      case 'engagement': return <TrendingUp />;
      case 'milestone': return <EmojiEvents />;
      case 'special': return <Star />;
      default: return <MenuBook />;
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading achievements...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="info">
        No gamification data available
      </Alert>
    );
  }

  const levelProgress = ((stats.currentLevel.currentPoints - stats.currentLevel.pointsRequired) / 
    (stats.currentLevel.nextLevelPoints - stats.currentLevel.pointsRequired)) * 100;

  return (
    <Box>
      {/* Level and Points Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <LevelCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                {stats.currentLevel.icon}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                Level {stats.currentLevel.level}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {stats.currentLevel.name}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress to Level {stats.currentLevel.level + 1}
                  </Typography>
                  <Typography variant="body2" color="primary.main">
                    {Math.round(levelProgress)}%
                  </Typography>
                </Stack>
                <ProgressBar
                  variant="determinate"
                  value={levelProgress}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats.currentLevel.currentPoints} / {stats.currentLevel.nextLevelPoints} points
              </Typography>
            </CardContent>
          </LevelCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <LevelCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                {stats.totalPoints}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Points Earned
              </Typography>
            </CardContent>
          </LevelCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <LevelCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Timer sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
                {stats.streak}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Day Streak (Best: {stats.longestStreak})
              </Typography>
            </CardContent>
          </LevelCard>
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
              {stats.lessonsCompleted}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lessons Completed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
              {formatTimeSpent(stats.totalTimeSpent)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Time Spent
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {stats.quizzesPassed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quizzes Passed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main' }}>
              {stats.averageScore}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Score
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Achievements */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Achievements
          </Typography>
          <Grid container spacing={2}>
            {stats.achievements.map((achievement) => (
              <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                <AchievementCard isUnlocked={achievement.isUnlocked}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          backgroundColor: achievement.isUnlocked ? 'warning.main' : 'grey.400',
                          fontSize: '1.5rem'
                        }}
                      >
                        {achievement.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {achievement.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={achievement.rarity}
                            size="small"
                            color={getRarityColor(achievement.rarity) as any}
                            variant="outlined"
                          />
                          <Chip
                            label={`${achievement.points} pts`}
                            size="small"
                            color="primary"
                            variant="filled"
                          />
                        </Stack>
                      </Box>
                      {achievement.isUnlocked ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Lock color="disabled" />
                      )}
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {achievement.description}
                    </Typography>
                    
                    {!achievement.isUnlocked && (
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {achievement.progress}%
                          </Typography>
                        </Stack>
                        <ProgressBar
                          variant="determinate"
                          value={achievement.progress}
                        />
                      </Box>
                    )}
                    
                    {achievement.isUnlocked && achievement.unlockedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Unlocked: {formatDate(achievement.unlockedAt)}
                      </Typography>
                    )}
                    
                    <Button
                      size="small"
                      onClick={() => handleAchievementClick(achievement)}
                      sx={{ mt: 1 }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </AchievementCard>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Achievement Details Dialog */}
      <Dialog
        open={achievementDialogOpen}
        onClose={() => setAchievementDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                backgroundColor: selectedAchievement?.isUnlocked ? 'warning.main' : 'grey.400',
                fontSize: '1.5rem'
              }}
            >
              {selectedAchievement?.icon}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedAchievement?.title}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={selectedAchievement?.rarity}
                  size="small"
                  color={getRarityColor(selectedAchievement?.rarity || 'common') as any}
                  variant="outlined"
                />
                <Chip
                  label={`${selectedAchievement?.points} pts`}
                  size="small"
                  color="primary"
                  variant="filled"
                />
              </Stack>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedAchievement && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedAchievement.description}
              </Typography>
              
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Requirements
              </Typography>
              <List dense>
                {selectedAchievement.requirements.map((requirement, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {getCategoryIcon(selectedAchievement.category)}
                    </ListItemIcon>
                    <ListItemText
                      primary={requirement.description}
                      secondary={
                        <Box>
                          <ProgressBar
                            variant="determinate"
                            value={(requirement.current / requirement.target) * 100}
                            sx={{ mt: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {requirement.current} / {requirement.target}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              
              {selectedAchievement.isUnlocked && selectedAchievement.unlockedAt && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: 'success.main', color: 'white', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    🎉 Achievement Unlocked!
                  </Typography>
                  <Typography variant="caption">
                    Unlocked on {formatDate(selectedAchievement.unlockedAt)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAchievementDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AchievementSystem;
