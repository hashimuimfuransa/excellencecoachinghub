import { Request, Response } from 'express';
import { HomeworkHelp } from '../models';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';

export const uploadHomeworkHelp = async (req: AuthRequest, res: Response) => {
  try {
    // Get data from request body (now JSON instead of FormData)
    const { homeworkTitle, level, message, fileUrl } = req.body;

    // Validate required fields
    if (!homeworkTitle || !level || !message) {
      return res.status(400).json({
        message: 'Homework title, level, and message are required'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }

    const user = req.user;
    const studentName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Student';

    // Process file data if provided (Uploadcare URL)
    let fileData = null;
    if (fileUrl) {
      // Validate that it's a proper URL
      try {
        new URL(fileUrl);
        fileData = {
          fileUrl: fileUrl,
          uploadedAt: new Date()
        };
      } catch (urlError) {
        console.warn('Invalid file URL provided:', fileUrl);
        // Don't fail the request if file URL is invalid, just ignore it
      }
    }

    const homeworkHelp = new HomeworkHelp({
      student: new Types.ObjectId(userId),
      studentName,
      level, // Use level instead of subject
      description: message, // Map 'message' to 'description'
      file: fileData,
      comments: []
    });

    await homeworkHelp.save();

    res.status(201).json({
      message: 'Homework uploaded successfully',
      data: homeworkHelp
    });
  } catch (error) {
    console.error('Error uploading homework help:', error);

    res.status(500).json({
      message: 'Error uploading homework',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getHomeworkHelp = async (req: AuthRequest, res: Response) => {
  try {
    const homeworkHelp = await HomeworkHelp.find()
      .populate('student', 'firstName lastName email avatar')
      .populate('comments.authorId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      message: 'Homework help items retrieved successfully',
      data: homeworkHelp
    });
  } catch (error) {
    console.error('Error getting homework help:', error);
    res.status(500).json({
      message: 'Error retrieving homework help',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getHomeworkHelpById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const homeworkHelp = await HomeworkHelp.findById(id)
      .populate('student', 'firstName lastName email avatar')
      .populate('comments.authorId', 'firstName lastName avatar');

    if (!homeworkHelp) {
      return res.status(404).json({
        message: 'Homework help not found'
      });
    }

    res.json({
      message: 'Homework help retrieved successfully',
      data: homeworkHelp
    });
  } catch (error) {
    console.error('Error getting homework help:', error);
    res.status(500).json({
      message: 'Error retrieving homework help',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const addCommentToHomeworkHelp = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!req.user) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        message: 'Comment cannot be empty'
      });
    }

    if (comment.length > 1000) {
      return res.status(400).json({
        message: 'Comment cannot exceed 1000 characters'
      });
    }

    const homeworkHelp = await HomeworkHelp.findById(id);

    if (!homeworkHelp) {
      return res.status(404).json({
        message: 'Homework help not found'
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }

    const user = req.user;
    const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Anonymous';

    const newComment = {
      author: authorName,
      authorId: new Types.ObjectId(userId),
      text: comment,
      createdAt: new Date()
    };

    homeworkHelp.comments.push(newComment);
    await homeworkHelp.save();

    const updatedHelp = await HomeworkHelp.findById(id)
      .populate('student', 'firstName lastName email avatar')
      .populate('comments.authorId', 'firstName lastName avatar');

    res.json({
      message: 'Comment added successfully',
      data: updatedHelp
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      message: 'Error adding comment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteHomeworkHelp = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }

    const homeworkHelp = await HomeworkHelp.findById(id);

    if (!homeworkHelp) {
      return res.status(404).json({
        message: 'Homework help not found'
      });
    }

    // Check if user is the owner or a teacher/admin
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }
    
    const isOwner = homeworkHelp.student.toString() === userId;
    const isTeacherOrAdmin = req.user.role === 'teacher' || req.user.role === 'admin';

    if (!isOwner && !isTeacherOrAdmin) {
      return res.status(403).json({
        message: 'Not authorized to delete this homework help request'
      });
    }

    await HomeworkHelp.findByIdAndDelete(id);

    res.json({
      message: 'Homework help request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting homework help:', error);
    res.status(500).json({
      message: 'Error deleting homework help',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get homework help requests for a specific student
export const getStudentHomeworkHelp = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }

    const homeworkHelp = await HomeworkHelp.find({ student: req.user._id })
      .populate('student', 'firstName lastName email avatar')
      .populate('comments.authorId', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Student homework help items retrieved successfully',
      data: homeworkHelp
    });
  } catch (error) {
    console.error('Error getting student homework help:', error);
    res.status(500).json({
      message: 'Error retrieving student homework help',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};