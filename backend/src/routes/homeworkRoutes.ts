import express from 'express';
import multer from 'multer';
import path from 'path';
import { auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  getCourseAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission
} from '../controllers/assignmentController';
import {
  uploadHomeworkHelp,
  getHomeworkHelp,
  getHomeworkHelpById,
  addCommentToHomeworkHelp,
  deleteHomeworkHelp,
  getStudentHomeworkHelp
} from '../controllers/homeworkHelpController';
import {
  getInteractiveHomework,
  submitInteractiveHomework,
  getStudentCreatedHomework
} from '../controllers/homeworkController';

const router = express.Router();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, JPG, PNG, GIF, ZIP files are allowed'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter
});

// All routes require authentication
router.use(auth);

// Get homework assignments for student
router.get('/', authorizeRoles(['student']), asyncHandler(async (req: any, res: any) => {
  // Get assignments for the student's enrolled courses
  const assignments = await getCourseAssignments(req, res);
  return assignments;
}));

// Submit homework
router.post('/submit', authorizeRoles(['student']), asyncHandler(async (req: any, res: any) => {
  return await submitAssignment(req, res);
}));

// Get submissions (for teachers)
router.get('/submissions', authorizeRoles(['teacher']), asyncHandler(async (req: any, res: any) => {
  return await getAssignmentSubmissions(req, res);
}));

// Review and provide feedback on submission
router.put('/feedback/:submissionId', authorizeRoles(['teacher']), asyncHandler(async (req: any, res: any) => {
  return await gradeSubmission(req, res);
}));

// Create homework (for teachers)
router.post('/create', authorizeRoles(['teacher']), asyncHandler(async (req: any, res: any) => {
  // This would need to be implemented in assignmentController
  res.status(501).json({ message: 'Homework creation not implemented yet' });
}));

// Homework Help Routes
router.post('/help/upload', upload.single('file'), asyncHandler(uploadHomeworkHelp));
router.get('/help', asyncHandler(getHomeworkHelp));
router.get('/help/my', authorizeRoles(['student']), asyncHandler(getStudentHomeworkHelp));
router.get('/help/:id', asyncHandler(getHomeworkHelpById));
router.post('/help/:id/comments', asyncHandler(addCommentToHomeworkHelp));
router.delete('/help/:id', authorizeRoles(['student']), asyncHandler(deleteHomeworkHelp));

// Interactive homework routes
router.get('/interactive/:id', asyncHandler(getInteractiveHomework));
router.post('/interactive/:id/submit', asyncHandler(submitInteractiveHomework));

// Student-created homework
router.get('/student', authorizeRoles(['student']), asyncHandler(getStudentCreatedHomework));

export default router;