import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  Email,
  Phone,
  LocationOn,
  Work,
  School,
  Business,
  Support,
  Info,
  Security,
  Policy,
  Gavel
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { text: 'Find Jobs', icon: <Work />, path: '/app/jobs' },
        { text: 'Get Certified', icon: <School />, path: '/app/certificates' },
        // { text: 'Companies', icon: <Business />, path: '/companies' },  // Removed - Companies page no longer available
        { text: 'AI Interview Coach', icon: <Support />, path: '/app/interviews' }
      ]
    },
    {
      title: 'Support',
      links: [
        { text: 'Help Center', icon: <Support />, path: '/support' },
        { text: 'Contact Us', icon: <Email />, path: '/contact' },
        { text: 'About Us', icon: <Info />, path: '/about' },
        { text: 'Career Tips', icon: <School />, path: '/blog' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { text: 'Privacy Policy', icon: <Policy />, path: '/privacy' },
        { text: 'Terms of Service', icon: <Gavel />, path: '/terms' },
        { text: 'Security', icon: <Security />, path: '/security' },
        { text: 'Cookie Policy', icon: <Info />, path: '/cookies' }
      ]
    }
  ];

  const socialLinks = [
    { icon: <Facebook />, url: 'https://facebook.com/excellencecoachinghub', label: 'Facebook', username: '@excellencecoachinghub' },
    { icon: <Twitter />, url: 'https://x.com/ECH_coachinghub?t=Awf4GVPp9eCkSZhDlHkFew&s=08', label: 'Twitter', username: '@ECH_coachinghub' },
    { icon: <LinkedIn />, url: 'https://www.linkedin.com/in/excellence-coachinghub-1b8b1a380?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', label: 'LinkedIn', username: 'Excellence Coaching Hub' },
    { icon: <Instagram />, url: 'https://www.instagram.com/excellencecoachinghub/?utm_source=qr&igsh=Ym5xMXh5aXZmNHVi#', label: 'Instagram', username: '@excellencecoachinghub' }
  ];

  const contactInfo = [
    { icon: <Email />, text: 'info@excellencecoachinghub.com', href: 'mailto:info@excellencecoachinghub.com' },
    { icon: <Phone />, text: '+250 788 123 456', href: 'tel:+250788123456' },
    { icon: <LocationOn />, text: 'Kigali, Rwanda (HQ) • Serving All of Africa', href: '#' }
  ];

  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
        color: 'white',
        mt: 'auto',
        pt: 6,
        pb: 3
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #81c784 30%, #a5d6a7 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                ExJobNet
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, lineHeight: 1.6 }}>
                ExJobNet is a dynamic career platform combining the best of professional networking and job readiness—offering features like personalized profiles, interactive job preparation tools, live coaching, and secure certifications to empower both individuals and organizations in Africa's job ecosystem.
              </Typography>
              
              {/* Social Links */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9, fontWeight: 'bold' }}>
                  Follow Us
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {socialLinks.map((social, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <IconButton
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          width: 36,
                          height: 36,
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.3s'
                        }}
                        aria-label={social.label}
                      >
                        {social.icon}
                      </IconButton>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                          {social.label}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.75rem' }}>
                          {social.username}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Contact Info */}
              <Box>
                {contactInfo.map((contact, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ mr: 2, opacity: 0.8 }}>
                      {contact.icon}
                    </Box>
                    <Link
                      href={contact.href}
                      color="inherit"
                      underline="hover"
                      sx={{ opacity: 0.9, fontSize: '0.9rem' }}
                    >
                      {contact.text}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Footer Links */}
          {footerSections.map((section, sectionIndex) => (
            <Grid item xs={12} sm={6} md={2.67} key={sectionIndex}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                {section.title}
              </Typography>
              <List dense sx={{ p: 0 }}>
                {section.links.map((link, linkIndex) => (
                  <ListItem
                    key={linkIndex}
                    sx={{
                      p: 0,
                      mb: 0.5,
                      cursor: 'pointer',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        pl: 1
                      },
                      transition: 'all 0.3s'
                    }}
                    onClick={() => navigate(link.path)}
                  >
                    <Box sx={{ mr: 1, opacity: 0.8, fontSize: '1.2rem' }}>
                      {link.icon}
                    </Box>
                    <ListItemText
                      primary={link.text}
                      primaryTypographyProps={{
                        sx: { 
                          fontSize: '0.9rem',
                          opacity: 0.9,
                          '&:hover': { opacity: 1 }
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          ))}
        </Grid>

        {/* Newsletter Signup */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Stay Updated with Career Opportunities
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
            Get the latest job openings, career tips, and industry insights delivered to your inbox.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, maxWidth: 400, mx: 'auto', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <input
                type="email"
                placeholder="Enter your email address"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: '#333'
                }}
              />
            </Box>
            <button
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#81c784',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#66bb6a';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#81c784';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Subscribe
            </button>
          </Box>
        </Paper>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 3 }} />

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
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © {new Date().getFullYear()} ExJobNet. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Link
              href="/privacy"
              color="inherit"
              underline="hover"
              sx={{ opacity: 0.8, fontSize: '0.875rem' }}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              color="inherit"
              underline="hover"
              sx={{ opacity: 0.8, fontSize: '0.875rem' }}
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              color="inherit"
              underline="hover"
              sx={{ opacity: 0.8, fontSize: '0.875rem' }}
            >
              Cookies
            </Link>
            <Link
              href="/accessibility"
              color="inherit"
              underline="hover"
              sx={{ opacity: 0.8, fontSize: '0.875rem' }}
            >
              Accessibility
            </Link>
          </Box>
        </Box>

        {/* Made with love */}
        <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.8rem' }}>
            Made with ❤️ for career success worldwide
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;