import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Fade,
} from '@mui/material';
import {
  Code,
  Analytics,
  Business,
  AccountBalance,
  Psychology,
  School,
  Support,
  TrendingUp,
  Work,
  BuildRounded,
  LocalLibraryRounded,
  GroupsRounded,
  AutoAwesome,
  DesignServicesRounded,
  Language,
} from '@mui/icons-material';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { useThemeContext } from '../contexts/ThemeContext';

const ServicesSection: React.FC = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });
  const { isDarkMode } = useThemeContext();

  const [selectedCategory, setSelectedCategory] = useState(0);

  const categories = [
    {
      title: "Student Academic Coaching",
      icon: <LocalLibraryRounded />,
      color: "#2196f3",
      description: "Personalized academic support to help students excel in their studies with improved learning techniques and study strategies.",
      programs: [
        {
          name: "High School Academic Support",
          description: "Comprehensive tutoring and mentorship to help high school students excel in their studies and prepare for higher education."
        },
        {
          name: "University Exam Preparation",
          description: "Intensive preparation for university entrance exams, standardized tests, and academic assessments with proven strategies."
        },
        {
          name: "Study Skills & Time Management",
          description: "Master effective study techniques, time management, and organizational skills for academic success and productivity."
        },
        {
          name: "Research & Writing Assistance",
          description: "Develop strong research methodology and academic writing skills for essays, reports, and scholarly papers."
        },
        {
          name: "Mathematics & Science Tutoring",
          description: "Expert tutoring in mathematics, physics, chemistry, and biology with practical problem-solving approaches."
        },
        {
          name: "Communication Skills",
          description: "Enhance verbal and written communication skills for academic presentations, discussions, and professional interactions."
        },
        {
          name: "Test-Taking Strategies",
          description: "Learn effective test-taking techniques, stress management, and optimal preparation methods for various exam formats."
        },
        {
          name: "Academic Goal Setting & Planning",
          description: "Strategic academic planning and goal-setting to maximize educational outcomes and career preparation."
        }
      ]
    },
    {
      title: "ExJobNet Platform Services",
      icon: <Work />,
      color: "#ff5722",
      description: "Comprehensive digital career platform offering AI-powered job matching, professional development, and career advancement tools across Africa.",
      programs: [
        {
          name: "Smart Job Matching & Search",
          description: "Advanced AI-powered job search with personalized recommendations, saved jobs, and intelligent filtering across diverse industries and locations."
        },
        {
          name: "AI-Powered Interview Preparation",
          description: "Interactive AI interview coaching with real-time feedback, practice sessions for various job roles, and performance analytics to boost confidence."
        },
        {
          name: "Psychometric Testing & Assessment",
          description: "Comprehensive personality assessments, cognitive ability tests, and skills evaluations to match candidates with suitable career paths."
        },
        {
          name: "Career Guidance & Mentorship",
          description: "Personalized career counseling with AI-driven insights, career path recommendations, and professional development planning."
        },
        {
          name: "Digital Profile & Portfolio Builder",
          description: "Dynamic professional profiles with skill verification, achievement showcases, and portfolio management to attract top employers."
        },
        {
          name: "Blockchain-Verified Certificates",
          description: "Secure, tamper-proof digital certificates for completed courses and skills, verified on blockchain technology for global recognition."
        },
        {
          name: "Employer Talent Acquisition Tools",
          description: "Advanced recruitment solutions including candidate screening, interview management, analytics, and talent pipeline development."
        },
        {
          name: "Professional Networking Hub",
          description: "Connect with industry professionals, join career communities, access mentorship opportunities, and expand your professional network."
        }
      ]
    },
    {
      title: "Technology & Digital Solutions",
      icon: <Code />,
      color: "#3f51b5",
      description: "Comprehensive tech training programs covering cutting-edge technologies and digital skills for the modern workforce.",
      programs: [
        {
          name: "Software Development & Programming",
          description: "Master programming languages, software architecture, and development methodologies for building robust applications."
        },
        {
          name: "Web & Mobile App Development",
          description: "Create responsive websites and mobile applications using modern frameworks and development best practices."
        },
        {
          name: "Cloud Computing & DevOps",
          description: "Learn cloud platforms, containerization, and automation tools for scalable and efficient software deployment."
        },
        {
          name: "Cybersecurity & Data Protection",
          description: "Develop expertise in network security, threat detection, and data protection strategies for digital environments."
        },
        {
          name: "Digital Marketing & E-commerce",
          description: "Master online marketing strategies, SEO, social media marketing, and e-commerce platform management."
        },
        {
          name: "UI/UX Design & Digital Graphics",
          description: "Design intuitive user interfaces and engaging user experiences with modern design tools and principles."
        },
        {
          name: "Digital Literacy & Computer Skills",
          description: "Build foundational computer skills, digital communication, and productivity software proficiency."
        },
        {
          name: "IT Support & Network Administration",
          description: "Learn system administration, network management, and technical support skills for IT infrastructure."
        }
      ]
    },
    {
      title: "Data & Analytics",
      icon: <Analytics />,
      color: "#ff6b6b", 
      description: "Master data science and analytics with hands-on experience in statistical analysis, machine learning, and business intelligence.",
      programs: [
        {
          name: "Data Analytics & Visualization",
          description: "Transform raw data into actionable insights using advanced analytics tools and compelling visualization techniques."
        },
        {
          name: "Machine Learning & AI",
          description: "Build intelligent systems with machine learning algorithms, neural networks, and artificial intelligence applications."
        },
        {
          name: "Business Intelligence",
          description: "Create comprehensive business intelligence solutions for data-driven decision making and strategic planning."
        },
        {
          name: "Statistical Analysis",
          description: "Master statistical methods, hypothesis testing, and predictive modeling for research and business applications."
        },
        {
          name: "Python & R Programming",
          description: "Learn Python and R programming languages for data manipulation, analysis, and statistical computing."
        },
        {
          name: "SQL & Database Management",
          description: "Master database design, SQL querying, and data management for efficient data storage and retrieval."
        },
        {
          name: "Data Science Bootcamp",
          description: "Intensive hands-on training covering the complete data science pipeline from collection to deployment."
        },
        {
          name: "Big Data Technologies",
          description: "Work with large-scale data processing frameworks, distributed computing, and big data analytics platforms."
        }
      ]
    },
    {
      title: "Business Management & Entrepreneurship",
      icon: <Business />,
      color: "#4caf50",
      description: "Build entrepreneurial skills and business acumen with practical training in startup development and business management.",
      programs: [
        {
          name: "Business Development & Strategy",
          description: "Develop strategic business plans, identify growth opportunities, and implement sustainable business models."
        },
        {
          name: "Entrepreneurship & Startup",
          description: "Launch and scale successful startups with practical training in business fundamentals and venture development."
        },
        {
          name: "Digital Marketing & Social Media",
          description: "Master digital marketing strategies, social media management, and online brand building for business growth."
        },
        {
          name: "Sales & Customer Relations",
          description: "Excel in sales techniques, customer relationship management, and client retention strategies."
        },
        {
          name: "Supply Chain & Operations",
          description: "Optimize business operations, supply chain management, and logistics for efficient business processes."
        },
        {
          name: "E-commerce & Online Business",
          description: "Build and manage successful online businesses with e-commerce platforms and digital sales strategies."
        },
        {
          name: "Business Plan Development",
          description: "Create comprehensive business plans, financial projections, and investor-ready business presentations."
        },
        {
          name: "Market Research & Analysis",
          description: "Conduct thorough market research, competitive analysis, and consumer behavior studies for strategic decisions."
        }
      ]
    },
    {
      title: "Finance & Accounting",
      icon: <AccountBalance />,
      color: "#ff9800",
      description: "Professional finance and accounting training with focus on industry standards, compliance, and financial management practices.",
      programs: [
        {
          name: "Financial Accounting & Reporting",
          description: "Master financial statements preparation, accounting principles, and regulatory reporting requirements."
        },
        {
          name: "Tax Preparation & Planning",
          description: "Learn comprehensive tax preparation, planning strategies, and compliance with local and international tax laws."
        },
        {
          name: "Audit & Compliance",
          description: "Develop auditing skills, internal controls assessment, and regulatory compliance procedures."
        },
        {
          name: "Financial Management & Planning",
          description: "Strategic financial planning, budgeting, forecasting, and investment decision-making for organizations."
        },
        {
          name: "Bookkeeping & Payroll",
          description: "Master day-to-day bookkeeping operations, payroll processing, and small business financial management."
        },
        {
          name: "Investment & Portfolio Management",
          description: "Learn investment analysis, portfolio optimization, and wealth management strategies for individual and institutional clients."
        },
        {
          name: "Corporate Finance",
          description: "Advanced corporate financial strategies, mergers and acquisitions, and capital structure optimization."
        },
        {
          name: "Forensic Accounting",
          description: "Specialize in fraud detection, financial investigation, and litigation support services."
        }
      ]
    },
    {
      title: "Project Management",
      icon: <TrendingUp />,
      color: "#9c27b0",
      description: "Learn professional project management methodologies and earn industry-recognized certifications for career advancement.",
      programs: [
        {
          name: "PMP Certification Preparation",
          description: "Comprehensive preparation for Project Management Professional certification with practice exams and real-world scenarios."
        },
        {
          name: "PRINCE2 Methodology",
          description: "Master PRINCE2 project management methodology with structured approach to project delivery and governance."
        },
        {
          name: "Agile & Scrum Master",
          description: "Learn agile methodologies, Scrum framework, and leadership skills for agile project environments."
        },
        {
          name: "Risk Management",
          description: "Identify, assess, and mitigate project risks with comprehensive risk management strategies and tools."
        },
        {
          name: "Quality Management",
          description: "Implement quality assurance processes, continuous improvement, and quality control in project delivery."
        },
        {
          name: "Construction Project Management",
          description: "Specialized project management skills for construction industry including scheduling, cost control, and safety management."
        },
        {
          name: "IT Project Management",
          description: "Manage technology projects, software development lifecycle, and digital transformation initiatives."
        },
        {
          name: "Leadership in Project Management",
          description: "Develop leadership skills, team management, and stakeholder communication for successful project delivery."
        }
      ]
    },
    {
      title: "Leadership & Executive Coaching",
      icon: <Psychology />,
      color: "#607d8b",
      description: "Develop executive presence and leadership capabilities with strategic thinking and team management expertise.",
      programs: [
        {
          name: "Executive Leadership Development",
          description: "Comprehensive leadership training for C-suite executives focusing on vision, strategy, and organizational transformation."
        },
        {
          name: "Strategic Thinking & Planning",
          description: "Develop strategic thinking capabilities, long-term planning skills, and competitive analysis for business success."
        },
        {
          name: "Team Management & Motivation",
          description: "Master team leadership techniques, employee motivation strategies, and high-performance team building."
        },
        {
          name: "Change Management",
          description: "Lead organizational change initiatives with proven methodologies for smooth transitions and stakeholder buy-in."
        },
        {
          name: "Emotional Intelligence",
          description: "Enhance self-awareness, empathy, and interpersonal skills for effective leadership and relationship management."
        },
        {
          name: "Communication & Presentation Skills",
          description: "Master executive communication, public speaking, and presentation skills for influential leadership."
        },
        {
          name: "Conflict Resolution",
          description: "Learn mediation techniques, negotiation skills, and conflict management strategies for workplace harmony."
        },
        {
          name: "Performance Management",
          description: "Implement effective performance management systems, feedback processes, and talent development programs."
        }
      ]
    },
    {
      title: "Professional Certifications",
      icon: <School />,
      color: "#795548",
      description: "Earn internationally recognized professional certifications to validate your expertise and advance your career prospects.",
      programs: [
        {
          name: "CPA (Certified Public Accountant)",
          description: "Complete CPA exam preparation with comprehensive accounting principles, auditing, and business law coverage."
        },
        {
          name: "PMP (Project Management Professional)",
          description: "Achieve PMP certification with intensive training in project management best practices and methodologies."
        },
        {
          name: "PRINCE2 Certification",
          description: "Earn PRINCE2 Foundation and Practitioner certifications in structured project management methodology."
        },
        {
          name: "Scrum Master Certification",
          description: "Become a certified Scrum Master with training in agile principles and team facilitation skills."
        },
        {
          name: "Digital Marketing Certification",
          description: "Gain Google, Facebook, and HubSpot certifications in digital marketing and analytics."
        },
        {
          name: "HR Professional Certification",
          description: "Prepare for SHRM-CP, PHR, and other HR professional certifications with comprehensive training."
        },
        {
          name: "IT Certification Programs",
          description: "Earn industry-standard IT certifications including CompTIA, Cisco, Microsoft, and AWS credentials."
        },
        {
          name: "Industry-Specific Certifications",
          description: "Specialized certifications for healthcare, finance, manufacturing, and other industry professionals."
        }
      ]
    },
    {
      title: "HR & Legal Compliance",
      icon: <Support />,
      color: "#009688",
      description: "Master human resources management and legal compliance with training in employment law and organizational practices.",
      programs: [
        {
          name: "Human Resources Management",
          description: "Comprehensive HR management including recruitment, policy development, and strategic human capital planning."
        },
        {
          name: "Employment Law & Compliance",
          description: "Navigate complex employment laws, regulatory compliance, and workplace legal requirements."
        },
        {
          name: "Recruitment & Talent Management",
          description: "Master talent acquisition strategies, interviewing techniques, and employee retention programs."
        },
        {
          name: "Employee Relations",
          description: "Develop skills in conflict resolution, employee engagement, and workplace culture development."
        },
        {
          name: "Performance & Compensation",
          description: "Design performance management systems, compensation structures, and employee benefit programs."
        },
        {
          name: "Workplace Safety & Health",
          description: "Implement occupational safety programs, health and wellness initiatives, and risk management practices."
        },
        {
          name: "Legal Documentation",
          description: "Create and manage employment contracts, policies, procedures, and legal compliance documentation."
        },
        {
          name: "HR Analytics & Metrics",
          description: "Use data analytics for HR decision-making, workforce planning, and performance measurement."
        }
      ]
    },
    {
      title: "Communication & Language",
      icon: <Language />,
      color: "#8bc34a",
      description: "Enhance your communication skills and language proficiency for professional success in global business environments.",
      programs: [
        {
          name: "English Language Proficiency",
          description: "Improve English speaking, writing, and comprehension skills for international business communication."
        },
        {
          name: "Business Communication",
          description: "Master professional communication skills for meetings, presentations, and corporate correspondence."
        },
        {
          name: "Public Speaking & Presentation",
          description: "Develop confident public speaking abilities and create compelling presentations that engage audiences."
        },
        {
          name: "Professional Writing Skills",
          description: "Enhance business writing, report preparation, and professional correspondence across various formats."
        },
        {
          name: "Technical Writing",
          description: "Specialize in technical documentation, user manuals, and complex information communication."
        },
        {
          name: "Cross-Cultural Communication",
          description: "Navigate cultural differences in global business environments with effective intercultural communication."
        },
        {
          name: "Interpersonal Communication",
          description: "Build strong interpersonal relationships through active listening, empathy, and emotional communication."
        },
        {
          name: "Media & Journalism",
          description: "Learn journalistic writing, media relations, and communication strategies for public engagement."
        }
      ]
    },
    {
      title: "Creative & Design",
      icon: <DesignServicesRounded />,
      color: "#e91e63",
      description: "Unleash your creativity with professional design training covering visual arts, digital media, and creative content production.",
      programs: [
        {
          name: "Graphic Design & Branding",
          description: "Create compelling visual identities, logos, and brand materials using industry-standard design software and principles."
        },
        {
          name: "Digital Art & Illustration",
          description: "Master digital illustration techniques, concept art, and creative visual storytelling for various media platforms."
        },
        {
          name: "Video Production & Editing",
          description: "Learn professional video production, editing techniques, and post-production workflows for engaging content."
        },
        {
          name: "Photography & Visual Arts",
          description: "Develop photography skills, visual composition, and artistic expression for commercial and creative applications."
        },
        {
          name: "Creative Writing & Content",
          description: "Enhance creative writing abilities, content creation, and storytelling for digital and traditional media."
        },
        {
          name: "Animation & Motion Graphics",
          description: "Create dynamic animations, motion graphics, and visual effects for digital media and entertainment."
        },
        {
          name: "Interior & Architectural Design",
          description: "Design functional and aesthetic interior spaces with architectural principles and space planning expertise."
        },
        {
          name: "Fashion & Product Design",
          description: "Develop skills in fashion design, product development, and consumer-focused design innovation."
        }
      ]
    },
    {
      title: "Health & Wellness Coaching",
      icon: <AutoAwesome />,
      color: "#cddc39",
      description: "Transform lives through holistic wellness coaching focusing on personal development, mental health, and life balance.",
      programs: [
        {
          name: "Life Coaching & Personal Development",
          description: "Guide individuals through personal transformation, goal achievement, and life purpose discovery."
        },
        {
          name: "Wellness & Nutrition Guidance",
          description: "Provide holistic wellness coaching including nutrition planning, healthy lifestyle design, and wellness program development."
        },
        {
          name: "Stress Management & Mental Health",
          description: "Develop strategies for stress reduction, mental health support, and psychological wellbeing improvement."
        },
        {
          name: "Fitness & Exercise Coaching",
          description: "Create personalized fitness programs, exercise coaching, and physical wellness training for diverse populations."
        },
        {
          name: "Work-Life Balance",
          description: "Help professionals achieve sustainable work-life integration and personal fulfillment strategies."
        },
        {
          name: "Mindfulness & Meditation",
          description: "Teach mindfulness practices, meditation techniques, and contemplative approaches to wellbeing."
        },
        {
          name: "Habit Formation & Goal Setting",
          description: "Master behavior change psychology, habit formation, and systematic goal achievement methodologies."
        },
        {
          name: "Emotional Resilience Building",
          description: "Develop emotional intelligence, resilience skills, and mental toughness for personal and professional challenges."
        }
      ]
    },
    {
      title: "Specialized Industries",
      icon: <BuildRounded />,
      color: "#00bcd4",
      description: "Industry-specific training programs tailored for specialized sectors with practical applications and expert guidance.",
      programs: [
        {
          name: "Healthcare & Medical Training",
          description: "Specialized training for healthcare professionals including medical administration, patient care, and healthcare technology."
        },
        {
          name: "Agriculture & Food Security",
          description: "Modern agricultural practices, sustainable farming, food production, and agricultural business management."
        },
        {
          name: "Environmental & Sustainability",
          description: "Environmental management, sustainability practices, renewable energy, and green business solutions."
        },
        {
          name: "Real Estate & Property Management",
          description: "Real estate investment, property management, market analysis, and real estate business development."
        },
        {
          name: "Manufacturing & Production",
          description: "Production management, quality control, lean manufacturing, and industrial process optimization."
        },
        {
          name: "Logistics & Supply Chain",
          description: "Supply chain management, logistics optimization, inventory control, and distribution strategies."
        },
        {
          name: "Tourism & Hospitality",
          description: "Hospitality management, customer service excellence, tourism marketing, and travel industry operations."
        },
        {
          name: "Non-Profit & Social Impact",
          description: "Non-profit management, fundraising strategies, social entrepreneurship, and community development programs."
        }
      ]
    },
    {
      title: "TVET Development Programs",
      icon: <BuildRounded />,
      color: "#f44336",
      description: "Technical and Vocational Education and Training programs designed to develop practical skills and competencies for immediate workforce entry.",
      programs: [
        {
          name: "Automotive Technology & Mechanics",
          description: "Comprehensive automotive repair, maintenance, diagnostics, and modern vehicle technology training for career advancement."
        },
        {
          name: "Electrical & Electronics Technology",
          description: "Hands-on training in electrical systems, electronics repair, wiring, and electrical safety for residential and industrial applications."
        },
        {
          name: "Plumbing & HVAC Systems",
          description: "Professional plumbing, heating, ventilation, and air conditioning system installation, maintenance, and repair training."
        },
        {
          name: "Welding & Metal Fabrication",
          description: "Master various welding techniques, metal fabrication, blueprint reading, and safety protocols for industrial applications."
        },
        {
          name: "Construction & Building Trades",
          description: "Learn carpentry, masonry, concrete work, and construction project management with emphasis on safety and building codes."
        },
        {
          name: "Culinary Arts & Food Service",
          description: "Professional chef training, food preparation, kitchen management, and hospitality service skills for restaurant industry."
        },
        {
          name: "Beauty & Cosmetology Services",
          description: "Comprehensive beauty training including hair styling, skincare, makeup artistry, and salon business management."
        },
        {
          name: "Healthcare Support & Nursing Aid",
          description: "Medical assistant training, patient care, healthcare documentation, and clinical support skills for healthcare facilities."
        },
        {
          name: "Information Technology Support",
          description: "Computer repair, network setup, technical support, and basic IT infrastructure maintenance for small businesses."
        },
        {
          name: "Agriculture & Livestock Management",
          description: "Modern farming techniques, crop management, livestock care, and agricultural business practices for sustainable farming."
        },
        {
          name: "Tailoring & Fashion Design",
          description: "Professional garment construction, pattern making, fashion design basics, and clothing alteration services."
        },
        {
          name: "Small Business & Entrepreneurship",
          description: "Practical business startup training, financial management, marketing strategies, and business registration procedures."
        }
      ]
    }
  ];

  const selectedCategoryData = categories[selectedCategory];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <Box 
      ref={ref}
      id="services"
      sx={{ 
        py: { xs: 8, md: 12 },
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDarkMode ? `
            radial-gradient(circle at 20% 80%, rgba(74, 222, 128, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)
          ` : `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Fade in={inView} timeout={800}>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: isDarkMode 
                  ? 'linear-gradient(45deg, #4ade80, #ff8a80)'
                  : 'linear-gradient(45deg, #3f51b5, #ff6b6b)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' }
              }}
            >
              Our Comprehensive Programs
            </Typography>
            <Typography
              variant="h5"
              component="h3"
              sx={{
                fontWeight: 600,
                mb: 3,
                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#334155',
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem' }
              }}
            >
              Transform Your Career Across Multiple Industries
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.1rem' },
                color: '#64748b',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Excellence Coaching Hub offers comprehensive training and coaching programs across diverse fields. 
              With expert instructors, personalized coaching, live video sessions, study materials, and hands-on practice, 
              we prepare you for success in today's competitive job market.
            </Typography>
          </Box>
        </Fade>

        {/* Category Selection Tabs */}
        <Fade in={inView} timeout={1000}>
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h6"
              sx={{
                textAlign: 'center',
                mb: 3,
                color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1e293b',
                fontWeight: 700
              }}
            >
              Choose Your Field of Interest
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1.5, 
              justifyContent: 'center',
              mb: 4
            }}>
              {categories.map((category, index) => (
                <Chip
                  key={index}
                  icon={category.icon}
                  label={category.title}
                  onClick={() => setSelectedCategory(index)}
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    fontWeight: 600,
                    px: { xs: 1, sm: 2 },
                    py: { xs: 2, sm: 3 },
                    height: { xs: 36, sm: 48 },
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    bgcolor: selectedCategory === index 
                      ? category.color 
                      : isDarkMode ? 'rgba(40, 40, 40, 0.8)' : 'white',
                    color: selectedCategory === index 
                      ? 'white' 
                      : isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#475569',
                    border: `2px solid ${selectedCategory === index ? category.color : isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0'}`,
                    '&:hover': {
                      bgcolor: selectedCategory === index 
                        ? category.color 
                        : isDarkMode ? `${category.color}20` : 'rgba(99, 102, 241, 0.1)',
                      borderColor: category.color,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${category.color}40`
                    },
                    '& .MuiChip-icon': {
                      color: selectedCategory === index ? 'white' : category.color,
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Fade>

        {/* Selected Category Programs */}
        <Fade in={inView} timeout={1200}>
          <motion.div
            key={selectedCategory}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: isDarkMode 
                  ? '0 20px 60px rgba(0, 0, 0, 0.4)' 
                  : '0 20px 60px rgba(0, 0, 0, 0.1)',
                border: `2px solid ${selectedCategoryData.color}${isDarkMode ? '40' : '20'}`,
                background: isDarkMode 
                  ? 'rgba(30, 30, 30, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
                {/* Category Header */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 4,
                  flexDirection: { xs: 'column', sm: 'row' },
                  textAlign: { xs: 'center', sm: 'left' }
                }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: selectedCategoryData.color,
                      color: 'white',
                      mr: { xs: 0, sm: 3 },
                      mb: { xs: 2, sm: 0 },
                      display: 'flex',
                      fontSize: '2rem'
                    }}
                  >
                    {selectedCategoryData.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1e293b',
                        fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                        mb: 1
                      }}
                    >
                      {selectedCategoryData.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        fontWeight: 500
                      }}
                    >
                      {selectedCategoryData.description}
                    </Typography>
                  </Box>
                </Box>

                {/* Programs Grid */}
                <Grid container spacing={3}>
                  {selectedCategoryData.programs.map((program, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <motion.div variants={itemVariants}>
                        <Card
                          sx={{
                            height: '100%',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            border: `1px solid ${selectedCategoryData.color}${isDarkMode ? '40' : '20'}`,
                            bgcolor: isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'white',
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 12px 40px ${selectedCategoryData.color}30`,
                              borderColor: selectedCategoryData.color,
                            }
                          }}
                        >
                          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: selectedCategoryData.color,
                                  mr: 2,
                                  mt: 0.5,
                                  flexShrink: 0
                                }}
                              />
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1e293b',
                                  fontSize: { xs: '1rem', md: '1.1rem' },
                                  lineHeight: 1.4,
                                  flex: 1
                                }}
                              >
                                {program.name}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mt: 'auto' }}>
                              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                <Chip 
                                  size="small" 
                                  label="Live Sessions" 
                                  sx={{ 
                                    bgcolor: isDarkMode ? `${selectedCategoryData.color}25` : `${selectedCategoryData.color}15`,
                                    color: selectedCategoryData.color,
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }} 
                                />
                                <Chip 
                                  size="small" 
                                  label="Certification" 
                                  sx={{ 
                                    bgcolor: isDarkMode ? `${selectedCategoryData.color}25` : `${selectedCategoryData.color}15`,
                                    color: selectedCategoryData.color,
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }} 
                                />
                              </Stack>
                              
                              <Typography
                                variant="body2"
                                sx={{
                                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                                  fontSize: '0.9rem',
                                  lineHeight: 1.5
                                }}
                              >
                                {program.description}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {/* Call to Action */}
                <Box sx={{ 
                  textAlign: 'center', 
                  mt: 6, 
                  p: { xs: 3, md: 5 }, 
                  borderRadius: 4,
                  background: isDarkMode 
                    ? `linear-gradient(135deg, rgba(30, 30, 30, 0.6) 0%, rgba(20, 20, 20, 0.4) 100%)`
                    : `linear-gradient(135deg, ${selectedCategoryData.color}08 0%, ${selectedCategoryData.color}03 100%)`,
                  border: `1px solid ${selectedCategoryData.color}${isDarkMode ? '30' : '20'}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${selectedCategoryData.color}, ${selectedCategoryData.color}80)`,
                  }
                }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      background: `linear-gradient(45deg, ${selectedCategoryData.color}, ${selectedCategoryData.color}80)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 2,
                      fontSize: { xs: '1.5rem', md: '2rem' }
                    }}
                  >
                    Ready to Transform Your Career?
                  </Typography>
                  
                  <Typography
                    variant="body1"
                    sx={{
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#64748b',
                      mb: 4,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      maxWidth: '800px',
                      mx: 'auto',
                      lineHeight: 1.7
                    }}
                  >
                    Join thousands of professionals across Africa who have accelerated their careers and scaled their operations with our expert coaching programs.
                  </Typography>

                  {/* Features Grid */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                      <Card sx={{
                        p: 3,
                        height: '100%',
                        borderRadius: 3,
                        border: `1px solid ${selectedCategoryData.color}${isDarkMode ? '30' : '20'}`,
                        background: isDarkMode 
                          ? 'rgba(30, 30, 30, 0.8)' 
                          : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: selectedCategoryData.color,
                          boxShadow: `0 8px 30px ${selectedCategoryData.color}20`
                        }
                      }}>
                        <Box sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${selectedCategoryData.color}20, ${selectedCategoryData.color}10)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2
                        }}>
                          <AutoAwesome sx={{ fontSize: 28, color: selectedCategoryData.color }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1e293b' }}>
                          Personalized Coaching
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#64748b', lineHeight: 1.6 }}>
                          Tailored guidance for career advancement, business growth, and leadership development
                        </Typography>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card sx={{
                        p: 3,
                        height: '100%',
                        borderRadius: 3,
                        border: `1px solid ${selectedCategoryData.color}${isDarkMode ? '30' : '20'}`,
                        background: isDarkMode 
                          ? 'rgba(30, 30, 30, 0.8)' 
                          : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: selectedCategoryData.color,
                          boxShadow: `0 8px 30px ${selectedCategoryData.color}20`
                        }
                      }}>
                        <Box sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${selectedCategoryData.color}20, ${selectedCategoryData.color}10)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2
                        }}>
                          <LocalLibraryRounded sx={{ fontSize: 28, color: selectedCategoryData.color }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1e293b' }}>
                          Comprehensive Resources
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#64748b', lineHeight: 1.6 }}>
                          Access practical tools and materials across Business, Technology, Finance, and Leadership
                        </Typography>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card sx={{
                        p: 3,
                        height: '100%',
                        borderRadius: 3,
                        border: `1px solid ${selectedCategoryData.color}${isDarkMode ? '30' : '20'}`,
                        background: isDarkMode 
                          ? 'rgba(30, 30, 30, 0.8)' 
                          : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: selectedCategoryData.color,
                          boxShadow: `0 8px 30px ${selectedCategoryData.color}20`
                        }
                      }}>
                        <Box sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${selectedCategoryData.color}20, ${selectedCategoryData.color}10)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2
                        }}>
                          <GroupsRounded sx={{ fontSize: 28, color: selectedCategoryData.color }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1e293b' }}>
                          Interactive Sessions
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#64748b', lineHeight: 1.6 }}>
                          Engage in live video sessions with industry experts and like-minded professionals
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* CTA Button */}
                  <Box sx={{ mt: 4 }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Box
                        component="button"
                        sx={{
                          background: `linear-gradient(135deg, ${selectedCategoryData.color}, ${selectedCategoryData.color}CC)`,
                          color: 'white',
                          fontWeight: 700,
                          fontSize: { xs: '1rem', md: '1.1rem' },
                          px: { xs: 4, md: 6 },
                          py: { xs: 1.5, md: 2 },
                          borderRadius: '50px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: `0 8px 25px ${selectedCategoryData.color}40`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: `0 12px 35px ${selectedCategoryData.color}50`,
                          }
                        }}
                      >
                        Start Your Journey Today
                      </Box>
                    </motion.div>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Fade>
      </Container>
    </Box>
  );
};

export default ServicesSection;