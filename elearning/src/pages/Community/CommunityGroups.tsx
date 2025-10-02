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
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  Add,
  Group,
  People,
  School,
  EmojiEvents,
  Chat,
  Settings,
  MoreVert,
  Search,
  FilterList,
  Public,
  Lock,
  Star,
  StarBorder,
  Notifications,
  NotificationsOff,
  PersonAdd,
  PersonRemove,
  AdminPanelSettings,
  TrendingUp,
  CalendarToday,
  LocationOn,
  Tag,
  CheckCircle,
  Schedule,
  VideoCall,
  Assignment,
  Quiz,
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
  Bookmark,
  Share,
  Download,
  Upload,
  Sync,
  Refresh,
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
  GroupAdd,
  GroupRemove,
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
  Analytics,
  Settings as SettingsIcon,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

// Styled Components
const GroupCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },
}));

const CreateGroupCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
}));

// Interfaces
interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar?: string;
  coverImage?: string;
  memberCount: number;
  maxMembers?: number;
  isPrivate: boolean;
  isJoined: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  createdAt: string;
  lastActivity: string;
  tags: string[];
  rules: string[];
  recentPosts: number;
  upcomingEvents: number;
  members: GroupMember[];
  admins: GroupMember[];
  moderators: GroupMember[];
}

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  isOnline: boolean;
}

interface CommunityGroupsProps {}

const CommunityGroups: React.FC<CommunityGroupsProps> = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: '',
    isPrivate: false,
    tags: [] as string[],
  });

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        
        // Mock data - replace with actual API call
        const mockGroups: Group[] = [
          {
            id: 'group-1',
            name: 'React Developers',
            description: 'A community for React developers to share knowledge, ask questions, and collaborate on projects.',
            category: 'Programming',
            avatar: '/group-avatars/react.jpg',
            coverImage: '/group-covers/react.jpg',
            memberCount: 1250,
            maxMembers: 2000,
            isPrivate: false,
            isJoined: true,
            isAdmin: false,
            isModerator: true,
            createdAt: '2024-01-15',
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            tags: ['react', 'javascript', 'frontend', 'web-development'],
            rules: [
              'Be respectful to all members',
              'Stay on topic',
              'No spam or self-promotion',
              'Share knowledge and help others'
            ],
            recentPosts: 45,
            upcomingEvents: 3,
            members: [],
            admins: [
              {
                id: 'admin-1',
                name: 'Sarah Johnson',
                avatar: '/avatars/sarah.jpg',
                role: 'admin',
                joinedAt: '2024-01-15',
                isOnline: true
              }
            ],
            moderators: [
              {
                id: 'mod-1',
                name: 'Mike Chen',
                avatar: '/avatars/mike.jpg',
                role: 'moderator',
                joinedAt: '2024-01-20',
                isOnline: false
              }
            ]
          },
          {
            id: 'group-2',
            name: 'Data Science Beginners',
            description: 'Learn data science from scratch with hands-on projects and peer support.',
            category: 'Data Science',
            avatar: '/group-avatars/datascience.jpg',
            memberCount: 850,
            isPrivate: false,
            isJoined: true,
            isAdmin: true,
            isModerator: false,
            createdAt: '2024-02-01',
            lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            tags: ['python', 'machine-learning', 'data-analysis', 'beginner'],
            rules: [
              'Beginner-friendly environment',
              'Ask questions freely',
              'Share learning resources',
              'Help fellow beginners'
            ],
            recentPosts: 28,
            upcomingEvents: 1,
            members: [],
            admins: [
              {
                id: user?._id || 'current-user',
                name: `${user?.firstName} ${user?.lastName}`,
                avatar: user?.profilePicture,
                role: 'admin',
                joinedAt: '2024-02-01',
                isOnline: true
              }
            ],
            moderators: []
          },
          {
            id: 'group-3',
            name: 'UI/UX Design Community',
            description: 'Share design inspiration, get feedback, and learn from experienced designers.',
            category: 'Design',
            avatar: '/group-avatars/design.jpg',
            memberCount: 2100,
            isPrivate: false,
            isJoined: false,
            isAdmin: false,
            isModerator: false,
            createdAt: '2024-01-10',
            lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            tags: ['ui', 'ux', 'design', 'figma', 'sketch'],
            rules: [
              'Share high-quality design work',
              'Provide constructive feedback',
              'Respect intellectual property',
              'Be professional and kind'
            ],
            recentPosts: 67,
            upcomingEvents: 5,
            members: [],
            admins: [],
            moderators: []
          }
        ];

        setGroups(mockGroups);
        setMyGroups(mockGroups.filter(group => group.isJoined));
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [user]);

  // Handle group actions
  const handleJoinGroup = (groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, isJoined: true, memberCount: group.memberCount + 1 }
        : group
    ));
    setMyGroups(prev => {
      const group = groups.find(g => g.id === groupId);
      return group ? [...prev, { ...group, isJoined: true, memberCount: group.memberCount + 1 }] : prev;
    });
  };

  const handleLeaveGroup = (groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, isJoined: false, memberCount: group.memberCount - 1 }
        : group
    ));
    setMyGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim() || !newGroup.description.trim()) return;

    try {
      const group: Group = {
        id: `group-${Date.now()}`,
        name: newGroup.name,
        description: newGroup.description,
        category: newGroup.category,
        memberCount: 1,
        isPrivate: newGroup.isPrivate,
        isJoined: true,
        isAdmin: true,
        isModerator: false,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        tags: newGroup.tags,
        rules: [],
        recentPosts: 0,
        upcomingEvents: 0,
        members: [],
        admins: [
          {
            id: user?._id || 'current-user',
            name: `${user?.firstName} ${user?.lastName}`,
            avatar: user?.profilePicture,
            role: 'admin',
            joinedAt: new Date().toISOString(),
            isOnline: true
          }
        ],
        moderators: []
      };

      setGroups(prev => [group, ...prev]);
      setMyGroups(prev => [group, ...prev]);
      setNewGroup({ name: '', description: '', category: '', isPrivate: false, tags: [] });
      setCreateGroupOpen(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Programming': return 'primary';
      case 'Design': return 'secondary';
      case 'Data Science': return 'info';
      case 'Business': return 'success';
      case 'Marketing': return 'warning';
      default: return 'default';
    }
  };

  const renderGroupCard = (group: Group) => (
    <GroupCard key={group.id}>
      <CardContent>
        {/* Group Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            src={group.avatar}
            sx={{ width: 60, height: 60 }}
          >
            <Group />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {group.name}
              </Typography>
              {group.isPrivate ? <Lock color="warning" /> : <Public color="success" />}
              {group.isAdmin && <AdminPanelSettings color="primary" />}
              {group.isModerator && <Settings color="secondary" />}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label={group.category}
                size="small"
                color={getCategoryColor(group.category) as any}
                variant="outlined"
              />
              <Chip
                label={`${group.memberCount} members`}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Last activity: {formatTimestamp(group.lastActivity)}
            </Typography>
          </Box>
          <IconButton>
            <MoreVert />
          </IconButton>
        </Stack>

        {/* Group Description */}
        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.5 }}>
          {group.description}
        </Typography>

        {/* Tags */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {group.tags.slice(0, 3).map((tag) => (
            <Chip
              key={tag}
              label={`#${tag}`}
              size="small"
              variant="outlined"
            />
          ))}
          {group.tags.length > 3 && (
            <Chip
              label={`+${group.tags.length - 3} more`}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>

        {/* Group Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary.main">
              {group.recentPosts}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Recent Posts
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {group.upcomingEvents}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Upcoming Events
            </Typography>
          </Box>
        </Stack>

        {/* Group Actions */}
        <Stack direction="row" spacing={1}>
          {group.isJoined ? (
            <>
              <Button
                variant="contained"
                startIcon={<Chat />}
                fullWidth
                onClick={() => {/* Navigate to group chat */}}
              >
                Open Chat
              </Button>
              <Button
                variant="outlined"
                startIcon={<People />}
                onClick={() => {/* Navigate to group members */}}
              >
                Members
              </Button>
              {group.isAdmin && (
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => {/* Navigate to group settings */}}
                >
                  Manage
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              fullWidth
              onClick={() => handleJoinGroup(group.id)}
            >
              Join Group
            </Button>
          )}
        </Stack>
      </CardContent>
    </GroupCard>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Groups
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join communities, create study groups, and connect with like-minded learners
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateGroupOpen(true)}
          >
            Create Group
          </Button>
        </Stack>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="All Groups" />
          <Tab label="My Groups" />
          <Tab label="Recommended" />
        </Tabs>
      </Box>

      {/* Groups Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography>Loading groups...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {activeTab === 0 && (
            <>
              {/* Create Group Card */}
              <Grid item xs={12} sm={6} md={4}>
                <CreateGroupCard onClick={() => setCreateGroupOpen(true)}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Add sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Create New Group
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start your own community and bring learners together
                    </Typography>
                  </CardContent>
                </CreateGroupCard>
              </Grid>
              
              {/* All Groups */}
              {groups.map((group) => (
                <Grid item xs={12} sm={6} md={4} key={group.id}>
                  {renderGroupCard(group)}
                </Grid>
              ))}
            </>
          )}
          
          {activeTab === 1 && (
            <>
              {/* My Groups */}
              {myGroups.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <Group sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      You haven't joined any groups yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Explore groups and join communities that interest you
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setActiveTab(0)}
                    >
                      Browse Groups
                    </Button>
                  </Paper>
                </Grid>
              ) : (
                myGroups.map((group) => (
                  <Grid item xs={12} sm={6} md={4} key={group.id}>
                    {renderGroupCard(group)}
                  </Grid>
                ))
              )}
            </>
          )}
          
          {activeTab === 2 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Recommended Groups
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Coming soon! We'll recommend groups based on your interests and learning goals.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create Group Dialog */}
      <Dialog open={createGroupOpen} onClose={() => setCreateGroupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Group Name"
              fullWidth
              value={newGroup.name}
              onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter a catchy name for your group"
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={newGroup.description}
              onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what your group is about and what members can expect"
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newGroup.category}
                label="Category"
                onChange={(e) => setNewGroup(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="Programming">Programming</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Data Science">Data Science</MenuItem>
                <MenuItem value="Business">Business</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Languages">Languages</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Tags (comma separated)"
              fullWidth
              value={newGroup.tags.join(', ')}
              onChange={(e) => setNewGroup(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
              }))}
              placeholder="react, javascript, learning"
            />
            <FormControl>
              <label>
                <input
                  type="checkbox"
                  checked={newGroup.isPrivate}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, isPrivate: e.target.checked }))}
                />
                Private Group (requires approval to join)
              </label>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateGroupOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateGroup}
            disabled={!newGroup.name.trim() || !newGroup.description.trim()}
          >
            Create Group
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityGroups;
