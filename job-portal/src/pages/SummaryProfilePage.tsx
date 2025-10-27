import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  LocationOn,
  Email,
  Phone,
  Business,
  School,
  ArrowBack,
  PersonAdd,
  Check,
  AccessTime,
  Message,
  LinkedIn,
  GitHub,
  Language,
  Work,
  CalendarToday,
  Person,
  Badge,
  EmojiEvents,
  MonetizationOn,
  Visibility,
  Schedule,
  TranslateRounded,
  Star,
  VerifiedUser,
  Place,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { socialNetworkService } from '../services/socialNetworkService';
import type { User } from '../types/user';
import { motion } from 'framer-motion';

const SummaryProfilePage: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected' | 'loading'>('none');

  useEffect(() => {
    if (userId) {
      loadProfile();
      if (user && userId !== user._id) {
        checkConnectionStatus();
      }
    }
  }, [userId, user]);

  const loadProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const userProfile = await userService.getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!userId || !user) return;
    
    try {
      const response = await socialNetworkService.getConnectionStatus(userId);
      const status = response.data?.status || 'none';
      // Map backend status to component status
      if (status === 'accepted') {
        setConnectionStatus('connected');
      } else if (status === 'pending') {
        setConnectionStatus('pending');
      } else {
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus('none');
    }
  };

  const handleConnect = async () => {
    if (!user || !userId || connectionStatus === 'loading') return;
    
    try {
      setConnectionStatus('loading');
      
      if (connectionStatus === 'none') {
        await socialNetworkService.sendConnectionRequest(userId, 'connect');
        setConnectionStatus('pending');
      } else if (connectionStatus === 'pending') {
        await socialNetworkService.cancelConnectionRequest(userId);
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error handling connection:', error);
      setConnectionStatus(connectionStatus === 'none' ? 'none' : 'pending');
    }
  };

  const handleMessage = () => {
    // Navigate to messages page with user context
    navigate('/app/messages', { state: { startChatWithUser: userId } });
  };

  const getConnectButtonText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'pending': return 'Pending';
      case 'loading': return 'Loading...';
      default: return 'Connect';
    }
  };

  const getConnectButtonIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Check />;
      case 'pending': return <AccessTime />;
      case 'loading': return <AccessTime />;
      default: return <PersonAdd />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Profile not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Profile Summary
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Main Profile Card */}
          <Grid item xs={12} md={4}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              sx={{ 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'visible'
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Avatar
                  src={profile.profilePicture}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    border: '4px solid white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                  }}
                >
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </Avatar>
                
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {profile.firstName} {profile.lastName}
                </Typography>
                
                {profile.jobTitle && (
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    {profile.jobTitle}
                  </Typography>
                )}
                
                {profile.company && (
                  <Typography variant="body1" sx={{ opacity: 0.8, mb: 1 }}>
                    {profile.role === 'employer' ? '🏢 ' : 'at '}{profile.company}
                  </Typography>
                )}

                {profile.location && (
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    📍 {profile.location}
                  </Typography>
                )}

                {profile.experienceLevel && profile.role !== 'employer' && (
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                    🎯 {profile.experienceLevel.replace('_', ' ').toUpperCase()} Level
                  </Typography>
                )}

                {/* Show additional info for employers */}
                {profile.role === 'employer' && (
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                    👤 Employer • Hiring Manager
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={profile.role?.replace('_', ' ') || 'User'}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  {profile.employmentStatus && (
                    <Chip
                      label={profile.employmentStatus.replace('_', ' ')}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  )}
                  {profile.verification?.email && (
                    <Chip
                      icon={<VerifiedUser />}
                      label="Verified"
                      color="success"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(76, 175, 80, 0.2)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  )}
                </Box>

                {profile.summary && (
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 2, fontStyle: 'italic' }}>
                    "{profile.summary}"
                  </Typography>
                )}

                {/* Action Buttons */}
                {user && userId !== user._id && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color={connectionStatus === 'connected' ? 'success' : 'primary'}
                      startIcon={getConnectButtonIcon()}
                      onClick={handleConnect}
                      disabled={connectionStatus === 'loading'}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.3)',
                        }
                      }}
                    >
                      {getConnectButtonText()}
                    </Button>
                    
                    <Button
                      variant="contained"
                      startIcon={<Message />}
                      onClick={handleMessage}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.3)',
                        }
                      }}
                    >
                      Message
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Profile Details */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {/* Contact Information */}
              <Grid item xs={12}>
                <Card
                  component={motion.div}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {profile.role === 'employer' ? '📞 Contact Information' : 'Contact Information'}
                    </Typography>
                    {profile.role === 'employer' && (
                      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                        💼 Get in touch for hiring opportunities and partnerships
                      </Typography>
                    )}
                    <List dense>
                      {profile.email && (
                        <ListItem 
                          sx={{ 
                            ...(profile.role === 'employer' && {
                              bgcolor: 'action.hover',
                              borderRadius: 1,
                              mb: 1
                            })
                          }}
                        >
                          <ListItemIcon>
                            <Email color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={profile.role === 'employer' ? '📧 Business Email' : 'Email'}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <a 
                                  href={`mailto:${profile.email}`} 
                                  style={{ 
                                    color: profile.role === 'employer' ? '#1976d2' : 'inherit', 
                                    textDecoration: 'underline',
                                    fontWeight: profile.role === 'employer' ? 'bold' : 'normal'
                                  }}
                                >
                                  {profile.email}
                                </a>
                                {profile.role === 'employer' && (
                                  <Chip 
                                    label="Always Available" 
                                    size="small" 
                                    color="success" 
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      )}
                      {profile.phone && (
                        <ListItem 
                          sx={{ 
                            ...(profile.role === 'employer' && {
                              bgcolor: 'action.hover',
                              borderRadius: 1,
                              mb: 1
                            })
                          }}
                        >
                          <ListItemIcon>
                            <Phone color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={profile.role === 'employer' ? '☎️ Business Phone' : 'Phone'}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <a 
                                  href={`tel:${profile.phone}`} 
                                  style={{ 
                                    color: profile.role === 'employer' ? '#1976d2' : 'inherit', 
                                    textDecoration: 'underline',
                                    fontWeight: profile.role === 'employer' ? 'bold' : 'normal'
                                  }}
                                >
                                  {profile.phone}
                                </a>
                                {profile.role === 'employer' && (
                                  <Chip 
                                    label="Direct Line" 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      )}
                      {profile.location && (
                        <ListItem>
                          <ListItemIcon>
                            <LocationOn color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={profile.role === 'employer' ? '🏢 Office Location' : 'Location'}
                            secondary={profile.location}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Professional Information */}
              <Grid item xs={12}>
                <Card
                  component={motion.div}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {profile.role === 'employer' ? 'Company Information' : 'Professional Information'}
                    </Typography>
                    <List dense>
                      {profile.jobTitle && (
                        <ListItem>
                          <ListItemIcon>
                            <Badge color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={profile.role === 'employer' ? 'Role' : 'Position'} 
                            secondary={profile.jobTitle}
                          />
                        </ListItem>
                      )}
                      {profile.company && (
                        <ListItem>
                          <ListItemIcon>
                            <Business color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={profile.role === 'employer' ? 'Company' : 'Company'} 
                            secondary={profile.company}
                          />
                        </ListItem>
                      )}
                      {profile.role === 'employer' && profile.socialLinks?.website && (
                        <ListItem>
                          <ListItemIcon>
                            <Language color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Website" 
                            secondary={
                              <a 
                                href={profile.socialLinks.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: 'inherit', textDecoration: 'underline' }}
                              >
                                {profile.socialLinks.website}
                              </a>
                            }
                          />
                        </ListItem>
                      )}
                      {profile.role === 'employer' && profile.socialLinks?.linkedin && (
                        <ListItem>
                          <ListItemIcon>
                            <LinkedIn color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="LinkedIn" 
                            secondary={
                              <a 
                                href={profile.socialLinks.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: 'inherit', textDecoration: 'underline' }}
                              >
                                Company LinkedIn
                              </a>
                            }
                          />
                        </ListItem>
                      )}
                      {profile.role !== 'employer' && profile.education && profile.education.length > 0 && (
                        <ListItem>
                          <ListItemIcon>
                            <School color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Education" 
                            secondary={`${profile.education.length} qualification${profile.education.length !== 1 ? 's' : ''}`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Bio/About */}
              {profile.bio && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {profile.role === 'employer' ? 'Company Overview' : 'About'}
                      </Typography>
                      <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                        {profile.bio}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Employer-specific section */}
              {profile.role === 'employer' && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                        🚀 We're Hiring!
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                        Looking for talented professionals to join our team. Connect with us to explore opportunities.
                      </Typography>
                      
                      {/* Contact buttons for employers */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        {profile.email && (
                          <Button
                            variant="contained"
                            startIcon={<Email />}
                            href={`mailto:${profile.email}`}
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            Email Us
                          </Button>
                        )}
                        {profile.phone && (
                          <Button
                            variant="outlined"
                            startIcon={<Phone />}
                            href={`tel:${profile.phone}`}
                            sx={{
                              borderColor: 'rgba(255,255,255,0.5)',
                              color: 'white',
                              '&:hover': { 
                                borderColor: 'white',
                                bgcolor: 'rgba(255,255,255,0.1)'
                              }
                            }}
                          >
                            Call Now
                          </Button>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label="💼 Open Positions"
                          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                        <Chip
                          label="🤝 Partnerships Welcome"
                          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                        <Chip
                          label="📧 Quick Response"
                          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Skills - Only show for non-employers */}
              {profile.skills && profile.skills.length > 0 && profile.role !== 'employer' && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Skills
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {profile.skills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            variant="outlined"
                            color="primary"
                            size="small"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Technical Skills - Only show for non-employers */}
              {profile.technicalSkills && profile.technicalSkills.length > 0 && profile.role !== 'employer' && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Technical Skills
                      </Typography>
                      <List dense>
                        {profile.technicalSkills.map((techSkill, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {techSkill.skill}
                                  </Typography>
                                  <Chip
                                    label={techSkill.level}
                                    size="small"
                                    color={
                                      techSkill.level === 'expert' ? 'success' :
                                      techSkill.level === 'advanced' ? 'primary' :
                                      techSkill.level === 'intermediate' ? 'warning' : 'default'
                                    }
                                    variant="outlined"
                                  />
                                </Box>
                              }
                              secondary={techSkill.yearsOfExperience ? `${techSkill.yearsOfExperience} years` : undefined}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Languages */}
              {profile.languages && profile.languages.length > 0 && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Languages
                      </Typography>
                      <List dense>
                        {profile.languages.map((lang, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon>
                              <TranslateRounded color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={lang.language}
                              secondary={lang.proficiency}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Experience - Only show for non-employers */}
              {profile.experience && profile.experience.length > 0 && profile.role !== 'employer' && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Work Experience
                      </Typography>
                      {profile.experience.map((exp, index) => (
                        <Box key={index} sx={{ mb: index !== profile.experience!.length - 1 ? 3 : 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                            <Work color="primary" sx={{ mt: 0.5 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ mb: 0.5 }}>
                                {exp.position}
                              </Typography>
                              <Typography variant="subtitle1" color="primary" sx={{ mb: 0.5 }}>
                                {exp.company}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {new Date(exp.startDate).toLocaleDateString()} - {exp.current ? 'Present' : new Date(exp.endDate!).toLocaleDateString()}
                                {exp.location && ` • ${exp.location}`}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {exp.description}
                              </Typography>
                              {exp.achievements && exp.achievements.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
                                    Key Achievements:
                                  </Typography>
                                  {exp.achievements.map((achievement, achIndex) => (
                                    <Typography key={achIndex} variant="body2" sx={{ mb: 0.25, ml: 2 }}>
                                      • {achievement}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              {exp.technologies && exp.technologies.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {exp.technologies.map((tech, techIndex) => (
                                    <Chip
                                      key={techIndex}
                                      label={tech}
                                      size="small"
                                      variant="outlined"
                                      color="secondary"
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                          {index !== profile.experience!.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Education */}
              {profile.education && profile.education.length > 0 && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Education
                      </Typography>
                      {profile.education.map((edu, index) => (
                        <Box key={index} sx={{ mb: index !== profile.education!.length - 1 ? 3 : 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                            <School color="primary" sx={{ mt: 0.5 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ mb: 0.5 }}>
                                {edu.degree} in {edu.field}
                              </Typography>
                              <Typography variant="subtitle1" color="primary" sx={{ mb: 0.5 }}>
                                {edu.institution}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {new Date(edu.startDate).toLocaleDateString()} - {edu.current ? 'Present' : new Date(edu.endDate!).toLocaleDateString()}
                                {edu.location && ` • ${edu.location}`}
                                {edu.gpa && ` • GPA: ${edu.gpa}`}
                              </Typography>
                              {edu.description && (
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {edu.description}
                                </Typography>
                              )}
                              {edu.honors && edu.honors.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
                                    Honors:
                                  </Typography>
                                  {edu.honors.map((honor, honorIndex) => (
                                    <Typography key={honorIndex} variant="body2" sx={{ mb: 0.25, ml: 2 }}>
                                      • {honor}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              {edu.relevantCoursework && edu.relevantCoursework.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {edu.relevantCoursework.map((course, courseIndex) => (
                                    <Chip
                                      key={courseIndex}
                                      label={course}
                                      size="small"
                                      variant="outlined"
                                      color="secondary"
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                          {index !== profile.education!.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Certifications */}
              {profile.certifications && profile.certifications.length > 0 && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Certifications
                      </Typography>
                      {profile.certifications.map((cert, index) => (
                        <Box key={index} sx={{ mb: index !== profile.certifications!.length - 1 ? 2 : 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                            <Badge color="primary" sx={{ mt: 0.5 }} />
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="h6">
                                  {cert.name}
                                </Typography>
                                {cert.verified && (
                                  <VerifiedUser color="success" fontSize="small" />
                                )}
                              </Box>
                              <Typography variant="subtitle1" color="primary" sx={{ mb: 0.5 }}>
                                {cert.issuer}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Issued: {new Date(cert.issueDate).toLocaleDateString()}
                                {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                                {cert.credentialId && ` • ID: ${cert.credentialId}`}
                              </Typography>
                              {cert.description && (
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {cert.description}
                                </Typography>
                              )}
                              {cert.credentialUrl && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  href={cert.credentialUrl}
                                  target="_blank"
                                  sx={{ mb: 1 }}
                                >
                                  View Credential
                                </Button>
                              )}
                              {cert.skills && cert.skills.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {cert.skills.map((skill, skillIndex) => (
                                    <Chip
                                      key={skillIndex}
                                      label={skill}
                                      size="small"
                                      variant="outlined"
                                      color="secondary"
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                          {index !== profile.certifications!.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Achievements & Awards */}
              {((profile.achievements && profile.achievements.length > 0) || (profile.awards && profile.awards.length > 0)) && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Achievements & Awards
                      </Typography>
                      
                      {/* Awards */}
                      {profile.awards && profile.awards.map((award, index) => (
                        <Box key={`award-${index}`} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <EmojiEvents color="warning" sx={{ mt: 0.5 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ mb: 0.5 }}>
                                {award.title}
                              </Typography>
                              <Typography variant="subtitle1" color="primary" sx={{ mb: 0.5 }}>
                                {award.issuer}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {new Date(award.date).toLocaleDateString()}
                                {award.level && ` • ${award.level} level`}
                              </Typography>
                              {award.description && (
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  {award.description}
                                </Typography>
                              )}
                              {award.url && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  href={award.url}
                                  target="_blank"
                                >
                                  View Details
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}

                      {/* Achievements */}
                      {profile.achievements && profile.achievements.map((achievement, index) => (
                        <Box key={`achievement-${index}`} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Star color="primary" sx={{ mt: 0.5 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ mb: 0.5 }}>
                                {achievement.title}
                              </Typography>
                              {achievement.organization && (
                                <Typography variant="subtitle1" color="primary" sx={{ mb: 0.5 }}>
                                  {achievement.organization}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {new Date(achievement.date).toLocaleDateString()} • {achievement.category}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {achievement.description}
                              </Typography>
                              {achievement.url && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  href={achievement.url}
                                  target="_blank"
                                >
                                  View Details
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Job Preferences */}
              {profile.jobPreferences && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.82 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Job Preferences
                      </Typography>
                      <List dense>
                        {profile.jobPreferences.preferredJobTypes && profile.jobPreferences.preferredJobTypes.length > 0 && (
                          <ListItem>
                            <ListItemIcon>
                              <Work color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Preferred Job Types"
                              secondary={
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {profile.jobPreferences.preferredJobTypes.map((type, index) => (
                                    <Chip
                                      key={index}
                                      label={type.replace('_', ' ')}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                    />
                                  ))}
                                </Box>
                              }
                            />
                          </ListItem>
                        )}
                        {profile.jobPreferences.preferredLocations && profile.jobPreferences.preferredLocations.length > 0 && (
                          <ListItem>
                            <ListItemIcon>
                              <Place color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Preferred Locations"
                              secondary={
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {profile.jobPreferences.preferredLocations.map((location, index) => (
                                    <Chip
                                      key={index}
                                      label={location}
                                      size="small"
                                      variant="outlined"
                                      color="secondary"
                                    />
                                  ))}
                                </Box>
                              }
                            />
                          </ListItem>
                        )}
                        {profile.jobPreferences.remoteWork !== undefined && (
                          <ListItem>
                            <ListItemIcon>
                              <Language color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Remote Work" 
                              secondary={profile.jobPreferences.remoteWork ? 'Open to remote work' : 'Prefers on-site work'}
                            />
                          </ListItem>
                        )}
                        {profile.jobPreferences.willingToRelocate !== undefined && (
                          <ListItem>
                            <ListItemIcon>
                              <Place color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Willing to Relocate" 
                              secondary={profile.jobPreferences.willingToRelocate ? 'Yes' : 'No'}
                            />
                          </ListItem>
                        )}
                        {profile.jobPreferences.travelRequirement && (
                          <ListItem>
                            <ListItemIcon>
                              <Schedule color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Travel Requirement" 
                              secondary={profile.jobPreferences.travelRequirement.replace('_', ' ')}
                            />
                          </ListItem>
                        )}
                        {profile.jobPreferences.preferredIndustries && profile.jobPreferences.preferredIndustries.length > 0 && (
                          <ListItem>
                            <ListItemIcon>
                              <Business color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Preferred Industries"
                              secondary={
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {profile.jobPreferences.preferredIndustries.map((industry, index) => (
                                    <Chip
                                      key={index}
                                      label={industry}
                                      size="small"
                                      variant="outlined"
                                      color="info"
                                    />
                                  ))}
                                </Box>
                              }
                            />
                          </ListItem>
                        )}
                        {profile.jobPreferences.preferredCompanySize && (
                          <ListItem>
                            <ListItemIcon>
                              <Business color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Preferred Company Size" 
                              secondary={profile.jobPreferences.preferredCompanySize}
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Additional Information */}
              <Grid item xs={12}>
                <Card
                  component={motion.div}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Additional Information
                    </Typography>
                    <List dense>
                      {profile.dateOfBirth && (
                        <ListItem>
                          <ListItemIcon>
                            <CalendarToday color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Date of Birth" 
                            secondary={new Date(profile.dateOfBirth).toLocaleDateString()}
                          />
                        </ListItem>
                      )}
                      {profile.gender && (
                        <ListItem>
                          <ListItemIcon>
                            <Person color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Gender" 
                            secondary={profile.gender.replace('_', ' ')}
                          />
                        </ListItem>
                      )}
                      {profile.nationality && (
                        <ListItem>
                          <ListItemIcon>
                            <Place color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Nationality" 
                            secondary={profile.nationality}
                          />
                        </ListItem>
                      )}
                      {profile.experienceLevel && (
                        <ListItem>
                          <ListItemIcon>
                            <Work color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Experience Level" 
                            secondary={profile.experienceLevel.replace('_', ' ').toUpperCase()}
                          />
                        </ListItem>
                      )}
                      {profile.employmentStatus && (
                        <ListItem>
                          <ListItemIcon>
                            <Schedule color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Employment Status" 
                            secondary={profile.employmentStatus.replace('_', ' ').toUpperCase()}
                          />
                        </ListItem>
                      )}
                      {profile.expectedSalary && profile.expectedSalary.min && profile.expectedSalary.max && (
                        <ListItem>
                          <ListItemIcon>
                            <MonetizationOn color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Expected Salary" 
                            secondary={`${profile.expectedSalary.currency || ''} ${profile.expectedSalary.min.toLocaleString()} - ${profile.expectedSalary.max.toLocaleString()}`}
                          />
                        </ListItem>
                      )}
                      {profile.noticePeriod && (
                        <ListItem>
                          <ListItemIcon>
                            <Schedule color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Notice Period" 
                            secondary={profile.noticePeriod}
                          />
                        </ListItem>
                      )}
                      {profile.profileViews && typeof profile.profileViews === 'number' && (
                        <ListItem>
                          <ListItemIcon>
                            <Visibility color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Profile Views" 
                            secondary={profile.profileViews.toLocaleString()}
                          />
                        </ListItem>
                      )}
                      {profile.lastLogin && (
                        <ListItem>
                          <ListItemIcon>
                            <Schedule color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Last Active" 
                            secondary={new Date(profile.lastLogin).toLocaleDateString()}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Social Links */}
              {(profile.socialLinks?.linkedin || profile.socialLinks?.github || profile.socialLinks?.website) && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Social Links
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {profile.socialLinks?.linkedin && (
                          <Button
                            variant="outlined"
                            startIcon={<LinkedIn />}
                            href={profile.socialLinks.linkedin}
                            target="_blank"
                            size="small"
                          >
                            LinkedIn
                          </Button>
                        )}
                        {profile.socialLinks?.github && (
                          <Button
                            variant="outlined"
                            startIcon={<GitHub />}
                            href={profile.socialLinks.github}
                            target="_blank"
                            size="small"
                          >
                            GitHub
                          </Button>
                        )}
                        {profile.socialLinks?.website && (
                          <Button
                            variant="outlined"
                            startIcon={<Language />}
                            href={profile.socialLinks.website}
                            target="_blank"
                            size="small"
                          >
                            Website
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default SummaryProfilePage;