import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Week, IWeekDocument } from '../models/Week';
import { Course } from '../models/Course';
import { asyncHandler } from '../middleware/asyncHandler';
import { UserRole } from '../types';

// Get all weeks for a course
export const getCourseWeeks = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  
  const weeks = await Week.find({ courseId })
    .sort({ weekNumber: 1 })
    .populate('assessment', 'title description points')
    .populate('assignment', 'title description points');
  
  res.json({
    success: true,
    data: weeks
  });
});

// Get a specific week
export const getWeek = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  
  const week = await Week.findById(weekId)
    .populate('assessment', 'title description points questions')
    .populate('assignment', 'title description points instructions');
  
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  res.json({
    success: true,
    data: week
  });
});

// Create a new week
export const createWeek = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const weekData = req.body;
  
  // Verify course exists and user has permission
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'Course not found'
    });
  }
  
  // Check if week number already exists
  const existingWeek = await Week.findOne({ 
    courseId, 
    weekNumber: weekData.weekNumber 
  });
  
  if (existingWeek) {
    return res.status(400).json({
      success: false,
      message: 'Week number already exists for this course'
    });
  }
  
  const week = new Week({
    ...weekData,
    courseId
  });
  
  await week.save();
  
  res.status(201).json({
    success: true,
    data: week
  });
});

// Update a week
export const updateWeek = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  const updateData = req.body;
  
  const week = await Week.findByIdAndUpdate(
    weekId,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  res.json({
    success: true,
    data: week
  });
});

// Delete a week
export const deleteWeek = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  
  const week = await Week.findByIdAndDelete(weekId);
  
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Week deleted successfully'
  });
});

// Add material to a week
export const addWeekMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  const materialData = req.body;
  
  const week = await Week.findById(weekId);
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  // Generate unique ID for the material
  const materialId = new mongoose.Types.ObjectId();
  
  const newMaterial = {
    _id: materialId,
    ...materialData
  };
  
  week.materials.push(newMaterial);
  await week.save();
  
  res.json({
    success: true,
    data: newMaterial
  });
});

// Update week material
export const updateWeekMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { weekId, materialId } = req.params;
  const updateData = req.body;
  
  const week = await Week.findById(weekId);
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  const material = week.materials.id(materialId);
  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }
  
  Object.assign(material, updateData);
  await week.save();
  
  res.json({
    success: true,
    data: material
  });
});

// Delete week material
export const deleteWeekMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { weekId, materialId } = req.params;
  
  const week = await Week.findById(weekId);
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  const material = week.materials.id(materialId);
  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found'
    });
  }
  
  material.deleteOne();
  await week.save();
  
  res.json({
    success: true,
    message: 'Material deleted successfully'
  });
});

// Process exam upload and add to week
export const processExamUpload = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  const examData = req.body;
  
  const week = await Week.findById(weekId);
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  // Generate unique ID for the exam material
  const materialId = new mongoose.Types.ObjectId();
  
  // Create exam material with processing
  const newExamMaterial = {
    _id: materialId,
    title: examData.title,
    description: examData.description,
    type: 'exam',
    examType: examData.examType,
    url: examData.url,
    examSettings: examData.examSettings,
    content: {
      ...examData.content,
      processedAt: new Date().toISOString(),
      processingTime: Date.now()
    },
    order: week.materials.length + 1,
    estimatedDuration: examData.estimatedDuration || examData.examSettings?.timeLimit || 60,
    isRequired: examData.isRequired !== false,
    isPublished: examData.isPublished !== false
  };
  
  // Add exam material to week
  week.materials.push(newExamMaterial);
  await week.save();
  
  res.status(201).json({
    success: true,
    message: 'Exam uploaded and processed successfully',
    data: newExamMaterial
  });
});

// Publish/Unpublish a week
export const toggleWeekPublish = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  const { isPublished } = req.body;
  
  const week = await Week.findById(weekId);
  
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }

  // Update the week's published status
  week.isPublished = isPublished;
  
  // Also update all materials within the week to match the week's published status
  if (week.materials && week.materials.length > 0) {
    week.materials.forEach(material => {
      material.isPublished = isPublished;
    });
  }
  
  await week.save();
  
  res.json({
    success: true,
    data: week
  });
});

// ... existing code ...
