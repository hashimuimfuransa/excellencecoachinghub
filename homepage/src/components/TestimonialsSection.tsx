import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  IconButton,
  Chip,
  Button,
} from '@mui/material';
import {
  FormatQuote,
  ArrowBackIos,
  ArrowForwardIos,
  Verified,
  Work,
  School,
} from '@mui/icons-material';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';

const TestimonialsSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { isDarkMode } = useThemeContext();

  const testimonials = [
    {
      name: 'Jean Claude Uwimana',
      role: 'Senior Software Engineer',
      company: 'Rwanda ICT Chamber',
      location: 'Kigali, Rwanda',
      image: '/api/placeholder/80/80',
      rating: 5,
      quote: 'Excellence Coaching Hub transformed my career completely. The expert-led live video coaching sessions helped me transition from teaching to software development in just 6 months. The practical projects and mentorship prepared me to contribute to Rwanda\'s digital transformation.',
      achievement: 'Career transformation',
      course: 'Full Stack Development',
      salary: '75% salary increase',
    },
    {
      name: 'Marie Claire Mukamana',
      role: 'Data Science Lead',
      company: 'Bank of Kigali',
      location: 'Kigali, Rwanda',
      image: '/api/placeholder/80/80',
      rating: 5,
      quote: 'The comprehensive data science program at ECH opened doors I never imagined. From learning Python to deploying machine learning models, every module was designed with real-world applications. Now I lead a team of 8 data scientists.',
      achievement: 'Team leadership role',
      course: 'Data Science & Analytics Bootcamp',
      salary: '80% salary increase',
    },
    {
      name: 'Eric Nshimiyimana',
      role: 'Digital Marketing Director',
      company: 'Positive Production',
      location: 'Kigali, Rwanda',
      image: '/api/placeholder/80/80',
      rating: 5,
      quote: 'ECH\'s digital marketing mastery program gave me the skills to drive Rwanda\'s creative industry forward. The blockchain-verified certificates and portfolio projects made me stand out in the competitive marketing landscape.',
      achievement: 'Industry recognition',
      course: 'Digital Marketing Mastery',
      salary: '65% salary increase',
    },
    {
      name: 'Grace Uwimana',
      role: 'Project Manager',
      company: 'Ministry of ICT & Innovation',
      location: 'Kigali, Rwanda',
      image: '/api/placeholder/80/80',
      rating: 5,
      quote: 'The project management certification from ECH equipped me with international best practices while understanding local context. I now manage strategic ICT projects that contribute to Rwanda\'s Vision 2050 goals.',
      achievement: 'Government sector leadership',
      course: 'Project Management Professional',
      salary: '70% salary increase',
    },
    {
      name: 'Patrick Hakizimana',
      role: 'UX/UI Designer',
      company: 'HeHe Limited',
      location: 'Kigali, Rwanda',
      image: '/api/placeholder/80/80',
      rating: 5,
      quote: 'Starting with zero design experience, ECH\'s structured approach and hands-on projects helped me master user experience design. The portfolio I built landed me a role at Rwanda\'s leading fintech company.',
      achievement: 'Fintech industry entry',
      course: 'UX/UI Design Bootcamp',
      salary: 'First tech position',
    },
    {
      name: 'Diane Umutoni',
      role: 'Cybersecurity Analyst',
      company: 'Rwanda National Police',
      location: 'Kigali, Rwanda',
      image: '/api/placeholder/80/80',
      rating: 5,
      quote: 'ECH\'s cybersecurity program prepared me to protect Rwanda\'s digital infrastructure. The practical labs and real-world scenarios gave me confidence to handle complex security challenges in government systems.',
      achievement: 'National security contribution',
      course: 'Cybersecurity Professional',
      salary: '85% salary increase',
    },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <Box
      id="testimonials"
      ref={ref}
      sx={{
        py: { xs: 6, sm: 8, md: 12 },
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)'
          : 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: 'auto', md: '100vh' },
      }}
    >
      {/* Animated background elements */}
      <Box
        component={motion.div}
        sx={{
          position: 'absolute',
          top: '15%',
          right: '5%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: isDarkMode 
            ? 'rgba(74, 222, 128, 0.1)'
            : 'rgba(63, 81, 181, 0.05)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <Box
        component={motion.div}
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: isDarkMode 
            ? 'rgba(34, 197, 94, 0.08)'
            : 'rgba(255, 107, 107, 0.05)',
          filter: 'blur(30px)',
          zIndex: 0,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 0 } }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.75rem', lg: '3rem' },
                  background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: { xs: '60px', md: '80px' },
                    height: '4px',
                    background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                    borderRadius: '2px',
                  }
                }}
              >
                Success Stories from Africa
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  maxWidth: { xs: '100%', sm: '700px', md: '800px' },
                  mx: 'auto',
                  lineHeight: 1.6,
                  fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
                  px: { xs: 1, sm: 2, md: 0 },
                }}
              >
                Hear from our graduates who transformed their careers with Excellence Coaching Hub across Africa
              </Typography>
            </Box>
          </motion.div>

          {/* Featured Testimonial */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 8 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card
                    sx={{
                      maxWidth: 900,
                      mx: 'auto',
                      p: 4,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Background decoration */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 150,
                        height: 150,
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                      }}
                    />
                    
                    <FormatQuote
                      sx={{
                        position: 'absolute',
                        top: 20,
                        left: 20,
                        fontSize: 60,
                        opacity: 0.2,
                      }}
                    />

                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontStyle: 'italic',
                              lineHeight: 1.6,
                              mb: 3,
                              fontSize: { xs: '1.1rem', md: '1.3rem' },
                            }}
                          >
                            "{testimonials[currentTestimonial].quote}"
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                            <Chip
                              icon={<Verified />}
                              label={testimonials[currentTestimonial].achievement}
                              sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontWeight: 500,
                              }}
                            />
                            <Chip
                              icon={<School />}
                              label={testimonials[currentTestimonial].course}
                              sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontWeight: 500,
                              }}
                            />
                            <Chip
                              icon={<Work />}
                              label={testimonials[currentTestimonial].salary}
                              sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontWeight: 500,
                              }}
                            />
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                            <Avatar
                              src={testimonials[currentTestimonial].image}
                              sx={{
                                width: 80,
                                height: 80,
                                mx: { xs: 'auto', md: 0 },
                                mb: 2,
                                border: '3px solid rgba(255, 255, 255, 0.3)',
                              }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {testimonials[currentTestimonial].name}
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                              {testimonials[currentTestimonial].role}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                              {testimonials[currentTestimonial]?.company || 'Company'}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                              {testimonials[currentTestimonial].location}
                            </Typography>
                            <Rating
                              value={testimonials[currentTestimonial].rating}
                              readOnly
                              sx={{
                                mt: 2,
                                '& .MuiRating-iconFilled': {
                                  color: '#FFD700',
                                },
                              }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>

                    {/* Navigation */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 20,
                        right: 20,
                        display: 'flex',
                        gap: 1,
                      }}
                    >
                      <IconButton
                        onClick={prevTestimonial}
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                          },
                        }}
                      >
                        <ArrowBackIos />
                      </IconButton>
                      <IconButton
                        onClick={nextTestimonial}
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                          },
                        }}
                      >
                        <ArrowForwardIos />
                      </IconButton>
                    </Box>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </Box>
          </motion.div>

          {/* Testimonial Grid */}
          <motion.div variants={itemVariants}>
            <Grid container spacing={3}>
              {testimonials.slice(0, 3).map((testimonial, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div
                    whileHover={{
                      y: -5,
                      transition: { duration: 0.3 },
                    }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                      onClick={() => setCurrentTestimonial(index)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            src={testimonial.image}
                            sx={{ width: 50, height: 50, mr: 2 }}
                          />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {testimonial.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {testimonial.role}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Rating
                          value={testimonial.rating}
                          readOnly
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          "{testimonial.quote}"
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>

          {/* Stats Section */}
          <motion.div variants={itemVariants}>
            <Box
              sx={{
                mt: 10,
                p: { xs: 4, md: 6 },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: { xs: 3, md: 4 },
                color: 'white',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
              }}
            >
              {/* Animated background elements */}
              <Box
                component={motion.div}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  filter: 'blur(40px)',
                }}
              />
              
              <Box
                component={motion.div}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.05, 0.15, 0.05],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 2,
                }}
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 150,
                  height: 150,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  filter: 'blur(30px)',
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 2,
                    background: 'linear-gradient(45deg, #FFD700, #FFF)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  Join Rwanda's Success Stories
                </Typography>
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 6, 
                    opacity: 0.9,
                    fontWeight: 500,
                    maxWidth: '600px',
                    mx: 'auto',
                  }}
                >
                  Be part of the digital transformation shaping Rwanda's future
                </Typography>
                
                <Grid container spacing={4}>
                  {[
                    { number: '12,500+', label: 'Rwanda Graduates Trained', icon: '🎓' },
                    { number: '94%', label: 'Job Placement Success', icon: '💼' },
                    { number: '4.9/5', label: 'Student Satisfaction', icon: '⭐' },
                    { number: '75%', label: 'Average Salary Growth', icon: '📈' },
                  ].map((stat, index) => (
                    <Grid item xs={6} md={3} key={index}>
                      <motion.div
                        whileHover={{ 
                          scale: 1.05,
                          y: -5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <Box
                          sx={{
                            p: 3,
                            borderRadius: 3,
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.15)',
                              transform: 'translateY(-5px)',
                            },
                          }}
                        >
                          <Typography
                            sx={{ fontSize: '2rem', mb: 1, }}
                          >
                            {stat.icon}
                          </Typography>
                          <Typography
                            variant="h3"
                            sx={{ 
                              fontWeight: 800, 
                              mb: 1,
                              background: 'linear-gradient(45deg, #FFD700, #FFF)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}
                          >
                            {stat.number}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              opacity: 0.95,
                              fontWeight: 500,
                              textAlign: 'center',
                              lineHeight: 1.3,
                            }}
                          >
                            {stat.label}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {/* Call to Action */}
                <Box sx={{ mt: 6 }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        bgcolor: '#FFD700',
                        color: '#000',
                        fontWeight: 700,
                        py: 2,
                        px: 6,
                        borderRadius: '50px',
                        fontSize: '1.1rem',
                        boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)',
                        '&:hover': {
                          bgcolor: '#FFC107',
                          boxShadow: '0 12px 35px rgba(255, 215, 0, 0.5)',
                        },
                      }}
                      onClick={() => window.location.href = '/register'}
                    >
                      🚀 Start Your Success Story Today
                    </Button>
                  </motion.div>
                </Box>
              </Box>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

export default TestimonialsSection;