import express from 'express';
import { Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { Achievement, UserAchievement } from '../models/Achievement';
import { uploadMediaToCloudinary } from '../config/cloudinary';
import { upload } from '../utils/fileUpload';
import mongoose from 'mongoose';

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

    // Format posts for frontend - filter out posts with null authors
    const formattedPosts = posts
      .filter(post => post.author != null) // Exclude posts where author was deleted
      .map(post => ({
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
        isBookmarked: post.bookmarks ? post.bookmarks.includes(req.user!._id) : false,
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

// Delete a post (author or admin only)
router.delete('/posts/:postId', protect, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Allow if current user is the author or an admin
    const isAuthor = post.author.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(postId);

    res.json({ success: true, message: 'Post deleted successfully', data: { postId } });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

// Trending content (posts and groups)
router.get('/trending', protect, async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const max = Number(limit);

    // Trending posts: sort by (likes + comments + shares) recent first
    const posts = await Post.find({ isActive: true })
      .populate('author', 'firstName lastName profilePicture role isEmailVerified')
      .sort({
        // prioritize engagement, then recency; Mongo cannot sort by expression easily, so fall back to likes then comments then shares then date
        likeCount: -1,
        commentCount: -1,
        shares: -1,
        createdAt: -1
      })
      .limit(max);

    // Filter out posts with null authors and format
    const formattedPosts = posts
      .filter(post => post.author != null) // Exclude posts where author was deleted
      .map(post => ({
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
        isBookmarked: post.bookmarks ? post.bookmarks.includes(req.user!._id) : false,
        tags: post.tags,
        attachments: post.attachments
      }));

    // Trending groups: by memberCount and recent activity
    const groups = await Group.find({ isActive: true })
      .populate('createdBy', 'firstName lastName profilePicture')
      .sort({ memberCount: -1, lastActivity: -1, updatedAt: -1 })
      .limit(max);

    const userId = req.user?.id;
    const formattedGroups = groups
      .filter(group => group.createdBy != null) // Exclude groups where creator was deleted
      .map(group => {
        const userMember = group.members.find(member => member.userId.toString() === userId);
        const isAdmin = group.createdBy._id.toString() === userId || userMember?.role === 'admin';
        return {
          id: group._id.toString(),
          name: group.name,
          description: group.description,
          category: group.category,
          avatar: group.avatar,
          coverImage: group.cover_image,
          memberCount: group.memberCount,
          maxMembers: group.maxMembers,
          isPrivate: group.isPrivate,
          isJoined: !!userMember,
          isAdmin,
          isModerator: userMember?.role === 'moderator',
          createdAt: group.createdAt.toISOString(),
          lastActivity: group.lastActivity?.toISOString() || group.updatedAt.toISOString(),
          tags: group.tags,
          rules: group.rules,
        };
      });

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        groups: formattedGroups
      }
    });
  } catch (error) {
    console.error('Error fetching trending content:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending content' });
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

    // Build query for teachers
    const query: any = { role: 'teacher' };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (specialty) {
      query.specializations = { $in: [specialty] };
    }

    // Import User model
    const { User } = await import('../models/User');

    const teachers = await User.find(query)
      .select('firstName lastName email profilePicture role company bio specializations isOnline lastSeen')
      .sort({ firstName: 1, lastName: 1 })
      .skip(offset)
      .limit(Number(limit));

    // Get total count
    const total = await User.countDocuments(query);

    // Format teachers for frontend
    const formattedTeachers = teachers.map(teacher => ({
      id: teacher._id.toString(),
      name: `${teacher.firstName} ${teacher.lastName}`,
      title: teacher.company || 'Educator',
      avatar: teacher.profilePicture,
      coverImage: teacher.profilePicture,
      bio: teacher.bio || `Passionate educator specializing in modern teaching methodologies.`,
      specialties: teacher.specializations || ['Education', 'Student Development'],
      experience: 5, // Default experience
      rating: 4.5, // Default rating
      totalRatings: 150, // Default ratings
      studentsCount: 250, // Default student count
      coursesCount: 8, // Default course count
      isOnline: teacher.isOnline || false,
      isVerified: teacher.emailVerified || false,
      isFollowing: false, // TODO: Implement follow functionality
      location: 'Various Locations',
      education: ['Teaching Certification'],
      certifications: ['Educational Specialist'],
      socialLinks: {
        linkedin: '#',
        twitter: '#',
        website: '#'
      }
    }));

    res.json({
      success: true,
      data: {
        teachers: formattedTeachers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
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
    const { page = 1, limit = 12, category, search } = req.query;
    const userId = req.user?.id;
    const offset = (Number(page) - 1) * Number(limit);

    // Build query
    const query: any = { isActive: true };
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$text = { $search: search as string };
    }

    // Get groups from database
    const groups = await Group.find(query)
      .populate('createdBy', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture')
      .sort({ lastActivity: -1 })
      .skip(offset)
      .limit(Number(limit));

    // Check which groups user has joined
    const userGroups = await Group.find({
      'members.userId': userId,
      isActive: true
    }).select('_id');

    const userGroupIds = new Set(userGroups.map(g => g._id.toString()));

    // Format groups for frontend - filter out groups where creator was deleted
    const formattedGroups = groups
      .filter(group => group.createdBy != null) // Exclude groups where creator was deleted
      .map(group => {
        const userMember = group.members.find(member => member.userId && member.userId.toString() === userId);
        const isAdmin = group.createdBy._id.toString() === userId || userMember?.role === 'admin';
        
        return {
          id: group._id.toString(),
          name: group.name,
          description: group.description,
          category: group.category,
          avatar: group.avatar,
          coverImage: group.cover_image,
          memberCount: group.memberCount,
          maxMembers: group.maxMembers,
          isPrivate: group.isPrivate,
          isJoined: userGroupIds.has(group._id.toString()),
          isAdmin: isAdmin,
          isModerator: group.members.some(member => 
            member.userId && member.userId.toString() === userId && member.role === 'moderator'
          ),
          createdAt: group.createdAt.toISOString(),
          lastActivity: group.lastActivity?.toISOString() || group.updatedAt.toISOString(),
          tags: group.tags,
          rules: group.rules,
          joinCode: group.joinCode
        };
      });

    // Get total count
    const total = await Group.countDocuments(query);

    res.json({
      success: true,
      data: {
        groups: formattedGroups,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch groups' });
  }
});

// Create group
router.post('/groups', protect, async (req: Request, res: Response) => {
  try {
    const { name, description, category, isPrivate = false, tags = [] } = req.body;
    const userId = req.user?.id;

    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and category are required'
      });
    }

    // Check if group with same name exists
    const existingGroup = await Group.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'A group with this name already exists'
      });
    }

    // Create group
    const group = new Group({
      name,
      description,
      category,
      isPrivate,
      tags,
      createdBy: userId,
      members: [{
        userId,
        role: 'admin',
        joinedAt: new Date()
      }]
    });

    await group.save();
    await group.populate('createdBy', 'firstName lastName profilePicture');

    // Format response
    const formattedGroup = {
      id: group._id.toString(),
      name: group.name,
      description: group.description,
      category: group.category,
      avatar: group.avatar,
      coverImage: group.cover_image,
      memberCount: group.memberCount,
      maxMembers: group.maxMembers,
      isPrivate: group.isPrivate,
      isJoined: true,
      isAdmin: true,
      isModerator: false,
      createdAt: group.createdAt.toISOString(),
      lastActivity: group.lastActivity?.toISOString() || group.updatedAt.toISOString(),
      tags: group.tags,
      rules: group.rules
    };

    res.json({
      success: true,
      data: formattedGroup,
      message: 'Group created successfully'
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, message: 'Failed to create group' });
  }
});

// Join group
router.post('/groups/:groupId/join', protect, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(member => member.userId.toString() === userId);
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers!) {
      return res.status(400).json({
        success: false,
        message: 'Group is full'
      });
    }

    // Add user to group
    group.members.push({
      userId,
      role: 'member',
      joinedAt: new Date()
    });

    group.lastActivity = new Date();
    await group.save();

    res.json({
      success: true,
      message: 'Successfully joined group',
      data: { groupId, isJoined: true }
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ success: false, message: 'Failed to join group' });
  }
});

// Leave group
router.delete('/groups/:groupId/join', protect, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex(member => member.userId.toString() === userId);
    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Prevent admin from leaving if they're the only admin and group has other members
    const member = group.members[memberIndex];
    if (member.role === 'admin') {
      const adminCount = group.members.filter(m => m.role === 'admin').length;
      if (adminCount === 1 && group.members.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot leave group as the only admin with active members'
        });
      }
    }

    // Remove user from group
    group.members.splice(memberIndex, 1);
    group.lastActivity = new Date();
    await group.save();

    res.json({
      success: true,
      message: 'Successfully left group',
      data: { groupId, isJoined: false }
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ success: false, message: 'Failed to leave group' });
  }
});

// Get my groups
router.get('/groups/my', protect, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const groups = await Group.find({
      'members.userId': userId,
      isActive: true
    })
      .populate('createdBy', 'firstName lastName profilePicture')
      .sort({ lastActivity: -1 });

    const formattedGroups = groups
      .filter(group => group.createdBy != null) // Exclude groups where creator was deleted
      .map(group => {
        const currentUserMember = group.members.find(member => member.userId && member.userId.toString() === userId);
        const isAdmin = group.createdBy._id.toString() === userId || currentUserMember?.role === 'admin';
        
        console.log('User group admin check:', {
          userId,
          groupId: group._id.toString(),
          groupName: group.name,
          creatorId: group.createdBy._id.toString(),
          userRole: currentUserMember?.role,
          isAdmin
        });
        
        return {
          id: group._id.toString(),
          name: group.name,
          description: group.description,
          category: group.category,
          avatar: group.avatar,
          coverImage: group.cover_image,
          memberCount: group.memberCount,
          maxMembers: group.maxMembers,
          isPrivate: group.isPrivate,
          isJoined: true,
          isAdmin: isAdmin,
          isModerator: currentUserMember?.role === 'moderator',
          createdAt: group.createdAt.toISOString(),
          lastActivity: group.lastActivity?.toISOString() || group.updatedAt.toISOString(),
          tags: group.tags,
          rules: group.rules,
          joinCode: group.joinCode
        };
      });

    res.json({
      success: true,
      data: formattedGroups
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your groups' });
  }
});

// Join group by code (public endpoint)
router.post('/groups/join-code/:joinCode', async (req: Request, res: Response) => {
  try {
    const { joinCode } = req.params;
    const userId = req.headers.userid as string; // Frontend will send user ID in header

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const group = await Group.findOne({ joinCode, isActive: true });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or invalid join code'
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(member => member.userId.toString() === userId);
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers!) {
      return res.status(400).json({
        success: false,
        message: 'Group is full'
      });
    }

    // Add user to group
    group.members.push({
      userId,
      role: 'member',
      joinedAt: new Date()
    });

    group.lastActivity = new Date();
    await group.save();

    res.json({
      success: true,
      message: 'Successfully joined group',
      data: { 
        groupId: group._id.toString(),
        groupName: group.name,
        isJoined: true 
      }
    });
  } catch (error) {
    console.error('Error joining group by code:', error);
    res.status(500).json({ success: false, message: 'Failed to join group' });
  }
});

// Get group members (admin only)
router.get('/groups/:groupId/members', protect, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin or moderator
    const userRole = group.members.find(member => member.userId.toString() === userId)?.role;
    if (!userRole || (userRole !== 'admin' && userRole !== 'moderator')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or moderator privileges required.'
      });
    }

    // Get detailed member information
    const memberDetails = await Promise.all(
      group.members.map(async (member) => {
        const user = await User.findById(member.userId)
          .select('firstName lastName profilePicture email role isOnline lastSeen');
        
        return {
          id: member.userId.toString(),
          name: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          email: user?.email,
          avatar: user?.profilePicture,
          role: member.role,
          joinedAt: member.joinedAt,
          isOnline: user?.isOnline || false,
          lastSeen: user?.lastSeen
        };
      })
    );

    res.json({
      success: true,
      data: {
        groupName: group.name,
        members: memberDetails
      }
    });
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch group members' });
  }
});

// Create group chat (admin only)
router.post('/groups/:groupId/create-chat', protect, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(groupId).populate('members.userId');
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin or moderator
    const userMember = group.members.find(member => member.userId.toString() === userId);
    const userRole = userMember?.role;
    const isGroupCreator = group.createdBy.toString() === userId;
    
    console.log('Admin check debug:', {
      userId,
      groupId,
      userRole,
      isGroupCreator,
      userMember: userMember ? 'found' : 'not found',
      groupCreator: group.createdBy.toString()
    });

    // Allow if user is group creator OR has admin/moderator role
    if (!isGroupCreator && (!userRole || (userRole !== 'admin' && userRole !== 'moderator'))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or moderator privileges required.'
      });
    }

    // Import Chat model
    const { Chat } = await import('../models/Chat');

    // Check if chat already exists for this group
    const existingChat = await Chat.findOne({ groupId, isGroup: true });
    if (existingChat) {
      return res.status(400).json({
        success: false,
        message: 'Group chat already exists'
      });
    }

    // Create group chat
    const chat = new Chat({
      participants: group.members.map(member => member.userId),
      isGroup: true,
      groupName: group.name,
      groupId: groupId,
      createdBy: userId
    });

    await chat.save();
    await chat.populate('participants', 'firstName lastName email profilePicture');

    res.json({
      success: true,
      message: 'Group chat created successfully',
      data: {
        chatId: chat._id.toString(),
        groupName: group.name,
        participants: chat.participants.length
      }
    });
  } catch (error) {
    console.error('Error creating group chat:', error);
    res.status(500).json({ success: false, message: 'Failed to create group chat' });
  }
});

// Delete group (admin only)
router.delete('/groups/:groupId', protect, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only allow the creator to delete the group
    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can delete the group'
      });
    }

    // Delete the group and all related chat records
    const { Chat } = await import('../models/Chat');
    await Chat.deleteMany({ groupId: groupId });
    
    await Group.findByIdAndDelete(groupId);

    res.json({
      success: true,
      message: 'Group deleted successfully',
      data: { groupId }
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ success: false, message: 'Failed to delete group' });
  }
});

// Update group settings (admin only)
router.put('/groups/:groupId', protect, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;
    const { name, description, category, isPrivate, tags, rules, maxMembers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only allow admin to update group settings
    const userRole = group.members.find(member => member.userId.toString() === userId)?.role;
    if (!userRole || userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can update group settings'
      });
    }

    // Update group properties
    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;
    if (category !== undefined) group.category = category;
    if (isPrivate !== undefined) group.isPrivate = isPrivate;
    if (tags !== undefined) group.tags = tags;
    if (rules !== undefined) group.rules = rules;
    if (maxMembers !== undefined) group.maxMembers = Math.max(maxMembers, group.members.length);

    group.lastActivity = new Date();
    await group.save();
    await group.populate('createdBy', 'firstName lastName profilePicture');

    // Format response
    const formattedGroup = {
      id: group._id.toString(),
      name: group.name,
      description: group.description,
      category: group.category,
      avatar: group.avatar,
      coverImage: group.cover_image,
      memberCount: group.memberCount,
      maxMembers: group.maxMembers,
      isPrivate: group.isPrivate,
      isJoined: true,
      isAdmin: true,
      isModerator: false,
      createdAt: group.createdAt.toISOString(),
      lastActivity: group.lastActivity?.toISOString() || group.updatedAt.toISOString(),
      tags: group.tags,
      rules: group.rules,
      joinCode: group.joinCode
    };

    res.json({
      success: true,
      message: 'Group settings updated successfully',
      data: formattedGroup
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ success: false, message: 'Failed to update group' });
  }
});

// Promote/Demote member (admin only)
router.post('/groups/:groupId/members/:memberId/role', protect, async (req: Request, res: Response) => {
  try {
    const { groupId, memberId } = req.params;
    const { newRole } = req.body;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID or member ID'
      });
    }

    if (!['member', 'moderator', 'admin'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be member, moderator, or admin'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only allow admin to change member roles
    const adminMember = group.members.find(member => member.userId.toString() === userId);
    if (!adminMember || adminMember.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can change member roles'
      });
    }

    // Find the member to update
    const memberIndex = group.members.findIndex(member => member.userId.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in group'
      });
    }

    // Prevent demoting the last admin
    if (group.members[memberIndex].role === 'admin' && newRole !== 'admin') {
      const adminCount = group.members.filter(m => m.role === 'admin').length;
      if (adminCount === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the last admin'
        });
      }
    }

    // Update member role
    group.members[memberIndex].role = newRole;
    group.lastActivity = new Date();
    await group.save();

    res.json({
      success: true,
      message: `Member role updated to ${newRole}`,
      data: { 
        memberId, 
        newRole,
        groupId 
      }
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ success: false, message: 'Failed to update member role' });
  }
});

// Remove member from group (admin/moderator only)
router.delete('/groups/:groupId/members/:memberId', protect, async (req: Request, res: Response) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID or member ID'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Allow admin or moderator to remove members
    const userMember = group.members.find(member => member.userId.toString() === userId);
    if (!userMember || (userMember.role !== 'admin' && userMember.role !== 'moderator')) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins or moderators can remove members'
      });
    }

    // Prevent removing members with higher roles
    const targetMember = group.members.find(member => member.userId.toString() === memberId);
    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in group'
      });
    }

    if (userMember.role === 'moderator' && targetMember.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Moderators cannot remove admins'
      });
    }

    // Remove the member
    group.members = group.members.filter(member => member.userId.toString() !== memberId);
    group.lastActivity = new Date();
    await group.save();

    res.json({
      success: true,
      message: 'Member removed from group successfully',
      data: { memberId, groupId }
    });
  } catch (error) {
    console.error('Error removing member from group:', error);
    res.status(500).json({ success: false, message: 'Failed to remove member from group' });
  }
});

// Generate or refresh join code (admin only)
router.post('/groups/:groupId/generate-join-code', protect, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only allow admin to regenerate join code
    const userMember = group.members.find(member => member.userId.toString() === userId);
    const userRole = userMember?.role;
    const isGroupCreator = group.createdBy.toString() === userId;

    if (!isGroupCreator && (!userRole || userRole !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can generate join codes'
      });
    }

    // Generate new join code
    const crypto = require('crypto');
    group.joinCode = crypto.randomBytes(16).toString('hex');
    group.lastActivity = new Date();
    
    await group.save();

    res.json({
      success: true,
      message: 'Join code generated successfully',
      data: {
        joinCode: group.joinCode,
        joinLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/community/groups/join/${group.joinCode}`,
        groupId: group._id.toString(),
        groupName: group.name
      }
    });
  } catch (error) {
    console.error('Error generating join code:', error);
    res.status(500).json({ success: false, message: 'Failed to generate join code' });
  }
});

// Get user achievements
router.get('/achievements', protect, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const userId = req.user!._id;

    // Get all achievements
    const achievements = await Achievement.find({ isActive: true })
      .sort({ points: 1 })
      .skip(offset)
      .limit(Number(limit));

    // Get user's achievement progress
    const userAchievements = await UserAchievement.find({
      userId: userId
    }).populate('achievementId');

    // Create a map for quick lookup
    const userAchievementMap = new Map();
    userAchievements.forEach(ua => {
      if (ua.achievementId != null) { // Safely handle null achievements
        const achievementId = ua.achievementId instanceof mongoose.Types.ObjectId 
          ? ua.achievementId.toString() 
          : (ua.achievementId as any)._id.toString();
        userAchievementMap.set(achievementId, ua);
      }
    });

    // Format achievements for frontend
    const formattedAchievements = achievements.map(achievement => {
      const userAchievement = userAchievementMap.get(achievement._id.toString());

      return {
        id: achievement._id.toString(),
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        points: achievement.points,
        isUnlocked: userAchievement?.isUnlocked || false,
        unlockedAt: userAchievement?.unlockedAt?.toISOString(),
        progress: userAchievement?.progress || 0,
        requirements: achievement.requirements,
        rarity: achievement.rarity,
        sharedBy: userAchievement?.sharedBy || 0,
        likes: userAchievement?.likes || 0
      };
    });

    // Get total count
    const total = await Achievement.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        achievements: formattedAchievements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch achievements' });
  }
});

// Get my achievements (only with user progress/unlocked)
router.get('/achievements/my', protect, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    const userAchievements = await UserAchievement.find({ userId })
      .populate('achievementId');

    const formatted = userAchievements
      .filter(ua => ua.achievementId != null) // Exclude records where achievement was deleted
      .map(ua => ({
        id: ua.achievementId instanceof mongoose.Types.ObjectId ? ua.achievementId.toString() : (ua.achievementId as any)._id.toString(),
        title: (ua as any).achievementId.title,
        description: (ua as any).achievementId.description,
        icon: (ua as any).achievementId.icon,
        category: (ua as any).achievementId.category,
        points: (ua as any).achievementId.points,
        isUnlocked: ua.isUnlocked,
        unlockedAt: ua.unlockedAt ? ua.unlockedAt.toISOString() : undefined,
        progress: ua.progress,
        requirements: (ua as any).achievementId.requirements,
        rarity: (ua as any).achievementId.rarity,
        sharedBy: ua.sharedBy || 0,
        likes: ua.likes || 0
      }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching my achievements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch my achievements' });
  }
});

// Like an achievement (increments likes on user's achievement progress row)
router.post('/achievements/:achievementId/like', protect, async (req: Request, res: Response) => {
  try {
    const { achievementId } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(achievementId)) {
      return res.status(400).json({ success: false, message: 'Invalid achievement ID' });
    }

    // Ensure the achievement exists
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }

    // Find or create a user achievement row
    const userAchievement = await UserAchievement.findOneAndUpdate(
      { userId, achievementId },
      { $inc: { likes: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: { achievementId, likes: userAchievement.likes } });
  } catch (error) {
    console.error('Error liking achievement:', error);
    res.status(500).json({ success: false, message: 'Failed to like achievement' });
  }
});

// Share an achievement (increments share counter)
router.post('/achievements/:achievementId/share', protect, async (req: Request, res: Response) => {
  try {
    const { achievementId } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(achievementId)) {
      return res.status(400).json({ success: false, message: 'Invalid achievement ID' });
    }

    // Ensure the achievement exists
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }

    // Find or create a user achievement row
    const userAchievement = await UserAchievement.findOneAndUpdate(
      { userId, achievementId },
      { $inc: { sharedBy: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: { achievementId, sharedBy: userAchievement.sharedBy } });
  } catch (error) {
    console.error('Error sharing achievement:', error);
    res.status(500).json({ success: false, message: 'Failed to share achievement' });
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
    const userId = req.user!._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if user already bookmarked this post
    const isBookmarked = post.bookmarks ? post.bookmarks.includes(userId) : false;

    if (action === 'bookmark' && !isBookmarked) {
      // Add bookmark
      if (!post.bookmarks) {
        post.bookmarks = [];
      }
      post.bookmarks.push(userId);
      console.log('📌 Post bookmarked:', postId, 'by user:', userId);
    } else if (action === 'unbookmark' && isBookmarked) {
      // Remove bookmark
      post.bookmarks = post.bookmarks.filter(id => !id.equals(userId));
      console.log('🗑️ Bookmark removed:', postId, 'by user:', userId);
    }

    await post.save();

    res.json({
      success: true,
      message: `Post ${action}d successfully`,
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
    const { page = 1, limit = 20 } = req.query; // Increased limit to get all comments and replies
    const offset = (Number(page) - 1) * Number(limit);

    // Fetch ALL comments for this post (both parent comments and replies)
    const allComments = await Comment.find({ 
      post: postId, 
      isActive: true
    })
      .populate('author', 'firstName lastName profilePicture role isEmailVerified')
      .sort({ createdAt: -1 });

    // Format all comments - filter out comments with null authors
    const formattedAllComments = allComments
      .filter(comment => comment.author != null) // Exclude comments where author was deleted
      .map(comment => ({
        id: comment._id.toString(),
        parentCommentId: comment.parentComment ? comment.parentComment.toString() : null,
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
        replyCount: allComments.filter(c => c.parentComment?.equals(comment._id)).length
      }));

    // Get top-level comments for pagination
    const topLevelComments = formattedAllComments.filter(comment => !comment.parentComment_id);
    const total = topLevelComments.length;

    // Return all comments so frontend can organize them
    res.json({
      success: true,
      data: {
        comments: formattedAllComments, // Return all comments including replies
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
