import express from 'express';
import multer from 'multer';
import path from 'path';
import { auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { asyncHandler } from '../middleware/asyncHandler';
import { createAssignment } from '../controllers/assignmentController';
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
  saveInteractiveHomeworkProgress,
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

// Create homework (for teachers) - Updated to use the new controller
router.post('/', authorizeRoles(['teacher']), asyncHandler(createAssignment));

// Get homework assignments for student
router.get('/', authorizeRoles(['student']), asyncHandler(async (req: any, res: any) => {
  // This would need to be implemented
  res.status(501).json({ message: 'Homework retrieval not implemented yet' });
}));

// Submit homework
router.post('/submit', authorizeRoles(['student']), asyncHandler(async (req: any, res: any) => {
  res.status(501).json({ message: 'Homework submission not implemented yet' });
}));

// Get submissions (for teachers)
router.get('/submissions', authorizeRoles(['teacher']), asyncHandler(async (req: any, res: any) => {
  res.status(501).json({ message: 'Submission retrieval not implemented yet' });
}));

// Review and provide feedback on submission
router.put('/feedback/:submissionId', authorizeRoles(['teacher']), asyncHandler(async (req: any, res: any) => {
  res.status(501).json({ message: 'Submission feedback not implemented yet' });
}));

// Homework Help Routes
router.post('/help/upload', upload.single('file'), asyncHandler(uploadHomeworkHelp));
router.get('/help', asyncHandler(getHomeworkHelp));
router.get('/help/my', authorizeRoles(['student']), asyncHandler(getStudentHomeworkHelp));
router.get('/help/:id', asyncHandler(getHomeworkHelpById));
router.post('/help/:id/comments', asyncHandler(addCommentToHomeworkHelp));
router.delete('/help/:id', authorizeRoles(['student']), asyncHandler(deleteHomeworkHelp));

// Interactive homework routes
router.get('/interactive/:id', getInteractiveHomework);
router.post('/interactive/:id/submit', submitInteractiveHomework);
router.post('/interactive/:id/save-progress', saveInteractiveHomeworkProgress);

// Student-created homework
router.get('/student', authorizeRoles(['student']), asyncHandler(getStudentCreatedHomework));

export default router;