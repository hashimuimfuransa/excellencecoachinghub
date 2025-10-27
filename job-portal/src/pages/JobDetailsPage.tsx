import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  CardActions,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { sendJobApplicationToEmployer } from '../services/jobApplicationEmailService';
import {
  ArrowBack,
  LocationOn,
  AttachMoney,
  AccessTime,
  Business,
  Person,
  CheckCircle,
  Send,
  Bookmark,
  BookmarkBorder,
  Share,
  Psychology,
  Quiz,
  School,
  Work,
  Assessment,
  Close,
  MoreVert,
  CalendarToday,
  Group,
  TrendingUp,
  Email,
  Phone,
  Language,
  LinkedIn,
  Twitter,
  Home,
  Assignment,
  SmartToy,
  Warning,
  Login
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';
import { profileService } from '../services/profileService';
import { validateProfileSimple, SimpleProfileValidationResult } from '../utils/simpleProfileValidation';

// Job types matching backend structure
enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance'
}

enum ExperienceLevel {
  ENTRY_LEVEL = 'entry_level',
  MID_LEVEL = 'mid_level',
  SENIOR_LEVEL = 'senior_level',
  EXECUTIVE = 'executive'
}

enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  EXPIRED = 'expired'
}

interface SalaryExpectation {
  min: number;
  max: number;
  currency: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  location?: string;
  jobTitle?: string;
  industry?: string;
  socialLinks?: {
    linkedin?: string;
    website?: string;
    twitter?: string;
  };
}

interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  skills: string[];
  salary?: SalaryExpectation;
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  applicationDeadline?: string;
  status: JobStatus;
  employer: User;
  isCurated: boolean;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  // Fields for external jobs
  isExternalJob?: boolean;
  externalApplicationUrl?: string;
  externalJobSource?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    contactPerson?: string;
    applicationInstructions?: string;
  };
}

const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  // Application related state
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState<number>(0);
  const [profileIncompleteDialogOpen, setProfileIncompleteDialogOpen] = useState(false);
  const [hasShownProfileDialog, setHasShownProfileDialog] = useState(false);
  const [profileValidationResult, setProfileValidationResult] = useState<SimpleProfileValidationResult | null>(null);

  const [prepareDialogOpen, setPrepareDialogOpen] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // EmailJS removed - now using backend SendGrid service
    console.log('📧 Email service now handled entirely by backend SendGrid');
    
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  // Inject JobPosting structured data for rich results
  useEffect(() => {
    if (!job) return;
    try {
      const scriptId = 'jobposting-jsonld';
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();

      const toGoogleEmployment = (jt: JobType) => {
        switch (jt) {
          case JobType.FULL_TIME: return 'FULL_TIME';
          case JobType.PART_TIME: return 'PART_TIME';
          case JobType.CONTRACT: return 'CONTRACTOR';
          case JobType.INTERNSHIP: return 'INTERN';
          case JobType.FREELANCE: return 'CONTRACTOR';
          default: return 'OTHER';
        }
      };

      // Sanitize description to plain text
      const descriptionText = (job.description || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const isRemote = /remote/i.test(job.location || '');

      const jobPosting: any = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: descriptionText || job.title,
        datePosted: new Date(job.createdAt).toISOString(),
        employmentType: toGoogleEmployment(job.jobType),
        hiringOrganization: {
          '@type': 'Organization',
          name: job.company || 'ExJobNet Employer'
        },
        identifier: {
          '@type': 'PropertyValue',
          name: job.company || 'ExJobNet',
          value: job._id
        },
        url: window.location.href,
        directApply: !job.isExternalJob
      };

      if (job.applicationDeadline) {
        jobPosting.validThrough = new Date(job.applicationDeadline).toISOString();
      }

      if (Array.isArray(job.benefits) && job.benefits.length) {
        jobPosting.jobBenefits = job.benefits.join(', ');
      }
      if (Array.isArray(job.requirements) && job.requirements.length) {
        jobPosting.qualifications = job.requirements.join('\n');
      }
      if (Array.isArray(job.responsibilities) && job.responsibilities.length) {
        jobPosting.responsibilities = job.responsibilities.join('\n');
      }

      if (job.salary && job.salary.min != null && job.salary.max != null) {
        jobPosting.baseSalary = {
          '@type': 'MonetaryAmount',
          currency: job.salary.currency || 'USD',
          value: {
            '@type': 'QuantitativeValue',
            minValue: job.salary.min,
            maxValue: job.salary.max,
            unitText: 'YEAR'
          }
        };
      }

      if (isRemote) {
        jobPosting.jobLocationType = 'TELECOMMUTE';
      } else {
        jobPosting.jobLocation = [
          {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: job.location || '',
              addressCountry: (job.location || '').split(',').slice(-1)[0]?.trim() || 'RW'
            }
          }
        ];
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = scriptId;
      script.text = JSON.stringify(jobPosting);
      document.head.appendChild(script);
    } catch (e) {
      console.error('Failed to inject JobPosting JSON-LD', e);
    }

    // Cleanup on unmount or job change
    return () => {
      const existing = document.getElementById('jobposting-jsonld');
      if (existing) existing.remove();
    };
  }, [job]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobData = await jobService.getJobById(id!);
      setJob(jobData);
      
      // Check if user has already applied
      if (user) {
        try {
          const hasAppliedToJob = await applicationService.hasAppliedForJob(id!);
          setHasApplied(hasAppliedToJob);
        } catch (error) {
          console.error('Error checking application status:', error);
        }
      }
    } catch (error: any) {
      console.error('Error fetching job details:', error);
      setError(error.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  // Check profile completion
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) return;
      
      try {
        const profile = await profileService.getCurrentUserProfile();
        // Use simple profile validation that matches backend logic
        const validationResult = validateProfileSimple(profile);
        const completion = validationResult.completionPercentage;
        
        setProfileCompletion(completion);
        setProfileValidationResult(validationResult);
        
        console.log(`🔍 Profile completion: ${completion}% (Threshold: 60%)`, {
          status: validationResult.status,
          willShowDialog: completion < 60 && !hasShownProfileDialog,
          canAccessFeatures: validationResult.canAccessFeatures,
          missingFields: validationResult.missingFields.slice(0, 5), // Show first 5 missing fields
          completedSections: validationResult.completedSections
        });
        
        // Show profile incomplete dialog if completion is less than 60% and hasn't been shown yet
        // This allows users to access psychometric tests and basic job applications
        if (completion < 60 && !hasShownProfileDialog) {
          // Add a small delay to let the page load first
          setTimeout(() => {
            setProfileIncompleteDialogOpen(true);
            setHasShownProfileDialog(true);
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      }
    };
    
    checkProfileCompletion();
  }, [user]);

  // Helper functions
  const formatJobType = (jobType: JobType): string => {
    switch (jobType) {
      case JobType.FULL_TIME:
        return 'Full-time';
      case JobType.PART_TIME:
        return 'Part-time';
      case JobType.CONTRACT:
        return 'Contract';
      case JobType.INTERNSHIP:
        return 'Internship';
      case JobType.FREELANCE:
        return 'Freelance';
      default:
        return jobType;
    }
  };

  const formatExperienceLevel = (level: ExperienceLevel): string => {
    switch (level) {
      case ExperienceLevel.ENTRY_LEVEL:
        return 'Entry-level';
      case ExperienceLevel.MID_LEVEL:
        return 'Mid-level';
      case ExperienceLevel.SENIOR_LEVEL:
        return 'Senior';
      case ExperienceLevel.EXECUTIVE:
        return 'Executive';
      default:
        return level;
    }
  };

  const formatSalary = (salary?: SalaryExpectation): string => {
    if (!salary || salary.min == null || salary.max == null) return 'Salary not specified';
    return `${salary.currency || '$'} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const getDaysAgo = (dateString: string): string => {
    const daysAgo = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
    return daysAgo === 0 ? 'Today' : `${daysAgo} days ago`;
  };

  // Helper function to check if we have a valid employer email (not the default one)
  const hasValidEmployerEmail = (job: Job | null): boolean => {
    if (!job) return false;
    
    const defaultEmails = [
      'info@excellencecoachinghub',
      'info@excellencecoachinghub.com'
    ];
    const employerEmail = job.contactInfo?.email || job.employer?.email;
    
    return !!(employerEmail && !defaultEmails.includes(employerEmail.toLowerCase()));
  };

  // Apply for job function
  const handleApplyForJob = async () => {
    if (!user || !job) return;
    
    // Check if profile is complete enough - use backend-aligned validation
    // Only require basic completion (40%) for regular applications
    // Higher completion (60%) only if sending profile to external employer
    const requiresHigherCompletion = job.isExternalJob && hasValidEmployerEmail(job);
    const minimumRequired = requiresHigherCompletion ? 60 : 40;
    
    if (profileCompletion < minimumRequired) {
      console.log(`🚫 Profile completion (${profileCompletion}%) below required threshold (${minimumRequired}%) for this job type`);
      setProfileIncompleteDialogOpen(true);
      return;
    }
    
    try {
      setApplying(true);
      
      const result = await applicationService.applyForJob(job._id, {
        sendProfileToEmployer: !job.isExternalJob // For internal jobs, don't send email, create application record
      });
      
      setHasApplied(true);
      
      // Handle different flows for internal vs external jobs
      if (!job.isExternalJob) {
        // Internal job - application is saved to database and employer will see it in their dashboard
        console.log('✅ Internal job application submitted successfully');
        alert(`✅ Application submitted successfully!\n\n🎯 Your application has been sent to ${job.company} and will appear in the employer's dashboard.\n\n📧 The employer can contact you directly through the platform or via your provided contact information.`);
      } else {
        // External job - handle EmailJS email sending if data is available
        let emailSent = false;
        if (result.emailData?.shouldSendEmail) {
          console.log('📧 Sending job application email via EmailJS...');
          
          emailSent = await sendJobApplicationToEmployer({
            employerEmail: result.emailData.employerEmail,
            jobTitle: result.emailData.jobData.title,
            company: result.emailData.jobData.company,
            location: result.emailData.jobData.location,
            candidateName: result.emailData.candidateData.name,
            candidateEmail: result.emailData.candidateData.email,
            candidatePhone: result.emailData.candidateData.phone,
            candidateLocation: result.emailData.candidateData.location,
            candidateJobTitle: result.emailData.candidateData.jobTitle,
            candidateSkills: result.emailData.candidateData.skills,
            candidateSummary: result.emailData.candidateData.summary,
            candidateExperience: result.emailData.candidateData.experience,
            candidateEducation: result.emailData.candidateData.education,
            candidateResume: result.emailData.candidateData.resume,
            candidateCvFile: result.emailData.candidateData.cvFile,
            profileCompletion: result.emailData.candidateData.profileCompletion
          });
        }
        
        // Show appropriate success message for external jobs
        if (result.emailData?.shouldSendEmail) {
          if (emailSent) {
            alert(`✅ ${result.message}\n\n📧 Your profile has been sent to: ${result.emailData.employerEmail}\n\n🎯 The employer will receive a detailed email with your profile information.`);
          } else {
            alert(`⚠️ Application submitted, but there was an issue sending your profile via email.\n\n💡 Please consider contacting the employer directly at: ${result.emailData.employerEmail}\n\nYour application has been saved successfully.`);
          }
        } else {
          const reason = result.emailData?.reason || 'Unknown reason';
          if (reason === 'No employer email available') {
            // Provide guidance based on available alternatives
            let guidanceMessage = `✅ Application submitted successfully!\n\n⚠️ However, no employer email was provided for this job posting.`;
            
            if (job?.externalApplicationUrl) {
              guidanceMessage += `\n\n🌐 You can also apply directly at: ${job.externalApplicationUrl}`;
            } else if (job?.contactInfo?.website || job?.employer?.socialLinks?.website) {
              const websiteUrl = job.contactInfo?.website || job.employer?.socialLinks?.website;
              guidanceMessage += `\n\n🌐 You can visit the company website to apply: ${websiteUrl}`;
            } else {
              guidanceMessage += `\n\n💡 Please check the job description below for contact information or application instructions.`;
            }
            
            alert(guidanceMessage);
          } else {
            alert('✅ Application submitted successfully!');
          }
        }
      }
    } catch (error: any) {
      console.error('Error applying for job:', error);
      alert(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handlePrepare = () => {
    if (!user) {
      navigate('/login', { 
        state: { from: { pathname: `/jobs/${id}` } }
      });
      return;
    }
    setPrepareDialogOpen(true);
  };

  const handleGetPrepared = (selectedJob: Job) => {
    setPrepareDialogOpen(true);
  };

  const handleSaveJob = () => {
    if (!user) {
      navigate('/login', { 
        state: { from: { pathname: `/jobs/${id}` } }
      });
      return;
    }
    setIsSaved(!isSaved);
    // TODO: Implement save job functionality
  };

  const handleShare = (event: React.MouseEvent<HTMLElement>) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareMenuAnchor(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box mb={3}>
          <Skeleton variant="rectangular" height={60} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="text" height={40} width="80%" />
              <Skeleton variant="text" height={20} width="60%" />
              <Box mt={2}>
                <Skeleton variant="text" height={100} />
                <Skeleton variant="text" height={100} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="rectangular" height={200} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button variant="outlined" size="small" onClick={fetchJobDetails} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info">
          Job not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/app/jobs')}
          sx={{ mb: 2 }}
        >
          Back to Jobs
        </Button>
        
        <Paper 
          sx={{ 
            p: 3, 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 2
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `2px solid ${theme.palette.primary.main}`,
                  boxShadow: 2
                }}
              >
                <Business sx={{ fontSize: 40 }} color="primary" />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Box sx={{ mb: 1 }}>
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                  {job.title || 'Untitled Job'}
                </Typography>
                <Typography variant="h6" color="primary.main" gutterBottom sx={{ fontWeight: 600 }}>
                  {job.company || 'Company not specified'}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" sx={{ 
                  bgcolor: alpha(theme.palette.action.selected, 0.1), 
                  px: 1.5, 
                  py: 0.5, 
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                }}>
                  <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" fontWeight="medium">{job.location || 'Location not specified'}</Typography>
                </Box>
                {job.salary && (
                  <Box display="flex" alignItems="center" sx={{ 
                    bgcolor: alpha(theme.palette.success.main, 0.1), 
                    px: 1.5, 
                    py: 0.5, 
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                  }}>
                    <AttachMoney fontSize="small" color="success" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" fontWeight="medium" color="success.main">{formatSalary(job.salary)}</Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center" sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1), 
                  px: 1.5, 
                  py: 0.5, 
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                }}>
                  <AccessTime fontSize="small" color="info" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" fontWeight="medium" color="info.main">{getDaysAgo(job.createdAt)}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item>
              <Stack direction="row" spacing={1}>
                {job.isCurated && (
                  <Chip 
                    label="Featured" 
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                {job.applicationDeadline && new Date(job.applicationDeadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                  <Chip 
                    label="Urgent" 
                    color="error"
                    sx={{ fontWeight: 600, animation: 'pulse 2s infinite' }}
                  />
                )}
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Job Description */}
          <Paper id="job-description" sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': { 
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              transform: 'translateY(-2px)'
            }
          }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
              color: theme.palette.primary.main,
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              pb: 1,
              mb: 2
            }}>
              Job Description
            </Typography>
            <Typography variant="body1" paragraph sx={{ 
              whiteSpace: 'pre-line',
              lineHeight: 1.7,
              color: theme.palette.text.primary,
              fontSize: '1rem',
              '& strong': { fontWeight: 700, color: theme.palette.primary.main },
              '& em': { fontStyle: 'italic', color: theme.palette.secondary.main },
              '& ul, & ol': { paddingLeft: 2, marginTop: 1, marginBottom: 1 },
              '& li': { marginBottom: 0.5 }
            }}>
              {job.description || 'No description available'}
            </Typography>
          </Paper>

          {/* Requirements */}
          {job.requirements && (
            (Array.isArray(job.requirements) && job.requirements.length > 0) || 
            (typeof job.requirements === 'string' && job.requirements.trim())
          ) && (
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
                color: theme.palette.primary.main,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                pb: 1,
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Required Skills & Qualities
              </Typography>
              {Array.isArray(job.requirements) ? (
                <List>
                  {job.requirements.map((requirement, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <CheckCircle color="primary" sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={requirement} 
                        primaryTypographyProps={{ 
                          fontSize: '0.95rem',
                          lineHeight: 1.6
                        }} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" sx={{ 
                  whiteSpace: 'pre-line',
                  lineHeight: 1.7,
                  color: theme.palette.text.primary,
                  fontSize: '0.95rem',
                  pl: 1
                }}>
                  {job.requirements}
                </Typography>
              )}
            </Paper>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            (Array.isArray(job.responsibilities) && job.responsibilities.length > 0) || 
            (typeof job.responsibilities === 'string' && job.responsibilities.trim())
          ) && (
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
                color: theme.palette.secondary.main,
                borderBottom: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                pb: 1,
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Key Roles & Responsibilities
              </Typography>
              {Array.isArray(job.responsibilities) ? (
                <List>
                  {job.responsibilities.map((responsibility, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <Work color="primary" sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={responsibility} 
                        primaryTypographyProps={{ 
                          fontSize: '0.95rem',
                          lineHeight: 1.6
                        }} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" sx={{ 
                  whiteSpace: 'pre-line',
                  lineHeight: 1.7,
                  color: theme.palette.text.primary,
                  fontSize: '0.95rem',
                  pl: 1
                }}>
                  {job.responsibilities}
                </Typography>
              )}
            </Paper>
          )}

          {/* Benefits */}
          {job.benefits && (
            (Array.isArray(job.benefits) && job.benefits.length > 0) || 
            (typeof job.benefits === 'string' && job.benefits.trim())
          ) && (
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
                color: theme.palette.success.main,
                borderBottom: `2px solid ${alpha(theme.palette.success.main, 0.1)}`,
                pb: 1,
                mb: 2
              }}>
                Benefits & Perks
              </Typography>
              {Array.isArray(job.benefits) ? (
                <List>
                  {job.benefits.map((benefit, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <CheckCircle color="success" sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={benefit} 
                        primaryTypographyProps={{ 
                          fontSize: '0.95rem',
                          lineHeight: 1.6
                        }} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" sx={{ 
                  whiteSpace: 'pre-line',
                  lineHeight: 1.7,
                  color: theme.palette.text.primary,
                  fontSize: '0.95rem',
                  pl: 1
                }}>
                  {job.benefits}
                </Typography>
              )}
            </Paper>
          )}

          {/* Education & Experience */}
          {(job.educationLevel || job.experienceRequired || job.certifications || job.educationDetails) && (
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              '&:hover': { 
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
                color: theme.palette.success.main,
                borderBottom: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                pb: 1,
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Education & Experience
              </Typography>

              {/* Education Requirements */}
              {(job.educationLevel || job.educationDetails) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="600" gutterBottom sx={{ 
                    color: theme.palette.success.dark,
                    mb: 1.5
                  }}>
                    Education:
                  </Typography>
                  <List dense>
                    {job.educationLevel && (
                      <ListItem sx={{ py: 0.3, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 35, pt: 0.5 }}>
                          <School color="success" sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`Minimum Requirement: ${job.educationLevel}`}
                          primaryTypographyProps={{ 
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            fontWeight: 500
                          }} 
                        />
                      </ListItem>
                    )}
                    {job.educationDetails && (
                      <ListItem sx={{ py: 0.3, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 35, pt: 0.5 }}>
                          <CheckCircle color="success" sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={typeof job.educationDetails === 'string' ? job.educationDetails : job.educationDetails.join(', ')}
                          primaryTypographyProps={{ 
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-line'
                          }} 
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {/* Experience Requirements */}
              {(job.experienceRequired || job.experienceLevel) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="600" gutterBottom sx={{ 
                    color: theme.palette.success.dark,
                    mb: 1.5
                  }}>
                    Experience:
                  </Typography>
                  <List dense>
                    {job.experienceRequired && (
                      <ListItem sx={{ py: 0.3, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 35, pt: 0.5 }}>
                          <Work color="success" sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={job.experienceRequired}
                          primaryTypographyProps={{ 
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-line'
                          }} 
                        />
                      </ListItem>
                    )}
                    {job.experienceLevel && !job.experienceRequired && (
                      <ListItem sx={{ py: 0.3, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 35, pt: 0.5 }}>
                          <TrendingUp color="success" sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${formatExperienceLevel(job.experienceLevel)} level experience required`}
                          primaryTypographyProps={{ 
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            fontWeight: 500
                          }} 
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {/* Certifications */}
              {job.certifications && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight="600" gutterBottom sx={{ 
                    color: theme.palette.success.dark,
                    mb: 1.5
                  }}>
                    Certifications (Added Advantage):
                  </Typography>
                  <List dense>
                    {Array.isArray(job.certifications) ? 
                      job.certifications.map((cert, index) => (
                        <ListItem key={index} sx={{ py: 0.3, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 35, pt: 0.5 }}>
                            <Assignment color="success" sx={{ fontSize: 18 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={cert}
                            primaryTypographyProps={{ 
                              fontSize: '0.9rem',
                              lineHeight: 1.6
                            }} 
                          />
                        </ListItem>
                      )) : (
                        <ListItem sx={{ py: 0.3, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 35, pt: 0.5 }}>
                            <Assignment color="success" sx={{ fontSize: 18 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={job.certifications}
                            primaryTypographyProps={{ 
                              fontSize: '0.9rem',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-line'
                            }} 
                          />
                        </ListItem>
                      )
                    }
                  </List>
                </Box>
              )}
            </Paper>
          )}

          {/* Fallback Requirements - Show if no specific requirements provided */}
          {!job.requirements && (
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.03)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
              '&:hover': { 
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
                color: theme.palette.warning.main,
                borderBottom: `2px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                pb: 1,
                mb: 2
              }}>
                General Requirements
              </Typography>
              <List>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <CheckCircle color="warning" sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Relevant education or equivalent experience" 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      lineHeight: 1.6
                    }} 
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <CheckCircle color="warning" sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Strong communication and teamwork skills" 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      lineHeight: 1.6
                    }} 
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <CheckCircle color="warning" sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Ability to work independently and meet deadlines" 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      lineHeight: 1.6
                    }} 
                  />
                </ListItem>
                {job.experienceLevel && job.experienceLevel !== 'entry' && (
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemIcon>
                      <CheckCircle color="warning" sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${formatExperienceLevel(job.experienceLevel)} experience in relevant field`}
                      primaryTypographyProps={{ 
                        fontSize: '0.95rem',
                        lineHeight: 1.6
                      }} 
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}

          {/* Application Requirements */}
          {(job.applicationRequirements || job.contactInfo?.applicationRequirements) && (
            (Array.isArray(job.applicationRequirements || job.contactInfo?.applicationRequirements) && 
             (job.applicationRequirements || job.contactInfo?.applicationRequirements).length > 0) || 
            (typeof (job.applicationRequirements || job.contactInfo?.applicationRequirements) === 'string' && 
             (job.applicationRequirements || job.contactInfo?.applicationRequirements).trim())
          ) && (
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              '&:hover': { 
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
                color: theme.palette.warning.main,
                borderBottom: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                pb: 1,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Send fontSize="medium" />
                Application Procedure
              </Typography>
              {(() => {
                const appReqs = job.applicationRequirements || job.contactInfo?.applicationRequirements;
                return Array.isArray(appReqs) ? (
                  <List>
                    {appReqs.map((requirement, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <Assignment color="warning" sx={{ fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={requirement} 
                          primaryTypographyProps={{ 
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
                            fontWeight: 500
                          }} 
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" sx={{ 
                    whiteSpace: 'pre-line',
                    lineHeight: 1.7,
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    pl: 1,
                    fontWeight: 500
                  }}>
                    {appReqs}
                  </Typography>
                );
              })()}
            </Paper>
          )}

          {/* Default Application Requirements - Show if no specific requirements provided */}
          {!job.applicationRequirements && !job.contactInfo?.applicationRequirements && (
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              '&:hover': { 
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
                color: theme.palette.info.main,
                borderBottom: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
                pb: 1,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Send fontSize="medium" />
                Application Procedure
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: theme.palette.text.primary }}>
                Required Documents:
              </Typography>
              <List>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <Assignment color="info" sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Application letter addressed to the hiring manager" 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      fontWeight: 500
                    }} 
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <Person color="info" sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Recent Curriculum Vitae (CV)" 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      fontWeight: 500
                    }} 
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <Work color="info" sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Proven work experience certificates" 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      fontWeight: 500
                    }} 
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <School color="info" sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Notarized education certificates" 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      fontWeight: 500
                    }} 
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <CheckCircle color="info" sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Copy of National Identification" 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      fontWeight: 500
                    }} 
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <Email color="info" sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Two professional references" 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      fontWeight: 500
                    }} 
                  />
                </ListItem>
              </List>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1, fontStyle: 'italic' }}>
                <strong>Note:</strong> Only shortlisted candidates will be contacted. Ensure all documents are properly formatted and meet the specified requirements.
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Action Buttons */}
          <Paper sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <Stack spacing={2}>
              {/* Get Prepared Button */}
              <Button
                variant="outlined"
                size="large"
                startIcon={<Assessment />}
                onClick={handlePrepare}
                fullWidth
                sx={{ 
                  py: 1.8,
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: 3,
                  borderWidth: 2,
                  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px ' + alpha(theme.palette.primary.main, 0.25),
                    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`
                  }
                }}
              >
                🎯 Get Position Ready
              </Button>
              
              {/* Profile Completion Warning - only for direct applications */}
              {user && profileCompletion < (job?.isExternalJob && hasValidEmployerEmail(job) ? 60 : 40) && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      width: '100%'
                    }
                  }}
                  action={
                    <Button 
                      size="small" 
                      onClick={() => navigate('/app/profile')}
                      sx={{ fontWeight: 600 }}
                    >
                      Complete
                    </Button>
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Complete your profile ({profileCompletion}%) to apply for this job type
                  </Typography>
                </Alert>
              )}

              {/* No profile completion required indicator - for external applications */}
              {user && !hasValidEmployerEmail(job) && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                    '& .MuiAlert-icon': {
                      color: theme.palette.success.main
                    },
                    '& .MuiAlert-message': {
                      width: '100%'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    ✨ <strong>No profile completion required!</strong> This job redirects to the source website for applications.
                  </Typography>
                </Alert>
              )}
              
              {/* Apply Button or Apply on Source Website */}
              {hasValidEmployerEmail(job) && user ? (
                <Button
                  onClick={hasApplied ? undefined : handleApplyForJob}
                  disabled={hasApplied || applying}
                  variant="contained"
                  size="large"
                  startIcon={hasApplied ? <CheckCircle /> : applying ? <Send /> : <Send />}
                  fullWidth
                  sx={{ 
                    py: 1.8,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 3,
                    ...(hasApplied ? {
                      background: alpha(theme.palette.success.main, 0.2),
                      color: theme.palette.success.dark,
                      '&:hover': {
                        background: alpha(theme.palette.success.main, 0.3),
                      }
                    } : {
                      background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.primary.main} 90%)`,
                      boxShadow: '0 6px 20px ' + alpha(theme.palette.success.main, 0.3),
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px ' + alpha(theme.palette.success.main, 0.4),
                      },
                      '&:disabled': {
                        background: alpha(theme.palette.primary.main, 0.3),
                      }
                    })
                  }}
                >
                  {hasApplied ? '✅ Application Submitted' : applying ? 'Applying...' : '🚀 Apply Now'}
                </Button>
              ) : (
                <Button
                    variant="contained"
                    size="large"
                    startIcon={
                      !user ? <Login /> :
                      // Determine the job source URL for icon selection
                      (job?.isExternalJob && job?.externalApplicationUrl) ||
                      job?.contactInfo?.website ||
                      job?.employer?.socialLinks?.website
                        ? <Language />
                        : <Assignment />
                    }
                    onClick={() => {
                      if (!user) {
                        navigate(`/login?redirect=job&jobId=${id}`);
                        return;
                      }

                      // Determine the job source URL
                      let sourceUrl = null;
                      let sourceName = 'source website';
                      
                      // Priority 1: External job application URL
                      if (job?.isExternalJob && job?.externalApplicationUrl) {
                        sourceUrl = job.externalApplicationUrl;
                        sourceName = job.externalJobSource || 'job source';
                      }
                      // Priority 2: Contact info website
                      else if (job?.contactInfo?.website) {
                        sourceUrl = job.contactInfo.website;
                        sourceName = 'company website';
                      }
                      // Priority 3: Employer's website
                      else if (job?.employer?.socialLinks?.website) {
                        sourceUrl = job.employer.socialLinks.website;
                        sourceName = 'company website';
                      }
                      
                      if (sourceUrl) {
                        // Show confirmation before redirecting
                        const confirmed = window.confirm(
                          `You will be redirected to ${sourceName} to apply for this position.\n\n` +
                          `Please follow their application process to submit your application.\n\n` +
                          `Continue?`
                        );
                        
                        if (confirmed) {
                          // Ensure URL has protocol
                          if (!sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://')) {
                            sourceUrl = 'https://' + sourceUrl;
                          }
                          window.open(sourceUrl, '_blank', 'noopener,noreferrer');
                        }
                      } else {
                        // Fallback: Show alert if no URL is available
                        alert(
                          '⚠️ No application URL available for this job.\n\n' +
                          '💡 Please check the job description below for application instructions or contact information.'
                        );
                        document.getElementById('job-description')?.scrollIntoView({ 
                          behavior: 'smooth' 
                        });
                      }
                    }}
                    fullWidth
                    sx={{ 
                      py: 1.8,
                      fontWeight: 700,
                      fontSize: '1rem',
                      borderRadius: 3,
                      background: !user 
                        ? `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`
                        : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.info.main} 90%)`,
                      boxShadow: '0 6px 20px ' + alpha(theme.palette.primary.main, 0.3),
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px ' + alpha(theme.palette.primary.main, 0.4),
                      }
                    }}
                  >
                    {!user ? '🔐 Login to Apply' : 
                     (job?.isExternalJob && job?.externalApplicationUrl) ||
                     job?.contactInfo?.website ||
                     job?.employer?.socialLinks?.website
                       ? '🌐 Apply on Source Website'
                       : '📋 View Application Details'
                    }
                  </Button>
              )}

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={user && isSaved ? <Bookmark /> : <BookmarkBorder />}
                  onClick={handleSaveJob}
                  color={user && isSaved ? "primary" : "inherit"}
                  fullWidth
                  sx={{ fontWeight: 600 }}
                >
                  {user && isSaved ? 'Saved' : 'Save Job'}
                </Button>
                <IconButton 
                  onClick={handleShare}
                  sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <Share />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>

          {/* Job Info */}
          <Paper sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
              color: theme.palette.primary.main,
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              pb: 1,
              mb: 2
            }}>
              Job Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Work />
                </ListItemIcon>
                <ListItemText 
                  primary="Job Type" 
                  secondary={formatJobType(job.jobType)} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingUp />
                </ListItemIcon>
                <ListItemText 
                  primary="Experience Level" 
                  secondary={formatExperienceLevel(job.experienceLevel)} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Group />
                </ListItemIcon>
                <ListItemText 
                  primary="Applications" 
                  secondary={`${job.applicationsCount} applicants`} 
                />
              </ListItem>
              {job.applicationDeadline && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Application Deadline" 
                    secondary={new Date(job.applicationDeadline).toLocaleDateString()} 
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          {/* Skills Required */}
          {job.skills && (
            (Array.isArray(job.skills) && job.skills.length > 0) || 
            (typeof job.skills === 'string' && job.skills.trim())
          ) && (
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.03)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
              '&:hover': { 
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
                color: theme.palette.secondary.main,
                borderBottom: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                pb: 1,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <CheckCircle fontSize="medium" />
                Skills Required
              </Typography>
              {Array.isArray(job.skills) ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {job.skills.map((skill, index) => (
                    <Chip 
                      key={index} 
                      label={skill} 
                      variant="filled" 
                      sx={{ 
                        borderRadius: 3,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: theme.palette.secondary.main,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.secondary.main, 0.2),
                          transform: 'scale(1.05)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </Stack>
              ) : (
                // Handle comma-separated skills string or plain text
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {job.skills.split(/[,;|]/).map((skill, index) => (
                    <Chip 
                      key={index} 
                      label={skill.trim()} 
                      variant="filled" 
                      sx={{ 
                        borderRadius: 3,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: theme.palette.secondary.main,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.secondary.main, 0.2),
                          transform: 'scale(1.05)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  )).filter(chip => chip.props.label) // Filter out empty skills
                  }
                </Stack>
              )}
            </Paper>
          )}

          {/* Fallback Skills - Show if no specific skills provided */}
          {!job.skills && (
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              '&:hover': { 
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
                color: theme.palette.info.main,
                borderBottom: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
                pb: 1,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <CheckCircle fontSize="medium" />
                Essential Skills
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {/* Generate fallback skills based on job type and experience level */}
                {(() => {
                  const fallbackSkills = [];
                  
                  // Add common professional skills
                  fallbackSkills.push('Communication', 'Problem Solving', 'Teamwork');
                  
                  // Add skills based on job category or title
                  if (job.title?.toLowerCase().includes('developer') || job.title?.toLowerCase().includes('programming')) {
                    fallbackSkills.push('Programming', 'Software Development', 'Debugging');
                  } else if (job.title?.toLowerCase().includes('marketing')) {
                    fallbackSkills.push('Digital Marketing', 'Content Creation', 'Analytics');
                  } else if (job.title?.toLowerCase().includes('sales')) {
                    fallbackSkills.push('Sales', 'Customer Relations', 'Negotiation');
                  } else if (job.title?.toLowerCase().includes('design')) {
                    fallbackSkills.push('Creative Design', 'UI/UX', 'Adobe Creative Suite');
                  } else {
                    fallbackSkills.push('Industry Knowledge', 'Project Management', 'Time Management');
                  }
                  
                  // Add experience-based skills
                  if (job.experienceLevel === 'senior' || job.experienceLevel === 'executive') {
                    fallbackSkills.push('Leadership', 'Strategic Planning');
                  }
                  
                  return fallbackSkills.slice(0, 6).map((skill, index) => (
                    <Chip 
                      key={index} 
                      label={skill} 
                      variant="filled" 
                      sx={{ 
                        borderRadius: 3,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.info.main, 0.2),
                          transform: 'scale(1.05)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ));
                })()}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                * Skills may vary based on specific role requirements
              </Typography>
            </Paper>
          )}

          {/* Company & Contact Information */}
          <Paper sx={{ 
            p: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
              color: theme.palette.primary.main,
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              pb: 1,
              mb: 2
            }}>
              Company & Contact Information
            </Typography>
            
            {/* Company Header */}
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar sx={{ mr: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), width: 56, height: 56 }}>
                <Business color="primary" sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {job.company}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {job.employer?.industry || 'Organization'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Contact Information - Prioritize scraped contact info for external jobs */}
            {(job.contactInfo || job.employer) && (
              <>
                <Typography variant="subtitle2" color="text.primary" fontWeight="600" gutterBottom>
                  Contact Information
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <List dense sx={{ py: 0 }}>
                    {/* Contact Person - Use scraped info first, then employer info */}
                    {(job.contactInfo?.contactPerson || (job.employer && !job.isExternalJob)) && (
                      <ListItem sx={{ 
                        px: 0, 
                        py: 0.5,
                        borderRadius: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) }
                      }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Person fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={job.contactInfo?.contactPerson || `${job.employer?.firstName} ${job.employer?.lastName}`}
                          secondary={job.employer?.jobTitle || (job.isExternalJob ? 'Contact Person' : 'Hiring Manager')}
                          primaryTypographyProps={{ 
                            fontWeight: 'medium',
                            color: theme.palette.text.primary,
                            fontSize: '0.95rem'
                          }}
                          secondaryTypographyProps={{ 
                            fontSize: '0.85rem',
                            color: theme.palette.text.secondary
                          }}
                        />
                      </ListItem>
                    )}
                    
                    {/* Email - Use scraped email first, then employer email for internal jobs */}
                    {hasValidEmployerEmail(job) && (
                      <ListItem sx={{ 
                        px: 0, 
                        py: 0.5,
                        borderRadius: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) }
                      }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Email fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Button 
                              href={`mailto:${job.contactInfo?.email || job.employer?.email}`}
                              sx={{ 
                                p: 0, 
                                textAlign: 'left', 
                                justifyContent: 'flex-start',
                                textTransform: 'none',
                                color: 'primary.main',
                                fontWeight: 'medium',
                                fontSize: '0.95rem',
                                '&:hover': { 
                                  backgroundColor: 'transparent', 
                                  textDecoration: 'underline',
                                  color: 'primary.dark'
                                }
                              }}
                            >
                              {job.contactInfo?.email || job.employer?.email}
                            </Button>
                          }
                          secondary={job.isExternalJob && job.contactInfo?.email ? 'Direct Contact Email' : 'Contact Email'}
                          secondaryTypographyProps={{ 
                            fontSize: '0.85rem',
                            color: theme.palette.text.secondary
                          }}
                        />
                      </ListItem>
                    )}
                    
                    {/* Phone - Use scraped phone first, then employer phone for internal jobs */}
                    {(job.contactInfo?.phone || (job.employer?.phone && !job.isExternalJob)) && (
                      <ListItem sx={{ 
                        px: 0, 
                        py: 0.5,
                        borderRadius: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) }
                      }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Phone fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Button 
                              href={`tel:${job.contactInfo?.phone || job.employer?.phone}`}
                              sx={{ 
                                p: 0, 
                                textAlign: 'left', 
                                justifyContent: 'flex-start',
                                textTransform: 'none',
                                color: 'primary.main',
                                fontWeight: 'medium',
                                fontSize: '0.95rem',
                                '&:hover': { 
                                  backgroundColor: 'transparent', 
                                  textDecoration: 'underline',
                                  color: 'primary.dark'
                                }
                              }}
                            >
                              {job.contactInfo?.phone || job.employer?.phone}
                            </Button>
                          }
                          secondary="Phone Number"
                          secondaryTypographyProps={{ 
                            fontSize: '0.85rem',
                            color: theme.palette.text.secondary
                          }}
                        />
                      </ListItem>
                    )}
                    
                    {/* Address - Use scraped address first, then employer address */}
                    {(job.contactInfo?.address || job.employer?.address || job.employer?.location) && (
                      <ListItem sx={{ 
                        px: 0, 
                        py: 0.5,
                        borderRadius: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) }
                      }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Home fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={job.contactInfo?.address || job.employer?.address || job.employer?.location}
                          secondary="Office Address"
                          primaryTypographyProps={{ 
                            fontWeight: 'medium',
                            color: theme.palette.text.primary,
                            fontSize: '0.95rem'
                          }}
                          secondaryTypographyProps={{ 
                            fontSize: '0.85rem',
                            color: theme.palette.text.secondary
                          }}
                        />
                      </ListItem>
                    )}

                    {/* Website - Show scraped website */}
                    {job.contactInfo?.website && (
                      <ListItem sx={{ 
                        px: 0, 
                        py: 0.5,
                        borderRadius: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) }
                      }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Language fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Button 
                              href={job.contactInfo.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ 
                                p: 0, 
                                textAlign: 'left', 
                                justifyContent: 'flex-start',
                                textTransform: 'none',
                                color: 'primary.main',
                                fontWeight: 'medium',
                                fontSize: '0.95rem',
                                '&:hover': { 
                                  backgroundColor: 'transparent', 
                                  textDecoration: 'underline',
                                  color: 'primary.dark'
                                }
                              }}
                            >
                              {job.contactInfo.website}
                            </Button>
                          }
                          secondary="Company Website"
                          secondaryTypographyProps={{ 
                            fontSize: '0.85rem',
                            color: theme.palette.text.secondary
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </>
            )}

            {/* Application Instructions for External Jobs */}
            {job.isExternalJob && (
              <>
                <Typography variant="subtitle2" color="text.primary" fontWeight="600" gutterBottom sx={{ 
                  color: theme.palette.secondary.main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Work fontSize="small" />
                  How to Apply
                </Typography>
                <Paper sx={{ 
                  p: 3, 
                  bgcolor: alpha(theme.palette.secondary.main, 0.08), 
                  border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`, 
                  borderRadius: 2,
                  mb: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {job.contactInfo?.applicationInstructions ? (
                    <Typography variant="body1" sx={{ 
                      whiteSpace: 'pre-line', 
                      lineHeight: 1.7,
                      color: theme.palette.text.primary,
                      fontSize: '0.95rem'
                    }}>
                      {job.contactInfo.applicationInstructions}
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      <Typography variant="body1" sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: '0.95rem'
                      }}>
                        To apply for this position, please visit the original job posting by clicking the application button above.
                      </Typography>
                      {(job.contactInfo?.email || job.contactInfo?.phone || job.contactInfo?.website) && (
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.secondary,
                          fontStyle: 'italic'
                        }}>
                          You can also contact the employer directly using the contact information provided above.
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Paper>
              </>
            )}

            {/* Social Links - Only show for internal jobs */}
            {!job.isExternalJob && job.employer?.socialLinks && (
              <>
                <Typography variant="subtitle2" color="text.primary" fontWeight="600" gutterBottom>
                  Connect Online
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  {job.employer.socialLinks.linkedin && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<LinkedIn />}
                      href={job.employer.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        color: '#0077B5',
                        borderColor: '#0077B5',
                        '&:hover': { backgroundColor: alpha('#0077B5', 0.1) }
                      }}
                    >
                      LinkedIn
                    </Button>
                  )}
                  {job.employer.socialLinks.website && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Language />}
                      href={job.employer.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                    >
                      Website
                    </Button>
                  )}
                  {job.employer.socialLinks.twitter && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Twitter />}
                      href={job.employer.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        color: '#1DA1F2',
                        borderColor: '#1DA1F2',
                        '&:hover': { backgroundColor: alpha('#1DA1F2', 0.1) }
                      }}
                    >
                      Twitter
                    </Button>
                  )}
                </Stack>
              </>
            )}

            <Button variant="outlined" fullWidth>
              View Company Profile
            </Button>
          </Paper>
        </Grid>
      </Grid>



      {/* Enhanced Prepare Dialog */}
      <Dialog open={prepareDialogOpen} onClose={() => setPrepareDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, pt: 3 }}>
          <Box sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.8rem', mb: 1 }}>
            🎯 Get Ready for {job?.title}
          </Box>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Comprehensive preparation to help you excel in this position
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          {/* Main Assessment Options */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
            🧠 Assessment & Testing
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: `0 8px 25px ${alpha(theme.palette.warning.main, 0.3)}`,
                    border: `2px solid ${theme.palette.warning.main}`
                  }
                }}
                onClick={() => {
                  setPrepareDialogOpen(false);
                  navigate('/app/tests');
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Assessment sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1.5 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                    Psychometric Tests
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    Personality & cognitive assessments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: `0 8px 25px ${alpha(theme.palette.info.main, 0.3)}`,
                    border: `2px solid ${theme.palette.info.main}`
                  }
                }}
                onClick={() => {
                  setPrepareDialogOpen(false);
                  navigate('/app/smart-tests');
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <SmartToy sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1.5 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                    Smart Tests
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    AI-powered adaptive testing
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.3)}`,
                    border: `2px solid ${theme.palette.secondary.main}`
                  }
                }}
                onClick={() => {
                  setPrepareDialogOpen(false);
                  navigate('/app/job-specific-tests');
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Assignment sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1.5 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                    Job-Specific Tests
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    Role-tailored assessments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.3)}`,
                    border: `2px solid ${theme.palette.success.main}`
                  }
                }}
                onClick={() => {
                  setPrepareDialogOpen(false);
                  navigate('/app/skills-assessment');
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <TrendingUp sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1.5 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: '1rem' }}>
                    Skills Assessment
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    Technical & soft skills evaluation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Interview & Learning Options */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
            🎤 Interview & Learning
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: `0 8px 25px ${alpha(theme.palette.error.main, 0.3)}`,
                    border: `2px solid ${theme.palette.error.main}`
                  }
                }}
                onClick={() => {
                  setPrepareDialogOpen(false);
                  navigate('/app/interviews');
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                  <Person sx={{ fontSize: 45, color: theme.palette.error.main, mb: 1.5 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Interview Practice
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI-powered mock interviews & feedback
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
                    border: `2px solid ${theme.palette.primary.main}`
                  }
                }}
                onClick={() => {
                  window.open('https://www.elearning.excellencecoachinghub.com/', '_blank');
                  setPrepareDialogOpen(false);
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                  <School sx={{ fontSize: 45, color: theme.palette.primary.main, mb: 1.5 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Skill Development
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Learn required skills for this position
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.3)}`,
                    border: `2px solid ${theme.palette.success.main}`
                  }
                }}
                onClick={() => {
                  setPrepareDialogOpen(false);
                  navigate('/app/career-guidance');
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                  <Psychology sx={{ fontSize: 45, color: theme.palette.success.main, mb: 1.5 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Career Guidance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get personalized career advice & tips
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Tips */}
          <Box 
            sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: alpha(theme.palette.info.main, 0.05),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}
          >
            <Typography variant="body2" color="info.main" fontWeight="bold" sx={{ mb: 1 }}>
              💡 Pro Tip for {job?.title}:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start with our Smart Tests for personalized assessment, then move to job-specific tests based on your results. 
              Complete with interview practice for the best preparation experience!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, pt: 1 }}>
          <Button
            onClick={() => setPrepareDialogOpen(false)}
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Close
          </Button>
          {!user && (
            <Button
              onClick={() => {
                setPrepareDialogOpen(false);
                navigate('/register');
              }}
              variant="contained"
              sx={{ 
                minWidth: 140,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                }
              }}
            >
              🚀 Start Preparing
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Share Menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={handleShareClose}
      >
        <MenuItem onClick={handleShareClose}>
          Copy Link
        </MenuItem>
        <MenuItem onClick={handleShareClose}>
          Share via Email
        </MenuItem>
        <MenuItem onClick={handleShareClose}>
          Share on LinkedIn
        </MenuItem>
      </Menu>

      {/* Profile Incomplete Dialog */}
      <Dialog 
        open={profileIncompleteDialogOpen} 
        onClose={() => setProfileIncompleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Warning sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
          <Typography variant="h6" fontWeight="bold" color="warning.main">
            Complete Your Profile ({profileCompletion}%)
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 1, pb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You need to complete your profile before applying for jobs.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your profile is <strong>{profileCompletion}%</strong> complete. 
            {job?.isExternalJob && hasValidEmployerEmail(job) 
              ? "Complete at least 60% to apply to external jobs and share your profile with employers." 
              : "Complete at least 40% to apply for jobs on the platform."
            }
          </Typography>
          {profileValidationResult && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                Complete these sections to unlock job applications:
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div" sx={{ textAlign: 'left', mb: 1 }}>
                {!profileValidationResult.completedSections?.basic && "• Basic Information (Name, Email)\n"}
                {!profileValidationResult.completedSections?.contact && "• Contact Details (Phone, Location)\n"}
                {!profileValidationResult.completedSections?.professional && "• Professional Info (Job Title, Bio)\n"}
                {!profileValidationResult.completedSections?.education && "• Education Background\n"}
                {!profileValidationResult.completedSections?.experience && "• Work Experience\n"}
                {!profileValidationResult.completedSections?.skills && "• Skills & Competencies\n"}
                {!profileValidationResult.completedSections?.documents && "• Resume Upload\n"}
                {!profileValidationResult.completedSections?.preferences && "• Job Preferences\n"}
              </Typography>
              {profileValidationResult.canAccessFeatures && (
                <Typography variant="body2" sx={{ 
                  color: 'info.main', 
                  fontWeight: 600,
                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                  p: 1,
                  borderRadius: 1,
                  mt: 1
                }}>
                  💡 Complete more sections to unlock:
                  {!profileValidationResult.canAccessFeatures.psychometricTests && " Psychometric Tests,"}
                  {!profileValidationResult.canAccessFeatures.aiInterviews && " AI Interviews,"}
                  {!profileValidationResult.canAccessFeatures.premiumJobs && " Premium Jobs"}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button
            onClick={() => setProfileIncompleteDialogOpen(false)}
            variant="outlined"
            size="medium"
            sx={{ px: 3, py: 1 }}
          >
            Remind Me Later
          </Button>
          <Button
            onClick={() => {
              setProfileIncompleteDialogOpen(false);
              navigate('/app/profile');
            }}
            variant="contained"
            size="medium"
            startIcon={<Person />}
            sx={{ 
              px: 3, 
              py: 1,
              fontWeight: 600,
              background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #45A049 30%, #5CB85C 90%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
              }
            }}
          >
            Complete My Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobDetailsPage;