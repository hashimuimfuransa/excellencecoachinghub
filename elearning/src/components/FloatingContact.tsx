import React, { useState } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
  Collapse,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { SafeSlideTransition, SimpleFadeTransition } from '../utils/transitionFix';

const Zoom = SimpleFadeTransition;
import {
  ContactSupport,
  Close,
  Email,
  Phone,
  WhatsApp,
  LocationOn,
  Telegram,
  Facebook,
  LinkedIn,
  Twitter,
  Instagram,
  VideoLibrary,
  Schedule,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const FloatingContact: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showText, setShowText] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Show text on hover for desktop
  const handleMouseEnter = () => {
    if (!isMobile) {
      setShowText(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowText(false);
    }
  };

  const contactMethods = [
    {
      icon: <Email color="primary" />,
      title: 'Email Us',
      description: 'info@excellencecoachinghub.com',
      action: () => window.open('mailto:info@excellencecoachinghub.com', '_blank'),
    },
    {
      icon: <Phone color="primary" />,
      title: 'Call Us',
      description: '+250 788 123 456',
      action: () => window.open('tel:+250788123456', '_blank'),
    },
    {
      icon: <WhatsApp sx={{ color: '#25D366' }} />,
      title: 'WhatsApp',
      description: 'Chat with us instantly',
      action: () => window.open('https://wa.me/250788123456?text=Hello%20Excellence%20Coaching%20Hub', '_blank'),
    },
    {
      icon: <Telegram sx={{ color: '#0088cc' }} />,
      title: 'Telegram',
      description: 'Join our Telegram channel',
      action: () => window.open('https://t.me/excellencecoachinghub', '_blank'),
    },
  ];

  const socialMedia = [
    {
      icon: <Facebook sx={{ color: '#1877F2' }} />,
      title: 'Facebook',
      action: () => window.open('https://facebook.com/excellencecoachinghub', '_blank'),
    },
    {
      icon: <LinkedIn sx={{ color: '#0A66C2' }} />,
      title: 'LinkedIn',
      action: () => window.open('https://www.linkedin.com/in/excellence-coachinghub-1b8b1a380?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', '_blank'),
    },
    {
      icon: <Twitter sx={{ color: '#1DA1F2' }} />,
      title: 'Twitter',
      action: () => window.open('https://x.com/ECH_coachinghub?t=Awf4GVPp9eCkSZhDlHkFew&s=08', '_blank'),
    },
    {
      icon: <Instagram sx={{ color: '#E4405F' }} />,
      title: 'Instagram',
      action: () => window.open('https://www.instagram.com/excellencecoachinghub/?utm_source=qr&igsh=Ym5xMXh5aXZmNHVi#', '_blank'),
    },
    {
      icon: <VideoLibrary sx={{ color: '#ff0050' }} />,
      title: 'TikTok',
      action: () => window.open('https://www.tiktok.com/@excellence.coachi4?_t=ZM-8zCgEouFb8w&_r=1', '_blank'),
    },
  ];

  return (
    <>
      {/* Responsive Floating Action Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 20, md: 24 },
          right: { xs: 16, sm: 20, md: 24 },
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0, sm: 1 },
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Conditional Text Label - Only show on hover for desktop */}
        <Collapse in={showText} orientation="horizontal" timeout={300}>
          <Box
            sx={{
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #1a1a2e, #16213e)'
                : 'linear-gradient(45deg, #ffffff, #f8f9fa)',
              color: theme.palette.mode === 'dark' ? '#4ade80' : '#22c55e',
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              borderRadius: '20px',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                : '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              backdropFilter: 'blur(10px)',
              mr: 1,
            }}
          >
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem' },
                whiteSpace: 'nowrap',
              }}
            >
              {isMobile ? 'Contact' : 'Contact Us!'}
            </Typography>
          </Box>
        </Collapse>

        {/* Responsive Floating Action Button */}
        <Tooltip title={isMobile ? "Contact Us" : ""} arrow placement="left">
          <Zoom in timeout={500}>
            <Fab
              component={motion.button}
              whileHover={{ scale: isMobile ? 1.05 : 1.1 }}
              whileTap={{ scale: 0.95 }}
              color="secondary"
              onClick={handleOpen}
              size={isMobile ? "medium" : "large"}
              sx={{
                background: 'linear-gradient(45deg, #ff6b6b, #ff8e53)',
                boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
                width: { xs: 48, sm: 56, md: 64 },
                height: { xs: 48, sm: 56, md: 64 },
                '&:hover': {
                  background: 'linear-gradient(45deg, #ff5252, #ff7043)',
                  boxShadow: '0 12px 35px rgba(255, 107, 107, 0.6)',
                },
              }}
            >
              <motion.div
                animate={!isMobile ? {
                  rotate: [0, 10, -10, 0],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
              >
                <ContactSupport sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }} />
              </motion.div>
            </Fab>
          </Zoom>
        </Tooltip>
      </Box>

      {/* Responsive Contact Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={isMobile ? "xs" : isTablet ? "sm" : "md"}
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '20px',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.5)'
              : '0 20px 60px rgba(0, 0, 0, 0.15)',
            maxHeight: isMobile ? '100vh' : '90vh',
            margin: isMobile ? 0 : '32px',
          },
        }}
        TransitionComponent={SafeSlideTransition}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(45deg, #22c55e, #4ade80)',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            py: { xs: 2, sm: 2.5, md: 3 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: { xs: 8, sm: 12 },
              top: { xs: 8, sm: 12 },
              color: 'white',
              p: { xs: 0.5, sm: 1 },
            }}
          >
            <Close sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
          </IconButton>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            fontWeight={700}
            sx={{ pr: { xs: 4, sm: 6 } }}
          >
            Get in Touch
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 1, 
              opacity: 0.9,
              fontSize: { xs: '0.8rem', sm: '0.9rem' }
            }}
          >
            We're here to help you succeed!
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 0, maxHeight: isMobile ? 'calc(100vh - 120px)' : '70vh', overflow: 'auto' }}>
          <Grid container spacing={0}>
            {/* Contact Methods - Left Column */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                  Contact Methods
                </Typography>
                <List dense={isMobile}>
                  {contactMethods.map((method, index) => (
                    <ListItem
                      key={index}
                      component={motion.div}
                      whileHover={{ x: 5 }}
                      button
                      onClick={method.action}
                      sx={{
                        borderRadius: '12px',
                        mb: 0.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.05)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}>
                        {method.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={method.title}
                        secondary={method.description}
                        primaryTypographyProps={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                        secondaryTypographyProps={{
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>

            {/* Business Info - Right Column */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Business Hours */}
                <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                  Business Hours
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Schedule color="primary" sx={{ mr: 1.5, mt: 0.5, fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                      Mon-Fri: 8:00 AM - 6:00 PM
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                      Saturday: 9:00 AM - 4:00 PM
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                      Sunday: Closed
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Location */}
                <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                  Location
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <LocationOn color="primary" sx={{ mr: 1.5, mt: 0.5, fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                      Kigali, Rwanda
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                      Serving East Africa & globally
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Social Media - Full Width */}
            <Grid item xs={12}>
              <Divider />
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={600} sx={{ mb: 2, color: 'primary.main', textAlign: 'center' }}>
                  Follow Us
                </Typography>
                <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {socialMedia.map((social, index) => (
                    <Tooltip key={index} title={social.title} arrow>
                      <IconButton
                        component={motion.button}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={social.action}
                        sx={{
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          p: { xs: 1, sm: 1.5 },
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        {React.cloneElement(social.icon, { 
                          sx: { fontSize: { xs: '1.2rem', sm: '1.5rem' } } 
                        })}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
          <Button
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClose}
            variant="contained"
            fullWidth
            sx={{
              background: 'linear-gradient(45deg, #22c55e, #4ade80)',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.9rem', sm: '1rem' },
              '&:hover': {
                background: 'linear-gradient(45deg, #16a34a, #22c55e)',
                boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FloatingContact;