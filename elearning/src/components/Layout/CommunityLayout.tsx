import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Stack,
  Button,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  Message,
  Group,
  EmojiEvents,
  TrendingUp,
  School,
  Person,
  Settings,
  Logout,
  Home,
  Search,
  FilterList,
  MoreVert,
  Add,
  Chat,
  Forum,
  People,
  Star,
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
  Home as HomeIcon,
  Work,
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
import { useAuth } from '../../hooks/useAuth';
import BottomNavigationBar from '../BottomNavigationBar';

interface CommunityLayoutProps {
  children: React.ReactNode;
}

const CommunityLayout: React.FC<CommunityLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const communityNavItems = [
    { text: 'Feed', icon: <HomeIcon />, path: 'feed' },
    { text: 'Groups', icon: <Group />, path: 'groups' },
    { text: 'Achievements', icon: <EmojiEvents />, path: 'achievements' },
    { text: 'Opportunities', icon: <Work />, path: 'opportunities' },
    { text: 'Chat', icon: <Chat />, path: 'chat' },
    { text: 'Teachers', icon: <School />, path: 'teachers' },
    { text: 'Trending', icon: <TrendingUp />, path: 'trending' },
  ];

  const drawer = (
    <Box sx={{ width: 280, height: '100%', bgcolor: 'background.paper' }}>
      {/* User Profile Section */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={user?.profilePicture}
            sx={{ width: 48, height: 48 }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{user?.username || 'student'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Navigation */}
      <List sx={{ px: 2, py: 1 }}>
        {communityNavItems.map((item) => (
            <ListItem
              key={item.text}
              button
              selected={location.pathname === `/community/${item.path}`}
              onClick={() => navigate(`/community/${item.path}`)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 600 : 400 }}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* Quick Actions */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
          Quick Actions
        </Typography>
        <Stack spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            fullWidth
            onClick={() => navigate('/community/groups')}
            size="small"
          >
            Create Group
          </Button>
          <Button
            variant="outlined"
            startIcon={<Message />}
            fullWidth
            onClick={() => navigate('/community/chat')}
            size="small"
          >
            Start Chat
          </Button>
          <Button
            variant="contained"
            startIcon={<School />}
            fullWidth
            color="primary"
            onClick={() => navigate('/courses')}
            size="small"
          >
            Back to Learning Hub
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Mini Learning Progress */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
          Learning Progress
        </Typography>
        <Stack spacing={1} sx={{ px: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Overall</Typography>
            <Chip label="Keep going" size="small" color="success" variant="outlined" />
          </Box>
          <Box sx={{ bgcolor: 'grey.100', height: 8, borderRadius: 9999, overflow: 'hidden' }}>
            <Box sx={{ width: 'var(--progress, 45%)', height: '100%', bgcolor: 'success.main' }} />
          </Box>
          <Typography variant="caption" color="text.secondary">Estimate based on your recent activity</Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/courses')}
            sx={{ alignSelf: 'flex-start' }}
          >
            Go to Learning Hub
          </Button>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - 280px)` },
          ml: { md: '280px' },
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)',
          color: 'common.white',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.25)',
          borderBottom: 1,
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Learning Community
          </Typography>

          {/* Search Bar */}
          <Box sx={{ flexGrow: 1, maxWidth: 400, mx: 2, display: { xs: 'none', sm: 'block' } }}>
            {/* Search component will be added here */}
          </Box>

          {/* Right side actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              color="inherit"
              onClick={handleNotificationMenuOpen}
            >
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={() => navigate('/community/chat')}
            >
              <Badge badgeContent={2} color="error">
                <Message />
              </Badge>
            </IconButton>

            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              <Avatar
                src={user?.profilePicture}
                sx={{ width: 32, height: 32 }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: 280 }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - 280px)` },
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'grey.50',
        }}
      >
        <Toolbar />
        
        {/* Main Content with Mobile Bottom Navigation Spacing */}
        <Box sx={{ 
          pb: { xs: '80px', md: 0 }, // Add bottom padding on mobile for bottom nav
          minHeight: { xs: 'calc(100vh - 144px)', md: 'calc(100vh - 64px)' },
          marginBottom: { xs: 0, md: 0 }
        }}>
          {children}
        </Box>
        
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <Person />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { navigate('/dashboard/student'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          Dashboard
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemIcon>
            <EmojiEvents />
          </ListItemIcon>
          <ListItemText 
            primary="New Achievement Unlocked!"
            secondary="2 minutes ago"
          />
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemIcon>
            <Group />
          </ListItemIcon>
          <ListItemText 
            primary="You were added to a group"
            secondary="1 hour ago"
          />
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemIcon>
            <Message />
          </ListItemIcon>
          <ListItemText 
            primary="New message from teacher"
            secondary="3 hours ago"
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationMenuClose}>
          <Typography variant="body2" color="primary" sx={{ textAlign: 'center', width: '100%' }}>
            View All Notifications
          </Typography>
        </MenuItem>
      </Menu>

      {/* Instagram-style Bottom Navigation - Mobile Only */}
      <BottomNavigationBar 
        userRole={user?.role}
        userName={`${user?.firstName} ${user?.lastName}`}
        userAvatar={user?.profilePicture}
        onCreatePost={() => {
          // Post creation handled by modal in BottomNavigationBar
        }}
      />
    </Box>
  );
};

export default CommunityLayout;
