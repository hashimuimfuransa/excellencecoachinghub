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
        { text: 'Companies', icon: <Business />, path: '/companies' },
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
        mt: 'auto',
        pt: 8,
        pb: 4,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Glassmorphism Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-30px) rotate(180deg)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '3%',
          width: 150,
          height: 150,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'float 8s ease-in-out infinite reverse',
          transform: 'rotate(45deg)'
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Main Footer Content */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Box 
              sx={{ 
                mb: 4,
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 25%, #bbdefb 50%, #90caf9 75%, #64b5f6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(255, 255, 255, 0.5)',
                  mb: 3,
                  fontSize: '2rem'
                }}
              >
                Excellence Hub
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 3, 
                  opacity: 0.95, 
                  lineHeight: 1.7,
                  fontSize: '1.05rem',
                  color: '#f8fafc' 
                }}
              >
                🚀 The next-generation AI-powered learning platform transforming careers across Africa. Experience immersive education with personalized learning paths, expert mentorship, and cutting-edge technology designed for the future workforce.
              </Typography>
              
              {/* Enhanced Social Links */}
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 700,
                    color: '#FFD700',
                    fontSize: '1.1rem'
                  }}
                >
                  🌟 Connect With Us
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {socialLinks.map((social, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        p: 2,
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.2)',
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 25px rgba(255, 255, 255, 0.1)'
                        }
                      }}
                      onClick={() => window.open(social.url, '_blank')}
                    >
                      <IconButton
                        sx={{
                          color: 'white',
                          backgroundColor: 'rgba(255, 215, 0, 0.2)',
                          width: 40,
                          height: 40,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 215, 0, 0.3)',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.3s'
                        }}
                        aria-label={social.label}
                      >
                        {social.icon}
                      </IconButton>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                          {social.label}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
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

        {/* Ultra-Modern Newsletter Signup */}
        <Box
          sx={{
            p: 6,
            mb: 6,
            background: `
              linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%),
              radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%)
            `,
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Floating Elements */}
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(255, 215, 0, 0.2)',
              animation: 'float 4s ease-in-out infinite'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: 30,
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.15)',
              animation: 'float 6s ease-in-out infinite reverse'
            }}
          />

          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA726 50%, #FF7043 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3
            }}
          >
            🚀 Join the Future of Learning
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.95, lineHeight: 1.6, maxWidth: 600, mx: 'auto' }}>
            Get exclusive access to cutting-edge courses, AI-powered insights, and career opportunities delivered directly to your inbox.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, maxWidth: 500, mx: 'auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <input
                type="email"
                placeholder="Enter your email for exclusive updates"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  outline: 'none',
                  fontSize: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#333',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(255, 255, 255, 0.1)'
                }}
              />
            </Box>
            <button
              style={{
                padding: '16px 32px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }}
            >
              Subscribe Now
            </button>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 3 }} />

        {/* Modern Bottom Footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 3,
            p: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              opacity: 0.9, 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            © {new Date().getFullYear()} Excellence Hub. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { text: 'Privacy', href: '/privacy' },
              { text: 'Terms', href: '/terms' },
              { text: 'Security', href: '/security' },
              { text: 'Accessibility', href: '/accessibility' }
            ].map((link, index) => (
              <Link
                key={index}
                href={link.href}
                color="inherit"
                underline="none"
                sx={{ 
                  opacity: 0.9, 
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 1,
                    color: '#FFD700',
                    background: 'rgba(255, 215, 0, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {link.text}
              </Link>
            ))}
          </Box>
        </Box>

        {/* Enhanced "Made with love" section */}
        <Box 
          sx={{ 
            textAlign: 'center', 
            mt: 4, 
            pt: 3, 
            borderTop: '1px solid rgba(255,255,255,0.15)',
            position: 'relative'
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              opacity: 0.8, 
              fontSize: '1rem',
              fontWeight: 500,
              background: 'linear-gradient(135deg, #ffffff 0%, #FFD700 50%, #ffffff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            ✨ Built with passion for the future of education in Africa ✨
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              opacity: 0.6, 
              fontSize: '0.9rem',
              mt: 1 
            }}
          >
            Empowering minds, transforming careers, building tomorrow's leaders
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;