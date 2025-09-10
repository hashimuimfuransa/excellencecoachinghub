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
  Zoom,
  Slide,
  useTheme,
} from '@mui/material';
import {
  ContactSupport,
  Close,
  Email,
  Phone,
  WhatsApp,
  LocationOn,
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
  const theme = useTheme();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
      description: '+250788535156',
      action: () => window.open('tel:+250788535156', '_blank'),
    },
    {
      icon: <WhatsApp sx={{ color: '#25D366' }} />,
      title: 'WhatsApp',
      description: 'Chat with us instantly',
      action: () => window.open('https://wa.me/250788535156?text=Hello%20Excellence%20Coaching%20Hub', '_blank'),
    },
   
  ];

  const socialMedia = [
    {
      icon: <Facebook sx={{ color: '#1877F2' }} />,
      title: 'Facebook',
      subtitle: '@excellencecoachinghub',
      action: () => window.open('https://facebook.com/excellencecoachinghub', '_blank'),
    },
    {
      icon: <LinkedIn sx={{ color: '#0A66C2' }} />,
      title: 'LinkedIn',
      subtitle: 'excellence coachinghub',
      action: () => window.open('https://www.linkedin.com/in/excellence-coachinghub-1b8b1a380?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', '_blank'),
    },
    {
      icon: <Twitter sx={{ color: '#1DA1F2' }} />,
      title: 'Twitter',
      subtitle: '@ECH_coachinghub',
      action: () => window.open('https://x.com/ECH_coachinghub?t=Awf4GVPp9eCkSZhDlHkFew&s=08', '_blank'),
    },
    {
      icon: <Instagram sx={{ color: '#E4405F' }} />,
      title: 'Instagram',
      subtitle: '@excellencecoachinghub',
      action: () => window.open('https://www.instagram.com/excellencecoachinghub/?utm_source=qr&igsh=Ym5xMXh5aXZmNHVi#', '_blank'),
    },
    {
      icon: <VideoLibrary sx={{ color: '#ff0050' }} />,
      title: 'TikTok',
      subtitle: '@excellence.coachi4',
      action: () => window.open('https://www.tiktok.com/@excellence.coachi4?_t=ZM-8zCgEouFb8w&_r=1', '_blank'),
    },
  ];

  return (
    <>
      {/* Floating Action Button with Animated Text */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 90, md: 100 },
          right: 24,
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Animated Text Label */}
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            x: [20, 0, 0, 20],
            scale: [0.8, 1, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        >
          <Box
            sx={{
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #1a1a2e, #16213e)'
                : 'linear-gradient(45deg, #ffffff, #f8f9fa)',
              color: theme.palette.mode === 'dark' ? '#4ade80' : '#22c55e',
              px: 2,
              py: 1,
              borderRadius: '20px',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                : '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                whiteSpace: 'nowrap',
              }}
            >
              Contact Us!
            </Typography>
          </Box>
        </motion.div>

        {/* Floating Action Button */}
        <Tooltip title="Contact Us" arrow placement="left">
          <Zoom in timeout={500}>
            <Fab
              component={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              color="secondary"
              onClick={handleOpen}
              sx={{
                background: 'linear-gradient(45deg, #ff6b6b, #ff8e53)',
                boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #ff5252, #ff7043)',
                  boxShadow: '0 12px 35px rgba(255, 107, 107, 0.6)',
                },
              }}
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
              >
                <ContactSupport />
              </motion.div>
            </Fab>
          </Zoom>
        </Tooltip>
      </Box>

      {/* Contact Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.5)'
              : '0 20px 60px rgba(0, 0, 0, 0.15)',
          },
        }}
        TransitionComponent={Slide}
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
            py: 3,
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
            }}
          >
            <Close />
          </IconButton>
          <Typography variant="h5" fontWeight={700}>
            Get in Touch
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            We're here to help you succeed!
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Contact Methods */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
              Contact Methods
            </Typography>
            <List>
              {contactMethods.map((method, index) => (
                <ListItem
                  key={index}
                  component={motion.div}
                  whileHover={{ x: 5 }}
                  button
                  onClick={method.action}
                  sx={{
                    borderRadius: '12px',
                    mb: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {method.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={method.title}
                    secondary={method.description}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider />

          {/* Business Hours */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
              Business Hours
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Schedule color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Monday - Friday: 8:00 AM - 6:00 PM (CAT)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Saturday: 9:00 AM - 4:00 PM (CAT)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sunday: Closed
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Location */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
              Location
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Kigali, Rwanda
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Serving clients across East Africa and globally
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Social Media */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
              Follow Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {socialMedia.map((social, index) => (
                <Box
                  key={index}
                  component={motion.div}
                  whileHover={{ x: 5 }}
                  onClick={social.action}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    },
                  }}
                >
                  <Box sx={{ mr: 2, display: 'flex', minWidth: 24 }}>
                    {social.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                      {social.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                      {social.subtitle}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
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