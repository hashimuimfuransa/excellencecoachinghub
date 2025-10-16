import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
  IconButton
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  AccessTime,
  Send,
  Support,
  QuestionAnswer,
  ExpandMore,
  CheckCircle,
  AutoAwesome,
  WhatsApp,
  Telegram,
  Twitter,
  LinkedIn,
  Language,
  Schedule,
  HeadsetMic,
  Chat,
  VideoCall,
  BusinessCenter,
  School,
  Help,
  Feedback,
  BugReport,
  AccountCircle
} from '@mui/icons-material';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  category: string;
}

const ContactPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: ''
  });
  
  const [errors, setErrors] = useState<Partial<ContactForm>>({});

  const handleInputChange = (field: keyof ContactForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (!formData.category.trim()) newErrors.category = 'Please select a category';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      category: ''
    });
    setErrors({});
  };

  const contactMethods = [
    {
      icon: <Email sx={{ fontSize: 40, color: '#4285f4' }} />,
      title: 'Email Support',
      details: ['support@excellencecoaching.rw', 'hello@excellencecoaching.rw'],
      description: 'Get detailed responses within 2-4 hours',
      color: '#4285f4',
      action: 'Send Email'
    },
    {
      icon: <Phone sx={{ fontSize: 40, color: '#34a853' }} />,
      title: 'Phone Support',
      details: ['+250 788 123 456', '+250 722 987 654'],
      description: 'Direct phone support Monday-Friday',
      color: '#34a853',
      action: 'Call Now'
    },
    {
      icon: <WhatsApp sx={{ fontSize: 40, color: '#25d366' }} />,
      title: 'WhatsApp Chat',
      details: ['+250 788 123 456'],
      description: 'Quick responses via WhatsApp',
      color: '#25d366',
      action: 'Chat Now'
    },
    {
      icon: <LocationOn sx={{ fontSize: 40, color: '#ea4335' }} />,
      title: 'Visit Our Office',
      details: ['KG 7 Ave, Kigali', 'Kigali, Rwanda'],
      description: 'Monday-Friday, 8AM-6PM',
      color: '#ea4335',
      action: 'Get Directions'
    }
  ];

  const supportChannels = [
    {
      icon: <Chat sx={{ color: '#667eea' }} />,
      title: 'Live Chat',
      description: 'Instant support available 24/7',
      status: 'Online',
      color: '#667eea'
    },
    {
      icon: <VideoCall sx={{ color: '#764ba2' }} />,
      title: 'Video Call',
      description: 'Schedule a personal consultation',
      status: 'Book Now',
      color: '#764ba2'
    },
    {
      icon: <HeadsetMic sx={{ color: '#f093fb' }} />,
      title: 'Technical Support',
      description: 'Expert technical assistance',
      status: 'Available',
      color: '#f093fb'
    },
    {
      icon: <QuestionAnswer sx={{ color: '#f5576c' }} />,
      title: 'Community Forum',
      description: 'Connect with other learners',
      status: 'Active',
      color: '#f5576c'
    }
  ];

  const categories = [
    { value: 'general', label: 'General Inquiry', icon: <Help /> },
    { value: 'technical', label: 'Technical Support', icon: <BugReport /> },
    { value: 'courses', label: 'Course Information', icon: <School /> },
    { value: 'billing', label: 'Billing & Payments', icon: <BusinessCenter /> },
    { value: 'account', label: 'Account Issues', icon: <AccountCircle /> },
    { value: 'partnership', label: 'Partnership Opportunities', icon: <BusinessCenter /> },
    { value: 'feedback', label: 'Feedback & Suggestions', icon: <Feedback /> },
    { value: 'other', label: 'Other', icon: <QuestionAnswer /> }
  ];

  const faqs = [
    {
      question: 'How do I enroll in Excellence Coaching Hub courses?',
      answer: 'Simply create your free account, browse our comprehensive course catalog, and click "Enroll Now" on any course that interests you. Many courses offer free previews to help you decide.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept all major payment methods including Mobile Money (MTN, Airtel), Visa/Mastercard, bank transfers, and international payment gateways like PayPal for global learners.'
    },
    {
      question: 'Is there job placement assistance after course completion?',
      answer: 'Yes! Excellence Coaching Hub offers comprehensive career support including CV optimization, interview preparation, job matching services, and connections with our partner companies across Rwanda and beyond.'
    },
    {
      question: 'How does the coaching and mentorship program work?',
      answer: 'Our expert coaches provide personalized 1-on-1 sessions, group coaching workshops, industry mentorship, and career guidance tailored to your specific goals and learning path.'
    },
    {
      question: 'Are certificates recognized by employers?',
      answer: 'Absolutely! Our certificates are industry-recognized and valued by top employers across Rwanda, East Africa, and internationally. Many of our graduates have secured positions at leading companies.'
    },
    {
      question: 'What technical requirements do I need?',
      answer: 'You need a stable internet connection, a modern web browser (Chrome, Firefox, Safari), and for some courses, a webcam and microphone for interactive sessions and assessments.'
    },
    {
      question: 'Can I access courses offline?',
      answer: 'While our platform is primarily online, many course materials can be downloaded for offline study. Mobile apps with offline capability are coming soon!'
    },
    {
      question: 'Do you offer corporate training solutions?',
      answer: 'Yes! We provide customized corporate training programs, team coaching, skills assessments, and enterprise learning solutions for organizations of all sizes.'
    }
  ];

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Contact form submitted:', formData);
      setSubmitSuccess(true);
      reset();
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
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
          animation: 'gradientShift 10s ease infinite',
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
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Floating Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            right: '15%',
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'float 7s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-25px) rotate(180deg)' }
            }
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} lg={7}>
              <Box sx={{ mb: 4 }}>
                <Chip
                  icon={<AutoAwesome sx={{ fontSize: 18, color: '#FFD700 !important' }} />}
                  label="💬 Excellence Coaching Hub - Contact Us"
                  sx={{
                    bgcolor: 'rgba(255, 215, 0, 0.15)',
                    color: '#FFD700',
                    fontWeight: 600,
                    px: 2,
                    py: 0.5,
                    fontSize: '0.9rem',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </Box>

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
                  textShadow: '0 0 60px rgba(255, 255, 255, 0.5)'
                }}
              >
                Let's Connect
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'block',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA726 50%, #FF7043 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  & Grow Together
                </Box>
              </Typography>
              
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
                We're here to support your learning journey every step of the way. Reach out for anything - questions, technical support, course guidance, or just to say hello!
              </Typography>

              {/* Quick Stats */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                  { icon: <Schedule />, text: '< 2hr Response Time', color: '#4CAF50' },
                  { icon: <Support />, text: '24/7 Support Available', color: '#2196F3' },
                  { icon: <Language />, text: 'Multi-language Support', color: '#FF9800' }
                ].map((item, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 2,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ color: item.color, mb: 1 }}>
                        {item.icon}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        {item.text}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textAlign: 'center'
                }}
              >
                <Support sx={{ fontSize: 80, color: '#FFD700', mb: 2 }} />
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                  We're Here to Help
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                  Multiple ways to reach us, fast response times, and dedicated support for every learner.
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  {[
                    { icon: <WhatsApp />, color: '#25d366' },
                    { icon: <Telegram />, color: '#0088cc' },
                    { icon: <Twitter />, color: '#1da1f2' },
                    { icon: <LinkedIn />, color: '#0077b5' }
                  ].map((social, index) => (
                    <IconButton
                      key={index}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: social.color,
                        '&:hover': {
                          bgcolor: social.color,
                          color: 'white',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {social.icon}
                    </IconButton>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Modern Contact Methods */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
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
          Choose Your Preferred Contact Method
        </Typography>

        <Grid container spacing={4}>
          {contactMethods.map((method, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  borderRadius: 4,
                  background: 'white',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  border: `1px solid ${method.color}20`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${method.color}30`
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(135deg, ${method.color} 0%, ${method.color}CC 100%)`
                  }
                }}
              >
                <CardContent sx={{ pt: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    {method.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                    {method.title}
                  </Typography>
                  {method.details.map((detail, idx) => (
                    <Typography key={idx} variant="body2" color="text.primary" gutterBottom sx={{ fontWeight: 500 }}>
                      {detail}
                    </Typography>
                  ))}
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                    {method.description}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: method.color,
                      color: method.color,
                      '&:hover': {
                        bgcolor: method.color,
                        color: 'white'
                      }
                    }}
                  >
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Support Channels */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ fontWeight: 700, mb: 6 }}
          >
            Additional Support Channels
          </Typography>

          <Grid container spacing={4}>
            {supportChannels.map((channel, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    textAlign: 'center',
                    background: 'white',
                    border: `2px solid ${channel.color}20`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      border: `2px solid ${channel.color}50`,
                      boxShadow: `0 10px 30px ${channel.color}20`
                    }
                  }}
                >
                  <Box sx={{ mb: 2, color: channel.color }}>
                    {channel.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {channel.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {channel.description}
                  </Typography>
                  <Chip
                    label={channel.status}
                    size="small"
                    sx={{
                      bgcolor: `${channel.color}15`,
                      color: channel.color,
                      fontWeight: 600
                    }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Contact Form and FAQ */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6}>
          {/* Enhanced Contact Form */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 5, borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <Typography
                  variant="h3"
                  component="h2"
                  gutterBottom
                  sx={{ fontWeight: 700, mb: 4, color: '#667eea' }}
                >
                  Send us a Message
                </Typography>
                
                {submitSuccess && (
                  <Alert 
                    severity="success" 
                    sx={{ mb: 4, borderRadius: 2 }}
                    icon={<CheckCircle />}
                  >
                    Thank you for reaching out! We'll get back to you within 2 hours during business hours.
                  </Alert>
                )}

                <form onSubmit={onSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        error={!!errors.name}
                        helperText={errors.name}
                        disabled={isSubmitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled={isSubmitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number (Optional)"
                        value={formData.phone}
                        onChange={handleInputChange('phone')}
                        disabled={isSubmitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Category"
                        value={formData.category}
                        onChange={handleInputChange('category')}
                        error={!!errors.category}
                        helperText={errors.category}
                        disabled={isSubmitting}
                        SelectProps={{
                          native: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            }
                          }
                        }}
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Subject"
                        value={formData.subject}
                        onChange={handleInputChange('subject')}
                        error={!!errors.subject}
                        helperText={errors.subject}
                        disabled={isSubmitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={5}
                        label="Your Message"
                        value={formData.message}
                        onChange={handleInputChange('message')}
                        error={!!errors.message}
                        helperText={errors.message || 'Please describe your inquiry in detail'}
                        disabled={isSubmitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          textTransform: 'none',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
                          }
                        }}
                      >
                        {isSubmitting ? 'Sending Message...' : 'Send Message'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
          </Grid>

          {/* Enhanced FAQ Section */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'grey.50', height: 'fit-content' }}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ fontWeight: 700, mb: 4, color: '#667eea' }}
                >
                  Frequently Asked Questions
                </Typography>
                
                {faqs.map((faq, index) => (
                  <Accordion
                    key={index}
                    elevation={0}
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      '&:before': { display: 'none' },
                      '& .MuiAccordionSummary-root': {
                        borderRadius: 2,
                        '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.05)' }
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{
                        '& .MuiAccordionSummary-content': {
                          margin: '12px 0'
                        }
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mt: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea15 0%, #764ba225 100%)',
                    border: '1px solid #667eea30',
                    textAlign: 'center'
                  }}
                >
                  <QuestionAnswer sx={{ fontSize: 40, color: '#667eea', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Didn't find what you're looking for?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Our support team is ready to help with any questions.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': {
                        bgcolor: '#667eea',
                        color: 'white'
                      }
                    }}
                  >
                    Contact Support
                  </Button>
                </Paper>
              </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            Ready to Start Your Learning Journey?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}>
            Join thousands of successful learners who chose Excellence Coaching Hub for their professional growth.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.7)',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Browse Courses
            </Button>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Start Learning Today
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default ContactPage;