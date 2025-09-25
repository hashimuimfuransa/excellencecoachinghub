import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  LinearProgress,
  Rating,
  Tabs,
  Tab,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  Person,
  Work,
  School,
  Psychology,
  EmojiEvents,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  LinkedIn,
  GitHub,
  Language,
  Email,
  Phone,
  LocationOn,
  Download,
  Upload,
  Star,
  TrendingUp,
  Code,
  ExpandMore,
  Link as LinkIcon,
  Visibility,
  Share,
  ContentCopy,
  Twitter,
  Facebook,
  WhatsApp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import type { User, WorkExperience, Education } from '../types/user';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfessionalProfilePage: React.FC = () => {
  const { user, updateUser, setUserData } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<User | null>(user);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);

  // Dialog states
  const [experienceDialog, setExperienceDialog] = useState({ open: false, item: null as WorkExperience | null, mode: 'create' });
  const [educationDialog, setEducationDialog] = useState({ open: false, item: null as Education | null, mode: 'create' });
  const [skillDialog, setSkillDialog] = useState({ open: false, skill: '' });

  // Form states
  const [newExperience, setNewExperience] = useState<WorkExperience>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    location: '',
    achievements: []
  });

  const [newEducation, setNewEducation] = useState<Education>({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    current: false,
    gpa: '',
    description: '',
    achievements: []
  });

  const [userStats, setUserStats] = useState({
    applicationCount: 0,
    savedJobsCount: 0,
    certificatesCount: 0,
    testsCompletedCount: 0,
    interviewsCount: 0
  });

  useEffect(() => {
    if (user) {
      loadProfessionalProfile();
    }
  }, [user]);

  const loadProfessionalProfile = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const [userProfile, stats] = await Promise.all([
        userService.getUserProfile(user._id),
        userService.getUserStats(user._id)
      ]);
      setProfile(userProfile);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading professional profile:', error);
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleAddExperience = () => {
    setExperienceDialog({ open: true, item: null, mode: 'create' });
    setNewExperience({
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      location: '',
      achievements: []
    });
  };

  const handleSaveExperience = async () => {
    if (!profile?._id) return;

    setLoading(true);
    try {
      const updatedExperience = [...(profile.experience || [])];
      if (experienceDialog.mode === 'create') {
        updatedExperience.push({ ...newExperience, _id: Date.now().toString() });
      } else if (experienceDialog.item) {
        const index = updatedExperience.findIndex(exp => exp._id === experienceDialog.item?._id);
        if (index !== -1) {
          updatedExperience[index] = newExperience;
        }
      }

      const updatedProfile = await userService.updateProfile(profile._id, { experience: updatedExperience });
      setProfile(updatedProfile);
      setUserData(updatedProfile);
      
      // Fetch fresh data from the server to ensure we have the latest profile completion
      console.log('🔄 ProfessionalProfilePage fetching fresh data after experience update');
      await loadProfessionalProfile();
      
      setExperienceDialog({ open: false, item: null, mode: 'create' });
      setSuccessMessage('Work experience updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving experience:', error);
      setErrorMessage('Failed to save work experience');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEducation = () => {
    setEducationDialog({ open: true, item: null, mode: 'create' });
    setNewEducation({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
      gpa: '',
      description: '',
      achievements: []
    });
  };

  const handleSaveEducation = async () => {
    if (!profile?._id) return;

    setLoading(true);
    try {
      const updatedEducation = [...(profile.education || [])];
      if (educationDialog.mode === 'create') {
        updatedEducation.push({ ...newEducation, _id: Date.now().toString() });
      } else if (educationDialog.item) {
        const index = updatedEducation.findIndex(edu => edu._id === educationDialog.item?._id);
        if (index !== -1) {
          updatedEducation[index] = newEducation;
        }
      }

      const updatedProfile = await userService.updateProfile(profile._id, { education: updatedEducation });
      setProfile(updatedProfile);
      setUserData(updatedProfile);
      
      // Fetch fresh data from the server to ensure we have the latest profile completion
      console.log('🔄 ProfessionalProfilePage fetching fresh data after education update');
      await loadProfessionalProfile();
      
      setEducationDialog({ open: false, item: null, mode: 'create' });
      setSuccessMessage('Education updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving education:', error);
      setErrorMessage('Failed to save education');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!profile?._id || !skillDialog.skill.trim()) return;

    const updatedSkills = [...(profile.skills || []), skillDialog.skill.trim()];
    
    try {
      const updatedProfile = await userService.updateProfile(profile._id, { skills: updatedSkills });
      setProfile(updatedProfile);
      setUserData(updatedProfile);
      
      // Fetch fresh data from the server to ensure we have the latest profile completion
      console.log('🔄 ProfessionalProfilePage fetching fresh data after skill add');
      await loadProfessionalProfile();
      
      setSkillDialog({ open: false, skill: '' });
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile?._id) return;

    const updatedSkills = (profile.skills || []).filter(skill => skill !== skillToRemove);
    
    try {
      const updatedProfile = await userService.updateProfile(profile._id, { skills: updatedSkills });
      setProfile(updatedProfile);
      setUserData(updatedProfile);
      
      // Fetch fresh data from the server to ensure we have the latest profile completion
      console.log('🔄 ProfessionalProfilePage fetching fresh data after skill remove');
      await loadProfessionalProfile();
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  // Profile sharing functionality
  const handleShareProfile = async () => {
    try {
      const profileUrl = `${window.location.origin}/app/profile/view/${profile._id}`;
      await navigator.clipboard.writeText(profileUrl);
      setSuccessMessage('Profile link copied to clipboard!');
      setShareMenuAnchor(null);
    } catch (error) {
      console.error('Error copying profile link:', error);
      setErrorMessage('Failed to copy profile link');
    }
  };

  const handleShareToSocial = (platform: string) => {
    const profileUrl = `${window.location.origin}/app/profile/view/${profile._id}`;
    const text = `Check out ${profile?.firstName} ${profile?.lastName}'s professional profile on Excellence Coaching Hub!`;
    
    let shareUrl = '';
    switch (platform) {
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + profileUrl)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank');
    setShareMenuAnchor(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Professional Profile...
        </Typography>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load profile data</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <Person sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          Professional Profile
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Share />}
            onClick={(e) => setShareMenuAnchor(e.currentTarget)}
          >
            Share Profile
          </Button>
          <Button variant="outlined" startIcon={<Download />}>
            Download Resume
          </Button>
          <Button variant="outlined" startIcon={<Visibility />}>
            Preview Public Profile
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: '3rem' }}
                src={profile.profilePicture}
              >
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </Avatar>
              
              <Typography variant="h4" gutterBottom>
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                {profile.jobTitle || 'Professional'}
              </Typography>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                {profile.location}
              </Typography>
              
              {profile.bio && (
                <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
                  {profile.bio}
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                {profile.socialLinks?.linkedin && (
                  <IconButton href={profile.socialLinks.linkedin} target="_blank">
                    <LinkedIn />
                  </IconButton>
                )}
                {profile.socialLinks?.github && (
                  <IconButton href={profile.socialLinks.github} target="_blank">
                    <GitHub />
                  </IconButton>
                )}
                {profile.socialLinks?.portfolio && (
                  <IconButton href={profile.socialLinks.portfolio} target="_blank">
                    <Language />
                  </IconButton>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />
              
              {/* Quick Stats */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h6" color="primary">
                    {userStats.applicationCount}
                  </Typography>
                  <Typography variant="body2">Applications</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" color="primary">
                    {userStats.certificatesCount}
                  </Typography>
                  <Typography variant="body2">Certificates</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" color="primary">
                    {profile.skills?.length || 0}
                  </Typography>
                  <Typography variant="body2">Skills</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" color="primary">
                    {profile.experience?.length || 0}
                  </Typography>
                  <Typography variant="body2">Experiences</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Email /></ListItemIcon>
                  <ListItemText primary={profile.email} />
                </ListItem>
                {profile.phone && (
                  <ListItem>
                    <ListItemIcon><Phone /></ListItemIcon>
                    <ListItemText primary={profile.phone} />
                  </ListItem>
                )}
                {profile.location && (
                  <ListItem>
                    <ListItemIcon><LocationOn /></ListItemIcon>
                    <ListItemText primary={profile.location} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={currentTab} onChange={handleTabChange}>
                <Tab label="Experience" icon={<Work />} />
                <Tab label="Education" icon={<School />} />
                <Tab label="Skills" icon={<Psychology />} />
                <Tab label="Achievements" icon={<EmojiEvents />} />
              </Tabs>
            </Box>

            {/* Experience Tab */}
            <TabPanel value={currentTab} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Work Experience</Typography>
                <Button startIcon={<Add />} variant="outlined" onClick={handleAddExperience}>
                  Add Experience
                </Button>
              </Box>

              <Timeline>
                {profile.experience?.map((exp, index) => (
                  <TimelineItem key={exp._id || index}>
                    <TimelineSeparator>
                      <TimelineDot color="primary">
                        <Work />
                      </TimelineDot>
                      {index < (profile.experience?.length || 0) - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6">{exp.position}</Typography>
                            <Typography variant="subtitle1" color="primary">
                              {exp.company}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                              {exp.location && ` • ${exp.location}`}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {exp.description}
                            </Typography>
                            {exp.achievements && exp.achievements.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" fontWeight="bold">Key Achievements:</Typography>
                                <ul>
                                  {exp.achievements.map((achievement, i) => (
                                    <li key={i}>
                                      <Typography variant="body2">{achievement}</Typography>
                                    </li>
                                  ))}
                                </ul>
                              </Box>
                            )}
                          </Box>
                          <Box>
                            <IconButton
                              onClick={() => {
                                setExperienceDialog({ open: true, item: exp, mode: 'edit' });
                                setNewExperience(exp);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Box>
                        </Box>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>

              {(!profile.experience || profile.experience.length === 0) && (
                <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
                  No work experience added yet. Click "Add Experience" to get started.
                </Typography>
              )}
            </TabPanel>

            {/* Education Tab */}
            <TabPanel value={currentTab} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Education</Typography>
                <Button startIcon={<Add />} variant="outlined" onClick={handleAddEducation}>
                  Add Education
                </Button>
              </Box>

              {profile.education?.map((edu, index) => (
                <Accordion key={edu._id || index} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box>
                      <Typography variant="h6">{edu.degree} in {edu.field}</Typography>
                      <Typography variant="subtitle1" color="primary">
                        {edu.institution}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                        {edu.gpa && ` • GPA: ${edu.gpa}`}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {edu.description && (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {edu.description}
                      </Typography>
                    )}
                    {edu.achievements && edu.achievements.length > 0 && (
                      <Box>
                        <Typography variant="body2" fontWeight="bold">Achievements:</Typography>
                        <ul>
                          {edu.achievements.map((achievement, i) => (
                            <li key={i}>
                              <Typography variant="body2">{achievement}</Typography>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}

              {(!profile.education || profile.education.length === 0) && (
                <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
                  No education added yet. Click "Add Education" to get started.
                </Typography>
              )}
            </TabPanel>

            {/* Skills Tab */}
            <TabPanel value={currentTab} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Skills & Expertise</Typography>
                <Button startIcon={<Add />} variant="outlined" onClick={() => setSkillDialog({ open: true, skill: '' })}>
                  Add Skill
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.skills?.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => handleRemoveSkill(skill)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              {(!profile.skills || profile.skills.length === 0) && (
                <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
                  No skills added yet. Click "Add Skill" to showcase your expertise.
                </Typography>
              )}
            </TabPanel>

            {/* Achievements Tab */}
            <TabPanel value={currentTab} index={3}>
              <Typography variant="h6" gutterBottom>Achievements & Certifications</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {userStats.certificatesCount}
                    </Typography>
                    <Typography variant="body1">Certificates Earned</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {userStats.testsCompletedCount}
                    </Typography>
                    <Typography variant="body1">Tests Completed</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="body1" color="textSecondary" textAlign="center" sx={{ py: 4 }}>
                Complete assessments and earn certificates to showcase your achievements here.
              </Typography>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>

      {/* Experience Dialog */}
      <Dialog open={experienceDialog.open} onClose={() => setExperienceDialog({ open: false, item: null, mode: 'create' })} maxWidth="md" fullWidth>
        <DialogTitle>
          {experienceDialog.mode === 'create' ? 'Add Work Experience' : 'Edit Work Experience'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={newExperience.company}
                onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={newExperience.position}
                onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={newExperience.startDate}
                onChange={(e) => setNewExperience(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={newExperience.endDate}
                onChange={(e) => setNewExperience(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={newExperience.current}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={newExperience.location}
                onChange={(e) => setNewExperience(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={newExperience.description}
                onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExperienceDialog({ open: false, item: null, mode: 'create' })}>
            Cancel
          </Button>
          <Button onClick={handleSaveExperience} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Education Dialog */}
      <Dialog open={educationDialog.open} onClose={() => setEducationDialog({ open: false, item: null, mode: 'create' })} maxWidth="md" fullWidth>
        <DialogTitle>
          {educationDialog.mode === 'create' ? 'Add Education' : 'Edit Education'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Institution"
                value={newEducation.institution}
                onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Degree"
                value={newEducation.degree}
                onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field of Study"
                value={newEducation.field}
                onChange={(e) => setNewEducation(prev => ({ ...prev, field: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GPA (Optional)"
                value={newEducation.gpa}
                onChange={(e) => setNewEducation(prev => ({ ...prev, gpa: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={newEducation.startDate}
                onChange={(e) => setNewEducation(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={newEducation.endDate}
                onChange={(e) => setNewEducation(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={newEducation.current}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newEducation.description}
                onChange={(e) => setNewEducation(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEducationDialog({ open: false, item: null, mode: 'create' })}>
            Cancel
          </Button>
          <Button onClick={handleSaveEducation} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Skill Dialog */}
      <Dialog open={skillDialog.open} onClose={() => setSkillDialog({ open: false, skill: '' })}>
        <DialogTitle>Add New Skill</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Skill Name"
            value={skillDialog.skill}
            onChange={(e) => setSkillDialog(prev => ({ ...prev, skill: e.target.value }))}
            sx={{ mt: 2 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddSkill();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillDialog({ open: false, skill: '' })}>
            Cancel
          </Button>
          <Button onClick={handleAddSkill} variant="contained" disabled={!skillDialog.skill.trim()}>
            Add Skill
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Profile Menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={() => setShareMenuAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem onClick={handleShareProfile} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <ContentCopy color="primary" />
          </ListItemIcon>
          <ListItemText primary="Copy Profile Link" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleShareToSocial('linkedin')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <LinkedIn sx={{ color: '#0077b5' }} />
          </ListItemIcon>
          <ListItemText primary="Share on LinkedIn" />
        </MenuItem>
        <MenuItem onClick={() => handleShareToSocial('twitter')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Twitter sx={{ color: '#1DA1F2' }} />
          </ListItemIcon>
          <ListItemText primary="Share on Twitter" />
        </MenuItem>
        <MenuItem onClick={() => handleShareToSocial('facebook')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Facebook sx={{ color: '#1877f2' }} />
          </ListItemIcon>
          <ListItemText primary="Share on Facebook" />
        </MenuItem>
        <MenuItem onClick={() => handleShareToSocial('whatsapp')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <WhatsApp sx={{ color: '#25D366' }} />
          </ListItemIcon>
          <ListItemText primary="Share on WhatsApp" />
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default ProfessionalProfilePage;