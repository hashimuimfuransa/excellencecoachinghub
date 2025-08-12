import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  TextField,
  Button,
  useTheme
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
  Send
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Browse Courses', path: '/courses' },
      { label: 'Become an Instructor', path: '/teach' },
      { label: 'Student Dashboard', path: '/student' },
      { label: 'Mobile App', path: '/mobile' }
    ],
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Press', path: '/press' },
      { label: 'Blog', path: '/blog' }
    ],
    support: [
      { label: 'Help Center', path: '/help' },
      { label: 'Contact Us', path: '/contact' },
      { label: 'System Status', path: '/status' },
      { label: 'Bug Reports', path: '/bugs' }
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'GDPR', path: '/gdpr' }
    ]
  };

  const socialLinks = [
    { icon: <Facebook />, url: 'https://facebook.com/excellencehub', label: 'Facebook' },
    { icon: <Twitter />, url: 'https://twitter.com/excellencehub', label: 'Twitter' },
    { icon: <LinkedIn />, url: 'https://linkedin.com/company/excellencehub', label: 'LinkedIn' },
    { icon: <Instagram />, url: 'https://instagram.com/excellencehub', label: 'Instagram' },
    { icon: <YouTube />, url: 'https://youtube.com/excellencehub', label: 'YouTube' }
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'grey.900',
        color: 'white',
        pt: 6,
        pb: 3
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h5"
              component="div"
              gutterBottom
              sx={{ fontWeight: 700, color: '#FFD700' }}
            >
              Excellence Hub
            </Typography>
            
            <Typography
              variant="body2"
              sx={{ mb: 3, lineHeight: 1.7, color: 'grey.300' }}
            >
              Empowering learners worldwide with cutting-edge online education, 
              AI-powered personalization, and expert-led courses designed for 
              the future of work.
            </Typography>

            {/* Contact Info */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Email sx={{ mr: 1, fontSize: 18, color: 'grey.400' }} />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  support@excellencehub.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Phone sx={{ mr: 1, fontSize: 18, color: 'grey.400' }} />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  +1 (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 1, fontSize: 18, color: 'grey.400' }} />
                <Typography variant="body2" sx={{ color: 'grey.300' }}>
                  San Francisco, CA, USA
                </Typography>
              </Box>
            </Box>

            {/* Social Links */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'grey.300' }}>
                Follow Us
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {socialLinks.map((social, index) => (
                  <IconButton
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'grey.400',
                      '&:hover': {
                        color: '#FFD700',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: 600, color: 'white' }}
                >
                  Platform
                </Typography>
                <Box>
                  {footerLinks.platform.map((link, index) => (
                    <Link
                      key={index}
                      component={RouterLink}
                      to={link.path}
                      sx={{
                        display: 'block',
                        color: 'grey.300',
                        textDecoration: 'none',
                        mb: 1,
                        fontSize: '0.875rem',
                        '&:hover': {
                          color: '#FFD700',
                          textDecoration: 'underline'
                        },
                        transition: 'color 0.3s ease'
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: 600, color: 'white' }}
                >
                  Company
                </Typography>
                <Box>
                  {footerLinks.company.map((link, index) => (
                    <Link
                      key={index}
                      component={RouterLink}
                      to={link.path}
                      sx={{
                        display: 'block',
                        color: 'grey.300',
                        textDecoration: 'none',
                        mb: 1,
                        fontSize: '0.875rem',
                        '&:hover': {
                          color: '#FFD700',
                          textDecoration: 'underline'
                        },
                        transition: 'color 0.3s ease'
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: 600, color: 'white' }}
                >
                  Support
                </Typography>
                <Box>
                  {footerLinks.support.map((link, index) => (
                    <Link
                      key={index}
                      component={RouterLink}
                      to={link.path}
                      sx={{
                        display: 'block',
                        color: 'grey.300',
                        textDecoration: 'none',
                        mb: 1,
                        fontSize: '0.875rem',
                        '&:hover': {
                          color: '#FFD700',
                          textDecoration: 'underline'
                        },
                        transition: 'color 0.3s ease'
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: 600, color: 'white' }}
                >
                  Legal
                </Typography>
                <Box>
                  {footerLinks.legal.map((link, index) => (
                    <Link
                      key={index}
                      component={RouterLink}
                      to={link.path}
                      sx={{
                        display: 'block',
                        color: 'grey.300',
                        textDecoration: 'none',
                        mb: 1,
                        fontSize: '0.875rem',
                        '&:hover': {
                          color: '#FFD700',
                          textDecoration: 'underline'
                        },
                        transition: 'color 0.3s ease'
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* Newsletter Signup */}
          <Grid item xs={12} md={2}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: 600, color: 'white' }}
            >
              Stay Updated
            </Typography>
            
            <Typography
              variant="body2"
              sx={{ mb: 2, color: 'grey.300', lineHeight: 1.6 }}
            >
              Get the latest courses and updates delivered to your inbox.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Enter your email"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFD700'
                    }
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              />
              <Button
                variant="contained"
                endIcon={<Send />}
                sx={{
                  bgcolor: '#FFD700',
                  color: 'black',
                  '&:hover': {
                    bgcolor: '#FFC107'
                  }
                }}
              >
                Subscribe
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'grey.700' }} />

        {/* Bottom Footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ color: 'grey.400' }}>
            © {currentYear} Excellence Coaching Hub. All rights reserved.
          </Typography>
          
          <Typography variant="body2" sx={{ color: 'grey.400' }}>
            Made with ❤️ for learners worldwide
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
