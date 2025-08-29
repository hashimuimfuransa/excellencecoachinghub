import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { Company, User, Job } from '../models';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// @desc    Get company suggestions
// @route   GET /api/companies/suggestions
// @access  Private
router.get('/suggestions', protect, asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const userId = req.user!._id.toString();

  const suggestions = await Company.findSuggestions(userId, limit);

  res.status(200).json({
    success: true,
    data: suggestions
  });
}));

// @desc    Follow/Unfollow company
// @route   POST /api/companies/:id/follow
// @access  Private
router.post('/:id/follow', protect, asyncHandler(async (req: Request, res: Response) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    res.status(404).json({
      success: false,
      error: 'Company not found'
    });
    return;
  }

  const userId = req.user!._id.toString();
  const followerIndex = company.followers.indexOf(userId);

  if (followerIndex > -1) {
    // Unfollow the company
    company.followers.splice(followerIndex, 1);
    company.followersCount = Math.max(0, company.followersCount - 1);
  } else {
    // Follow the company
    company.followers.push(userId);
    company.followersCount += 1;
  }

  await company.save();

  res.status(200).json({
    success: true,
    data: {
      following: followerIndex === -1,
      followersCount: company.followersCount
    },
    message: followerIndex === -1 ? 'Company followed' : 'Company unfollowed'
  });
}));

// @desc    Get all companies with pagination
// @route   GET /api/companies
// @access  Private
router.get('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const industry = req.query.industry as string;

  let query: any = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (industry) {
    query.industry = industry;
  }

  const companies = await Company.find(query)
    .select('name description industry location size followersCount jobsCount logo isVerified')
    .sort({ isVerified: -1, followersCount: -1 })
    .skip(skip)
    .limit(limit);

  const totalCompanies = await Company.countDocuments(query);

  res.status(200).json({
    success: true,
    data: companies,
    pagination: {
      page,
      limit,
      total: totalCompanies,
      pages: Math.ceil(totalCompanies / limit)
    }
  });
}));

// @desc    Get single company details
// @route   GET /api/companies/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    res.status(404).json({
      success: false,
      error: 'Company not found'
    });
    return;
  }

  // Get company's recent jobs
  const recentJobs = await Job.find({ 
    company: company.name,
    status: 'active'
  })
  .select('title location jobType experienceLevel applicationDeadline')
  .sort({ createdAt: -1 })
  .limit(5);

  // Check if current user follows this company
  const isFollowing = company.followers.includes(req.user!._id.toString());

  res.status(200).json({
    success: true,
    data: {
      ...company.toJSON(),
      recentJobs,
      isFollowing
    }
  });
}));

// @desc    Create new company (Admin only)
// @route   POST /api/companies
// @access  Private (Admin)
router.post('/', protect, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin or employer
  if (!['admin', 'employer'].includes(req.user!.role)) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to create companies'
    });
    return;
  }

  const {
    name,
    description,
    industry,
    website,
    location,
    size,
    founded,
    logo,
    socialLinks
  } = req.body;

  // Check if company already exists
  const existingCompany = await Company.findOne({ name });
  if (existingCompany) {
    res.status(400).json({
      success: false,
      error: 'Company with this name already exists'
    });
    return;
  }

  const company = await Company.create({
    name,
    description,
    industry,
    website,
    location,
    size,
    founded,
    logo,
    socialLinks
  });

  res.status(201).json({
    success: true,
    data: company,
    message: 'Company created successfully'
  });
}));

// @desc    Update company (Admin or company employees only)
// @route   PUT /api/companies/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    res.status(404).json({
      success: false,
      error: 'Company not found'
    });
    return;
  }

  // Check authorization
  const isAdmin = req.user!.role === 'admin';
  const isEmployee = company.employees.includes(req.user!._id.toString());

  if (!isAdmin && !isEmployee) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to update this company'
    });
    return;
  }

  const updatedCompany = await Company.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedCompany,
    message: 'Company updated successfully'
  });
}));

// @desc    Get companies by industry
// @route   GET /api/companies/industry/:industry
// @access  Private
router.get('/industry/:industry', protect, asyncHandler(async (req: Request, res: Response) => {
  const companies = await Company.findByIndustry(req.params.industry);

  res.status(200).json({
    success: true,
    data: companies
  });
}));

// @desc    Get companies followed by user
// @route   GET /api/companies/following
// @access  Private
router.get('/following', protect, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();

  const companies = await Company.find({
    followers: userId
  })
  .select('name description industry location followersCount jobsCount logo isVerified')
  .sort({ followersCount: -1 });

  res.status(200).json({
    success: true,
    data: companies
  });
}));

export default router;