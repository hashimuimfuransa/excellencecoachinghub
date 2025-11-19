import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { User } from '../models/User';
import { AssignmentSubmission } from '../models/Assignment';
import { AssessmentSubmission } from '../models/AssessmentSubmission';
import Assignment from '../models/Assignment';
import Assessment from '../models/Assessment';

// Get leaderboard - using real data instead of mock
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('Leaderboard route called with query:', req.query);
    const { courseId, type, timeFilter, limit, level } = req.query;
    const limitNumber = parseInt(limit as string) || 50;

    // Get all students
    const students = await User.find({ role: 'student' }).select('firstName lastName email');
    const leaderboard: any[] = [];
    
    for (const student of students) {
      let totalScore = 0;
      let totalMaxScore = 0;
      let completedAssessments = 0;
      let completedAssignments = 0;
      let totalPoints = 0;
      
      // Track detailed assignment submissions
      const assignmentSubmissions: any[] = [];
      const assessmentSubmissions: any[] = [];
      
      // Get assessment scores
      if (!type || type === 'overall' || type === 'assessment') {
        let submissionQuery: any = {
          student: student._id,
          status: 'graded'
        };

        const assessmentSubmissionsData = await AssessmentSubmission.find(submissionQuery)
          .populate('assessment', 'title totalPoints course');
        
        for (const submission of assessmentSubmissionsData) {
          const assessment = submission.assessment as any;
          if (assessment) {
            // Filter by courseId if specified
            if (courseId && assessment.course?.toString() !== courseId) {
              continue;
            }
            
            const score = submission.score || 0;
            const maxScore = assessment.totalPoints || 100;
            
            totalScore += score;
            totalMaxScore += maxScore;
            completedAssessments++;
            totalPoints += score;
            
            // Add detailed submission info
            assessmentSubmissions.push({
              id: submission._id,
              title: assessment.title,
              score,
              maxScore,
              percentage: Math.round((score / maxScore) * 100),
              submittedAt: submission.submittedAt,
              type: 'assessment',
              courseId: assessment.course
            });
          }
        }
      }
      
      // Get assignment scores
      if (!type || type === 'overall' || type === 'assignment') {
        let submissionQuery: any = {
          student: student._id,
          status: 'graded'
        };

        submissionQuery = applyTimeFilter(submissionQuery, timeFilter as string);

        const assignmentSubmissionsData = await AssignmentSubmission.find(submissionQuery)
          .populate('assignment', 'title maxPoints course level language');
        
        for (const submission of assignmentSubmissionsData) {
          const assignment = submission.assignment as any;
          if (assignment) {
            // Filter by courseId if specified
            if (courseId && assignment.course?.toString() !== courseId) {
              continue;
            }
            
            // Filter by level if specified
            if (level && assignment.level !== level) {
              continue;
            }
            
            // Use either grade or autoGrade for the score
            const score = submission.grade || submission.autoGrade || 0;
            const maxScore = assignment.maxPoints || 100;
            
            totalScore += score;
            totalMaxScore += maxScore;
            completedAssignments++;
            totalPoints += score;
            
            // Add detailed submission info
            assignmentSubmissions.push({
              id: submission._id,
              homeworkId: submission.assignment._id || submission.assignment, // Get just the ID
              title: assignment.title,
              score,
              maxScore,
              percentage: Math.round((score / maxScore) * 100),
              submittedAt: submission.submittedAt || submission.gradedAt,
              type: 'assignment',
              courseId: assignment.course,
              level: assignment.level,
              language: assignment.language
            });
          }
        }
      }

      // Include all students, even those with no submissions
      const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      
      const entry: any = {
        rank: 0, // Will be set after sorting
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentEmail: student.email,
        totalScore,
        averageScore,
        completedAssessments,
        completedAssignments,
        totalPoints,
        badges: [] as string[],
        streak: Math.floor(Math.random() * 10), // Mock data - implement actual streak calculation
        improvement: Math.floor(Math.random() * 21) - 10, // Mock data - implement actual improvement calculation
        submissions: [...assignmentSubmissions, ...assessmentSubmissions] // Combined submissions
      };

      entry.badges = generateBadges(entry);
      leaderboard.push(entry);
    }

    // Sort by average score (descending) and assign ranks
    leaderboard.sort((a, b) => b.averageScore - a.averageScore);
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Apply limit
    const limitedLeaderboard = leaderboard.slice(0, limitNumber);

    // If no leaderboard data, return empty array with message
    if (limitedLeaderboard.length === 0) {
      res.json({ 
        success: true, 
        leaderboard: [], 
        message: 'No assessments or assignments have been completed yet. The leaderboard will populate once students start submitting their work.' 
      });
    } else {
      res.json({ success: true, leaderboard: limitedLeaderboard });
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
});

// Helper functions
const generateBadges = (entry: any): string[] => {
  const badges: string[] = [];
  
  if (entry.averageScore >= 95) badges.push('Top Performer');
  if (entry.averageScore >= 90) badges.push('Excellent Student');
  if (entry.streak >= 5) badges.push('Consistent Performer');
  if (entry.improvement > 10) badges.push('Most Improved');
  if (entry.completedAssessments >= 10) badges.push('Assessment Master');
  if (entry.completedAssignments >= 10) badges.push('Assignment Expert');
  
  return badges;
};

const applyTimeFilter = (query: any, timeFilter: string) => {
  const now = new Date();
  let startDate: Date;

  switch (timeFilter) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'semester':
      startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000); // ~4 months
      break;
    default:
      return query;
  }

  return {
    ...query,
    submittedAt: { $gte: startDate }
  };
};