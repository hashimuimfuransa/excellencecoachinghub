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
  ListItemText,
  Stack,
  IconButton
} from '@mui/material';
import { SimpleFadeTransition } from '../../utils/transitionFix';
import {
  School,
  Psychology,
  Security,
  Groups,
  TrendingUp,
  CheckCircle,
  EmojiEvents,
  Lightbulb,
  Support,
  AutoAwesome,
  RocketLaunch,
  Diversity3,
  WorkspacePremium,
  Analytics,
  Language,
  QuestionAnswer,
  Verified,
  ElectricBolt,
  MenuBook,
  Engineering,
  Business,
  LinkedIn,
  Twitter,
  GitHub
} from '@mui/icons-material';

const AboutPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <RocketLaunch sx={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Industry-Ready Skills',
      description: 'Master in-demand skills tailored for today\'s competitive job market with hands-on projects and real-world applications.',
      color: '#667eea'
    },
    {
      icon: <Psychology sx={{ fontSize: 40, color: '#764ba2' }} />,
      title: 'AI-Powered Learning',
      description: 'Advanced AI technology provides personalized learning paths, performance analytics, and adaptive content delivery.',
      color: '#764ba2'
    },
    {
      icon: <WorkspacePremium sx={{ fontSize: 40, color: '#f093fb' }} />,
      title: 'Expert Coaching',
      description: 'Learn from industry professionals and certified coaches with proven track records in their respective fields.',
      color: '#f093fb'
    },
    {
      icon: <Diversity3 sx={{ fontSize: 40, color: '#f5576c' }} />,
      title: 'Community Learning',
      description: 'Connect with peers, join study groups, and participate in collaborative projects to enhance your learning experience.',
      color: '#f5576c'
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: '#4facfe' }} />,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics, skill assessments, and personalized feedback.',
      color: '#4facfe'
    },
    {
      icon: <Verified sx={{ fontSize: 40, color: '#00f2fe' }} />,
      title: 'Certified Excellence',
      description: 'Earn industry-recognized certificates and credentials that boost your career prospects and professional credibility.',
      color: '#00f2fe'
    }
  ];

  const stats = [
    { number: '50,000+', label: 'Active Learners', icon: Groups, color: '#4CAF50' },
    { number: '320+', label: 'Expert Courses', icon: MenuBook, color: '#FF9800' },
    { number: '95%', label: 'Job Success Rate', icon: TrendingUp, color: '#2196F3' },
    { number: '98%', label: 'Satisfaction Rate', icon: EmojiEvents, color: '#9C27B0' }
  ];

  const teamMembers = [
    {
      name: 'Jean Claude Uwimana',
      role: 'Chief Education Officer',
      avatar: 'JU',
      bio: 'Educational technology leader with 12+ years experience in Rwanda\'s tech sector, former university lecturer.',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'Marie Claudine Mukamana',
      role: 'Head of Content Strategy',
      avatar: 'MM',
      bio: 'Curriculum design expert specializing in job-market aligned educational content and professional development.',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'Emmanuel Nkurunziza',
      role: 'Technology Director',
      avatar: 'EN',
      bio: 'Full-stack developer and AI specialist leading our platform\'s technical innovation and learning systems.',
      linkedin: '#',
      github: '#'
    },
    {
      name: 'Sarah Uwimana',
      role: 'Student Success Manager',
      avatar: 'SU',
      bio: 'Dedicated to ensuring every learner achieves their career goals through personalized coaching and support.',
      linkedin: '#',
      twitter: '#'
    }
  ];

  const values = [
    {
      icon: <AutoAwesome sx={{ fontSize: 48, color: '#FFD700' }} />,
      title: 'Excellence in Education',
      description: 'We maintain the highest standards in course quality, instructor expertise, and learning outcomes to ensure every student succeeds.',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA726 100%)'
    },
    {
      icon: <ElectricBolt sx={{ fontSize: 48, color: '#4facfe' }} />,
      title: 'Innovation & Technology',
      description: 'Continuously evolving through cutting-edge technology, AI-powered tools, and innovative teaching methodologies.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: <Diversity3 sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'Community & Collaboration',
      description: 'Building a supportive learning community where students, instructors, and industry partners collaborate for mutual growth.',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  ];

  const whyChooseUs = {
    students: [
      'Personalized AI-powered learning paths',
      'Industry-aligned curriculum and projects',
      'Live coaching sessions with experts',
      '24/7 access to course materials and resources',
      'Interactive assessments and real-time feedback',
      'Job placement assistance and career coaching',
      'Professional networking opportunities',
      'Certificates recognized by top employers'
    ],
    instructors: [
      'State-of-the-art teaching platform and tools',
      'Comprehensive instructor support and training',
      'Competitive compensation and revenue sharing',
      'Access to student analytics and performance data',
      'Marketing and promotional support',
      'Flexible scheduling and remote teaching options',
      'Professional development opportunities',
      'Community of expert educators'
    ]
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Ultra-Modern Hero Section */}
      <Box
        sx={{
          background: `
            linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%),
            linear-gradient(45deg, rgba(0,0,0,0.8) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)
          `,
          backgroundSize: '300% 300%',
          animation: 'gradientShift 8s ease infinite',
          '@keyframes gradientShift': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
          },
          color: 'white',
          pt: { xs: 4, md: 6 },
          pb: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Floating Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '15%',
            right: '10%',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-30px) rotate(180deg)' }
            }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '8%',
            width: 140,
            height: 140,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'float 8s ease-in-out infinite reverse',
            transform: 'rotate(45deg)'
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} lg={6}>
              {/* Excellence Badge */}
              <SimpleFadeTransition in timeout={1000}>
                <Box sx={{ mb: 4 }}>
                  <Chip
                    icon={<AutoAwesome sx={{ fontSize: 18, color: '#FFD700 !important' }} />}
                    label="🏆 Excellence Coaching Hub - About Us"
                    sx={{
                      bgcolor: 'rgba(255, 215, 0, 0.15)',
                      color: '#FFD700',
                      fontWeight: 600,
                      px: 2,
                      py: 0.5,
                      fontSize: '0.9rem',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      backdropFilter: 'blur(10px)',
                      '& .MuiChip-icon': { color: '#FFD700' }
                    }}
                  />
                </Box>
              </SimpleFadeTransition>

              <SimpleFadeTransition in timeout={1200}>
                <Typography
                  variant="h1"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '3rem', md: '5rem' },
                    lineHeight: 0.9,
                    mb: 4,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 25%, #bbdefb 50%, #90caf9 75%, #64b5f6 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 60px rgba(255, 255, 255, 0.5)',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  Empowering
                  <Box 
                    component="span" 
                    sx={{ 
                      display: 'block',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA726 50%, #FF7043 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      position: 'relative'
                    }}
                  >
                    Excellence
                  </Box>
                </Typography>
              </SimpleFadeTransition>
              
              <SimpleFadeTransition in timeout={1400}>
                <Typography
                  variant="h4"
                  sx={{
                    mb: 6,
                    opacity: 0.95,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: '#f8fafc',
                    maxWidth: 600,
                    fontSize: { xs: '1.3rem', md: '1.6rem' }
                  }}
                >
                  We're transforming education in Rwanda and beyond, creating pathways to success through world-class coaching, cutting-edge technology, and a commitment to excellence.
                </Typography>
              </SimpleFadeTransition>

              {/* Trust Indicators */}
              <SimpleFadeTransition in timeout={1600}>
                <Paper
                  elevation={0}
                  sx={{
                    mb: 6,
                    p: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 3
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#e3f2fd', mb: 2, opacity: 0.9, fontWeight: 500 }}>
                    🌟 Leading Education Innovation in Rwanda
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1.5 }}>
                    {[
                      { name: '✅ Expert-Led Courses', color: '#4CAF50' },
                      { name: '✅ Career Coaching', color: '#2196F3' },
                      { name: '✅ Industry Partnerships', color: '#FF9800' },
                      { name: '✅ Job Placement', color: '#9C27B0' }
                    ].map((feature, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          px: 2.5,
                          py: 1.2,
                          bgcolor: 'rgba(255, 255, 255, 0.15)',
                          borderRadius: 2,
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${feature.color}40`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.25)',
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 25px ${feature.color}30`
                          }
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          {feature.name}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              </SimpleFadeTransition>
            </Grid>

            <Grid item xs={12} lg={6}>
              <SimpleFadeTransition in timeout={1800}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: { xs: 300, md: 500 },
                    position: 'relative'
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 6,
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        bgcolor: 'rgba(255, 255, 255, 0.15)'
                      }
                    }}
                  >
                    <School sx={{ fontSize: { xs: 80, md: 120 }, color: '#FFD700', mb: 3 }} />
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                      Excellence in Action
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      Transforming lives through education, one student at a time
                    </Typography>
                  </Paper>
                </Box>
              </SimpleFadeTransition>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Enhanced Stats Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <SimpleFadeTransition in timeout={2000 + index * 200}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}25 100%)`,
                    border: `1px solid ${stat.color}30`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${stat.color}30`
                    }
                  }}
                >
                  <stat.icon sx={{ fontSize: 40, color: stat.color, mb: 2 }} />
                  <Typography
                    variant="h3"
                    sx={{ 
                      fontWeight: 900, 
                      mb: 1,
                      background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}AA 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
                    {stat.label}
                  </Typography>
                </Paper>
              </SimpleFadeTransition>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Modern Mission Section */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          py: 12,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <SimpleFadeTransition in timeout={2400}>
            <Typography
              variant="h2"
              component="h2"
              textAlign="center"
              gutterBottom
              sx={{ 
                fontWeight: 900, 
                mb: 6,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Our Mission & Values
            </Typography>
          </SimpleFadeTransition>

          <SimpleFadeTransition in timeout={2600}>
            <Typography
              variant="h4"
              textAlign="center"
              color="text.secondary"
              sx={{ mb: 8, maxWidth: '900px', mx: 'auto', lineHeight: 1.6, fontWeight: 400 }}
            >
              To democratize access to world-class education and professional development, empowering individuals across Rwanda and Africa to unlock their potential and build thriving careers in the digital economy.
            </Typography>
          </SimpleFadeTransition>
          
          <Grid container spacing={4}>
            {values.map((value, index) => (
              <Grid item xs={12} md={4} key={index}>
                <SimpleFadeTransition in timeout={2800 + index * 200}>
                  <Card
                    sx={{
                      height: '100%',
                      textAlign: 'center',
                      p: 4,
                      borderRadius: 4,
                      background: 'white',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.15)'
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: value.gradient
                      }
                    }}
                  >
                    <CardContent sx={{ pt: 3 }}>
                      <Box sx={{ mb: 3 }}>
                        {value.icon}
                      </Box>
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                        {value.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {value.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </SimpleFadeTransition>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section with Modern Design */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <SimpleFadeTransition in timeout={3000}>
          <Typography
            variant="h2"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ 
              fontWeight: 900, 
              mb: 6,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            What Makes Us Exceptional
          </Typography>
                </SimpleFadeTransition>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <SimpleFadeTransition in timeout={3200 + index * 150}>
                <Card
                  sx={{
                    height: '100%',
                    p: 4,
                    borderRadius: 4,
                    background: 'white',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${feature.color}25`
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 4,
                      height: '100%',
                      background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}CC 100%)`
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    <Box 
                      sx={{ 
                        p: 2,
                        borderRadius: 3,
                        background: `${feature.color}15`,
                        border: `1px solid ${feature.color}30`
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {feature.description}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </SimpleFadeTransition>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Enhanced Team Section */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          py: 12 
        }}
      >
        <Container maxWidth="lg">
          <SimpleFadeTransition in timeout={3800}>
            <Typography
              variant="h2"
              component="h2"
              textAlign="center"
              gutterBottom
              sx={{ 
                fontWeight: 900, 
                mb: 6,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Meet Our Leadership Team
            </Typography>
          </SimpleFadeTransition>

          <Grid container spacing={4}>
            {teamMembers.map((member, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <SimpleFadeTransition in timeout={4000 + index * 200}>
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 4,
                      borderRadius: 4,
                      background: 'white',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        mx: 'auto',
                        mb: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {member.avatar}
                    </Avatar>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      {member.name}
                    </Typography>
                    <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                      {member.role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {member.bio}
                    </Typography>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {member.linkedin && (
                        <IconButton size="small" sx={{ color: '#0077b5' }}>
                          <LinkedIn />
                        </IconButton>
                      )}
                      {member.twitter && (
                        <IconButton size="small" sx={{ color: '#1da1f2' }}>
                          <Twitter />
                        </IconButton>
                      )}
                      {member.github && (
                        <IconButton size="small" sx={{ color: '#333' }}>
                          <GitHub />
                        </IconButton>
                      )}
                    </Stack>
                  </Card>
                </SimpleFadeTransition>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Why Choose Us Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <SimpleFadeTransition in timeout={4400}>
          <Typography
            variant="h2"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ 
              fontWeight: 900, 
              mb: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Why Excellence Coaching Hub?
          </Typography>
                </SimpleFadeTransition>

        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <SimpleFadeTransition in timeout={4600}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 5, 
                  borderRadius: 4, 
                  height: '100%',
                  background: 'linear-gradient(135deg, #667eea15 0%, #764ba225 100%)',
                  border: '1px solid #667eea30'
                }}
              >
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4, color: '#667eea' }}>
                  For Learners & Job Seekers
                </Typography>
                <List sx={{ '& .MuiListItem-root': { px: 0, py: 1 } }}>
                  {whyChooseUs.students.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: '#4CAF50' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontWeight: 500,
                            fontSize: '1rem'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </SimpleFadeTransition>
          </Grid>

          <Grid item xs={12} md={6}>
            <SimpleFadeTransition in timeout={4800}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 5, 
                  borderRadius: 4, 
                  height: '100%',
                  background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c25 100%)',
                  border: '1px solid #f093fb30'
                }}
              >
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4, color: '#f5576c' }}>
                  For Instructors & Coaches
                </Typography>
                <List sx={{ '& .MuiListItem-root': { px: 0, py: 1 } }}>
                  {whyChooseUs.instructors.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: '#4CAF50' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontWeight: 500,
                            fontSize: '1rem'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </SimpleFadeTransition>
          </Grid>
        </Grid>
      </Container>

      {/* Call to Action Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <SimpleFadeTransition in timeout={5000}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Ready to Start Your Learning Journey?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}>
              Join thousands of learners who are already transforming their careers with Excellence Coaching Hub.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
              <Paper
                elevation={0}
                sx={{
                  px: 4,
                  py: 2,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translateY(-3px)'
                  }
                }}
              >
                Explore Our Courses
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  px: 4,
                  py: 2,
                  borderRadius: 3,
                  background: 'white',
                  color: '#667eea',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 10px 30px rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                Start Learning Today
              </Paper>
            </Stack>
          </SimpleFadeTransition>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutPage;