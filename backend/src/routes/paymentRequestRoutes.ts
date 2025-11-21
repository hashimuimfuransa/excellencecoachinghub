import express from 'express';
import PaymentRequest from '../models/PaymentRequest';
import { protect, authorize } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { UserRole } from '../types';
import { notificationService } from '../services/notificationService';

const router = express.Router();

// Validation middleware for creating payment requests
const validatePaymentRequest = [
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('jobTitle').notEmpty().withMessage('Job title is required'),
  body('company').notEmpty().withMessage('Company name is required'),
  body('testType').optional().isString(),
  body('questionCount').optional().isInt({ min: 1 }),
  body('estimatedDuration').optional().isInt({ min: 1 })
];

// Create a new payment request
router.post('/', protect, validatePaymentRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      jobId,
      jobTitle,
      company,
      testType = 'Premium Psychometric Assessment',
      questionCount = 20,
      estimatedDuration = 30
    } = req.body;

    // Check if user already has a pending request for this job
    // Allow new requests if previous one is completed
    const existingRequest = await PaymentRequest.findOne({
      userId: req.user._id,
      jobId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending request for this job. Please wait for admin approval.'
      });
    }

    const paymentRequest = new PaymentRequest({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      jobId,
      jobTitle,
      company,
      testType,
      questionCount,
      estimatedDuration,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    });

    await paymentRequest.save();

    res.status(201).json({
      success: true,
      data: paymentRequest,
      message: 'Payment request submitted successfully'
    });

  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment request',
      error: error.message
    });
  }
});

// Get user's payment requests
router.get('/my-requests', protect, async (req, res) => {
  try {
    const paymentRequests = await PaymentRequest.find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: paymentRequests
    });

  } catch (error) {
    console.error('Error fetching user payment requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment requests',
      error: error.message
    });
  }
});

// Check payment status for a specific job
router.get('/check-status/:jobId', protect, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id;

    const paymentRequest = await PaymentRequest.findOne({
      userId,
      jobId,
      status: { $in: ['approved', 'completed'] }
    });

    res.json({
      success: true,
      data: {
        hasApprovedPayment: !!paymentRequest,
        canTakeTest: paymentRequest?.status === 'approved',
        paymentRequest: paymentRequest || null
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
});

// Get all payment requests (Admin only)
router.get('/', protect, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res) => {
  try {
    const { status, testType, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query: any = {};
    if (status) {
      query.status = status;
    }
    if (testType) {
      query.testType = testType;
    }

    const paymentRequests = await PaymentRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await PaymentRequest.countDocuments(query);

    res.json({
      success: true,
      data: paymentRequests,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('Error fetching payment requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment requests',
      error: error.message
    });
  }
});

// Get pending requests count (for admin notifications)
router.get('/pending-count', protect, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res) => {
  try {
    const count = await PaymentRequest.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      data: count
    });

  } catch (error) {
    console.error('Error fetching pending requests count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests count',
      error: error.message
    });
  }
});

// Approve/Reject payment request (Admin only)
router.put('/:requestId/status', protect, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNotes, paymentAmount, paymentMethod } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    const updateData: any = {
      status,
      adminNotes,
      approvedBy: req.user._id
    };

    if (status === 'approved') {
      updateData.approvedAt = new Date().toISOString();
      if (paymentAmount) updateData.paymentAmount = paymentAmount;
      if (paymentMethod) updateData.paymentMethod = paymentMethod;
    }

    const paymentRequest = await PaymentRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    );

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    // Send notification to user about the approval/rejection
    try {
      await notificationService.sendPaymentApprovalNotification(
        paymentRequest.userId.toString(),
        paymentRequest._id.toString(),
        status as 'approved' | 'rejected',
        paymentRequest.jobTitle,
        paymentRequest.testType,
        adminNotes
      );
      console.log(`✅ Sent ${status} notification to user ${paymentRequest.userEmail}`);
    } catch (notificationError) {
      console.error('❌ Failed to send notification:', notificationError);
      // Don't fail the main request if notification fails
    }

    res.json({
      success: true,
      data: paymentRequest,
      message: `Payment request ${status} successfully`
    });

  } catch (error) {
    console.error('Error updating payment request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment request status',
      error: error.message
    });
  }
});

export default router;