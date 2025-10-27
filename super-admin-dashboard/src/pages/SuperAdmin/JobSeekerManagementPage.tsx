import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
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
  IconButton,
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  Edit,
  Delete,
  MoreVert,
  Person,
  Work,
  School,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  TrendingUp,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  Download,
  Send,
  Block,
  Verified,
  Star,
  Language,
  Code,
  Business,
  AttachMoney,
  ExpandMore,
  Psychology,
  Quiz,
  EmojiEvents
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Types for job seeker data
interface JobSeeker {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  company?: string;
  profilePicture?: string;
  bio?: string;
  summary?: string;
  employmentStatus?: string;
  experienceLevel?: string;
  idNumber?: string;
  cvFile?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  skills?: string[];
  experience?: any[];
  education?: any[];
  certifications?: any[];
  profileCompletion?: {
    percentage: number;
    status: string;
  };
  verification?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  applicationCount?: number;
  savedJobsCount?: number;
  certificatesCount?: number;
  testsCompletedCount?: number;
  interviewsCount?: number;
}

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
      id={`jobseeker-tabpanel-${index}`}
      aria-labelledby={`jobseeker-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const JobSeekerManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [completionFilter, setCompletionFilter] = useState('all');
  const [selectedJobSeeker, setSelectedJobSeeker] = useState<JobSeeker | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJobSeekerId, setSelectedJobSeekerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobSeekers = async () => {
      setLoading(true);
      try {
        // Use centralized API client to respect baseURL and avoid SPA rewrites
        const { apiGet, handleApiResponse } = await import('../../services/api');
        console.log('🔍 Fetching job seekers via API client:', '/users/job-seekers?limit=100');

        const apiResponse = await apiGet<any>('/users/job-seekers', { limit: 100 });
        const data = handleApiResponse(apiResponse);
        console.log('✅ Job seekers data:', data.jobSeekers);

        setJobSeekers(data.jobSeekers || []);
      } catch (error: any) {
        console.error('❌ Error fetching job seekers:', error);
        setJobSeekers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobSeekers();
  }, []);

  const filteredJobSeekers = jobSeekers.filter(jobSeeker => {
    const matchesSearch = 
      jobSeeker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobSeeker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobSeeker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobSeeker.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobSeeker.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && jobSeeker.isActive) ||
      (statusFilter === 'inactive' && !jobSeeker.isActive);

    const matchesCompletion = completionFilter === 'all' ||
      (completionFilter === 'complete' && (jobSeeker.profileCompletion?.percentage || 0) >= 80) ||
      (completionFilter === 'incomplete' && (jobSeeker.profileCompletion?.percentage || 0) < 80);

    return matchesSearch && matchesStatus && matchesCompletion;
  });

  const handleViewDetails = (jobSeeker: JobSeeker) => {
    setSelectedJobSeeker(jobSeeker);
    setDetailsDialog(true);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, jobSeekerId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedJobSeekerId(jobSeekerId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJobSeekerId(null);
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'error';
  };

  const getCompletionIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle />;
    if (percentage >= 60) return <Info />;
    if (percentage >= 40) return <Warning />;
    return <ErrorIcon />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <Person sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Job Seeker Management
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Manage and monitor job seeker profiles, completion status, and activity
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {jobSeekers.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Job Seekers
                  </Typography>
                </Box>
                <Person sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {jobSeekers.filter(js => js.isActive).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Users
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {jobSeekers.filter(js => (js.profileCompletion?.percentage || 0) >= 80).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Complete Profiles
                  </Typography>
                </Box>
                <Verified sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {Math.round(jobSeekers.reduce((acc, js) => acc + (js.profileCompletion?.percentage || 0), 0) / jobSeekers.length)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg. Completion
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search job seekers..."
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  startAdornment={<FilterList sx={{ mr: 1 }} />}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Profile Completion</InputLabel>
                <Select
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value)}
                >
                  <MenuItem value="all">All Profiles</MenuItem>
                  <MenuItem value="complete">Complete (80%+)</MenuItem>
                  <MenuItem value="incomplete">Incomplete (&lt;80%)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Download />}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Job Seekers Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job Seeker</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Profile Status</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell>Stats</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <LinearProgress sx={{ width: '50%' }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : filteredJobSeekers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="textSecondary">
                          No job seekers found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobSeekers.map((jobSeeker) => (
                    <TableRow key={jobSeeker._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={jobSeeker.profilePicture}
                            sx={{ width: 48, height: 48 }}
                          >
                            {jobSeeker.firstName[0]}{jobSeeker.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {jobSeeker.firstName} {jobSeeker.lastName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {jobSeeker.jobTitle || 'No title specified'}
                            </Typography>
                            {jobSeeker.company && (
                              <Typography variant="caption" color="textSecondary">
                                at {jobSeeker.company}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Email fontSize="small" />
                            <Typography variant="body2">{jobSeeker.email}</Typography>
                            {jobSeeker.verification?.email && (
                              <Verified fontSize="small" color="success" />
                            )}
                          </Box>
                          {jobSeeker.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Phone fontSize="small" />
                              <Typography variant="body2">{jobSeeker.phone}</Typography>
                              {jobSeeker.verification?.phone && (
                                <Verified fontSize="small" color="success" />
                              )}
                            </Box>
                          )}
                          {jobSeeker.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn fontSize="small" />
                              <Typography variant="body2">{jobSeeker.location}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {getCompletionIcon(jobSeeker.profileCompletion?.percentage || 0)}
                            <Typography variant="body2" fontWeight="bold">
                              {jobSeeker.profileCompletion?.percentage || 0}% Complete
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={jobSeeker.profileCompletion?.percentage || 0}
                            color={getCompletionColor(jobSeeker.profileCompletion?.percentage || 0)}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                              label={jobSeeker.isActive ? 'Active' : 'Inactive'}
                              color={jobSeeker.isActive ? 'success' : 'default'}
                              size="small"
                            />
                            <Chip
                              label={jobSeeker.employmentStatus?.replace('_', ' ') || 'Unknown'}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Tooltip title="Applications">
                            <Chip
                              icon={<Work />}
                              label={jobSeeker.applicationCount || 0}
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                          <Tooltip title="Tests Completed">
                            <Chip
                              icon={<Psychology />}
                              label={jobSeeker.testsCompletedCount || 0}
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                          <Tooltip title="AI Interviews">
                            <Chip
                              icon={<Quiz />}
                              label={jobSeeker.interviewsCount || 0}
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            Skills: {jobSeeker.skills?.length || 0}
                          </Typography>
                          <Typography variant="body2">
                            Experience: {jobSeeker.experience?.length || 0}
                          </Typography>
                          <Typography variant="body2">
                            Education: {jobSeeker.education?.length || 0}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatLastLogin(jobSeeker.lastLogin)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Joined {formatDate(jobSeeker.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(jobSeeker)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, jobSeeker._id)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit Profile
        </MenuItemComponent>
        <MenuItemComponent onClick={handleMenuClose}>
          <Send sx={{ mr: 1 }} />
          Send Message
        </MenuItemComponent>
        <MenuItemComponent onClick={handleMenuClose}>
          <Block sx={{ mr: 1 }} />
          Suspend Account
        </MenuItemComponent>
        <Divider />
        <MenuItemComponent onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Account
        </MenuItemComponent>
      </Menu>

      {/* Job Seeker Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={selectedJobSeeker?.profilePicture}
              sx={{ width: 56, height: 56 }}
            >
              {selectedJobSeeker?.firstName[0]}{selectedJobSeeker?.lastName[0]}
            </Avatar>
            <Box>
              <Typography variant="h5">
                {selectedJobSeeker?.firstName} {selectedJobSeeker?.lastName}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                {selectedJobSeeker?.jobTitle || 'Job Seeker'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedJobSeeker && (
            <Box>
              <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                <Tab label="Overview" />
                <Tab label="Experience" />
                <Tab label="Education" />
                <Tab label="Skills" />
                <Tab label="Activity" />
              </Tabs>

              <TabPanel value={currentTab} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Basic Information</Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon><Email /></ListItemIcon>
                        <ListItemText primary="Email" secondary={selectedJobSeeker.email} />
                      </ListItem>
                      {selectedJobSeeker.phone && (
                        <ListItem>
                          <ListItemIcon><Phone /></ListItemIcon>
                          <ListItemText primary="Phone" secondary={selectedJobSeeker.phone} />
                        </ListItem>
                      )}
                      {selectedJobSeeker.location && (
                        <ListItem>
                          <ListItemIcon><LocationOn /></ListItemIcon>
                          <ListItemText primary="Location" secondary={selectedJobSeeker.location} />
                        </ListItem>
                      )}
                      {selectedJobSeeker.idNumber && (
                        <ListItem>
                          <ListItemIcon><Person /></ListItemIcon>
                          <ListItemText primary="ID Number" secondary={selectedJobSeeker.idNumber} />
                        </ListItem>
                      )}
                      {selectedJobSeeker.nationality && (
                        <ListItem>
                          <ListItemIcon><Language /></ListItemIcon>
                          <ListItemText primary="Nationality" secondary={selectedJobSeeker.nationality} />
                        </ListItem>
                      )}
                      {selectedJobSeeker.dateOfBirth && (
                        <ListItem>
                          <ListItemIcon><CalendarToday /></ListItemIcon>
                          <ListItemText primary="Date of Birth" secondary={new Date(selectedJobSeeker.dateOfBirth).toLocaleDateString()} />
                        </ListItem>
                      )}
                      {selectedJobSeeker.gender && (
                        <ListItem>
                          <ListItemIcon><Person /></ListItemIcon>
                          <ListItemText primary="Gender" secondary={selectedJobSeeker.gender.replace('_', ' ')} />
                        </ListItem>
                      )}
                      {selectedJobSeeker.address && (
                        <ListItem>
                          <ListItemIcon><LocationOn /></ListItemIcon>
                          <ListItemText primary="Address" secondary={selectedJobSeeker.address} />
                        </ListItem>
                      )}
                      {selectedJobSeeker.cvFile && (
                        <ListItem>
                          <ListItemIcon><Download /></ListItemIcon>
                          <ListItemText 
                            primary="CV File" 
                            secondary={
                              <Button
                                size="small"
                                startIcon={<Download />}
                                onClick={() => window.open(selectedJobSeeker.cvFile, '_blank')}
                              >
                                Download CV
                              </Button>
                            } 
                          />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Profile Status</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Profile Completion: {selectedJobSeeker.profileCompletion?.percentage || 0}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={selectedJobSeeker.profileCompletion?.percentage || 0}
                        color={getCompletionColor(selectedJobSeeker.profileCompletion?.percentage || 0)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={selectedJobSeeker.isActive ? 'Active' : 'Inactive'}
                        color={selectedJobSeeker.isActive ? 'success' : 'default'}
                      />
                      <Chip
                        label={selectedJobSeeker.verification?.email ? 'Email Verified' : 'Email Unverified'}
                        color={selectedJobSeeker.verification?.email ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  {selectedJobSeeker.bio && (
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>Bio</Typography>
                      <Typography variant="body1">{selectedJobSeeker.bio}</Typography>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                <Typography variant="h6" gutterBottom>Work Experience</Typography>
                {selectedJobSeeker.experience && selectedJobSeeker.experience.length > 0 ? (
                  selectedJobSeeker.experience.map((exp, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">
                          {exp.position} at {exp.company}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                        </Typography>
                        {exp.description && (
                          <Typography variant="body1">{exp.description}</Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))
                ) : (
                  <Alert severity="info">No work experience added yet.</Alert>
                )}
              </TabPanel>

              <TabPanel value={currentTab} index={2}>
                <Typography variant="h6" gutterBottom>Education</Typography>
                {selectedJobSeeker.education && selectedJobSeeker.education.length > 0 ? (
                  selectedJobSeeker.education.map((edu, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {edu.degree} in {edu.field}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {edu.institution} • {edu.year}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Alert severity="info">No education information added yet.</Alert>
                )}
              </TabPanel>

              <TabPanel value={currentTab} index={3}>
                <Typography variant="h6" gutterBottom>Skills</Typography>
                {selectedJobSeeker.skills && selectedJobSeeker.skills.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedJobSeeker.skills.map((skill, index) => (
                      <Chip key={index} label={skill} variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">No skills added yet.</Alert>
                )}
              </TabPanel>

              <TabPanel value={currentTab} index={4}>
                <Typography variant="h6" gutterBottom>Activity Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {selectedJobSeeker.applicationCount || 0}
                        </Typography>
                        <Typography variant="body2">Applications</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary">
                          {selectedJobSeeker.savedJobsCount || 0}
                        </Typography>
                        <Typography variant="body2">Saved Jobs</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {selectedJobSeeker.testsCompletedCount || 0}
                        </Typography>
                        <Typography variant="body2">Tests Completed</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {selectedJobSeeker.interviewsCount || 0}
                        </Typography>
                        <Typography variant="body2">AI Interviews</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Edit />}>
            Edit Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobSeekerManagementPage;