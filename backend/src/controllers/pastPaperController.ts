import { Request, Response } from 'express';
import { PastPaper, PastPaperAttempt } from '../models';
import mongoose from 'mongoose';

// Get all past papers (public)
export const getAllPastPapers = async (req: Request, res: Response) => {
  try {
    const {
      subject,
      level,
      year,
      examBoard,
      search,
      page = 1,
      limit = 10,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = req.query;

    const filter: any = { isPublished: true };
    
    if (subject) filter.subject = subject;
    if (level) filter.level = level;
    if (year) filter.year = parseInt(year as string);
    if (examBoard) filter.examBoard = examBoard;
    if (search) {
      filter.$text = { $search: search as string };
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const pastPapers = await PastPaper.find(filter)
      .populate('createdBy', 'firstName lastName')
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
    console.error('Error fetching past papers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch past papers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get past paper by ID (public)
export const getPastPaperById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid past paper ID'
      });
    }

    const pastPaper = await PastPaper.findById(id)
      .populate('createdBy', 'firstName lastName');

    if (!pastPaper) {
      return res.status(404).json({
        success: false,
        message: 'Past paper not found'
      });
    }

    if (!pastPaper.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Past paper is not published'
      });
    }

    res.json({
      success: true,
      data: pastPaper
    });
  } catch (error) {
    console.error('Error fetching past paper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch past paper',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get past paper questions (for taking exam)
export const getPastPaperQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { randomize = false } = req.query;

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

    if (!pastPaper.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Past paper is not published'
      });
    }

    let questions = [...pastPaper.questions];

    // Randomize questions if requested
    if (randomize === 'true' && pastPaper.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Randomize options if enabled
    if (pastPaper.randomizeOptions) {
      questions = questions.map(question => {
        if (question.options && question.options.length > 0) {
          const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
          return { ...question, options: shuffledOptions };
        }
        return question;
      });
    }

    res.json({
      success: true,
      data: {
        pastPaper: {
          _id: pastPaper._id,
          title: pastPaper.title,
          description: pastPaper.description,
          subject: pastPaper.subject,
          level: pastPaper.level,
          year: pastPaper.year,
          duration: pastPaper.duration,
          timeLimit: pastPaper.timeLimit,
          totalMarks: pastPaper.totalMarks,
          settings: {
            randomizeQuestions: pastPaper.randomizeQuestions,
            randomizeOptions: pastPaper.randomizeOptions,
            showResultsImmediately: pastPaper.showResultsImmediately,
            showCorrectAnswers: pastPaper.showCorrectAnswers,
            showExplanations: pastPaper.showExplanations,
            allowMultipleAttempts: pastPaper.allowMultipleAttempts,
            provideFeedback: pastPaper.provideFeedback,
            feedbackType: pastPaper.feedbackType
          }
        },
        questions
      }
    });
  } catch (error) {
    console.error('Error fetching past paper questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch past paper questions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Start past paper attempt
export const startPastPaperAttempt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { studentName, studentEmail } = req.body; // Optional student info for anonymous attempts

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

    if (!pastPaper.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Past paper is not published'
      });
    }

    // For anonymous attempts, we'll use a session-based identifier
    const sessionId = userId || `anonymous_${req.ip}_${Date.now()}`;
    
    // Check if multiple attempts are allowed (only for authenticated users)
    if (userId && !pastPaper.allowMultipleAttempts) {
      const existingAttempt = await PastPaperAttempt.findOne({
        student: userId,
        pastPaper: id,
        status: 'completed'
      });

      if (existingAttempt) {
        return res.status(400).json({
          success: false,
          message: 'Multiple attempts not allowed for this past paper'
        });
      }
    }

    // Get attempt number
    const attemptCount = await PastPaperAttempt.countDocuments({
      student: sessionId,
      pastPaper: id
    });

    const attempt = new PastPaperAttempt({
      student: sessionId,
      pastPaper: id,
      attemptNumber: attemptCount + 1,
      // Store anonymous student info if provided
      ...(userId ? {} : { 
        anonymousStudent: {
          name: studentName || 'Anonymous Student',
          email: studentEmail || null
        }
      }),
      maxScore: pastPaper.totalMarks,
      settings: {
        randomizeQuestions: pastPaper.randomizeQuestions,
        randomizeOptions: pastPaper.randomizeOptions,
        showResultsImmediately: pastPaper.showResultsImmediately,
        showCorrectAnswers: pastPaper.showCorrectAnswers,
        showExplanations: pastPaper.showExplanations,
        timeLimit: pastPaper.timeLimit || pastPaper.duration
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await attempt.save();

    res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        pastPaper: {
          _id: pastPaper._id,
          title: pastPaper.title,
          duration: pastPaper.duration,
          timeLimit: pastPaper.timeLimit || pastPaper.duration,
          totalMarks: pastPaper.totalMarks
        },
        settings: attempt.settings
      }
    });
  } catch (error) {
    console.error('Error starting past paper attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start past paper attempt',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Submit past paper attempt
export const submitPastPaperAttempt = async (req: Request, res: Response) => {
  try {
    const { attemptId } = req.params;
    const { answers, questionResults } = req.body;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attempt ID'
      });
    }

    // For anonymous users, we need to find the attempt by ID only
    // For authenticated users, we can also check the student field
    const query: any = {
      _id: attemptId,
      status: 'in_progress'
    };
    
    // Only add student filter for authenticated users
    if (userId) {
      query.student = userId;
    }
    
    const attempt = await PastPaperAttempt.findOne(query).populate('pastPaper');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found or already completed'
      });
    }

    // Update attempt with answers and results
    attempt.answers = answers;
    attempt.questionResults = questionResults;
    attempt.endTime = new Date();

    // Calculate score
    const totalScore = questionResults.reduce((sum: number, qr: any) => sum + qr.pointsEarned, 0);
    attempt.score = totalScore;
    attempt.percentage = (totalScore / attempt.maxScore) * 100;

    // Calculate statistics
    attempt.correctAnswers = questionResults.filter((qr: any) => qr.isCorrect).length;
    attempt.incorrectAnswers = questionResults.filter((qr: any) => !qr.isCorrect && qr.studentAnswer !== null).length;
    attempt.unansweredQuestions = questionResults.filter((qr: any) => qr.studentAnswer === null || qr.studentAnswer === undefined).length;

    // Analyze strengths and weaknesses
    const topicPerformance: Record<string, { correct: number; total: number }> = {};
    questionResults.forEach((qr: any) => {
      if (qr.topic) {
        if (!topicPerformance[qr.topic]) {
          topicPerformance[qr.topic] = { correct: 0, total: 0 };
        }
        topicPerformance[qr.topic].total++;
        if (qr.isCorrect) {
          topicPerformance[qr.topic].correct++;
        }
      }
    });

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(topicPerformance).forEach(([topic, perf]) => {
      const percentage = (perf.correct / perf.total) * 100;
      if (percentage >= 80) {
        strengths.push(topic);
      } else if (percentage < 60) {
        weaknesses.push(topic);
      }
    });

    attempt.strengths = strengths;
    attempt.weaknesses = weaknesses;

    // Submit the attempt
    await attempt.submitAttempt();

    // Update past paper statistics
    await PastPaper.findByIdAndUpdate(attempt.pastPaper, {
      $inc: { totalAttempts: 1 },
      $set: {
        averageScore: await PastPaperAttempt.getAverageScore(attempt.pastPaper._id)
      }
    });

    res.json({
      success: true,
      data: {
        attempt: {
          _id: attempt._id,
          score: attempt.score,
          percentage: attempt.percentage,
          gradeLetter: attempt.gradeLetter,
          correctAnswers: attempt.correctAnswers,
          incorrectAnswers: attempt.incorrectAnswers,
          unansweredQuestions: attempt.unansweredQuestions,
          timeSpent: attempt.timeSpent,
          feedback: attempt.feedback,
          recommendations: attempt.recommendations,
          strengths: attempt.strengths,
          weaknesses: attempt.weaknesses,
          questionResults: attempt.questionResults
        }
      }
    });
  } catch (error) {
    console.error('Error submitting past paper attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit past paper attempt',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get student's past paper attempts
export const getStudentAttempts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { pastPaperId } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const filter: any = { student: userId };
    if (pastPaperId) {
      filter.pastPaper = pastPaperId;
    }

    const attempts = await PastPaperAttempt.find(filter)
      .populate('pastPaper', 'title subject level year')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    console.error('Error fetching student attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student attempts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get student progress
export const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const progress = await PastPaperAttempt.getStudentProgress(userId);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get popular past papers
export const getPopularPastPapers = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const pastPapers = await PastPaper.getPopularPastPapers(parseInt(limit as string));

    res.json({
      success: true,
      data: pastPapers
    });
  } catch (error) {
    console.error('Error fetching popular past papers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular past papers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get recent past papers
export const getRecentPastPapers = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const pastPapers = await PastPaper.getRecentPastPapers(parseInt(limit as string));

    res.json({
      success: true,
      data: pastPapers
    });
  } catch (error) {
    console.error('Error fetching recent past papers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent past papers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Search past papers
export const searchPastPapers = async (req: Request, res: Response) => {
  try {
    const { q, subject, level, year, examBoard } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filter: any = { isPublished: true };
    
    if (subject) filter.subject = subject;
    if (level) filter.level = level;
    if (year) filter.year = parseInt(year as string);
    if (examBoard) filter.examBoard = examBoard;

    const pastPapers = await PastPaper.find({
      ...filter,
      $text: { $search: q as string }
    })
      .populate('createdBy', 'firstName lastName')
      .sort({ score: { $meta: 'textScore' } });

    res.json({
      success: true,
      data: pastPapers
    });
  } catch (error) {
    console.error('Error searching past papers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search past papers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
