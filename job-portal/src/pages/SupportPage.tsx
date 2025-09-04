import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Rating,
  useTheme,
  alpha,
  Fade,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  Help,
  Email,
  Phone,
  Chat,
  School,
  Work,
  Psychology,
  Settings,
  Security,
  Payment,
  BugReport,
  Feedback,
  QuestionAnswer,
  Support as SupportIcon,
  AccessTime,
  CheckCircle,
  Star,
  Send
} from '@mui/icons-material';
import PublicLayout from '../layouts/PublicLayout';
import JobEmailTester from '../components/JobEmailTester';

const SupportPage: React.FC = () => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });

  const faqCategories = [
    { id: 'all', label: 'All Topics', icon: <Help /> },
    { id: 'account', label: 'Account & Profile', icon: <Settings /> },
    { id: 'jobs', label: 'Job Search', icon: <Work /> },
    { id: 'interviews', label: 'AI Interviews', icon: <Psychology /> },
    { id: 'courses', label: 'Courses & Certification', icon: <School /> },
    { id: 'payment', label: 'Billing & Payment', icon: <Payment /> },
    { id: 'technical', label: 'Technical Issues', icon: <BugReport /> }
  ];

  const faqs = [
    {
      category: 'account',
      question: 'How do I create a professional profile?',
      answer: 'To create a professional profile, go to your dashboard and click on "Complete Profile". Fill in your personal information, work experience, education, skills, and upload a professional photo. Our AI will help guide you through the process.'
    },
    {
      category: 'account',
      question: 'How can I update my profile information?',
      answer: 'You can update your profile anytime by going to Settings > Profile. Make sure to save your changes after updating any information.'
    },
    {
      category: 'jobs',
      question: 'How does the AI job matching work?',
      answer: 'Our AI analyzes your skills, experience, preferences, and career goals to match you with relevant job opportunities. The more complete your profile, the better the matches.'
    },
    {
      category: 'jobs',
      question: 'How do I apply for jobs?',
      answer: 'Once you find a job you\'re interested in, click "Apply Now" and follow the application process. You can use our one-click apply feature for faster applications.'
    },
    {
      category: 'interviews',
      question: 'What is the AI Interview Coach?',
      answer: 'Our AI Interview Coach provides personalized interview practice sessions with real-time feedback, helping you improve your interview skills and confidence.'
    },
    {
      category: 'interviews',
      question: 'How accurate is the AI interview feedback?',
      answer: 'Our AI is trained on thousands of successful interviews and provides accurate feedback on communication skills, content quality, and overall presentation.'
    },
    {
      category: 'courses',
      question: 'Are the certificates industry-recognized?',
      answer: 'Yes, our certificates are recognized by leading industry partners and can be shared on your LinkedIn profile and resume.'
    },
    {
      category: 'courses',
      question: 'How long does it take to complete a course?',
      answer: 'Course duration varies from 2-12 weeks depending on the complexity. You can learn at your own pace with lifetime access to materials.'
    },
    {
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through encrypted channels.'
    },
    {
      category: 'payment',
      question: 'Can I get a refund?',
      answer: 'Yes, we offer a 30-day money-back guarantee for all paid services. Contact support for refund requests.'
    },
    {
      category: 'technical',
      question: 'The website is loading slowly. What should I do?',
      answer: 'Try clearing your browser cache, disabling browser extensions, or switching to a different browser. If the problem persists, contact our technical support.'
    },
    {
      category: 'technical',
      question: 'I can\'t upload my resume. Help!',
      answer: 'Ensure your resume is in PDF, DOC, or DOCX format and under 5MB. Try using a different browser or contact support if issues persist.'
    }
  ];

  const supportChannels = [
    {
      icon: <Email />,
      title: 'Email Support',
      description: 'Get detailed help via email',
      contact: 'support@excellencehub.com',
      responseTime: '24 hours',
      availability: '24/7'
    },
    {
      icon: <Chat />,
      title: 'Live Chat',
      description: 'Chat with our support team',
      contact: 'Start Chat',
      responseTime: '< 5 minutes',
      availability: 'Mon-Fri, 9AM-6PM EST'
    },
    {
      icon: <Phone />,
      title: 'Phone Support',
      description: 'Speak directly with support',
      contact: '+1 (555) 123-4567',
      responseTime: 'Immediate',
      availability: 'Mon-Fri, 9AM-6PM EST'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      rating: 5,
      comment: 'The support team helped me optimize my profile and I got 3 job offers within a week!'
    },
    {
      name: 'Mike Chen',
      role: 'Marketing Manager',
      comment: 'Quick and helpful responses. The AI interview coach really boosted my confidence.',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'Data Analyst',
      comment: 'Excellent customer service. They walked me through the entire certification process.',
      rating: 5
    }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Contact form submitted:', contactForm);
    // Reset form
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'general'
    });
  };

  return (
    <PublicLayout>
      <Box>
        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
            color: 'white',
            py: 8,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Fade in timeout={1000}>
              <Box textAlign="center">
                <SupportIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom 
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}
                >
                  How Can We Help You?
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4, 
                    opacity: 0.9,
                    maxWidth: '600px',
                    mx: 'auto'
                  }}
                >
                  We're here to support your career success every step of the way
                </Typography>
              </Box>
            </Fade>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 6 }}>
          {/* Support Channels */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" textAlign="center" gutterBottom fontWeight="bold">
              Get in Touch
            </Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
              Choose your preferred way to reach out to our support team
            </Typography>
            
            <Grid container spacing={3}>
              {supportChannels.map((channel, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      textAlign: 'center',
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: 'primary.main',
                        mx: 'auto',
                        mb: 2
                      }}
                    >
                      {channel.icon}
                    </Avatar>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {channel.title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      {channel.description}
                    </Typography>
                    <Typography variant="body2" color="primary" fontWeight="medium" sx={{ mb: 1 }}>
                      {channel.contact}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                      <Chip
                        size="small"
                        label={channel.responseTime}
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {channel.availability}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* FAQ Section */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" textAlign="center" gutterBottom fontWeight="bold">
              Frequently Asked Questions
            </Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
              Find quick answers to common questions
            </Typography>

            {/* FAQ Categories */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, justifyContent: 'center' }}>
              {faqCategories.map((category) => (
                <Chip
                  key={category.id}
                  icon={category.icon}
                  label={category.label}
                  variant={selectedCategory === category.id ? "filled" : "outlined"}
                  color={selectedCategory === category.id ? "primary" : "default"}
                  onClick={() => setSelectedCategory(category.id)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

            {/* FAQ List */}
            <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
              {filteredFAQs.map((faq, index) => (
                <Accordion key={index} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography fontWeight="medium">{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>

          {/* Contact Form */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  Contact Support
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Can't find what you're looking for? Send us a message and we'll get back to you.
                </Typography>

                <form onSubmit={handleContactSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Subject"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Message"
                        multiline
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        endIcon={<Send />}
                        sx={{ borderRadius: 2 }}
                      >
                        Send Message
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              {/* Customer Testimonials */}
              <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  What Our Users Say
                </Typography>
                {testimonials.map((testimonial, index) => (
                  <Box key={index} sx={{ mb: index < testimonials.length - 1 ? 3 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 1.5 }}>
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {testimonial.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Box>
                    <Rating value={testimonial.rating} size="small" readOnly sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      "{testimonial.comment}"
                    </Typography>
                    {index < testimonials.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Paper>

              {/* Quick Links */}
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Quick Links
                </Typography>
                <List dense>
                  <ListItem sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle sx={{ fontSize: 20, color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText primary="Platform Status" />
                  </ListItem>
                  <ListItem sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <School sx={{ fontSize: 20, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText primary="Video Tutorials" />
                  </ListItem>
                  <ListItem sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <QuestionAnswer sx={{ fontSize: 20, color: 'info.main' }} />
                    </ListItemIcon>
                    <ListItemText primary="User Guide" />
                  </ListItem>
                  <ListItem sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Feedback sx={{ fontSize: 20, color: 'warning.main' }} />
                    </ListItemIcon>
                    <ListItemText primary="Send Feedback" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>

          {/* Job Email Tester Section - Development/Testing Tool */}
          <Container maxWidth="lg" sx={{ mt: 4 }}>
            <JobEmailTester />
          </Container>
        </Container>
      </Box>
    </PublicLayout>
  );
};

export default SupportPage;