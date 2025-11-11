import { Request, Response } from 'express';
import { HomeworkHelp } from '../models';
import { uploadFile } from '../utils/fileUpload';
import fs from 'fs';

export const uploadHomeworkHelp = async (req: Request, res: Response) => {
  try {
    const { subject, description } = req.body;
    const file = req.file;

    if (!subject || !description) {
      return res.status(400).json({
        message: 'Subject and description are required'
      });
    }

    if (!file) {
      return res.status(400).json({
        message: 'File is required'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }

    const fileSize = file.size / (1024 * 1024);
    if (fileSize > 50) {
      return res.status(400).json({
        message: 'File size cannot exceed 50MB'
      });
    }

    const user = req.user;
    const studentName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Student';

    let fileData = null;
    if (file) {
      try {
        const uploadedFile = await uploadFile(file, 'homework-help');
        if (uploadedFile) {
          fileData = {
            filename: file.filename,
            originalName: file.originalname,
            fileUrl: uploadedFile.url,
            fileSize: file.size,
            uploadedAt: new Date()
          };
        }
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(400).json({
          message: 'Failed to upload file to server',
          error: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        });
      }
    }

    const homeworkHelp = new HomeworkHelp({
      student: user._id,
      studentName,
      subject,
      description,
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

    if ((req.file as any) && (req.file as any).path && fs.existsSync((req.file as any).path)) {
      fs.unlinkSync((req.file as any).path);
    }

    res.status(500).json({
      message: 'Error uploading homework',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getHomeworkHelp = async (req: Request, res: Response) => {
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

export const getHomeworkHelpById = async (req: Request, res: Response) => {
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

export const addCommentToHomeworkHelp = async (req: Request, res: Response) => {
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

    const user = req.user;
    const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Anonymous';

    const newComment = {
      author: authorName,
      authorId: user._id,
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

export const deleteHomeworkHelp = async (req: Request, res: Response) => {
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

    if (homeworkHelp.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You can only delete your own homework submissions'
      });
    }

    await HomeworkHelp.findByIdAndDelete(id);

    res.json({
      message: 'Homework help deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting homework help:', error);
    res.status(500).json({
      message: 'Error deleting homework help',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getStudentHomeworkHelp = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }

    const homeworkHelp = await HomeworkHelp.find({ student: req.user._id })
      .populate('comments.authorId', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Student homework help retrieved successfully',
      data: homeworkHelp
    });
  } catch (error) {
    console.error('Error getting student homework help:', error);
    res.status(500).json({
      message: 'Error retrieving homework help',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
