import { Request, Response } from 'express';
import { Internship, JobApplication, JobCourseMatch, StudentProfile, User } from '../models';
import { JobStatus, UserRole, EducationLevel } from '../types';
import { AuthRequest } from '../middleware/auth';

// Get all internships with filtering
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

    const query: any = {};

    // Build filter query
    if (status) query.status = status;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (educationLevel) query.educationLevel = educationLevel;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (workArrangement) query.workArrangement = workArrangement;
    if (department) query.department = { $regex: department, $options: 'i' };
    if (isPaid !== undefined) query.isPaid = isPaid === 'true';
    if (isCurated !== undefined) query.isCurated = isCurated === 'true';
    
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query.skills = { $in: skillsArray };
    }

    // Search functionality - use text search for better performance
    if (search) {
      query.$text = { $search: search };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let internshipQuery = Internship.find(query)
      .populate('employer', 'firstName lastName company email phone')
      .skip(skip)
      .limit(limitNum);

    // If searching by text, sort by text search score
    if (search) {
      internshipQuery = internshipQuery.sort({ score: { $meta: 'textScore' } });
    } else {
      // Default sort by creation date
      internshipQuery = internshipQuery.sort({ createdAt: -1 });
    }

    const internships = await internshipQuery;
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
    
    const query: any = { employer: userId };
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

    const internship = await Internship.findOne({ _id: id, employer: userId });
    
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
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const internship = await Internship.findOneAndDelete({ _id: id, employer: userId });
    
    if (!internship) {
      return res.status(404).json({
        success: false,
        error: 'Internship not found or not authorized'
      });
    }

    // Also delete associated applications
    await JobApplication.deleteMany({ jobId: id });

    res.status(200).json({
      success: true,
      message: 'Internship deleted successfully'
    });
  } catch (error: any) {
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

    const query: any = { status: JobStatus.ACTIVE };

    // Add filters based on query parameters
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (educationLevel) query.educationLevel = educationLevel;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (isPaid !== undefined) query.isPaid = isPaid === 'true';
    if (workArrangement) query.workArrangement = workArrangement;
    if (department) query.department = { $regex: department, $options: 'i' };

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query.skills = { $in: skillsArray };
    }

    // If no filters are provided, try to match based on user's profile
    if (!experienceLevel && !educationLevel && !skills && studentProfile) {
      if (studentProfile.skills && studentProfile.skills.length > 0) {
        query.skills = { $in: studentProfile.skills };
      }
      if (user?.educationLevel) {
        query.educationLevel = user.educationLevel;
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const internships = await Internship.find(query)
      .populate('employer', 'firstName lastName company email phone profileImage')
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

// Get curated internships
export const getCuratedInternships = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const internships = await Internship.findCuratedInternships()
      .skip(skip)
      .limit(limitNum);

    const total = await Internship.countDocuments({ 
      isCurated: true, 
      status: JobStatus.ACTIVE 
    });

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
      error: 'Failed to fetch curated internships',
      message: error.message
    });
  }
};

// Get internship categories/departments
export const getInternshipCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Internship.aggregate([
      { $match: { status: JobStatus.ACTIVE } },
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