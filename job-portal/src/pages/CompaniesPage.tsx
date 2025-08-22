import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Rating,
  Skeleton,
  useTheme,
  alpha,
  Fade,
  Divider
} from '@mui/material';
import {
  Search,
  Business,
  LocationOn,
  People,
  Star,
  TrendingUp,
  Verified,
  ArrowForward,
  Work,
  FilterList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';

interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  location: string;
  employees: string;
  rating: number;
  description: string;
  openPositions: number;
  benefits: string[];
  verified: boolean;
}

const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [animationTrigger, setAnimationTrigger] = useState(false);

  useEffect(() => {
    setAnimationTrigger(true);
    // Simulate loading companies
    setTimeout(() => {
      setCompanies(mockCompanies);
      setLoading(false);
    }, 1000);
  }, []);

  const mockCompanies: Company[] = [
    {
      id: '1',
      name: 'TechCorp Solutions',
      logo: 'T',
      industry: 'Technology',
      location: 'San Francisco, CA',
      employees: '1,000-5,000',
      rating: 4.5,
      description: 'Leading software development company specializing in AI and cloud solutions.',
      openPositions: 25,
      benefits: ['Remote Work', 'Health Insurance', 'Stock Options', '401k'],
      verified: true
    },
    {
      id: '2',
      name: 'HealthFirst Medical',
      logo: 'H',
      industry: 'Healthcare',
      location: 'New York, NY',
      employees: '5,000-10,000',
      rating: 4.3,
      description: 'Premier healthcare provider focused on patient-centered care and innovation.',
      openPositions: 42,
      benefits: ['Medical Coverage', 'Continuing Education', 'Flexible Hours'],
      verified: true
    },
    {
      id: '3',
      name: 'FinanceHub Inc',
      logo: 'F',
      industry: 'Finance',
      location: 'Chicago, IL',
      employees: '500-1,000',
      rating: 4.2,
      description: 'Financial services company providing innovative banking and investment solutions.',
      openPositions: 18,
      benefits: ['Bonus Structure', 'Professional Development', 'Health Insurance'],
      verified: true
    },
    {
      id: '4',
      name: 'EduTech Innovations',
      logo: 'E',
      industry: 'Education',
      location: 'Austin, TX',
      employees: '100-500',
      rating: 4.6,
      description: 'Educational technology company transforming learning through digital platforms.',
      openPositions: 12,
      benefits: ['Learning Budget', 'Flexible PTO', 'Remote Options'],
      verified: false
    },
    {
      id: '5',
      name: 'Marketing Masters',
      logo: 'M',
      industry: 'Marketing',
      location: 'Los Angeles, CA',
      employees: '200-500',
      rating: 4.1,
      description: 'Full-service marketing agency specializing in digital campaigns and brand strategy.',
      openPositions: 8,
      benefits: ['Creative Freedom', 'Team Events', 'Performance Bonuses'],
      verified: true
    },
    {
      id: '6',
      name: 'Design Studio Pro',
      logo: 'D',
      industry: 'Design',
      location: 'Seattle, WA',
      employees: '50-100',
      rating: 4.4,
      description: 'Award-winning design studio creating exceptional user experiences and brands.',
      openPositions: 15,
      benefits: ['Design Tools Budget', 'Conference Attendance', 'Wellness Program'],
      verified: true
    }
  ];

  const industries = ['All', 'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Design'];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = selectedIndustry === '' || selectedIndustry === 'All' || company.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  const handleViewJobs = (companyId: string) => {
    navigate(`/app/jobs?company=${companyId}`);
  };

  return (
    <PublicLayout>
      <Box>
        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
            color: 'white',
            py: 8,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Fade in={animationTrigger} timeout={1000}>
              <Box textAlign="center">
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    mb: 2
                  }}
                >
                  Discover Amazing Companies
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4, 
                    opacity: 0.9,
                    maxWidth: '600px',
                    mx: 'auto'
                  }}
                >
                  Connect with top employers and find your next career opportunity
                </Typography>

                {/* Search Bar */}
                <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 1,
                      display: 'flex',
                      borderRadius: 3,
                      backgroundColor: alpha('#fff', 0.95)
                    }}
                  >
                    <TextField
                      fullWidth
                      placeholder="Search companies, industries, locations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: 'grey.500' }} />
                          </InputAdornment>
                        ),
                        sx: { 
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                        }
                      }}
                      sx={{ '& .MuiInputBase-input': { py: 1.5 } }}
                    />
                  </Paper>
                </Box>
              </Box>
            </Fade>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 6 }}>
          {/* Industry Filter */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList />
              Filter by Industry
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {industries.map((industry) => (
                <Chip
                  key={industry}
                  label={industry}
                  variant={selectedIndustry === industry ? "filled" : "outlined"}
                  color={selectedIndustry === industry ? "primary" : "default"}
                  onClick={() => setSelectedIndustry(industry === 'All' ? '' : industry)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      backgroundColor: selectedIndustry === industry ? undefined : alpha('#4caf50', 0.1)
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Companies Grid */}
          <Grid container spacing={3}>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Skeleton variant="circular" width={60} height={60} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="60%" height={32} />
                          <Skeleton variant="text" width="40%" height={20} />
                          <Skeleton variant="text" width="100%" height={20} />
                          <Skeleton variant="text" width="80%" height={20} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              filteredCompanies.map((company, index) => (
                <Grid item xs={12} md={6} key={company.id}>
                  <Fade in={true} timeout={500 + index * 100}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                          <Avatar
                            sx={{
                              width: 60,
                              height: 60,
                              bgcolor: 'primary.main',
                              fontSize: '1.5rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {company.logo}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6" fontWeight="bold">
                                {company.name}
                              </Typography>
                              {company.verified && (
                                <Verified sx={{ fontSize: 20, color: 'primary.main' }} />
                              )}
                            </Box>
                            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <Business sx={{ fontSize: 16 }} />
                              {company.industry}
                            </Typography>
                            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn sx={{ fontSize: 16 }} />
                              {company.location}
                            </Typography>
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                          {company.description}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Rating value={company.rating} precision={0.1} size="small" readOnly />
                            <Typography variant="body2" color="text.secondary">
                              {company.rating}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <People sx={{ fontSize: 16 }} />
                            {company.employees}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {company.benefits.slice(0, 3).map((benefit) => (
                            <Chip
                              key={benefit}
                              label={benefit}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                          {company.benefits.length > 3 && (
                            <Chip
                              label={`+${company.benefits.length - 3} more`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem', opacity: 0.7 }}
                            />
                          )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="primary" fontWeight="medium">
                            {company.openPositions} open positions
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            endIcon={<ArrowForward />}
                            onClick={() => handleViewJobs(company.id)}
                            sx={{ borderRadius: 2 }}
                          >
                            View Jobs
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              ))
            )}
          </Grid>

          {/* No Results */}
          {!loading && filteredCompanies.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Business sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No companies found
              </Typography>
              <Typography color="text.secondary">
                Try adjusting your search criteria or browse all companies
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedIndustry('');
                }}
              >
                Clear Filters
              </Button>
            </Box>
          )}

          {/* Call to Action */}
          {!loading && filteredCompanies.length > 0 && (
            <Box sx={{ textAlign: 'center', mt: 8, p: 4, bgcolor: alpha('#4caf50', 0.05), borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                Ready to Join These Amazing Companies?
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Create your profile and start applying to your dream jobs today
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{ borderRadius: 2 }}
                >
                  Create Account
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/app/jobs')}
                  sx={{ borderRadius: 2 }}
                >
                  Browse Jobs
                </Button>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </PublicLayout>
  );
};

export default CompaniesPage;