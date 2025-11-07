import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Stack,
  CardMedia,
  LinearProgress,
  Tooltip,
  Badge,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Collapse
} from '@mui/material';
import {
  School,
  Edit,
  Visibility,
  MoreVert,
  Add,
  People,
  Schedule,
  TrendingUp,
  Settings,
  VideoCall,
  Assignment,
  Quiz,
  YouTube,
  Close,
  Save,
  Category,
  AccessTime,
  Psychology,
  Work,
  Star,
  TrendingDown,
  CheckCircle,
  Pending,
  Cancel,
  Refresh,
  Search,
  FilterList,
  Sort,
  Dashboard,
  Analytics,
  Bookmark,
  Share,
  Menu as MenuIcon,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';

const categories = [
  // Programming Languages
  'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript',
  
  // Web Development
  'Web Development', 'Frontend Development', 'Backend Development', 'Full Stack Development',
  'HTML', 'CSS', 'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Next.js', 'Nuxt.js',
  
  // Mobile Development
  'Mobile Development', 'iOS Development', 'Android Development', 'React Native', 'Flutter',
  'Xamarin', 'Ionic', 'Cordova',
  
  // Data Science & AI
  'Data Science', 'Machine Learning', 'Artificial Intelligence', 'Deep Learning', 'Data Analysis',
  'Data Visualization', 'Statistics', 'R Programming', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  
  // Cloud & DevOps
  'Cloud Computing', 'AWS', 'Azure', 'Google Cloud', 'DevOps', 'Docker', 'Kubernetes', 'CI/CD',
  'Jenkins', 'GitLab', 'GitHub Actions', 'Terraform', 'Ansible',
  
  // Cybersecurity
  'Cybersecurity', 'Ethical Hacking', 'Penetration Testing', 'Network Security', 'Information Security',
  'Cryptography', 'Security Analysis', 'Risk Management',
  
  // Database
  'Database', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Database Design',
  'Data Modeling', 'Database Administration',
  
  // Design & UI/UX
  'UI/UX Design', 'Graphic Design', 'Web Design', 'User Interface Design', 'User Experience Design',
  'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Sketch', 'Adobe XD', 'Prototyping',
  
  // Business & Marketing
  'Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Content Marketing', 'Email Marketing',
  'Analytics', 'Google Analytics', 'Facebook Ads', 'Google Ads', 'Marketing Strategy',
  
  // Project Management
  'Project Management', 'Agile', 'Scrum', 'Kanban', 'Jira', 'Trello', 'Asana', 'Product Management',
  
  // Finance & Accounting
  'Finance', 'Accounting', 'Financial Analysis', 'Investment', 'Trading', 'Cryptocurrency',
  'Blockchain', 'Personal Finance', 'Corporate Finance',
  
  // Language Learning
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese',
  'Italian', 'Russian', 'Arabic', 'Hindi',
  
  // Creative Arts
  'Photography', 'Video Editing', 'Music Production', 'Digital Art', 'Animation', '3D Modeling',
  'Blender', 'After Effects', 'Premiere Pro', 'Final Cut Pro',
  
  // Health & Fitness
  'Fitness', 'Yoga', 'Nutrition', 'Mental Health', 'Meditation', 'Weight Loss', 'Muscle Building',
  'Cardio Training', 'Strength Training',
  
  // Academic Subjects
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature',
  'Philosophy', 'Psychology', 'Sociology', 'Economics', 'Political Science',
  
  // Professional Skills
  'Communication Skills', 'Leadership', 'Public Speaking', 'Writing', 'Presentation Skills',
  'Time Management', 'Critical Thinking', 'Problem Solving', 'Negotiation', 'Team Building',
  
  // Technology Trends
  'Blockchain Development', 'Web3', 'NFT', 'Metaverse', 'IoT', 'Edge Computing', 'Quantum Computing',
  'AR/VR Development', 'Game Development', 'Unity', 'Unreal Engine',
  
  // Other Categories
  'Entrepreneurship', 'Startup', 'E-commerce', 'Online Business', 'Freelancing', 'Remote Work',
  'Career Development', 'Resume Writing', 'Interview Skills', 'Networking'
];

// Learning Categories for better course discoverability (curated)
const learningCategories = [
  {
    id: 'professional_coaching',
    title: 'Professional Coaching',
    description: 'Grow your career with expert coaching',
    subcategories: [
      'Leadership & Executive Coaching',
      'Project Management Coaching',
      'Career Growth Coaching',
      'CPA Coaching',
      'CAT Coaching',
      'ACCA Coaching'
    ]
  },
  {
    id: 'business_entrepreneurship',
    title: 'Business & Entrepreneurship Coaching',
    description: 'Build, grow and scale your business',
    subcategories: [
      'Business Startup Coaching',
      'Entrepreneurship Development Coaching',
      'Small Business Management Coaching',
      'Business Strategy & Planning Coaching',
      'Financial Management Coaching',
      'Marketing & Branding Coaching',
      'Innovation & Growth Coaching'
    ]
  },
  {
    id: 'academic_coaching',
    title: 'Academic Coaching',
    description: 'Achieve academic excellence at any level',
    subcategories: [
      'Primary Coaching',
      'Secondary Coaching',
      'University Coaching',
      'Exam Preparation Coaching',
      'Study Skills Coaching',
      'Research & Thesis Coaching'
    ]
  },
  {
    id: 'nursery_coaching',
    title: 'Nursery Coaching',
    description: 'Early childhood education for nursery students',
    subcategories: [
      'Nursery 1 Coaching',
      'Nursery 2 Coaching',
      'Nursery 3 Coaching',
      'Early Literacy Coaching',
      'Early Numeracy Coaching',
      'Play-Based Learning Coaching'
    ]
  },
  {
    id: 'language_coaching',
    title: 'Language Coaching',
    description: 'Master languages for life and business',
    subcategories: [
      'English Language Coaching',
      'French Language Coaching',
      'Kinyarwanda Language Coaching',
      'Business Communication Coaching',
      'Public Speaking in English Coaching',
      'Writing & Presentation Skills Coaching'
    ]
  },
  {
    id: 'technical_digital_coaching',
    title: 'Technical & Digital Coaching',
    description: 'Practical digital skills for today’s world',
    subcategories: [
      'Artificial Intelligence (AI) Coaching',
      'Machine Learning Coaching',
      'Data Analytics Coaching',
      'Cybersecurity Coaching',
      'Cloud Computing Coaching',
      'Software & Web Development Coaching',
      'Digital Marketing Coaching',
      'IT Systems Coaching',
      'Vocational & Technical Skills Coaching'
    ]
  },
  {
    id: 'job_seeker_coaching',
    title: 'Job Seeker Coaching',
    description: 'Land the job you want with structured coaching',
    subcategories: [
      // Technology & IT
      'Software Engineer', 'Web Developer', 'Mobile App Developer', 'UI/UX Designer', 
      'Data Analyst', 'Cybersecurity Analyst', 'IT Support', 'Network Administrator',
      'Database Administrator', 'System Administrator', 'DevOps Engineer', 'Quality Assurance',
      'Technical Writer', 'IT Consultant', 'Software Tester', 'Business Intelligence',
      'Digital Marketing', 'SEO Specialist', 'Content Writer', 'Social Media Manager',
      
      // Business & Finance
      'Accountant', 'Financial Analyst', 'Business Analyst', 'Project Manager',
      'Operations Manager', 'Product Manager', 'Sales Manager', 'Marketing Manager',
      'HR Manager', 'Business Development', 'Management Consultant', 'Auditor',
      'Bookkeeper', 'Payroll Specialist', 'Tax Consultant', 'Financial Advisor',
      'Insurance Agent', 'Real Estate Agent', 'Banking Professional', 'Investment Analyst',
      
      // Healthcare & Medical
      'Doctor', 'Nurse', 'Pharmacist', 'Medical Technician', 'Dentist',
      'Physiotherapist', 'Laboratory Technician', 'Radiologist', 'Veterinarian',
      'Medical Assistant', 'Healthcare Administrator', 'Public Health Officer',
      
      // Education & Training
      'Teacher', 'University Lecturer', 'School Principal', 'Curriculum Developer',
      'Educational Consultant', 'Librarian', 'Research Assistant', 'Training Specialist',
      'Language Teacher', 'Translator', 'Interpreter', 'Educational Technology',
      
      // Engineering & Construction
      'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Chemical Engineer',
      'Environmental Engineer', 'Architect', 'Surveyor', 'Construction Manager',
      'Project Engineer', 'Quality Control Engineer', 'Maintenance Engineer',
      
      // Agriculture & Environment
      'Agricultural Engineer', 'Farm Manager', 'Agribusiness Manager', 'Environmental Engineer',
      'Environmental Health Officer', 'Food Inspector', 'Agricultural Consultant',
      
      // Tourism & Hospitality
      'Hotel Manager', 'Restaurant Manager', 'Chef', 'Tour Guide', 'Travel Agent',
      'Event Manager', 'Wedding Planner', 'Tourism Coordinator', 'Hospitality Manager',
      
      // Government & Public Service
      'Civil Servant', 'Policy Analyst', 'Public Administrator', 'Diplomat',
      'Legal Officer', 'Judge', 'Lawyer', 'Paralegal', 'Legal Secretary',
      'Government Relations', 'Public Affairs Officer',
      
      // Media & Communications
      'Journalist', 'Radio Presenter', 'TV Producer', 'Content Creator',
      'Public Relations', 'Advertising', 'Photographer', 'Videographer',
      'Media Relations', 'Communications Officer', 'Brand Manager',
      
      // Transportation & Logistics
      'Pilot', 'Air Traffic Controller', 'Logistics Coordinator', 'Supply Chain Manager',
      'Driver', 'Mechanic', 'Aviation Technician', 'Transportation Manager',
      'Fleet Manager', 'Warehouse Manager', 'Procurement Officer',
      
      // Retail & Commerce
      'Store Manager', 'Sales Representative', 'Cashier', 'Inventory Manager',
      'Retail Buyer', 'Merchandiser', 'Customer Service', 'Sales Associate',
      'Import/Export Specialist', 'Customs Officer', 'Trade Specialist',
      
      // Non-Profit & NGO
      'Program Coordinator', 'Grant Writer', 'Community Development Worker',
      'Social Worker', 'Counselor', 'Youth Worker', 'Environmental Activist',
      'Development Worker', 'Aid Worker', 'Volunteer Coordinator', 'Fundraising',
      
      // Sports & Recreation
      'Sports Coach', 'Fitness Instructor', 'Sports Administrator', 'Event Coordinator',
      'Recreation Manager', 'Athletic Trainer', 'Sports Marketing',
      
      // Entertainment & Arts
      'Musician', 'Actor', 'Artist', 'Painter', 'Sculptor', 'Fashion Designer',
      'Interior Designer', 'Graphic Designer', 'Creative Director', 'Art Director',
      
      // Security & Safety
      'Security Guard', 'Police Officer', 'Military Officer', 'Private Investigator',
      'Safety Officer', 'Risk Manager', 'Compliance Officer', 'Security Manager',
      
      // Beauty & Wellness
      'Hair Stylist', 'Beautician', 'Massage Therapist', 'Spa Manager',
      'Wellness Coach', 'Fitness Trainer', 'Nutritionist', 'Beauty Consultant',
      
      // Skilled Trades
      'Electrician', 'Plumber', 'Carpenter', 'Mason', 'Welder', 'Machinist',
      'Maintenance Worker', 'Technician', 'Repair Specialist', 'Installation Specialist',
      
      // Manufacturing & Production
      'Factory Worker', 'Production Manager', 'Quality Control', 'Machine Operator',
      'Assembly Worker', 'Packaging Specialist', 'Manufacturing Engineer',
      
      // Administrative & Support
      'Personal Assistant', 'Secretary', 'Receptionist', 'Office Manager',
      'Administrative Assistant', 'Data Entry Clerk', 'Executive Assistant',
      'Office Administrator', 'Administrative Coordinator',
      
      // Customer Service & Support
      'Customer Support', 'Call Center Agent', 'Technical Support', 'Help Desk',
      'Customer Success', 'Account Manager', 'Client Relations', 'Service Representative',
      
      // Freelance & Consulting
      'Freelancer', 'Consultant', 'Independent Contractor', 'Service Provider',
      'Business Owner', 'Entrepreneur', 'Startup Founder', 'Franchise Owner',
      
      // Research & Analysis
      'Market Research', 'Research Analyst', 'Data Scientist', 'Statistician',
      'Research Coordinator', 'Survey Researcher', 'Policy Researcher',
      
      // Human Resources
      'Recruiter', 'Training Coordinator', 'Employee Relations', 'Compensation Analyst',
      'Benefits Administrator', 'HR Generalist', 'Talent Acquisition', 'HR Business Partner',
      
      // Sales & Marketing
      'Sales Representative', 'Account Executive', 'Territory Manager', 'Sales Coordinator',
      'Marketing Coordinator', 'Brand Specialist', 'Digital Marketing Specialist',
      'Content Marketing', 'Email Marketing', 'Social Media Specialist',
      
      // Operations & Management
      'Operations Analyst', 'Process Improvement', 'Operations Coordinator',
      'Facilities Manager', 'Property Manager', 'Asset Manager', 'Space Planner',
      
      // International & Development
      'International Relations', 'Foreign Affairs', 'Development Specialist',
      'International Business', 'Cross-cultural Consultant', 'Global Program Manager'
    ]
  },
  {
    id: 'personal_corporate_coaching',
    title: 'Personal & Corporate Development Coaching',
    description: 'Unlock personal and team performance',
    subcategories: [
      'Personal Growth Coaching',
      'Confidence & Communication Coaching',
      'Time Management Coaching',
      'Emotional Intelligence Coaching',
      'Public Speaking Coaching',
      'Parenting Coaching',
      'Team Performance Coaching',
      'HR & Legal Compliance Coaching',
      'Customer Service Coaching',
      'Workplace Ethics Coaching'
    ]
  }
];

const TeacherCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Mobile responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // New state for enhanced UI
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Mobile specific state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Edit course dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    duration: 0,
    prerequisites: [] as string[],
    learningObjectives: [] as string[],
    tags: [] as string[],
    careerGoal: '',
    experienceLevel: '',
    timeCommitment: '',
    learningStyle: '',
    specificInterests: [] as string[],
    learningCategories: [] as string[],
    learningSubcategories: [] as string[],
    // Conditional fields for nursery and language levels
    nurseryLevel: '' as 'Nursery 1' | 'Nursery 2' | 'Nursery 3' | '',
    language: '' as 'English' | 'French' | ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  
  // Temporary input states for edit form
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newSpecificInterest, setNewSpecificInterest] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch teacher's courses from the backend
      const response = await courseService.getTeacherCourses({
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      // Transform the courses to include additional counts
      const transformedCourses = response.courses.map(course => ({
        ...course,
        // Calculate additional counts from course content
        materialsCount: course.content?.filter(item => 
          item.type === 'document' || item.type === 'video'
        ).length || 0,
        liveSessionsCount: 0, // This would need to be fetched separately from live sessions API
        assignmentsCount: course.content?.filter(item => 
          item.type === 'assignment'
        ).length || 0,
        assessmentsCount: course.content?.filter(item => 
          item.type === 'quiz'
        ).length || 0,
        videosCount: course.content?.filter(item => 
          item.type === 'video'
        ).length || 0
      }));
      
      setCourses(transformedCourses);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError(err.message || 'Failed to load courses');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    loadCourses();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, course: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  const handleManageCourse = () => {
    if (selectedCourse) {
      navigate(`/course/${selectedCourse._id}/manage`);
    }
    handleMenuClose();
  };

  const handleViewCourse = () => {
    if (selectedCourse) {
      navigate(`/dashboard/teacher/courses/${selectedCourse._id}`);
    }
    handleMenuClose();
  };

  const handleEditCourse = () => {
    if (selectedCourse) {
      setEditingCourse(selectedCourse);
      
      // Filter out old category IDs and only keep the new ones
      const validCategoryIds = [
        'professional_coaching',
        'business_entrepreneurship_coaching',
        'academic_coaching',
        'nursery_coaching',
        'language_coaching',
        'technical_digital_coaching',
        'job_seeker_coaching',
        'personal_corporate_development_coaching'
      ];
      
      const filteredCategories = (selectedCourse.learningCategories || []).filter(
        (category: string) => validCategoryIds.includes(category)
      );
      
      setEditForm({
        title: selectedCourse.title || '',
        description: selectedCourse.description || '',
        category: selectedCourse.category || '',
        level: selectedCourse.level || 'Beginner',
        duration: selectedCourse.duration || 0,
        prerequisites: selectedCourse.prerequisites || [],
        learningObjectives: selectedCourse.learningOutcomes || [],
        tags: selectedCourse.tags || [],
        careerGoal: selectedCourse.careerGoal || '',
        experienceLevel: selectedCourse.experienceLevel || '',
        timeCommitment: selectedCourse.timeCommitment || '',
        learningStyle: selectedCourse.learningStyle || '',
        specificInterests: selectedCourse.specificInterests || [],
        learningCategories: filteredCategories,
        learningSubcategories: selectedCourse.learningSubcategories || [],
        // Conditional fields
        nurseryLevel: selectedCourse.nurseryLevel || '',
        language: selectedCourse.language || ''
      });
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  // Filter and sort courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'createdAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Array management functions for edit form
  const addToArray = (field: keyof typeof editForm, value: string, setter: (value: string) => void) => {
    if (!value.trim()) return;
    
    const currentArray = editForm[field] as string[];
    if (!currentArray.includes(value.trim())) {
      setEditForm(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
      setter('');
    }
  };

  const removeFromArray = (field: keyof typeof editForm, index: number) => {
    const currentArray = editForm[field] as string[];
    setEditForm(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index)
    }));
  };

  // Handle edit form input changes
  const handleEditInputChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle learning category selection for edit
  const handleEditLearningCategoryToggle = (categoryId: string) => {
    const currentCategories = editForm.learningCategories;
    const currentSubcategories = editForm.learningSubcategories;
    
    if (currentCategories.includes(categoryId)) {
      // Remove category and its subcategories
      const category = learningCategories.find(cat => cat.id === categoryId);
      const subcategoriesToRemove = category?.subcategories || [];
      
      handleEditInputChange('learningCategories', currentCategories.filter(id => id !== categoryId));
      handleEditInputChange('learningSubcategories', currentSubcategories.filter(sub => !subcategoriesToRemove.includes(sub)));
    } else {
      // Add category
      handleEditInputChange('learningCategories', [...currentCategories, categoryId]);
    }
  };

  // Handle subcategory selection for edit
  const handleEditSubcategoryToggle = (subcategory: string) => {
    const currentSubcategories = editForm.learningSubcategories;
    
    if (currentSubcategories.includes(subcategory)) {
      handleEditInputChange('learningSubcategories', currentSubcategories.filter(sub => sub !== subcategory));
    } else {
      handleEditInputChange('learningSubcategories', [...currentSubcategories, subcategory]);
    }
  };

  // Get available subcategories for selected categories in edit
  const getEditAvailableSubcategories = () => {
    return editForm.learningCategories.flatMap(categoryId => {
      const category = learningCategories.find(cat => cat.id === categoryId);
      return category?.subcategories || [];
    });
  };

  // Save course changes
  const handleSaveCourse = async () => {
    if (!editingCourse) return;
    
    try {
      setEditLoading(true);
      setEditError(null);
      
      // Update course via API
      const updatedCourse = await courseService.updateCourse(editingCourse._id, editForm);
      
      // Update local state
      setCourses(prev => prev.map(course => 
        course._id === editingCourse._id ? { ...course, ...updatedCourse } : course
      ));
      
      setEditDialogOpen(false);
      setEditingCourse(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update course');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
          {retryCount > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Retry attempt: {retryCount}
            </Typography>
          )}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Modern Header with Gradient Background - Mobile Responsive */}
      <Paper 
        elevation={0} 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: 2, sm: 3 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'flex-start' }, 
            mb: { xs: 2, sm: 3 },
            gap: { xs: 2, sm: 0 }
          }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant={isMobile ? "h4" : "h3"} 
                component="h1" 
                gutterBottom 
                sx={{ fontWeight: 700, mb: { xs: 1, sm: 2 } }}
              >
                My Courses
              </Typography>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                sx={{ 
                  opacity: 0.9, 
                  mb: { xs: 2, sm: 2 },
                  fontSize: { xs: '0.9rem', sm: '1.1rem' }
                }}
              >
                Manage all your courses, materials, and student interactions
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1, sm: 2 }, 
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <Chip 
                  icon={<Dashboard />} 
                  label={`${courses.length} Total Courses`} 
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                />
                <Chip 
                  icon={<People />} 
                  label={`${courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0)} Students`} 
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 1, sm: 2 },
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' },
              mt: { xs: 2, sm: 0 }
            }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                component={Link}
                to="/dashboard/teacher/courses/create"
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                sx={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '&:hover': { background: 'rgba(255,255,255,0.3)' },
                  minWidth: { xs: 'auto', sm: '140px' }
                }}
              >
                {isMobile ? 'Create Course' : 'Create New Course'}
              </Button>
              <Button
                variant="outlined"
                onClick={loadCourses}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.5)', 
                  color: 'white',
                  '&:hover': { borderColor: 'white', background: 'rgba(255,255,255,0.1)' },
                  minWidth: { xs: 'auto', sm: '100px' }
                }}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </Box>
          </Box>
        </Box>
        
        {/* Decorative elements - Hidden on mobile */}
        {!isMobile && (
          <>
            <Box sx={{ 
              position: 'absolute', 
              top: -50, 
              right: -50, 
              width: 200, 
              height: 200, 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.1)',
              zIndex: 1
            }} />
            <Box sx={{ 
              position: 'absolute', 
              bottom: -30, 
              left: -30, 
              width: 150, 
              height: 150, 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)',
              zIndex: 1
            }} />
          </>
        )}
      </Paper>

      {/* Search and Filter Bar - Mobile Responsive */}
      <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        {/* Mobile Search Bar */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            size="small"
          />
        </Box>

        {/* Desktop Search and Filters */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={{ xs: 2, md: 2 }} 
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          {/* Search Field - Hidden on mobile (shown above) */}
          <TextField
            fullWidth
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ 
              maxWidth: { xs: '100%', md: 400 },
              display: { xs: 'none', md: 'block' }
            }}
          />
          
          {/* Mobile Filter Toggle */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setMobileFiltersOpen(true)}
              size="small"
              sx={{ flex: 1, mr: 1 }}
            >
              Filters
            </Button>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Grid View">
                <IconButton 
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  size="small"
                >
                  <Dashboard />
                </IconButton>
              </Tooltip>
              <Tooltip title="List View">
                <IconButton 
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  size="small"
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Desktop Filters */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            gap: 2, 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending_approval">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
              >
                <MenuItem value="createdAt">Date Created</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="enrollmentCount">Students</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<Sort />}
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              size="small"
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Grid View">
                <IconButton 
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  size="small"
                >
                  <Dashboard />
                </IconButton>
              </Tooltip>
              <Tooltip title="List View">
                <IconButton 
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  size="small"
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Stack>
      </Paper>

      {/* Mobile Filters Drawer */}
      <Drawer
        anchor="bottom"
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters & Sort
          </Typography>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending_approval">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="createdAt">Date Created</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="enrollmentCount">Students</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<Sort />}
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              fullWidth
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
            
            <Button
              variant="contained"
              onClick={() => setMobileFiltersOpen(false)}
              fullWidth
            >
              Apply Filters
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {filteredCourses.length === 0 ? (
        <Fade in={true}>
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Box sx={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}>
              <School sx={{ fontSize: 60, color: 'white' }} />
            </Box>
            <Typography variant="h4" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
              {searchTerm || statusFilter !== 'all' ? 'No courses found' : 'No courses yet'}
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create your first course to start teaching and sharing knowledge'
              }
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              component={Link}
              to="/dashboard/teacher/courses/create"
              sx={{ 
                px: 4, 
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              }}
            >
              Create Your First Course
            </Button>
          </Card>
        </Fade>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {filteredCourses.map((course, index) => (
            <Grid 
              item 
              xs={12} 
              sm={viewMode === 'list' ? 12 : 6} 
              md={viewMode === 'list' ? 12 : 6} 
              lg={viewMode === 'list' ? 12 : 4} 
              key={course._id}
            >
              <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: { xs: 2, sm: 3 },
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-8px)' },
                      boxShadow: { xs: '0 4px 12px rgba(0,0,0,0.1)', sm: '0 20px 40px rgba(0,0,0,0.1)' }
                    }
                  }}
                >
                  {/* Course Header with Status - Mobile Responsive */}
                  <Box sx={{ 
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    p: { xs: 1.5, sm: 2 },
                    position: 'relative'
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      mb: { xs: 1, sm: 1 },
                      flexWrap: 'wrap',
                      gap: 1
                    }}>
                      <Chip
                        label={course.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(course.status) as any}
                        size={isMobile ? "small" : "small"}
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, course)}
                        sx={{ 
                          background: 'rgba(255,255,255,0.8)',
                          '&:hover': { background: 'rgba(255,255,255,1)' },
                          minWidth: 'auto'
                        }}
                      >
                        <MoreVert fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                    </Box>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      component="h2" 
                      sx={{ 
                        fontWeight: 700, 
                        lineHeight: 1.3,
                        color: 'text.primary',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        wordBreak: 'break-word'
                      }}
                    >
                      {course.title}
                    </Typography>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      paragraph 
                      sx={{ 
                        mb: { xs: 2, sm: 3 },
                        fontSize: { xs: '0.875rem', sm: '0.875rem' },
                        lineHeight: 1.5
                      }}
                    >
                      {course.description.length > (isMobile ? 80 : 120) 
                        ? `${course.description.substring(0, isMobile ? 80 : 120)}...` 
                        : course.description
                      }
                    </Typography>

                    {/* Course Stats - Mobile Responsive */}
                    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                      <Grid container spacing={{ xs: 1, sm: 2 }}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.5, sm: 1 } }}>
                            <People sx={{ 
                              fontSize: { xs: 16, sm: 18 }, 
                              mr: { xs: 0.5, sm: 1 }, 
                              color: 'primary.main' 
                            }} />
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              {course.enrolledStudents?.length || course.enrollmentCount || 0}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                ml: 0.5,
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                display: { xs: 'none', sm: 'inline' }
                              }}
                            >
                              students
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.5, sm: 1 } }}>
                            <AccessTime sx={{ 
                              fontSize: { xs: 16, sm: 18 }, 
                              mr: { xs: 0.5, sm: 1 }, 
                              color: 'primary.main' 
                            }} />
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              {course.duration || 0}h
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                ml: 0.5,
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                display: { xs: 'none', sm: 'inline' }
                              }}
                            >
                              duration
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Star sx={{ 
                              fontSize: { xs: 16, sm: 18 }, 
                              mr: { xs: 0.5, sm: 1 }, 
                              color: 'warning.main' 
                            }} />
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              {course.rating || 0}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                ml: 0.5,
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                display: { xs: 'none', sm: 'inline' }
                              }}
                            >
                              rating
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Category sx={{ 
                              fontSize: { xs: 16, sm: 18 }, 
                              mr: { xs: 0.5, sm: 1 }, 
                              color: 'primary.main' 
                            }} />
                            <Typography 
                              variant="body2" 
                              fontWeight={600} 
                              sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {course.category}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Course Content Chips - Mobile Responsive */}
                    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="subtitle2" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                      >
                        Content Overview:
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 0.25, sm: 0.5 }, 
                        flexWrap: 'wrap'
                      }}>
                        <Chip
                          icon={<School sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                          label={`${course.materialsCount || 0}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                        <Chip
                          icon={<VideoCall sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                          label={`${course.liveSessionsCount || 0}`}
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                        <Chip
                          icon={<Assignment sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                          label={`${course.assignmentsCount || 0}`}
                          size="small"
                          variant="outlined"
                          color="info"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                        <Chip
                          icon={<Quiz sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                          label={`${course.assessmentsCount || 0}`}
                          size="small"
                          variant="outlined"
                          color="success"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      </Box>
                    </Box>

                    {/* New Discoverability Fields - Mobile Responsive */}
                    {(course.careerGoal || course.experienceLevel || course.timeCommitment || course.learningStyle) && (
                      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                        <Typography 
                          variant="subtitle2" 
                          gutterBottom 
                          sx={{ 
                            fontWeight: 600, 
                            mb: 1,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}
                        >
                          Target Audience:
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: { xs: 0.25, sm: 0.5 }, 
                          flexWrap: 'wrap'
                        }}>
                          {course.careerGoal && (
                            <Chip
                              icon={<Work sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                              label={course.careerGoal.replace('_', ' ')}
                              size="small"
                              variant="filled"
                              color="primary"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                          )}
                          {course.experienceLevel && (
                            <Chip
                              icon={<TrendingUp sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                              label={course.experienceLevel}
                              size="small"
                              variant="filled"
                              color="secondary"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                          )}
                          {course.timeCommitment && (
                            <Chip
                              icon={<Schedule sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                              label={course.timeCommitment}
                              size="small"
                              variant="filled"
                              color="info"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                          )}
                          {course.learningStyle && (
                            <Chip
                              icon={<Psychology sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                              label={course.learningStyle.replace('_', ' ')}
                              size="small"
                              variant="filled"
                              color="success"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    pt: 0, 
                    gap: { xs: 0.5, sm: 1 },
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    <Button
                      variant="contained"
                      startIcon={<Settings sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                      onClick={() => navigate(`/course/${course._id}/manage`)}
                      fullWidth={isMobile}
                      size={isMobile ? "small" : "medium"}
                      sx={{ 
                        flex: { xs: 'none', sm: 1 },
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Manage
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                      onClick={() => navigate(`/dashboard/teacher/courses/${course._id}/manage`)}
                      fullWidth={isMobile}
                      size={isMobile ? "small" : "medium"}
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      View
                    </Button>
                  </CardActions>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Course Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleManageCourse}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage Course</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleViewCourse}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Course</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleEditCourse}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Details</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Course Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          TransitionComponent={Fade}
          TransitionProps={{ timeout: 300 }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: { xs: 2, sm: 3 }
          }}>
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Edit Course Details
            </Typography>
            <IconButton 
              onClick={() => setEditDialogOpen(false)}
              sx={{ color: 'white' }}
              size={isMobile ? "small" : "medium"}
            >
              <Close />
            </IconButton>
          </DialogTitle>
        
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {editError && (
            <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }} onClose={() => setEditError(null)}>
              {editError}
            </Alert>
          )}
          
          <Stack spacing={{ xs: 2, sm: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                gutterBottom 
                sx={{ 
                  fontWeight: 600, 
                  mb: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Basic Information
              </Typography>
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Course Title"
                    value={editForm.title}
                    onChange={(e) => handleEditInputChange('title', e.target.value)}
                    required
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Course Description"
                    multiline
                    rows={isMobile ? 2 : 3}
                    value={editForm.description}
                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                    required
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    options={categories}
                    value={editForm.category}
                    onChange={(event, newValue) => {
                      handleEditInputChange('category', newValue || '');
                    }}
                    onInputChange={(event, newInputValue) => {
                      handleEditInputChange('category', newInputValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Category"
                        required
                        size={isMobile ? "small" : "medium"}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Difficulty Level</InputLabel>
                    <Select
                      value={editForm.level}
                      label="Difficulty Level"
                      onChange={(e) => handleEditInputChange('level', e.target.value)}
                      size={isMobile ? "small" : "medium"}
                    >
                      <MenuItem value="Beginner">Beginner</MenuItem>
                      <MenuItem value="Intermediate">Intermediate</MenuItem>
                      <MenuItem value="Advanced">Advanced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Duration (hours)"
                    type="number"
                    value={editForm.duration}
                    onChange={(e) => handleEditInputChange('duration', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 1, max: 1000 }}
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Target Audience */}
            <Box>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                gutterBottom 
                sx={{ 
                  fontWeight: 600, 
                  mb: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Target Audience & Discoverability
              </Typography>
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Career Goal</InputLabel>
                    <Select
                      value={editForm.careerGoal}
                      label="Career Goal"
                      onChange={(e) => handleEditInputChange('careerGoal', e.target.value)}
                      size={isMobile ? "small" : "medium"}
                    >
                      <MenuItem value="employment">Looking for Employment</MenuItem>
                      <MenuItem value="business_owner">Running a Business</MenuItem>
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="career_change">Career Change</MenuItem>
                      <MenuItem value="skill_upgrade">Skill Upgrade</MenuItem>
                      <MenuItem value="exploring">Just Exploring</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Experience Level</InputLabel>
                    <Select
                      value={editForm.experienceLevel}
                      label="Experience Level"
                      onChange={(e) => handleEditInputChange('experienceLevel', e.target.value)}
                      size={isMobile ? "small" : "medium"}
                    >
                      <MenuItem value="beginner">Beginner</MenuItem>
                      <MenuItem value="intermediate">Intermediate</MenuItem>
                      <MenuItem value="advanced">Advanced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Commitment</InputLabel>
                    <Select
                      value={editForm.timeCommitment}
                      label="Time Commitment"
                      onChange={(e) => handleEditInputChange('timeCommitment', e.target.value)}
                      size={isMobile ? "small" : "medium"}
                    >
                      <MenuItem value="light">1-2 hours/week</MenuItem>
                      <MenuItem value="moderate">3-5 hours/week</MenuItem>
                      <MenuItem value="intensive">6-10 hours/week</MenuItem>
                      <MenuItem value="full_time">10+ hours/week</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Learning Style</InputLabel>
                    <Select
                      value={editForm.learningStyle}
                      label="Learning Style"
                      onChange={(e) => handleEditInputChange('learningStyle', e.target.value)}
                      size={isMobile ? "small" : "medium"}
                    >
                      <MenuItem value="visual">Visual Learning</MenuItem>
                      <MenuItem value="hands_on">Hands-on Practice</MenuItem>
                      <MenuItem value="theoretical">Theoretical Study</MenuItem>
                      <MenuItem value="interactive">Interactive Learning</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Learning Categories */}
            <Box>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Learning Categories *
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Select the learning categories that best match your course content. This helps students find your course based on their interests.
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={{ xs: 1, sm: 1.5 }} mb={2}>
                {learningCategories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.title}
                    onClick={() => handleEditLearningCategoryToggle(category.id)}
                    color={editForm.learningCategories.includes(category.id) ? 'primary' : 'default'}
                    variant={editForm.learningCategories.includes(category.id) ? 'filled' : 'outlined'}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: editForm.learningCategories.includes(category.id) 
                          ? 'primary.dark' 
                          : 'primary.light',
                        color: editForm.learningCategories.includes(category.id) 
                          ? 'white' 
                          : 'primary.main'
                      }
                    }}
                  />
                ))}
              </Box>
              {editForm.learningCategories.length > 0 && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    display: 'block',
                    mb: 1
                  }}
                >
                  Selected Categories: {editForm.learningCategories.map(id => 
                    learningCategories.find(cat => cat.id === id)?.title
                  ).join(', ')}
                </Typography>
              )}

              {/* Subcategories Selection */}
              {editForm.learningCategories.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    Select Specific Subcategories (Optional but Recommended)
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      display: 'block',
                      mb: 1.5
                    }}
                  >
                    Choose specific subcategories to make your course more discoverable and targeted.
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }} mb={2}>
                    {getEditAvailableSubcategories().map((subcategory) => (
                      <Chip
                        key={subcategory}
                        label={subcategory}
                        onClick={() => handleEditSubcategoryToggle(subcategory)}
                        color={editForm.learningSubcategories.includes(subcategory) ? 'secondary' : 'default'}
                        variant={editForm.learningSubcategories.includes(subcategory) ? 'filled' : 'outlined'}
                        size="small"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.7rem' },
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: editForm.learningSubcategories.includes(subcategory) 
                              ? 'secondary.dark' 
                              : 'secondary.light',
                            color: editForm.learningSubcategories.includes(subcategory) 
                              ? 'white' 
                              : 'secondary.main'
                          }
                        }}
                      />
                    ))}
                  </Box>
                  {editForm.learningSubcategories.length > 0 && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.65rem', sm: '0.7rem' },
                        display: 'block',
                        mb: 1
                      }}
                    >
                      Selected Subcategories: {editForm.learningSubcategories.join(', ')}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Conditional Fields for Academic and Nursery Coaching */}
              {(editForm.learningCategories.includes('academic_coaching') || editForm.learningCategories.includes('nursery_coaching')) && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(103, 58, 183, 0.05)', borderRadius: 2, border: '1px solid rgba(103, 58, 183, 0.2)' }}>
                  <Typography 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      fontWeight: 600,
                      mb: 2,
                      color: 'primary.main'
                    }}
                  >
                    📚 Academic & Nursery Course Details
                  </Typography>
                  
                  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {/* Nursery Level - Show only for Nursery Coaching */}
                    {editForm.learningCategories.includes('nursery_coaching') && (
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Nursery Level *</InputLabel>
                          <Select
                            value={editForm.nurseryLevel}
                            label="Nursery Level *"
                            onChange={(e) => handleEditInputChange('nurseryLevel', e.target.value)}
                            size={isMobile ? "small" : "medium"}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Select nursery level</em>
                            </MenuItem>
                            <MenuItem value="Nursery 1">Nursery 1</MenuItem>
                            <MenuItem value="Nursery 2">Nursery 2</MenuItem>
                            <MenuItem value="Nursery 3">Nursery 3</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            mt: 1, 
                            display: 'block',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        >
                          💡 Specify the nursery level this course targets
                        </Typography>
                      </Grid>
                    )}

                    {/* Language Field - Show for both Academic and Nursery */}
                    <Grid item xs={12} sm={editForm.learningCategories.includes('nursery_coaching') ? 6 : 12}>
                      <FormControl fullWidth>
                        <InputLabel>Course Language *</InputLabel>
                        <Select
                          value={editForm.language}
                          label="Course Language *"
                          onChange={(e) => handleEditInputChange('language', e.target.value)}
                          size={isMobile ? "small" : "medium"}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Select language</em>
                          </MenuItem>
                          <MenuItem value="English">English</MenuItem>
                          <MenuItem value="French">French</MenuItem>
                        </Select>
                      </FormControl>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          mt: 1, 
                          display: 'block',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      >
                        💡 Select the language in which this course will be taught
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>

            {/* Prerequisites */}
            <Box>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Prerequisites
              </Typography>
              <Box 
                display="flex" 
                gap={{ xs: 0.5, sm: 1 }} 
                mb={2}
                flexDirection={{ xs: 'column', sm: 'row' }}
              >
                <TextField
                  fullWidth
                  label="Add Prerequisite"
                  value={newPrerequisite}
                  onChange={(e) => setNewPrerequisite(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('prerequisites', newPrerequisite, setNewPrerequisite);
                    }
                  }}
                  size={isMobile ? "small" : "medium"}
                />
                <Button
                  variant="outlined"
                  onClick={() => addToArray('prerequisites', newPrerequisite, setNewPrerequisite)}
                  disabled={!newPrerequisite.trim()}
                  size={isMobile ? "small" : "medium"}
                  sx={{ minWidth: { xs: 'auto', sm: '80px' } }}
                >
                  Add
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }}>
                {editForm.prerequisites.map((prereq, index) => (
                  <Chip
                    key={index}
                    label={prereq}
                    onDelete={() => removeFromArray('prerequisites', index)}
                    color="primary"
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  />
                ))}
              </Box>
            </Box>

            {/* Learning Objectives */}
            <Box>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Learning Objectives
              </Typography>
              <Box 
                display="flex" 
                gap={{ xs: 0.5, sm: 1 }} 
                mb={2}
                flexDirection={{ xs: 'column', sm: 'row' }}
              >
                <TextField
                  fullWidth
                  label="Add Learning Objective"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('learningObjectives', newObjective, setNewObjective);
                    }
                  }}
                  size={isMobile ? "small" : "medium"}
                />
                <Button
                  variant="outlined"
                  onClick={() => addToArray('learningObjectives', newObjective, setNewObjective)}
                  disabled={!newObjective.trim()}
                  size={isMobile ? "small" : "medium"}
                  sx={{ minWidth: { xs: 'auto', sm: '80px' } }}
                >
                  Add
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }}>
                {editForm.learningObjectives.map((objective, index) => (
                  <Chip
                    key={index}
                    label={objective}
                    onDelete={() => removeFromArray('learningObjectives', index)}
                    color="secondary"
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  />
                ))}
              </Box>
            </Box>

            {/* Tags */}
            <Box>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Tags
              </Typography>
              <Box 
                display="flex" 
                gap={{ xs: 0.5, sm: 1 }} 
                mb={2}
                flexDirection={{ xs: 'column', sm: 'row' }}
              >
                <TextField
                  fullWidth
                  label="Add Tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('tags', newTag, setNewTag);
                    }
                  }}
                  size={isMobile ? "small" : "medium"}
                />
                <Button
                  variant="outlined"
                  onClick={() => addToArray('tags', newTag, setNewTag)}
                  disabled={!newTag.trim()}
                  size={isMobile ? "small" : "medium"}
                  sx={{ minWidth: { xs: 'auto', sm: '80px' } }}
                >
                  Add
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }}>
                {editForm.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => removeFromArray('tags', index)}
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  />
                ))}
              </Box>
            </Box>

            {/* Specific Interests */}
            <Box>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Specific Topics & Skills
              </Typography>
              <Box 
                display="flex" 
                gap={{ xs: 0.5, sm: 1 }} 
                mb={2}
                flexDirection={{ xs: 'column', sm: 'row' }}
              >
                <TextField
                  fullWidth
                  label="Add Specific Topic/Skill"
                  value={newSpecificInterest}
                  onChange={(e) => setNewSpecificInterest(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('specificInterests', newSpecificInterest, setNewSpecificInterest);
                    }
                  }}
                  size={isMobile ? "small" : "medium"}
                />
                <Button
                  variant="outlined"
                  onClick={() => addToArray('specificInterests', newSpecificInterest, setNewSpecificInterest)}
                  disabled={!newSpecificInterest.trim()}
                  size={isMobile ? "small" : "medium"}
                  sx={{ minWidth: { xs: 'auto', sm: '80px' } }}
                >
                  Add
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }}>
                {editForm.specificInterests.map((interest, index) => (
                  <Chip
                    key={index}
                    label={interest}
                    onDelete={() => removeFromArray('specificInterests', index)}
                    color="info"
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: { xs: 2, sm: 3 }, 
          gap: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={editLoading}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCourse}
            variant="contained"
            startIcon={editLoading ? <CircularProgress size={20} /> : <Save />}
            disabled={editLoading}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
              order: { xs: 1, sm: 2 }
            }}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherCourses;
