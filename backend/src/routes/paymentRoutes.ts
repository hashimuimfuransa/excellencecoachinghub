import express from 'express';
import { 
  getTestLevels, 
  getPaymentMethods,
  purchaseTestLevel,
  getUserPurchases,
  validateTestAccess,
  generatePsychometricTest,
  startPsychometricTest,
  submitPsychometricTest
} from '../controllers/paymentController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Log all requests to payment routes
router.use((req, res, next) => {
  console.log(`🔍 Payment Route: ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Test endpoint to debug auth issues
router.get('/debug', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment routes debug endpoint - no auth required',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Additional test endpoint for test levels without any other dependencies
router.get('/test-levels-simple', (req, res) => {
  console.log('🚀 Simple test levels endpoint hit');
  res.status(200).json({
    success: true,
    data: [
      { id: 'easy', name: 'Easy Level', price: 2000 },
      { id: 'intermediate', name: 'Intermediate Level', price: 3500 },
      { id: 'hard', name: 'Hard Level', price: 5000 }
    ],
    message: 'Simple test levels endpoint working'
  });
});

// Public routes - no authentication required
router.get('/test-levels', getTestLevels);
router.get('/methods', getPaymentMethods);

// Protected routes - authentication required
router.post('/purchase-test-level', auth, purchaseTestLevel);
router.get('/my-purchases', auth, getUserPurchases);
router.post('/validate-test-access', auth, validateTestAccess);

// Test generation and management routes
router.post('/generate-test', auth, generatePsychometricTest);
router.post('/start-test', auth, startPsychometricTest);
router.post('/submit-test', auth, submitPsychometricTest);

export default router;