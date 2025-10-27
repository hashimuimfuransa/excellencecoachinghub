import { Request, Response } from 'express';
import { TestPurchase, PsychometricTest } from '../models';

// Payment methods for Rwanda
const PAYMENT_METHODS = [
  {
    id: 'momo',
    name: 'MTN Mobile Money',
    icon: '📱',
    available: true,
    processingTime: 'Instant'
  },
  {
    id: 'airtel_money',
    name: 'Airtel Money', 
    icon: '💰',
    available: true,
    processingTime: 'Instant'
  },
  {
    id: 'bank_card',
    name: 'Bank Card',
    icon: '💳',
    available: true,
    processingTime: '2-5 minutes'
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    icon: '🏦',
    available: true,
    processingTime: '5-10 minutes'
  }
];

// Simplified test levels with pricing
const TEST_LEVELS = [
  {
    id: 'easy',
    name: 'Easy Level',
    description: 'Basic assessment with 15 questions',
    price: 2000, // 2,000 RWF
    currency: 'RWF',
    features: {
      questionCount: 15,
      timeLimit: 20, // minutes
      attempts: 2,
      validityDays: 7,
      detailedReports: false
    }
  },
  {
    id: 'intermediate',
    name: 'Intermediate Level',
    description: 'Comprehensive assessment with 25 questions',
    price: 3500, // 3,500 RWF
    currency: 'RWF',
    features: {
      questionCount: 25,
      timeLimit: 35, // minutes
      attempts: 2,
      validityDays: 15,
      detailedReports: true
    }
  },
  {
    id: 'hard',
    name: 'Hard Level',
    description: 'Advanced assessment with 35 questions',
    price: 5000, // 5,000 RWF
    currency: 'RWF',
    features: {
      questionCount: 35,
      timeLimit: 50, // minutes
      attempts: 3,
      validityDays: 30,
      detailedReports: true
    }
  }
];

/**
 * @desc Get available test levels
 * @route GET /api/payments/test-levels
 * @access Public
 */
export const getTestLevels = async (req: Request, res: Response) => {
  try {
    console.log('🎯 getTestLevels called - should be public endpoint');
    console.log('Request headers:', req.headers);
    
    res.status(200).json({
      success: true,
      data: TEST_LEVELS,
      message: 'Test levels retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching test levels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test levels'
    });
  }
};

/**
 * @desc Get payment methods
 * @route GET /api/payments/methods
 * @access Public
 */
export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: PAYMENT_METHODS.filter(method => method.available),
      message: 'Payment methods retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment methods'
    });
  }
};

/**
 * @desc Purchase test level access
 * @route POST /api/payments/purchase-test-level
 * @access Private
 */
export const purchaseTestLevel = async (req: Request, res: Response) => {
  try {
    const { 
      levelId, 
      paymentMethodId
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validate level
    const testLevel = TEST_LEVELS.find(level => level.id === levelId);
    if (!testLevel) {
      return res.status(404).json({
        success: false,
        error: 'Test level not found'
      });
    }

    // Validate payment method
    const paymentMethod = PAYMENT_METHODS.find(method => method.id === paymentMethodId);
    if (!paymentMethod || !paymentMethod.available) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or unavailable payment method'
      });
    }

    // Create purchase record
    const purchase = await TestPurchase.create({
      user: userId,
      testLevel: levelId,
      levelName: testLevel.name,
      amount: testLevel.price,
      currency: testLevel.currency,
      paymentMethod: paymentMethodId,
      features: testLevel.features,
      status: 'completed', // Simplified - assume payment is successful
      transactionId: `TXN_${Date.now()}_${userId}`,
      purchasedAt: new Date(),
      expiresAt: new Date(Date.now() + testLevel.features.validityDays * 24 * 60 * 60 * 1000)
    });

    res.status(201).json({
      success: true,
      data: {
        purchaseId: purchase._id,
        testLevel: testLevel,
        transactionId: purchase.transactionId,
        expiresAt: purchase.expiresAt,
        features: testLevel.features
      },
      message: 'Test level purchased successfully! You can now take psychometric tests.'
    });

  } catch (error: any) {
    console.error('Error purchasing test level:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process purchase'
    });
  }
};

/**
 * @desc Get user's purchased test levels
 * @route GET /api/payments/my-purchases
 * @access Private
 */
export const getUserPurchases = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const purchases = await TestPurchase.find({ 
      user: userId,
      status: 'completed'
    }).sort({ purchasedAt: -1 });

    // Add test level details to each purchase
    const purchasesWithDetails = purchases.map(purchase => {
      const testLevel = TEST_LEVELS.find(level => level.id === purchase.testLevel);
      return {
        ...purchase.toObject(),
        testLevelDetails: testLevel,
        isActive: purchase.expiresAt > new Date()
      };
    });

    res.status(200).json({
      success: true,
      data: purchasesWithDetails,
      message: 'User purchases retrieved successfully'
    });

  } catch (error: any) {
    console.error('Error fetching user purchases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch purchases'
    });
  }
};

/**
 * @desc Check if user has access to a test level
 * @route POST /api/payments/validate-test-access
 * @access Private
 */
export const validateTestAccess = async (req: Request, res: Response) => {
  try {
    const { levelId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Find active purchase for this level
    const activePurchase = await TestPurchase.findOne({
      user: userId,
      testLevel: levelId,
      status: 'completed',
      expiresAt: { $gt: new Date() }
    }).sort({ purchasedAt: -1 });

    if (!activePurchase) {
      return res.status(403).json({
        success: false,
        error: 'No active purchase found for this test level',
        hasAccess: false
      });
    }

    const testLevel = TEST_LEVELS.find(level => level.id === levelId);

    res.status(200).json({
      success: true,
      hasAccess: true,
      data: {
        purchaseId: activePurchase._id,
        testLevel: testLevel,
        expiresAt: activePurchase.expiresAt,
        features: activePurchase.features,
        attemptsRemaining: activePurchase.features.attempts
      },
      message: 'User has valid access to this test level'
    });

  } catch (error: any) {
    console.error('Error validating test access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate test access'
    });
  }
};

/**
 * @desc Generate a psychometric test without requiring payment (for now)
 * @route POST /api/payments/generate-test
 * @access Private
 */
export const generatePsychometricTest = async (req: Request, res: Response) => {
  try {
    const { jobId, levelId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!jobId || !levelId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID and Level ID are required'
      });
    }

    // For now, skip payment validation and generate test directly
    // TODO: Add payment validation later
    
    // Generate a unique test session ID
    const testSessionId = `test_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Generated test session:', testSessionId, 'for job:', jobId, 'level:', levelId);

    res.status(200).json({
      success: true,
      data: {
        testSessionId,
        jobId,
        levelId,
        createdAt: new Date().toISOString()
      },
      message: 'Test session created successfully'
    });

  } catch (error: any) {
    console.error('Error generating psychometric test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test'
    });
  }
};

/**
 * @desc Start a psychometric test session
 * @route POST /api/payments/start-test
 * @access Private
 */
export const startPsychometricTest = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // For now, generate sample questions instead of using AI
    // TODO: Integrate with AI service later
    const sampleQuestions = [
      {
        id: 1,
        question: "How do you typically approach solving complex problems?",
        options: [
          "Break it down into smaller, manageable parts",
          "Seek input from colleagues and experts",
          "Research similar problems and solutions",
          "Try different approaches until one works"
        ],
        category: "Problem Solving",
        type: "single_choice"
      },
      {
        id: 2,
        question: "When working in a team, you prefer to:",
        options: [
          "Take on a leadership role",
          "Support and collaborate with others",
          "Focus on specific technical tasks",
          "Facilitate communication between team members"
        ],
        category: "Teamwork",
        type: "single_choice"
      },
      {
        id: 3,
        question: "How do you handle tight deadlines?",
        options: [
          "Create a detailed plan and prioritize tasks",
          "Work extra hours to meet the deadline",
          "Delegate tasks to team members",
          "Request additional time if needed"
        ],
        category: "Time Management",
        type: "single_choice"
      },
      {
        id: 4,
        question: "What motivates you most at work?",
        options: [
          "Achieving challenging goals",
          "Recognition from peers and supervisors",
          "Learning new skills and knowledge",
          "Contributing to meaningful projects"
        ],
        category: "Motivation",
        type: "single_choice"
      },
      {
        id: 5,
        question: "How do you prefer to communicate important information?",
        options: [
          "Face-to-face meetings",
          "Written reports or emails",
          "Presentations to groups",
          "One-on-one discussions"
        ],
        category: "Communication",
        type: "single_choice"
      }
    ];

    const testData = {
      sessionId,
      questions: sampleQuestions,
      timeLimit: 15, // 15 minutes
      startedAt: new Date().toISOString(),
      totalQuestions: sampleQuestions.length
    };

    res.status(200).json({
      success: true,
      data: testData,
      message: 'Test started successfully'
    });

  } catch (error: any) {
    console.error('Error starting psychometric test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start test'
    });
  }
};

/**
 * @desc Submit psychometric test answers
 * @route POST /api/payments/submit-test
 * @access Private
 */
export const submitPsychometricTest = async (req: Request, res: Response) => {
  try {
    const { sessionId, answers } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!sessionId || !answers) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and answers are required'
      });
    }

    // For now, generate a simple score based on answers
    // TODO: Integrate with AI analysis later
    const totalQuestions = Object.keys(answers).length;
    const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
    
    const result = {
      sessionId,
      score,
      totalQuestions,
      completedAt: new Date().toISOString(),
      analysis: {
        strengths: ['Problem Solving', 'Communication', 'Teamwork'],
        areasForImprovement: ['Time Management', 'Leadership'],
        recommendations: [
          'Consider developing leadership skills through mentoring opportunities',
          'Practice time management techniques like the Pomodoro method',
          'Continue leveraging your strong problem-solving abilities'
        ]
      }
    };

    res.status(200).json({
      success: true,
      data: result,
      message: 'Test submitted successfully'
    });

  } catch (error: any) {
    console.error('Error submitting psychometric test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit test'
    });
  }
};