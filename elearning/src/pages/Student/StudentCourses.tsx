import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Stack,
  Tooltip,
  Badge,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import UnifiedLearningPage from './UnifiedLearningPage';
import {
  School,
  PlayArrow,
  Person,
  Schedule,
  Star,
  Search,
  FilterList,
  BookmarkBorder,
  Bookmark,
  TrendingUp,
  EmojiEvents,
  AccessTime,
  Group,
  CheckCircle,
  PlayCircleOutline,
  MenuBook,
  Lightbulb,
  AutoStories,
  Psychology,
  Explore,
  LocalLibrary,
  Menu,
  ClearAll,
  Close
} from '@mui/icons-material';
import { courseService, ICourse } from '../../services/courseService';
import { enrollmentService, IEnrollment } from '../../services/enrollmentService';
import { useAuth } from '../../hooks/useAuth';
import { getCourseImageUrl } from '../../utils/courseImageGenerator';
import LearningTips from '../../components/Student/LearningTips';
import HelpButton from '../../components/Student/HelpButton';
import { studentProfileService } from '../../services/studentProfileService';
import { UserRole } from '../../shared/types';
import LearningInterestPopup from '../../components/Student/LearningInterestPopup';

// Styled Components for better visual appeal
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
    borderColor: theme.palette.primary.main,
  },
}));

const ProgressCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const WelcomeCard = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '200px',
    height: '200px',
    background: `radial-gradient(circle, ${alpha(theme.palette.common.white, 0.1)} 0%, transparent 70%)`,
    borderRadius: '50%',
    transform: 'translate(50%, -50%)',
  },
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  fontWeight: 600,
  textTransform: 'capitalize',
  '&.MuiChip-filled': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    color: theme.palette.primary.contrastText,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
  '&:hover': {
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
    transform: 'translateY(-2px)',
  },
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`courses-tabpanel-${index}`}
      aria-labelledby={`courses-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const FilterSidebar = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2.5),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  height: 'fit-content',
  position: 'sticky',
  top: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(2),
    position: 'relative',
    top: 0,
  }
}));

const FilterSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '&:last-child': {
    marginBottom: 0
  }
}));

const FilterTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.95rem',
  fontWeight: 700,
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}));

const FilterChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '&.MuiChip-filled': {
    background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
  },
  transition: 'all 0.2s ease'
}));

// Responsive button component for mobile optimization
const ResponsiveButton = styled(Button)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    fontSize: '0.875rem',
    padding: theme.spacing(1, 2),
    minWidth: 'auto',
    '& .MuiSvgIcon-root': {
      fontSize: '1.1rem',
    },
  },
}));

const StudentCourses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  
  // Debug log to verify component is loading
  console.log('🎓 StudentCourses component loaded - Modern version active!');
  
  // Mobile responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const buttonSize = isSmallMobile ? 'small' : isMobile ? 'medium' : 'large';

  // State management
  const [tabValue, setTabValue] = useState(1); // Default to Discover tab for minimal view
  const [enrolledCourses, setEnrolledCourses] = useState<ICourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<ICourse[]>([]);
  const [enrollments, setEnrollments] = useState<IEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Advanced filter state
  const [levelFilters, setLevelFilters] = useState<string[]>([]);
  const [categoryChips, setCategoryChips] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating' | 'enrolled'>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Profile completion state
  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 0,
    missingFields: [] as string[],
    isComplete: false
  });
  const [showProfileAlert, setShowProfileAlert] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Learning interest popup state
  const [showInterestPopup, setShowInterestPopup] = useState(false);
  const [learningInterests, setLearningInterests] = useState<any>(null);
  const [hasCompletedInterestSetup, setHasCompletedInterestSetup] = useState(false);
  const [showInterestSuccess, setShowInterestSuccess] = useState(false);



  // Load courses
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      if (tabValue === 0) {
        // Load enrolled courses
        const [coursesResponse, enrollmentsResponse] = await Promise.all([
          courseService.getEnrolledCourses(),
          enrollmentService.getMyEnrollments()
        ]);
        setEnrolledCourses(coursesResponse.courses);
        setEnrollments(enrollmentsResponse.enrollments);
      } else {
        // Load available courses and enrollments
        const courseFilters: any = {
          search: searchTerm,
          limit: 50 // Increased limit to allow for better client-side filtering
        };
        
        // Only add interest-based filters if interests are set
        // Fetch broadly; apply interest filters on the client to avoid API mismatches
        
        console.log('🔍 Loading courses with filters:', courseFilters);
        
        const [coursesResponse, enrollmentsResponse] = await Promise.allSettled([
          courseService.getPublicCourses(courseFilters),
          enrollmentService.getMyEnrollments()
        ]);
        
        if (coursesResponse.status === 'fulfilled') {
          let courses = coursesResponse.value.courses;
          console.log('📚 Courses loaded from API:', {
            count: courses.length,
            courses: courses.map(c => ({ title: c.title, category: c.category, level: c.level })),
            learningInterests: learningInterests
          });
          
          // Apply interest-based filtering if interests are available
          if (learningInterests) {
            console.log('🎯 Applying interest filtering:', {
              interests: learningInterests,
              originalCount: courses.length,
              courses: courses.map(c => ({
                title: c.title,
                learningCategories: c.learningCategories,
                level: c.level,
                careerGoal: c.careerGoal,
                category: c.category
              }))
            });
            
            const originalCount = courses.length;
            courses = filterCoursesByInterests(courses, learningInterests);
            console.log('🎯 Filtered courses by interests:', { 
              original: originalCount, 
              filtered: courses.length,
              filteredCourses: courses.map(c => c.title),
              interests: learningInterests
            });
            
            // If no courses match, show a helpful message
            if (courses.length === 0) {
              console.log('⚠️ No courses match the selected interests. Consider showing all courses or adjusting filters.');
            }
          } else {
            console.log('📚 No learning interests set - showing all courses:', courses.length);
          }
          
          // Apply category dropdown filter (by new category ID)
          if (categoryFilter) {
            const keywordMap: { [key: string]: string[] } = {
              professional_coaching: ['Professional Coaching', 'Leadership', 'Executive', 'Project Management', 'CPA', 'ACCA', 'CAT', 'Career'],
              business_entrepreneurship_coaching: ['Business', 'Entrepreneurship', 'Startup', 'SME', 'Strategy', 'Finance', 'Marketing', 'Branding'],
              academic_coaching: ['Academic', 'Education', 'Primary', 'Secondary', 'University', 'Exam', 'Study Skills', 'Research', 'Thesis'],
              language_coaching: ['Language', 'English', 'French', 'Kinyarwanda', 'Business Communication', 'Public Speaking', 'Writing'],
              technical_digital_coaching: ['Technology', 'Programming', 'Web', 'Software', 'AI', 'Machine Learning', 'Data', 'Cybersecurity', 'Cloud', 'IT', 'Digital Marketing', 'Vocational'],
              job_seeker_coaching: ['Job', 'Career', 'Resume', 'Portfolio', 'Interview'],
              personal_corporate_development_coaching: ['Personal Development', 'Corporate', 'Communication', 'Confidence', 'Time Management', 'Emotional Intelligence', 'Public Speaking', 'Parenting', 'Team', 'HR', 'Compliance', 'Customer Service', 'Ethics']
            };
            const keywords = keywordMap[categoryFilter] || [];
            courses = courses.filter((course: any) => {
              if (Array.isArray(course.learningCategories) && course.learningCategories.includes(categoryFilter)) {
                return true;
              }
              const hay = [course.category, course.title, course.description].join(' ').toLowerCase();
              return keywords.some(k => hay.includes(k.toLowerCase()));
            });
          }

          // Apply category chips filter
          if (categoryChips.length > 0) {
            const keywordMap: { [key: string]: string[] } = {
              professional_coaching: ['Professional Coaching', 'Leadership', 'Executive', 'Project Management', 'CPA', 'ACCA', 'CAT', 'Career'],
              business_entrepreneurship_coaching: ['Business', 'Entrepreneurship', 'Startup', 'SME', 'Strategy', 'Finance', 'Marketing', 'Branding'],
              academic_coaching: ['Academic', 'Education', 'Primary', 'Secondary', 'University', 'Exam', 'Study Skills', 'Research', 'Thesis'],
              language_coaching: ['Language', 'English', 'French', 'Kinyarwanda', 'Business Communication', 'Public Speaking', 'Writing'],
              technical_digital_coaching: ['Technology', 'Programming', 'Web', 'Software', 'AI', 'Machine Learning', 'Data', 'Cybersecurity', 'Cloud', 'IT', 'Digital Marketing', 'Vocational'],
              job_seeker_coaching: ['Job', 'Career', 'Resume', 'Portfolio', 'Interview'],
              personal_corporate_development_coaching: ['Personal Development', 'Corporate', 'Communication', 'Confidence', 'Time Management', 'Emotional Intelligence', 'Public Speaking', 'Parenting', 'Team', 'HR', 'Compliance', 'Customer Service', 'Ethics']
            };
            courses = courses.filter((course: any) => {
              return categoryChips.some(catId => {
                if (Array.isArray(course.learningCategories) && course.learningCategories.includes(catId)) {
                  return true;
                }
                const keywords = keywordMap[catId] || [];
                const hay = [course.category, course.title, course.description].join(' ').toLowerCase();
                return keywords.some(k => hay.includes(k.toLowerCase()));
              });
            });
          }

          // Apply level filter
          if (levelFilters.length > 0) {
            courses = courses.filter((course: any) => 
              levelFilters.includes(course.level)
            );
          }

          // Apply search filter across title, description, tags, specificInterests, subcategories, and categories
          if (searchTerm && searchTerm.trim().length > 0) {
            const term = searchTerm.trim().toLowerCase();
            const categoryLabels: { [key: string]: string } = {
              professional_coaching: 'Professional Coaching',
              business_entrepreneurship_coaching: 'Business & Entrepreneurship Coaching',
              academic_coaching: 'Academic Coaching',
              language_coaching: 'Language Coaching',
              technical_digital_coaching: 'Technical & Digital Coaching',
              job_seeker_coaching: 'Job Seeker Coaching',
              personal_corporate_development_coaching: 'Personal & Corporate Development Coaching'
            };
            const categoryKeywords: { [key: string]: string[] } = {
              professional_coaching: ['leadership', 'executive', 'project', 'cpa', 'acca', 'cat', 'career'],
              business_entrepreneurship_coaching: ['business', 'entrepreneurship', 'startup', 'sme', 'strategy', 'finance', 'marketing', 'branding'],
              academic_coaching: ['academic', 'education', 'primary', 'secondary', 'university', 'exam', 'study', 'research', 'thesis'],
              language_coaching: ['language', 'english', 'french', 'kinyarwanda', 'communication', 'public speaking', 'writing'],
              technical_digital_coaching: ['technology', 'programming', 'web', 'software', 'ai', 'machine learning', 'data', 'cybersecurity', 'cloud', 'it', 'digital marketing', 'vocational'],
              job_seeker_coaching: ['job', 'career', 'resume', 'portfolio', 'interview'],
              personal_corporate_development_coaching: ['personal', 'corporate', 'communication', 'confidence', 'time management', 'emotional', 'public speaking', 'parenting', 'team', 'hr', 'compliance', 'customer', 'ethics']
            };

            courses = courses.filter((course: any) => {
              const haystack = [
                course.title || '',
                course.description || '',
                ...(course.tags || []),
                ...(course.specificInterests || [])
              ].join(' ').toLowerCase();

              // Text fields
              if (haystack.includes(term)) return true;

              // Subcategories
              if ((course.learningSubcategories || []).some((sub: string) => sub.toLowerCase().includes(term))) return true;

              // Categories by id and labels/keywords
              const catIds: string[] = Array.isArray(course.learningCategories) ? course.learningCategories : [];
              if (catIds.some(id => id.toLowerCase().includes(term))) return true;
              if (catIds.some(id => (categoryLabels[id] || '').toLowerCase().includes(term))) return true;
              if (catIds.some(id => (categoryKeywords[id] || []).some(k => k.includes(term)))) return true;

              // Fallback to legacy category text
              if ((course.category || '').toLowerCase().includes(term)) return true;

              return false;
            });
          }

          setAvailableCourses(courses);
        } else {
          console.error('❌ Failed to load courses:', coursesResponse.reason);
          setError('Failed to load courses. Please try again.');
          setAvailableCourses([]);
        }
        if (enrollmentsResponse.status === 'fulfilled') {
          setEnrollments(enrollmentsResponse.value.enrollments);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Load student profile completion status
  const loadProfileCompletion = async () => {
    if (user?.role === UserRole.STUDENT) {
      try {
        setProfileLoading(true);
        const response = await studentProfileService.getMyProfile();
        setProfileCompletion({
          percentage: response.completionPercentage,
          missingFields: response.missingFields,
          isComplete: response.completionPercentage === 100
        });
      } catch (error) {
        console.error('Failed to load student profile:', error);
        // Profile might not exist yet, that's okay
      } finally {
        setProfileLoading(false);
      }
    }
  };

  // Load courses when tab changes or filters change
  useEffect(() => {
    loadCourses();
  }, [tabValue, searchTerm, categoryFilter, learningInterests, levelFilters, categoryChips, sortBy]);

  // Handle URL parameters for tab and interests
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const interestsParam = urlParams.get('interests');
    const urlCategory = urlParams.get('category');
    const urlSubcategory = urlParams.get('subcategory');
    
    // Set tab if specified in URL
    if (tabParam === 'discover') {
      setTabValue(1);
    }
    
    // Apply interests
    if (interestsParam) {
      try {
        const interests = JSON.parse(decodeURIComponent(interestsParam));
        setLearningInterests(interests);
        applyInterestFilters(interests);
        // Persist
        localStorage.setItem('learningInterests', JSON.stringify(interests));
        localStorage.setItem('learningInterestsCompleted', 'true');
        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } catch (error) {
        console.error('Error parsing interests from URL:', error);
      }
    } else if (urlCategory || urlSubcategory) {
      // Build interests from category/subcategory params
      const simpleInterests: any = {
        categories: urlCategory ? [urlCategory] : [],
        interests: urlSubcategory ? [urlSubcategory] : []
      };
      setLearningInterests(simpleInterests);
      applyInterestFilters(simpleInterests);
      localStorage.setItem('learningInterests', JSON.stringify(simpleInterests));
      localStorage.setItem('learningInterestsCompleted', 'true');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Load profile completion on component mount
  useEffect(() => {
    loadProfileCompletion();
  }, [user]);

  // Handle learning interest popup - runs on component mount
  useEffect(() => {
    // Check if interests were provided via URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const interestsParam = urlParams.get('interests');
    
    // If interests are provided via URL, don't show popup
    if (interestsParam) {
      setHasCompletedInterestSetup(true);
      console.log('📚 Interests provided via URL - skipping popup');
      return;
    }
    
    // Check if student has completed interest setup
    const hasSetup = localStorage.getItem('learningInterestsCompleted');
    
    if (!hasSetup) {
      // Show popup for new students or visitors
      console.log('📚 No interests found - showing popup');
      setShowInterestPopup(true);
    } else {
      setHasCompletedInterestSetup(true);
      // Load saved interests
      const savedInterests = localStorage.getItem('learningInterests');
      if (savedInterests) {
        setLearningInterests(JSON.parse(savedInterests));
        console.log('📚 Loaded saved interests from localStorage');
      }
    }
  }, []); // Run only on mount

  // Handle learning interest popup for students
  useEffect(() => {
    // This effect runs when user changes, but we already handled the initial popup above
    if (user) {
      // Check if interests were provided via URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const interestsParam = urlParams.get('interests');
      
      // If interests are provided via URL, don't show popup
      if (interestsParam) {
        setHasCompletedInterestSetup(true);
        return;
      }
      
      const hasSetup = localStorage.getItem('learningInterestsCompleted');
      if (hasSetup) {
        setHasCompletedInterestSetup(true);
        const savedInterests = localStorage.getItem('learningInterests');
        if (savedInterests) {
          setLearningInterests(JSON.parse(savedInterests));
        }
      }
    }
  }, [user]);

  // Listen for profile update events to refresh completion status
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfileCompletion();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEnroll = async (courseId: string) => {
    // Check if already enrolled
    const isAlreadyEnrolled = enrollments.some(e => {
      if (typeof e.course === 'object' && e.course && '_id' in e.course) {
        return e.course._id === courseId;
      }
      if (typeof e.course === 'string') {
        return e.course === courseId;
      }
      return false;
    });
    if (isAlreadyEnrolled) {
      setError('You are already enrolled in this course');
      return;
    }

    try {
      setLoading(true);
      await enrollmentService.enrollInCourse(courseId);
      setError(null);
      // Navigate to dashboard after successful enrollment
      navigate('/dashboard/student');
    } catch (err: any) {
      setError(err.message || 'Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

  const getEnrollmentProgress = (courseId: string) => {
    const enrollment = enrollments.find(e => {
      if (typeof e.course === 'object' && e.course && '_id' in e.course) {
        return e.course._id === courseId;
      }
      if (typeof e.course === 'string') {
        return e.course === courseId;
      }
      return false;
    });
    
    if (!enrollment) return 0;
    
    // Handle both number and object progress formats
    if (typeof enrollment.progress === 'number') {
      return enrollment.progress;
    } else if (typeof enrollment.progress === 'object' && enrollment.progress.totalProgress) {
      return enrollment.progress.totalProgress;
    }
    
    return 0;
  };

  // Helper function to get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'primary';
  };

  // Helper function to get level color
  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'primary';
    }
  };

  const handleMobileTabChange = (newValue: number) => {
    setTabValue(newValue);
    setMobileDrawerOpen(false);
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setLevelFilters([]);
    setCategoryChips([]);
    setSortBy('newest');
  };

  // Handle learning interest popup completion
  const handleInterestComplete = (data: any) => {
    setLearningInterests(data);
    setHasCompletedInterestSetup(true);
    setShowInterestPopup(false);
    
    // Save to localStorage
    localStorage.setItem('learningInterests', JSON.stringify(data));
    localStorage.setItem('learningInterestsCompleted', 'true');
    
    // Apply filters based on interests
    applyInterestFilters(data);
    
    // Navigate to Discover Courses tab (tab index 1)
    setTabValue(1);
    
    // Reload courses to apply new interest filters
    loadCourses();
    
    // Show success message
    setShowInterestSuccess(true);
    setTimeout(() => setShowInterestSuccess(false), 5000);
  };

  // Apply filters based on learning interests
  const applyInterestFilters = (interests: any) => {
    if (!interests) return;
    
    console.log('🎯 Applying interest filters:', interests);
    
    // Normalize any legacy category ids to the new IDs
    const normalizeCategoryIds = (cats: string[] = []) => {
      const mapping: { [k: string]: string } = {
        business_entrepreneurship: 'business_entrepreneurship_coaching',
        personal_corporate_coaching: 'personal_corporate_development_coaching'
      };
      return cats.map((c) => mapping[c] || c);
    };

    if (interests.categories && interests.categories.length > 0) {
      interests.categories = normalizeCategoryIds(interests.categories);
    }

    // Do not set categoryFilter from interests; rely on learningCategories filtering only
    setCategoryFilter('');
    
    // Do not inject subcategory text into search; keep search user-driven
    setSearchTerm('');
    
    // Set level filter based on experience level
    if (interests.experienceLevel) {
      const levelMapping: { [key: string]: string } = {
        'beginner': 'Beginner',
        'intermediate': 'Intermediate',
        'advanced': 'Advanced'
      };
      // Note: We'll need to add level filtering to the course search if not already present
    }
  };

  // Filter courses based on learning interests
  const filterCoursesByInterests = (courses: ICourse[], interests: any) => {
    if (!interests || !courses.length) return courses;
    console.log('🔍 Filtering courses by interests (strict):', { interests, courseCount: courses.length });

    // Normalize categories
    const normalizeCats = (cats: string[] = []) => {
      const map: { [k: string]: string } = {
        business_entrepreneurship: 'business_entrepreneurship_coaching',
        personal_corporate_coaching: 'personal_corporate_development_coaching'
      };
      return cats.map(c => map[c] || c);
    };
    const selectedCats = normalizeCats(interests.categories || []);
    const specific = interests.specificInterests || interests.interests || [];

    const keywordMap: { [key: string]: string[] } = {
      professional_coaching: ['Professional Coaching', 'Leadership', 'Executive', 'Project Management', 'CPA', 'ACCA', 'CAT', 'Career'],
      business_entrepreneurship_coaching: ['Business', 'Entrepreneurship', 'Startup', 'SME', 'Strategy', 'Finance', 'Marketing', 'Branding'],
      academic_coaching: ['Academic', 'Education', 'Primary', 'Secondary', 'University', 'Exam', 'Study Skills', 'Research', 'Thesis'],
      nursery_coaching: ['Nursery', 'Early Childhood', 'Preschool', 'Ages 3-5', 'Early Literacy', 'Early Numeracy', 'Play-Based Learning'],
      language_coaching: ['Language', 'English', 'French', 'Kinyarwanda', 'Business Communication', 'Public Speaking', 'Writing'],
      technical_digital_coaching: ['Technology', 'Programming', 'Web', 'Software', 'AI', 'Machine Learning', 'Data', 'Cybersecurity', 'Cloud', 'IT', 'Digital Marketing', 'Vocational'],
      job_seeker_coaching: ['Job', 'Career', 'Resume', 'Portfolio', 'Interview'],
      personal_corporate_development_coaching: ['Personal Development', 'Corporate', 'Communication', 'Confidence', 'Time Management', 'Emotional Intelligence', 'Public Speaking', 'Parenting', 'Team', 'HR', 'Compliance', 'Customer Service', 'Ethics']
    };

    return courses.filter((course: any) => {
      // Category match required if categories selected
      if (selectedCats.length > 0) {
        const hasCat = Array.isArray(course.learningCategories)
          ? selectedCats.some(c => course.learningCategories.includes(c))
          : (() => {
              const hay = [course.category, course.title, course.description].join(' ').toLowerCase();
              const keywords = selectedCats.flatMap(c => keywordMap[c] || []);
              return keywords.some(k => hay.includes(k.toLowerCase()));
            })();
        if (!hasCat) return false;
      }

      // Subcategory/specific interest match required if provided
      if (specific.length > 0) {
        const hasSub = (course.learningSubcategories || []).some((sub: string) =>
          specific.some((s: string) => sub.toLowerCase() === s.toLowerCase())
        );
        if (!hasSub) {
          const hay = [course.title, course.description, ...(course.tags || []), ...(course.specificInterests || [])].join(' ').toLowerCase();
          const hasText = specific.some((s: string) => hay.includes(s.toLowerCase()));
          if (!hasText) return false;
        }
      }

      return true;
    });
  };

  // Handle popup close
  const handleInterestClose = () => {
    setShowInterestPopup(false);
    // Mark as completed even if closed without completion
    localStorage.setItem('learningInterestsCompleted', 'true');
  };

  // Sort courses based on selected sort option
  const sortCourses = (coursesToSort: ICourse[]) => {
    const sorted = [...coursesToSort];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'popular':
        return sorted.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
      case 'rating':
        return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'enrolled':
        return sorted.sort((a, b) => {
          const aEnrolled = enrollments.some(e => {
            if (typeof e.course === 'object' && e.course && '_id' in e.course) return e.course._id === a._id;
            return e.course === a._id;
          });
          const bEnrolled = enrollments.some(e => {
            if (typeof e.course === 'object' && e.course && '_id' in e.course) return e.course._id === b._id;
            return e.course === b._id;
          });
          return (bEnrolled ? 1 : 0) - (aEnrolled ? 1 : 0);
        });
      default:
        return sorted;
    }
  };

  // Handle category chip toggle
  const handleCategoryChipToggle = (categoryId: string) => {
    setCategoryChips(prev => 
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle level filter toggle
  const handleLevelToggle = (level: string) => {
    setLevelFilters(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  // Group courses by category with metadata
  const getCategoryMetadata = (categoryId: string) => {
    const categoryMap: { [key: string]: { label: string; icon: string; color: string; description: string } } = {
      professional_coaching: { 
        label: '💼 Professional Coaching', 
        icon: '💼',
        color: '#667eea',
        description: 'Leadership, Executive & Career Development'
      },
      business_entrepreneurship_coaching: { 
        label: '🚀 Business & Entrepreneurship', 
        icon: '🚀',
        color: '#f093fb',
        description: 'Business Strategy, Startups & SME Management'
      },
      academic_coaching: { 
        label: '📚 Academic Coaching', 
        icon: '📚',
        color: '#4facfe',
        description: 'Academic Excellence & Exam Preparation'
      },
      nursery_coaching: { 
        label: '👶 Nursery Coaching', 
        icon: '👶',
        color: '#FFB6C1',
        description: 'Early Childhood Education & Development'
      },
      language_coaching: { 
        label: '🗣️ Language Coaching', 
        icon: '🗣️',
        color: '#43e97b',
        description: 'Language Skills & Communication'
      },
      technical_digital_coaching: { 
        label: '💻 Technical & Digital', 
        icon: '💻',
        color: '#fa709a',
        description: 'Programming, AI & Digital Technologies'
      },
      job_seeker_coaching: { 
        label: '💎 Job Seeker Coaching', 
        icon: '💎',
        color: '#feca57',
        description: 'Job Search, Interviews & Career Transition'
      },
      personal_corporate_development_coaching: { 
        label: '🌟 Personal & Corporate Development', 
        icon: '🌟',
        color: '#48dbfb',
        description: 'Personal Growth, Team Development & Corporate Training'
      }
    };
    return categoryMap[categoryId] || { 
      label: categoryId, 
      icon: '📖',
      color: '#667eea',
      description: 'Discover amazing courses'
    };
  };

  const groupCoursesByCategory = (courses: ICourse[]) => {
    const grouped: { [key: string]: ICourse[] } = {};
    courses.forEach(course => {
      const categories = Array.isArray(course.learningCategories) ? course.learningCategories : [course.category || 'other'];
      categories.forEach(cat => {
        if (!grouped[cat]) {
          grouped[cat] = [];
        }
        grouped[cat].push(course);
      });
    });
    
    // Sort category keys by the order they appear in the metadata
    const categoryOrder = [
      'professional_coaching',
      'business_entrepreneurship_coaching',
      'academic_coaching',
      'nursery_coaching',
      'language_coaching',
      'technical_digital_coaching',
      'job_seeker_coaching',
      'personal_corporate_development_coaching'
    ];
    
    return Object.keys(grouped).sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    }).reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {} as { [key: string]: ICourse[] });
  };

  return (
    <Box sx={{ 
      bgcolor: 'background.default', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '300px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)',
        zIndex: 0,
      }
    }}>
      <Container maxWidth="xl" sx={{ py: { xs: 1, sm: 2, md: 3 }, position: 'relative', zIndex: 1 }}>

        {/* Profile Completion Alert for Students - Ultra Compact */}
      {false && user?.role === UserRole.STUDENT && !profileCompletion.isComplete && showProfileAlert && (
        <Fade in={showProfileAlert}>
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: { xs: 1.5, sm: 2 },
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.95) 0%, rgba(124, 58, 237, 0.95) 50%, rgba(236, 72, 153, 0.95) 100%)',
              color: 'white',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, mr: 2 }}>
                <Person sx={{ mr: 1, fontSize: 18 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.9rem' }, mb: 0.5 }}>
                    Complete Your Profile ({profileCompletion.percentage}%)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={profileCompletion.percentage}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'white'
                      }
                    }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ActionButton
                  variant="contained"
                  onClick={() => {
                    console.log('🎯 Complete Profile button clicked!');
                    window.dispatchEvent(new CustomEvent('openProfileModal'));
                  }}
                  sx={{
                    backgroundColor: 'white',
                    color: '#667eea',
                    fontWeight: 600,
                    py: 0.5,
                    px: 1.5,
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  Complete
                </ActionButton>
                <IconButton
                  size="small"
                  onClick={() => setShowProfileAlert(false)}
                  sx={{ color: 'white', p: 0.5 }}
                >
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Fade>
      )}

      {/* Welcome Card */}
      {false && showWelcome && (
        <Fade in={showWelcome}>
          <WelcomeCard elevation={0} sx={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.95) 0%, rgba(124, 58, 237, 0.95) 50%, rgba(236, 72, 153, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(37, 99, 235, 0.3)',
          }}>
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              alignItems="center" 
              justifyContent="space-between"
              spacing={{ xs: 2, md: 0 }}
            >
              <Box sx={{ zIndex: 1, width: { xs: '100%', md: 'auto' } }}>
                <Typography 
                  variant={isSmallMobile ? 'h5' : isMobile ? 'h4' : 'h4'} 
                  sx={{ fontWeight: 700, mb: 1, textAlign: { xs: 'center', md: 'left' } }}
                >
                  🎓 Welcome to Your Learning Hub!
                </Typography>
                <Typography 
                  variant={isMobile ? 'body1' : 'h6'} 
                  sx={{ 
                    opacity: 0.9, 
                    mb: 2,
                    textAlign: { xs: 'center', md: 'left' }
                  }}
                >
                  Hi {user?.firstName}! Ready to continue your learning journey?
                </Typography>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2}
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                >
                  <ResponsiveButton 
                    variant="contained" 
                    sx={{ 
                      bgcolor: 'white', 
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'grey.100' },
                      minWidth: { xs: '100%', sm: 'auto' }
                    }}
                    startIcon={<PlayCircleOutline />}
                    onClick={() => setTabValue(0)}
                    size={buttonSize}
                  >
                    Continue Learning
                  </ResponsiveButton>
                  <ResponsiveButton 
                    variant="outlined" 
                    sx={{ 
                      borderColor: 'white', 
                      color: 'white',
                      '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.1) },
                      minWidth: { xs: '100%', sm: 'auto' }
                    }}
                    startIcon={<Explore />}
                    onClick={() => setTabValue(1)}
                    size={buttonSize}
                  >
                    Discover New Courses
                  </ResponsiveButton>
                </Stack>
              </Box>
              <IconButton 
                onClick={() => setShowWelcome(false)}
                sx={{ 
                  color: 'white', 
                  opacity: 0.7,
                  position: 'absolute',
                  top: { xs: 8, md: 16 },
                  right: { xs: 8, md: 16 }
                }}
              >
                ✕
              </IconButton>
            </Stack>
          </WelcomeCard>
        </Fade>
      )}

      {/* Learning Interest Setup Button for Students */}
      {user?.role === UserRole.STUDENT && hasCompletedInterestSetup && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <ActionButton
            variant="outlined"
            startIcon={<Star />}
            onClick={() => setShowInterestPopup(true)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'primary.main',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Update Learning Interests
          </ActionButton>
          
          
        </Box>
      )}

      {/* Quick Stats */}
      {enrolledCourses.length > 0 && (
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
          <Grid item xs={12} sm={4}>
            <ProgressCard>
              <CardContent sx={{ 
                textAlign: 'center', 
                p: { xs: 2, md: 3 },
                '&:last-child': { pb: { xs: 2, md: 3 } }
              }}>
                <TrendingUp 
                  sx={{ 
                    fontSize: { xs: 32, md: 40 }, 
                    color: 'success.main', 
                    mb: 1 
                  }} 
                />
                <Typography 
                  variant={isMobile ? 'h5' : 'h4'} 
                  sx={{ fontWeight: 700, color: 'success.main' }}
                >
                  {Math.round(enrollments.reduce((sum, e) => {
                    const progress = typeof e.progress === 'number' ? e.progress : (e.progress?.totalProgress || 0);
                    return sum + progress;
                  }, 0) / enrollments.length || 0)}%
                </Typography>
                <Typography 
                  variant={isMobile ? 'caption' : 'body2'} 
                  color="text.secondary"
                >
                  📈 Average Progress
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <ProgressCard>
              <CardContent sx={{ 
                textAlign: 'center', 
                p: { xs: 2, md: 3 },
                '&:last-child': { pb: { xs: 2, md: 3 } }
              }}>
                <EmojiEvents 
                  sx={{ 
                    fontSize: { xs: 32, md: 40 }, 
                    color: 'warning.main', 
                    mb: 1 
                  }} 
                />
                <Typography 
                  variant={isMobile ? 'h5' : 'h4'} 
                  sx={{ fontWeight: 700, color: 'warning.main' }}
                >
                  {enrollments.filter(e => {
                    const progress = typeof e.progress === 'number' ? e.progress : (e.progress?.totalProgress || 0);
                    return progress >= 100;
                  }).length}
                </Typography>
                <Typography 
                  variant={isMobile ? 'caption' : 'body2'} 
                  color="text.secondary"
                >
                  🏆 Completed Courses
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <ProgressCard>
              <CardContent sx={{ 
                textAlign: 'center', 
                p: { xs: 2, md: 3 },
                '&:last-child': { pb: { xs: 2, md: 3 } }
              }}>
                <LocalLibrary 
                  sx={{ 
                    fontSize: { xs: 32, md: 40 }, 
                    color: 'primary.main', 
                    mb: 1 
                  }} 
                />
                <Typography 
                  variant={isMobile ? 'h5' : 'h4'} 
                  sx={{ fontWeight: 700, color: 'primary.main' }}
                >
                  {enrolledCourses.length}
                </Typography>
                <Typography 
                  variant={isMobile ? 'caption' : 'body2'} 
                  color="text.secondary"
                >
                  📚 Active Courses
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>
        </Grid>
      )}

      {/* Navigation Tabs - Hidden on Mobile */}
      {false && !isMobile && (
        <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                py: 2,
              },
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: 2,
              },
            }}
          >
            <Tab 
              icon={<MenuBook />} 
              iconPosition="start"
              label="📚 My Learning" 
              sx={{ 
                '&.Mui-selected': { 
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            />
            <Tab 
              icon={<Explore />} 
              iconPosition="start"
              label="🔍 Discover Courses" 
              sx={{ 
                '&.Mui-selected': { 
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            />
          </Tabs>
        </Paper>
      )}

      {/* Mobile Tab Indicator */}
      {false && isMobile && (
        <Paper sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: 2,
          bgcolor: tabValue === 0 ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.secondary.main, 0.1)
        }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            {tabValue === 0 ? <MenuBook /> : <Explore />}
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {tabValue === 0 ? '📚 My Learning' : '🔍 Discover Courses'}
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Zoom in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }} 
            onClose={() => setError(null)}
            action={
              <Button color="inherit" size="small" onClick={loadCourses}>
                Try Again
              </Button>
            }
          >
            {error}
          </Alert>
        </Zoom>
      )}

      {/* My Learning Tab */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={8}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              Loading your courses...
            </Typography>
          </Box>
        ) : enrolledCourses.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ mb: 3 }}>
              <AutoStories sx={{ fontSize: 80, color: 'primary.main', opacity: 0.7 }} />
            </Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              🚀 Ready to Start Learning?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              You haven't enrolled in any courses yet. Let's find the perfect course to begin your learning adventure!
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <ActionButton
                variant="contained"
                size="large"
                onClick={() => setTabValue(1)}
                startIcon={<Explore />}
              >
                🔍 Explore Courses
              </ActionButton>
              <ActionButton
                variant="outlined"
                size="large"
                startIcon={<Lightbulb />}
              >
                💡 Get Recommendations
              </ActionButton>
            </Stack>
          </Paper>
        ) : (
          <>
            {/* Learning Progress Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                📚 Your Learning Journey
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Keep up the great work! Here are your active courses.
              </Typography>
            </Box>

            {/* Learning Tips for new users */}
            {enrolledCourses.length <= 2 && (
              <LearningTips />
            )}

            <Grid container spacing={{ xs: 2, md: 3 }}>
              {enrolledCourses.map((course, index) => {
                const progress = getEnrollmentProgress(course._id);
                const progressColor = getProgressColor(progress);
                const levelColor = getLevelColor(course.level);
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={course._id}>
                    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                      <StyledCard>
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height={isMobile ? 160 : 180}
                            image={getCourseImageUrl(course)}
                            alt={course.title}
                          />
                          {progress >= 100 && (
                            <Chip
                              icon={<CheckCircle />}
                              label={isMobile ? "✅ Done" : "Completed!"}
                              color="success"
                              size={isMobile ? 'small' : 'medium'}
                              sx={{
                                position: 'absolute',
                                top: { xs: 8, md: 12 },
                                right: { xs: 8, md: 12 },
                                fontWeight: 600,
                                boxShadow: 2
                              }}
                            />
                          )}
                          {progress > 0 && progress < 100 && (
                            <Chip
                              icon={<PlayCircleOutline />}
                              label={isMobile ? "⏳ Ongoing" : "In Progress"}
                              color="primary"
                              size={isMobile ? 'small' : 'medium'}
                              sx={{
                                position: 'absolute',
                                top: { xs: 8, md: 12 },
                                right: { xs: 8, md: 12 },
                                fontWeight: 600,
                                boxShadow: 2
                              }}
                            />
                          )}
                        </Box>
                        
                        <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
                          <Typography 
                            variant={isMobile ? 'subtitle1' : 'h6'} 
                            gutterBottom 
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {course.title}
                          </Typography>
                          
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              <Person sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {course.instructor?.firstName} {course.instructor?.lastName}
                            </Typography>
                          </Stack>

                          {/* Progress Section */}
                          <Box sx={{ mb: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                📈 Your Progress
                              </Typography>
                              <Typography variant="h6" color={`${progressColor}.main`} sx={{ fontWeight: 700 }}>
                                {Math.round(progress)}%
                              </Typography>
                            </Stack>
                            <StyledLinearProgress 
                              variant="determinate" 
                              value={progress}
                              color={progressColor}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {progress >= 100 ? '🎉 Course completed!' : 
                               progress >= 75 ? '🔥 Almost there!' :
                               progress >= 50 ? '💪 Great progress!' :
                               progress > 0 ? '🌱 Keep going!' : '▶️ Ready to start!'}
                            </Typography>
                          </Box>

                          {/* Course Details */}
                          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <CategoryChip 
                              label={`📂 ${course.category}`} 
                              size="small" 
                              variant="filled"
                            />
                            <CategoryChip 
                              label={`📊 ${course.level}`} 
                              size="small" 
                              color={levelColor}
                              variant="outlined"
                            />
                          </Stack>
                        </CardContent>
                        
                        <Box sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
                          <Stack spacing={1}>
                            <ResponsiveButton
                              fullWidth
                              variant="contained"
                              size={buttonSize}
                              startIcon={progress >= 100 ? <EmojiEvents /> : <PlayArrow />}
                              onClick={() => navigate(progress >= 100 ? `/dashboard/student/course/${course._id}` : `/course/${course._id}/learn`)}
                              sx={{ 
                                bgcolor: progress >= 100 ? 'success.main' : 'primary.main',
                                '&:hover': {
                                  bgcolor: progress >= 100 ? 'success.dark' : 'primary.dark',
                                }
                              }}
                            >
                              {progress >= 100 ? '🏆 View Certificate' : 
                               progress > 0 ? '📖 Continue Learning' : '🚀 Start Course'}
                            </ResponsiveButton>
                            
                            <ResponsiveButton
                              fullWidth
                              variant="outlined"
                              size={buttonSize}
                              startIcon={<School />}
                              onClick={() => navigate(`/dashboard/student/course/${course._id}/weeks`)}
                              sx={{ 
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                  borderColor: 'primary.dark',
                                  backgroundColor: 'primary.light',
                                  color: 'primary.dark',
                                }
                              }}
                            >
                              📚 Week View
                            </ResponsiveButton>
                          </Stack>
                        </Box>
                      </StyledCard>
                    </Zoom>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </TabPanel>

      {/* Discover Courses Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Sidebar Filters - Hidden on Mobile by default */}
          {!isMobile ? (
            <Grid item xs={12} md={2.5}>
              <FilterSidebar>
                {/* Search */}
                <FilterSection>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'white',
                      }
                    }}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                    }}
                  />
                </FilterSection>

                {/* Sort */}
                <FilterSection>
                  <FilterTitle>
                    <TrendingUp fontSize="small" />
                    Sort By
                  </FilterTitle>
                  <FormControl fullWidth size="small">
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      sx={{
                        borderRadius: 1.5,
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <MenuItem value="newest">📅 Newest</MenuItem>
                      <MenuItem value="popular">🔥 Most Popular</MenuItem>
                      <MenuItem value="rating">⭐ Highest Rated</MenuItem>
                      <MenuItem value="enrolled">✅ Enrolled First</MenuItem>
                    </Select>
                  </FormControl>
                </FilterSection>

                <Divider sx={{ my: 2 }} />

                {/* Level Filter */}
                <FilterSection>
                  <FilterTitle>
                    <Psychology fontSize="small" />
                    Level
                  </FilterTitle>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <Chip
                        key={level}
                        label={level}
                        onClick={() => handleLevelToggle(level)}
                        variant={levelFilters.includes(level) ? 'filled' : 'outlined'}
                        color={levelFilters.includes(level) ? 'primary' : 'default'}
                        sx={{
                          justifyContent: 'flex-start',
                          '& .MuiChip-label': { width: '100%', textAlign: 'left' }
                        }}
                      />
                    ))}
                  </Box>
                </FilterSection>

                <Divider sx={{ my: 2 }} />

                {/* Category Filter */}
                <FilterSection>
                  <FilterTitle>
                    <LocalLibrary fontSize="small" />
                    Categories
                  </FilterTitle>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[
                      { id: 'professional_coaching', label: '💼 Professional' },
                      { id: 'business_entrepreneurship_coaching', label: '🚀 Business' },
                      { id: 'academic_coaching', label: '📚 Academic' },
                      { id: 'nursery_coaching', label: '👶 Nursery' },
                      { id: 'language_coaching', label: '🗣️ Language' },
                      { id: 'technical_digital_coaching', label: '💻 Tech & Digital' },
                      { id: 'job_seeker_coaching', label: '💼 Job Seeking' },
                      { id: 'personal_corporate_development_coaching', label: '🌟 Personal Dev' }
                    ].map((cat) => (
                      <Chip
                        key={cat.id}
                        label={cat.label}
                        onClick={() => handleCategoryChipToggle(cat.id)}
                        variant={categoryChips.includes(cat.id) ? 'filled' : 'outlined'}
                        color={categoryChips.includes(cat.id) ? 'primary' : 'default'}
                        sx={{
                          justifyContent: 'flex-start',
                          '& .MuiChip-label': { width: '100%', textAlign: 'left' }
                        }}
                      />
                    ))}
                  </Box>
                </FilterSection>

                <Divider sx={{ my: 2 }} />

                {/* Clear Filters */}
                {(searchTerm || categoryFilter || levelFilters.length > 0 || categoryChips.length > 0) && (
                  <ActionButton
                    fullWidth
                    variant="outlined"
                    onClick={clearFilters}
                    startIcon={<ClearAll />}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Clear All
                  </ActionButton>
                )}
              </FilterSidebar>
            </Grid>
          ) : null}

          {/* Main Content Area */}
          <Grid item xs={12} md={isMobile ? 12 : 9.5}>
            {/* Mobile Filter Toggle */}
            {isMobile && (
              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                  startIcon={<FilterList />}
                  size="small"
                >
                  Filters
                </Button>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <MenuItem value="newest">Newest</MenuItem>
                    <MenuItem value="popular">Popular</MenuItem>
                    <MenuItem value="rating">Rated</MenuItem>
                    <MenuItem value="enrolled">Enrolled</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Mobile Filter Drawer */}
            {isMobile && (
              <Drawer
                anchor="left"
                open={mobileFilterOpen}
                onClose={() => setMobileFilterOpen(false)}
              >
                <FilterSidebar sx={{ width: 300, height: '100vh', borderRadius: 0, position: 'relative', top: 0 }}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Filters
                    </Typography>
                    <IconButton onClick={() => setMobileFilterOpen(false)} size="small">
                      <Close />
                    </IconButton>
                  </Box>

                  {/* Mobile Search */}
                  <FilterSection>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'white',
                        }
                      }}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                      }}
                    />
                  </FilterSection>

                  {/* Mobile Level Filter */}
                  <FilterSection>
                    <FilterTitle>Level</FilterTitle>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                        <Chip
                          key={level}
                          label={level}
                          onClick={() => handleLevelToggle(level)}
                          variant={levelFilters.includes(level) ? 'filled' : 'outlined'}
                          color={levelFilters.includes(level) ? 'primary' : 'default'}
                          fullWidth
                        />
                      ))}
                    </Box>
                  </FilterSection>

                  {/* Mobile Category Filter */}
                  <FilterSection>
                    <FilterTitle>Categories</FilterTitle>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {[
                        { id: 'professional_coaching', label: '💼 Professional' },
                        { id: 'business_entrepreneurship_coaching', label: '🚀 Business' },
                        { id: 'academic_coaching', label: '📚 Academic' },
                        { id: 'nursery_coaching', label: '👶 Nursery' },
                        { id: 'language_coaching', label: '🗣️ Language' },
                        { id: 'technical_digital_coaching', label: '💻 Tech' },
                        { id: 'job_seeker_coaching', label: '💼 Job Seeking' },
                        { id: 'personal_corporate_development_coaching', label: '🌟 Personal' }
                      ].map((cat) => (
                        <Chip
                          key={cat.id}
                          label={cat.label}
                          onClick={() => handleCategoryChipToggle(cat.id)}
                          variant={categoryChips.includes(cat.id) ? 'filled' : 'outlined'}
                          color={categoryChips.includes(cat.id) ? 'primary' : 'default'}
                          fullWidth
                        />
                      ))}
                    </Box>
                  </FilterSection>

                  {(searchTerm || categoryFilter || levelFilters.length > 0 || categoryChips.length > 0) && (
                    <ActionButton
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        clearFilters();
                        setMobileFilterOpen(false);
                      }}
                      startIcon={<ClearAll />}
                      size="small"
                      sx={{ mt: 2 }}
                    >
                      Clear All
                    </ActionButton>
                  )}
                </FilterSidebar>
              </Drawer>
            )}

            {/* Search Bar for Desktop */}
            {!isMobile && (
              <Paper sx={{ p: 2, mb: 3, borderRadius: 2, background: 'white', border: '1px solid rgba(0,0,0,0.06)' }}>
                <TextField
                  fullWidth
                  placeholder="🔍 Search courses, skills, instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'white',
                      fontSize: '0.95rem',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }
                  }}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1.5, color: 'primary.main', fontSize: 22 }} />
                  }}
                />
              </Paper>
            )}

            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={8}>
                <CircularProgress size={60} thickness={4} />
                <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                  Finding amazing courses for you...
                </Typography>
              </Box>
            ) : availableCourses.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'grey.50' }}>
                <Psychology sx={{ fontSize: 80, color: 'primary.main', opacity: 0.7, mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  🤔 No courses found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {learningInterests ? 
                    "No courses match your selected interests. Try adjusting your preferences or browse all courses." :
                    "Try adjusting your search terms or browse all categories"
                  }
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <ActionButton
                    variant="outlined"
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('');
                      setLearningInterests(null);
                      setLevelFilters([]);
                      setCategoryChips([]);
                      localStorage.removeItem('learningInterests');
                    }}
                  >
                    🔄 Clear All Filters
                  </ActionButton>
                  {learningInterests && (
                    <ActionButton
                      variant="contained"
                      onClick={() => {
                        console.log('🔄 Show All Courses clicked - clearing interests');
                        setLearningInterests(null);
                        localStorage.removeItem('learningInterests');
                        setSearchTerm('');
                        setCategoryFilter('');
                        setLevelFilters([]);
                        setCategoryChips([]);
                        loadCourses();
                      }}
                    >
                      👀 Show All Courses
                    </ActionButton>
                  )}
                </Stack>
              </Paper>
            ) : (
              <>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" color="primary.main" sx={{ textAlign: 'center', fontWeight: 700 }}>
                    ✨ Found {availableCourses.length} amazing course{availableCourses.length !== 1 ? 's' : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                    Browse courses organized by category for easy discovery
                  </Typography>
                </Box>

                {/* Grouped Courses by Category */}
                {Object.entries(groupCoursesByCategory(sortCourses(availableCourses))).map((entry) => {
                  const [categoryId, courses] = entry;
                  const categoryMeta = getCategoryMetadata(categoryId);
                  return (
                    <Box key={categoryId} sx={{ mb: 6 }}>
                      {/* Category Header */}
                      <Box
                        sx={{
                          mb: 3,
                          pb: 2,
                          borderBottom: `3px solid ${categoryMeta.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: categoryMeta.color }}>
                            {categoryMeta.label}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`${courses.length} course${courses.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                              bgcolor: `${categoryMeta.color}20`,
                              color: categoryMeta.color,
                              fontWeight: 600,
                              border: `1px solid ${categoryMeta.color}40`
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            {categoryMeta.description}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Courses Grid for this Category */}
                      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
                        {courses.map((course, index) => {
                const levelColor = getLevelColor(course.level);
                const isEnrolled = enrollments.some(e => {
                  if (typeof e.course === 'object' && e.course && '_id' in e.course) {
                    return e.course._id === course._id;
                  }
                  if (typeof e.course === 'string') {
                    return e.course === course._id;
                  }
                  return false;
                });
                const enrollmentProgress = isEnrolled ? getEnrollmentProgress(course._id) : 0;
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={course._id}>
                    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                      <StyledCard>
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height={isMobile ? 160 : 180}
                            image={getCourseImageUrl(course)}
                            alt={course.title}
                          />
                          {isEnrolled ? (
                            <Chip
                              icon={<CheckCircle />}
                              label={enrollmentProgress >= 100 ? "✅ Done" : "📚 Enrolled"}
                              color={enrollmentProgress >= 100 ? "success" : "primary"}
                              size={isMobile ? 'small' : 'medium'}
                              sx={{
                                position: 'absolute',
                                top: { xs: 8, md: 12 },
                                left: { xs: 8, md: 12 },
                                fontWeight: 600,
                                boxShadow: 2
                              }}
                            />
                          ) : (
                            <Chip
                              label="🆕 New"
                              color="secondary"
                              size={isMobile ? 'small' : 'medium'}
                              sx={{
                                position: 'absolute',
                                top: { xs: 8, md: 12 },
                                left: { xs: 8, md: 12 },
                                fontWeight: 600,
                                boxShadow: 2
                              }}
                            />
                          )}
                          <Tooltip title="Add to wishlist">
                            <IconButton
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'white',
                                '&:hover': { bgcolor: 'grey.100' }
                              }}
                            >
                              <BookmarkBorder />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        
                        <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
                          <Typography 
                            variant={isMobile ? 'subtitle1' : 'h6'} 
                            gutterBottom 
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {course.title}
                          </Typography>
                          
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              <Person sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {course.instructor?.firstName} {course.instructor?.lastName}
                            </Typography>
                          </Stack>

                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 3, 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {course.description || "Expand your skills with this comprehensive course designed for learners of all levels."}
                          </Typography>

                          {/* Course Details */}
                          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                            <CategoryChip 
                              label={`📂 ${course.category}`} 
                              size="small" 
                              variant="filled"
                            />
                            <CategoryChip 
                              label={`📊 ${course.level}`} 
                              size="small" 
                              color={levelColor}
                              variant="outlined"
                            />
                          </Stack>

                          {/* Price and Rating */}
                          {/* Minimal: remove rating stars and price block */}

                          {/* Minimal: remove extra course features */}
                        </CardContent>
                        
                        <Box sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
                          {isEnrolled ? (
                            <>
                              {/* Show progress if enrolled */}
                              {enrollmentProgress > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      📈 Your Progress
                                    </Typography>
                                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
                                      {Math.round(enrollmentProgress)}%
                                    </Typography>
                                  </Stack>
                                  <StyledLinearProgress 
                                    variant="determinate" 
                                    value={enrollmentProgress}
                                    color={getProgressColor(enrollmentProgress)}
                                  />
                                </Box>
                              )}
                              
                              <ResponsiveButton
                                fullWidth
                                variant="contained"
                                size={buttonSize}
                                startIcon={enrollmentProgress >= 100 ? <EmojiEvents /> : <PlayArrow />}
                                onClick={() => navigate(enrollmentProgress >= 100 ? `/dashboard/student/course/${course._id}` : `/course/${course._id}/learn`)}
                                sx={{ 
                                  bgcolor: enrollmentProgress >= 100 ? 'success.main' : 'primary.main',
                                  '&:hover': {
                                    bgcolor: enrollmentProgress >= 100 ? 'success.dark' : 'primary.dark',
                                  }
                                }}
                              >
                                {enrollmentProgress >= 100 ? '🏆 View Certificate' : 
                                 enrollmentProgress > 0 ? '📖 Continue Learning' : '🚀 Start Course'}
                              </ResponsiveButton>
                              
                              <ResponsiveButton
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{ mt: 1 }}
                                startIcon={<CheckCircle />}
                                disabled
                              >
                                ✅ Already Enrolled
                              </ResponsiveButton>
                            </>
                          ) : (
                            <>
                              <ResponsiveButton
                                fullWidth
                                variant="contained"
                                size="small"
                                startIcon={<School />}
                                onClick={() => handleEnroll(course._id)}
                                disabled={loading}
                                sx={{
                                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                  '&:hover': {
                                    background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                  },
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {loading ? (
                                  <>
                                    <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                                    Enrolling...
                                  </>
                                ) : (
                                  '🚀 Enroll Now'
                                )}
                              </ResponsiveButton>
                              <ResponsiveButton
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{ mt: 1 }}
                                onClick={() => navigate(`/course-preview/${course._id}`)}
                              >
                                👀 Preview Course
                              </ResponsiveButton>
                            </>
                          )}
                        </Box>
                      </StyledCard>
                    </Zoom>
                  </Grid>
                        );
                      })}
                      </Grid>
                    </Box>
                  );
                })}
              </>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Floating Help Button */}
      <HelpButton />

      {/* Learning Interest Popup */}
      <LearningInterestPopup
        open={showInterestPopup}
        onClose={handleInterestClose}
        onComplete={handleInterestComplete}
      />
      
      
      </Container>
    </Box>
  );
};

export default StudentCourses;
