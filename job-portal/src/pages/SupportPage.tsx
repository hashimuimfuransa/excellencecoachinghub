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
  Divider,
  IconButton,
  Stack
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
  Send,
  LocationOn,
  WhatsApp,
  LinkedIn,
  Twitter,
  Facebook,
  YouTube,
  Telegram,
  Instagram,
  Language,
  Schedule,
  Headset,
  ChatBubble,
  PhoneInTalk,
  BusinessCenter,
  TrendingUp,
  Group,
  VideoLibrary
} from '@mui/icons-material';
import PublicLayout from '../layouts/PublicLayout';

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
      answer: 'To create a professional profile, go to your dashboard and click on "Complete Profile". Fill in your personal information, work experience, education, skills, and upload a professional photo. Our AI will help guide you through the process and provide suggestions to optimize your profile for better job matches.'
    },
    {
      category: 'account',
      question: 'How can I update my profile information?',
      answer: 'You can update your profile anytime by going to Settings > Profile. Make sure to save your changes after updating any information. We recommend keeping your profile up-to-date to receive the most relevant job opportunities.'
    },
    {
      category: 'jobs',
      question: 'How does the AI job matching work?',
      answer: 'Our advanced AI analyzes your skills, experience, preferences, career goals, and industry trends to match you with relevant job opportunities. The more complete your profile, the better and more accurate the matches. Our system learns from your interactions to continuously improve recommendations.'
    },
    {
      category: 'jobs',
      question: 'How do I apply for jobs?',
      answer: 'Once you find a job you\'re interested in, click "Apply Now" and follow the application process. You can use our one-click apply feature for faster applications, or customize your application for specific roles. We also provide application tracking to help you manage your job search.'
    },
    {
      category: 'interviews',
      question: 'What is the AI Interview Coach?',
      answer: 'Our AI Interview Coach provides personalized interview practice sessions with real-time feedback on communication skills, content quality, body language, and overall presentation. It helps you prepare for different types of interviews including behavioral, technical, and industry-specific questions.'
    },
    {
      category: 'interviews',
      question: 'How accurate is the AI interview feedback?',
      answer: 'Our AI is trained on thousands of successful interviews and provides highly accurate feedback. It analyzes speech patterns, content quality, confidence levels, and presentation skills. The feedback includes specific suggestions for improvement and best practices from top performers.'
    },
    {
      category: 'courses',
      question: 'Are the certificates industry-recognized?',
      answer: 'Yes, our certificates are recognized by leading industry partners and employers across Africa and internationally. They can be shared on your LinkedIn profile, resume, and are verified through our blockchain-based certification system.'
    },
    {
      category: 'courses',
      question: 'How long does it take to complete a course?',
      answer: 'Course duration varies from 2-12 weeks depending on the complexity and your learning pace. All courses come with lifetime access to materials, allowing you to learn at your own speed and revisit content whenever needed.'
    },
    {
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, bank transfers, and mobile money platforms. All payments are processed securely through encrypted channels with industry-standard security protocols.'
    },
    {
      category: 'payment',
      question: 'Can I get a refund?',
      answer: 'Yes, we offer a 30-day money-back guarantee for all paid services. If you\'re not satisfied with our platform, contact our support team for a full refund. No questions asked.'
    },
    {
      category: 'technical',
      question: 'The platform is loading slowly. What should I do?',
      answer: 'Try clearing your browser cache, disabling browser extensions, or switching to a different browser. Ensure you have a stable internet connection. If the problem persists, contact our technical support team with details about your browser and device.'
    },
    {
      category: 'technical',
      question: 'I can\'t upload my resume. Help!',
      answer: 'Ensure your resume is in PDF, DOC, or DOCX format and under 5MB. Check that your browser allows file uploads and that you have sufficient storage space. If issues persist, try using a different browser or contact support for assistance.'
    }
  ];

  const supportChannels = [
    {
      icon: <Email />,
      title: 'Email Support',
      description: 'Get comprehensive help via email',
      contact: 'info@excellencecoachinghub.com',
      responseTime: '&lt; 4 hours',
      availability: '24/7',
      color: 'primary',
      action: () => window.open('mailto:info@excellencecoachinghub.com', '_blank')
    },
    {
      icon: <WhatsApp />,
      title: 'WhatsApp Support',
      description: 'Quick support via WhatsApp',
      contact: '+250 0788535156',
      responseTime: '&lt; 30 minutes',
      availability: 'Mon-Sat, 8AM-6PM CAT',
      color: 'success',
      action: () => window.open('https://wa.me/0788535156?text=Hello%20ExJobNet', '_blank')
    },
    {
      icon: <Phone />,
      title: 'Phone Support',
      description: 'Speak directly with our team',
      contact: '+250 0788535156',
      responseTime: 'Immediate',
      availability: 'Mon-Fri, 8AM-6PM CAT',
      color: 'info',
      action: () => window.open('tel:+0788535156', '_blank')
    },
    {
      icon: <ChatBubble />,
      title: 'Live Chat',
      description: 'Real-time chat support',
      contact: 'Start Chat',
      responseTime: '&lt; 2 minutes',
      availability: 'Mon-Fri, 8AM-6PM CAT',
      color: 'secondary',
      action: () => {
        // This would typically open a chat widget
        alert('Live chat feature will be available soon! Please use email or WhatsApp for immediate support.');
      }
    }
  ];

  const socialLinks = [
    { 
      platform: 'LinkedIn', 
      icon: <LinkedIn />, 
      url: 'https://www.linkedin.com/in/excellence-coachinghub-1b8b1a380?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
      color: '#0077B5'
    },
    { 
      platform: 'Twitter', 
      icon: <Twitter />, 
      url: 'https://x.com/ECH_coachinghub?t=Awf4GVPp9eCkSZhDlHkFew&s=08',
      color: '#1DA1F2'
    },
    { 
      platform: 'Facebook', 
      icon: <Facebook />, 
      url: 'https://facebook.com/excellencecoachinghub',
      color: '#4267B2'
    },
    { 
      platform: 'Instagram', 
      icon: <Instagram />, 
      url: 'https://www.instagram.com/excellencecoachinghub/?utm_source=qr&igsh=Ym5xMXh5aXZmNHVi#',
      color: '#E4405F'
    },
    { 
      platform: 'TikTok', 
      icon: <VideoLibrary />, 
      url: 'https://www.tiktok.com/@excellence.coachi4?_t=ZM-8zCgEouFb8w&_r=1',
      color: '#ff0050'
    }
  ];

  const testimonials = [
    {
      name: 'Grace Uwimana',
      role: 'Software Engineer at Bank of Kigali',
      rating: 5,
      comment: 'The support team helped me optimize my profile and I got 3 job offers within two weeks! Their AI interview coach was game-changing.',
      avatar: 'GU',
      location: 'Kigali, Rwanda'
    },
    {
      name: 'Emmanuel Niyonzima',
      role: 'Marketing Manager at MTN Rwanda',
      comment: 'Quick and professional responses. The career guidance and interview preparation helped me land my dream job.',
      rating: 5,
      avatar: 'EN',
      location: 'Kigali, Rwanda'
    },
    {
      name: 'Aisha Mutesi',
      role: 'Data Analyst at African Development Bank',
      comment: 'Excellent customer service. They walked me through the entire certification process and job search strategy.',
      rating: 5,
      avatar: 'AM',
      location: 'Kigali, Rwanda'
    }
  ];

  const officeLocations = [
    {
      city: 'Kigali',
      address: 'Excellence Coaching Hub\nKigali, Rwanda\nServing clients across East Africa and globally',
      phone: '+250 0788535156',
      email: 'info@excellencecoachinghub.com'
    }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Contact form submitted:', contactForm);
    alert('Thank you for your message! We\'ll get back to you within 4 hours.');
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: { xs: 6, md: 10 },
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.1
            }}
          />
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Fade in timeout={1000}>
              <Box textAlign="center">
                <SupportIcon sx={{ fontSize: 100, mb: 3, opacity: 0.9 }} />
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' },
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  We're Here to Help
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 6, 
                    opacity: 0.95,
                    maxWidth: '700px',
                    mx: 'auto',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}
                >
                  Get expert support for your career journey. Our dedicated team is ready to help you succeed.
                </Typography>
                
                {/* Quick Stats */}
                <Grid container spacing={3} justifyContent="center" sx={{ mt: 4 }}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold">24/7</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Email Support</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold">&lt; 4hr</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Response Time</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold">98%</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Satisfaction</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold">50K+</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Users Helped</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 8 }}>
          {/* Support Channels */}
          <Box sx={{ mb: 10 }}>
            <Typography variant="h3" textAlign="center" gutterBottom fontWeight="bold" color="text.primary">
              Get in Touch
            </Typography>
            <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}>
              Choose your preferred way to reach our expert support team
            </Typography>
            
            <Grid container spacing={4}>
              {supportChannels.map((channel, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card 
                    onClick={channel.action}
                    sx={{ 
                      height: '100%',
                      textAlign: 'center',
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '2px solid transparent',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[12],
                        borderColor: `${theme.palette[channel.color].main}20`
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 70,
                        height: 70,
                        bgcolor: `${channel.color}.main`,
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
                    <Typography variant="body1" color={`${channel.color}.main`} fontWeight="medium" sx={{ mb: 2 }}>
                      {channel.contact}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                      <Chip
                        size="small"
                        label={channel.responseTime}
                        color={channel.color}
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

          {/* Office Locations */}
          <Box sx={{ mb: 10 }}>
            <Typography variant="h4" textAlign="center" gutterBottom fontWeight="bold">
              Our Offices
            </Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
              Visit us at our locations across Nigeria
            </Typography>
            
            <Grid container spacing={4}>
              {officeLocations.map((office, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ p: 4, height: '100%', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <LocationOn />
                      </Avatar>
                      <Typography variant="h5" fontWeight="bold">
                        {office.city} Office
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                      {office.address}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Phone sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2">{office.phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Email sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2">{office.email}</Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* FAQ Section */}
          <Box sx={{ mb: 10 }}>
            <Typography variant="h4" textAlign="center" gutterBottom fontWeight="bold">
              Frequently Asked Questions
            </Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
              Find quick answers to common questions about our platform
            </Typography>

            {/* FAQ Categories */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 6, justifyContent: 'center' }}>
              {faqCategories.map((category) => (
                <Chip
                  key={category.id}
                  icon={category.icon}
                  label={category.label}
                  variant={selectedCategory === category.id ? "filled" : "outlined"}
                  color={selectedCategory === category.id ? "primary" : "default"}
                  onClick={() => setSelectedCategory(category.id)}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
              ))}
            </Box>

            {/* FAQ List */}
            <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
              {filteredFAQs.map((faq, index) => (
                <Accordion 
                  key={index} 
                  sx={{ 
                    mb: 2,
                    borderRadius: 2,
                    '&:before': { display: 'none' },
                    boxShadow: 1
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMore />}
                    sx={{ borderRadius: 2 }}
                  >
                    <Typography fontWeight="medium" variant="h6">
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>

          {/* Contact Form and Testimonials */}
          <Grid container spacing={6}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 5, borderRadius: 3, boxShadow: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                  Contact Support
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
                  Can't find what you're looking for? Send us a message and we'll get back to you within 4 hours.
                </Typography>

                <form onSubmit={handleContactSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        required
                        variant="outlined"
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
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Subject"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                        required
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Message"
                        multiline
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        required
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        endIcon={<Send />}
                        sx={{ 
                          borderRadius: 3,
                          py: 1.5,
                          px: 4,
                          fontSize: '1.1rem',
                          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                        }}
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
              <Paper sx={{ p: 4, borderRadius: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  What Our Users Say
                </Typography>
                {testimonials.map((testimonial, index) => (
                  <Box key={index} sx={{ mb: index < testimonials.length - 1 ? 4 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 50, height: 50, mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                        {testimonial.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {testimonial.name}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {testimonial.role}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {testimonial.location}
                        </Typography>
                      </Box>
                    </Box>
                    <Rating 
                      value={testimonial.rating} 
                      size="small" 
                      readOnly 
                      sx={{ mb: 1, '& .MuiRating-iconFilled': { color: '#FFD700' } }} 
                    />
                    <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.95 }}>
                      "{testimonial.comment}"
                    </Typography>
                    {index < testimonials.length - 1 && <Divider sx={{ mt: 3, bgcolor: 'rgba(255,255,255,0.2)' }} />}
                  </Box>
                ))}
              </Paper>

              {/* Social Media */}
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Follow Us
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Stay connected with us on social media for the latest updates and career tips.
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {socialLinks.map((social, index) => (
                    <IconButton
                      key={index}
                      onClick={() => window.open(social.url, '_blank')}
                      sx={{
                        color: social.color,
                        border: `2px solid ${social.color}`,
                        '&:hover': {
                          bgcolor: social.color,
                          color: 'white'
                        }
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
    </PublicLayout>
  );
};

export default SupportPage;