import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Fade,
} from '@mui/material';
import {
  Code,
  Analytics,
  Business,
  AccountBalance,
  Psychology,
  School,
  Support,
  TrendingUp,
  Work,
  BuildRounded,
  LocalLibraryRounded,
  GroupsRounded,
  AutoAwesome,
  DesignServicesRounded,
  Language,
} from '@mui/icons-material';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { useThemeContext } from '../contexts/ThemeContext';

const ServicesSection: React.FC = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });
  const { isDarkMode } = useThemeContext();

  const [selectedCategory, setSelectedCategory] = useState(0);

  const categories = [
    {
      title: "Student Academic Coaching",
      icon: <LocalLibraryRounded />,
      color: "#2196f3",
      programs: [
        "High School Academic Support",
        "University Exam Preparation",
        "Study Skills & Time Management",
        "Research & Writing Assistance",
        "Mathematics & Science Tutoring",
        "Language Arts & Literature",
        "Test-Taking Strategies",
        "Academic Goal Setting & Planning"
      ]
    },
    {
      title: "Career Transition Coaching",
      icon: <Work />,
      color: "#ff5722",
      programs: [
        "Career Change Strategy",
        "Job Search & Interview Preparation",
        "Resume & LinkedIn Optimization",
        "Networking & Professional Branding",
        "Industry Transition Planning",
        "Skills Assessment & Development",
        "Salary Negotiation Coaching",
        "Professional Portfolio Building"
      ]
    },
    {
      title: "Technology & Digital Solutions",
      icon: <Code />,
      color: "#3f51b5",
      programs: [
        "Software Development & Programming",
        "Web & Mobile App Development", 
        "Cloud Computing & DevOps",
        "Cybersecurity & Data Protection",
        "Digital Marketing & E-commerce",
        "UI/UX Design & Digital Graphics",
        "Digital Literacy & Computer Skills",
        "IT Support & Network Administration"
      ]
    },
    {
      title: "Data & Analytics",
      icon: <Analytics />,
      color: "#ff6b6b", 
      programs: [
        "Data Analytics & Visualization",
        "Machine Learning & AI",
        "Business Intelligence",
        "Statistical Analysis",
        "Python & R Programming",
        "SQL & Database Management",
        "Data Science Bootcamp",
        "Big Data Technologies"
      ]
    },
    {
      title: "Business & Entrepreneurship",
      icon: <Business />,
      color: "#4caf50",
      programs: [
        "Business Development & Strategy",
        "Entrepreneurship & Startup",
        "Digital Marketing & Social Media",
        "Sales & Customer Relations",
        "Supply Chain & Operations",
        "E-commerce & Online Business",
        "Business Plan Development",
        "Market Research & Analysis"
      ]
    },
    {
      title: "Finance & Accounting",
      icon: <AccountBalance />,
      color: "#ff9800",
      programs: [
        "Financial Accounting & Reporting",
        "Tax Preparation & Planning",
        "Audit & Compliance",
        "Financial Management & Planning",
        "Bookkeeping & Payroll",
        "Investment & Portfolio Management",
        "Corporate Finance",
        "Forensic Accounting"
      ]
    },
    {
      title: "Project Management",
      icon: <TrendingUp />,
      color: "#9c27b0",
      programs: [
        "PMP Certification Preparation",
        "PRINCE2 Methodology",
        "Agile & Scrum Master",
        "Risk Management",
        "Quality Management",
        "Construction Project Management",
        "IT Project Management",
        "Leadership in Project Management"
      ]
    },
    {
      title: "Leadership & Executive Coaching",
      icon: <Psychology />,
      color: "#607d8b",
      programs: [
        "Executive Leadership Development",
        "Strategic Thinking & Planning",
        "Team Management & Motivation",
        "Change Management",
        "Emotional Intelligence",
        "Communication & Presentation Skills",
        "Conflict Resolution",
        "Performance Management"
      ]
    },
    {
      title: "Professional Certifications",
      icon: <School />,
      color: "#795548",
      programs: [
        "CPA (Certified Public Accountant)",
        "PMP (Project Management Professional)",
        "PRINCE2 Certification",
        "Scrum Master Certification",
        "Digital Marketing Certification",
        "HR Professional Certification",
        "IT Certification Programs",
        "Industry-Specific Certifications"
      ]
    },
    {
      title: "HR & Legal Compliance",
      icon: <Support />,
      color: "#009688",
      programs: [
        "Human Resources Management",
        "Employment Law & Compliance",
        "Recruitment & Talent Management",
        "Employee Relations",
        "Performance & Compensation",
        "Workplace Safety & Health",
        "Legal Documentation",
        "HR Analytics & Metrics"
      ]
    },
    {
      title: "Communication & Language",
      icon: <Language />,
      color: "#8bc34a",
      programs: [
        "English Language Proficiency",
        "Business Communication",
        "Public Speaking & Presentation",
        "Professional Writing Skills",
        "Technical Writing",
        "Cross-Cultural Communication",
        "Interpersonal Communication",
        "Media & Journalism"
      ]
    },
    {
      title: "Creative & Design",
      icon: <DesignServicesRounded />,
      color: "#e91e63",
      programs: [
        "Graphic Design & Branding",
        "Digital Art & Illustration",
        "Video Production & Editing",
        "Photography & Visual Arts",
        "Creative Writing & Content",
        "Animation & Motion Graphics",
        "Interior & Architectural Design",
        "Fashion & Product Design"
      ]
    },
    {
      title: "Health & Wellness Coaching",
      icon: <AutoAwesome />,
      color: "#cddc39",
      programs: [
        "Life Coaching & Personal Development",
        "Wellness & Nutrition Guidance",
        "Stress Management & Mental Health",
        "Fitness & Exercise Coaching",
        "Work-Life Balance",
        "Mindfulness & Meditation",
        "Habit Formation & Goal Setting",
        "Emotional Resilience Building"
      ]
    },
    {
      title: "Specialized Industries",
      icon: <BuildRounded />,
      color: "#00bcd4",
      programs: [
        "Healthcare & Medical Training",
        "Agriculture & Food Security",
        "Environmental & Sustainability",
        "Real Estate & Property Management",
        "Manufacturing & Production",
        "Logistics & Supply Chain",
        "Tourism & Hospitality",
        "Non-Profit & Social Impact"
      ]
    }
  ];

  const selectedCategoryData = categories[selectedCategory];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <Box 
      ref={ref}
      id="services"
      sx={{ 
        py: { xs: 8, md: 12 },
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDarkMode ? `
            radial-gradient(circle at 20% 80%, rgba(74, 222, 128, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)
          ` : `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Fade in={inView} timeout={800}>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: isDarkMode 
                  ? 'linear-gradient(45deg, #4ade80, #ff8a80)'
                  : 'linear-gradient(45deg, #3f51b5, #ff6b6b)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' }
              }}
            >
              Our Comprehensive Programs
            </Typography>
            <Typography
              variant="h5"
              component="h3"
              sx={{
                fontWeight: 600,
                mb: 3,
                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#334155',
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem' }
              }}
            >
              Transform Your Career Across Multiple Industries
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.1rem' },
                color: '#64748b',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Excellence Coaching Hub offers comprehensive training and coaching programs across diverse fields. 
              With expert instructors, personalized coaching, live video sessions, study materials, and hands-on practice, 
              we prepare you for success in today's competitive job market.
            </Typography>
          </Box>
        </Fade>

        {/* Category Selection Tabs */}
        <Fade in={inView} timeout={1000}>
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h6"
              sx={{
                textAlign: 'center',
                mb: 3,
                color: '#1e293b',
                fontWeight: 700
              }}
            >
              Choose Your Field of Interest
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1.5, 
              justifyContent: 'center',
              mb: 4
            }}>
              {categories.map((category, index) => (
                <Chip
                  key={index}
                  icon={category.icon}
                  label={category.title}
                  onClick={() => setSelectedCategory(index)}
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    fontWeight: 600,
                    px: { xs: 1, sm: 2 },
                    py: { xs: 2, sm: 3 },
                    height: { xs: 36, sm: 48 },
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    bgcolor: selectedCategory === index ? category.color : 'white',
                    color: selectedCategory === index ? 'white' : '#475569',
                    border: `2px solid ${selectedCategory === index ? category.color : '#e2e8f0'}`,
                    '&:hover': {
                      bgcolor: selectedCategory === index ? category.color : 'rgba(99, 102, 241, 0.1)',
                      borderColor: category.color,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${category.color}40`
                    },
                    '& .MuiChip-icon': {
                      color: selectedCategory === index ? 'white' : category.color,
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Fade>

        {/* Selected Category Programs */}
        <Fade in={inView} timeout={1200}>
          <motion.div
            key={selectedCategory}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                border: `2px solid ${selectedCategoryData.color}20`,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
                {/* Category Header */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 4,
                  flexDirection: { xs: 'column', sm: 'row' },
                  textAlign: { xs: 'center', sm: 'left' }
                }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: selectedCategoryData.color,
                      color: 'white',
                      mr: { xs: 0, sm: 3 },
                      mb: { xs: 2, sm: 0 },
                      display: 'flex',
                      fontSize: '2rem'
                    }}
                  >
                    {selectedCategoryData.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                        mb: 1
                      }}
                    >
                      {selectedCategoryData.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#64748b',
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        fontWeight: 500
                      }}
                    >
                      Specialized programs designed for career advancement
                    </Typography>
                  </Box>
                </Box>

                {/* Programs Grid */}
                <Grid container spacing={3}>
                  {selectedCategoryData.programs.map((program, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <motion.div variants={itemVariants}>
                        <Card
                          sx={{
                            height: '100%',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            border: `1px solid ${selectedCategoryData.color}20`,
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 12px 40px ${selectedCategoryData.color}30`,
                              borderColor: selectedCategoryData.color,
                            }
                          }}
                        >
                          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: selectedCategoryData.color,
                                  mr: 2,
                                  mt: 0.5,
                                  flexShrink: 0
                                }}
                              />
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  color: '#1e293b',
                                  fontSize: { xs: '1rem', md: '1.1rem' },
                                  lineHeight: 1.4,
                                  flex: 1
                                }}
                              >
                                {program}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mt: 'auto' }}>
                              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                <Chip 
                                  size="small" 
                                  label="Live Sessions" 
                                  sx={{ 
                                    bgcolor: `${selectedCategoryData.color}15`,
                                    color: selectedCategoryData.color,
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }} 
                                />
                                <Chip 
                                  size="small" 
                                  label="Certification" 
                                  sx={{ 
                                    bgcolor: `${selectedCategoryData.color}15`,
                                    color: selectedCategoryData.color,
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }} 
                                />
                              </Stack>
                              
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#64748b',
                                  fontSize: '0.9rem',
                                  lineHeight: 1.5
                                }}
                              >
                                Expert coaching with personalized learning path, practical assignments, and career guidance.
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {/* Call to Action */}
                <Box sx={{ 
                  textAlign: 'center', 
                  mt: 6, 
                  p: 4, 
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${selectedCategoryData.color}15 0%, ${selectedCategoryData.color}05 100%)`,
                  border: `1px solid ${selectedCategoryData.color}30`
                }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: '#1e293b',
                      mb: 2,
                      fontSize: { xs: '1.3rem', md: '1.5rem' }
                    }}
                  >
                    Ready to Start Your Journey?
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#64748b',
                      mb: 3,
                      fontSize: { xs: '1rem', md: '1.1rem' }
                    }}
                  >
                    Join thousands of professionals who have transformed their careers with our expert coaching and comprehensive training programs.
                  </Typography>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Chip
                      icon={<AutoAwesome />}
                      label="Personalized Coaching"
                      sx={{
                        bgcolor: 'white',
                        color: selectedCategoryData.color,
                        fontWeight: 600,
                        px: 2,
                        py: 3,
                        height: 40
                      }}
                    />
                    <Chip
                      icon={<LocalLibraryRounded />}
                      label="Study Materials"
                      sx={{
                        bgcolor: 'white',
                        color: selectedCategoryData.color,
                        fontWeight: 600,
                        px: 2,
                        py: 3,
                        height: 40
                      }}
                    />
                    <Chip
                      icon={<GroupsRounded />}
                      label="Live Video Sessions"
                      sx={{
                        bgcolor: 'white',
                        color: selectedCategoryData.color,
                        fontWeight: 600,
                        px: 2,
                        py: 3,
                        height: 40
                      }}
                    />
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Fade>
      </Container>
    </Box>
  );
};

export default ServicesSection;