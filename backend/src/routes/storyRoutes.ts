import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { Story } from '../models/Story';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// @desc    Create a new story
// @route   POST /api/social/stories
// @access  Private
router.post('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const { type, title, content, media, tags, visibility = 'connections' } = req.body;

  // Validate required fields
  if (!title || title.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Story title is required'
    });
    return;
  }

  if (!content || content.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Story content is required'
    });
    return;
  }

  const story = await Story.create({
    type: type || 'announcement',
    title: title.trim(),
    content: content.trim(),
    media,
    tags: tags || [],
    author: req.user!._id,
    visibility
  });

  await story.populate('author', 'firstName lastName profilePicture');

  res.status(201).json({
    success: true,
    data: story,
    message: 'Story created successfully'
  });
}));

// @desc    Get stories feed
// @route   GET /api/social/stories
// @access  Private
router.get('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  
  // Get active stories that user can see
  const stories = await (Story as any).findActiveStories(req.user!._id.toString(), 'connections')
    .skip(skip)
    .limit(limit);

  const totalStories = await Story.countDocuments({
    expiresAt: { $gt: new Date() },
    $or: [
      { visibility: 'public' },
      { author: req.user!._id }
    ]
  });

  res.status(200).json({
    success: true,
    data: stories,
    pagination: {
      page,
      limit,
      total: totalStories,
      pages: Math.ceil(totalStories / limit)
    }
  });
}));

// @desc    Get user's own stories
// @route   GET /api/social/stories/my-stories
// @access  Private
router.get('/my-stories', protect, asyncHandler(async (req: Request, res: Response) => {
  const stories = await (Story as any).findUserStories(req.user!._id.toString());

  res.status(200).json({
    success: true,
    data: stories
  });
}));

// @desc    View a story (mark as viewed)
// @route   POST /api/social/stories/:id/view
// @access  Private
router.post('/:id/view', protect, asyncHandler(async (req: Request, res: Response) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404).json({
      success: false,
      error: 'Story not found'
    });
    return;
  }

  // Check if story is still active
  if (story.expiresAt < new Date()) {
    res.status(410).json({
      success: false,
      error: 'Story has expired'
    });
    return;
  }

  const userId = req.user!._id.toString();

  // Don't add the author as a viewer of their own story
  if (story.author.toString() !== userId) {
    // Add viewer if not already present
    if (!story.viewers.some(viewerId => viewerId.toString() === userId)) {
      story.viewers.push(req.user!._id);
      await story.save();
    }
  }

  res.status(200).json({
    success: true,
    message: 'Story viewed successfully',
    data: {
      storyId: story._id,
      viewersCount: story.viewers.length
    }
  });
}));

// @desc    Like/Unlike a story
// @route   POST /api/social/stories/:id/like
// @access  Private
router.post('/:id/like', protect, asyncHandler(async (req: Request, res: Response) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404).json({
      success: false,
      error: 'Story not found'
    });
    return;
  }

  // Check if story is still active
  if (story.expiresAt < new Date()) {
    res.status(410).json({
      success: false,
      error: 'Story has expired'
    });
    return;
  }

  const userId = req.user!._id.toString();
  const likeIndex = story.likes.findIndex(likeId => likeId.toString() === userId);

  if (likeIndex > -1) {
    // Unlike the story
    story.likes.splice(likeIndex, 1);
  } else {
    // Like the story
    story.likes.push(req.user!._id);
  }

  await story.save();

  res.status(200).json({
    success: true,
    data: {
      liked: likeIndex === -1,
      likesCount: story.likes.length
    },
    message: likeIndex === -1 ? 'Story liked' : 'Story unliked'
  });
}));

// @desc    Share a story (increment share count)
// @route   POST /api/social/stories/:id/share
// @access  Private
router.post('/:id/share', protect, asyncHandler(async (req: Request, res: Response) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404).json({
      success: false,
      error: 'Story not found'
    });
    return;
  }

  // Check if story is still active
  if (story.expiresAt < new Date()) {
    res.status(410).json({
      success: false,
      error: 'Story has expired'
    });
    return;
  }

  // Increment share count
  story.shares += 1;
  await story.save();

  res.status(200).json({
    success: true,
    data: {
      sharesCount: story.shares
    },
    message: 'Story shared successfully'
  });
}));

// @desc    Get story analytics (for story author)
// @route   GET /api/social/stories/:id/analytics
// @access  Private
router.get('/:id/analytics', protect, asyncHandler(async (req: Request, res: Response) => {
  const story = await Story.findById(req.params.id)
    .populate('viewers', 'firstName lastName profilePicture')
    .populate('author', 'firstName lastName profilePicture');

  if (!story) {
    res.status(404).json({
      success: false,
      error: 'Story not found'
    });
    return;
  }

  // Only allow story author to view analytics
  if (story.author._id.toString() !== req.user!._id.toString()) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to view story analytics'
    });
    return;
  }

  // Prepare viewers data with timestamps (simulated for now)
  const viewers = story.viewers.map((viewer: any) => ({
    _id: viewer._id,
    firstName: viewer.firstName,
    lastName: viewer.lastName,
    profilePicture: viewer.profilePicture,
    viewedAt: new Date() // In a real implementation, we'd store view timestamps
  }));

  const analytics = {
    viewers,
    engagement: {
      views: story.viewers.length,
      likes: story.likes.length,
      shares: story.shares,
      reach: story.viewers.length + story.shares * 2 // Simple reach calculation
    }
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
}));

// @desc    Delete own story
// @route   DELETE /api/social/stories/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404).json({
      success: false,
      error: 'Story not found'
    });
    return;
  }

  // Check ownership
  if (story.author.toString() !== req.user!._id.toString()) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to delete this story'
    });
    return;
  }

  await story.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Story deleted successfully'
  });
}));

export default router;