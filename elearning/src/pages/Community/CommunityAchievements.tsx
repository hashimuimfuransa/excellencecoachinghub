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
  LinearProgress,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  StarBorder,
  TrendingUp,
  School,
  Group,
  Person,
  CheckCircle,
  Lock,
  Share,
  Bookmark,
  MoreVert,
  Search,
  FilterList,
  Sort,
  Refresh,
  Public,
  People,
  CalendarToday,
  Timer,
  Grade,
  Assignment,
  Quiz,
  VideoCall,
  Description,
  Psychology,
  MenuBook,
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
  Work,
  Favorite,
  ThumbUp,
  Comment,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Download,
  Upload,
  Sync,
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
  Analytics,
  Settings,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import communityService, { IAchievement } from '../../services/communityService';

// Styled Components
const AchievementCard = styled(Card)(({ theme, isUnlocked }) => ({
  borderRadius: theme.spacing(2),
  border: `1px solid ${isUnlocked ? alpha(theme.palette.warning.main, 0.3) : alpha(theme.palette.divider, 0.1)}`,
  background: isUnlocked 
    ? `linear-gradient(135deg, ${theme.palette.warning.main}08, ${theme.palette.error.main}08)`
    : `linear-gradient(135deg, ${theme.palette.grey[100]}, ${theme.palette.grey[200]})`,
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

const LeaderboardCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}05, ${theme.palette.secondary.main}05)`,
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
  sharedBy?: number;
  likes?: number;
}

interface AchievementRequirement {
  type: 'lessons_completed' | 'time_spent' | 'quiz_score' | 'streak' | 'points_earned';
  target: number;
  current: number;
  description: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  achievements: number;
  rank: number;
  isCurrentUser: boolean;
}

interface CommunityAchievementsProps {}

const CommunityAchievements: React.FC<CommunityAchievementsProps> = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [achievementDialogOpen, setAchievementDialogOpen] = useState(false);

  // Load achievements and leaderboard
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const { achievements: achv } = await communityService.getAchievements(1, 24);
        setAchievements(achv as unknown as Achievement[]);

        // Simple placeholder leaderboard from achievements until backend provides it
        const lb: LeaderboardEntry[] = [
          {
            id: user?._id || 'current-user',
            name: `${user?.firstName} ${user?.lastName}`,
            avatar: user?.profilePicture,
            points: achv.reduce((sum: number, a: any) => sum + (a.isUnlocked ? a.points : 0), 0),
            achievements: achv.filter((a: any) => a.isUnlocked).length,
            rank: 1,
            isCurrentUser: true
          }
        ];
        setLeaderboard(lb);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Handle achievement actions
  const handleShareAchievement = async (achievementId: string) => {
    try {
      await communityService.shareAchievement(achievementId);
      setAchievements(prev => prev.map(a => a.id === achievementId ? { ...a, sharedBy: (a.sharedBy || 0) + 1 } : a));
    } catch (e) {
      console.error('Failed to share achievement', e);
    }
  };

  const handleLikeAchievement = async (achievementId: string) => {
    try {
      await communityService.likeAchievement(achievementId);
      setAchievements(prev => prev.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, likes: (achievement.likes || 0) + 1 }
          : achievement
      ));
    } catch (e) {
      console.error('Failed to like achievement', e);
    }
  };

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setAchievementDialogOpen(true);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
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

  const renderAchievementCard = (achievement: Achievement) => (
    <AchievementCard 
      key={achievement.id} 
      isUnlocked={achievement.isUnlocked}
      onClick={() => handleAchievementClick(achievement)}
      sx={{ cursor: 'pointer' }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            sx={{
              width: 60,
              height: 60,
              backgroundColor: achievement.isUnlocked ? 'warning.main' : 'grey.400',
              fontSize: '1.5rem'
            }}
          >
            {achievement.icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {achievement.title}
              </Typography>
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {achievement.description}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {achievement.sharedBy} shares
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {achievement.likes} likes
              </Typography>
            </Stack>
          </Box>
          {achievement.isUnlocked ? (
            <CheckCircle color="success" />
          ) : (
            <Lock color="disabled" />
          )}
        </Stack>
        
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
            <LinearProgress
              variant="determinate"
              value={achievement.progress}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
        
        {achievement.isUnlocked && achievement.unlockedAt && (
          <Typography variant="caption" color="text.secondary">
            Unlocked: {formatTimestamp(achievement.unlockedAt)}
          </Typography>
        )}
        
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            size="small"
            startIcon={<Share />}
            onClick={(e) => {
              e.stopPropagation();
              handleShareAchievement(achievement.id);
            }}
          >
            Share
          </Button>
          <Button
            size="small"
            startIcon={<ThumbUp />}
            onClick={(e) => {
              e.stopPropagation();
              handleLikeAchievement(achievement.id);
            }}
          >
            {achievement.likes || 0}
          </Button>
        </Stack>
      </CardContent>
    </AchievementCard>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Achievements
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Celebrate your learning milestones and see what others have accomplished
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Achievements" />
        <Tab label="My Achievements" />
        <Tab label="Leaderboard" />
        <Tab label="Shared" />
      </Tabs>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography>Loading achievements...</Typography>
        </Box>
      ) : (
        <>
          {activeTab === 0 && (
            achievements.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', width: '100%' }}>
                <EmojiEvents sx={{ fontSize: 56, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  No achievements available yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Achievements will appear here once they are configured by the admins.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {achievements.map((achievement) => (
                  <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                    {renderAchievementCard(achievement)}
                  </Grid>
                ))}
              </Grid>
            )
          )}

          {activeTab === 1 && (
            (() => {
              const unlocked = achievements.filter(a => a.isUnlocked);
              if (unlocked.length === 0) {
                return (
                  <Paper sx={{ p: 4, textAlign: 'center', width: '100%' }}>
                    <StarBorder sx={{ fontSize: 56, color: 'action.disabled', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      You haven\'t unlocked any achievements yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Here\'s how to start earning achievements:
                    </Typography>
                    <List dense sx={{ maxWidth: 520, mx: 'auto', textAlign: 'left' }}>
                      <ListItem>
                        <ListItemText primary="Complete lessons to reach milestones" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Score 80%+ on quizzes to unlock badges" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Maintain a daily learning streak" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Spend more time learning to gain engagement points" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Participate in the community (posts, comments, shares)" />
                      </ListItem>
                    </List>
                  </Paper>
                );
              }
              return (
                <Grid container spacing={3}>
                  {unlocked.map((achievement) => (
                    <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                      {renderAchievementCard(achievement)}
                    </Grid>
                  ))}
                </Grid>
              );
            })()
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <LeaderboardCard>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      🏆 Leaderboard
                    </Typography>
                    <List>
                      {leaderboard.map((entry, index) => (
                        <React.Fragment key={entry.id}>
                          <ListItem
                            sx={{
                              bgcolor: entry.isCurrentUser ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                              borderRadius: 2,
                              mb: 1
                            }}
                          >
                            <ListItemAvatar>
                              <Badge
                                badgeContent={entry.rank}
                                color="primary"
                                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                              >
                                <Avatar src={entry.avatar}>
                                  {entry.name.split(' ').map(n => n[0]).join('')}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {entry.name}
                                  </Typography>
                                  {entry.isCurrentUser && (
                                    <Chip label="You" size="small" color="primary" />
                                  )}
                                </Stack>
                              }
                              secondary={
                                <Stack direction="row" spacing={2}>
                                  <Typography variant="body2" color="text.secondary">
                                    {entry.points} points
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {entry.achievements} achievements
                                  </Typography>
                                </Stack>
                              }
                            />
                          </ListItem>
                          {index < leaderboard.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </LeaderboardCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <EmojiEvents sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Your Rank
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    #{leaderboard.find(e => e.isCurrentUser)?.rank || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Keep learning to climb the leaderboard!
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid container spacing={3}>
              {achievements.filter(a => a.isUnlocked && a.sharedBy && a.sharedBy > 0).map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  {renderAchievementCard(achievement)}
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

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
                          <LinearProgress
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
                    Unlocked on {formatTimestamp(selectedAchievement.unlockedAt)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAchievementDialogOpen(false)}>Close</Button>
          {selectedAchievement?.isUnlocked && (
            <Button 
              variant="contained" 
              startIcon={<Share />}
              onClick={() => handleShareAchievement(selectedAchievement.id)}
            >
              Share Achievement
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityAchievements;
