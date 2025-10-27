import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Paper,
  LinearProgress,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Search,
  TrendingUp,
  School,
  Work,
  Code,
  DesignServices,
  Business,
  Psychology,
  Science,
  Language,
  Computer,
  Analytics,
  Palette,
  Camera,
  MusicNote,
  Engineering,
  ExpandMore,
  Star,
  BookmarkBorder,
  Bookmark,
  PlayArrow,
  Assignment,
  CheckCircle,
  Timeline,
  EmojiEvents,
  Add,
  AutoAwesome,
  Lightbulb,
  Group,
  Quiz,
  MenuBook,
  AccountBalance,
  LocalHospital,
  Construction,
  Restaurant,
  Flight,
  Gavel,
  AccountBalanceWallet,
  Public,
  SupportAgent,
  Handyman,
  Agriculture,
  LocalShipping
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import FloatingChatButton from '../components/chat/FloatingChatButton';
import FloatingContact from '../components/FloatingContact';

interface Skill {
  id: string;
  name: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  description: string;
  demandLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  averageSalary?: string;
  relatedJobs: string[];
  learningResources: {
    courses: number;
    certifications: number;
    practice: number;
  };
  icon?: React.ReactNode;
  trending?: boolean;
  inDemand?: boolean;
}

interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  skillCount: number;
  avgSalary?: string;
}

const SkillsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedSkills, setSavedSkills] = useState<string[]>([]);
  const [skillDetailDialog, setSkillDetailDialog] = useState<Skill | null>(null);

  // Sample skill categories with modern icons and colors
  const skillCategories: SkillCategory[] = [
    {
      id: 'all',
      name: 'All Skills',
      description: 'Browse all available skills',
      icon: <AutoAwesome />,
      color: '#6366f1',
      skillCount: 150
    },
    {
      id: 'technology',
      name: 'Technology',
      description: 'Programming, software development, IT',
      icon: <Computer />,
      color: '#3b82f6',
      skillCount: 45,
      avgSalary: '$75,000'
    },
    {
      id: 'design',
      name: 'Design',
      description: 'UI/UX, graphic design, creative',
      icon: <Palette />,
      color: '#ec4899',
      skillCount: 25,
      avgSalary: '$65,000'
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Management, strategy, analytics',
      icon: <Business />,
      color: '#059669',
      skillCount: 30,
      avgSalary: '$80,000'
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Digital marketing, content, social media',
      icon: <TrendingUp />,
      color: '#f59e0b',
      skillCount: 20,
      avgSalary: '$60,000'
    },
    {
      id: 'data',
      name: 'Data Science',
      description: 'Analytics, machine learning, statistics',
      icon: <Analytics />,
      color: '#8b5cf6',
      skillCount: 18,
      avgSalary: '$95,000'
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      description: 'Medical, nursing, health technology',
      icon: <LocalHospital />,
      color: '#ef4444',
      skillCount: 15,
      avgSalary: '$70,000'
    },
    {
      id: 'finance',
      name: 'Finance',
      description: 'Banking, investment, accounting',
      icon: <AccountBalanceWallet />,
      color: '#10b981',
      skillCount: 22,
      avgSalary: '$85,000'
    },
    {
      id: 'education',
      name: 'Education',
      description: 'Teaching, training, curriculum',
      icon: <School />,
      color: '#f97316',
      skillCount: 12,
      avgSalary: '$50,000'
    }
  ];

  // Sample skills data
  const sampleSkills: Skill[] = [
    {
      id: '1',
      name: 'React Development',
      category: 'technology',
      level: 'Intermediate',
      description: 'Build modern web applications using React framework',
      demandLevel: 'Very High',
      averageSalary: '$80,000',
      relatedJobs: ['Frontend Developer', 'Full Stack Developer', 'React Developer'],
      learningResources: { courses: 45, certifications: 8, practice: 120 },
      icon: <Code />,
      trending: true,
      inDemand: true
    },
    {
      id: '2',
      name: 'UI/UX Design',
      category: 'design',
      level: 'Intermediate',
      description: 'Design user-friendly interfaces and experiences',
      demandLevel: 'High',
      averageSalary: '$70,000',
      relatedJobs: ['UI Designer', 'UX Designer', 'Product Designer'],
      learningResources: { courses: 35, certifications: 12, practice: 80 },
      icon: <DesignServices />,
      trending: true
    },
    {
      id: '3',
      name: 'Data Analysis',
      category: 'data',
      level: 'Advanced',
      description: 'Analyze and interpret complex data sets',
      demandLevel: 'Very High',
      averageSalary: '$90,000',
      relatedJobs: ['Data Analyst', 'Business Analyst', 'Data Scientist'],
      learningResources: { courses: 28, certifications: 15, practice: 95 },
      icon: <Analytics />,
      trending: true,
      inDemand: true
    },
    {
      id: '4',
      name: 'Digital Marketing',
      category: 'marketing',
      level: 'Beginner',
      description: 'Promote products and services through digital channels',
      demandLevel: 'High',
      averageSalary: '$55,000',
      relatedJobs: ['Digital Marketer', 'Marketing Specialist', 'Content Manager'],
      learningResources: { courses: 40, certifications: 10, practice: 60 },
      icon: <TrendingUp />,
      trending: false
    },
    {
      id: '5',
      name: 'Project Management',
      category: 'business',
      level: 'Advanced',
      description: 'Plan, execute, and manage projects effectively',
      demandLevel: 'High',
      averageSalary: '$85,000',
      relatedJobs: ['Project Manager', 'Program Manager', 'Scrum Master'],
      learningResources: { courses: 30, certifications: 20, practice: 70 },
      icon: <Business />,
      trending: false
    },
    {
      id: '6',
      name: 'Python Programming',
      category: 'technology',
      level: 'Intermediate',
      description: 'Develop applications and automate tasks with Python',
      demandLevel: 'Very High',
      averageSalary: '$85,000',
      relatedJobs: ['Python Developer', 'Backend Developer', 'Data Engineer'],
      learningResources: { courses: 50, certifications: 12, practice: 150 },
      icon: <Code />,
      trending: true,
      inDemand: true
    }
  ];

  const [skills] = useState<Skill[]>(sampleSkills);

  // Filter skills based on category and search
  const filteredSkills = skills.filter(skill => {
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSaveSkill = (skillId: string) => {
    setSavedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'Very High': return '#ef4444';
      case 'High': return '#f59e0b';
      case 'Medium': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Expert': return '#7c3aed';
      case 'Advanced': return '#dc2626';
      case 'Intermediate': return '#f59e0b';
      default: return '#059669';
    }
  };

  return (
    <>
      <Navbar />
      
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', pb: 4 }}>
        <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
          {/* Header Section */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 800, 
                mb: 2,
                background: 'linear-gradient(45deg, #6366f1 30%, #3b82f6 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              Skills & Learning Hub
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}
            >
              Discover in-demand skills, track your progress, and accelerate your career growth
            </Typography>
          </Box>

          {/* Search Bar */}
          <Box sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            <TextField
              fullWidth
              placeholder="Search skills, technologies, or career paths..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3 }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                }
              }}
            />
          </Box>

          {/* Skill Categories */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
              Explore Skill Categories
            </Typography>
            <Grid container spacing={2}>
              {skillCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: selectedCategory === category.id ? `2px solid ${category.color}` : '1px solid transparent',
                      background: selectedCategory === category.id 
                        ? `linear-gradient(135deg, ${alpha(category.color, 0.1)} 0%, ${alpha(category.color, 0.05)} 100%)`
                        : 'background.paper',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        border: `2px solid ${category.color}`
                      }
                    }}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          mx: 'auto',
                          mb: 2,
                          bgcolor: category.color,
                          boxShadow: `0 4px 20px ${alpha(category.color, 0.3)}`
                        }}
                      >
                        {category.icon}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {category.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={`${category.skillCount} skills`}
                          size="small"
                          sx={{ 
                            bgcolor: alpha(category.color, 0.1), 
                            color: category.color,
                            fontWeight: 600
                          }}
                        />
                        {category.avgSalary && (
                          <Chip
                            label={category.avgSalary}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Skills List */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedCategory === 'all' ? 'All Skills' : 
                 skillCategories.find(cat => cat.id === selectedCategory)?.name + ' Skills'}
                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 2 }}>
                  ({filteredSkills.length} skills found)
                </Typography>
              </Typography>
              
              {user && (
                <Button
                  variant="outlined"
                  startIcon={<Bookmark />}
                  onClick={() => navigate('/app/profile')}
                  sx={{ borderRadius: 2 }}
                >
                  My Skills ({savedSkills.length})
                </Button>
              )}
            </Box>

            <Grid container spacing={3}>
              {filteredSkills.map((skill) => (
                <Grid item xs={12} md={6} lg={4} key={skill.id}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: theme.shadows[8],
                        transform: 'translateY(-2px)'
                      },
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      position: 'relative',
                      overflow: 'visible'
                    }}
                  >
                    {/* Trending/In-Demand Badge */}
                    {skill.trending && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: 16,
                          zIndex: 1
                        }}
                      >
                        <Chip
                          label="Trending"
                          size="small"
                          color="error"
                          icon={<TrendingUp fontSize="small" />}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    )}
                    
                    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: 'primary.main'
                            }}
                          >
                            {skill.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {skill.name}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={skill.level}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getLevelColor(skill.level), 0.1),
                                  color: getLevelColor(skill.level),
                                  fontWeight: 600,
                                  fontSize: '0.7rem'
                                }}
                              />
                              <Chip
                                label={skill.demandLevel}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getDemandColor(skill.demandLevel), 0.1),
                                  color: getDemandColor(skill.demandLevel),
                                  fontWeight: 600,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Stack>
                          </Box>
                        </Box>
                        
                        <IconButton
                          onClick={() => toggleSaveSkill(skill.id)}
                          sx={{ color: savedSkills.includes(skill.id) ? 'primary.main' : 'text.secondary' }}
                        >
                          {savedSkills.includes(skill.id) ? <Bookmark /> : <BookmarkBorder />}
                        </IconButton>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flex: 1 }}>
                        {skill.description}
                      </Typography>

                      {/* Learning Resources */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                          Learning Resources
                        </Typography>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MenuBook fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {skill.learningResources.courses} Courses
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmojiEvents fontSize="small" color="warning" />
                            <Typography variant="body2">
                              {skill.learningResources.certifications} Certifications
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Quiz fontSize="small" color="success" />
                            <Typography variant="body2">
                              {skill.learningResources.practice} Practice Exercises
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* Bottom Section */}
                      <Box sx={{ mt: 'auto' }}>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                            Avg. Salary: {skill.averageSalary}
                          </Typography>
                          {skill.inDemand && (
                            <Chip
                              label="In Demand"
                              size="small"
                              color="success"
                              icon={<Star fontSize="small" />}
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                        
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PlayArrow />}
                            onClick={() => setSkillDetailDialog(skill)}
                            sx={{ borderRadius: 2, flex: 1 }}
                          >
                            Start Learning
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setSkillDetailDialog(skill)}
                            sx={{ borderRadius: 2 }}
                          >
                            Details
                          </Button>
                        </Stack>

                        <Typography variant="caption" color="text.secondary">
                          Related: {skill.relatedJobs.slice(0, 2).join(', ')}
                          {skill.relatedJobs.length > 2 && ` +${skill.relatedJobs.length - 2} more`}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredSkills.length === 0 && (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  No skills found
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Try adjusting your search or selecting a different category.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  Show All Skills
                </Button>
              </Box>
            )}
          </Box>

          {/* Call to Action Section */}
          {!user && (
            <Box sx={{ textAlign: 'center', py: 6, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 4, mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Ready to Start Learning?
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                Join our community to track your progress, get personalized recommendations, and unlock your potential.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={() => navigate('/register')}
                  sx={{ borderRadius: 3, px: 4, py: 1.5 }}
                >
                  Create Account
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ borderRadius: 3, px: 4, py: 1.5 }}
                >
                  Sign In
                </Button>
              </Stack>
            </Box>
          )}
        </Container>
      </Box>

      {/* Skill Detail Dialog */}
      <Dialog
        open={!!skillDetailDialog}
        onClose={() => setSkillDetailDialog(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        {skillDetailDialog && (
          <>
            <DialogTitle sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: 'primary.main'
                  }}
                >
                  {skillDetailDialog.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {skillDetailDialog.name}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={skillDetailDialog.level}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={skillDetailDialog.demandLevel}
                      size="small"
                      color="success"
                    />
                  </Stack>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body1" paragraph>
                {skillDetailDialog.description}
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Career Opportunities
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3, gap: 1 }}>
                {skillDetailDialog.relatedJobs.map((job, index) => (
                  <Chip
                    key={index}
                    label={job}
                    variant="outlined"
                    onClick={() => navigate('/?search=' + encodeURIComponent(job))}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Stack>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Learning Path
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                    <MenuBook sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {skillDetailDialog.learningResources.courses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Courses Available
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), borderRadius: 2 }}>
                    <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {skillDetailDialog.learningResources.certifications}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Certifications
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                    <Quiz sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {skillDetailDialog.learningResources.practice}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Practice Exercises
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                  Average Salary: {skillDetailDialog.averageSalary}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on current market data and job postings
                </Typography>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button
                onClick={() => setSkillDetailDialog(null)}
                sx={{ borderRadius: 2 }}
              >
                Close
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/?search=' + encodeURIComponent(skillDetailDialog.name))}
                sx={{ borderRadius: 2 }}
              >
                Find Jobs
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (user) {
                    // Navigate to learning platform or course
                    navigate('/app/courses');
                  } else {
                    navigate('/register');
                  }
                }}
                sx={{ borderRadius: 2 }}
                startIcon={<PlayArrow />}
              >
                Start Learning
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <FloatingChatButton />
      <FloatingContact />
    </>
  );
};

export default SkillsPage;