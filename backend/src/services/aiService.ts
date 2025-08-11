import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// AI Service for various educational tasks
export class AIService {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  // Generate quiz questions from course content
  async generateQuizQuestions(
    courseContent: string,
    questionCount: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<any[]> {
    try {
      const prompt = `
        Based on the following course content, generate ${questionCount} multiple-choice quiz questions with ${difficulty} difficulty level.
        
        Course Content:
        ${courseContent}
        
        Please format the response as a JSON array with the following structure:
        [
          {
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A",
            "explanation": "Brief explanation of why this is correct",
            "difficulty": "${difficulty}",
            "points": 10
          }
        ]
        
        Make sure questions are relevant, clear, and test understanding of key concepts.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      try {
        const questions = JSON.parse(text);
        return Array.isArray(questions) ? questions : [];
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      throw new Error('Failed to generate quiz questions');
    }
  }

  // Grade essay/short answer questions
  async gradeEssayAnswer(
    question: string,
    studentAnswer: string,
    modelAnswer?: string,
    maxPoints: number = 10
  ): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    try {
      const prompt = `
        Grade the following student answer and provide constructive feedback.
        
        Question: ${question}
        Student Answer: ${studentAnswer}
        ${modelAnswer ? `Model Answer: ${modelAnswer}` : ''}
        Maximum Points: ${maxPoints}
        
        Please provide a JSON response with:
        {
          "score": number (0 to ${maxPoints}),
          "feedback": "Detailed feedback on the answer",
          "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
        }
        
        Consider accuracy, completeness, clarity, and understanding of concepts.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse grading response:', parseError);
        return {
          score: 0,
          feedback: 'Unable to grade answer automatically. Please review manually.',
          suggestions: ['Please review the answer manually']
        };
      }
    } catch (error) {
      console.error('Error grading essay answer:', error);
      throw new Error('Failed to grade essay answer');
    }
  }

  // Generate personalized learning recommendations
  async generateLearningRecommendations(
    userProfile: {
      completedCourses: string[];
      currentCourses: string[];
      interests: string[];
      skillLevel: string;
      learningGoals: string[];
    }
  ): Promise<{
    recommendedCourses: string[];
    learningPath: string[];
    studyTips: string[];
  }> {
    try {
      const prompt = `
        Based on the following user profile, provide personalized learning recommendations.
        
        User Profile:
        - Completed Courses: ${userProfile.completedCourses.join(', ')}
        - Current Courses: ${userProfile.currentCourses.join(', ')}
        - Interests: ${userProfile.interests.join(', ')}
        - Skill Level: ${userProfile.skillLevel}
        - Learning Goals: ${userProfile.learningGoals.join(', ')}
        
        Please provide a JSON response with:
        {
          "recommendedCourses": ["course 1", "course 2", "course 3"],
          "learningPath": ["step 1", "step 2", "step 3"],
          "studyTips": ["tip 1", "tip 2", "tip 3"]
        }
        
        Focus on progressive skill building and alignment with user goals.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse recommendations:', parseError);
        return {
          recommendedCourses: [],
          learningPath: [],
          studyTips: []
        };
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate learning recommendations');
    }
  }

  // Analyze student performance and provide insights
  async analyzeStudentPerformance(
    performanceData: {
      quizScores: number[];
      assignmentScores: number[];
      timeSpent: number; // in minutes
      coursesCompleted: number;
      strengths: string[];
      weaknesses: string[];
    }
  ): Promise<{
    overallAssessment: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    nextSteps: string[];
  }> {
    try {
      const prompt = `
        Analyze the following student performance data and provide insights.
        
        Performance Data:
        - Quiz Scores: ${performanceData.quizScores.join(', ')}
        - Assignment Scores: ${performanceData.assignmentScores.join(', ')}
        - Time Spent Learning: ${performanceData.timeSpent} minutes
        - Courses Completed: ${performanceData.coursesCompleted}
        - Identified Strengths: ${performanceData.strengths.join(', ')}
        - Identified Weaknesses: ${performanceData.weaknesses.join(', ')}
        
        Please provide a JSON response with:
        {
          "overallAssessment": "Overall performance summary",
          "strengths": ["strength 1", "strength 2"],
          "areasForImprovement": ["area 1", "area 2"],
          "recommendations": ["recommendation 1", "recommendation 2"],
          "nextSteps": ["step 1", "step 2"]
        }
        
        Provide constructive and actionable insights.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse performance analysis:', parseError);
        return {
          overallAssessment: 'Unable to analyze performance automatically.',
          strengths: [],
          areasForImprovement: [],
          recommendations: [],
          nextSteps: []
        };
      }
    } catch (error) {
      console.error('Error analyzing student performance:', error);
      throw new Error('Failed to analyze student performance');
    }
  }

  // Generate course content suggestions
  async generateCourseContent(
    topic: string,
    targetAudience: string,
    duration: number, // in hours
    learningObjectives: string[]
  ): Promise<{
    courseOutline: string[];
    lessons: Array<{
      title: string;
      duration: number;
      content: string;
      activities: string[];
    }>;
    assessments: string[];
  }> {
    try {
      const prompt = `
        Generate a comprehensive course structure for the following topic.
        
        Topic: ${topic}
        Target Audience: ${targetAudience}
        Duration: ${duration} hours
        Learning Objectives: ${learningObjectives.join(', ')}
        
        Please provide a JSON response with:
        {
          "courseOutline": ["module 1", "module 2", "module 3"],
          "lessons": [
            {
              "title": "Lesson title",
              "duration": 60,
              "content": "Lesson content overview",
              "activities": ["activity 1", "activity 2"]
            }
          ],
          "assessments": ["assessment 1", "assessment 2"]
        }
        
        Ensure content is appropriate for the target audience and achieves learning objectives.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse course content:', parseError);
        return {
          courseOutline: [],
          lessons: [],
          assessments: []
        };
      }
    } catch (error) {
      console.error('Error generating course content:', error);
      throw new Error('Failed to generate course content');
    }
  }

  // Grade assessment submission using AI
  async gradeAssessment(submissionId: string): Promise<any> {
    try {
      const AssessmentSubmission = require('../models/AssessmentSubmission').AssessmentSubmission;
      const Assessment = require('../models/Assessment').Assessment;

      const submission = await AssessmentSubmission.findById(submissionId)
        .populate('assessment')
        .populate('student', 'firstName lastName');

      if (!submission) {
        throw new Error('Submission not found');
      }

      const assessment = submission.assessment;
      const gradedAnswers = [];
      let requiresManualReview = false;

      // Grade each answer
      for (const answer of submission.answers) {
        const question = assessment.questions.find((q: any) => q.id === answer.questionId);
        if (!question) continue;

        let isCorrect = false;
        let pointsEarned = 0;
        let feedback = '';

        switch (question.type) {
          case 'multiple_choice':
          case 'true_false':
            isCorrect = answer.answer === question.correctAnswer;
            pointsEarned = isCorrect ? question.points : 0;
            feedback = isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`;
            break;

          case 'short_answer':
          case 'fill_in_blank':
            // Use AI to grade short answers
            const shortAnswerPrompt = `
              Grade this short answer question:
              Question: ${question.question}
              Correct Answer: ${question.correctAnswer}
              Student Answer: ${answer.answer}
              Points Possible: ${question.points}

              Provide a JSON response with:
              - isCorrect: boolean
              - pointsEarned: number (0 to ${question.points})
              - feedback: string (brief explanation)
            `;

            try {
              const result = await this.model.generateContent(shortAnswerPrompt);
              const response = await result.response;
              const gradeResult = JSON.parse(response.text());

              isCorrect = gradeResult.isCorrect;
              pointsEarned = Math.min(gradeResult.pointsEarned, question.points);
              feedback = gradeResult.feedback;
            } catch (aiError) {
              console.error('AI grading failed for short answer:', aiError);
              requiresManualReview = true;
              feedback = 'This answer requires manual review.';
            }
            break;

          case 'essay':
            // Essays require manual review but AI can provide initial feedback
            requiresManualReview = true;

            const essayPrompt = `
              Provide feedback on this essay answer:
              Question: ${question.question}
              Student Answer: ${answer.answer}

              Provide constructive feedback focusing on:
              - Content accuracy and relevance
              - Organization and structure
              - Grammar and clarity
              - Areas for improvement

              Keep feedback encouraging and specific.
            `;

            try {
              const result = await this.model.generateContent(essayPrompt);
              const response = await result.response;
              feedback = response.text();
            } catch (aiError) {
              feedback = 'This essay requires manual review and grading.';
            }
            break;

          case 'numerical':
          case 'calculation':
            // Check numerical answers with tolerance
            const studentNum = parseFloat(answer.answer);
            const correctNum = parseFloat(question.correctAnswer);
            const tolerance = 0.01; // 1% tolerance

            isCorrect = Math.abs(studentNum - correctNum) <= Math.abs(correctNum * tolerance);
            pointsEarned = isCorrect ? question.points : 0;
            feedback = isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`;
            break;

          default:
            requiresManualReview = true;
            feedback = 'This question type requires manual review.';
        }

        gradedAnswers.push({
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect,
          pointsEarned,
          feedback,
          timeSpent: answer.timeSpent
        });
      }

      // Update submission with graded answers
      submission.answers = gradedAnswers;
      submission.requiresManualReview = requiresManualReview;

      // Calculate total score
      const totalScore = gradedAnswers.reduce((sum: number, answer: any) => sum + answer.pointsEarned, 0);
      const percentage = Math.round((totalScore / assessment.totalPoints) * 100);

      // Generate overall feedback
      let overallFeedback = '';
      if (!requiresManualReview) {
        const feedbackPrompt = `
          Generate encouraging feedback for a student who scored ${percentage}% (${totalScore}/${assessment.totalPoints} points) on "${assessment.title}".

          Assessment type: ${assessment.type}

          Provide brief, constructive feedback that:
          - Acknowledges their effort
          - Highlights strengths if score is good
          - Suggests areas for improvement if needed
          - Encourages continued learning

          Keep it positive and motivating.
        `;

        try {
          const result = await this.model.generateContent(feedbackPrompt);
          const response = await result.response;
          overallFeedback = response.text();
        } catch (aiError) {
          overallFeedback = `You scored ${percentage}% on this assessment. Keep up the good work!`;
        }
      }

      submission.feedback = overallFeedback;

      // Grade the submission
      await submission.gradeSubmission('ai-system', true);

      // Enhanced AI grading with detailed feedback
      await this.generateDetailedFeedback(submission);

      return {
        success: true,
        score: totalScore,
        percentage,
        requiresManualReview,
        feedback: overallFeedback
      };

    } catch (error) {
      console.error('Assessment grading failed:', error);
      throw error;
    }
  }

  // Generate quiz questions from course notes
  async generateQuizFromNotes(courseNotes: string, difficulty: string = 'medium', questionCount: number = 10): Promise<any> {
    try {
      const prompt = `
        Based on the following course notes, generate ${questionCount} multiple choice quiz questions with difficulty level: ${difficulty}.

        Course Notes:
        ${courseNotes}

        For each question, provide:
        - question: The question text
        - options: Array of 4 possible answers
        - correctAnswer: The correct option
        - explanation: Brief explanation of why the answer is correct
        - difficulty: ${difficulty}
        - points: 1 for easy, 2 for medium, 3 for hard

        Return as JSON array of questions.
        Make questions that test understanding, not just memorization.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const questions = JSON.parse(response.text());

      return questions.map((q: any, index: number) => ({
        id: `q_${Date.now()}_${index}`,
        type: 'multiple_choice',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        points: q.points,
        section: 'A'
      }));

    } catch (error) {
      console.error('Quiz generation failed:', error);
      throw error;
    }
  }

  // AI Assistant for students
  async getAIAssistance(question: string, context?: string): Promise<string> {
    try {
      const prompt = `
        You are a helpful AI tutor assistant. A student is asking for help.

        Student Question: ${question}
        ${context ? `Context: ${context}` : ''}

        Provide a helpful, educational response that:
        - Explains concepts clearly
        - Gives examples when appropriate
        - Encourages learning and understanding
        - Is appropriate for a student level
        - Doesn't directly give answers to homework/tests

        Be encouraging and supportive in your response.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error: any) {
      console.error('AI assistance failed:', error);

      // Provide different responses based on error type
      if (error.message?.includes('overloaded') || error.message?.includes('503')) {
        return `I'm currently experiencing high demand and my AI service is temporarily overloaded. Here's what you can do:

📚 **Alternative Help Options:**
• Check your course materials and notes
• Review previous lessons and examples
• Try asking a more specific question in a few minutes
• Contact your instructor for direct assistance
• Use the platform's study resources

I'll be back to full capacity soon! Please try again in a few minutes.`;
      } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
        return `I've reached my usage limit for now, but don't worry! Here are other ways to get help:

🎯 **Study Resources Available:**
• Course content and materials
• Previous lesson examples
• Practice exercises
• Discussion forums
• Instructor office hours

Try asking your question again later, or explore these resources in the meantime!`;
      } else {
        return `I'm having trouble processing your question right now, but I'm here to help!

💡 **What you can do:**
• Try rephrasing your question
• Check your course materials for related information
• Ask a more specific question
• Contact your instructor for direct help

Please try again in a moment - I should be back to normal soon!`;
      }
    }
  }

  // Generate detailed feedback for assessment submissions
  async generateDetailedFeedback(submission: any): Promise<void> {
    try {
      const assessment = await mongoose.model('Assessment').findById(submission.assessment);
      if (!assessment) return;

      // Generate feedback for each answer
      for (const answer of submission.answers) {
        const question = assessment.questions.find((q: any) => q._id.toString() === answer.questionId);
        if (!question) continue;

        let prompt = '';

        switch (question.type) {
          case 'essay':
            prompt = `
              Evaluate this essay answer and provide detailed feedback:

              Question: ${question.question}
              Student Answer: ${answer.answer}
              Expected Answer/Rubric: ${question.correctAnswer || 'Not provided'}
              Points Possible: ${question.points}

              Please provide:
              1. Strengths of the answer
              2. Areas for improvement
              3. Specific suggestions for better responses
              4. Score justification
            `;
            break;

          case 'short_answer':
            prompt = `
              Evaluate this short answer and provide feedback:

              Question: ${question.question}
              Student Answer: ${answer.answer}
              Correct Answer: ${question.correctAnswer}
              Points Possible: ${question.points}

              Provide constructive feedback on accuracy and completeness.
            `;
            break;

          case 'mathematical':
            prompt = `
              Evaluate this mathematical answer:

              Question: ${question.question}
              Student Answer: ${answer.answer}
              Correct Answer: ${question.correctAnswer}
              Points Possible: ${question.points}

              Check for:
              1. Mathematical accuracy
              2. Proper notation and formatting
              3. Step-by-step reasoning (if shown)
              4. Alternative valid approaches
            `;
            break;

          default:
            continue;
        }

        if (prompt) {
          try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const feedback = response.text();

            // Update the answer with AI feedback
            const answerIndex = submission.answers.findIndex((a: any) => a.questionId === answer.questionId);
            if (answerIndex !== -1) {
              submission.answers[answerIndex].aiFeedback = feedback;
            }
          } catch (error) {
            console.error(`Error generating feedback for question ${question._id}:`, error);
          }
        }
      }

      // Generate overall assessment feedback
      const overallPrompt = `
        Based on this student's performance on the assessment "${assessment.title}", provide overall feedback:

        Total Score: ${submission.score}/${assessment.totalPoints}
        Percentage: ${submission.percentage}%

        Assessment Type: ${assessment.type}
        Number of Questions: ${assessment.questions.length}

        Provide:
        1. Overall performance summary
        2. Key strengths demonstrated
        3. Areas needing improvement
        4. Study recommendations for future assessments
        5. Encouragement and next steps
      `;

      const result = await this.model.generateContent(overallPrompt);
      const response = await result.response;
      const overallFeedback = response.text();
      submission.overallAiFeedback = overallFeedback;

      // Save the updated submission
      await submission.save();

    } catch (error) {
      console.error('Error generating detailed feedback:', error);
    }
  }

  // AI-powered proctoring analysis
  async analyzeProctoringData(proctoringData: any): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    analysis: string;
    recommendations: string[];
  }> {
    try {
      const { violations, warningCount, sessionDuration } = proctoringData;

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      const recommendations: string[] = [];

      // Analyze violation patterns
      const violationTypes = violations.map((v: any) => v.type);
      const highSeverityCount = violations.filter((v: any) => v.severity === 'high').length;
      const mediumSeverityCount = violations.filter((v: any) => v.severity === 'medium').length;

      // Determine risk level
      if (highSeverityCount >= 3 || warningCount >= 5) {
        riskLevel = 'high';
        recommendations.push('Manual review required');
        recommendations.push('Consider retake under stricter supervision');
      } else if (highSeverityCount >= 1 || mediumSeverityCount >= 3) {
        riskLevel = 'medium';
        recommendations.push('Review flagged sections');
        recommendations.push('Provide additional proctoring guidelines');
      }

      // Generate analysis prompt
      const analysisPrompt = `
        Analyze this proctoring session data:

        Total Violations: ${violations.length}
        Warning Count: ${warningCount}
        High Severity Violations: ${highSeverityCount}
        Medium Severity Violations: ${mediumSeverityCount}

        Violation Types: ${violationTypes.join(', ')}
        Session Duration: ${sessionDuration} minutes

        Provide a professional analysis of the student's behavior during the assessment,
        considering the context of online testing challenges and technical issues.
        Be fair and balanced in your assessment.
      `;

      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysis = response.text();

      return {
        riskLevel,
        analysis,
        recommendations
      };

    } catch (error) {
      console.error('Error analyzing proctoring data:', error);
      return {
        riskLevel: 'low',
        analysis: 'Unable to analyze proctoring data',
        recommendations: []
      };
    }
  }

  // Check if AI service is available (without making API calls)
  async isAvailable(): Promise<boolean> {
    try {
      // Just check if API key is configured, don't make actual API calls
      // to avoid 503 errors when service is overloaded
      const hasApiKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0);

      if (!hasApiKey) {
        console.log('AI service: No API key configured');
        return false;
      }

      console.log('AI service: API key configured, service considered available');
      return true;
    } catch (error) {
      console.error('AI service availability check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
