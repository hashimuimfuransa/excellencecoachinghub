import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Stack,
  Chip,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  MoreVert,
  Person,
  Email,
  Phone,
  VideoCall,
  Message,
  Notifications,
  NotificationsOff,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
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
  School,
  People,
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
const MessageCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
  },
}));

const ChatBubble = styled(Paper)(({ theme, isOwn }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(2),
  maxWidth: '70%',
  backgroundColor: isOwn 
    ? theme.palette.primary.main 
    : theme.palette.grey[100],
  color: isOwn 
    ? theme.palette.primary.contrastText 
    : theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
}));

// Interfaces
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: Attachment[];
  type: 'text' | 'announcement' | 'reminder' | 'feedback';
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
}

interface StudentCommunicationProps {
  courseId: string;
  students: Student[];
}

const StudentCommunication: React.FC<StudentCommunicationProps> = ({
  courseId,
  students
}) => {
  const theme = useTheme();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'announcement' | 'reminder' | 'feedback'>('text');
  const [loading, setLoading] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');

  // Load messages for selected student
  useEffect(() => {
    if (selectedStudent) {
      loadMessages(selectedStudent.id);
    }
  }, [selectedStudent]);

  // Load messages
  const loadMessages = async (studentId: string) => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          senderId: 'teacher-1',
          senderName: 'Dr. Smith',
          content: 'Welcome to the course! I\'m excited to have you in my class.',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          type: 'text'
        },
        {
          id: 'msg-2',
          senderId: studentId,
          senderName: selectedStudent?.name || 'Student',
          content: 'Thank you! I\'m looking forward to learning from you.',
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          type: 'text'
        },
        {
          id: 'msg-3',
          senderId: 'teacher-1',
          senderName: 'Dr. Smith',
          content: 'Great! Don\'t hesitate to reach out if you have any questions.',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          type: 'text'
        },
        {
          id: 'msg-4',
          senderId: 'teacher-1',
          senderName: 'Dr. Smith',
          content: 'Reminder: The quiz for Chapter 1 is due tomorrow at 11:59 PM.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          type: 'reminder'
        }
      ];
      setMessages(mockMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent) return;

    try {
      const message: Message = {
        id: `msg-${Date.now()}`,
        senderId: 'teacher-1',
        senderName: 'Dr. Smith',
        content: newMessage,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: messageType
      };

      setMessages([...messages, message]);
      setNewMessage('');
      
      // TODO: Implement API call to send message
      console.log('Sending message:', message);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Send announcement
  const handleSendAnnouncement = async () => {
    if (!announcementContent.trim() || !announcementTitle.trim()) return;

    try {
      // TODO: Implement API call to send announcement to all students
      console.log('Sending announcement:', { title: announcementTitle, content: announcementContent });
      setAnnouncementDialogOpen(false);
      setAnnouncementContent('');
      setAnnouncementTitle('');
    } catch (err) {
      console.error('Error sending announcement:', err);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get message type color
  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'error';
      case 'reminder': return 'warning';
      case 'feedback': return 'info';
      default: return 'default';
    }
  };

  // Get message type icon
  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Notifications />;
      case 'reminder': return <Timer />;
      case 'feedback': return <Comment />;
      default: return <Message />;
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Students List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Students
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Notifications />}
                  onClick={() => setAnnouncementDialogOpen(true)}
                >
                  Announcement
                </Button>
              </Stack>
              
              <List>
                {students.map((student) => (
                  <ListItem
                    key={student.id}
                    button
                    selected={selectedStudent?.id === student.id}
                    onClick={() => setSelectedStudent(student)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: student.isOnline ? 'success.main' : 'grey.400',
                              border: `2px solid ${theme.palette.background.paper}`,
                            }}
                          />
                        }
                      >
                        <Avatar src={student.avatar}>
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={student.name}
                      secondary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="caption" color="text.secondary">
                            {student.isOnline ? 'Online' : `Last seen ${formatTimestamp(student.lastSeen)}`}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          {selectedStudent ? (
            <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
              {/* Chat Header */}
              <CardContent sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar src={selectedStudent.avatar}>
                    {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedStudent.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStudent.email}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Video Call">
                      <IconButton>
                        <VideoCall />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More Options">
                      <IconButton>
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>

              {/* Messages */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography>Loading messages...</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {messages.map((message) => (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: message.senderId === 'teacher-1' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <ChatBubble isOwn={message.senderId === 'teacher-1'}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                            {getMessageTypeIcon(message.type)}
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              {message.senderName}
                            </Typography>
                            <Chip
                              label={message.type}
                              size="small"
                              color={getMessageTypeColor(message.type) as any}
                              variant="outlined"
                            />
                          </Stack>
                          <Typography variant="body2">
                            {message.content}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7, mt: 0.5, display: 'block' }}>
                            {formatTimestamp(message.timestamp)}
                          </Typography>
                        </ChatBubble>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* Message Input */}
              <CardContent sx={{ borderTop: 1, borderColor: 'divider' }}>
                <Stack spacing={2}>
                  <FormControl size="small">
                    <InputLabel>Message Type</InputLabel>
                    <Select
                      value={messageType}
                      label="Message Type"
                      onChange={(e) => setMessageType(e.target.value as any)}
                    >
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="announcement">Announcement</MenuItem>
                      <MenuItem value="reminder">Reminder</MenuItem>
                      <MenuItem value="feedback">Feedback</MenuItem>
                    </Select>
                  </FormControl>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      multiline
                      maxRows={3}
                    />
                    <IconButton>
                      <AttachFile />
                    </IconButton>
                    <IconButton>
                      <EmojiEmotions />
                    </IconButton>
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      Send
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Message sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a student to start messaging
                </Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onClose={() => setAnnouncementDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Send Announcement
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Announcement Title"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Message Content"
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              fullWidth
              multiline
              rows={4}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnouncementDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendAnnouncement} 
            variant="contained"
            disabled={!announcementTitle.trim() || !announcementContent.trim()}
          >
            Send Announcement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentCommunication;
