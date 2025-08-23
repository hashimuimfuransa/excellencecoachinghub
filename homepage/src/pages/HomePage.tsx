import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Zoom,
} from '@mui/material';
import {
  KeyboardArrowUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Components
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import ServicesSection from '../components/ServicesSection';
import TrendingJobsSection from '../components/TrendingJobsSection';
import HowItWorksSection from '../components/HowItWorksSection';
import PlatformLinksSection from '../components/PlatformLinksSection';
import TestimonialsSection from '../components/TestimonialsSection';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

const HomePage: React.FC = () => {
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection onGetStarted={() => navigate('/register')} />

      {/* About Section */}
      <AboutSection />

      {/* Services Section */}
      <ServicesSection />

      {/* Trending Jobs Section */}
      <TrendingJobsSection />

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