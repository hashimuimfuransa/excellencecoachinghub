import { Request, Response } from 'express';
import { Internship, Job, JobApplication, JobCourseMatch, StudentProfile, User } from '../models';
import { JobStatus, UserRole, EducationLevel, JobCategory, JobType } from '../types';
import { AuthRequest } from '../middleware/auth';

// Get all internships with filtering (from both Internship model and Job model)
export const getInternships = async (req: Request, res: Response) => {
  try {
    const {
      status,
      experienceLevel,
      educationLevel,
      location,
      workArrangement,
      skills,
      isPaid,
      isCurated,
      department,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // === FETCH FROM INTERNSHIP MODEL ===
    const internshipQuery: any = {};
    if (status) internshipQuery.status = status;
    if (experienceLevel) internshipQuery.experienceLevel = experienceLevel;
    if (educationLevel) internshipQuery.educationLevel = educationLevel;
    if (location) internshipQuery.location = { $regex: location, $options: 'i' };
    if (workArrangement) internshipQuery.workArrangement = workArrangement;
    if (department) internshipQuery.department = { $regex: department, $options: 'i' };
    if (isPaid !== undefined) internshipQuery.isPaid = isPaid === 'true';
    if (isCurated !== undefined) internshipQuery.isCurated = isCurated === 'true';
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      internshipQuery.skills = { $in: skillsArray };
    }
    if (search) {
      internshipQuery.$text = { $search: search };
    }

    // === FETCH FROM JOB MODEL (internship jobs) ===
    const jobQuery: any = {
      $or: [
        { category: JobCategory.INTERNSHIPS },
        { jobType: JobType.INTERNSHIP }
      ]
    };
    
    // Apply the same filters to job query
    if (status) jobQuery.status = status;
    if (experienceLevel) jobQuery.experienceLevel = experienceLevel;
    if (educationLevel) jobQuery.educationLevel = educationLevel;
    if (location) jobQuery.location = { $regex: location, $options: 'i' };
    if (isCurated !== undefined) jobQuery.isCurated = isCurated === 'true';
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      jobQuery.skills = { $in: skillsArray };
    }
    if (search) {
      jobQuery.$text = { $search: search };
    }

    // Execute both queries in parallel
    const [dedicatedInternships, jobInternships] = await Promise.all([
      Internship.find(internshipQuery)
        .populate('employer', 'firstName lastName company email phone')
        .sort({ createdAt: -1 }),
      Job.find(jobQuery)
        .populate('employer', 'firstName lastName company email phone')
        .sort({ createdAt: -1 })
    ]);

    // Transform job internships to match internship format
    const transformedJobInternships = jobInternships.map(job => ({
      _id: job._id,
      title: job.title,
      description: job.description,
      company: job.company,
      employer: job.employer,
      location: job.location,
      department: job.category === JobCategory.INTERNSHIPS ? 'General' : 'Technology', // Default department
      numberOfPositions: 1, // Default value
      applicationProcedure: 'Please apply through the platform',
      internshipPeriod: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        duration: '3 months'
      },
      isPaid: job.salary && job.salary.min > 0,
      stipend: job.salary ? {
        amount: job.salary.min || 0,
        currency: job.salary.currency || 'USD',
        frequency: 'monthly'
      } : undefined,
      expectedStartDate: new Date(),
      expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      experienceLevel: job.experienceLevel,
      educationLevel: job.educationLevel,
      skills: job.skills || [],
      requirements: job.requirements || [],
      responsibilities: job.responsibilities || [],
      benefits: job.benefits || [],
      learningObjectives: [],
      mentorshipProvided: false,
      certificateProvided: false,
      applicationDeadline: job.applicationDeadline,
      postedDate: job.postedDate,
      status: job.status,
      isCurated: job.isCurated,
      curatedBy: job.curatedBy,
      relatedCourses: job.relatedCourses || [],
      psychometricTestRequired: job.psychometricTestRequired || false,
      psychometricTests: job.psychometricTests || [],
      applicationsCount: job.applicationsCount || 0,
      viewsCount: job.viewsCount || 0,
      workArrangement: job.jobType === JobType.INTERNSHIP ? 'on-site' : 'remote',
      contactInfo: job.contactInfo,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      isFromJobModel: true // Flag to indicate source
    }));

    // Combine both sets of internships
    const allInternships = [...dedicatedInternships, ...transformedJobInternships];

    // Sort combined results
    allInternships.sort((a, b) => {
      if (search) {
        // If searching, prioritize dedicated internships
        if (a.isFromJobModel && !b.isFromJobModel) return 1;
        if (!a.isFromJobModel && b.isFromJobModel) return -1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination to combined results
    const paginatedInternships = allInternships.slice(skip, skip + limitNum);
    const total = allInternships.length;

    // Debug logging
    console.log('📊 Combined Internship Database Debug:');
    console.log(`Dedicated internships: ${dedicatedInternships.length}`);
    console.log(`Job-based internships: ${jobInternships.length}`);
    console.log(`Total combined: ${allInternships.length}`);
    console.log(`Returning paginated: ${paginatedInternships.length} (page ${pageNum})`);

    res.status(200).json({
      success: true,
      data: paginatedInternships,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error: any) {
    console.error('Error fetching internships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch internships',
      message: error.message
    });
  }
};

// Get internship by ID
export const getInternshipById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const internship = await Internship.findById(id).populate('employer', 'firstName lastName company email phone profileImage');
    
    if (!internship) {
      return res.status(404).json({
        success: false,
        error: 'Internship not found'
      });
    }

    // Increment view count
    internship.viewsCount += 1;
    await internship.save();

    res.status(200).json({
      success: true,
      data: internship
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch internship',
      message: error.message
    });
  }
};

// Get internships by employer
export const getInternshipsByEmployer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    const query: any = { 
      employer: userId
    };
    if (status) query.status = status;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const internships = await Internship.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Internship.countDocuments(query);

    res.status(200).json({
      success: true,
      data: internships,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch internships',
      message: error.message
    });
  }
};

// Create new internship
export const createInternship = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const internshipData = {
      ...req.body,
      employer: userId
    };

    // Validate expected dates
    if (new Date(internshipData.expectedStartDate) >= new Date(internshipData.expectedEndDate)) {
      return res.status(400).json({
        success: false,
        error: 'Expected end date must be after start date'
      });
    }

    const internship = new Internship(internshipData);
    await internship.save();

    // Populate employer details before sending response
    await internship.populate('employer', 'firstName lastName company email');

    res.status(201).json({
      success: true,
      data: internship,
      message: 'Internship created successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to create internship',
      message: error.message
    });
  }
};

// Update internship
export const updateInternship = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const internship = await Internship.findOne({ 
      _id: id, 
      employer: userId
    });
    
    if (!internship) {
      return res.status(404).json({
        success: false,
        error: 'Internship not found or not authorized'
      });
    }

    Object.assign(internship, req.body);
    await internship.save();

    // Populate employer details before sending response
    await internship.populate('employer', 'firstName lastName company email');

    res.status(200).json({
      success: true,
      data: internship,
      message: 'Internship updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to update internship',
      message: error.message
    });
  }
};

// Delete internship
export const deleteInternship = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    console.log('Delete internship request:', { id, userId });
    
    if (!userId) {
      console.log('User not authenticated for delete request');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // First, find the internship to check if it exists and user owns it
    const existingInternship = await Internship.findById(id);
    console.log('Existing internship:', existingInternship);
    
    if (!existingInternship) {
      console.log('Internship not found:', id);
      return res.status(404).json({
        success: false,
        error: 'Internship not found'
      });
    }
    
    if (existingInternship.employer.toString() !== userId) {
      console.log('User not authorized to delete this internship:', { owner: existingInternship.employer, userId });
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this internship'
      });
    }

    // Delete the internship
    const internship = await Internship.findOneAndDelete({ 
      _id: id, 
      employer: userId
    });
    console.log('Internship deleted:', internship?._id);
    
    // Also delete associated applications
    const deletedApplications = await JobApplication.deleteMany({ jobId: id });
    console.log('Deleted applications count:', deletedApplications.deletedCount);

    res.status(200).json({
      success: true,
      message: 'Internship deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete internship error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete internship',
      message: error.message
    });
  }
};

// Get internships for students with filtering
export const getInternshipsForStudent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const {
      experienceLevel,
      educationLevel,
      skills,
      location,
      isPaid,
      workArrangement,
      department,
      page = 1,
      limit = 10
    } = req.query;

    // Get user's profile to match internships
    const user = await User.findById(userId);
    const studentProfile = await StudentProfile.findOne({ userId });

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // === QUERY FOR INTERNSHIP MODEL ===
    const internshipQuery: any = { 
      status: JobStatus.ACTIVE 
    };

    // Add filters to internship query
    if (experienceLevel) internshipQuery.experienceLevel = experienceLevel;
    if (educationLevel) internshipQuery.educationLevel = educationLevel;
    if (location) internshipQuery.location = { $regex: location, $options: 'i' };
    if (isPaid !== undefined) internshipQuery.isPaid = isPaid === 'true';
    if (workArrangement) internshipQuery.workArrangement = workArrangement;
    if (department) internshipQuery.department = { $regex: department, $options: 'i' };

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      internshipQuery.skills = { $in: skillsArray };
    }

    // === QUERY FOR JOB MODEL (internship jobs) ===
    const jobQuery: any = {
      status: JobStatus.ACTIVE,
      $or: [
        { category: JobCategory.INTERNSHIPS },
        { jobType: JobType.INTERNSHIP }
      ]
    };

    // Add filters to job query
    if (experienceLevel) jobQuery.experienceLevel = experienceLevel;
    if (educationLevel) jobQuery.educationLevel = educationLevel;
    if (location) jobQuery.location = { $regex: location, $options: 'i' };

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      jobQuery.skills = { $in: skillsArray };
    }

    // If no filters are provided, try to match based on user's profile
    if (!experienceLevel && !educationLevel && !skills && studentProfile) {
      if (studentProfile.skills && studentProfile.skills.length > 0) {
        internshipQuery.skills = { $in: studentProfile.skills };
        jobQuery.skills = { $in: studentProfile.skills };
      }
      if (user?.educationLevel) {
        internshipQuery.educationLevel = user.educationLevel;
        jobQuery.educationLevel = user.educationLevel;
      }
    }

    // Execute both queries in parallel
    const [dedicatedInternships, jobInternships] = await Promise.all([
      Internship.find(internshipQuery)
        .populate('employer', 'firstName lastName company email phone profileImage')
        .sort({ createdAt: -1 }),
      Job.find(jobQuery)
        .populate('employer', 'firstName lastName company email phone profileImage')
        .sort({ createdAt: -1 })
    ]);

    // Transform job internships to match internship format
    const transformedJobInternships = jobInternships.map(job => ({
      _id: job._id,
      title: job.title,
      description: job.description,
      company: job.company,
      employer: job.employer,
      location: job.location,
      department: job.category === JobCategory.INTERNSHIPS ? 'General' : 'Technology',
      numberOfPositions: 1,
      applicationProcedure: 'Please apply through the platform',
      internshipPeriod: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        duration: '3 months'
      },
      isPaid: job.salary && job.salary.min > 0,
      stipend: job.salary ? {
        amount: job.salary.min || 0,
        currency: job.salary.currency || 'USD',
        frequency: 'monthly'
      } : undefined,
      expectedStartDate: new Date(),
      expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      experienceLevel: job.experienceLevel,
      educationLevel: job.educationLevel,
      skills: job.skills || [],
      requirements: job.requirements || [],
      responsibilities: job.responsibilities || [],
      benefits: job.benefits || [],
      learningObjectives: [],
      mentorshipProvided: false,
      certificateProvided: false,
      applicationDeadline: job.applicationDeadline,
      postedDate: job.postedDate,
      status: job.status,
      isCurated: job.isCurated,
      curatedBy: job.curatedBy,
      relatedCourses: job.relatedCourses || [],
      psychometricTestRequired: job.psychometricTestRequired || false,
      psychometricTests: job.psychometricTests || [],
      applicationsCount: job.applicationsCount || 0,
      viewsCount: job.viewsCount || 0,
      workArrangement: job.jobType === JobType.INTERNSHIP ? 'on-site' : 'remote',
      contactInfo: job.contactInfo,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      isFromJobModel: true
    }));

    // Combine both sets of internships
    const allInternships = [...dedicatedInternships, ...transformedJobInternships];

    // Sort combined results by creation date
    allInternships.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination to combined results
    const paginatedInternships = allInternships.slice(skip, skip + limitNum);
    const total = allInternships.length;

    console.log(`Student internships - Dedicated: ${dedicatedInternships.length}, Job-based: ${jobInternships.length}, Total: ${total}`);

    res.status(200).json({
      success: true,
      data: paginatedInternships,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error: any) {
    console.error('Error fetching internships for student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch internships for student',
      message: error.message
    });
  }
};

// Get curated internships (from both Internship and Job models)
export const getCuratedInternships = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Fetch curated internships from both models
    const [dedicatedInternships, jobInternships] = await Promise.all([
      Internship.find({ 
        isCurated: true,
        status: JobStatus.ACTIVE,
        $or: [
          { applicationDeadline: { $exists: false } },
          { applicationDeadline: { $gt: new Date() } }
        ]
      }).populate('curatedBy', 'firstName lastName')
        .populate('relatedCourses', 'title description')
        .sort({ createdAt: -1 }),
      Job.find({
        isCurated: true,
        status: JobStatus.ACTIVE,
        $or: [
          { category: JobCategory.INTERNSHIPS },
          { jobType: JobType.INTERNSHIP }
        ]
      }).populate('curatedBy', 'firstName lastName')
        .populate('relatedCourses', 'title description')
        .sort({ createdAt: -1 })
    ]);

    // Transform job internships to match internship format
    const transformedJobInternships = jobInternships.map(job => ({
      _id: job._id,
      title: job.title,
      description: job.description,
      company: job.company,
      employer: job.employer,
      location: job.location,
      department: job.category === JobCategory.INTERNSHIPS ? 'General' : 'Technology',
      numberOfPositions: 1,
      applicationProcedure: 'Please apply through the platform',
      internshipPeriod: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        duration: '3 months'
      },
      isPaid: job.salary && job.salary.min > 0,
      stipend: job.salary ? {
        amount: job.salary.min || 0,
        currency: job.salary.currency || 'USD',
        frequency: 'monthly'
      } : undefined,
      expectedStartDate: new Date(),
      expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      experienceLevel: job.experienceLevel,
      educationLevel: job.educationLevel,
      skills: job.skills || [],
      requirements: job.requirements || [],
      responsibilities: job.responsibilities || [],
      benefits: job.benefits || [],
      learningObjectives: [],
      mentorshipProvided: false,
      certificateProvided: false,
      applicationDeadline: job.applicationDeadline,
      postedDate: job.postedDate,
      status: job.status,
      isCurated: job.isCurated,
      curatedBy: job.curatedBy,
      relatedCourses: job.relatedCourses || [],
      psychometricTestRequired: job.psychometricTestRequired || false,
      psychometricTests: job.psychometricTests || [],
      applicationsCount: job.applicationsCount || 0,
      viewsCount: job.viewsCount || 0,
      workArrangement: job.jobType === JobType.INTERNSHIP ? 'on-site' : 'remote',
      contactInfo: job.contactInfo,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      isFromJobModel: true
    }));

    // Combine and sort by creation date
    const allInternships = [...dedicatedInternships, ...transformedJobInternships];
    allInternships.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedInternships = allInternships.slice(skip, skip + limitNum);
    const total = allInternships.length;

    console.log(`Curated internships - Dedicated: ${dedicatedInternships.length}, Job-based: ${jobInternships.length}, Total: ${total}`);

    res.status(200).json({
      success: true,
      data: paginatedInternships,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error: any) {
    console.error('Error fetching curated internships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch curated internships',
      message: error.message
    });
  }
};

// Get internship categories/departments
export const getInternshipCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Internship.aggregate([
      { $match: { 
        status: JobStatus.ACTIVE 
      }},
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.status(200).json({
      success: true,
      data: categories.map(cat => ({
        name: cat._id,
        count: cat.count
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch internship categories',
      message: error.message
    });
  }
};