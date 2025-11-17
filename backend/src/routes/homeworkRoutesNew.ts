import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  createHomework,
  updateHomework,
  getCourseHomework,
  getAllHomework,
  getHomeworkById,
  submitHomework,
  getStudentHomeworkSubmission,
  getHomeworkSubmissions,
  gradeHomeworkSubmission,
  deleteHomework,
  getHomeworkSubmissionById
} from '../controllers/homeworkControllerNew';

const router = express.Router();

// Multer configuration for file uploads
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter
});

// All routes require authentication
router.use(auth);

// Homework CRUD operations (for teachers)
router.post('/', authorizeRoles(['teacher']), asyncHandler(createHomework));
router.put('/:id', authorizeRoles(['teacher']), asyncHandler(updateHomework));
router.get('/course/:courseId', authorizeRoles(['student', 'teacher']), asyncHandler(getCourseHomework));
router.get('/all', authorizeRoles(['teacher']), asyncHandler(getAllHomework));
// Add a default route that gets all homework (no course required)
router.get('/', authorizeRoles(['student', 'teacher']), asyncHandler(getAllHomework));
router.get('/:id', authorizeRoles(['student', 'teacher']), asyncHandler(getHomeworkById));
router.delete('/:id', authorizeRoles(['teacher']), asyncHandler(deleteHomework));

// Homework submissions (for students)
router.post('/:homeworkId/submit', authorizeRoles(['student']), asyncHandler(submitHomework));
router.get('/:homeworkId/submission', authorizeRoles(['student']), asyncHandler(getStudentHomeworkSubmission));

// Homework submissions management (for teachers)
router.get('/:homeworkId/submissions', authorizeRoles(['teacher']), asyncHandler(getHomeworkSubmissions));
router.put('/submissions/:submissionId/grade', authorizeRoles(['teacher']), asyncHandler(gradeHomeworkSubmission));
router.get('/submissions/:submissionId', authorizeRoles(['student', 'teacher']), asyncHandler(getHomeworkSubmissionById));

export default router;