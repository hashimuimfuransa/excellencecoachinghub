import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Fade,
} from '@mui/material';
import {
  Code,
  Analytics,
  Business,
  AccountBalance,
  Engineering,
  Psychology,
  School,
  Support,
  Language,
  Work,
  FamilyRestroom,
  TrendingUp,
} from '@mui/icons-material';
import { useInView } from 'react-intersection-observer';

const ServicesSection: React.FC = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const [selectedService, setSelectedService] = useState(6); // Professional Qualification Coaching

  const services = [
    {
      title: "Tech and Digital Solutions",
      icon: <Code />,
      description: "Comprehensive technology training and digital transformation services",
      offerings: [
        "Digital Marketing",
        "Software Development",
        "Web & App Development",
        "Cloud Computing",
        "Data Analytics & Machine Learning",
        "Digital Literacy"
      ],
      details: "Complete tech training including digital literacy, software development, data analytics, and cloud computing with live video coaching sessions and hands-on practice."
    },
    {
      title: "Data Analytics Training",
      icon: <Analytics />,
      description: "Master data analytics and business intelligence",
      offerings: [
        "Statistical Analysis",
        "Data Visualization",
        "Business Intelligence",
        "SQL & Databases",
        "Python/R Programming",
        "Machine Learning Basics"
      ],
      details: "Learn data analytics through live video coaching sessions, interactive assessments, and hands-on projects with real-world datasets."
    },
    {
      title: "Business Development & Entrepreneurship",
      icon: <Business />,
      description: "Strategic business growth and entrepreneurship training",
      offerings: [
        "Business Planning",
        "Market Research",
        "Financial Planning",
        "Leadership Development",
        "Strategic Thinking",
        "Innovation Management"
      ],
      details: "Develop essential business skills with expert coaching on strategy, planning, and entrepreneurial mindset development."
    },
    {
      title: "Accounting, Tax and Audit",
      icon: <AccountBalance />,
      description: "Professional accounting and financial management services",
      offerings: [
        "Financial Accounting",
        "Tax Preparation",
        "Audit Procedures",
        "Compliance Management",
        "Bookkeeping",
        "Financial Analysis"
      ],
      details: "Comprehensive accounting and tax training with practical applications and compliance requirements."
    },
    {
      title: "Project Management",
      icon: <TrendingUp />,
      description: "Professional project management certification and training",
      offerings: [
        "PMP Certification",
        "Agile Methodologies",
        "Risk Management",
        "Quality Assurance",
        "Scrum Master Training",
        "Project Planning Tools"
      ],
      details: "Master project management with certification preparation and practical project execution strategies."
    },
    {
      title: "Executive Coaching",
      icon: <Psychology />,
      description: "Leadership development and executive coaching services",
      offerings: [
        "Leadership Development",
        "Strategic Thinking",
        "Team Management",
        "Communication Skills",
        "Emotional Intelligence",
        "Executive Presence"
      ],
      details: "Personalized executive development through one-on-one live video coaching, leadership assessments, and practical coaching exercises."
    },
    {
      title: "Professional Qualification Coaching",
      icon: <School />,
      description: "Coaching for professional certifications and qualifications",
      offerings: [
        "CPA coaching",
        "PMP coaching",
        "PRINCE2 coaching",
        "Professional Exams",
        "Skills Assessment",
        "Career Advancement"
      ],
      details: "Specialized coaching for professional certifications with personalized study plans and exam preparation strategies."
    },
    {
      title: "HR and Legal Compliance",
      icon: <Support />,
      description: "Human resources and legal compliance training",
      offerings: [
        "Employment Law",
        "HR Policies",
        "Workplace Safety",
        "Employee Relations",
        "Compliance Management",
        "Legal Documentation"
      ],
      details: "Stay compliant with employment laws and HR best practices through expert guidance and training."
    }
  ];

  const selectedServiceData = services[selectedService];

  return (
    <Box 
      ref={ref}
      id="services"
      sx={{ 
        py: { xs: 6, md: 8 },
        bgcolor: '#1a1a1a',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Fade in={inView} timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(45deg, #22c55e, #4ade80)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2.2rem', md: '2.8rem' }
              }}
            >
              Our Services
            </Typography>
            <Typography
              variant="h5"
              component="h3"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: '#e5e7eb',
                fontSize: { xs: '1.1rem', md: '1.3rem' }
              }}
            >
              Comprehensive Coaching, Training and Advisory Services
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                color: '#9ca3af',
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              With highly experienced experts, Excellence Coaching Hub offers personalized coaching, 
              training and advisory services designed to inspire, challenge, and support our clients 
              at every step along the way of growth and success.
            </Typography>
          </Box>
        </Fade>

        {/* Interactive Services Browser */}
        <Fade in={inView} timeout={1000}>
          <Box
            sx={{
              bgcolor: '#111111',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(34, 197, 94, 0.1)',
            }}
          >
            <Grid container sx={{ minHeight: '500px' }}>
              {/* Left Panel - Services List */}
              <Grid 
                item 
                xs={12} 
                md={5} 
                sx={{ 
                  bgcolor: '#1a1a1a',
                  borderRight: { md: '2px solid #22c55e' }
                }}
              >
                <List sx={{ p: 0 }}>
                  {services.map((service, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemButton
                        onClick={() => setSelectedService(index)}
                        selected={selectedService === index}
                        sx={{
                          py: 2.5,
                          px: 3,
                          transition: 'all 0.3s ease',
                          borderLeft: selectedService === index ? '4px solid #22c55e' : '4px solid transparent',
                          bgcolor: selectedService === index ? '#22c55e' : 'transparent',
                          '&:hover': {
                            bgcolor: selectedService === index ? '#22c55e' : 'rgba(34, 197, 94, 0.1)',
                          },
                          '&.Mui-selected': {
                            bgcolor: '#22c55e',
                          }
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: selectedService === index ? 'white' : '#9ca3af',
                            minWidth: 40,
                          }}
                        >
                          {service.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={service.title}
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontWeight: selectedService === index ? 600 : 500,
                              color: selectedService === index ? 'white' : '#e5e7eb',
                              fontSize: '1rem'
                            }
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Grid>

              {/* Right Panel - Service Details */}
              <Grid item xs={12} md={7} sx={{ bgcolor: '#111111' }}>
                <Box sx={{ p: { xs: 3, md: 4 } }}>
                  {/* Service Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#22c55e',
                        color: 'white',
                        mr: 3,
                        display: 'flex'
                      }}
                    >
                      {selectedServiceData.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: 'white',
                          fontSize: { xs: '1.5rem', md: '2rem' },
                          mb: 1
                        }}
                      >
                        {selectedServiceData.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#9ca3af',
                          fontSize: '1rem'
                        }}
                      >
                        {selectedServiceData.description}
                      </Typography>
                    </Box>
                  </Box>

                  {/* What we offer section */}
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        mb: 3,
                        fontSize: '1.25rem'
                      }}
                    >
                      What we offer:
                    </Typography>

                    {/* Two-column offerings */}
                    <Grid container spacing={3}>
                      {selectedServiceData.offerings.map((offering, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#22c55e',
                                mr: 2,
                                flexShrink: 0
                              }}
                            />
                            <Typography
                              sx={{
                                color: '#e5e7eb',
                                fontSize: '0.95rem',
                                fontWeight: 500
                              }}
                            >
                              {offering}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {/* Additional Details */}
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: 'rgba(34, 197, 94, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(34, 197, 94, 0.2)'
                    }}
                  >
                    <Typography
                      sx={{
                        color: '#d1d5db',
                        fontSize: '0.9rem',
                        lineHeight: 1.6
                      }}
                    >
                      {selectedServiceData.details}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default ServicesSection;