import { Request, Response } from 'express';
import { Annotation } from '../models/Annotation';
import { asyncHandler } from '../middleware/asyncHandler';

// @desc    Save annotation
// @route   POST /api/annotations
// @access  Private
export const saveAnnotation = asyncHandler(async (req: Request, res: Response) => {
  const { documentId, materialId, weekId, annotation } = req.body;
  const userId = req.user._id;

  // Check if annotation already exists for this user and document
  const existingAnnotation = await Annotation.findOne({
    documentId,
    userId,
    materialId,
    weekId
  });

  if (existingAnnotation) {
    // Update existing annotation
    existingAnnotation.annotation = annotation;
    existingAnnotation.updatedAt = new Date();
    await existingAnnotation.save();

    res.status(200).json({
      success: true,
      data: existingAnnotation
    });
  } else {
    // Create new annotation
    const newAnnotation = await Annotation.create({
      documentId,
      materialId,
      weekId,
      userId,
      annotation,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: newAnnotation
    });
  }
});

// @desc    Get annotations for a document
// @route   GET /api/annotations/:documentId
// @access  Private
export const getAnnotations = asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const userId = req.user._id;

  const annotations = await Annotation.find({
    documentId,
    userId
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: annotations
  });
});

// @desc    Update annotation
// @route   PUT /api/annotations/:annotationId
// @access  Private
export const updateAnnotation = asyncHandler(async (req: Request, res: Response) => {
  const { annotationId } = req.params;
  const { annotation } = req.body;
  const userId = req.user._id;

  const existingAnnotation = await Annotation.findOne({
    _id: annotationId,
    userId
  });

  if (!existingAnnotation) {
    return res.status(404).json({
      success: false,
      error: 'Annotation not found'
    });
  }

  existingAnnotation.annotation = annotation;
  existingAnnotation.updatedAt = new Date();
  await existingAnnotation.save();

  res.status(200).json({
    success: true,
    data: existingAnnotation
  });
});

// @desc    Delete annotation
// @route   DELETE /api/annotations/:annotationId
// @access  Private
export const deleteAnnotation = asyncHandler(async (req: Request, res: Response) => {
  const { annotationId } = req.params;
  const userId = req.user._id;

  const annotation = await Annotation.findOneAndDelete({
    _id: annotationId,
    userId
  });

  if (!annotation) {
    return res.status(404).json({
      success: false,
      error: 'Annotation not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Annotation deleted successfully'
  });
});
