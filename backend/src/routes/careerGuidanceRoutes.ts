import express from 'express';
import { auth } from '@/middleware/auth';
import {
  generateCareerDiscoveryAssessment,
  generateJobReadinessAssessment,
  submitCareerAssessment,
  getCareerAssessments,
  getCareerAssessmentById,
  getCareerAssessmentResults,
  getPersonalizedGuidance,
  getChatMentorResponse,
  getSuccessStories,
  updateCareerProfile,
  getCareerProfile,
  getCareerInsights,
  getCareerRoadmap,
  getSkillGapAnalysis,
  getJobMatching,
  getCourseRecommendations,
  trackProgress,
  generateCareerReport,
  downloadCareerCertificate
} from '@/controllers/careerGuidanceController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Career Assessment Routes
router.post('/assessments/career-discovery', generateCareerDiscoveryAssessment);
router.post('/assessments/job-readiness', generateJobReadinessAssessment);
router.post('/assessments/:assessmentId/submit', submitCareerAssessment);
router.get('/assessments', getCareerAssessments);
router.get('/assessments/:assessmentId', getCareerAssessmentById);
router.get('/assessments/:assessmentId/results', getCareerAssessmentResults);

// Personalized Guidance Routes
router.get('/guidance', getPersonalizedGuidance);
router.get('/insights', getCareerInsights);
router.get('/roadmap', getCareerRoadmap);
router.get('/skill-gap-analysis', getSkillGapAnalysis);

// Matching and Recommendations
router.get('/job-matching', getJobMatching);
router.get('/course-recommendations', getCourseRecommendations);

// AI Career Mentor
router.post('/mentor/chat', getChatMentorResponse);

// Career Profile Management
router.get('/profile', getCareerProfile);
router.put('/profile', updateCareerProfile);

// Progress Tracking
router.post('/progress/track', trackProgress);

// Success Stories and Testimonials
router.get('/success-stories', getSuccessStories);

// Reports and Certificates
router.get('/report', generateCareerReport);
router.get('/certificate', downloadCareerCertificate);

export default router;