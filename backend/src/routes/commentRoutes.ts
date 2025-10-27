import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { Comment } from '../models';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// @desc    Like/Unlike a comment
// @route   POST /api/comments/:id/like
// @access  Private
router.post('/:id/like', protect, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  
  // First check if user already liked the comment
  const comment = await Comment.findById(req.params.id);
  
  if (!comment) {
    res.status(404).json({
      success: false,
      error: 'Comment not found'
    });
    return;
  }
  
  const isLiked = comment.likes.includes(userId);
  let updatedComment;
  
  if (isLiked) {
    // Unlike the comment using atomic operations
    updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { likes: userId },
        $inc: { likesCount: -1 }
      },
      { new: true, runValidators: true }
    );
    
    // Ensure likesCount doesn't go below 0
    if (updatedComment && updatedComment.likesCount < 0) {
      await Comment.findByIdAndUpdate(
        req.params.id,
        { $set: { likesCount: 0 } },
        { new: true }
      );
      updatedComment.likesCount = 0;
    }
  } else {
    // Like the comment using atomic operations
    updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { likes: userId },
        $inc: { likesCount: 1 }
      },
      { new: true, runValidators: true }
    );
  }

  if (!updatedComment) {
    res.status(404).json({
      success: false,
      error: 'Comment not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      liked: !isLiked,
      likesCount: updatedComment.likesCount
    },
    message: !isLiked ? 'Comment liked' : 'Comment unliked'
  });
}));

// @desc    Unlike a comment (DELETE method for unlike)
// @route   DELETE /api/comments/:id/like
// @access  Private
router.delete('/:id/like', protect, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  
  const comment = await Comment.findById(req.params.id);
  
  if (!comment) {
    res.status(404).json({
      success: false,
      error: 'Comment not found'
    });
    return;
  }
  
  const isLiked = comment.likes.includes(userId);
  
  if (!isLiked) {
    res.status(400).json({
      success: false,
      error: 'Comment is not liked by this user'
    });
    return;
  }
  
  // Unlike the comment using atomic operations
  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { likes: userId },
      $inc: { likesCount: -1 }
    },
    { new: true, runValidators: true }
  );
  
  // Ensure likesCount doesn't go below 0
  if (updatedComment && updatedComment.likesCount < 0) {
    await Comment.findByIdAndUpdate(
      req.params.id,
      { $set: { likesCount: 0 } },
      { new: true }
    );
    updatedComment.likesCount = 0;
  }

  if (!updatedComment) {
    res.status(404).json({
      success: false,
      error: 'Comment not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      liked: false,
      likesCount: updatedComment.likesCount
    },
    message: 'Comment unliked'
  });
}));

// @desc    Get single comment details
// @route   GET /api/comments/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id)
    .populate('author', 'firstName lastName profilePicture');

  if (!comment) {
    res.status(404).json({
      success: false,
      error: 'Comment not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: comment
  });
}));

export default router;
