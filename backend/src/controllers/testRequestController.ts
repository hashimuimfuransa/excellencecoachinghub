import { Request, Response } from 'express';
import { TestRequest } from '@/models/TestRequest';
import { GeneratedPsychometricTest } from '@/models/GeneratedPsychometricTest';
import { AIInterview } from '@/models/AIInterview';
import { Job } from '@/models/Job';
import { User } from '@/models/User';
import { generateJobSpecificTest } from '@/controllers/psychometricTestController';
import { generateQuestions } from '@/controllers/aiInterviewController';
import { notificationService } from '@/services/notificationService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

// Create a test request
export const createTestRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      jobId, 
      requestType, 
      notes, 
      priority = 'normal',
      title,
      description,
      specifications 
    } = req.body;
    const userId = req.user?.id;

    if (!jobId || !requestType) {
      return res.status(400).json({
        success: false,
        error: 'Job ID and request type are required'
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check for existing pending or approved request
    const existingRequest = await TestRequest.findOne({
      user: userId,
      job: jobId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending or approved request for this job'
      });
    }

    // Set default title and description if not provided
    const defaultTitle = title || `${requestType === 'interview' ? 'AI Interview' : requestType === 'psychometric_test' ? 'Psychometric Test' : 'AI Assessment'} Request for ${job.title}`;
    const defaultDescription = description || `Request for ${requestType === 'interview' ? 'AI interview practice' : requestType === 'psychometric_test' ? 'psychometric testing' : 'comprehensive testing'} for the ${job.title} position at ${job.company}`;
    
    // Set default specifications for interviews
    const defaultSpecifications = requestType === 'interview' || requestType === 'both' ? {
      interviewType: specifications?.interviewType || 'Technical + Behavioral',
      duration: specifications?.duration || 30,
      questionCount: specifications?.questionCount || 10,
      difficulty: specifications?.difficulty || 'medium',
      focusAreas: specifications?.focusAreas || ['Problem Solving', 'Communication', 'Technical Skills']
    } : specifications;

    const testRequest = new TestRequest({
      user: userId,
      job: jobId,
      requestType,
      notes,
      priority,
      title: defaultTitle,
      description: defaultDescription,
      specifications: defaultSpecifications
    });

    await testRequest.save();
    await testRequest.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'job', select: 'title company' }
    ]);

    // Notify super admins
    const superAdmins = await User.find({ role: 'super_admin' });
    for (const admin of superAdmins) {
      await notificationService.sendNotification(admin._id.toString(), {
        type: 'test_request_created',
        title: 'New Test Request',
        message: `${testRequest.user.firstName} ${testRequest.user.lastName} requested ${requestType.replace('_', ' ')} for ${testRequest.job.title}`,
        data: { requestId: testRequest._id.toString() }
      });
    }

    res.status(201).json({
      success: true,
      data: testRequest
    });

  } catch (error) {
    console.error('Error creating test request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test request'
    });
  }
};

// Get user's test requests
export const getUserTestRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const requests = await TestRequest.findByUser(userId);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error fetching user test requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test requests'
    });
  }
};

// Get approved tests for user
export const getApprovedTestsForUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const approvedRequests = await TestRequest.findApprovedForUser(userId);

    res.json({
      success: true,
      data: approvedRequests
    });

  } catch (error) {
    console.error('Error fetching approved tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approved tests'
    });
  }
};

// Get test request by ID
export const getTestRequestById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const testRequest = await TestRequest.findById(requestId)
      .populate('user', 'firstName lastName email')
      .populate('job', 'title company description requirements')
      .populate('approvedBy', 'firstName lastName email')
      .populate('rejectedBy', 'firstName lastName email');

    if (!testRequest) {
      return res.status(404).json({
        success: false,
        error: 'Test request not found'
      });
    }

    // Check permissions
    if (userRole !== 'super_admin' && testRequest.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: testRequest
    });

  } catch (error) {
    console.error('Error fetching test request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test request'
    });
  }
};

// Get approved requests (Super Admin only)
export const getApprovedRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, requestType, priority } = req.query;
    
    const filter: any = { status: 'approved' };
    
    if (requestType) {
      filter.requestType = requestType;
    }
    
    if (priority) {
      filter.priority = priority;
    }

    const requests = await TestRequest.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('job', 'title company')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ approvedAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await TestRequest.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching approved requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approved requests'
    });
  }
};

// Get pending requests (Super Admin only)
export const getPendingRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, requestType, priority } = req.query;
    
    const filter: any = { status: 'pending' };
    
    if (requestType) {
      filter.requestType = requestType;
    }
    
    if (priority) {
      filter.priority = priority;
    }

    const requests = await TestRequest.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('job', 'title company')
      .sort({ priority: -1, requestedAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await TestRequest.countDocuments(filter);

    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending requests'
    });
  }
};

// Update test request status (Super Admin only)
export const updateTestRequestStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user?.id;

    const testRequest = await TestRequest.findById(requestId);
    if (!testRequest) {
      return res.status(404).json({
        success: false,
        error: 'Test request not found'
      });
    }

    if (testRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Can only update pending requests'
      });
    }

    testRequest.status = status;
    
    if (status === 'approved') {
      testRequest.approvedBy = adminId;
      testRequest.approvedAt = new Date();
    } else if (status === 'rejected') {
      testRequest.rejectedBy = adminId;
      testRequest.rejectedAt = new Date();
      testRequest.rejectionReason = rejectionReason;
    }

    await testRequest.save();
    await testRequest.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'job', select: 'title company' }
    ]);

    // Notify user
    const notificationTitle = status === 'approved' ? 'Test Request Approved' : 'Test Request Rejected';
    const notificationMessage = status === 'approved' 
      ? `Your test request for ${testRequest.job.title} has been approved!`
      : `Your test request for ${testRequest.job.title} has been rejected. ${rejectionReason || ''}`;

    await notificationService.sendNotification(testRequest.user._id.toString(), {
      type: `test_request_${status}`,
      title: notificationTitle,
      message: notificationMessage,
      data: { requestId: testRequest._id.toString() }
    });

    res.json({
      success: true,
      data: testRequest
    });

  } catch (error) {
    console.error('Error updating test request status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update test request status'
    });
  }
};

// Generate requested tests (Super Admin only)
export const generateRequestedTests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    
    const testRequest = await TestRequest.findById(requestId)
      .populate('user', 'firstName lastName email')
      .populate('job', 'title company description requirements');

    if (!testRequest) {
      return res.status(404).json({
        success: false,
        error: 'Test request not found'
      });
    }

    if (testRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Can only generate tests for approved requests'
      });
    }

    const results: any = {};

    // Generate psychometric test if requested
    if (['psychometric_test', 'both'].includes(testRequest.requestType)) {
      try {
        // Mock request object for psychometric test generation
        const mockReq = {
          user: { id: testRequest.user._id.toString() },
          body: {
            jobId: testRequest.job._id.toString(),
            difficulty: 'moderate',
            testType: 'comprehensive'
          }
        } as any;

        const mockRes = {
          json: (data: any) => data,
          status: (code: number) => ({ json: (data: any) => data })
        } as any;

        const testResult = await generateJobSpecificTest(mockReq, mockRes);
        
        if (testResult.success) {
          testRequest.psychometricTest = {
            testId: testResult.data.testId,
            generatedAt: new Date(),
            isGenerated: true
          };
          results.psychometricTest = testResult.data;
        }
      } catch (error) {
        console.error('Error generating psychometric test:', error);
        results.psychometricTestError = 'Failed to generate psychometric test';
      }
    }

    // Generate interview questions if requested
    if (['interview', 'both'].includes(testRequest.requestType)) {
      try {
        // Mock request object for interview generation
        const mockReq = {
          user: { id: testRequest.user._id.toString() },
          body: {
            jobId: testRequest.job._id.toString(),
            type: 'comprehensive',
            difficulty: 'moderate'
          }
        } as any;

        const mockRes = {
          json: (data: any) => data,
          status: (code: number) => ({ json: (data: any) => data })
        } as any;

        const interviewResult = await generateQuestions(mockReq, mockRes);
        
        if (interviewResult.success) {
          testRequest.interview = {
            interviewId: interviewResult.data.interviewId || `interview_${Date.now()}`,
            generatedAt: new Date(),
            isGenerated: true
          };
          results.interview = interviewResult.data;
        }
      } catch (error) {
        console.error('Error generating interview questions:', error);
        results.interviewError = 'Failed to generate interview questions';
      }
    }

    await testRequest.save();

    // Notify user that tests are ready
    await notificationService.sendNotification(testRequest.user._id.toString(), {
      type: 'tests_generated',
      title: 'Tests Generated',
      message: `Your ${testRequest.requestType.replace('_', ' ')} for ${testRequest.job.title} is now ready!`,
      data: { requestId: testRequest._id.toString() }
    });

    res.json({
      success: true,
      data: {
        testRequest,
        generatedTests: results
      }
    });

  } catch (error) {
    console.error('Error generating requested tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate requested tests'
    });
  }
};

// Complete test request (User)
export const completeTestRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { testResults } = req.body;
    const userId = req.user?.id;

    const testRequest = await TestRequest.findById(requestId);
    if (!testRequest) {
      return res.status(404).json({
        success: false,
        error: 'Test request not found'
      });
    }

    if (testRequest.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (testRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Can only complete approved requests'
      });
    }

    testRequest.status = 'completed';
    testRequest.completedAt = new Date();
    testRequest.testResults = testResults;

    await testRequest.save();

    res.json({
      success: true,
      data: testRequest
    });

  } catch (error) {
    console.error('Error completing test request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete test request'
    });
  }
};