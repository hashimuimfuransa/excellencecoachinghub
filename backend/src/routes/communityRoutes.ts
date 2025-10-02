import express from 'express';
import { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { uploadMediaToCloudinary } from '../config/cloudinary';
import { upload } from '../utils/fileUpload';

const router = express.Router();

// Use existing upload configuration from utils/fileUpload.ts

// Get community posts
router.get('/posts', protect, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build query
    const query: any = { isActive: true };
    if (type) {
      query.type = type;
    }

    // Get posts from database
    const posts = await Post.find(query)
      .populate('author', 'firstName lastName profilePicture role isEmailVerified')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Number(limit));

    // Get total count
    const total = await Post.countDocuments(query);

    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      id: post._id.toString(),
      author: {
        id: post.author._id.toString(),
        name: `${post.author.firstName} ${post.author.lastName}`,
        avatar: post.author.profilePicture,
        role: post.author.role,
        verified: post.author.isEmailVerified
      },
      content: post.content,
      type: post.type,
      timestamp: post.createdAt.toISOString(),
      likes: post.likeCount,
      comments: post.commentCount,
      shares: post.shares,
      isLiked: post.likes.includes(req.user!._id),
      isBookmarked: false, // TODO: Implement bookmarks
      tags: post.tags,
      attachments: post.attachments
    }));

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

// Create a new post
router.post('/posts', protect, async (req: Request, res: Response) => {
  try {
    const { content, type, tags, attachments } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post content is required' 
      });
    }

    // Save to database
    const savedPost = await Post.create({
      author: req.user!._id,
      content: content.trim(),
      type: type || 'text',
      tags: tags || [],
      attachments: attachments || [],
      likes: [],
      comments: [],
      shares: 0
    });

    // Populate author data
    await savedPost.populate('author', 'firstName lastName profilePicture role isEmailVerified');

    // Format response
    const newPost = {
      id: savedPost._id.toString(),
      author: {
        id: savedPost.author._id.toString(),
        name: `${savedPost.author.firstName} ${savedPost.author.lastName}`,
        avatar: savedPost.author.profilePicture,
        role: savedPost.author.role,
        verified: savedPost.author.isEmailVerified
      },
      content: savedPost.content,
      type: savedPost.type,
      timestamp: savedPost.createdAt.toISOString(),
      likes: 0,
      comments: 0,
      shares: savedPost.shares,
      isLiked: false,
      isBookmarked: false,
      tags: savedPost.tags,
      attachments: savedPost.attachments
    };

    console.log('📝 New post created:', newPost.id, 'by user:', req.user?._id);

    res.status(201).json({
      success: true,
      data: newPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

// Upload file for community posts
router.post('/upload', protect, upload.array('files', 3), async (req: Request, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const files = req.files as Express.Multer.File[];
    const userId = req.user!._id.toString();
    
    console.log('📁 Starting upload of', files.length, 'files for user:', userId);

    // Check file sizes and reject large files early
    const maxSize = 10 * 1024 * 1024; // 10MB limit for community posts
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Files too large. Maximum size is 10MB. Large files: ${oversizedFiles.map(f => f.originalname).join(', ')}`
      });
    }

    // Upload files to Cloudinary with timeout and smaller chunks
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          console.log(`📤 Uploading ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          
          const result = await uploadMediaToCloudinary(
            file.buffer,
            userId,
            file.originalname,
            'excellence-coaching-hub/community',
            file.mimetype
          );

          console.log(`✅ Uploaded ${file.originalname}`);

          return {
            type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            url: result.url,
            name: file.originalname,
            size: result.size,
            publicId: result.publicId
          };
        } catch (error) {
          console.error('Error uploading file:', file.originalname, error);
          throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
        }
      })
    );

    console.log('✅ All files uploaded successfully:', uploadedFiles.length);

    res.json({
      success: true,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to upload files' 
    });
  }
});

// Get teachers list
router.get('/teachers', protect, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12, search, specialty } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // TODO: Replace with actual database query
    const mockTeachers = [
      {
        id: 'teacher-1',
        name: 'Dr. Sarah Johnson',
        title: 'Senior Software Engineer & Educator',
        avatar: '/avatars/sarah.jpg',
        coverImage: '/teacher-covers/sarah.jpg',
        bio: 'Passionate about teaching web development and helping students build real-world applications. 10+ years of experience in the tech industry.',
        specialties: ['React', 'Node.js', 'JavaScript', 'Full-Stack Development'],
        experience: 10,
        rating: 4.9,
        totalRatings: 1250,
        studentsCount: 5000,
        coursesCount: 15,
        isOnline: true,
        isVerified: true,
        isFollowing: false,
        location: 'San Francisco, CA',
        education: ['PhD in Computer Science', 'MS in Software Engineering'],
        certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
        socialLinks: {
          website: 'https://sarahjohnson.dev',
          linkedin: 'https://linkedin.com/in/sarahjohnson',
          github: 'https://github.com/sarahjohnson'
        }
      }
    ];

    res.json({
      success: true,
      data: {
        teachers: mockTeachers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: mockTeachers.length,
          totalPages: Math.ceil(mockTeachers.length / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
  }
});

// Follow/Unfollow teacher
router.post('/teachers/:teacherId/follow', protect, async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const { action } = req.body; // 'follow' or 'unfollow'

    // TODO: Replace with actual database operation
    res.json({
      success: true,
      message: `Teacher ${action}ed successfully`,
      data: { teacherId, isFollowing: action === 'follow' }
    });
  } catch (error) {
    console.error('Error following teacher:', error);
    res.status(500).json({ success: false, message: 'Failed to follow teacher' });
  }
});

// Get community groups
router.get('/groups', protect, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12, category } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // TODO: Replace with actual database query
    const mockGroups = [
      {
        id: 'group-1',
        name: 'React Developers',
        description: 'A community for React developers to share knowledge and collaborate on projects.',
        category: 'Programming',
        memberCount: 1250,
        isJoined: false,
        coverImage: '/group-covers/react.jpg',
        tags: ['react', 'javascript', 'frontend'],
        recentActivity: 'New discussion about React 18 features',
        lastActivity: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: {
        groups: mockGroups,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: mockGroups.length,
          totalPages: Math.ceil(mockGroups.length / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch groups' });
  }
});

// Join/Leave group
router.post('/groups/:groupId/join', protect, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { action } = req.body; // 'join' or 'leave'

    // TODO: Replace with actual database operation
    res.json({
      success: true,
      message: `Group ${action}ed successfully`,
      data: { groupId, isJoined: action === 'join' }
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ success: false, message: 'Failed to join group' });
  }
});

// Get user achievements
router.get('/achievements', protect, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // TODO: Replace with actual database query
    const mockAchievements = [
      {
        id: 'achievement-1',
        title: 'First Course Completed',
        description: 'Completed your first course on the platform',
        icon: '🎓',
        points: 50,
        earnedAt: new Date().toISOString(),
        category: 'Learning',
        rarity: 'common'
      }
    ];

    res.json({
      success: true,
      data: {
        achievements: mockAchievements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: mockAchievements.length,
          totalPages: Math.ceil(mockAchievements.length / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch achievements' });
  }
});

// Like/Unlike post
router.post('/posts/:postId/like', protect, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user!._id;
    const isLiked = post.likes.includes(userId);

    if (action === 'like' && !isLiked) {
      post.likes.push(userId);
    } else if (action === 'unlike' && isLiked) {
      post.likes = post.likes.filter(id => !id.equals(userId));
    }

    await post.save();

    res.json({
      success: true,
      message: `Post ${action}d successfully`,
      data: { postId, isLiked: action === 'like' }
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ success: false, message: 'Failed to like post' });
  }
});

// Bookmark/Unbookmark post
router.post('/posts/:postId/bookmark', protect, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { action } = req.body; // 'bookmark' or 'unbookmark'

    // TODO: Implement bookmark functionality with User model
    res.json({
      success: true,
      message: `Post ${action}ed successfully`,
      data: { postId, isBookmarked: action === 'bookmark' }
    });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    res.status(500).json({ success: false, message: 'Failed to bookmark post' });
  }
});

// Get comments for a post
router.get('/posts/:postId/comments', protect, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const comments = await Comment.find({ 
      post: postId, 
      isActive: true,
      parentComment: null // Only top-level comments
    })
      .populate('author', 'firstName lastName profilePicture role isEmailVerified')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Number(limit));

    const total = await Comment.countDocuments({ 
      post: postId, 
      isActive: true,
      parentComment: null 
    });

    // Format comments for frontend
    const formattedComments = comments.map(comment => ({
      id: comment._id.toString(),
      author: {
        id: comment.author._id.toString(),
        name: `${comment.author.firstName} ${comment.author.lastName}`,
        avatar: comment.author.profilePicture,
        role: comment.author.role,
        verified: comment.author.isEmailVerified
      },
      content: comment.content,
      timestamp: comment.createdAt.toISOString(),
      likes: comment.likeCount,
      isLiked: comment.likes.includes(req.user!._id),
      replyCount: 0 // TODO: Implement reply count
    }));

    res.json({
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
});

// Create a comment
router.post('/posts/:postId/comments', protect, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment content is required' 
      });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Create comment
    const comment = await Comment.create({
      post: postId,
      author: req.user!._id,
      content: content.trim(),
      parentComment: parentCommentId || null
    });

    // Update post's comments array
    post.comments.push(comment._id);
    await post.save();

    // Populate author data
    await comment.populate('author', 'firstName lastName profilePicture role isEmailVerified');

    // Format response
    const newComment = {
      id: comment._id.toString(),
      author: {
        id: comment.author._id.toString(),
        name: `${comment.author.firstName} ${comment.author.lastName}`,
        avatar: comment.author.profilePicture,
        role: comment.author.role,
        verified: comment.author.isEmailVerified
      },
      content: comment.content,
      timestamp: comment.createdAt.toISOString(),
      likes: 0,
      isLiked: false,
      replyCount: 0
    };

    console.log('💬 New comment created:', newComment.id, 'by user:', req.user?._id);

    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
});

// Like/Unlike comment
router.post('/comments/:commentId/like', protect, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const userId = req.user!._id;
    const isLiked = comment.likes.includes(userId);

    if (action === 'like' && !isLiked) {
      comment.likes.push(userId);
    } else if (action === 'unlike' && isLiked) {
      comment.likes = comment.likes.filter(id => !id.equals(userId));
    }

    await comment.save();

    res.json({
      success: true,
      message: `Comment ${action}d successfully`,
      data: { commentId, isLiked: action === 'like' }
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ success: false, message: 'Failed to like comment' });
  }
});

// Share post
router.post('/posts/:postId/share', protect, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { platform, message } = req.body; // platform: 'internal', 'facebook', 'twitter', etc.

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Increment share count
    post.shares += 1;
    await post.save();

    console.log('📤 Post shared:', postId, 'by user:', req.user?._id, 'on platform:', platform);

    res.json({
      success: true,
      message: 'Post shared successfully',
      data: { 
        postId, 
        shares: post.shares,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/community/feed?post=${postId}`
      }
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ success: false, message: 'Failed to share post' });
  }
});

export default router;
