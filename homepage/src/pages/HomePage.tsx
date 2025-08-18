import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  Fab,
  Zoom,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  School,
  Work,
  Psychology,
  Verified,
  TrendingUp,
  Groups,
  Star,
  ArrowForward,
  PlayArrow,
  Email,
  Phone,
  LocationOn,
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  KeyboardArrowUp,
  AutoAwesome,
  EmojiEvents,
  Speed,
  Security,
} from '@mui/icons-material';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Components
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import HowItWorksSection from '../components/HowItWorksSection';
import PlatformLinksSection from '../components/PlatformLinksSection';
import TestimonialsSection from '../components/TestimonialsSection';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection onGetStarted={() => navigate('/register')} />

      {/* About Section */}
      <AboutSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Platform Links Section */}
      <PlatformLinksSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Footer */}
      <Footer />

      {/* Scroll to Top Button */}
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="medium"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default HomePage;