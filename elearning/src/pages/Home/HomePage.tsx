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
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  CheckCircle,
  ExpandMore,
  HelpOutline,
  QuestionAnswer,
  Email
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from 'react-query';
import { courseService } from '../../services/courseService';
import FloatingContact from '../../components/FloatingContact';

// Modern Hero Section Component
const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white',
        py: { xs: 6, md: 10 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Modern Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
          `,
          opacity: 0.6
        }}
      />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              variant="h1"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '4rem' },
                lineHeight: 1.1,
                mb: 3,
                background: 'linear-gradient(45deg, #ffffff, #e3f2fd)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Learn Without
              <Box component="span" sx={{ 
                color: '#64b5f6', 
                display: 'block',
                background: 'linear-gradient(45deg, #64b5f6, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Limits
              </Box>
            </Typography>
            
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                opacity: 0.9,
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#e3f2fd'
              }}
            >
              Master new skills with world-class courses, expert instructors, and cutting-edge technology. Start your journey today.
            </Typography>
            
            {/* Trust Indicators */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ color: '#e3f2fd', mb: 2, opacity: 0.8 }}>
                Trusted by leading companies worldwide
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                {['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix'].map((company, index) => (
                  <Box
                    key={index}
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                      {company}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                sx={{
                  bgcolor: '#1976d2',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: '#1565c0',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isAuthenticated ? 'Continue Learning' : 'Start Learning Free'}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<PlayArrow />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#64b5f6',
                    color: '#64b5f6',
                    bgcolor: 'rgba(100, 181, 246, 0.1)'
                  }
                }}
              >
                Watch Demo
              </Button>
            </Box>
            
            {/* Enhanced Stats */}
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#64b5f6' }}>
                  50K+
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Active Learners
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#64b5f6' }}>
                  3,000+
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Courses
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#64b5f6' }}>
                  4.8★
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Average Rating
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
              {/* Modern Floating Elements */}
              <Box
                sx={{
                  position: 'relative',
                  height: 400,
                  '& .floating-element': {
                    position: 'absolute',
                    animation: 'float 6s ease-in-out infinite',
                    '@keyframes float': {
                      '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                      '50%': { transform: 'translateY(-20px) rotate(5deg)' }
                    }
                  }
                }}
              >
                <Card
                  className="floating-element"
                  sx={{
                    top: 20,
                    left: 20,
                    width: 180,
                    animationDelay: '0s',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <School sx={{ fontSize: 32, color: '#1976d2', mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                      AI-Powered Learning
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card
                  className="floating-element"
                  sx={{
                    top: 120,
                    right: 40,
                    width: 160,
                    animationDelay: '2s',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <VideoCall sx={{ fontSize: 32, color: '#9c27b0', mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                      Live Sessions
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card
                  className="floating-element"
                  sx={{
                    bottom: 40,
                    left: 60,
                    width: 170,
                    animationDelay: '4s',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <EmojiEvents sx={{ fontSize: 32, color: '#f57c00', mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                      Certificates
                    </Typography>
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

// Categories Section Component
const CategoriesSection: React.FC = () => {
  const navigate = useNavigate();
  
  const categories = [
    { name: 'Computer Science', icon: '💻', color: '#1976d2', count: '1,200+ courses' },
    { name: 'Business & Management', icon: '📊', color: '#388e3c', count: '800+ courses' },
    { name: 'Data Science', icon: '📈', color: '#f57c00', count: '600+ courses' },
    { name: 'Design & Creative', icon: '🎨', color: '#9c27b0', count: '500+ courses' },
    { name: 'Languages', icon: '🌍', color: '#d32f2f', count: '400+ courses' },
    { name: 'Health & Medicine', icon: '🏥', color: '#00796b', count: '300+ courses' },
    { name: 'Engineering', icon: '⚙️', color: '#5d4037', count: '700+ courses' },
    { name: 'Mathematics', icon: '🔢', color: '#303f9f', count: '350+ courses' }
  ];

  return (
    <Box sx={{ py: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700, color: 'text.primary' }}
          >
            Explore by Category
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}
          >
            Discover courses across different fields and find what interests you most
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {categories.map((category, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 12px 40px ${category.color}20`,
                    borderColor: category.color
                  }
                }}
                onClick={() => navigate(`/courses?category=${encodeURIComponent(category.name)}`)}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Typography
                    variant="h2"
                    sx={{ mb: 2, fontSize: '3rem' }}
                  >
                    {category.icon}
                  </Typography>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: category.color,
                      mb: 1
                    }}
                  >
                    {category.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                  >
                    {category.count}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
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
            View All Categories
          </Button>
        </Box>
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
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #1976d2, #42a5f5)'
    },
    {
      icon: <VideoCall sx={{ fontSize: 50 }} />,
      title: 'Live Interactive Sessions',
      description: 'Join real-time classes with expert instructors and collaborate with fellow students worldwide.',
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #9c27b0, #ba68c8)'
    },
    {
      icon: <Quiz sx={{ fontSize: 50 }} />,
      title: 'Smart Assessments',
      description: 'Adaptive quizzes and exams that adjust to your learning pace and provide instant feedback.',
      color: '#f57c00',
      gradient: 'linear-gradient(135deg, #f57c00, #ffb74d)'
    },
    {
      icon: <Security sx={{ fontSize: 50 }} />,
      title: 'Secure Proctoring',
      description: 'Advanced AI proctoring ensures exam integrity while maintaining a comfortable testing environment.',
      color: '#388e3c',
      gradient: 'linear-gradient(135deg, #388e3c, #66bb6a)'
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 50 }} />,
      title: 'Gamified Learning',
      description: 'Earn badges, points, and certificates as you progress through your learning milestones.',
      color: '#d32f2f',
      gradient: 'linear-gradient(135deg, #d32f2f, #ef5350)'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 50 }} />,
      title: 'Progress Analytics',
      description: 'Detailed insights into your learning progress with actionable recommendations for improvement.',
      color: '#7b1fa2',
      gradient: 'linear-gradient(135deg, #7b1fa2, #ab47bc)'
    }
  ];

  return (
    <Box sx={{ py: 12, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 800, 
              color: 'text.primary',
              fontSize: { xs: '2rem', md: '3rem' },
              background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Why Choose Excellence Hub?
          </Typography>
          <Typography
            variant="h5"
            sx={{ 
              color: 'text.secondary', 
              maxWidth: 700, 
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6
            }}
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
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-12px) scale(1.02)',
                    boxShadow: `0 20px 60px ${feature.color}30`,
                    '& .feature-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                    '& .feature-gradient': {
                      opacity: 1,
                    }
                  },
                  border: 'none',
                  borderRadius: 3
                }}
              >
                {/* Gradient Overlay */}
                <Box
                  className="feature-gradient"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: feature.gradient,
                    opacity: 0,
                    transition: 'opacity 0.4s ease'
                  }}
                />
                
                <CardContent sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Box
                    className="feature-icon"
                    sx={{
                      color: feature.color,
                      mb: 3,
                      display: 'flex',
                      justifyContent: 'center',
                      transition: 'all 0.4s ease'
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    sx={{ 
                      fontWeight: 700,
                      color: 'text.primary',
                      mb: 2
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ 
                      color: 'text.secondary', 
                      lineHeight: 1.7,
                      fontSize: '1rem'
                    }}
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
  const { isAuthenticated, user } = useAuth();

  // Fetch courses based on authentication status
  const { data: coursesData, isLoading, error } = useQuery(
    ['featuredCourses', isAuthenticated, user?.role],
    () => {
      if (isAuthenticated && user?.role === 'student') {
        // Show enrolled courses for authenticated students
        return courseService.getEnrolledCourses({ 
          limit: 6, 
          sortBy: 'enrollmentDate', 
          sortOrder: 'desc' 
        });
      } else {
        // Show public courses for non-authenticated users or non-students
        return courseService.getPublicCourses({ 
          limit: 6, 
          sortBy: 'enrollmentCount', 
          sortOrder: 'desc' 
        });
      }
    },
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
              {isAuthenticated && user?.role === 'student' ? 'My Enrolled Courses' : 'Featured Courses'}
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto', mb: 4 }}
            >
              {isAuthenticated && user?.role === 'student' 
                ? 'Continue your learning journey with your enrolled courses'
                : 'Discover our most popular courses taught by industry experts'
              }
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
                          {course.instructor && course.instructor.firstName && course.instructor.lastName 
                            ? `${course.instructor.firstName[0]}${course.instructor.lastName[0]}`
                            : 'IN'
                          }
                        </Avatar>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {course.instructor && course.instructor.firstName 
                            ? `${course.instructor.firstName} ${course.instructor.lastName}`
                            : 'Unknown Instructor'
                          }
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Rating value={course.rating || 0} precision={0.1} size="small" readOnly />
                        <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                          {course.rating ? course.rating.toFixed(1) : 'New'} ({course.enrollmentCount || 0} students)
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          {course.price > 0 ? (
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, color: 'primary.main' }}
                            >
                              ${course.price}
                            </Typography>
                          ) : (
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, color: 'success.main' }}
                            >
                              FREE
                            </Typography>
                          )}
                        </Box>
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
    { number: '50,000+', label: 'Active Students', icon: <People />, color: '#64b5f6' },
    { number: '1,200+', label: 'Expert Instructors', icon: <School />, color: '#81c784' },
    { number: '5,000+', label: 'Courses Available', icon: <Quiz />, color: '#ffb74d' },
    { number: '98%', label: 'Success Rate', icon: <EmojiEvents />, color: '#f06292' }
  ];

  return (
    <Box
      sx={{
        py: 12,
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white',
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
          background: `
            radial-gradient(circle at 20% 80%, rgba(100, 181, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 183, 77, 0.1) 0%, transparent 50%)
          `,
          opacity: 0.6
        }}
      />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 800, 
              color: 'white',
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Join Our Global Community
          </Typography>
          <Typography
            variant="h5"
            sx={{ 
              color: '#e3f2fd', 
              maxWidth: 600, 
              mx: 'auto',
              opacity: 0.9
            }}
          >
            Be part of a thriving ecosystem of learners and educators
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box 
                sx={{ 
                  textAlign: 'center',
                  p: 3,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }
                }}
              >
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {React.cloneElement(stat.icon, { 
                      sx: { 
                        fontSize: 40, 
                        color: stat.color 
                      } 
                    })}
                  </Box>
                </Box>
                <Typography
                  variant="h2"
                  sx={{ 
                    fontWeight: 800, 
                    mb: 1, 
                    color: stat.color,
                    fontSize: { xs: '2rem', md: '3rem' }
                  }}
                >
                  {stat.number}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    opacity: 0.9,
                    fontWeight: 500
                  }}
                >
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
    <Box 
      sx={{ 
        py: 12, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
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
          background: `
            radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
          opacity: 0.8
        }}
      />
      
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 800, 
              color: 'white', 
              mb: 3,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Ready to Transform Your Future?
          </Typography>

          <Typography
            variant="h5"
            sx={{ 
              color: '#e3f2fd', 
              mb: 6, 
              lineHeight: 1.6,
              maxWidth: 600,
              mx: 'auto',
              opacity: 0.9
            }}
          >
            Join millions of learners worldwide and unlock your potential with our comprehensive courses, expert instructors, and cutting-edge technology.
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mb: 6 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 700,
                bgcolor: '#FFD700',
                color: '#000',
                borderRadius: 3,
                '&:hover': {
                  bgcolor: '#FFC107',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(255, 215, 0, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {isAuthenticated ? 'Continue Learning' : 'Start Learning Free'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/courses')}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'white',
                borderRadius: 3,
                '&:hover': {
                  borderWidth: 2,
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(255, 255, 255, 0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Browse Courses
            </Button>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 4, 
            flexWrap: 'wrap',
            p: 4,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: '#4caf50' }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>Free 7-day trial</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: '#4caf50' }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>No credit card required</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: '#4caf50' }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>Cancel anytime</Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

// Modern FAQ Section Component
const FAQSection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const faqs = [
    {
      question: "How do I get started with online learning?",
      answer: "Getting started is easy! Simply create an account, browse our course catalog, and enroll in any course that interests you. You'll have immediate access to all course materials and can learn at your own pace."
    },
    {
      question: "Are the courses self-paced or scheduled?",
      answer: "Most of our courses are self-paced, allowing you to learn at your convenience. However, we also offer live sessions and scheduled courses for interactive learning experiences."
    },
    {
      question: "What types of certificates do you offer?",
      answer: "We offer completion certificates for all courses, professional certificates for specialized programs, and industry-recognized certifications that can boost your career prospects."
    },
    {
      question: "Can I access courses on mobile devices?",
      answer: "Yes! Our platform is fully responsive and optimized for mobile devices. You can access all course content, participate in discussions, and take assessments from your smartphone or tablet."
    },
    {
      question: "What if I need help during my course?",
      answer: "We provide multiple support channels including 24/7 chat support, discussion forums, instructor office hours, and comprehensive help documentation to ensure your learning success."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all courses. If you're not satisfied with your learning experience, you can request a full refund within 30 days of enrollment."
    }
  ];

  return (
    <Box sx={{ py: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <HelpOutline sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Frequently Asked Questions
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{ 
              color: 'text.secondary', 
              maxWidth: 600, 
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.1rem' }
            }}
          >
            Find answers to common questions about our platform, courses, and learning experience
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8} sx={{ mx: 'auto' }}>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  '&:before': {
                    display: 'none'
                  },
                  '&.Mui-expanded': {
                    margin: '0 0 16px 0',
                    boxShadow: '0 8px 32px rgba(25, 118, 210, 0.15)',
                    border: '1px solid rgba(25, 118, 210, 0.2)'
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />}
                  sx={{
                    py: 2,
                    px: 3,
                    '&.Mui-expanded': {
                      minHeight: 'auto',
                      backgroundColor: 'rgba(25, 118, 210, 0.02)'
                    },
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0',
                      '&.Mui-expanded': {
                        margin: '12px 0'
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <QuestionAnswer sx={{ color: 'primary.main', mr: 2, fontSize: 24 }} />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: { xs: '1rem', md: '1.1rem' }
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 3,
                    pb: 3,
                    pt: 0
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.7,
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      pl: 4
                    }}
                  >
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="h6" sx={{ mb: 3, color: 'text.primary', fontWeight: 600 }}>
            Still have questions?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Email />}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 3,
                borderColor: 'primary.main',
                color: 'primary.main',
                fontWeight: 600,
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Contact Support
            </Button>
            <Button
              variant="contained"
              startIcon={<HelpOutline />}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #7b1fa2 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Help Center
            </Button>
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
      <CategoriesSection />
      <FeaturesSection />
      <FeaturedCoursesSection />
      <StatisticsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <FloatingContact />
    </Box>
  );
};

export default HomePage;
