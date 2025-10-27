import { Request, Response } from 'express';
import { JobSeekerProfile, StudentProfile, User } from '@/models';
import { UserRole, EducationLevel, JobType } from '../../../shared/types';
import { AuthRequest } from '@/middleware/auth';

// Create or update job seeker profile
export const createOrUpdateJobSeekerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const {
      // Personal Information
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      nationality,
      location,
      address,
      bio,
      
      // Professional Information
      jobTitle,
      company,
      industry,
      department,
      employmentStatus,
      experienceLevel,
      yearsOfExperience,
      noticePeriod,
      summary,
      currentSalary,
      expectedSalary,
      preferredJobType,
      workPreference,
      
      // Documents
      cvFile,
      resumeFile,
      portfolioFiles,
      
      // Legacy fields (keeping for backward compatibility)
      resume,
      skills,
      experience,
      education,
      interests,
      preferredJobTypes,
      preferredLocations,
      salaryExpectation,
      availability,
      
      // Social Media Links
      socialLinks,
      
      // Legacy social fields
      linkedInProfile,
      portfolioUrl,
      
      // Languages
      languages,
      
      // Job Preferences
      jobPreferences
    } = req.body;

    // Check if profile already exists
    let profile = await JobSeekerProfile.findOne({ user: userId });

    if (profile) {
      // Update existing profile
      Object.assign(profile, {
        // Personal Information
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        gender,
        nationality,
        location,
        address,
        bio,
        
        // Professional Information
        jobTitle,
        company,
        industry,
        department,
        employmentStatus,
        experienceLevel,
        yearsOfExperience,
        noticePeriod,
        summary,
        currentSalary,
        expectedSalary,
        preferredJobType,
        workPreference,
        
        // Documents
        cvFile,
        resumeFile,
        portfolioFiles,
        
        // Legacy fields
        resume,
        skills,
        experience,
        education,
        interests,
        preferredJobTypes,
        preferredLocations,
        salaryExpectation,
        availability,
        
        // Social Media Links
        socialLinks,
        
        // Legacy social fields
        linkedInProfile,
        portfolioUrl,
        
        // Languages
        languages,
        
        // Job Preferences
        jobPreferences
      });
      await profile.save();
    } else {
      // Create new profile
      profile = new JobSeekerProfile({
        user: userId,
        
        // Personal Information
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        gender,
        nationality,
        location,
        address,
        bio,
        
        // Professional Information
        jobTitle,
        company,
        industry,
        department,
        employmentStatus,
        experienceLevel,
        yearsOfExperience,
        noticePeriod,
        summary,
        currentSalary,
        expectedSalary,
        preferredJobType,
        workPreference,
        
        // Documents
        cvFile,
        resumeFile,
        portfolioFiles,
        
        // Legacy fields
        resume,
        skills,
        experience,
        education,
        interests,
        preferredJobTypes,
        preferredLocations,
        salaryExpectation,
        availability,
        
        // Social Media Links
        socialLinks,
        
        // Legacy social fields
        linkedInProfile,
        portfolioUrl,
        
        // Languages
        languages,
        
        // Job Preferences
        jobPreferences
      });
      await profile.save();

      // Update user role to include JOB_SEEKER if not already present
      const user = await User.findById(userId);
      if (user && user.role !== UserRole.JOB_SEEKER) {
        // If user is a student, they can have both roles
        if (user.role === UserRole.STUDENT) {
          // Keep student role but add job seeker capabilities
          // This is handled in the frontend logic
        } else {
          user.role = UserRole.JOB_SEEKER;
          await user.save();
        }
      }
    }

    const populatedProfile = await JobSeekerProfile.findById(profile._id)
      .populate('user', 'firstName lastName email avatar')
      .populate('certifications');

    res.status(200).json({
      success: true,
      data: populatedProfile,
      message: profile.isNew ? 'Job seeker profile created successfully' : 'Job seeker profile updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to create/update job seeker profile',
      message: error.message
    });
  }
};

// Create or update student profile
export const createOrUpdateStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.STUDENT) {
      return res.status(403).json({
        success: false,
        error: 'Only students can create/update student profiles'
      });
    }

    const {
      age,
      educationLevel,
      jobInterests,
      careerGoals,
      // Additional fields from frontend
      dateOfBirth,
      gender,
      phone,
      address,
      emergencyContact,
      currentEducationLevel,
      schoolName,
      fieldOfStudy,
      graduationYear,
      gpa,
      academicInterests,
      preferredCareerPath,
      workExperience,
      skills,
      languages,
      preferredLearningStyle,
      studySchedule,
      learningGoals
    } = req.body;

    // Validate education level (use currentEducationLevel if educationLevel is not provided)
    const finalEducationLevel = educationLevel || currentEducationLevel;
    if (finalEducationLevel && !Object.values(EducationLevel).includes(finalEducationLevel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid education level'
      });
    }

    // Check if profile already exists
    let profile = await StudentProfile.findOne({ user: userId });

    if (profile) {
      // Update existing profile
      Object.assign(profile, {
        age,
        educationLevel: finalEducationLevel,
        jobInterests: jobInterests || academicInterests || [],
        careerGoals: Array.isArray(careerGoals) ? careerGoals : (careerGoals ? [careerGoals] : []),
        // Additional fields
        dateOfBirth,
        gender,
        phone,
        address,
        emergencyContact,
        currentEducationLevel,
        schoolName,
        fieldOfStudy,
        graduationYear,
        gpa,
        academicInterests: academicInterests || [],
        preferredCareerPath: preferredCareerPath || [],
        workExperience: workExperience || [],
        skills: skills || [],
        languages: languages || [],
        preferredLearningStyle,
        studySchedule,
        learningGoals: learningGoals || []
      });
      await profile.save();
    } else {
      // Create new profile
      profile = new StudentProfile({
        user: userId,
        age,
        educationLevel: finalEducationLevel || EducationLevel.HIGH_SCHOOL,
        jobInterests: jobInterests || academicInterests || [],
        careerGoals: Array.isArray(careerGoals) ? careerGoals : (careerGoals ? [careerGoals] : []),
        // Additional fields
        dateOfBirth,
        gender,
        phone,
        address,
        emergencyContact,
        currentEducationLevel,
        schoolName,
        fieldOfStudy,
        graduationYear,
        gpa,
        academicInterests: academicInterests || [],
        preferredCareerPath: preferredCareerPath || [],
        workExperience: workExperience || [],
        skills: skills || [],
        languages: languages || [],
        preferredLearningStyle,
        studySchedule,
        learningGoals: learningGoals || [],
        completedCourses: [], // Will be populated from enrollments
        certificates: []
      });
      await profile.save();
    }

    const populatedProfile = await StudentProfile.findById(profile._id)
      .populate('user', 'firstName lastName email avatar')
      .populate('completedCourses', 'title description category')
      .populate('certificates');

    res.status(200).json({
      success: true,
      data: populatedProfile,
      message: profile.isNew ? 'Student profile created successfully' : 'Student profile updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to create/update student profile',
      message: error.message
    });
  }
};

// Get simple user profile (basic info including email)
export const getSimpleProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await User.findById(userId).select('firstName lastName email avatar phone role userType');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        role: user.role,
        userType: user.userType,
        fullName: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
      message: error.message
    });
  }
};

// Get user's job seeker profile
export const getJobSeekerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const profile = await JobSeekerProfile.findOne({ user: userId })
      .populate('user', 'firstName lastName email avatar phone location bio')
      .populate('certifications');

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Job seeker profile not found'
      });
    }

    // Ensure email is included from either profile or user
    const profileData = profile.toObject();
    if (profileData.user && profileData.user.email) {
      profileData.email = profileData.user.email;
    }
    // Also include other user fields if not present in profile
    if (profileData.user) {
      profileData.userFirstName = profileData.user.firstName;
      profileData.userLastName = profileData.user.lastName;
      profileData.userEmail = profileData.user.email;
      profileData.userAvatar = profileData.user.avatar;
      profileData.userPhone = profileData.user.phone;
    }

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job seeker profile',
      message: error.message
    });
  }
};

// Get user's student profile
export const getStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user is a student
    if (userRole !== UserRole.STUDENT) {
      return res.status(403).json({
        success: false,
        error: 'Only students can access student profiles'
      });
    }

    let profile = await StudentProfile.findOne({ user: userId })
      .populate('user', 'firstName lastName email avatar phone location bio')
      .populate('completedCourses', 'title description category')
      .populate('certificates');

    // If no profile exists, create a basic one
    if (!profile) {
      profile = new StudentProfile({
        user: userId,
        age: undefined,
        educationLevel: EducationLevel.HIGH_SCHOOL, // Default value
        jobInterests: [],
        careerGoals: [],
        completedCourses: [],
        certificates: []
      });
      await profile.save();
      
      // Re-populate after saving
      profile = await StudentProfile.findById(profile._id)
        .populate('user', 'firstName lastName email avatar phone location bio')
        .populate('completedCourses', 'title description category')
        .populate('certificates');
    }

    // Ensure email and other user data is included
    const profileData = profile.toObject();
    if (profileData.user) {
      profileData.email = profileData.user.email;
      profileData.userFirstName = profileData.user.firstName;
      profileData.userLastName = profileData.user.lastName;
      profileData.userEmail = profileData.user.email;
      profileData.userAvatar = profileData.user.avatar;
      profileData.userPhone = profileData.user.phone;
      profileData.fullName = `${profileData.user.firstName} ${profileData.user.lastName}`;
    }

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student profile',
      message: error.message
    });
  }
};

// Search job seekers (Employer access)
export const searchJobSeekers = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== UserRole.EMPLOYER && userRole !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Only employers and super admins can search job seekers'
      });
    }

    const {
      skills,
      location,
      jobType,
      experienceLevel,
      availability,
      page = 1,
      limit = 10
    } = req.query;

    let profiles: any[] = [];

    // Search by skills
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      profiles = await JobSeekerProfile.findBySkills(skillsArray as string[]);
    }
    // Search by location
    else if (location) {
      profiles = await JobSeekerProfile.findByLocation(location as string);
    }
    // Search by job type
    else if (jobType && Object.values(JobType).includes(jobType as JobType)) {
      profiles = await JobSeekerProfile.findByJobType(jobType as JobType);
    }
    // Get available candidates
    else if (availability === 'true') {
      profiles = await JobSeekerProfile.findAvailableCandidates();
    }
    // Get all profiles
    else {
      profiles = await JobSeekerProfile.find()
        .populate('user', 'firstName lastName email avatar')
        .populate('certifications')
        .sort({ createdAt: -1 });
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    const paginatedProfiles = profiles.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      data: paginatedProfiles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: profiles.length,
        pages: Math.ceil(profiles.length / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to search job seekers',
      message: error.message
    });
  }
};

// Get students by education level (Admin access)
export const getStudentsByEducationLevel = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Only admins can access this endpoint'
      });
    }

    const { educationLevel } = req.params;

    if (!Object.values(EducationLevel).includes(educationLevel as EducationLevel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid education level'
      });
    }

    const students = await StudentProfile.findByEducationLevel(educationLevel as EducationLevel);

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students',
      message: error.message
    });
  }
};

// Get eligible students for jobs
export const getEligibleStudents = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN && userRole !== UserRole.EMPLOYER) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const students = await StudentProfile.findEligibleForJobs();

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch eligible students',
      message: error.message
    });
  }
};

// Update student completed courses (called when course is completed)
export const updateStudentCompletedCourses = async (userId: string, courseId: string) => {
  try {
    const profile = await StudentProfile.findOne({ user: userId });
    if (profile && !profile.completedCourses.includes(courseId)) {
      profile.completedCourses.push(courseId);
      await profile.save();
    }
  } catch (error) {
    console.error('Failed to update student completed courses:', error);
  }
};

// Add certificate to profiles (called when certificate is issued)
export const addCertificateToProfile = async (userId: string, certificateId: string) => {
  try {
    // Add to job seeker profile if exists
    const jobSeekerProfile = await JobSeekerProfile.findOne({ user: userId });
    if (jobSeekerProfile && !jobSeekerProfile.certifications.includes(certificateId)) {
      jobSeekerProfile.certifications.push(certificateId);
      await jobSeekerProfile.save();
    }

    // Add to student profile if exists
    const studentProfile = await StudentProfile.findOne({ user: userId });
    if (studentProfile && !studentProfile.certificates.includes(certificateId)) {
      studentProfile.certificates.push(certificateId);
      await studentProfile.save();
    }
  } catch (error) {
    console.error('Failed to add certificate to profile:', error);
  }
};