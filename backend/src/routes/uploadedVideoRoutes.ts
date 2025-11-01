import { Router } from 'express';
import { body } from 'express-validator';
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
  getPublicVideo,
  updateVideo,
  deleteVideo,
  toggleVideoPublic,
  getShareLink
} from '../controllers/uploadedVideoController';
import { protect } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

const uploadVideoValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title too long'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('videoUrl').optional().isURL().withMessage('Invalid video URL'),
  body('youtubeUrl').optional().isURL().withMessage('Invalid YouTube URL'),
  body('videoType').optional().isIn(['uploadcare', 'youtube']).withMessage('Invalid video type'),
  body().custom((value, { req }) => {
    const { videoType = 'uploadcare', videoUrl, youtubeUrl } = req.body;
    if (videoType === 'youtube') {
      if (!youtubeUrl) {
        throw new Error('YouTube URL is required for YouTube videos');
      }
    } else {
      if (!videoUrl) {
        throw new Error('Video URL is required');
      }
    }
    return true;
  }),
  body('fileSize').optional().isNumeric().withMessage('File size must be numeric'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  body('duration').optional().isNumeric().withMessage('Duration must be numeric'),
  body('thumbnailUrl').optional().isURL().withMessage('Invalid thumbnail URL')
];

const updateVideoValidation = [
  body('title').optional().trim().isLength({ max: 200 }).withMessage('Title too long'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('videoUrl').optional().isURL().withMessage('Invalid URL'),
  body('fileSize').optional().isNumeric().withMessage('File size must be numeric'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  body('duration').optional().isNumeric().withMessage('Duration must be numeric'),
  body('thumbnailUrl').optional().isURL().withMessage('Invalid thumbnail URL')
];

router.post('/', protect, uploadVideoValidation, validateRequest, uploadVideo);

router.get('/', getAllVideos);

router.get('/:videoId', getVideoById);

router.get('/share/:shareToken', getPublicVideo);

router.put('/:videoId', protect, updateVideoValidation, validateRequest, updateVideo);

router.delete('/:videoId', protect, deleteVideo);

router.patch('/:videoId/toggle-public', protect, toggleVideoPublic);

router.get('/share-link/:videoId', protect, getShareLink);

export default router;
