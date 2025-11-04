import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Alert, 
  Chip, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  LinearProgress,
  Tabs,
  Tab,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Paper,
  Divider
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { studentProfileService } from '../../services/studentProfileService';
import { isLearnerRole } from '../../utils/roleUtils';
// Define interface for user with extended properties
interface ExtendedUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  bio?: string;
  skills?: string[];
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  [key: string]: any;
}
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { 
  OpenInNew, 
  Assignment, 
  Person, 
  School, 
  Psychology, 
  TrendingUp,
  FilterList,
  Search,
  AutoAwesome,
  Work
} from '@mui/icons-material';

type Opportunity = {
  id: string;
  title: string;
  company: string;
  description: string;
  skills: string[];
  location: string;
  type: string;
  category: string;
  experienceLevel: string;
  educationLevel: string;
  salary?: unknown;
  original?: unknown;
  matchScore?: number;
  courseMatches?: string[];
  aiRecommendation?: string;
};

type CourseJobStats = {
  courseName: string;
  jobCount: number;
  averageSalary?: number;
  skillMatches: string[];
  jobs: Opportunity[];
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>{children}</Box>}
  </div>
);

const StudentOpportunitiesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [allJobs, setAllJobs] = useState<Opportunity[]>([]);
  const [courseJobStats, setCourseJobStats] = useState<CourseJobStats[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Opportunity[]>([]);
  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 0,
    missingFields: [] as string[],
    isComplete: false
  });
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExperience, setFilterExperience] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [completedCoursesCount, setCompletedCoursesCount] = useState(0);

  // Load profile completion
  const loadProfileCompletion = async () => {
    if (isLearnerRole(user?.role)) {
      try {
        console.log('🔍 Loading student profile completion for opportunities page...');
        const response = await studentProfileService.getMyProfile();
        console.log('📊 Student profile response:', {
          percentage: response.completionPercentage,
          missingFields: response.missingFields,
          hasProfile: !!response.profile,
          profileDateOfBirth: response.profile?.dateOfBirth
        });
        
        setStudentProfile(response.profile);
        console.log('👤 Student profile data:', {
          profile: response.profile,
          dateOfBirth: response.profile?.dateOfBirth,
          age: response.profile?.age,
          allFields: Object.keys(response.profile || {}),
          hasDateOfBirth: !!response.profile?.dateOfBirth
        });
        
        setProfileCompletion({
          percentage: response.completionPercentage,
          missingFields: response.missingFields,
          isComplete: response.completionPercentage === 100
        });
      } catch (e) {
        console.error('❌ Could not load profile completion:', e);
        console.log('📋 Falling back to alternative calculation...');
        
        // Use fallback calculation based on user data from useAuth
        if (user) {
          const fallbackPercentage = calculateFallbackCompletion(user);
          console.log('🔄 Fallback completion calculated:', fallbackPercentage + '%');
          setProfileCompletion({
            percentage: fallbackPercentage,
            missingFields: [],
            isComplete: fallbackPercentage === 100
          });
        } else {
          setProfileCompletion({
            percentage: 0,
            missingFields: [],
            isComplete: false
          });
        }
      }
    } else {
      // Always use fallback for non-students or testing
      if (user) {
        const fallbackPercentage = calculateFallbackCompletion(user);
        console.log('🔄 Using fallback calculation (not student):', fallbackPercentage + '%');
        setProfileCompletion({
          percentage: fallbackPercentage,
          missingFields: [],
          isComplete: fallbackPercentage === 100
        });
      }
    }
  };

  // Simplified calculation focusing on essential fields for opportunities
  const calculateFallbackCompletion = (userData: ExtendedUser) => {
    let completedFields = 0;
    const totalFields = 5; // Essential fields for opportunities: age + basic info
    
    // Essential fields for opportunities access
    if (userData.firstName) completedFields++;
    if (userData.lastName) completedFields++;
    if (userData.email) completedFields++;
    
    // Calculate age from dateOfBirth if available
    if (userData.dateOfBirth) {
      completedFields++;
      console.log('🎂 Date of birth available:', userData.dateOfBirth);
    }
    
    // Count skills as one field
    if (userData.skills && Array.isArray(userData.skills) && userData.skills.length > 0) {
      completedFields++;
      console.log('🎯 Skills available:', userData.skills);
    }
    
    const percentage = Math.round((completedFields / totalFields) * 100);
    console.log('📊 Completion calculation:', `${completedFields}/${totalFields} = ${percentage}%`);
    return percentage;
  };

  useEffect(() => {
    if (user) {
      console.log('👤 User data from useAuth:', {
        role: user?.role,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        bio: (user as ExtendedUser)?.bio,
        skills: (user as ExtendedUser)?.skills,
        dateOfBirth: (user as ExtendedUser)?.dateOfBirth,
        phoneNumber: (user as ExtendedUser)?.phoneNumber,
        address: (user as ExtendedUser)?.address
      });
      loadProfileCompletion();
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
  }, [user]);

  useEffect(() => {
    (async () => {
      if (!user || !isLearnerRole(user?.role)) return;

      let completedCourses: string[] = [];
      try {
        const { enrollmentService } = await import('../../services/enrollmentService');
        const enrolls = await enrollmentService.getMyEnrollments();
        const progress100 = Array.isArray(enrolls.enrollments) ? enrolls.enrollments.filter(e => (e.progress?.totalProgress || 0) >= 100) : [];
        completedCourses = progress100.map(e => (typeof e.course === 'string' ? e.course : e.course?._id) || '').filter(Boolean);
        setCompletedCoursesCount(completedCourses.length);
        console.log('📚 Completed courses found:', completedCourses.length);
      } catch (e) {
        console.warn('Could not load enrollments:', e);
      }

      try {
        setLoading(true); setError(null);
        const apiClient = await import('../../services/apiClient');
        
        console.log('🚀 Starting job fetch process...');
        console.log('📚 Completed courses:', completedCourses.length);
        
        // Fetch ALL jobs - try different approaches
        let allJobsFetch = await apiClient.default.getLearningOpportunitiesByProfile([]);
        console.log('📊 First fetch result:', allJobsFetch?.length || 0);
        
        // If we get fewer than 10 jobs, try additional endpoints
        if (allJobsFetch.length < 10) {
          try {
            const apiModule = await import('../../services/api');
            const api = apiModule.default;
            console.log('🔄 Trying additional job endpoints...');
            
            // Try other endpoints
            const additionalEndpoints = ['/jobs/all', '/jobs/public', '/opportunities'];
            for (const endpoint of additionalEndpoints) {
              try {
                const response = await api.get(endpoint);
                if (response.data && Array.isArray(response.data.data)) {
                  const additionalJobs = response.data.data.map((job: any) => ({
                    id: String(job._id || job.id || Math.random()),
                    title: job.title,
                    company: job.company || job.employer?.company || '',
                    description: job.description || '',
                    skills: Array.isArray(job.skillsRequired) ? job.skillsRequired : 
                            Array.isArray(job.skills) ? job.skills : [],
                    location: job.location || '',
                    type: job.jobType || 'full_time',
                    category: job.category || '',
                    experienceLevel: job.experienceLevel || 'entry_level',
                    educationLevel: job.educationLevel || '',
                    salary: job.salary || null,
                    original: job
                  }));
                  
                  // Add unique jobs
                  const existingTitles = allJobsFetch.map(j => j.title);
                  const uniqueNewJobs = additionalJobs.filter((job: any) => 
                    !existingTitles.includes(job.title)
                  );
                  allJobsFetch.push(...uniqueNewJobs);
                  console.log(`📊 Added ${uniqueNewJobs.length} jobs from ${endpoint}`);
                }
              } catch (endpointError) {
                console.warn(`❌ Endpoint ${endpoint} failed:`, endpointError);
              }
            }
          } catch (additionalError) {
            console.warn('❌ Additional job fetch failed:', additionalError);
          }
        }
        
        setAllJobs(allJobsFetch);
        console.log('📈 Total jobs loaded:', allJobsFetch.length);
        
        // Fetch personalized opportunities based on completed courses
        const personalJobs = completedCourses.length > 0 ? 
          allJobsFetch.filter(job => {
            // Simple filtering based on completed course skills
            return completedCourses.some(() => true); // For now, return all jobs
          }) : allJobsFetch.slice(0, 20); // Show first 20 if no completed courses
        
        setOpportunities(personalJobs);
        console.log('🎯 Personal opportunities:', personalJobs.length);
        
        // Generate AI recommendations
        const aiJobs = await generateAIRecommendations(allJobsFetch, studentProfile || user);
        setRecommendedJobs(aiJobs);
        console.log('🤖 AI recommendations:', aiJobs.length);
        
        // Calculate course-based job statistics
        const courseStats = await calculateCourseJobStats(allJobsFetch);
        setCourseJobStats(courseStats);
        console.log('📚 Course statistics:', courseStats.length);
        
      } catch (e) {
        console.error('❌ Job fetch error:', e);
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // AI-powered job recommendation based on user profile
  const generateAIRecommendations = async (jobs: Opportunity[], userProfile: any) => {
    try {
      // Simple AI recommendation based on skill matching and profile data
      const userSkills = userProfile?.skills || [];
      const userInterests = userProfile?.bio?.split(',') || [];
      
      const aiRecommendedJobs = jobs.map(job => {
        let matchScore = 0;
        let recommendations: string[] = [];

        // Skill matching (40% weight)
        const skillMatches = job.skills.filter((skill: string) => 
          userSkills.some((userSkill: string) => 
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
          )
        );
        matchScore += (skillMatches.length / job.skills.length) * 40;

        // Interest matching (30% weight)
        if (userInterests.some((interest: string) => 
          job.description.toLowerCase().includes(interest.toLowerCase()) ||
          job.title.toLowerCase().includes(interest.toLowerCase())
        )) {
          matchScore += 30;
        }

        // Experience level match (20% weight)
        const userEducationLevel = userProfile?.educationLevel || 'undergraduate';
        if (job.experienceLevel === 'entry_level' || 
            (userEducationLevel === 'graduate' && ['mid_level', 'senior_level'].includes(job.experienceLevel))) {
          matchScore += 20;
        }

        // Location preference (10% weight)
        if (job.location.toLowerCase().includes('uganda') || 
            job.location.toLowerCase().includes('kampala')) {
          matchScore += 10;
        }

        // Generate AI recommendation text
        if (matchScore > 60) {
          recommendations.push("🎯 High match based on your skills and interests");
        }
        if (skillMatches.length > 0) {
          recommendations.push(`🔧 Strong skill overlap: ${skillMatches.join(', ')}`);
        }
        if (userInterests.length > 0) {
          recommendations.push(`💡 Aligns with your career interests`);
        }

        return {
          ...job,
          matchScore: Math.round(matchScore),
          courseMatches: skillMatches,
          aiRecommendation: recommendations.join(' • ')
        };
      }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      console.log('🤖 AI recommendations generated:', aiRecommendedJobs.slice(0, 5));
      return aiRecommendedJobs.filter(job => job.matchScore && job.matchScore >= 30);
    } catch (error) {
      console.error('❌ AI recommendation failed:', error);
      return jobs.map(job => ({ ...job, matchScore: 0 }));
    }
  };

  // Fetch real courses and calculate course-based job statistics
  const calculateCourseJobStats = async (jobs: Opportunity[]) => {
    try {
      let realCourses: any[] = [];
      
      // Try to fetch real courses from the system
      try {
        const { courseService } = await import('../../services/courseService');
        console.log('🔍 Fetching real courses from backend...');
        const coursesResponse = await courseService.getAllCourses();
        console.log('📊 Course service response:', coursesResponse);
        
        if (coursesResponse && (coursesResponse as any).data) {
          realCourses = Array.isArray((coursesResponse as any).data) ? (coursesResponse as any).data : [];
        } else if (coursesResponse && (coursesResponse as any).courses) {
          realCourses = Array.isArray(coursesResponse.courses) ? coursesResponse.courses : [];
        } else if (Array.isArray(coursesResponse)) {
          realCourses = coursesResponse;
        }
        
        console.log('📚 Real courses fetched:', realCourses.length);
        console.log('📝 Sample course data:', realCourses.slice(0, 2));
      } catch (e) {
        console.warn('❌ Could not fetch real courses:', e);
        
        // Try alternative course fetching method
        try {
          const apiModule = await import('../../services/api');
          const api = apiModule.default;
          const altResponse = await api.get('/courses');
          if (altResponse.data && Array.isArray(altResponse.data.data)) {
            realCourses = altResponse.data.data;
            console.log('📚 Alternative course fetch successful:', realCourses.length);
          }
        } catch (altError) {
          console.warn('❌ Alternative course fetch also failed:', altError);
        }
      }

      // Enhanced course mapping with more comprehensive skill sets
      const courseSkillsMap: { [key: string]: { skills: string[], keywords: string[] } } = {
        'Web Development': {
          skills: ['javascript', 'react', 'html', 'css', 'node', 'frontend', 'backend', 'vue', 'angular', 'typescript'],
          keywords: ['web', 'developer', 'front-end', 'back-end', 'fullstack', 'frontend', 'backend']
        },
        'Data Science & Analytics': {
          skills: ['python', 'data analysis', 'machine learning', 'sql', 'statistics', 'r', 'tableau', 'power bi'],
          keywords: ['data scientist', 'data analyst', 'analytics', 'data science', 'ml engineer']
        },
        'Mobile Development': {
          skills: ['android', 'ios', 'flutter', 'react native', 'kotlin', 'swift', 'mobile'],
          keywords: ['mobile', 'app developer', 'android developer', 'ios developer']
        },
        'UI/UX Design': {
          skills: ['figma', 'photoshop', 'illustrator', 'sketch', 'design', 'wireframing', 'prototyping'],
          keywords: ['ui designer', 'ux designer', 'product designer', 'user experience']
        },
        'Digital Marketing': {
          skills: ['seo', 'sem', 'google ads', 'facebook ads', 'social media', 'analytics', 'email marketing'],
          keywords: ['digital marketing', 'marketing specialist', 'social media manager', 'seo specialist']
        },
        'Project Management': {
          skills: ['project management', 'agile', 'scrum', 'leadership', 'planning', 'product management'],
          keywords: ['project manager', 'product manager', 'scrum master', 'team lead']
        },
        'Cybersecurity': {
          skills: ['security', 'cybersecurity', 'penetration testing', 'network security', 'ethical hacking'],
          keywords: ['security analyst', 'cybersecurity', 'penetration tester', 'security engineer']
        },
        'Cloud Computing': {
          skills: ['aws', 'azure', 'google cloud', 'kubernetes', 'docker', 'terraform', 'cloud'],
          keywords: ['cloud engineer', 'devops engineer', 'cloud architect', 'cloud developer']
        },
        'Database Management': {
          skills: ['sql', 'mysql', 'postgresql', 'mongodb', 'database', 'nosql', 'data modeling'],
          keywords: ['database administrator', 'dba', 'database developer', 'data engineer']
        }
      };

      const courseStats: CourseJobStats[] = [];

      // Process real courses first, then fallback to predefined courses
      let coursesToProcess = realCourses;
      
      if (realCourses.length === 0) {
        console.log('📚 No real courses found, using comprehensive course mapping...');
        coursesToProcess = Object.keys(courseSkillsMap).map(name => ({ 
          _id: name.toLowerCase().replace(/\s+/g, '-'),
          name: name,
          title: name,
          description: `Comprehensive ${name} course covering essential skills and technologies`,
          skills: courseSkillsMap[name].skills,
          isRealCourse: false
        }));
      } else {
        console.log('✅ Using real courses from backend');
        // Add the real courses and ensure we have comprehensive coverage
        const predefinedCourses = Object.keys(courseSkillsMap).map(name => ({
          _id: `predefined-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name: name,
          title: name,
          description: `Industry-standard ${name} curriculum`,
          skills: courseSkillsMap[name].skills,
          isRealCourse: true
        }));
        
        // Combine real and predefined courses, removing duplicates
        const allCourseNames = new Set(realCourses.map(c => c.name || c.title));
        const newPredefined = predefinedCourses.filter(c => !allCourseNames.has(c.name));
        coursesToProcess = [...realCourses, ...newPredefined];
        
        console.log('📊 Final course mix:', {
          realCourses: realCourses.length,
          predefinedCourses: newPredefined.length,
          total: coursesToProcess.length
        });
      }

      coursesToProcess.forEach(course => {
        const courseName = course.name || course.title || 'Unknown Course';
        const courseId = course._id || course.id;
        
        // Get skills mapping for this course (fallback to predefined)
        let courseSkillsInfo = courseSkillsMap[courseName];
        if (!courseSkillsInfo && realCourses.length > 0) {
          // Analyze course description and skills for new courses
          const description = (course.description || '').toLowerCase();
          const skills = course.skills || [];
          
          // Extract relevant skills from description
          const extractedSkills = courseSkillsMap['Web Development'].skills.filter(skill => 
            description.includes(skill.toLowerCase())
          );
          
          courseSkillsInfo = {
            skills: [...skills, ...extractedSkills],
            keywords: [courseName.toLowerCase()]
          };
        }

        if (!courseSkillsInfo) return;

        const { skills: courseSkills, keywords } = courseSkillsInfo;

        // Improved job matching algorithm
        const matchingJobs = jobs.filter(job => {
          const jobTitle = job.title.toLowerCase();
          const jobDescription = job.description.toLowerCase();
          const jobSkills = job.skills.map(s => s.toLowerCase());

          // Check for keyword matches in title/description (stronger weight)
          const keywordMatches = keywords.some(keyword => 
            jobTitle.includes(keyword.toLowerCase()) || jobDescription.includes(keyword.toLowerCase())
          );

          // Check for skill matches
          const skillMatches = jobSkills.some(jobSkill => 
            courseSkills.some(courseSkill => 
              jobSkill.includes(courseSkill.toLowerCase()) ||
              courseSkill.toLowerCase().includes(jobSkill)
            )
          );

          return keywordMatches || skillMatches;
        });

        // Calculate actual skill overlaps for accurate matching
        const skillMatches = courseSkills.filter(courseSkill =>
          jobs.some(job => 
            job.skills.some(jobSkill =>
              jobSkill.toLowerCase().includes(courseSkill.toLowerCase()) ||
              courseSkill.toLowerCase().includes(jobSkill.toLowerCase())
            )
          )
        );

        // Calculate average salary if available
        const salaries = matchingJobs.map(job => {
          if (typeof job.salary === 'number') return job.salary;
          if (typeof job.salary === 'string') {
            const num = parseInt(job.salary.replace(/[^\d]/g, ''));
            return isNaN(num) ? 0 : num;
          }
          return 0;
        }).filter(s => s > 0);

        const averageSalary = salaries.length > 0 ? 
          Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : undefined;

        courseStats.push({
          courseName,
          jobCount: matchingJobs.length,
          averageSalary,
          skillMatches: skillMatches.slice(0, 8), // Top skill matches
          jobs: matchingJobs.slice(0, 10) // Top 10 jobs per course
        });
      });

      // Sort by job count (most jobs first)
      courseStats.sort((a, b) => b.jobCount - a.jobCount);
      
      console.log('📊 Course job stats calculated:', {
        totalCourses: courseStats.length,
        totalJobs: jobs.length,
        topCourses: courseStats.slice(0, 5).map(c => ({ name: c.courseName, jobs: c.jobCount }))
      });
      
      return courseStats;
    } catch (error) {
      console.error('❌ Course stats calculation failed:', error);
      return [];
    }
  };

  // Handle opening profile modal
  const handleOpenProfileModal = () => {
    window.dispatchEvent(new CustomEvent('openProfileModal'));
  };

  // Check if profile completion is over 40%
  const profileComplete = profileCompletion.percentage >= 40;
  const eighteenPlus = (() => {
    // Use dateOfBirth from studentProfile if available, otherwise fall back to user
    const dateOfBirth = (studentProfile as ExtendedUser)?.dateOfBirth || (user as ExtendedUser)?.dateOfBirth;
    
    if (!dateOfBirth) {
      console.log('🚫 No date of birth available in either source:', {
        studentProfile: !!(studentProfile as ExtendedUser)?.dateOfBirth,
        user: !!(user as ExtendedUser)?.dateOfBirth,
        studentProfileDOB: (studentProfile as ExtendedUser)?.dateOfBirth,
        userDOB: (user as ExtendedUser)?.dateOfBirth
      });
      return false;
    }
    
    const dob = new Date(String(dateOfBirth));
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    
    console.log('🎂 Age calculated:', {
      age,
      dateOfBirth,
      source: studentProfile?.dateOfBirth ? 'studentProfile' : 'user'
    });
    
    return age >= 18;
  })();

  if (!user || !isLearnerRole(user?.role)) {
    return (
      <ResponsiveDashboard>
        <Alert severity='info'>Opportunities are available for students, job seekers, and professionals.</Alert>
      </ResponsiveDashboard>
    );
  }

  if (!profileComplete) {
    return (
      <ResponsiveDashboard>
        <Container>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Profile Completion Required
            </Typography>
            <Alert severity='warning' sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              Complete your profile to at least 40% to view opportunities.
              <br />
              Current completion: {profileCompletion.percentage}%
              {profileCompletion.missingFields.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  Missing: {profileCompletion.missingFields.slice(0, 3).join(', ')}
                  {profileCompletion.missingFields.length > 3 && ` +${profileCompletion.missingFields.length - 3} more`}
                </Box>
              )}
            </Alert>
            <Button
              variant="contained"
              size="large"
              startIcon={<Person />}
              onClick={handleOpenProfileModal}
              sx={{ px: 4 }}
            >
              Complete Profile
            </Button>
          </Box>
        </Container>
      </ResponsiveDashboard>
    );
  }

  if (!eighteenPlus) {
    return (
      <ResponsiveDashboard>
        <Alert severity='warning' sx={{ mb: 1 }}>
          You must be 18 or older to browse opportunities.
        </Alert>
      </ResponsiveDashboard>
    );
  }

  if (loading) return <ResponsiveDashboard><LinearProgress /></ResponsiveDashboard>;

  if (error) {
    return (
      <ResponsiveDashboard>
        <Alert severity='error'>Unable to fetch opportunities. Please try again later.</Alert>
      </ResponsiveDashboard>
    );
  }

  const handleViewDetails = () => {
    window.open('https://exjobnet.com', '_blank');
  };

  // Filter jobs based on search and other criteria
  const filteredJobs = allJobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesExperience = !filterExperience || job.experienceLevel === filterExperience;
    const matchesLocation = !filterLocation || job.location.toLowerCase().includes(filterLocation.toLowerCase());
    
    return matchesSearch && matchesExperience && matchesLocation;
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const JobCard: React.FC<{ job: Opportunity; showScore?: boolean }> = ({ job, showScore = false }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Typography variant='h6' gutterBottom sx={{ flex: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {job.title}
          </Typography>
          {showScore && job.matchScore && (
            <Chip 
              label={`${job.matchScore}%`} 
              size='small' 
              color='success' 
              sx={{ ml: 1, fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
            />
          )}
        </Box>
        
        <Typography 
          variant='subtitle1' 
          color='textSecondary' 
          gutterBottom
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          {job.company} • {job.location}
        </Typography>
        
        {job.aiRecommendation && (
          <Alert 
            severity='info' 
            sx={{ 
              mb: 2, 
              fontSize: { xs: '0.75rem', sm: '0.8rem' }, 
              py: { xs: 0.5, sm: 0.5 },
              '& .MuiAlert-message': { fontSize: { xs: '0.75rem', sm: '0.8rem' } }
            }}
          >
            {job.aiRecommendation}
          </Alert>
        )}
        
        <Typography 
          variant='body2' 
          sx={{ 
            mb: 2,
            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            lineHeight: { xs: 1.4, sm: 1.5 }
          }}
        >
          {window.innerWidth < 600 ? 
            `${job.description.substring(0, 120)}...` : 
            `${job.description.substring(0, 150)}...`
          }
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          {(window.innerWidth < 600 ? job.skills.slice(0, 3) : job.skills.slice(0, 4)).map((skill) => (
            <Chip 
              key={skill} 
              label={skill} 
              size='small' 
              sx={{ 
                mr: 1, 
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: '0.625rem', sm: '0.75rem' }
              }}
            />
          ))}
          {job.skills.length > (window.innerWidth < 600 ? 3 : 4) && (
            <Chip 
              label={`+${job.skills.length - (window.innerWidth < 600 ? 3 : 4)}`} 
              size='small' 
              variant='outlined'
              sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
          <Chip 
            label={job.type} 
            size='small' 
            color='primary' 
            variant='outlined'
            sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
          />
          <Chip 
            label={job.experienceLevel} 
            size='small' 
            color='secondary' 
            variant='outlined'
            sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
          />
          {job.category && (
            <Chip 
              label={job.category} 
              size='small' 
              color='default' 
              variant='outlined'
              sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
            />
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1, sm: 1.5 } }}>
        <Button
          variant='contained'
          startIcon={<OpenInNew />}
          onClick={() => window.open(`https://exjobnet.africa/search?q=${encodeURIComponent(job.title)}`, '_blank')}
          sx={{ 
            flexGrow: 1,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.75, sm: 1 }
          }}
        >
          View on ExJobNet
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <ResponsiveDashboard>
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h4' sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Career Opportunities
          </Typography>
          <Chip 
            icon={<AutoAwesome />} 
            label={`${opportunities.length} opportunities`} 
            color='primary'
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              '& .MuiChip-icon': { fontSize: { xs: '1rem', sm: '1.25rem' } }
            }}
          />
        </Box>

        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

        {/* Search and Filter Bar - Mobile Responsive */}
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
          <Stack spacing={{ xs: 1.5, sm: 2 }}>
            <TextField
              fullWidth
              placeholder="Search jobs, companies, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Experience
                </InputLabel>
                <Select
                  value={filterExperience}
                  onChange={(e) => setFilterExperience(e.target.value)}
                  label="Experience"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    All Levels
                  </MenuItem>
                  <MenuItem value="entry_level" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Entry Level
                  </MenuItem>
                  <MenuItem value="mid_level" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Mid Level
                  </MenuItem>
                  <MenuItem value="senior_level" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Senior Level
                  </MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                placeholder="Location"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                sx={{
                  minWidth: { xs: '100%', sm: 120 },
                  '& .MuiOutlinedInput-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Stack>
          </Stack>
        </Paper>

        {/* Tabs - Mobile Responsive */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: 3,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { 
            backgroundColor: 'grey.400',
            borderRadius: 2
          }
        }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minWidth: '100%',
              '& .MuiTab-root': {
                minHeight: { xs: 48, sm: 56 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '& .MuiTab-iconWrapper': {
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  mb: { xs: 0, sm: 0.5 }
                }
              }
            }}
          >
            <Tab 
              icon={<AutoAwesome />} 
              label={
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  gap: { xs: 0, sm: 0.5 }
                }}>
                  <span>AI Recommendations</span>
                  <Chip 
                    label={recommendedJobs.length} 
                    size="small" 
                    sx={{ 
                      fontSize: '0.625rem', 
                      height: { xs: 16, sm: 20 },
                      ml: { xs: 0, sm: 0.5 }
                    }} 
                  />
                </Box>
              }
              iconPosition="start"
              sx={{ flex: { xs: '0 0 auto', sm: 1 } }}
            />
            <Tab 
              icon={<Assignment />} 
              label={
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  gap: { xs: 0, sm: 0.5 }
                }}>
                  <span>Course Matches</span>
                  <Chip 
                    label={opportunities.length} 
                    size="small" 
                    sx={{ 
                      fontSize: '0.625rem', 
                      height: { xs: 16, sm: 20 },
                      ml: { xs: 0, sm: 0.5 }
                    }} 
                  />
                </Box>
              }
              iconPosition="start"
              sx={{ flex: { xs: '0 0 auto', sm: 1 } }}
            />
            <Tab 
              icon={<Work />} 
              label={
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  gap: { xs: 0, sm: 0.5 }
                }}>
                  <span>All Jobs</span>
                  <Chip 
                    label={allJobs.length} 
                    size="small" 
                    sx={{ 
                      fontSize: '0.625rem', 
                      height: { xs: 16, sm: 20 },
                      ml: { xs: 0, sm: 0.5 }
                    }} 
                  />
                </Box>
              }
              iconPosition="start"
              sx={{ flex: { xs: '0 0 auto', sm: 1 } }}
            />
            <Tab 
              icon={<School />} 
              label="Popular Courses"
              iconPosition="start"
              sx={{ flex: { xs: '0 0 auto', sm: 1 } }}
            />
          </Tabs>
        </Box>

        {loading ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading opportunities...</Typography>
          </Box>
        ) : (
          <>
            {/* AI Recommendations Tab */}
            <TabPanel value={currentTab} index={0}>
              <Typography variant='h5' sx={{ mb: 3 }}>
                <AutoAwesome sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI-Powered Job Recommendations
              </Typography>
              {completedCoursesCount === 0 ? (
                <Box textAlign='center' py={6}>
                  <AutoAwesome sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                  <Typography variant='h5' gutterBottom>
                    Complete Courses for AI Recommendations
                  </Typography>
                  <Typography variant='body1' color='textSecondary' sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                    Our AI needs to learn about your skills through completed courses to provide accurate job recommendations.
                    Complete courses and fill out your profile for personalized suggestions!
                  </Typography>
                  <Alert severity='warning' sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                    🤖 Complete courses + update profile → Better AI recommendations
                  </Alert>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent='center'>
                    <Button 
                      variant='contained' 
                      size='large'
                      startIcon={<School />}
                      onClick={() => window.location.href = '/dashboard/student/courses'}
                    >
                      Start Learning
                    </Button>
                    <Button 
                      variant='outlined' 
                      size='large'
                      startIcon={<Person />}
                      onClick={handleOpenProfileModal}
                    >
                      Update Profile
                    </Button>
                  </Stack>
                </Box>
              ) : recommendedJobs.length > 0 ? (
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                  {recommendedJobs.slice(0, 12).map((job) => (
                    <Grid item xs={12} sm={6} md={4} key={job.id}>
                      <JobCard job={job} showScore={true} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box textAlign='center' py={4}>
                  <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant='h6' color='textSecondary'>
                    No recommendations yet
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Complete more courses and update your profile for better AI recommendations
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Course Matches Tab */}
            <TabPanel value={currentTab} index={1}>
              <Typography variant='h5' sx={{ mb: 3 }}>
                <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Jobs Matching Your Completed Courses
              </Typography>
              
              {completedCoursesCount === 0 ? (
                <Box textAlign='center' py={6}>
                  <School sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                  <Typography variant='h5' gutterBottom>
                    Complete Your First Course!
                  </Typography>
                  <Typography variant='body1' color='textSecondary' sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                    Complete courses to unlock personalized job recommendations based on your learning progress.
                    The more courses you finish, the better our AI can match you with opportunities!
                  </Typography>
                  <Alert severity='info' sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                    📚 Complete any course with 100% progress to see relevant job opportunities
                  </Alert>
                  <Button 
                    variant='contained' 
                    size='large'
                    startIcon={<School />}
                    onClick={() => window.location.href = '/dashboard/student/courses'}
                    sx={{ px: 4 }}
                  >
                    Browse Available Courses
                  </Button>
                </Box>
              ) : opportunities.length > 0 ? (
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                  {opportunities.map((job) => (
                    <Grid item xs={12} sm={6} md={4} key={job.id}>
                      <JobCard job={job} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box textAlign='center' py={4}>
                  <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant='h6' color='textSecondary'>
                    No course-matched jobs found
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Complete more courses to see personalized opportunities
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* All Jobs Tab */}
            <TabPanel value={currentTab} index={2}>
              <Typography variant='h5' sx={{ mb: 3 }}>
                <Work sx={{ mr: 1, verticalAlign: 'middle' }} />
                All Available Jobs ({filteredJobs.length})
              </Typography>
              {filteredJobs.length > 0 ? (
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                  {filteredJobs.slice(0, 50).map((job) => (
                    <Grid item xs={12} sm={6} md={4} key={job.id}>
                      <JobCard job={job} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box textAlign='center' py={4}>
                  <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant='h6' color='textSecondary'>
                    No jobs found
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Try adjusting your search criteria
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Popular Courses Tab */}
            <TabPanel value={currentTab} index={3}>
              <Box sx={{ mb: 3 }}>
                <Typography variant='h5' sx={{ mb: 2 }}>
                  <School sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Courses with Most Job Opportunities
                </Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                  📊 Rankings based on actual job matches from ExJobNet. Comprehensive analysis showing which courses lead to the most opportunities in your region.
                </Alert>
              </Box>
              
              {courseJobStats.length > 0 && (
                <Box sx={{ mb: 3, p: { xs: 1.5, sm: 2 }, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant='h4' color='primary' sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                          {courseJobStats.length}
                        </Typography>
                        <Typography variant='overline' sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                          Courses Analyzed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant='h4' color='success.main' sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                          {courseJobStats.reduce((sum, course) => sum + course.jobCount, 0)}
                        </Typography>
                        <Typography variant='overline' sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                          Total Job Matches
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant='h4' color='warning.main' sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                          {Math.round(courseJobStats.reduce((sum, course) => sum + course.jobCount, 0) / courseJobStats.length)}
                        </Typography>
                        <Typography variant='overline' sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                          Avg Jobs per Course
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {courseJobStats.length > 0 ? (
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                  {courseJobStats.map((course, index) => (
                    <Grid item xs={12} sm={6} md={4} key={course.courseName}>
                      <Card sx={{ height: '100%', position: 'relative' }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant='h6' gutterBottom sx={{ flex: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                              {course.courseName}
                            </Typography>
                            <Chip 
                              label={`#${String(index + 1)}`} 
                              size='small' 
                              color={course.jobCount >= 10 ? 'success' : course.jobCount >= 5 ? 'warning' : 'default'}
                              sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                            <Typography variant='h3' color='primary' sx={{ mr: 1, fontSize: { xs: '2rem', sm: '3rem' } }}>
                              {course.jobCount}
                            </Typography>
                            <Typography variant='h6' color='textSecondary' sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                              jobs
                            </Typography>
                          </Box>
                          
                          {course.averageSalary && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant='body2' color='success.main' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                Avg Salary: ${course.averageSalary.toLocaleString()}
                              </Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ mb: 2 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={courseJobStats.length > 0 ? 
                                (course.jobCount / courseJobStats[0].jobCount) * 100 : 0
                              } 
                              sx={{ mb: 1, height: { xs: 6, sm: 8 }, borderRadius: 4 }}
                            />
                            <Typography variant='caption' color='textSecondary' sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                              {courseJobStats.length > 0 ? 
                                Math.round((course.jobCount / courseJobStats[0].jobCount) * 100) : 0
                              }% market share
                            </Typography>
                          </Box>
                          
                          {course.skillMatches.length > 0 && (
                            <Box>
                              <Typography variant='subtitle2' gutterBottom color='textSecondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                In-Demand Skills:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.25, sm: 0.5 } }}>
                                {course.skillMatches.slice(0, window.innerWidth < 600 ? 4 : 6).map((skill) => (
                                  <Chip 
                                    key={skill} 
                                    label={skill} 
                                    size='small' 
                                    variant="outlined"
                                    sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                                  />
                                ))}
                                {course.skillMatches.length > (window.innerWidth < 600 ? 4 : 6) && (
                                  <Chip 
                                    label={`+${course.skillMatches.length - (window.innerWidth < 600 ? 4 : 6)}`} 
                                    size='small' 
                                    variant="outlined"
                                    sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                          
                          {course.jobCount === 0 && (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                              <Typography variant='body2' color='textSecondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                No jobs found for this course
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'center', pb: 2, px: { xs: 1, sm: 1.5 } }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 1 }} sx={{ width: '100%' }}>
                            <Button 
                              size='small' 
                              startIcon={<TrendingUp />}
                              onClick={() => {
                                setCurrentTab(2); // Switch to All Jobs tab
                                setSearchTerm(course.courseName); // Filter by course
                              }}
                              disabled={course.jobCount === 0}
                              variant="contained"
                              sx={{ 
                                fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                px: { xs: 1, sm: 1.5 }
                              }}
                            >
                              View Jobs ({course.jobCount})
                            </Button>
                            <Button 
                              size='small'
                              onClick={() => {
                                // Navigate to course details or enroll
                                window.location.href = '/courses';
                              }}
                              variant="outlined"
                              sx={{ 
                                fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                px: { xs: 1, sm: 1.5 }
                              }}
                            >
                              Learn More
                            </Button>
                          </Stack>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant='h6' color='textSecondary'>
                    Analyzing course data...
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </>
        )}
      </Container>
    </ResponsiveDashboard>
  );
};

export default StudentOpportunitiesPage;