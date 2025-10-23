import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Rating,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  School,
  People,
  AccessTime,
  ArrowForward,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeContext } from '../contexts/ThemeContext';
import { courseService, Course } from '../services/courseService';

const TrendingCoursesSection: React.FC = () => {
  const { isDarkMode } = useThemeContext();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch trending courses from backend
  useEffect(() => {
    const fetchTrendingCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const trendingCourses = await courseService.getTrendingCourses(6);
        setCourses(trendingCourses);
      } catch (err) {
        console.error('Error fetching trending courses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trending courses');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingCourses();
  }, []);

  const handleCourseClick = (courseId: string) => {
    // Redirect to elearning platform course enrollment page
    window.open(`https://elearning.excellencecoachinghub.com/course/${courseId}/enroll`, '_blank');
  };

  const handleViewAllCourses = () => {
    window.open('https://elearning.excellencecoachinghub.com/courses', '_blank');
  };

  // Helper function to format duration
  const formatDuration = (duration: number): string => {
    if (duration < 7) {
      return `${duration} day${duration > 1 ? 's' : ''}`;
    } else if (duration < 30) {
      const weeks = Math.round(duration / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
      const months = Math.round(duration / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  };

  // Helper function to format price
  const formatPrice = (price: number): string => {
    return `$${price}`;
  };

  // Helper function to get instructor initials
  const getInstructorInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Box
      id="trending-courses"
      sx={{
        py: { xs: 6, md: 8 },
        bgcolor: isDarkMode ? 'rgba(15, 15, 35, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        position: 'relative',
        overflow: 'hidden',
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
          background: isDarkMode 
            ? 'radial-gradient(circle at 20% 80%, rgba(74, 222, 128, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(74, 222, 128, 0.03) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.03) 0%, transparent 50%)',
          zIndex: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <TrendingUp sx={{ 
                fontSize: 32, 
                color: 'primary.main', 
                mr: 1 
              }} />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background: isDarkMode 
                    ? 'linear-gradient(45deg, #4ade80, #22c55e)'
                    : 'linear-gradient(45deg, #22c55e, #16a34a)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.75rem', md: '2.125rem' }
                }}
              >
                Trending Courses
              </Typography>
            </Box>
            
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                mb: 3,
                maxWidth: '600px',
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}
            >
              Discover our most popular courses and start your learning journey today
            </Typography>

            <Button
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={handleViewAllCourses}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                px: 3,
                py: 1,
                borderRadius: '25px',
                fontWeight: 600,
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.main',
                  color: 'white',
                }
              }}
            >
              View All Courses
            </Button>
          </motion.div>
        </Box>

        {/* Courses Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: 'primary.main' }} />
          </Box>
        ) : error ? (
          <Box sx={{ py: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              sx={{ borderRadius: '20px' }}
            >
              Try Again
            </Button>
          </Box>
        ) : courses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No trending courses available at the moment
            </Typography>
            <Button
              variant="contained"
              onClick={handleViewAllCourses}
              sx={{ borderRadius: '20px' }}
            >
              Browse All Courses
            </Button>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 3, md: 4 }}>
            {courses.map((course, index) => (
              <Grid item xs={12} sm={6} lg={4} key={course._id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: isDarkMode 
                        ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                        : '0 8px 32px rgba(0, 0, 0, 0.08)',
                      border: isDarkMode 
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: isDarkMode 
                          ? '0 16px 48px rgba(0, 0, 0, 0.4)'
                          : '0 16px 48px rgba(0, 0, 0, 0.12)',
                      },
                    }}
                    onClick={() => handleCourseClick(course._id)}
                  >
                    {/* Course Image */}
                    <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(135deg, ${isDarkMode ? '#1a1a2e' : '#f8f9fa'} 0%, ${isDarkMode ? '#16213e' : '#e9ecef'} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '4rem',
                          color: isDarkMode ? '#4ade80' : '#22c55e',
                        }}
                      >
                        <School />
                      </Box>
                      
                      {/* Category Badge */}
                      <Chip
                        label={course.category}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          bgcolor: 'primary.main',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />

                      {/* Level Badge */}
                      <Chip
                        label={course.level}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                          color: isDarkMode ? 'white' : 'text.primary',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                      {/* Course Title */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 1,
                          fontSize: '1.1rem',
                          lineHeight: 1.3,
                          color: 'text.primary',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {course.title}
                      </Typography>

                      {/* Instructor */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            mr: 1,
                            bgcolor: 'primary.main',
                            fontSize: '0.75rem',
                          }}
                        >
                          {getInstructorInitials(course.instructor.firstName, course.instructor.lastName)}
                        </Avatar>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                          {course.instructor.firstName} {course.instructor.lastName}
                        </Typography>
                      </Box>

                      {/* Course Description */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          fontSize: '0.85rem',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {course.description}
                      </Typography>

                      {/* Rating and Students */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Rating
                          value={course.rating || 0}
                          precision={0.1}
                          size="small"
                          readOnly
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 2, fontSize: '0.8rem' }}>
                          {course.rating?.toFixed(1) || 'N/A'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          <People sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            {course.enrollmentCount || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTime sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            {formatDuration(course.duration)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Tags */}
                      <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                        {course.tags?.slice(0, 3).map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            label={tag}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              bgcolor: isDarkMode ? 'rgba(74, 222, 128, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                              color: isDarkMode ? '#4ade80' : '#22c55e',
                              fontWeight: 500,
                            }}
                          />
                        ))}
                      </Stack>

                      {/* Price and CTA */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: 'primary.main',
                              fontSize: '1.1rem',
                            }}
                          >
                            {formatPrice(course.price)}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleCourseClick(course._id);
                          }}
                          sx={{
                            borderRadius: '20px',
                            px: 2,
                            py: 0.5,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textTransform: 'none',
                          }}
                        >
                          Enroll Now
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default TrendingCoursesSection;
