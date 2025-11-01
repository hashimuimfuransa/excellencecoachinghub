import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import UploadedVideo from '../models/UploadedVideo';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';
import { v4 as uuidv4 } from 'uuid';
import { deleteUploadcareFileByCdnUrl, isUploadcareUrl } from '../services/uploadcareService';

interface IUploadRequest extends Request {
  user?: { id?: string; _id?: string };
  file?: Express.Multer.File;
}


export const uploadVideo = asyncHandler(async (req: IUploadRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'User authentication required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      res.status(403).json({ success: false, error: 'Only admins can upload videos' });
      return;
    }

    const { title, description, videoUrl, youtubeUrl, videoType = 'uploadcare', isPublic = false, thumbnailUrl, duration, fileSize } = req.body;

    if (!title) {
      res.status(400).json({ success: false, error: 'Title is required' });
      return;
    }

    // Check for appropriate URL based on video type
    if (videoType === 'youtube' && !youtubeUrl) {
      res.status(400).json({ success: false, error: 'YouTube URL is required for YouTube videos' });
      return;
    } else if (videoType !== 'youtube' && !videoUrl) {
      res.status(400).json({ success: false, error: 'Video URL is required' });
      return;
    }

    const shareToken = uuidv4();
    const shareUrl = `${process.env.ELEARNING_URL || 'http://localhost:3000'}/video-library/${shareToken}`;

    const uploadedVideo = new UploadedVideo({
      title,
      description,
      videoUrl,
      youtubeUrl: videoType === 'youtube' ? youtubeUrl : undefined,
      videoType,
      thumbnailUrl,
      duration: duration ? parseInt(duration) : undefined,
      fileSize: videoType === 'uploadcare' ? (fileSize ? parseInt(fileSize) : undefined) : undefined,
      uploadedBy: userId,
      isPublic,
      shareToken,
      shareUrl
    });

    const savedVideo = await uploadedVideo.save();
    await savedVideo.populate('uploadedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: savedVideo
    });

  } catch (error) {
    console.error('Error uploading video:', error);
    next(error);
  }
});

export const getAllVideos = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, isPublic } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    const videos = await UploadedVideo.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await UploadedVideo.countDocuments(query);

    res.json({
      success: true,
      data: videos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    next(error);
  }
});

export const getVideoById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { videoId } = req.params;

    const video = await UploadedVideo.findById(videoId).populate('uploadedBy', 'firstName lastName email');
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    res.json({ success: true, data: video });

  } catch (error) {
    console.error('Error fetching video:', error);
    next(error);
  }
});

export const getPublicVideo = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shareToken } = req.params;

    const video = await UploadedVideo.findOne({ shareToken });
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    if (!video.isPublic) {
      res.status(403).json({ success: false, error: 'This video is not public' });
      return;
    }

    video.views = (video.views || 0) + 1;
    await video.save();

    await video.populate('uploadedBy', 'firstName lastName');

    res.json({ success: true, data: video });

  } catch (error) {
    console.error('Error fetching public video:', error);
    next(error);
  }
});

export const updateVideo = asyncHandler(async (req: IUploadRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'User authentication required' });
      return;
    }

    const { videoId } = req.params;
    const { title, description, isPublic, videoUrl, thumbnailUrl, duration, fileSize } = req.body;

    const video = await UploadedVideo.findById(videoId);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || (!['admin', 'super_admin'].includes(user.role) && video.uploadedBy.toString() !== userId)) {
      res.status(403).json({ success: false, error: 'Not authorized to update this video' });
      return;
    }

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (isPublic !== undefined) video.isPublic = isPublic;
    if (videoUrl) video.videoUrl = videoUrl;
    if (thumbnailUrl) video.thumbnailUrl = thumbnailUrl;
    if (duration) video.duration = parseInt(duration);
    if (fileSize) video.fileSize = parseInt(fileSize);

    const updatedVideo = await video.save();
    await updatedVideo.populate('uploadedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: updatedVideo
    });

  } catch (error) {
    console.error('Error updating video:', error);
    next(error);
  }
});

export const deleteVideo = asyncHandler(async (req: IUploadRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'User authentication required' });
      return;
    }

    const { videoId } = req.params;

    const video = await UploadedVideo.findById(videoId);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || (!['admin', 'super_admin'].includes(user.role) && video.uploadedBy.toString() !== userId)) {
      res.status(403).json({ success: false, error: 'Not authorized to delete this video' });
      return;
    }

    // Delete the video from storage if it's an Uploadcare URL
    if (video.videoUrl && isUploadcareUrl(video.videoUrl)) {
      await deleteUploadcareFileByCdnUrl(video.videoUrl);
    }

    await UploadedVideo.findByIdAndDelete(videoId);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    next(error);
  }
});

export const toggleVideoPublic = asyncHandler(async (req: IUploadRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'User authentication required' });
      return;
    }

    const { videoId } = req.params;

    const video = await UploadedVideo.findById(videoId);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      res.status(403).json({ success: false, error: 'Only admins can toggle video visibility' });
      return;
    }

    video.isPublic = !video.isPublic;
    const updatedVideo = await video.save();

    res.json({
      success: true,
      message: `Video is now ${updatedVideo.isPublic ? 'public' : 'private'}`,
      data: updatedVideo
    });

  } catch (error) {
    console.error('Error toggling video visibility:', error);
    next(error);
  }
});

export const getShareLink = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { videoId } = req.params;

    const video = await UploadedVideo.findById(videoId);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    if (!video.isPublic) {
      res.status(403).json({ success: false, error: 'Only public videos can be shared' });
      return;
    }

    res.json({
      success: true,
      data: {
        shareUrl: video.shareUrl,
        shareToken: video.shareToken,
        title: video.title
      }
    });

  } catch (error) {
    console.error('Error getting share link:', error);
    next(error);
  }
});
