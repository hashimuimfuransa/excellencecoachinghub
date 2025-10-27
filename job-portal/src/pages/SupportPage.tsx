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
    { id: 'interviews', label: 'Interview Preparation', icon: <Psychology /> },
    { id: 'courses', label: 'Courses & Certification', icon: <School /> },
    { id: 'payment', label: 'Billing & Payment', icon: <Payment /> },
    { id: 'technical', label: 'Technical Issues', icon: <BugReport /> }
  ];

  const faqs = [
    {
      category: 'account',
      question: 'How do I create a professional profile?',
      answer: 'To create a professional profile, go to your dashboard and click on "Complete Profile". Fill in your personal information, work experience, education, skills, and upload a professional photo. Our platform provides helpful tips and suggestions to optimize your profile for better job matches.'
    },
    {
      category: 'account',
      question: 'How can I update my profile information?',
      answer: 'You can update your profile anytime by going to Settings > Profile. Make sure to save your changes after updating any information. We recommend keeping your profile up-to-date to receive the most relevant job opportunities.'
    },
    {
      category: 'jobs',
      question: 'How does job matching work?',
      answer: 'Our platform analyzes your skills, experience, preferences, career goals, and industry trends to match you with relevant job opportunities. The more complete your profile, the better and more accurate the matches. Our system continuously improves recommendations based on industry best practices.'
    },
    {
      category: 'jobs',
      question: 'How do I apply for jobs?',
      answer: 'Once you find a job you\'re interested in, click "Apply Now" and follow the application process. You can use our one-click apply feature for faster applications, or customize your application for specific roles. We also provide application tracking to help you manage your job search.'
    },
    {
      category: 'interviews',
      question: 'What interview preparation resources are available?',
      answer: 'We provide comprehensive interview preparation resources including practice sessions, mock interviews, and personalized feedback on communication skills, content quality, and overall presentation. Our resources help you prepare for different types of interviews including behavioral, technical, and industry-specific questions.'
    },
    {
      category: 'interviews',
      question: 'How can I improve my interview performance?',
      answer: 'Our interview preparation tools provide detailed feedback based on best practices from successful professionals. The feedback includes specific suggestions for improvement, communication tips, and presentation skills guidance to help you excel in your interviews.'
    },
    {
      category: 'courses',
      question: 'Are the certificates industry-recognized?',
      answer: 'Yes, our certificates are recognized by leading industry partners and employers across Africa and internationally. They can be shared on your LinkedIn profile, resume, and are verified through our secure certification system.'
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
      comment: 'The support team helped me optimize my profile and I got 3 job offers within two weeks! Their interview preparation resources were game-changing.',
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
            py: { xs: 8, md: 12 },
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
                <SupportIcon sx={{ fontSize: 120, mb: 4, opacity: 0.9, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} />
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    background: 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Professional Support Center
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 6, 
                    opacity: 0.95,
                    maxWidth: '800px',
                    mx: 'auto',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    fontWeight: 300,
                    lineHeight: 1.4
                  }}
                >
                  Your success is our priority. Our expert support team provides personalized assistance to help you achieve your career goals and maximize your potential.
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
              Connect With Our Experts
            </Typography>
            <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6, maxWidth: '700px', mx: 'auto', fontWeight: 300 }}>
              Choose your preferred way to reach our professional support team. We're committed to providing exceptional service and quick response times.
            </Typography>
            
            <Grid container spacing={4}>
              {supportChannels.map((channel, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card 
                    onClick={channel.action}
                    sx={{ 
                      height: '100%',
                      textAlign: 'center',
                      p: 4,
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '2px solid transparent',
                      borderRadius: 3,
                      background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                        borderColor: `${theme.palette[channel.color].main}`,
                        background: 'linear-gradient(145deg, #ffffff 0%, #f0f8ff 100%)'
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: `${channel.color}.main`,
                        mx: 'auto',
                        mb: 3,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.25)'
                        }
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
              Visit us at our location in Kigali, Rwanda
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
            <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6, maxWidth: '700px', mx: 'auto', fontSize: '1.1rem', fontWeight: 300 }}>
              Find comprehensive answers to common questions about our platform and services
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
                    mb: 3,
                    borderRadius: 3,
                    '&:before': { display: 'none' },
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      transform: 'translateY(-2px)'
                    }
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
              <Paper sx={{ p: 6, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)' }}>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                  Contact Our Support Team
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem', fontWeight: 300 }}>
                  Can't find what you're looking for? Send us a detailed message and our professional support team will respond within 4 hours.
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
                          py: 2,
                          px: 6,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 32px rgba(102, 126, 234, 0.6)',
                            background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)'
                          }
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
              <Paper sx={{ p: 5, borderRadius: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)' }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  What Our Clients Say
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
              <Paper sx={{ p: 5, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)' }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Stay Connected
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 300 }}>
                  Follow us on social media for the latest career insights, job opportunities, and professional development tips.
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {socialLinks.map((social, index) => (
                    <IconButton
                      key={index}
                      onClick={() => window.open(social.url, '_blank')}
                      sx={{
                        color: social.color,
                        border: `2px solid ${social.color}`,
                        borderRadius: 2,
                        p: 1.5,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: social.color,
                          color: 'white',
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 24px ${social.color}40`
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