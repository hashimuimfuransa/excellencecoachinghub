import express from 'express';
import { auth } from '@/middleware/auth';
import {
  startAIInterview,
  submitInterviewResponse,
  completeAIInterview,
  getUserInterviews,
  getJobInterviews,
  getInterviewDetails,
  generateQuestions
} from '@/controllers/aiInterviewController';

const router = express.Router();

// All routes require authentication
router.use(auth);

// User routes
router.post('/generate-questions', generateQuestions);
router.post('/start', startAIInterview);
router.post('/:interviewId/response', submitInterviewResponse);
router.post('/:interviewId/complete', completeAIInterview);
router.get('/my-interviews', getUserInterviews);
router.get('/history', getUserInterviews); // Alias for interview history

// Employer routes
router.get('/job/:jobId', getJobInterviews);

// Shared routes
router.get('/:interviewId', getInterviewDetails);

export default router;