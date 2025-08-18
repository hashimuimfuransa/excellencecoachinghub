import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  School,
  Psychology,
  Security,
  Groups,
  TrendingUp,
  CheckCircle,
  EmojiEvents,
  Lightbulb,
  Support
} from '@mui/icons-material';

const AboutPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <School color="primary" />,
      title: 'Comprehensive Learning',
      description: 'Access to a wide range of courses designed by industry experts to enhance your skills and knowledge.'
    },
    {
      icon: <Psychology color="primary" />,
      title: 'AI-Powered Insights',
      description: 'Advanced AI technology provides personalized learning recommendations and performance analytics.'
    },
    {
      icon: <Security color="primary" />,
      title: 'Secure Proctoring',
      description: 'State-of-the-art proctoring system ensures exam integrity while maintaining user privacy.'
    },
    {
      icon: <Groups color="primary" />,
      title: 'Collaborative Learning',
      description: 'Interactive features that promote collaboration between students and instructors.'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Active Students' },
    { number: '500+', label: 'Expert Instructors' },
    { number: '1,000+', label: 'Courses Available' },
    { number: '95%', label: 'Success Rate' }
  ];

  const teamMembers = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Education Officer',
      avatar: '/api/placeholder/150/150',
      bio: 'Former Stanford professor with 15+ years in educational technology.'
    },
    {
      name: 'Michael Chen',
      role: 'Head of Technology',
      avatar: '/api/placeholder/150/150',
      bio: 'AI specialist with expertise in machine learning and educational platforms.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Student Success Manager',
      avatar: '/api/placeholder/150/150',
      bio: 'Dedicated to ensuring every student achieves their learning goals.'
    }
  ];

  const values = [
    {
      icon: <EmojiEvents color="primary" />,
      title: 'Excellence',
      description: 'We strive for the highest quality in education and technology.'
    },
    {
      icon: <Lightbulb color="primary" />,
      title: 'Innovation',
      description: 'Continuously improving through cutting-edge technology and methods.'
    },
    {
      icon: <Support color="primary" />,
      title: 'Support',
      description: 'Providing comprehensive support to help every learner succeed.'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                About Excellence Coaching Hub
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  opacity: 0.9,
                  lineHeight: 1.6
                }}
              >
                Empowering learners worldwide with cutting-edge technology and personalized education experiences.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label="AI-Powered" color="secondary" />
                <Chip label="Secure" color="secondary" />
                <Chip label="Innovative" color="secondary" />
                <Chip label="Trusted" color="secondary" />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: { xs: 200, md: 300 }
                }}
              >
                <School sx={{ fontSize: { xs: 120, md: 200 }, opacity: 0.3 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}
              >
                <Typography
                  variant="h3"
                  color="primary"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                >
                  {stat.number}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Mission Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 6 }}
          >
            Our Mission
          </Typography>
          <Typography
            variant="h5"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6, maxWidth: '800px', mx: 'auto', lineHeight: 1.6 }}
          >
            To democratize quality education by providing accessible, innovative, and personalized learning experiences 
            that empower individuals to achieve their full potential and drive positive change in their communities.
          </Typography>
          
          <Grid container spacing={4}>
            {values.map((value, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 3,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      {value.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {value.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 6 }}
        >
          What Makes Us Different
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 3,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ mt: 0.5 }}>
                    {feature.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Team Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 6 }}
          >
            Meet Our Team
          </Typography>
          <Grid container spacing={4}>
            {teamMembers.map((member, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: 'primary.main'
                    }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {member.name}
                  </Typography>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    {member.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.bio}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Why Choose Us Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 6 }}
        >
          Why Choose Excellence Coaching Hub?
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                For Students
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Personalized learning paths" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="24/7 access to course materials" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Interactive quizzes and assessments" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Progress tracking and analytics" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Certificate upon completion" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                For Instructors
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Easy course creation tools" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Student performance analytics" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Automated grading system" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Live session capabilities" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Revenue sharing opportunities" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AboutPage;
