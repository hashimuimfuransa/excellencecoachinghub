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
import { useAuth } from '../contexts/AuthContext';

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
import TrendingCoursesSection from '../components/TrendingCoursesSection';
import FloatingContact from '../components/FloatingContact';
import FloatingAIAssistant from '../components/FloatingAIAssistant';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const handleGetStarted = () => {
    if (user) {
      // User is logged in, redirect to PostLogin page
      navigate('/dashboard');
    } else {
      // User is not logged in, redirect to register page
      navigate('/register');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />

      {/* About Section */}
      <AboutSection />

      {/* Services Section - Only show when user is not logged in */}
      {!user && <ServicesSection />}

      {/* Trending Jobs Section */}
      <TrendingJobsSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Platform Links Section */}
      <PlatformLinksSection />

      {/* Trending Courses Section */}
      <TrendingCoursesSection />

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
            bottom: { xs: 24, md: 24 },
            right: { xs: 24, md: 90 },
            zIndex: 1000,
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Zoom>

      {/* Floating Contact Component */}
      <FloatingContact />
      
      {/* Floating AI Assistant Component */}
      <FloatingAIAssistant />
    </Box>
  );
};

export default HomePage;