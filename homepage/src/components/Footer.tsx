import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  TextField,
  Button,
  IconButton,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  YouTube,
  Email,
  Phone,
  LocationOn,
  Send,
  ArrowUpward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setSubscribing(true);
    try {
      // Simulate newsletter subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const footerLinks = {
    platform: [
      { label: 'E-Learning', href: '/elearning' },
      { label: 'Job Preparation', href: '/jobs' },
      { label: 'Courses', href: '/courses' },
      { label: 'Assessments', href: '/assessments' },
      { label: 'Certifications', href: '/certifications' },
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Our Team', href: '/team' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Blog', href: '/blog' },
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Community', href: '/community' },
      { label: 'Documentation', href: '/docs' },
      { label: 'API', href: '/api' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' },
      { label: 'Accessibility', href: '/accessibility' },
    ],
  };

  const socialLinks = [
    { icon: <Facebook />, href: 'https://facebook.com/excellencecoachinghub', label: 'Facebook' },
    { icon: <Twitter />, href: 'https://twitter.com/excellencehub', label: 'Twitter' },
    { icon: <LinkedIn />, href: 'https://linkedin.com/company/excellence-coaching-hub', label: 'LinkedIn' },
    { icon: <Instagram />, href: 'https://instagram.com/excellencecoachinghub', label: 'Instagram' },
    { icon: <YouTube />, href: 'https://youtube.com/excellencecoachinghub', label: 'YouTube' },
  ];

  const contactInfo = [
    { icon: <Email />, text: 'info@excellencecoachinghub.com', href: 'mailto:info@excellencecoachinghub.com' },
    { icon: <Phone />, text: '+250 123 456 789', href: 'tel:+250123456789' },
    { icon: <LocationOn />, text: 'Kigali, Rwanda (HQ) • Serving All of Africa', href: '#' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1a1a2e',
        color: 'white',
        pt: { xs: 6, sm: 8 },
        pb: { xs: 3, sm: 4 },
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
          background: `
            radial-gradient(circle at 20% 80%, rgba(63, 81, 181, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Animated Shapes */}
      <Box
        component={motion.div}
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(63, 81, 181, 0.03)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
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
          bottom: '15%',
          left: '5%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'rgba(255, 107, 107, 0.03)',
          filter: 'blur(30px)',
          zIndex: 0,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Main Footer Content */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box
                    component="img"
                    src="/logo.webp"
                    alt="Excellence Coaching Hub Logo"
                    sx={{
                      height: 50,
                      mr: 2,
                      filter: 'brightness(0) invert(1)',
                    }}
                  />
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(45deg, #ffffff, #e0e0e0)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Excellence Coaching Hub
                  </Typography>
                </Box>
                
                <Typography
                  variant="body1"
                  sx={{
                    color: 'grey.300',
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  Empowering Africa's workforce through innovative education, 
                  career coaching, and skills development. Join thousands of 
                  successful professionals who transformed their careers with us.
                </Typography>

                {/* Contact Info */}
                <Stack spacing={2}>
                  {contactInfo.map((contact, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ color: 'primary.main', mr: 2 }}>
                        {contact.icon}
                      </Box>
                      <Link
                        href={contact.href}
                        sx={{
                          color: 'grey.300',
                          textDecoration: 'none',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {contact.text}
                      </Link>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </motion.div>
          </Grid>

          {/* Links Sections */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              {Object.entries(footerLinks).map(([category, links], index) => (
                <Grid item xs={6} sm={3} key={category}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 2,
                        textTransform: 'capitalize',
                        color: 'primary.main',
                      }}
                    >
                      {category}
                    </Typography>
                    <Stack spacing={1}>
                      {links.map((link, linkIndex) => (
                        <Link
                          key={linkIndex}
                          href={link.href}
                          sx={{
                            color: 'grey.300',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            '&:hover': {
                              color: 'primary.main',
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </Stack>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Newsletter Signup */}
          <Grid item xs={12} md={2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: 'primary.main',
                }}
              >
                Stay Updated
              </Typography>
              
              <Typography
                variant="body2"
                sx={{
                  color: 'grey.300',
                  mb: 3,
                  lineHeight: 1.5,
                }}
              >
                Subscribe to our newsletter for the latest updates, courses, and career opportunities.
              </Typography>

              <Box
                component={motion.form}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onSubmit={handleNewsletterSubmit}
                sx={{ 
                  mb: 3,
                  p: 2,
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      borderRadius: '30px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                />
                <Button
                  component={motion.button}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: '0 6px 20px rgba(255, 107, 107, 0.4)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={subscribing}
                  endIcon={<Send />}
                  sx={{
                    bgcolor: 'secondary.main',
                    borderRadius: '30px',
                    py: 1.2,
                    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                    '&:hover': {
                      bgcolor: 'secondary.dark',
                    },
                  }}
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </Box>

              {/* Social Links */}
              <Typography
                variant="body2"
                sx={{
                  color: 'grey.300',
                  mb: 2,
                }}
              >
                Follow us on social media:
              </Typography>
              
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                {socialLinks.map((social, index) => (
                  <IconButton
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: '#fff',
                        bgcolor: 'primary.main',
                        boxShadow: '0 4px 12px rgba(63, 81, 181, 0.3)',
                      },
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Stack>
            </motion.div>
          </Grid>
        </Grid>

        <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mb: 4 }} />

        {/* Bottom Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'grey.400',
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              © {new Date().getFullYear()} Excellence Coaching Hub. All rights reserved.
              Made with ❤️ for Africa's future leaders.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label="Trusted by 10,000+ Students"
                size="small"
                sx={{
                  bgcolor: 'rgba(25, 118, 210, 0.2)',
                  color: 'primary.main',
                  fontWeight: 500,
                }}
              />
              
              <IconButton
                onClick={scrollToTop}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <ArrowUpward />
              </IconButton>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Footer;