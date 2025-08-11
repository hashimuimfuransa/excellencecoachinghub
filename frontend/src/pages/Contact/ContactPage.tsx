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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  CheckCircle
} from '@mui/icons-material';

// Contact form validation rules (using built-in validation)
const validationRules = {
  name: {
    required: 'Name is required',
    minLength: { value: 2, message: 'Name must be at least 2 characters' }
  },
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email format'
    }
  },
  subject: {
    required: 'Subject is required',
    minLength: { value: 5, message: 'Subject must be at least 5 characters' }
  },
  message: {
    required: 'Message is required',
    minLength: { value: 10, message: 'Message must be at least 10 characters' }
  },
  category: {
    required: 'Please select a category'
  }
};

interface ContactForm {
  name: string;
  email: string;
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
    // Clear error when user starts typing
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
      subject: '',
      message: '',
      category: ''
    });
    setErrors({});
  };

  const contactInfo = [
    {
      icon: <Email color="primary" />,
      title: 'Email Us',
      details: ['support@excellencecoaching.com', 'info@excellencecoaching.com'],
      description: 'Send us an email anytime'
    },
    {
      icon: <Phone color="primary" />,
      title: 'Call Us',
      details: ['+1 (555) 123-4567', '+1 (555) 987-6543'],
      description: 'Mon-Fri, 9AM-6PM EST'
    },
    {
      icon: <LocationOn color="primary" />,
      title: 'Visit Us',
      details: ['123 Education Street', 'Learning City, LC 12345'],
      description: 'Our main office location'
    },
    {
      icon: <AccessTime color="primary" />,
      title: 'Business Hours',
      details: ['Monday - Friday: 9AM - 6PM', 'Saturday: 10AM - 4PM', 'Sunday: Closed'],
      description: 'We\'re here to help'
    }
  ];

  const categories = [
    'General Inquiry',
    'Technical Support',
    'Course Information',
    'Billing & Payments',
    'Account Issues',
    'Partnership Opportunities',
    'Feedback & Suggestions',
    'Other'
  ];

  const faqs = [
    {
      question: 'How do I enroll in a course?',
      answer: 'You can enroll in any course by creating an account, browsing our course catalog, and clicking the "Enroll Now" button on your desired course page.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for course payments.'
    },
    {
      question: 'Can I get a refund if I\'m not satisfied?',
      answer: 'Yes, we offer a 30-day money-back guarantee for all courses. If you\'re not satisfied, contact our support team for a full refund.'
    },
    {
      question: 'How does the proctoring system work?',
      answer: 'Our AI-powered proctoring system monitors exam sessions through your webcam and microphone to ensure academic integrity while respecting your privacy.'
    },
    {
      question: 'Do I get a certificate after completing a course?',
      answer: 'Yes, you\'ll receive a digital certificate upon successful completion of any course, which you can download and share on professional networks.'
    },
    {
      question: 'Is there technical support available?',
      answer: 'Absolutely! Our technical support team is available 24/7 to help with any platform-related issues or questions you may have.'
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
            <Grid item xs={12} md={8}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                Get in Touch
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  opacity: 0.9,
                  lineHeight: 1.6
                }}
              >
                We're here to help you succeed. Reach out to us with any questions, concerns, or feedback.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: { xs: 150, md: 200 }
                }}
              >
                <Support sx={{ fontSize: { xs: 100, md: 150 }, opacity: 0.3 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact Information */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 6 }}
        >
          Contact Information
        </Typography>
        <Grid container spacing={4}>
          {contactInfo.map((info, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  borderRadius: 3,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {info.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {info.title}
                  </Typography>
                  {info.details.map((detail, idx) => (
                    <Typography key={idx} variant="body2" color="text.primary" gutterBottom>
                      {detail}
                    </Typography>
                  ))}
                  <Typography variant="caption" color="text.secondary">
                    {info.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Contact Form and FAQ */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            {/* Contact Form */}
            <Grid item xs={12} md={8}>
              <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                <Typography
                  variant="h4"
                  component="h2"
                  gutterBottom
                  sx={{ fontWeight: 'bold', mb: 3 }}
                >
                  Send us a Message
                </Typography>
                
                {submitSuccess && (
                  <Alert 
                    severity="success" 
                    sx={{ mb: 3 }}
                    icon={<CheckCircle />}
                  >
                    Thank you for your message! We'll get back to you within 24 hours.
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
                      />
                    </Grid>
                    <Grid item xs={12}>
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
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
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
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Message"
                        multiline
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange('message')}
                        error={!!errors.message}
                        helperText={errors.message}
                        disabled={isSubmitting}
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
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1.1rem'
                        }}
                      >
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Grid>

            {/* Quick Help */}
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
                <Typography
                  variant="h5"
                  component="h3"
                  gutterBottom
                  sx={{ fontWeight: 'bold', mb: 3 }}
                >
                  Need Quick Help?
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <QuestionAnswer color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Check our FAQ section below"
                      secondary="Find answers to common questions"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Support color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Live Chat Support"
                      secondary="Available 24/7 for urgent issues"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Email color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email Support"
                      secondary="Response within 24 hours"
                    />
                  </ListItem>
                </List>
              </Paper>

              <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                <Typography
                  variant="h6"
                  component="h3"
                  gutterBottom
                  sx={{ fontWeight: 'bold', mb: 2 }}
                >
                  Office Hours
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Our support team is available during these hours:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Monday - Friday: 9:00 AM - 6:00 PM EST" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Saturday: 10:00 AM - 4:00 PM EST" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Sunday: Closed" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 6 }}
        >
          Frequently Asked Questions
        </Typography>
        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              sx={{
                mb: 2,
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: theme.shadows[2]
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  borderRadius: 2,
                  '&.Mui-expanded': {
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default ContactPage;
