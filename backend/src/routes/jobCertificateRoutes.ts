import express from 'express';
import { auth } from '@/middleware/auth';
import {
  issueCertificate,
  autoIssueCertificate,
  getUserCertificates,
  verifyCertificate,
  getCertificatesByType,
  getValidCertificates,
  updateCertificate,
  revokeCertificate
} from '@/controllers/jobCertificateController';

const router = express.Router();

// Public routes
router.get('/verify/:verificationCode', verifyCertificate);
router.get('/valid', getValidCertificates);
router.get('/type/:type', getCertificatesByType);

// Protected routes
router.use(auth);

// Admin routes
router.post('/issue', issueCertificate);
router.put('/:certificateId', updateCertificate);
router.put('/:certificateId/revoke', revokeCertificate);

// User routes
router.post('/auto-issue/:jobId', autoIssueCertificate);
router.get('/my-certificates', getUserCertificates);

export default router;