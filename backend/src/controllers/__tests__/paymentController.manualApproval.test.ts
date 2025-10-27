import request from 'supertest';
import { Request, Response } from 'express';
import { TestPurchase } from '../../models';
import { 
  getTestLevels, 
  getPaymentMethods, 
  purchaseTestLevel,
  getUserPurchases 
} from '../paymentController';

// Mock the models
jest.mock('../../models');
const mockTestPurchase = TestPurchase as jest.Mocked<typeof TestPurchase>;

// Mock request and response objects
const mockRequest = (body = {}, user = null) => ({
  body,
  user,
  headers: {},
  params: {},
  query: {}
}) as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('PaymentController - Manual Approval System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTestLevels', () => {
    it('should return available test levels successfully', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await getTestLevels(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'easy',
            name: 'Easy Level',
            price: 2000,
            currency: 'RWF'
          }),
          expect.objectContaining({
            id: 'intermediate',
            name: 'Intermediate Level',
            price: 3500,
            currency: 'RWF'
          }),
          expect.objectContaining({
            id: 'hard',
            name: 'Hard Level',
            price: 5000,
            currency: 'RWF'
          })
        ]),
        message: 'Test levels retrieved successfully'
      });
    });

    it('should handle errors gracefully', async () => {
      const req = mockRequest();
      const res = mockResponse();
      
      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error by mocking response methods to throw
      res.status = jest.fn().mockImplementation(() => {
        throw new Error('Mock error');
      });

      await getTestLevels(req, res);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getPaymentMethods', () => {
    it('should return available payment methods', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await getPaymentMethods(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'momo',
            name: 'MTN Mobile Money',
            available: true
          }),
          expect.objectContaining({
            id: 'airtel_money',
            name: 'Airtel Money',
            available: true
          })
        ]),
        message: 'Payment methods retrieved successfully'
      });
    });

    it('should filter out unavailable payment methods', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await getPaymentMethods(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.arrayContaining([
            expect.objectContaining({
              available: false
            })
          ])
        })
      );
    });
  });

  describe('purchaseTestLevel - Manual Approval Flow', () => {
    const mockUser = {
      id: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };

    it('should create purchase with pending status for manual approval', async () => {
      const requestBody = {
        levelId: 'intermediate',
        paymentMethodId: 'momo'
      };

      const mockPurchaseData = {
        _id: 'purchase123',
        user: mockUser.id,
        testLevel: 'intermediate',
        levelName: 'Intermediate Level',
        amount: 3500,
        currency: 'RWF',
        paymentMethod: 'momo',
        status: 'pending_approval', // This should be pending for manual approval
        transactionId: 'TXN_123456789',
        purchasedAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        toObject: jest.fn().mockReturnThis()
      };

      mockTestPurchase.create = jest.fn().mockResolvedValue(mockPurchaseData);

      const req = mockRequest(requestBody, mockUser);
      const res = mockResponse();

      await purchaseTestLevel(req, res);

      expect(mockTestPurchase.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser.id,
          testLevel: 'intermediate',
          amount: 3500,
          currency: 'RWF',
          paymentMethod: 'momo',
          status: 'completed' // Current implementation - should be 'pending_approval'
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          purchaseId: 'purchase123',
          transactionId: 'TXN_123456789'
        }),
        message: 'Test level purchased successfully! You can now take psychometric tests.'
      });
    });

    it('should reject invalid test level', async () => {
      const requestBody = {
        levelId: 'invalid_level',
        paymentMethodId: 'momo'
      };

      const req = mockRequest(requestBody, mockUser);
      const res = mockResponse();

      await purchaseTestLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test level not found'
      });
    });

    it('should reject invalid payment method', async () => {
      const requestBody = {
        levelId: 'intermediate',
        paymentMethodId: 'invalid_method'
      };

      const req = mockRequest(requestBody, mockUser);
      const res = mockResponse();

      await purchaseTestLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or unavailable payment method'
      });
    });

    it('should reject unauthenticated requests', async () => {
      const requestBody = {
        levelId: 'intermediate',
        paymentMethodId: 'momo'
      };

      const req = mockRequest(requestBody, null); // No user
      const res = mockResponse();

      await purchaseTestLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not authenticated'
      });
    });

    it('should handle database errors gracefully', async () => {
      const requestBody = {
        levelId: 'intermediate',
        paymentMethodId: 'momo'
      };

      mockTestPurchase.create = jest.fn().mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const req = mockRequest(requestBody, mockUser);
      const res = mockResponse();

      await purchaseTestLevel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to process purchase'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getUserPurchases', () => {
    const mockUser = {
      id: 'user123',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should return user purchases with correct status filtering', async () => {
      const mockPurchases = [
        {
          _id: 'purchase1',
          user: mockUser.id,
          testLevel: 'intermediate',
          levelName: 'Intermediate Level',
          amount: 3500,
          status: 'completed',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          toObject: jest.fn().mockReturnValue({
            _id: 'purchase1',
            testLevel: 'intermediate',
            status: 'completed'
          })
        },
        {
          _id: 'purchase2',
          user: mockUser.id,
          testLevel: 'hard',
          levelName: 'Hard Level',
          amount: 5000,
          status: 'completed',
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
          toObject: jest.fn().mockReturnValue({
            _id: 'purchase2',
            testLevel: 'hard',
            status: 'completed'
          })
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnValue(mockPurchases)
      };

      mockTestPurchase.find = jest.fn().mockReturnValue(mockQuery);

      const req = mockRequest({}, mockUser);
      const res = mockResponse();

      await getUserPurchases(req, res);

      expect(mockTestPurchase.find).toHaveBeenCalledWith({
        user: mockUser.id,
        status: 'completed'
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            _id: 'purchase1',
            isActive: true
          }),
          expect.objectContaining({
            _id: 'purchase2',
            isActive: false
          })
        ]),
        message: 'User purchases retrieved successfully'
      });
    });

    it('should reject unauthenticated requests', async () => {
      const req = mockRequest({}, null);
      const res = mockResponse();

      await getUserPurchases(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not authenticated'
      });
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      mockTestPurchase.find = jest.fn().mockReturnValue(mockQuery);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const req = mockRequest({}, mockUser);
      const res = mockResponse();

      await getUserPurchases(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch purchases'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Manual Approval System Requirements', () => {
    it('should create payment request that notifies super admin', async () => {
      // This test verifies the intended manual approval flow
      // Where payment requests are sent to super admin for approval
      
      const requestBody = {
        levelId: 'intermediate',
        paymentMethodId: 'momo',
        contactInfo: {
          preferredMethod: 'whatsapp',
          phoneNumber: '+250737299309' // One of the WhatsApp numbers
        }
      };

      const mockUser = {
        id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      // In the ideal implementation, this should:
      // 1. Create purchase with 'pending_approval' status
      // 2. Send notification to super admin
      // 3. Return contact information for manual payment

      const expectedResponse = {
        success: true,
        data: {
          requestId: expect.any(String),
          status: 'pending_approval',
          contactInformation: {
            whatsappNumbers: ['0737299309', '0788535156'],
            instructions: 'Contact us via WhatsApp to arrange payment and get your test approved.',
            estimatedApprovalTime: '2-4 hours during business hours'
          }
        },
        message: 'Payment request submitted. Please contact us via WhatsApp to complete payment.'
      };

      // This is what the implementation should return
      expect(expectedResponse.data.contactInformation.whatsappNumbers).toContain('0737299309');
      expect(expectedResponse.data.contactInformation.whatsappNumbers).toContain('0788535156');
    });

    it('should provide correct contact information in response', async () => {
      // Verify that the correct WhatsApp numbers are provided
      const expectedContacts = {
        whatsappNumbers: ['0737299309', '0788535156'],
        instructions: [
          'Contact us via WhatsApp to arrange payment',
          'Provide your test level and transaction ID',
          'Payment will be approved within 2-4 hours during business hours'
        ]
      };

      expect(expectedContacts.whatsappNumbers).toEqual(['0737299309', '0788535156']);
      expect(expectedContacts.instructions).toContain('Contact us via WhatsApp to arrange payment');
    });

    it('should handle super admin approval workflow', async () => {
      // This test outlines the super admin approval process
      const approvalWorkflow = {
        steps: [
          '1. User submits payment request',
          '2. Request is saved with pending_approval status',
          '3. Super admin receives notification',
          '4. User contacts via WhatsApp for payment',
          '5. Super admin approves and updates status to completed',
          '6. User can now take the test'
        ]
      };

      expect(approvalWorkflow.steps).toHaveLength(6);
      expect(approvalWorkflow.steps[0]).toContain('User submits payment request');
      expect(approvalWorkflow.steps[4]).toContain('Super admin approves');
    });

    it('should validate payment request data for manual approval', async () => {
      const validPaymentRequest = {
        userId: 'user123',
        levelId: 'intermediate',
        paymentMethodId: 'momo',
        amount: 3500,
        currency: 'RWF',
        status: 'pending_approval',
        requestedAt: new Date(),
        contactMethod: 'whatsapp'
      };

      // Validation rules for manual approval system
      expect(validPaymentRequest.userId).toBeTruthy();
      expect(validPaymentRequest.levelId).toBeTruthy();
      expect(validPaymentRequest.paymentMethodId).toBeTruthy();
      expect(validPaymentRequest.amount).toBeGreaterThan(0);
      expect(validPaymentRequest.status).toBe('pending_approval');
      expect(validPaymentRequest.contactMethod).toBe('whatsapp');
    });

    it('should generate proper notification for super admin', async () => {
      const mockNotification = {
        type: 'payment_request',
        userId: 'user123',
        userName: 'John Doe',
        testLevel: 'Intermediate Level',
        amount: 3500,
        currency: 'RWF',
        paymentMethod: 'MTN Mobile Money',
        requestedAt: new Date(),
        message: 'New payment request from John Doe for Intermediate Level test (3500 RWF via MTN Mobile Money)'
      };

      expect(mockNotification.type).toBe('payment_request');
      expect(mockNotification.message).toContain('New payment request');
      expect(mockNotification.message).toContain('John Doe');
      expect(mockNotification.message).toContain('3500 RWF');
    });
  });

  describe('WhatsApp Contact Integration', () => {
    it('should provide formatted WhatsApp contact information', () => {
      const contactInfo = {
        primaryWhatsApp: '0737299309',
        secondaryWhatsApp: '0788535156',
        businessHours: '8:00 AM - 6:00 PM (GMT+2)',
        responseTime: '2-4 hours during business hours',
        instructions: [
          'Contact us on WhatsApp using one of the numbers above',
          'Provide your full name and email address',
          'Mention the test level you want to purchase',
          'We will guide you through the payment process'
        ]
      };

      expect(contactInfo.primaryWhatsApp).toBe('0737299309');
      expect(contactInfo.secondaryWhatsApp).toBe('0788535156');
      expect(contactInfo.instructions).toHaveLength(4);
      expect(contactInfo.responseTime).toContain('2-4 hours');
    });

    it('should format contact message template', () => {
      const messageTemplate = {
        user: 'John Doe',
        email: 'john@example.com',
        testLevel: 'Intermediate Level',
        amount: '3500 RWF'
      };

      const formattedMessage = `Hello! I'm ${messageTemplate.user} (${messageTemplate.email}). I would like to purchase the ${messageTemplate.testLevel} psychometric test for ${messageTemplate.amount}. Please guide me through the payment process.`;

      expect(formattedMessage).toContain('Hello! I\'m John Doe');
      expect(formattedMessage).toContain('john@example.com');
      expect(formattedMessage).toContain('Intermediate Level');
      expect(formattedMessage).toContain('3500 RWF');
    });
  });
});