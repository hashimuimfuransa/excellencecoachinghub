import { Request, Response } from 'express';
import { PastPaper, PastPaperAttempt } from '../models';
import mongoose from 'mongoose';

// Get all past papers (admin)
export const getAllPastPapersAdmin = async (req: Request, res: Response) => {
  try {
    const {
      subject,
      level,
      year,
      examBoard,
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter: any = {};
    
    if (subject) filter.subject = subject;
    if (level) filter.level = level;
    if (year) filter.year = parseInt(year as string);
    if (examBoard) filter.examBoard = examBoard;
    if (status) filter.isPublished = status === 'published';
    if (search) {
      filter.$text = { $search: search as string };
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const pastPapers = await PastPaper.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await PastPaper.countDocuments(filter);

    res.json({
      success: true,
      data: {
        pastPapers,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
          totalItems: total,
          itemsPerPage: parseInt(limit as string)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching past papers (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch past papers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create past paper
export const createPastPaper = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const pastPaperData = {
      ...req.body,
      createdBy: userId
    };

    const pastPaper = new PastPaper(pastPaperData);
    await pastPaper.save();

    res.status(201).json({
      success: true,
      data: pastPaper,
      message: 'Past paper created successfully'
    });
  } catch (error) {
    console.error('Error creating past paper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create past paper',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update past paper
export const updatePastPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid past paper ID'
      });
    }

    const pastPaper = await PastPaper.findById(id);

    if (!pastPaper) {
      return res.status(404).json({
        success: false,
        message: 'Past paper not found'
      });
    }

    // Update past paper
    Object.assign(pastPaper, req.body);
    await pastPaper.save();

    res.json({
      success: true,
      data: pastPaper,
      message: 'Past paper updated successfully'
    });
  } catch (error) {
    console.error('Error updating past paper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update past paper',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete past paper
export const deletePastPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid past paper ID'
      });
    }

    const pastPaper = await PastPaper.findById(id);

    if (!pastPaper) {
      return res.status(404).json({
        success: false,
        message: 'Past paper not found'
      });
    }

    // Delete all attempts for this past paper
    await PastPaperAttempt.deleteMany({ pastPaper: id });

    // Delete the past paper
    await PastPaper.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Past paper deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting past paper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete past paper',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Publish past paper
export const publishPastPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid past paper ID'
      });
    }

    const pastPaper = await PastPaper.findById(id);

    if (!pastPaper) {
      return res.status(404).json({
        success: false,
        message: 'Past paper not found'
      });
    }

    if (pastPaper.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish past paper without questions. Please add questions to the past paper before publishing.'
      });
    }

    pastPaper.isPublished = true;
    pastPaper.publishedAt = new Date();
    pastPaper.approvedBy = userId;
    pastPaper.approvedAt = new Date();

    await pastPaper.save();

    res.json({
      success: true,
      data: pastPaper,
      message: 'Past paper published successfully'
    });
  } catch (error) {
    console.error('Error publishing past paper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish past paper',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Unpublish past paper
export const unpublishPastPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid past paper ID'
      });
    }

    const pastPaper = await PastPaper.findById(id);

    if (!pastPaper) {
      return res.status(404).json({
        success: false,
        message: 'Past paper not found'
      });
    }

    pastPaper.isPublished = false;
    pastPaper.publishedAt = undefined;

    await pastPaper.save();

    res.json({
      success: true,
      data: pastPaper,
      message: 'Past paper unpublished successfully'
    });
  } catch (error) {
    console.error('Error unpublishing past paper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpublish past paper',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get past paper statistics
export const getPastPaperStatistics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid past paper ID'
      });
    }

    const pastPaper = await PastPaper.findById(id);

    if (!pastPaper) {
      return res.status(404).json({
        success: false,
        message: 'Past paper not found'
      });
    }

    // Get attempt statistics
    const attempts = await PastPaperAttempt.find({ pastPaper: id, status: 'completed' });
    
    const totalAttempts = attempts.length;
    const averageScore = totalAttempts > 0 ? attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalAttempts : 0;
    const passRate = totalAttempts > 0 ? (attempts.filter(attempt => attempt.percentage >= 60).length / totalAttempts) * 100 : 0;

    // Get attempts by month
    const attemptsByMonth = attempts.reduce((acc: Record<string, number>, attempt) => {
      const month = new Date(attempt.createdAt).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // Get score distribution
    const scoreRanges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    attempts.forEach(attempt => {
      const score = attempt.percentage;
      if (score <= 20) scoreRanges['0-20']++;
      else if (score <= 40) scoreRanges['21-40']++;
      else if (score <= 60) scoreRanges['41-60']++;
      else if (score <= 80) scoreRanges['61-80']++;
      else scoreRanges['81-100']++;
    });

    // Get topic performance
    const topicPerformance: Record<string, { correct: number; total: number; percentage: number }> = {};
    
    attempts.forEach(attempt => {
      attempt.questionResults.forEach(qr => {
        if (qr.topic) {
          if (!topicPerformance[qr.topic]) {
            topicPerformance[qr.topic] = { correct: 0, total: 0, percentage: 0 };
          }
          topicPerformance[qr.topic].total++;
          if (qr.isCorrect) {
            topicPerformance[qr.topic].correct++;
          }
        }
      });
    });

    // Calculate percentages
    Object.keys(topicPerformance).forEach(topic => {
      const perf = topicPerformance[topic];
      perf.percentage = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
    });

    res.json({
      success: true,
      data: {
        pastPaper: {
          _id: pastPaper._id,
          title: pastPaper.title,
          subject: pastPaper.subject,
          level: pastPaper.level,
          year: pastPaper.year
        },
        statistics: {
          totalAttempts,
          averageScore: Math.round(averageScore * 100) / 100,
          passRate: Math.round(passRate * 100) / 100,
          attemptsByMonth,
          scoreRanges,
          topicPerformance
        }
      }
    });
  } catch (error) {
    console.error('Error fetching past paper statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch past paper statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all attempts for a past paper
export const getPastPaperAttempts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid past paper ID'
      });
    }

    const filter: any = { pastPaper: id };
    if (status) filter.status = status;

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const attempts = await PastPaperAttempt.find(filter)
      .populate('student', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await PastPaperAttempt.countDocuments(filter);

    res.json({
      success: true,
      data: {
        attempts,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
          totalItems: total,
          itemsPerPage: parseInt(limit as string)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching past paper attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch past paper attempts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get overall statistics
export const getOverallStatistics = async (req: Request, res: Response) => {
  try {
    const totalPastPapers = await PastPaper.countDocuments();
    const publishedPastPapers = await PastPaper.countDocuments({ isPublished: true });
    const totalAttempts = await PastPaperAttempt.countDocuments({ status: 'completed' });
    const totalStudents = await PastPaperAttempt.distinct('student').then(students => students.length);

    // Get past papers by subject
    const pastPapersBySubject = await PastPaper.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get past papers by level
    const pastPapersByLevel = await PastPaper.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get attempts by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const attemptsByMonth = await PastPaperAttempt.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo }, status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get average scores by subject
    const averageScoresBySubject = await PastPaperAttempt.aggregate([
      { $match: { status: 'completed' } },
      {
        $lookup: {
          from: 'pastpapers',
          localField: 'pastPaper',
          foreignField: '_id',
          as: 'pastPaperData'
        }
      },
      { $unwind: '$pastPaperData' },
      {
        $group: {
          _id: '$pastPaperData.subject',
          averageScore: { $avg: '$percentage' },
          totalAttempts: { $sum: 1 }
        }
      },
      { $sort: { averageScore: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalPastPapers,
          publishedPastPapers,
          totalAttempts,
          totalStudents
        },
        pastPapersBySubject,
        pastPapersByLevel,
        attemptsByMonth,
        averageScoresBySubject
      }
    });
  } catch (error) {
    console.error('Error fetching overall statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overall statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
