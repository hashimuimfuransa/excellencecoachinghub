import { Request, Response } from 'express';
import { StudentProgress, WeekProgress } from '../models/StudentProgress';
import { Week } from '../models/Week';
import { asyncHandler } from '../middleware/asyncHandler';

// Mark material as completed
export const markMaterialCompleted = asyncHandler(async (req: Request, res: Response) => {
  const { weekId, materialId } = req.params;
  const { timeSpent, score } = req.body;
  const studentId = req.user?.id;
  
  if (!studentId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }
  
  // Get week to find courseId
  const week = await Week.findById(weekId);
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  // Create or update progress
  const progress = await StudentProgress.findOneAndUpdate(
    { studentId, courseId: week.courseId, weekId, materialId },
    {
      studentId,
      courseId: week.courseId,
      weekId,
      materialId,
      completedAt: new Date(),
      timeSpent: timeSpent || 0,
      score,
      status: 'completed'
    },
    { upsert: true, new: true }
  );
  
  // Update week progress
  await updateWeekProgress(studentId, week.courseId, weekId);
  
  res.json({
    success: true,
    data: progress
  });
});

// Get student progress for a course
export const getStudentCourseProgress = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const studentId = req.user?.id;
  
  if (!studentId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }
  
  const weekProgresses = await WeekProgress.find({ studentId, courseId })
    .populate('weekId', 'title weekNumber startDate endDate')
    .sort({ 'weekId.weekNumber': 1 });
  
  const materialProgresses = await StudentProgress.find({ studentId, courseId })
    .populate('weekId', 'title weekNumber')
    .sort({ completedAt: -1 });
  
  res.json({
    success: true,
    data: {
      weekProgresses,
      materialProgresses
    }
  });
});

// Get student progress for a specific week
export const getStudentWeekProgress = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  const studentId = req.user?.id;
  
  if (!studentId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }
  
  const week = await Week.findById(weekId);
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  const weekProgress = await WeekProgress.findOne({ studentId, courseId: week.courseId, weekId });
  const materialProgresses = await StudentProgress.find({ studentId, courseId: week.courseId, weekId });
  
  res.json({
    success: true,
    data: {
      weekProgress,
      materialProgresses,
      week
    }
  });
});

// Mark assessment as completed
export const markAssessmentCompleted = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  const { score } = req.body;
  const studentId = req.user?.id;
  
  if (!studentId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }
  
  const week = await Week.findById(weekId);
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  // Update week progress
  const weekProgress = await WeekProgress.findOneAndUpdate(
    { studentId, courseId: week.courseId, weekId },
    {
      assessmentCompleted: true,
      progressPercentage: 100 // Assessment completion marks week as complete
    },
    { upsert: true, new: true }
  );
  
  res.json({
    success: true,
    data: weekProgress
  });
});

// Mark assignment as completed
export const markAssignmentCompleted = asyncHandler(async (req: Request, res: Response) => {
  const { weekId } = req.params;
  const studentId = req.user?.id;
  
  if (!studentId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }
  
  const week = await Week.findById(weekId);
  if (!week) {
    return res.status(404).json({
      success: false,
      message: 'Week not found'
    });
  }
  
  // Update week progress
  const weekProgress = await WeekProgress.findOneAndUpdate(
    { studentId, courseId: week.courseId, weekId },
    {
      assignmentCompleted: true
    },
    { upsert: true, new: true }
  );
  
  res.json({
    success: true,
    data: weekProgress
  });
});

// Helper function to update week progress
async function updateWeekProgress(studentId: string, courseId: string, weekId: string) {
  const week = await Week.findById(weekId);
  if (!week) return;
  
  const completedMaterials = await StudentProgress.countDocuments({
    studentId,
    courseId,
    weekId,
    status: 'completed'
  });
  
  const totalMaterials = week.materials.length;
  const progressPercentage = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;
  
  const weekProgress = await WeekProgress.findOneAndUpdate(
    { studentId, courseId, weekId },
    {
      studentId,
      courseId,
      weekId,
      materialsCompleted: completedMaterials,
      totalMaterials,
      progressPercentage,
      weekCompleted: progressPercentage >= 100
    },
    { upsert: true, new: true }
  );
  
  return weekProgress;
}

// Sync progress data with server
export const syncProgressWithServer = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { progressData } = req.body;
  const studentId = req.user?.id;
  
  if (!studentId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }
  
  try {
    // If progressData is provided, update local progress
    if (progressData && Array.isArray(progressData)) {
      for (const progress of progressData) {
        await StudentProgress.findOneAndUpdate(
          { 
            studentId, 
            courseId, 
            weekId: progress.weekId, 
            materialId: progress.materialId 
          },
          {
            studentId,
            courseId,
            weekId: progress.weekId,
            materialId: progress.materialId,
            timeSpent: progress.timeSpent || 0,
            status: progress.status || 'in_progress',
            lastAccessed: new Date(),
            ...(progress.completedAt && { completedAt: progress.completedAt })
          },
          { upsert: true, new: true }
        );
        
        // Update week progress if material is completed
        if (progress.status === 'completed') {
          await updateWeekProgress(studentId, courseId, progress.weekId);
        }
      }
    }
    
    // Return current progress state
    const weekProgresses = await WeekProgress.find({ studentId, courseId })
      .populate('weekId', 'title weekNumber startDate endDate')
      .sort({ 'weekId.weekNumber': 1 });
    
    const materialProgresses = await StudentProgress.find({ studentId, courseId })
      .populate('weekId', 'title weekNumber')
      .sort({ completedAt: -1 });
    
    res.json({
      success: true,
      data: {
        weekProgresses,
        materialProgresses,
        syncedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error syncing progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync progress'
    });
  }
});