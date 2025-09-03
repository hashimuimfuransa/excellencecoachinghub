import express from 'express';
import { auth } from '@/middleware/auth';
import { authorizeRoles } from '@/middleware/roleAuth';
import { UserRole } from '../types';
import {
  // Employer job management
  getEmployerJobs,
  createEmployerJob,
  updateEmployerJob,
  deleteEmployerJob,
  toggleJobStatus,
  duplicateJob,
  getJobStatistics,
  
  // Application management
  getJobApplications,
  getApplicationDetails,
  updateApplicationStatus,
  addApplicationNotes,
  shortlistApplication,
  rejectApplication,
  
  // Test and Interview results
  getApplicationTestResults,
  getApplicationInterviewResults,
  scheduleInterview,
  updateInterviewFeedback,
  
  // Analytics and reporting
  getEmployerDashboard,
  getApplicationAnalytics,
  exportApplicationData,
  
  // Candidate management
  getCandidatesOverview,
  getCandidateDetails,
  getCandidates,
  searchCandidates,
  
  // Job posting management
  getJobPostingSettings,
  updateJobPostingSettings,
  bulkUpdateJobStatuses,
  
  // Saved candidates management
  saveCandidate,
  removeSavedCandidate,
  getSavedCandidates,
  updateSavedCandidateNotes,
  
  // Hired candidates
  getHiredCandidates,
  
  // CV download
  downloadCandidateCV,
  
  // AI Shortlisting
  aiShortlistCandidates,
  applyAIShortlisting
} from '@/controllers/employerController';

// Import psychometric test controller for employer access
import { getPsychometricTests } from '@/controllers/psychometricTestController';

const router = express.Router();

// All routes require authentication and employer role
router.use(auth);
router.use(authorizeRoles(['employer', 'super_admin']));

// Dashboard and analytics
router.get('/dashboard', getEmployerDashboard);
router.get('/analytics', getApplicationAnalytics);

// Job management routes
router.get('/jobs', getEmployerJobs);
router.post('/jobs', createEmployerJob);
router.put('/jobs/:jobId', updateEmployerJob);
router.delete('/jobs/:jobId', deleteEmployerJob);
router.patch('/jobs/:jobId/toggle-status', toggleJobStatus);
router.post('/jobs/:jobId/duplicate', duplicateJob);
router.get('/jobs/:jobId/statistics', getJobStatistics);
router.patch('/jobs/bulk-update-status', bulkUpdateJobStatuses);

// Application management routes
router.get('/jobs/:jobId/applications', getJobApplications);
router.get('/applications/:applicationId', getApplicationDetails);
router.patch('/applications/:applicationId/status', updateApplicationStatus);
router.post('/applications/:applicationId/notes', addApplicationNotes);
router.patch('/applications/:applicationId/shortlist', shortlistApplication);
router.patch('/applications/:applicationId/reject', rejectApplication);

// Test and interview results
router.get('/applications/:applicationId/test-results', getApplicationTestResults);
router.get('/applications/:applicationId/interview-results', getApplicationInterviewResults);
router.post('/applications/:applicationId/schedule-interview', scheduleInterview);
router.patch('/applications/:applicationId/interview-feedback', updateInterviewFeedback);

// Data export
router.get('/applications/export/:jobId', exportApplicationData);

// Candidate management  
router.get('/candidates', getCandidates); // Talent pool - all candidates with completed profiles
router.get('/candidates/overview', getCandidatesOverview); // Overview of candidates who applied
router.get('/candidates/search', searchCandidates); // Search talent pool
router.get('/candidates/:candidateId', getCandidateDetails);

// Settings
router.get('/settings/job-posting', getJobPostingSettings);
router.put('/settings/job-posting', updateJobPostingSettings);

// Psychometric tests access for employers
router.get('/psychometric-tests', getPsychometricTests);

// Saved candidates management
router.get('/saved-candidates', getSavedCandidates);
router.post('/saved-candidates', saveCandidate);
router.delete('/saved-candidates/:candidateId', removeSavedCandidate);
router.patch('/saved-candidates/:candidateId', updateSavedCandidateNotes);

// Hired candidates
router.get('/hired-candidates', getHiredCandidates);

// CV download
router.get('/candidates/:candidateId/cv', downloadCandidateCV);

// AI Shortlisting routes
router.post('/ai-shortlist', aiShortlistCandidates);
router.post('/ai-shortlist/apply', applyAIShortlisting);

export default router;