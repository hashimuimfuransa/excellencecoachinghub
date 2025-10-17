import express from 'express';
import {
  getAllPastPapersAdmin,
  createPastPaper,
  updatePastPaper,
  deletePastPaper,
  publishPastPaper,
  unpublishPastPaper,
  getPastPaperStatistics,
  getPastPaperAttempts,
  getOverallStatistics
} from '../controllers/superAdminPastPaperController';
import { auth } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin';

const router = express.Router();

// All routes require super admin authentication
router.use(auth);
router.use(requireSuperAdmin);

// Past paper management
router.get('/', getAllPastPapersAdmin);
router.post('/', createPastPaper);
router.get('/statistics/overall', getOverallStatistics);
router.get('/:id', getAllPastPapersAdmin); // Get single past paper
router.put('/:id', updatePastPaper);
router.delete('/:id', deletePastPaper);
router.post('/:id/publish', publishPastPaper);
router.post('/:id/unpublish', unpublishPastPaper);

// Statistics and analytics
router.get('/:id/statistics', getPastPaperStatistics);
router.get('/:id/attempts', getPastPaperAttempts);

export default router;
