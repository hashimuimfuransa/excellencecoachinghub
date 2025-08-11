import express from 'express';
import {
  getAllProviders,
  getActiveProvider,
  switchProvider,
  updateProviderConfig,
  generateToken,
  testProvider,
  initializeProviders,
  getProviderStatus
} from '../controllers/videoProviderController';
import { protect as auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';

const router = express.Router();

// Initialize providers (admin only)
router.post('/initialize', auth, authorizeRoles(['admin']), initializeProviders);

// Get all providers (admin only)
router.get('/all', auth, authorizeRoles(['admin']), getAllProviders);

// Get active provider (all authenticated users)
router.get('/active', auth, getActiveProvider);

// Get provider status (admin only)
router.get('/status', auth, authorizeRoles(['admin']), getProviderStatus);

// Switch active provider (admin only)
router.post('/switch', auth, authorizeRoles(['admin']), switchProvider);

// Update provider configuration (admin only)
router.put('/config', auth, authorizeRoles(['admin']), updateProviderConfig);

// Generate video token (all authenticated users)
router.post('/token', auth, generateToken);

// Test provider connection (admin only)
router.get('/test/:providerName', auth, authorizeRoles(['admin']), testProvider);

export default router;
