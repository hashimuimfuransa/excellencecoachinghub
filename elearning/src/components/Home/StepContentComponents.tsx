import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import {
  Work,
  Business,
  Psychology,
  Computer,
  Language,
  School
} from '@mui/icons-material';
import { styled } from '@mui/system';

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  padding: theme.spacing(1),
  fontSize: '1rem',
  fontWeight: 600,
  borderRadius: theme.spacing(1.5),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  '&.MuiChip-clickable:active': {
    boxShadow: 'none',
    transform: 'none',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.85rem',
    padding: theme.spacing(0.75),
    borderRadius: theme.spacing(1),
  },
}));

interface StepContentProps {
  formData: any;
  onCategoryToggle: (value: string) => void;
  onChange: (prop: string) => (event: any) => void;
  onSpecificInterestsChange: (event: any) => void;
}

export const CategoriesStep: React.FC<StepContentProps> = ({ formData, onCategoryToggle }) => (
  <Box>
    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Choose up to 3 categories:</Typography>
    <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
      {[
        { label: 'Professional Coaching', value: 'professional_coaching', icon: <Work /> },
        { label: 'Business & Entrepreneurship Coaching', value: 'business_entrepreneurship', icon: <Business /> },
        { label: 'Academic Coaching', value: 'academic_coaching', icon: <School /> },
        { label: 'Language Coaching', value: 'language_coaching', icon: <Language /> },
        { label: 'Technical & Digital Coaching', value: 'technical_digital_coaching', icon: <Computer /> },
        { label: 'Job Seeker Coaching', value: 'job_seeker_coaching', icon: <Work /> },
        { label: 'Personal & Corporate Development', value: 'personal_corporate_coaching', icon: <Psychology /> },
      ].map((item) => (
        <StyledChip
          key={item.value}
          label={item.label}
          icon={item.icon}
          color={formData.categories.includes(item.value) ? 'primary' : 'default'}
          variant={formData.categories.includes(item.value) ? 'contained' : 'outlined'}
          onClick={() => onCategoryToggle(item.value)}
        />
      ))}
    </Stack>
  </Box>
);

// Curated subcategories for each learning category
export const learningSubcategories: { [key: string]: string[] } = {
  professional_coaching: [
    'Leadership & Executive Coaching',
    'Project Management Coaching',
    'Career Growth Coaching',
    'CPA Coaching',
    'CAT Coaching',
    'ACCA Coaching',
  ],
  business_entrepreneurship: [
    'Business Startup Coaching',
    'Entrepreneurship Development Coaching',
    'Small Business Management Coaching',
    'Business Strategy & Planning Coaching',
    'Financial Management Coaching',
    'Marketing & Branding Coaching',
    'Innovation & Growth Coaching',
  ],
  academic_coaching: [
    'Nursery Coaching',
    'Primary Coaching',
    'Secondary Coaching',
    'University Coaching',
    'Exam Preparation Coaching',
    'Study Skills Coaching',
    'Research & Thesis Coaching',
  ],
  language_coaching: [
    'English Language Coaching',
    'French Language Coaching',
    'Kinyarwanda Language Coaching',
    'Business Communication Coaching',
    'Public Speaking in English Coaching',
    'Writing & Presentation Skills Coaching',
  ],
  technical_digital_coaching: [
    'Artificial Intelligence (AI) Coaching',
    'Machine Learning Coaching',
    'Data Analytics Coaching',
    'Cybersecurity Coaching',
    'Cloud Computing Coaching',
    'Software & Web Development Coaching',
    'Digital Marketing Coaching',
    'IT Systems Coaching',
    'Vocational & Technical Skills Coaching',
  ],
  job_seeker_coaching: [
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
  ],
  personal_corporate_coaching: [
    'Personal Growth Coaching',
    'Confidence & Communication Coaching',
    'Time Management Coaching',
    'Emotional Intelligence Coaching',
    'Public Speaking Coaching',
    'Parenting Coaching',
    'Team Performance Coaching',
    'HR & Legal Compliance Coaching',
    'Customer Service Coaching',
    'Workplace Ethics Coaching',
  ],
};

interface SubcategoriesStepProps {
  selectedCategoryId: string;
  onSelectSubcategory: (subcategory: string) => void;
}

export const SubcategoriesStep: React.FC<SubcategoriesStepProps> = ({ selectedCategoryId, onSelectSubcategory }) => {
  const subs = learningSubcategories[selectedCategoryId] || [];
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Select a subcategory:</Typography>
      <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
        {subs.map((sub) => (
          <StyledChip
            key={sub}
            label={sub}
            color={'primary'}
            variant={'outlined'}
            onClick={() => onSelectSubcategory(sub)}
          />
        ))}
      </Stack>
    </Box>
  );
};

export const CareerGoalStep: React.FC<StepContentProps> = ({ formData, onChange }) => (
  <Box>
    <RadioGroup
      aria-label="career-goal"
      name="careerGoal"
      value={formData.careerGoal}
      onChange={onChange('careerGoal')}
    >
      {[
        { label: 'Looking for Employment', value: 'employment' },
        { label: 'Running a Business', value: 'business_owner' },
        { label: 'Student', value: 'student' },
        { label: 'Career Change', value: 'career_change' },
        { label: 'Skill Upgrade', value: 'skill_upgrade' },
        { label: 'Just Exploring', value: 'exploring' },
      ].map((item) => (
        <FormControlLabel
          key={item.value}
          value={item.value}
          control={<Radio />}
          label={<Typography variant="body1" sx={{ fontWeight: 500 }}>{item.label}</Typography>}
          sx={{ mb: 1 }}
        />
      ))}
    </RadioGroup>
  </Box>
);

export const ExperienceLevelStep: React.FC<StepContentProps> = ({ formData, onChange }) => (
  <Box>
    <RadioGroup
      aria-label="experience-level"
      name="experienceLevel"
      value={formData.experienceLevel}
      onChange={onChange('experienceLevel')}
    >
      {[
        { label: 'Beginner (New to the field)', value: 'beginner' },
        { label: 'Intermediate (Some experience)', value: 'intermediate' },
        { label: 'Advanced (Experienced professional)', value: 'advanced' },
      ].map((item) => (
        <FormControlLabel
          key={item.value}
          value={item.value}
          control={<Radio />}
          label={<Typography variant="body1" sx={{ fontWeight: 500 }}>{item.label}</Typography>}
          sx={{ mb: 1 }}
        />
      ))}
    </RadioGroup>
  </Box>
);

export const SpecificInterestsStep: React.FC<StepContentProps> = ({ formData, onSpecificInterestsChange }) => (
  <Box>
    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
      Type your interests (e.g., "React", "Digital Marketing", "Financial Modeling"):
    </Typography>
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Add interests, separated by commas"
      value={formData.specificInterests.join(', ')}
      onChange={onSpecificInterestsChange}
      sx={{ mb: 2 }}
    />
    <Typography variant="body2" color="text.secondary">
      These will help us fine-tune your course recommendations.
    </Typography>
  </Box>
);

export const TimeCommitmentStep: React.FC<StepContentProps> = ({ formData, onChange }) => (
  <Box>
    <RadioGroup
      aria-label="time-commitment"
      name="timeCommitment"
      value={formData.timeCommitment}
      onChange={onChange('timeCommitment')}
    >
      {[
        { label: '1-2 hours/week (Light learning)', value: 'light' },
        { label: '3-5 hours/week (Moderate learning)', value: 'moderate' },
        { label: '6-10 hours/week (Intensive learning)', value: 'intensive' },
        { label: '10+ hours/week (Full-time learning)', value: 'full_time' },
      ].map((item) => (
        <FormControlLabel
          key={item.value}
          value={item.value}
          control={<Radio />}
          label={<Typography variant="body1" sx={{ fontWeight: 500 }}>{item.label}</Typography>}
          sx={{ mb: 1 }}
        />
      ))}
    </RadioGroup>
  </Box>
);

export const LearningStyleStep: React.FC<StepContentProps> = ({ formData, onChange }) => (
  <Box>
    <RadioGroup
      aria-label="learning-style"
      name="learningStyle"
      value={formData.learningStyle}
      onChange={onChange('learningStyle')}
    >
      {[
        { label: 'Visual Learning (Videos, diagrams, infographics)', value: 'visual' },
        { label: 'Hands-on Practice (Projects, exercises, labs)', value: 'hands_on' },
        { label: 'Theoretical Study (Reading, lectures, concepts)', value: 'theoretical' },
        { label: 'Interactive Learning (Discussions, collaboration, Q&A)', value: 'interactive' },
      ].map((item) => (
        <FormControlLabel
          key={item.value}
          value={item.value}
          control={<Radio />}
          label={<Typography variant="body1" sx={{ fontWeight: 500 }}>{item.label}</Typography>}
          sx={{ mb: 1 }}
        />
      ))}
    </RadioGroup>
  </Box>
);
