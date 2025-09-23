import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { Post, Comment, User, Job, Event } from '../models';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// @desc    Create a new post
// @route   POST /api/posts/create
// @access  Private
router.post('/create', protect, asyncHandler(async (req: Request, res: Response) => {
  const { content, media, tags, postType, relatedJob, relatedEvent, visibility = 'public' } = req.body;

  // Validate required fields
  if (!content || content.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Post content is required'
    });
    return;
  }

  // Validate related entities if specified
  if (postType === 'job_post' && relatedJob) {
    const job = await Job.findById(relatedJob);
    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Related job not found'
      });
      return;
    }
  }

  if (postType === 'event' && relatedEvent) {
    const event = await Event.findById(relatedEvent);
    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Related event not found'
      });
      return;
    }
  }

  const post = await Post.create({
    author: req.user!._id,
    content: content.trim(),
    media,
    tags: tags || [],
    postType: postType || 'text',
    relatedJob: postType === 'job_post' ? relatedJob : undefined,
    relatedEvent: postType === 'event' ? relatedEvent : undefined,
    visibility
  });

  await post.populate('author', 'firstName lastName profilePicture company jobTitle');

  res.status(201).json({
    success: true,
    data: post,
    message: 'Post created successfully'
  });
}));

// @desc    Get personalized feed
// @route   GET /api/posts/feed
// @access  Private
router.get('/feed', protect, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const filter = req.query.filter as string || 'all'; // all, jobs, people, training

  // Use the connection-aware feed method
  let posts = await Post.findPostsForFeed(req.user!._id.toString(), limit, skip);

  // Apply post-aggregation filters
  if (filter !== 'all') {
    switch (filter) {
      case 'jobs':
        posts = posts.filter(post => post.postType === 'job_post');
        break;
      case 'people':
        posts = posts.filter(post => ['text', 'company_update'].includes(post.postType));
        break;
      case 'training':
        posts = posts.filter(post => ['event', 'training'].includes(post.postType));
        break;
    }
  }

  // Get total count for pagination
  const totalQuery: any = {
    $or: [
      { visibility: 'public' },
      { author: req.user!._id }
    ]
  };

  if (filter !== 'all') {
    switch (filter) {
      case 'jobs':
        totalQuery.postType = 'job_post';
        break;
      case 'people':
        totalQuery.postType = { $in: ['text', 'company_update'] };
        break;
      case 'training':
        totalQuery.postType = { $in: ['event', 'training'] };
        break;
    }
  }

  const totalPosts = await Post.countDocuments(totalQuery);

  res.status(200).json({
    success: true,
    data: posts,
    pagination: {
      page,
      limit,
      total: totalPosts,
      pages: Math.ceil(totalPosts / limit)
    }
  });
}));

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'firstName lastName profilePicture company jobTitle')
    .populate('relatedJob', 'title company location jobType salary applicationDeadline')
    .populate('relatedEvent', 'title date location eventType');

  if (!post) {
    res.status(404).json({
      success: false,
      error: 'Post not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: post
  });
}));

// @desc    Like/Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
router.post('/:id/like', protect, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  
  // First check if user already liked the post
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    res.status(404).json({
      success: false,
      error: 'Post not found'
    });
    return;
  }
  
  const isLiked = post.likes.includes(userId);
  let updatedPost;
  
  if (isLiked) {
    // Unlike the post using atomic operations
    updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { likes: userId },
        $inc: { likesCount: -1 }
      },
      { new: true, runValidators: true }
    );
    
    // Ensure likesCount doesn't go below 0
    if (updatedPost && updatedPost.likesCount < 0) {
      await Post.findByIdAndUpdate(
        req.params.id,
        { $set: { likesCount: 0 } },
        { new: true }
      );
      updatedPost.likesCount = 0;
    }
  } else {
    // Like the post using atomic operations
    updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { likes: userId },
        $inc: { likesCount: 1 }
      },
      { new: true, runValidators: true }
    );
  }

  if (!updatedPost) {
    res.status(404).json({
      success: false,
      error: 'Post not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      liked: !isLiked,
      likesCount: updatedPost.likesCount
    },
    message: !isLiked ? 'Post liked' : 'Post unliked'
  });
}));

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
// @access  Private
router.post('/:id/comment', protect, asyncHandler(async (req: Request, res: Response) => {
  const { content, parentComment } = req.body;

  if (!content || content.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Comment content is required'
    });
    return;
  }

  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404).json({
      success: false,
      error: 'Post not found'
    });
    return;
  }

  // If this is a reply, validate parent comment exists
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent || parent.post.toString() !== post._id.toString()) {
      res.status(400).json({
        success: false,
        error: 'Invalid parent comment'
      });
      return;
    }
  }

  const comment = await Comment.create({
    post: post._id,
    author: req.user!._id,
    content: content.trim(),
    parentComment: parentComment || undefined
  });

  await comment.populate('author', 'firstName lastName profilePicture');

  // Update post comments count using atomic operation
  await Post.findByIdAndUpdate(post._id, {
    $inc: { commentsCount: 1 }
  });

  // If this is a reply, update parent comment replies count
  if (parentComment) {
    await Comment.findByIdAndUpdate(parentComment, {
      $inc: { repliesCount: 1 }
    });
  }

  res.status(201).json({
    success: true,
    data: comment,
    message: 'Comment added successfully'
  });
}));

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Private
router.get('/:id/comments', protect, asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404).json({
      success: false,
      error: 'Post not found'
    });
    return;
  }

  const comments = await Comment.findByPost(req.params.id);

  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await Comment.findReplies(comment._id);
      return {
        ...comment.toJSON(),
        replies
      };
    })
  );

  res.status(200).json({
    success: true,
    data: commentsWithReplies
  });
}));

// @desc    Delete own post
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404).json({
      success: false,
      error: 'Post not found'
    });
    return;
  }

  // Check ownership
  if (post.author.toString() !== req.user!._id.toString()) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to delete this post'
    });
    return;
  }

  // Delete associated comments
  await Comment.deleteMany({ post: post._id });

  // Delete the post
  await post.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
}));

// @desc    Share a post
// @route   POST /api/posts/:id/share
// @access  Private
router.post('/:id/share', protect, asyncHandler(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404).json({
      success: false,
      error: 'Post not found'
    });
    return;
  }

  // Increment share count
  post.sharesCount += 1;
  await post.save();

  res.status(200).json({
    success: true,
    data: {
      sharesCount: post.sharesCount
    },
    message: 'Post shared successfully'
  });
}));

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Private
router.get('/user/:userId', protect, asyncHandler(async (req: Request, res: Response) => {
  const posts = await Post.findPostsByAuthor(req.params.userId);

  res.status(200).json({
    success: true,
    data: posts
  });
}));

export default router;