import express from 'express';
import { body } from 'express-validator';
import { protect as auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// In-memory storage for assessment requests (in production, use a database)
interface AssessmentRequest {
  _id: string;
  userId: string;
  jobTitle: string;
  company?: string;
  jobDescription?: string;
  category: string;
  urgency: string;
  additionalRequirements?: string;
  userProfile: {
    firstName: string;
    lastName: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

let assessmentRequests: AssessmentRequest[] = [];
let requestIdCounter = 1;

// Validation middleware
const assessmentRequestValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('jobTitle')
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ max: 200 })
    .withMessage('Job title cannot exceed 200 characters'),
  body('category')
    .isIn(['technical', 'personality', 'cognitive', 'leadership', 'sales', 'creative', 'comprehensive'])
    .withMessage('Invalid assessment category'),
  body('urgency')
    .isIn(['normal', 'high', 'urgent'])
    .withMessage('Invalid urgency level'),
  body('userProfile.firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('userProfile.lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('userProfile.email')
    .isEmail()
    .withMessage('Valid email is required')
];

// Submit assessment request
router.post(
  '/',
  auth,
  assessmentRequestValidation,
  validateRequest,
  async (req, res) => {
    try {
      const {
        userId,
        jobTitle,
        company,
        jobDescription,
        category,
        urgency,
        additionalRequirements,
        userProfile
      } = req.body;

      // Create new assessment request
      const newRequest: AssessmentRequest = {
        _id: `req_${requestIdCounter++}`,
        userId,
        jobTitle,
        company,
        jobDescription,
        category,
        urgency,
        additionalRequirements,
        userProfile,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      assessmentRequests.push(newRequest);

      // In a real implementation, you would:
      // 1. Save to database
      // 2. Send notification to admin
      // 3. Send confirmation email to user
      // 4. Potentially integrate with WhatsApp API to notify admin

      console.log('🎯 New assessment request submitted:', {
        requestId: newRequest._id,
        userId,
        jobTitle,
        category,
        urgency,
        userEmail: userProfile.email
      });

      // Simulate admin notification (in production, send actual notification)
      console.log('📨 [ADMIN NOTIFICATION] New assessment request:', {
        id: newRequest._id,
        user: `${userProfile.firstName} ${userProfile.lastName}`,
        email: userProfile.email,
        jobTitle,
        company,
        category,
        urgency,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Assessment request submitted successfully. Our team will contact you within 2-4 hours.',
        data: {
          requestId: newRequest._id,
          status: newRequest.status,
          estimatedContactTime: urgency === 'urgent' ? '1 hour' : 
                               urgency === 'high' ? '1-2 hours' : 
                               '2-4 hours'
        }
      });

    } catch (error: any) {
      console.error('❌ Error submitting assessment request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit assessment request'
      });
    }
  }
);

// Get user's assessment requests
router.get(
  '/my-requests',
  auth,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      
      const userRequests = assessmentRequests
        .filter(request => request.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      res.json({
        success: true,
        data: userRequests
      });

    } catch (error: any) {
      console.error('❌ Error fetching user assessment requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessment requests'
      });
    }
  }
);

// Get all assessment requests (Admin only)
router.get(
  '/admin/all',
  auth,
  // authorizeRoles(['admin']), // Uncomment when role middleware is needed
  async (req, res) => {
    try {
      const allRequests = assessmentRequests
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      res.json({
        success: true,
        data: allRequests,
        count: allRequests.length
      });

    } catch (error: any) {
      console.error('❌ Error fetching all assessment requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch assessment requests'
      });
    }
  }
);

// Update request status (Admin only)
router.patch(
  '/:requestId/status',
  auth,
  // authorizeRoles(['admin']), // Uncomment when role middleware is needed
  [
    body('status')
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Invalid status')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status } = req.body;

      const requestIndex = assessmentRequests.findIndex(req => req._id === requestId);
      
      if (requestIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Assessment request not found'
        });
      }

      assessmentRequests[requestIndex].status = status;
      assessmentRequests[requestIndex].updatedAt = new Date();

      console.log(`📋 Assessment request ${requestId} status updated to: ${status}`);

      res.json({
        success: true,
        message: `Request status updated to ${status}`,
        data: assessmentRequests[requestIndex]
      });

    } catch (error: any) {
      console.error('❌ Error updating assessment request status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update request status'
      });
    }
  }
);

// Delete assessment request
router.delete(
  '/:requestId',
  auth,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user?.id;

      const requestIndex = assessmentRequests.findIndex(req => 
        req._id === requestId && req.userId === userId
      );
      
      if (requestIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Assessment request not found or unauthorized'
        });
      }

      const deletedRequest = assessmentRequests.splice(requestIndex, 1)[0];

      console.log(`🗑️ Assessment request ${requestId} deleted by user ${userId}`);

      res.json({
        success: true,
        message: 'Assessment request deleted successfully',
        data: deletedRequest
      });

    } catch (error: any) {
      console.error('❌ Error deleting assessment request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete assessment request'
      });
    }
  }
);

export default router;