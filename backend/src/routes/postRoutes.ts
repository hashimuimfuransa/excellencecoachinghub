import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { Post, Comment, User, Job, Event } from '../models';
import { asyncHandler } from '../middleware/asyncHandler';
import { upload } from '../utils/fileUpload';

const router = Router();

// @desc    Create a new post
// @route   POST /api/posts/create
// @access  Private
router.post('/create', protect, (req: Request, res: Response, next: any) => {
  upload.array('media', 10)(req, res, (err: any) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum file size is 50MB.',
          details: err.message
        });
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Too many files. Maximum 10 files allowed.',
          details: err.message
        });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field.',
          details: err.message
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'File upload error.',
          details: err.message
        });
      }
    }
    next();
  });
}, asyncHandler(async (req: Request, res: Response) => {
  const { content, tags, postType, relatedJob, relatedEvent, visibility = 'public' } = req.body;
  const files = req.files as Express.Multer.File[];

  // Validate required fields
  if (!content || content.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Post content is required'
    });
    return;
  }

  // Process uploaded files
  let media = [];
  if (files && files.length > 0) {
    try {
      console.log(`Processing ${files.length} files for post creation`);
      
      // Check file sizes and types before upload
      for (const file of files) {
        console.log(`File: ${file.originalname}, Size: ${file.size} bytes, Type: ${file.mimetype}`);
        
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          res.status(400).json({
            success: false,
            error: `File ${file.originalname} is too large. Maximum size is 50MB.`
          });
          return;
        }
        
        // Check if it's a video file
        if (file.mimetype.startsWith('video/')) {
          console.log(`Video file detected: ${file.originalname}`);
        }
      }
      
      // Upload files one by one using the existing uploadFile function
      const uploadedFiles = [];
      for (const file of files) {
        try {
          console.log(`Uploading file: ${file.originalname}`);
          const { uploadFile } = await import('../utils/fileUpload');
          const result = await uploadFile(file, 'social-posts');
          uploadedFiles.push(result);
          console.log(`File uploaded successfully: ${result.publicId}`);
        } catch (error) {
          console.error(`Failed to upload file ${file.originalname}:`, error);
          throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
        }
      }
      
      console.log(`Successfully uploaded ${uploadedFiles.length} files`);
      
      media = uploadedFiles.map(file => ({
        type: file.resourceType === 'video' ? 'video' : 'image',
        url: file.url,
        thumbnail: file.resourceType === 'video' ? file.url : undefined
      }));
      
      console.log('Media array created:', media);
    } catch (error) {
      console.error('Error uploading files:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        files: files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype }))
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to upload media files',
        details: error.message
      });
      return;
    }
  }

  // Process tags
  let processedTags = [];
  if (tags) {
    if (typeof tags === 'string') {
      processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    } else if (Array.isArray(tags)) {
      processedTags = tags.filter(tag => tag && tag.trim());
    }
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

  try {
    console.log('📝 Creating post with:', {
      author: req.user!._id,
      content: content.trim(),
      mediaCount: media.length,
      tags: processedTags,
      postType: postType || 'text',
      visibility
    });

    const post = await Post.create({
      author: req.user!._id,
      content: content.trim(),
      media,
      tags: processedTags,
      postType: postType || 'text',
      relatedJob: postType === 'job_post' ? relatedJob : undefined,
      relatedEvent: postType === 'event' ? relatedEvent : undefined,
      visibility
    });

    console.log('✅ Post created successfully:', post._id);

    await post.populate('author', 'firstName lastName profilePicture company jobTitle');

    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to create post',
      details: error.message
    });
  }
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

// @desc    Search posts
// @route   GET /api/posts/search
// @access  Private
router.get('/search', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchQuery = query.trim();
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Search posts using aggregation to include author information
    const posts = await Post.aggregate([
      {
        $match: {
          $or: [
            { visibility: 'public' },
            { author: req.user!._id }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      {
        $unwind: '$authorInfo'
      },
      {
        $match: {
          $or: [
            { content: { $regex: searchQuery, $options: 'i' } },
            { tags: { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.firstName': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.lastName': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.company': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.jobTitle': { $regex: searchQuery, $options: 'i' } }
          ]
        }
      },
      {
        $project: {
          content: 1,
          media: 1,
          tags: 1,
          postType: 1,
          visibility: 1,
          createdAt: 1,
          updatedAt: 1,
          likesCount: 1,
          commentsCount: 1,
          sharesCount: 1,
          author: {
            _id: '$authorInfo._id',
            firstName: '$authorInfo.firstName',
            lastName: '$authorInfo.lastName',
            profilePicture: '$authorInfo.profilePicture',
            company: '$authorInfo.company',
            jobTitle: '$authorInfo.jobTitle'
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limitNum
      }
    ]);

    // Get total count for pagination
    const totalPipeline = [
      {
        $match: {
          $or: [
            { visibility: 'public' },
            { author: req.user!._id }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      {
        $unwind: '$authorInfo'
      },
      {
        $match: {
          $or: [
            { content: { $regex: searchQuery, $options: 'i' } },
            { tags: { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.firstName': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.lastName': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.company': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.jobTitle': { $regex: searchQuery, $options: 'i' } }
          ]
        }
      },
      {
        $count: 'total'
      }
    ];

    const totalResult = await Post.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search posts'
    });
  }
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

  console.log(`🔍 Getting comments for post: ${req.params.id}`);
  
  // Debug: Get total comments count first
  const totalComments = await Comment.countDocuments({ post: req.params.id });
  console.log(`📊 Total comments in DB: ${totalComments}`);
  
  const comments = await Comment.findByPost(req.params.id);
  console.log(`📊 Top-level comments found: ${comments.length}`);
  
  // If no top-level comments found but there are comments in DB, 
  // check if we have orphaned replies (comments with parentComment but no valid parent)
  if (comments.length === 0 && totalComments > 0) {
    console.log(`🔧 No top-level comments found, checking for orphaned replies...`);
    
    // Get all comments for this post that are marked as replies
    const potentialReplies = await Comment.find({ 
      post: req.params.id, 
      parentComment: { $exists: true } 
    }).populate('author', 'firstName lastName profilePicture');
    
    console.log(`📊 Comments with parentComment field: ${potentialReplies.length}`);
    
    // Get unique parent IDs that actually exist
    const existingParents = await Comment.find({
      _id: { $in: potentialReplies.map(c => c.parentComment).filter(Boolean) }
    }).select('_id');
    
    const validParentIds = new Set(existingParents.map(p => p._id.toString()));
    console.log(`📊 Valid parent comments: ${validParentIds.size}`);
    
    // Find orphaned comments (have parentComment but parent doesn't exist)
    const orphanedComments = potentialReplies.filter(c => {
      if (!c.parentComment) return false;
      const parentIdStr = c.parentComment.toString();
      return !validParentIds.has(parentIdStr);
    });
    
    console.log(`📊 Debug orphaned filtering:`);
    console.log(`📊 potentialReplies length: ${potentialReplies.length}`);
    potentialReplies.forEach((c, index) => {
      console.log(`📊 Reply ${index}: _id=${c._id}, parentComment=${c.parentComment}`);
      if (c.parentComment) {
        console.log(`📊 Parent check: ${c.parentComment} exists in validParents: ${validParentIds.has(c.parentComment.toString())}`);
      }
    });
    
    console.log(`📊 Orphaned comments (no valid parent): ${orphanedComments.length}`);
    
    if (orphanedComments.length > 0) {
      console.log(`🔧 Converting ${orphanedComments.length} orphaned replies to top-level comments`);
      // Convert orphaned replies to top-level comments by removing parentComment field
      await Comment.updateMany(
        { _id: { $in: orphanedComments.map(c => c._id) } },
        { $unset: { parentComment: 1 } }
      );
      
      // Now fetch top-level comments again
      const updatedComments = await Comment.findByPost(req.params.id);
      console.log(`📊 Top-level comments after fix: ${updatedComments.length}`);
      
      // Update comments to use the corrected data
      comments.push(...updatedComments);
    } else {
      // If no orphaned comments found but orphaned logic might have failed,
      // try converting ALL comments with parentComment to top-level for this post
      console.log(`🔧 No orphaned comments detected, trying alternative fix...`);
      console.log(`🔧 Converting ALL comments with parentComment for this post...`);
      
      const allRepliesConversion = await Comment.updateMany(
        { post: req.params.id, parentComment: { $exists: true } },
        { $unset: { parentComment: 1 } }
      );
      
      console.log(`🔧 Conversion result: ${allRepliesConversion.modifiedCount} comments converted`);
      
      // Fetch top-level comments after the conversion
      const fixedComments = await Comment.findByPost(req.params.id);
      console.log(`📊 Top-level comments after alternative fix: ${fixedComments.length}`);
      
      // Update comments to use the corrected data
      comments.push(...fixedComments);
    }
  }

  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await Comment.findReplies(comment._id);
      console.log(`📊 Comment ${comment._id} has ${replies.length} replies`);
      return {
        ...comment.toJSON(),
        replies
      };
    })
  );
  
  console.log(`📊 Returning ${commentsWithReplies.length} comments with replies`);

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

// @desc    Search posts
// @route   GET /api/social/posts/search
// @access  Private
router.get('/search', protect, asyncHandler(async (req: Request, res: Response) => {
  const { q: query, page = 1, limit = 20 } = req.query;
  
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  const searchQuery = query.trim();
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const skip = (pageNum - 1) * limitNum;

  try {
    // Search posts by content, tags, and author name
    const posts = await Post.aggregate([
      {
        $match: {
          $or: [
            { visibility: 'public' },
            { author: req.user!._id }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      {
        $unwind: '$authorInfo'
      },
      {
        $match: {
          $or: [
            { content: { $regex: searchQuery, $options: 'i' } },
            { tags: { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.firstName': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.lastName': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.company': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.jobTitle': { $regex: searchQuery, $options: 'i' } }
          ]
        }
      },
      {
        $project: {
          content: 1,
          media: 1,
          tags: 1,
          postType: 1,
          createdAt: 1,
          updatedAt: 1,
          likes: 1,
          comments: 1,
          shares: 1,
          author: {
            _id: '$authorInfo._id',
            firstName: '$authorInfo.firstName',
            lastName: '$authorInfo.lastName',
            profilePicture: '$authorInfo.profilePicture',
            company: '$authorInfo.company',
            jobTitle: '$authorInfo.jobTitle'
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limitNum
      }
    ]);

    // Get total count for pagination
    const totalCount = await Post.aggregate([
      {
        $match: {
          $or: [
            { visibility: 'public' },
            { author: req.user!._id }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      {
        $unwind: '$authorInfo'
      },
      {
        $match: {
          $or: [
            { content: { $regex: searchQuery, $options: 'i' } },
            { tags: { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.firstName': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.lastName': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.company': { $regex: searchQuery, $options: 'i' } },
            { 'authorInfo.jobTitle': { $regex: searchQuery, $options: 'i' } }
          ]
        }
      },
      {
        $count: 'total'
      }
    ]);

    const total = totalCount.length > 0 ? totalCount[0].total : 0;

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search posts'
    });
  }
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