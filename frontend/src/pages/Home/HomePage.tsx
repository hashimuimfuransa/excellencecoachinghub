import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  Rating,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  School,
  Quiz,
  VideoCall,
  EmojiEvents,
  Security,
  TrendingUp,
  People,
  Star,
  PlayArrow,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from 'react-query';
import { courseService } from '../../services/courseService';

// Hero Section Component
const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("/E-learning-Library.png")',
          opacity: 0.3
        }}
      />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2,
                mb: 3
              }}
            >
              Excellence in
              <Box component="span" sx={{ color: '#FFD700', display: 'block' }}>
                Online Learning
              </Box>
            </Typography>
            
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                opacity: 0.9,
                fontWeight: 300,
                lineHeight: 1.6
              }}
            >
              Unlock your potential with AI-powered courses, live sessions, and personalized learning paths designed for success.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(isAuthenticated ? '/' : '/register')}
                sx={{
                  bgcolor: '#FFD700',
                  color: '#000',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#FFC107',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(255, 215, 0, 0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start Learning Today'}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<PlayArrow />}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    borderColor: '#FFD700',
                    color: '#FFD700',
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Watch Demo
              </Button>
            </Box>
            
            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 4, mt: 6, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFD700' }}>
                  10K+
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Students
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFD700' }}>
                  500+
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Courses
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FFD700' }}>
                  98%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Success Rate
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: 'relative',
                textAlign: 'center',
                display: { xs: 'none', md: 'block' }
              }}
            >
              {/* Floating Cards Animation */}
              <Box
                sx={{
                  position: 'relative',
                  height: 400,
                  '& .floating-card': {
                    position: 'absolute',
                    animation: 'float 6s ease-in-out infinite',
                    '@keyframes float': {
                      '0%, 100%': { transform: 'translateY(0px)' },
                      '50%': { transform: 'translateY(-50px)' }
                    }
                  }
                }}
              >
                <Card
                  className="floating-card"
                  sx={{
                    top: 50,
                    left: 80,
                    width: 200,
                    animationDelay: '0s',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <CardContent>
                    <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">AI-Powered Learning</Typography>
                  </CardContent>
                </Card>
                
                <Card
                  className="floating-card"
                  sx={{
                    top: 150,
                    right: 30,
                    width: 180,
                    animationDelay: '2s',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <CardContent>
                    <VideoCall color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Live Sessions</Typography>
                  </CardContent>
                </Card>
                
                <Card
                  className="floating-card"
                  sx={{
                    bottom: 50,
                    left: 80,
                    width: 190,
                    animationDelay: '4s',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <CardContent>
                    <Security color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Secure Proctoring</Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

// Features Section Component
const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <School sx={{ fontSize: 50 }} />,
      title: 'AI-Powered Learning',
      description: 'Personalized learning paths powered by artificial intelligence to optimize your educational journey.',
      color: '#1976d2'
    },
    {
      icon: <VideoCall sx={{ fontSize: 50 }} />,
      title: 'Live Interactive Sessions',
      description: 'Join real-time classes with expert instructors and collaborate with fellow students worldwide.',
      color: '#9c27b0'
    },
    {
      icon: <Quiz sx={{ fontSize: 50 }} />,
      title: 'Smart Assessments',
      description: 'Adaptive quizzes and exams that adjust to your learning pace and provide instant feedback.',
      color: '#f57c00'
    },
    {
      icon: <Security sx={{ fontSize: 50 }} />,
      title: 'Secure Proctoring',
      description: 'Advanced AI proctoring ensures exam integrity while maintaining a comfortable testing environment.',
      color: '#388e3c'
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 50 }} />,
      title: 'Gamified Learning',
      description: 'Earn badges, points, and certificates as you progress through your learning milestones.',
      color: '#d32f2f'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 50 }} />,
      title: 'Progress Analytics',
      description: 'Detailed insights into your learning progress with actionable recommendations for improvement.',
      color: '#7b1fa2'
    }
  ];

  return (
    <Box sx={{ py: 10, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            Why Choose Excellence Hub?
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}
          >
            Experience the future of education with our cutting-edge platform designed for modern learners
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                  },
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box
                    sx={{
                      color: feature.color,
                      mb: 3,
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: 'text.secondary', lineHeight: 1.7 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// Featured Courses Section Component
const FeaturedCoursesSection: React.FC = () => {
  const navigate = useNavigate();

  // Fetch real courses from backend
  const { data: coursesData, isLoading, error } = useQuery(
    'featuredCourses',
    () => courseService.getPublicCourses({ 
      limit: 6, 
      sortBy: 'enrollmentCount', 
      sortOrder: 'desc' 
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const featuredCourses = coursesData?.courses || [];

  return (
    <Box sx={{ py: 10, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
              Featured Courses
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto', mb: 4 }}
            >
              Discover our most popular courses taught by industry experts
            </Typography>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/courses')}
              sx={{ mb: 4 }}
            >
              View All Courses
            </Button>
          </Box>

          {/* Loading State */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              Failed to load courses. Please try again later.
            </Alert>
          )}

          {/* Courses Grid */}
          {!isLoading && !error && (
            <Grid container spacing={4}>
              {featuredCourses.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No courses available at the moment.
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                featuredCourses.map((course) => (
                <Grid item xs={12} md={6} lg={4} key={course._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                      },
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/courses/${course._id}`)}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 200,
                        background: course.thumbnail 
                          ? `url(${course.thumbnail})` 
                          : `linear-gradient(45deg, ${
                              course.category.toLowerCase().includes('programming') || course.category.toLowerCase().includes('web') 
                                ? '#667eea, #764ba2' 
                                : course.category.toLowerCase().includes('data') || course.category.toLowerCase().includes('science')
                                ? '#f093fb, #f5576c' 
                                : '#4facfe, #00f2fe'
                            })`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '3rem'
                      }}
                    >
                      {!course.thumbnail && (
                        course.category.toLowerCase().includes('programming') || course.category.toLowerCase().includes('web') 
                          ? '💻' 
                          : course.category.toLowerCase().includes('data') || course.category.toLowerCase().includes('science')
                          ? '📊' 
                          : '📚'
                      )}
                    </CardMedia>

                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={course.category}
                          size="small"
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography
                        variant="h6"
                        component="h3"
                        gutterBottom
                        sx={{ 
                          fontWeight: 600, 
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {course.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ 
                          color: 'text.secondary', 
                          mb: 2, 
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {course.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                          {course.instructor.firstName[0]}{course.instructor.lastName[0]}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {course.instructor.firstName} {course.instructor.lastName}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Rating value={course.rating || 0} precision={0.1} size="small" readOnly />
                        <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                          {course.rating ? course.rating.toFixed(1) : 'New'} ({course.enrollmentCount || 0} students)
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: 'primary.main' }}
                        >
                          ${course.price}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {course.duration}h
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
        </>
      </Container>
    </Box>
  );
};

// Testimonials Section Component
const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Alex Thompson',
      role: 'Software Engineer at Google',
      avatar: '/images/avatar1.jpg',
      rating: 5,
      text: 'Excellence Hub transformed my career! The AI-powered learning paths helped me land my dream job at Google. The instructors are world-class and the content is always up-to-date.'
    },
    {
      name: 'Maria Garcia',
      role: 'Data Scientist at Microsoft',
      avatar: '/images/avatar2.jpg',
      rating: 5,
      text: 'The data science course was incredible. The hands-on projects and real-world applications made complex concepts easy to understand. Highly recommend!'
    },
    {
      name: 'David Kim',
      role: 'Digital Marketing Manager',
      avatar: '/images/avatar3.jpg',
      rating: 5,
      text: 'As a busy professional, the flexible learning schedule and mobile app made it possible for me to upskill while working full-time. The ROI has been amazing!'
    }
  ];

  return (
    <Box sx={{ py: 10, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            What Our Students Say
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}
          >
            Join thousands of successful learners who have transformed their careers
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  p: 3,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main'
                  }}
                >
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </Avatar>

                <Rating
                  value={testimonial.rating}
                  readOnly
                  sx={{ mb: 2 }}
                />

                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    fontStyle: 'italic',
                    lineHeight: 1.7,
                    color: 'text.secondary'
                  }}
                >
                  "{testimonial.text}"
                </Typography>

                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {testimonial.name}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary' }}
                >
                  {testimonial.role}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// Statistics Section Component
const StatisticsSection: React.FC = () => {
  const stats = [
    { number: '50,000+', label: 'Active Students', icon: <People /> },
    { number: '1,200+', label: 'Expert Instructors', icon: <School /> },
    { number: '5,000+', label: 'Courses Available', icon: <Quiz /> },
    { number: '98%', label: 'Success Rate', icon: <EmojiEvents /> }
  ];

  return (
    <Box
      sx={{
        py: 8,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  {React.cloneElement(stat.icon, { sx: { fontSize: 50, color: '#FFD700' } })}
                </Box>
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 700, mb: 1, color: '#FFD700' }}
                >
                  {stat.number}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// Call to Action Section Component
const CTASection: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ py: 10, bgcolor: 'grey.50' }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}
          >
            Ready to Start Your Learning Journey?
          </Typography>

          <Typography
            variant="h6"
            sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}
          >
            Join millions of learners worldwide and unlock your potential with our comprehensive courses, expert instructors, and cutting-edge technology.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(isAuthenticated ? '/' : '/register')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {isAuthenticated ? 'Continue Learning' : 'Get Started Free'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/courses')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Browse Courses
            </Button>
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              <Typography variant="body2">Free 7-day trial</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              <Typography variant="body2">No credit card required</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              <Typography variant="body2">Cancel anytime</Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

// Main HomePage Component
const HomePage: React.FC = () => {
  return (
    <Box>
      <HeroSection />
      <FeaturesSection />
      <FeaturedCoursesSection />
      <StatisticsSection />
      <TestimonialsSection />
      <CTASection />
    </Box>
  );
};

export default HomePage;
