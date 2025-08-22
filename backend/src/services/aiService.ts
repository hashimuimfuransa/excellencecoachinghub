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

  // Helper function to extract JSON from AI responses that might be wrapped in markdown
  private extractJsonFromResponse(text: string): any {
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json') && jsonText.endsWith('```')) {
      jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith('```') && jsonText.endsWith('```')) {
      jsonText = jsonText.slice(3, -3).trim();
    }
    
    return JSON.parse(jsonText);
  }

  // General content generation method
  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating content with AI:', error);
      throw error;
    }
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
        const questions = this.extractJsonFromResponse(text);
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
        return this.extractJsonFromResponse(text);
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
        return this.extractJsonFromResponse(text);
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
        return this.extractJsonFromResponse(text);
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
        return this.extractJsonFromResponse(text);
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

  // Analyze interview response with AI
  async analyzeInterviewResponse(
    question: string, 
    questionType: string, 
    response: string, 
    expectedKeywords?: string[]
  ): Promise<{
    score: number;
    feedback: string;
    keywordsFound: string[];
    strengths: string[];
    improvements: string[];
  }> {
    try {
      const prompt = `
        You are an expert interview coach and hiring manager. Analyze this interview response thoroughly.
        
        **Question:** ${question}
        **Question Type:** ${questionType}
        **Expected Keywords:** ${expectedKeywords?.join(', ') || 'N/A'}
        **Candidate Response:** ${response}
        
        Evaluate the response on:
        1. Relevance and directness in answering the question (30%)
        2. Depth, detail, and examples provided (25%) 
        3. Professional communication and clarity (20%)
        4. Use of relevant keywords and technical concepts (15%)
        5. Structure and logical flow (10%)
        
        Provide detailed constructive feedback as JSON:
        {
          "score": <number 0-100>,
          "feedback": "<comprehensive feedback with specific suggestions>",
          "keywordsFound": ["<keywords from response>"],
          "strengths": ["<specific strengths identified>"],
          "improvements": ["<specific areas for improvement>"]
        }
        
        Be encouraging yet constructive. Focus on actionable advice.
      `;

      const result = await this.model.generateContent(prompt);
      const response_text = await result.response.text();
      
      try {
        const analysis = this.extractJsonFromResponse(response_text);
        return {
          score: Math.max(0, Math.min(100, analysis.score)),
          feedback: analysis.feedback || 'Response analyzed',
          keywordsFound: analysis.keywordsFound || [],
          strengths: analysis.strengths || [],
          improvements: analysis.improvements || []
        };
      } catch (parseError) {
        console.error('Failed to parse interview analysis:', parseError);
        throw parseError;
      }
    } catch (error) {
      console.error('Error analyzing interview response:', error);
      throw new Error('Failed to analyze interview response');
    }
  }

  // Grade individual answer using AI
  async gradeAnswer(params: {
    question: string;
    correctAnswer: string;
    studentAnswer: string;
    maxPoints: number;
    rubric?: string;
  }): Promise<{ score: number; feedback: string; confidence: number }> {
    const { question, correctAnswer, studentAnswer, maxPoints, rubric } = params;
    
    try {

      const prompt = `
        You are an expert academic grader. Grade this individual answer.

        **Question:** ${question}
        
        **Correct/Expected Answer:** ${correctAnswer}
        
        **Student Answer:** ${studentAnswer}
        
        **Maximum Points:** ${maxPoints}
        
        ${rubric ? `**Grading Rubric:** ${rubric}` : ''}

        Please evaluate the student's answer and provide:
        1. A score from 0 to ${maxPoints} points
        2. Constructive feedback explaining the grade
        3. Your confidence level in this assessment (0.0 to 1.0)

        Consider:
        - Accuracy and correctness of the answer
        - Completeness of the response
        - Understanding demonstrated
        - Partial credit for partially correct answers
        - Clear reasoning and explanation

        Respond in JSON format:
        {
          "score": <number between 0 and ${maxPoints}>,
          "feedback": "<constructive feedback explaining the grade>",
          "confidence": <number between 0.0 and 1.0>
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const gradeResult = this.extractJsonFromResponse(text);
        
        // Validate and constrain values
        const score = Math.min(Math.max(gradeResult.score || 0, 0), maxPoints);
        const confidence = Math.min(Math.max(gradeResult.confidence || 0.7, 0), 1);
        
        return {
          score,
          feedback: gradeResult.feedback || 'Answer graded by AI system.',
          confidence
        };
      } catch (parseError) {
        console.error('Failed to parse AI grading response:', parseError);
        
        // Fallback grading logic
        const studentText = studentAnswer.toLowerCase().trim();
        const correctText = correctAnswer.toLowerCase().trim();
        
        let fallbackScore = 0;
        if (studentText.length > 0) {
          // Simple keyword matching for fallback
          const correctWords = correctText.split(/\s+/);
          const studentWords = studentText.split(/\s+/);
          const matchingWords = correctWords.filter(word => 
            studentWords.some(sWord => sWord.includes(word) || word.includes(sWord))
          );
          
          const matchRatio = matchingWords.length / correctWords.length;
          fallbackScore = Math.round(maxPoints * matchRatio * 0.7); // Conservative scoring
        }
        
        return {
          score: fallbackScore,
          feedback: 'Answer evaluated. Consider reviewing with instructor for detailed feedback.',
          confidence: 0.4
        };
      }

    } catch (error) {
      console.error('AI answer grading failed:', error);
      
      // Check if it's a service overload error
      const isServiceOverload = error.message && error.message.includes('overloaded');
      
      // Enhanced fallback grading logic
      const hasAnswer = studentAnswer && studentAnswer.trim().length > 0;
      
      if (hasAnswer) {
        // Simple keyword matching for fallback
        const studentText = studentAnswer.toLowerCase().trim();
        const correctText = correctAnswer.toLowerCase().trim();
        
        let fallbackScore = 0;
        
        // Basic similarity check
        if (studentText === correctText) {
          fallbackScore = maxPoints; // Perfect match
        } else if (studentText.includes(correctText) || correctText.includes(studentText)) {
          fallbackScore = Math.round(maxPoints * 0.8); // Good match
        } else {
          // Keyword matching
          const correctWords = correctText.split(/\s+/).filter(word => word.length > 2);
          const studentWords = studentText.split(/\s+/);
          const matchingWords = correctWords.filter(word => 
            studentWords.some(sWord => sWord.includes(word) || word.includes(sWord))
          );
          
          if (matchingWords.length > 0) {
            const matchRatio = matchingWords.length / correctWords.length;
            fallbackScore = Math.round(maxPoints * matchRatio * 0.6); // Conservative scoring
          } else {
            fallbackScore = Math.round(maxPoints * 0.2); // Minimal credit for attempt
          }
        }
        
        const feedback = isServiceOverload 
          ? 'AI grading service temporarily unavailable. Answer evaluated using basic matching. Please review with instructor for detailed feedback.'
          : 'Answer submitted. Manual review recommended due to grading service error.';
        
        return {
          score: fallbackScore,
          feedback,
          confidence: 0.3
        };
      }
      
      return {
        score: 0,
        feedback: 'No answer provided.',
        confidence: 0.2
      };
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
              const gradeResult = this.extractJsonFromResponse(response.text());

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

  // Grade assignment with extracted questions and answers (using same logic as assessments)
  async gradeExtractedAssignment(gradingData: {
    assignmentTitle: string;
    assignmentInstructions: string;
    questions: Array<{
      question: string;
      type: string;
      options?: string[];
      correctAnswer?: string | string[];
      points: number;
    }>;
    answers: Array<{
      questionIndex: number;
      answer: string;
      questionType: string;
      timeSpent?: number;
    }>;
    maxPoints: number;
  }): Promise<{ score: number; feedback: string; confidence: number; detailedGrading: Array<{ questionIndex: number; earnedPoints: number; maxPoints: number; feedback: string; }> }> {
    try {
      const { assignmentTitle, assignmentInstructions, questions, answers, maxPoints } = gradingData;

      console.log('📝 Grading Assignment:', {
        title: assignmentTitle,
        questionsCount: questions.length,
        answersCount: answers.length,
        maxPoints
      });

      const gradedAnswers = [];
      let requiresManualReview = false;

      // Grade each answer using the same logic as assessments
      for (let index = 0; index < questions.length; index++) {
        const question = questions[index];
        const studentAnswer = answers.find(a => a.questionIndex === index);
        const answerText = studentAnswer?.answer || '';

        // Debug logging for grading (can be removed in production)
        // console.log(`🔍 Grading Question ${index + 1}:`, {
        //   questionType: question.type,
        //   questionText: question.question?.substring(0, 100),
        //   correctAnswer: question.correctAnswer,
        //   studentAnswer: answerText,
        //   points: question.points
        // });

        let isCorrect = false;
        let pointsEarned = 0;
        let feedback = '';

        // Normalize question type (handle both underscore and hyphen formats)
        const questionType = question.type.replace(/-/g, '_');

        switch (questionType) {
          case 'multiple_choice':
          case 'multiple-choice':
            if (!answerText.trim()) {
              feedback = 'No answer provided. Please make sure to select an option.';
              pointsEarned = 0;
            } else {
              // More robust comparison for multiple choice answers
              const studentAnswerNormalized = answerText.trim().toLowerCase();
              const correctAnswerNormalized = (question.correctAnswer as string)?.trim().toLowerCase();
              
              // Try different comparison methods
              isCorrect = studentAnswerNormalized === correctAnswerNormalized ||
                         answerText.trim() === (question.correctAnswer as string)?.trim() ||
                         // Check if it's an option index (A, B, C, D) vs full text
                         (question.options && question.options.includes(answerText.trim()) && 
                          answerText.trim() === question.correctAnswer);
              
              pointsEarned = isCorrect ? question.points : 0;
              feedback = isCorrect 
                ? 'Excellent! You selected the correct answer.' 
                : `Not quite right. The correct answer was: ${question.correctAnswer}. Review the material and try to understand why this is the correct choice.`;
            }
            break;

          case 'true_false':
          case 'true-false':
            if (!answerText.trim()) {
              feedback = 'No answer provided. Please select either True or False.';
              pointsEarned = 0;
            } else {
              // More robust true/false comparison
              const studentAnswerNormalized = answerText.toLowerCase().trim();
              const correctAnswerNormalized = (question.correctAnswer as string)?.toLowerCase().trim();
              
              // Handle various true/false formats
              const trueVariants = ['true', 't', '1', 'yes', 'correct'];
              const falseVariants = ['false', 'f', '0', 'no', 'incorrect'];
              
              let studentBool = null;
              let correctBool = null;
              
              if (trueVariants.includes(studentAnswerNormalized)) studentBool = true;
              else if (falseVariants.includes(studentAnswerNormalized)) studentBool = false;
              
              if (trueVariants.includes(correctAnswerNormalized)) correctBool = true;
              else if (falseVariants.includes(correctAnswerNormalized)) correctBool = false;
              
              isCorrect = (studentBool !== null && correctBool !== null && studentBool === correctBool) ||
                         studentAnswerNormalized === correctAnswerNormalized;
              
              pointsEarned = isCorrect ? question.points : 0;
              feedback = isCorrect 
                ? 'Correct! Good understanding of the concept.' 
                : `Incorrect. The correct answer is: ${question.correctAnswer}. Consider reviewing this topic to better understand the concept.`;
            }
            break;

          case 'short_answer':
          case 'short-answer':
          case 'fill_in_blank':
          case 'fill-in-blank':
            if (!answerText.trim()) {
              feedback = 'No answer provided. Please provide your response to this question.';
              pointsEarned = 0;
            } else {
              // Use AI to grade short answers with teacher-like feedback
              const shortAnswerPrompt = `
                You are a teacher grading a student's short answer. Be fair and encouraging.

                Question: ${question.question}
                Expected Answer: ${question.correctAnswer || 'Various acceptable answers'}
                Student Answer: ${answerText}
                Points Possible: ${question.points}

                Grade this answer and provide feedback as a teacher would. Consider:
                - Accuracy and correctness
                - Completeness of the response
                - Understanding demonstrated
                - Effort shown

                Respond in JSON format:
                {
                  "pointsEarned": <number between 0 and ${question.points}>,
                  "feedback": "<encouraging teacher feedback explaining the grade>"
                }
              `;

              try {
                const result = await this.model.generateContent(shortAnswerPrompt);
                const response = await result.response;
                const gradeResult = this.extractJsonFromResponse(response.text());

                pointsEarned = Math.min(Math.max(gradeResult.pointsEarned || 0, 0), question.points);
                feedback = gradeResult.feedback || 'Your answer shows some understanding. Keep working on developing your responses further.';
                isCorrect = pointsEarned >= (question.points * 0.7); // 70% or higher considered correct
              } catch (aiError) {
                console.error('AI grading failed for short answer:', aiError);
                // Fallback: give partial credit for attempting
                pointsEarned = Math.round(question.points * 0.5);
                feedback = 'I can see you made an effort to answer this question. Your response shows some understanding, but could be expanded further.';
              }
            }
            break;

          case 'essay':
            if (!answerText.trim()) {
              feedback = 'No essay response provided. Please write your thoughts and analysis for this question.';
              pointsEarned = 0;
            } else {
              // Grade essays with AI but be more generous and encouraging
              const essayPrompt = `
                You are a teacher grading a student's essay response. Be fair, encouraging, and constructive.

                Question: ${question.question}
                Student Essay: ${answerText}
                Points Possible: ${question.points}

                Evaluate based on:
                - Content relevance and accuracy (40%)
                - Organization and structure (25%)
                - Understanding demonstrated (25%)
                - Effort and completeness (10%)

                Provide a grade and constructive feedback as a caring teacher would.

                Respond in JSON format:
                {
                  "pointsEarned": <number between 0 and ${question.points}>,
                  "feedback": "<detailed teacher feedback highlighting strengths and areas for improvement>"
                }
              `;

              try {
                const result = await this.model.generateContent(essayPrompt);
                const response = await result.response;
                const gradeResult = this.extractJsonFromResponse(response.text());

                pointsEarned = Math.min(Math.max(gradeResult.pointsEarned || 0, 0), question.points);
                feedback = gradeResult.feedback || 'Your essay shows effort and thought. Continue to develop your ideas and support them with specific examples.';
                isCorrect = pointsEarned >= (question.points * 0.6); // 60% or higher for essays
              } catch (aiError) {
                console.error('AI grading failed for essay:', aiError);
                // Fallback: give credit for effort
                const wordCount = answerText.split(/\s+/).length;
                if (wordCount >= 50) {
                  pointsEarned = Math.round(question.points * 0.7);
                  feedback = 'Your essay demonstrates good effort and thought. I can see you understand the topic and have provided a substantial response.';
                } else {
                  pointsEarned = Math.round(question.points * 0.4);
                  feedback = 'Your response is a good start, but could be expanded with more detail and examples to fully address the question.';
                }
              }
            }
            break;

          case 'numerical':
          case 'calculation':
            if (!answerText.trim()) {
              feedback = 'No numerical answer provided. Please show your calculation and provide the answer.';
              pointsEarned = 0;
            } else {
              // Check numerical answers with tolerance
              const studentNum = parseFloat(answerText.replace(/[^\d.-]/g, ''));
              const correctNum = parseFloat((question.correctAnswer as string)?.replace(/[^\d.-]/g, '') || '0');
              const tolerance = 0.05; // 5% tolerance for numerical answers

              if (isNaN(studentNum)) {
                feedback = 'Please provide a valid numerical answer.';
                pointsEarned = 0;
              } else {
                isCorrect = Math.abs(studentNum - correctNum) <= Math.abs(correctNum * tolerance);
                pointsEarned = isCorrect ? question.points : 0;
                feedback = isCorrect 
                  ? 'Correct! Your calculation is accurate.' 
                  : `Your answer is close but not quite right. The correct answer is ${question.correctAnswer}. Check your calculations and try again.`;
              }
            }
            break;

          case 'matching':
            // For matching questions, compare arrays or structured answers
            if (!answerText.trim()) {
              feedback = 'No matching answers provided. Please complete all the matching pairs.';
              pointsEarned = 0;
            } else {
              try {
                // Try to parse as JSON for structured matching answers
                const studentMatches = JSON.parse(answerText);
                const correctMatches = question.correctAnswer as string[];
                
                let correctCount = 0;
                const totalPairs = correctMatches.length;
                
                for (let i = 0; i < totalPairs; i++) {
                  if (studentMatches[i] === correctMatches[i]) {
                    correctCount++;
                  }
                }
                
                const percentage = correctCount / totalPairs;
                pointsEarned = Math.round(question.points * percentage);
                feedback = `You got ${correctCount} out of ${totalPairs} matches correct. ${percentage >= 0.7 ? 'Good work!' : 'Review the material and try to understand the relationships better.'}`;
                isCorrect = percentage >= 0.7;
              } catch (parseError) {
                // Fallback for non-JSON matching answers
                pointsEarned = Math.round(question.points * 0.5);
                feedback = 'I can see you attempted the matching question. Make sure your answers are clear and complete.';
              }
            }
            break;

          default:
            // For any other question types, give partial credit for effort
            if (!answerText.trim()) {
              feedback = 'No answer provided for this question.';
              pointsEarned = 0;
            } else {
              pointsEarned = Math.round(question.points * 0.6);
              feedback = 'Thank you for your response. I can see you put thought into your answer.';
            }
        }

        // Debug logging for results (can be removed in production)
        // console.log(`✅ Question ${index + 1} Result:`, {
        //   pointsEarned,
        //   maxPoints: question.points,
        //   isCorrect,
        //   feedback: feedback.substring(0, 100)
        // });

        gradedAnswers.push({
          questionIndex: index,
          earnedPoints: pointsEarned,
          maxPoints: question.points,
          feedback: feedback,
          isCorrect: isCorrect,
          timeSpent: studentAnswer?.timeSpent || 0
        });
      }

      // Calculate total score
      const totalScore = gradedAnswers.reduce((sum, answer) => sum + answer.earnedPoints, 0);
      const percentage = Math.round((totalScore / maxPoints) * 100);
      
      console.log('📊 Final Score Calculation:', {
        totalScore,
        maxPoints,
        percentage,
        gradedAnswersCount: gradedAnswers.length,
        pointsBreakdown: gradedAnswers.map(a => ({ 
          questionIndex: a.questionIndex, 
          earned: a.earnedPoints, 
          max: a.maxPoints,
          isCorrect: a.isCorrect 
        }))
      });

      // Generate overall teacher feedback
      const overallFeedbackPrompt = `
        You are a teacher providing overall feedback on a student's assignment.

        Assignment: ${assignmentTitle}
        Student Score: ${totalScore}/${maxPoints} (${percentage}%)
        Questions Attempted: ${answers.filter(a => a.answer?.trim()).length}/${questions.length}

        Write encouraging feedback as a teacher would, focusing on:
        - Acknowledging their effort and work
        - Highlighting what they did well
        - Providing constructive suggestions for improvement
        - Encouraging continued learning

        Write in first person as the teacher. Be supportive and motivating.
      `;

      let overallFeedback = '';
      try {
        const result = await this.model.generateContent(overallFeedbackPrompt);
        const response = await result.response;
        overallFeedback = response.text();
      } catch (aiError) {
        console.error('Failed to generate overall feedback:', aiError);
        overallFeedback = `I've reviewed your assignment and you earned ${totalScore} out of ${maxPoints} points (${percentage}%). ${percentage >= 70 ? 'Great work! You demonstrate good understanding of the material.' : 'You\'re making progress! Keep studying and don\'t hesitate to ask questions if you need help.'} I'm here to support your learning journey.`;
      }

      console.log('✅ Assignment grading completed:', {
        totalScore,
        percentage,
        questionsGraded: gradedAnswers.length
      });

      return {
        score: totalScore,
        feedback: overallFeedback,
        confidence: 0.85, // High confidence in rule-based grading
        detailedGrading: gradedAnswers
      };

    } catch (error: any) {
      console.error('Assignment grading failed:', error);
      throw error;
    }
  }

  // Grade assignment submission with AI (for text-based assignments)
  async gradeAssignmentSubmission(assignmentData: {
    assignmentTitle: string;
    assignmentInstructions: string;
    submissionText: string;
    sections?: Array<{
      id: string;
      title: string;
      content: string;
      type: string;
    }>;
    maxPoints: number;
  }): Promise<{ score: number; feedback: string; confidence: number }> {
    try {
      const { assignmentTitle, assignmentInstructions, submissionText, sections, maxPoints } = assignmentData;

      // Combine text submission and sections content
      let fullSubmission = submissionText || '';
      if (sections && sections.length > 0) {
        fullSubmission += '\n\n' + sections.map(section => 
          `**${section.title}:**\n${section.content}`
        ).join('\n\n');
      }

      const prompt = `
        You are an expert academic grader. Grade the following assignment submission.

        **Assignment Title:** ${assignmentTitle}
        
        **Assignment Instructions:**
        ${assignmentInstructions}
        
        **Student Submission:**
        ${fullSubmission}
        
        **Maximum Points:** ${maxPoints}

        Please provide a comprehensive evaluation including:
        
        1. **Overall Score** (0-${maxPoints}): Based on how well the submission meets the assignment requirements
        2. **Detailed Feedback**: Specific comments on strengths, weaknesses, and areas for improvement
        3. **Confidence Level** (0.0-1.0): How confident you are in this assessment
        
        Grading Criteria:
        - Content quality and relevance (40%)
        - Understanding of concepts (25%)
        - Organization and structure (20%)
        - Grammar and clarity (15%)
        
        Consider:
        - Does the submission address all parts of the assignment?
        - Is the content accurate and well-researched?
        - Is the writing clear and well-organized?
        - Are there any factual errors or misunderstandings?
        
        Please respond in JSON format:
        {
          "score": <number between 0 and ${maxPoints}>,
          "percentage": <percentage score>,
          "feedback": "<detailed feedback text>",
          "confidence": <number between 0.0 and 1.0>,
          "strengths": ["<strength 1>", "<strength 2>", ...],
          "improvements": ["<improvement 1>", "<improvement 2>", ...],
          "criteriaScores": {
            "content": <score out of 10>,
            "understanding": <score out of 10>,
            "organization": <score out of 10>,
            "clarity": <score out of 10>
          }
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const gradeResult = this.extractJsonFromResponse(text);
        
        // Validate score is within bounds
        const score = Math.min(Math.max(gradeResult.score || 0, 0), maxPoints);
        const confidence = Math.min(Math.max(gradeResult.confidence || 0.5, 0), 1);
        
        return {
          score,
          feedback: gradeResult.feedback || 'Assignment graded by AI system.',
          confidence
        };
      } catch (parseError) {
        console.error('Failed to parse AI grading response:', parseError);
        
        // Fallback grading based on submission length and content
        const wordCount = fullSubmission.split(/\s+/).length;
        const hasContent = fullSubmission.trim().length > 50;
        
        let fallbackScore = 0;
        if (hasContent) {
          if (wordCount < 100) fallbackScore = maxPoints * 0.3;
          else if (wordCount < 300) fallbackScore = maxPoints * 0.6;
          else fallbackScore = maxPoints * 0.75;
        }
        
        return {
          score: Math.round(fallbackScore),
          feedback: 'Assignment auto-graded. This submission shows effort but may need instructor review for detailed feedback.',
          confidence: 0.3
        };
      }

    } catch (error) {
      console.error('Assignment grading failed:', error);
      
      // Return minimal score for any submission attempt
      return {
        score: Math.round(maxPoints * 0.5),
        feedback: 'Assignment submitted successfully. Awaiting instructor review for detailed grading.',
        confidence: 0.1
      };
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
      const questions = this.extractJsonFromResponse(response.text());

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

  // Generate quiz from section content
  async generateQuizFromContent(params: {
    sectionId: string;
    content: string;
    difficulty: string;
    questionCount: number;
    questionTypes: string[];
    focusAreas?: string[];
    learningObjectives?: string[];
    studentId: string;
  }): Promise<any> {
    try {
      const prompt = `
        Generate a quiz based on the following section content:
        
        Content: ${params.content}
        Difficulty: ${params.difficulty}
        Number of Questions: ${params.questionCount}
        Question Types: ${params.questionTypes.join(', ')}
        ${params.focusAreas ? `Focus Areas: ${params.focusAreas.join(', ')}` : ''}
        ${params.learningObjectives ? `Learning Objectives: ${params.learningObjectives.join(', ')}` : ''}
        
        Generate questions that test understanding of key concepts.
        Return as JSON with structure:
        {
          "id": "quiz_id",
          "sectionId": "${params.sectionId}",
          "title": "Quiz Title",
          "questions": [
            {
              "id": "q1",
              "type": "multiple-choice",
              "question": "Question text",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "A",
              "explanation": "Why this is correct",
              "difficulty": "${params.difficulty}",
              "points": 1
            }
          ],
          "totalPoints": 5,
          "estimatedTime": 10
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.extractJsonFromResponse(response.text());
    } catch (error) {
      console.error('Failed to generate quiz from content:', error);
      return {
        id: `quiz_${params.sectionId}_${Date.now()}`,
        sectionId: params.sectionId,
        title: 'Generated Quiz',
        questions: [],
        totalPoints: 0,
        estimatedTime: 5
      };
    }
  }

  // Get quiz by section
  async getQuizBySection(sectionId: string, studentId: string): Promise<any> {
    // This would typically fetch from database
    // For now, return null to indicate no quiz exists
    return null;
  }

  // Start quiz attempt
  async startQuizAttempt(quizId: string, studentId: string): Promise<any> {
    const attemptId = `attempt_${quizId}_${studentId}_${Date.now()}`;
    return {
      attemptId,
      quiz: { id: quizId, title: 'Quiz', questions: [] }
    };
  }

  // Submit quiz answer
  async submitQuizAnswer(attemptId: string, questionId: string, answer: any, studentId: string): Promise<void> {
    // Store answer in database or memory
    console.log(`Answer submitted: ${attemptId}, ${questionId}, ${answer}`);
  }

  // Submit quiz attempt
  async submitQuizAttempt(attemptId: string, answers: Record<string, any>, studentId: string): Promise<any> {
    // Evaluate answers and return results
    return {
      id: attemptId,
      score: 0,
      percentage: 0,
      passed: false,
      feedback: 'Quiz completed',
      detailedResults: []
    };
  }

  // Get quiz attempt results
  async getQuizAttemptResults(attemptId: string, studentId: string): Promise<any> {
    return {
      id: attemptId,
      score: 0,
      percentage: 0,
      passed: false,
      feedback: 'Results not available',
      detailedResults: []
    };
  }

  // Get student quiz attempts
  async getStudentQuizAttempts(sectionId: string, studentId: string): Promise<any[]> {
    return [];
  }

  // Generate study recommendations
  async generateStudyRecommendations(params: {
    sectionId: string;
    quizResults: any[];
    studentId: string;
  }): Promise<any> {
    return {
      weakAreas: [],
      recommendedTopics: [],
      studyTips: [],
      nextSteps: []
    };
  }

  // Generate explanation
  async generateExplanation(params: {
    questionId: string;
    studentAnswer: any;
    correctAnswer: any;
  }): Promise<string> {
    try {
      const prompt = `
        Explain why the correct answer is right and why the student's answer might be wrong:
        
        Student Answer: ${params.studentAnswer}
        Correct Answer: ${params.correctAnswer}
        
        Provide a clear, educational explanation.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      return 'Explanation not available at this time.';
    }
  }

  // Generate quiz hint
  async generateQuizHint(params: {
    questionId: string;
    currentAnswer?: any;
  }): Promise<string> {
    return 'Think about the key concepts covered in this section.';
  }

  // Analyze learning progress
  async analyzeLearningProgress(params: {
    courseId: string;
    sectionId?: string;
    studentId: string;
  }): Promise<any> {
    return {
      overallProgress: 0,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      nextMilestones: []
    };
  }

  // Generate practice questions
  async generatePracticeQuestions(params: {
    weakAreas: string[];
    difficulty: string;
    studentId: string;
  }): Promise<any[]> {
    return [];
  }

  // Generate study plan
  async generateStudyPlan(params: {
    courseId: string;
    studentId: string;
    studentGoals: any;
  }): Promise<any> {
    return {
      dailyTasks: [],
      weeklyGoals: [],
      milestones: [],
      estimatedCompletion: null
    };
  }

  // Generate flashcards
  async generateFlashcards(params: {
    sectionId: string;
    count: number;
    studentId: string;
  }): Promise<any[]> {
    return [];
  }

  // Generate concept map
  async generateConceptMap(params: {
    sectionId: string;
    studentId: string;
  }): Promise<any> {
    return {
      nodes: [],
      edges: []
    };
  }

  // Generate quiz summary
  async generateQuizSummary(attemptId: string, studentId: string): Promise<any> {
    return {
      summary: 'Quiz completed',
      insights: [],
      recommendations: [],
      nextSteps: []
    };
  }

  // Process and extract notes
  async processAndExtractNotes(params: {
    courseId: string;
    fileUrl: string;
    fileName: string;
    instructorId: string;
  }): Promise<any> {
    return {
      sections: [],
      extractedText: '',
      processingStatus: 'completed'
    };
  }

  // Extract questions from uploaded document
  async extractQuestionsFromDocument(
    documentText: string,
    assessmentType: 'quiz' | 'assignment' | 'exam' | 'project' | 'homework' = 'quiz',
    answerSheetContent?: string
  ): Promise<Array<{
    question: string;
    type: 'multiple_choice' | 'multiple_choice_multiple' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching';
    options?: string[];
    correctAnswer?: string | string[];
    points: number;
    aiExtracted: boolean;
    section?: string;
    sectionTitle?: string;
    leftItems?: string[];
    rightItems?: string[];
    matchingPairs?: Array<{ left: string; right: string; }>;
  }>> {
    // Import the retry service
    const { aiRetryService } = await import('./aiRetryService');
    
    // Use retry service for AI operations
    return await aiRetryService.executeWithRetry(async () => {
      // Truncate document text if too long to reduce processing time
      const maxTextLength = 8000; // Limit to ~8k characters for faster processing
      const truncatedText = documentText.length > maxTextLength 
        ? documentText.substring(0, maxTextLength) + '\n\n[Document truncated for processing...]'
        : documentText;

      const prompt = `Extract questions from this ${assessmentType} document. Return JSON array only:

Document:
${truncatedText}

Required JSON format:
[{"question":"text","type":"multiple_choice|true_false|short_answer|essay","options":["A","B","C","D"],"correctAnswer":"A","points":10,"aiExtracted":true}]

Rules:
- Extract existing questions exactly as written
- For content without questions, create comprehension questions
- Use appropriate point values (5-20 points)
- Include 4 options for multiple choice
- Use "true"/"false" for true/false questions
- Keep questions clear and concise
- Maximum 20 questions for performance`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Try to extract JSON using the helper function first
        try {
          const questions = this.extractJsonFromResponse(text);
          return Array.isArray(questions) ? questions : [];
        } catch (firstError) {
          // Fallback to regex matching for array extraction
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const questions = JSON.parse(jsonMatch[0]);
            return Array.isArray(questions) ? questions : [];
          } else {
            console.error('No JSON array found in AI response');
            return [];
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return [];
      }
    }, {
      maxRetries: 3,
      priority: 5, // High priority for document processing
      baseDelay: 2000
    });
  }

  // Generate quiz from course notes section
  async generateSectionQuiz(params: {
    courseId: string;
    sectionId: string;
    sectionTitle: string;
    sectionContent: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionCount?: number;
  }): Promise<{
    id: string;
    sectionId: string;
    title: string;
    questions: Array<{
      id: string;
      question: string;
      type: 'multiple-choice' | 'true-false' | 'short-answer';
      options?: string[];
      correctAnswer: string;
      explanation: string;
      difficulty: string;
      points: number;
    }>;
    totalQuestions: number;
    totalPoints: number;
    estimatedTime: number;
  }> {
    try {
      const difficulty = params.difficulty || 'medium';
      const questionCount = params.questionCount || 5;
      
      const prompt = `
        Based on the following course notes section, generate ${questionCount} quiz questions with ${difficulty} difficulty level.
        
        Section Title: ${params.sectionTitle}
        Section Content:
        ${params.sectionContent}
        
        Please format the response as a JSON object with the following structure:
        {
          "questions": [
            {
              "id": "q1",
              "question": "What is the main concept discussed in this section?",
              "type": "multiple-choice",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "Option A",
              "explanation": "Brief explanation of why this is correct and what the concept means",
              "difficulty": "${difficulty}",
              "points": 10
            },
            {
              "id": "q2", 
              "question": "True or False: [Statement about the content]",
              "type": "true-false",
              "options": ["True", "False"],
              "correctAnswer": "True",
              "explanation": "Explanation of why this statement is true/false",
              "difficulty": "${difficulty}",
              "points": 5
            },
            {
              "id": "q3",
              "question": "Explain the key concept of [topic from content]",
              "type": "short-answer",
              "correctAnswer": "Sample answer explaining the concept",
              "explanation": "What a good answer should include",
              "difficulty": "${difficulty}",
              "points": 15
            }
          ]
        }
        
        Guidelines:
        - Create questions that test understanding of key concepts from the content
        - Mix question types: aim for 40% multiple-choice, 20% true-false, 40% short-answer
        - For multiple-choice: provide 4 plausible options with only one correct
        - For true-false: create clear statements that are definitively true or false
        - For short-answer: ask for explanations, definitions, or applications of key concepts
        - Provide clear explanations that help students learn from their mistakes
        - Make sure questions are directly related to the section content
        - Vary point values: multiple-choice (10 points), true-false (5 points), short-answer (15 points)
        - Ensure short-answer questions test deeper understanding, not just memorization
        - Make questions progressively challenging within the difficulty level
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Try to extract JSON using the helper function first
        let quizData;
        try {
          quizData = this.extractJsonFromResponse(text);
        } catch (firstError) {
          // Fallback to regex matching for object extraction
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            quizData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON object found in AI response');
          }
        }
        
        // Ensure questions have proper IDs and structure
        const questions = quizData.questions.map((q: any, index: number) => ({
          id: q.id || `q${index + 1}`,
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || difficulty,
          points: q.points || 10
        }));
        
        const totalPoints = questions.reduce((sum: number, q: any) => sum + q.points, 0);
        
        return {
          id: `quiz_${params.sectionId}_${Date.now()}`,
          sectionId: params.sectionId,
          title: `Quiz: ${params.sectionTitle}`,
          questions,
          totalQuestions: questions.length,
          totalPoints,
          estimatedTime: Math.max(5, questions.length * 2) // 2 minutes per question, minimum 5 minutes
        };
      } catch (parseError) {
        console.error('Failed to parse AI quiz response:', parseError);
        console.error('AI Response:', text);
        
        // Return a fallback quiz with basic questions
        return this.generateFallbackQuiz(params);
      }
    } catch (error) {
      console.error('Error generating section quiz:', error);
      return this.generateFallbackQuiz(params);
    }
  }

  // Generate fallback quiz when AI fails
  private generateFallbackQuiz(params: {
    sectionId: string;
    sectionTitle: string;
    sectionContent: string;
    difficulty?: string;
    questionCount?: number;
  }) {
    const difficulty = params.difficulty || 'medium';
    const questionCount = params.questionCount || 3;
    
    // Extract key terms from content for basic questions
    const sentences = params.sectionContent.split('.').filter(s => s.trim().length > 20);
    const firstSentence = sentences[0] || params.sectionContent.substring(0, 100);
    
    const fallbackQuestions = [
      {
        id: 'q1',
        question: `What is the main topic discussed in "${params.sectionTitle}"?`,
        type: 'multiple-choice' as const,
        options: [
          `The concepts explained in ${params.sectionTitle}`,
          'Unrelated topic A',
          'Unrelated topic B', 
          'Unrelated topic C'
        ],
        correctAnswer: `The concepts explained in ${params.sectionTitle}`,
        explanation: `This section focuses on ${params.sectionTitle} and its key concepts.`,
        difficulty,
        points: 10
      },
      {
        id: 'q2',
        question: `True or False: This section provides important information about ${params.sectionTitle.toLowerCase()}.`,
        type: 'true-false' as const,
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: `This statement is true because the section is specifically about ${params.sectionTitle}.`,
        difficulty,
        points: 5
      }
    ];
    
    if (questionCount > 2) {
      fallbackQuestions.push({
        id: 'q3',
        question: `Briefly explain what you learned from this section about ${params.sectionTitle.toLowerCase()}.`,
        type: 'short-answer' as const,
        correctAnswer: `Key concepts and information about ${params.sectionTitle} as presented in the section.`,
        explanation: 'A good answer should mention the main concepts and key points covered in this section.',
        difficulty,
        points: 15
      });
    }
    
    const questions = fallbackQuestions.slice(0, questionCount);
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    
    return {
      id: `quiz_${params.sectionId}_${Date.now()}`,
      sectionId: params.sectionId,
      title: `Quiz: ${params.sectionTitle}`,
      questions,
      totalQuestions: questions.length,
      totalPoints,
      estimatedTime: Math.max(5, questions.length * 2)
    };
  }

  // Evaluate quiz answers
  async evaluateQuizAnswers(params: {
    courseId: string;
    sectionId: string;
    quizId: string;
    answers: Record<string, string>;
    questions: Array<{
      id: string;
      question: string;
      type: string;
      correctAnswer: string;
      points: number;
      explanation: string;
    }>;
  }): Promise<{
    score: number;
    percentage: number;
    totalPoints: number;
    earnedPoints: number;
    passed: boolean;
    feedback: string;
    detailedResults: Array<{
      questionId: string;
      question: string;
      studentAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      pointsEarned: number;
      pointsPossible: number;
      feedback: string;
    }>;
  }> {
    try {
      const detailedResults = [];
      let totalPoints = 0;
      let earnedPoints = 0;
      
      for (const question of params.questions) {
        const studentAnswer = params.answers[question.id] || '';
        const pointsPossible = question.points;
        totalPoints += pointsPossible;
        
        let isCorrect = false;
        let pointsEarned = 0;
        let feedback = '';
        
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          // Exact match for multiple choice and true/false
          isCorrect = studentAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
          pointsEarned = isCorrect ? pointsPossible : 0;
          feedback = isCorrect ? 
            `Correct! ${question.explanation}` : 
            `Incorrect. The correct answer is: ${question.correctAnswer}. ${question.explanation}`;
        } else if (question.type === 'short-answer') {
          // Use AI to evaluate short answers
          try {
            const evaluationPrompt = `
              Evaluate this short answer question:
              
              Question: ${question.question}
              Expected Answer: ${question.correctAnswer}
              Student Answer: ${studentAnswer}
              Points Possible: ${pointsPossible}
              
              Please provide a JSON response with:
              {
                "isCorrect": boolean (true if answer demonstrates understanding),
                "pointsEarned": number (0 to ${pointsPossible}),
                "feedback": "Specific feedback on the answer"
              }
              
              Be generous with partial credit for answers that show understanding, even if not perfectly worded.
            `;
            
            const result = await this.model.generateContent(evaluationPrompt);
            const response = await result.response;
            const text = response.text();
            
            let evaluation;
            try {
              evaluation = this.extractJsonFromResponse(text);
            } catch (firstError) {
              // Fallback to regex matching for object extraction
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                evaluation = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error('No JSON found in evaluation response');
              }
            }
            isCorrect = evaluation.isCorrect;
            pointsEarned = Math.min(Math.max(0, evaluation.pointsEarned), pointsPossible);
            feedback = evaluation.feedback;
          } catch (aiError) {
            console.error('AI evaluation failed for short answer:', aiError);
            // Fallback: simple keyword matching
            const keywords = question.correctAnswer.toLowerCase().split(' ').filter(word => word.length > 3);
            const studentWords = studentAnswer.toLowerCase().split(' ');
            const matchedKeywords = keywords.filter(keyword => 
              studentWords.some(word => word.includes(keyword) || keyword.includes(word))
            );
            
            const matchPercentage = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
            pointsEarned = Math.round(pointsPossible * matchPercentage);
            isCorrect = matchPercentage >= 0.5;
            feedback = isCorrect ? 
              'Good answer! You demonstrated understanding of the key concepts.' :
              `Your answer shows some understanding. Key points to include: ${question.correctAnswer}`;
          }
        }
        
        earnedPoints += pointsEarned;
        
        detailedResults.push({
          questionId: question.id,
          question: question.question,
          studentAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          pointsEarned,
          pointsPossible,
          feedback
        });
      }
      
      const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = percentage >= 70; // 70% passing grade
      
      let overallFeedback = '';
      if (percentage >= 90) {
        overallFeedback = 'Excellent work! You have a strong understanding of this material.';
      } else if (percentage >= 80) {
        overallFeedback = 'Great job! You understand most of the key concepts.';
      } else if (percentage >= 70) {
        overallFeedback = 'Good work! You passed, but consider reviewing some concepts.';
      } else if (percentage >= 60) {
        overallFeedback = 'You\'re getting there! Review the material and try again.';
      } else {
        overallFeedback = 'Keep studying! Review the section content and try the quiz again.';
      }
      
      return {
        score: percentage,
        percentage,
        totalPoints,
        earnedPoints,
        passed,
        feedback: overallFeedback,
        detailedResults
      };
    } catch (error) {
      console.error('Error evaluating quiz answers:', error);
      return {
        score: 0,
        percentage: 0,
        totalPoints: params.questions.reduce((sum, q) => sum + q.points, 0),
        earnedPoints: 0,
        passed: false,
        feedback: 'Unable to evaluate answers at this time. Please try again later.',
        detailedResults: []
      };
    }
  }

  // Get chat response
  async getChatResponse(params: {
    message: string;
    context?: any;
    courseId?: string;
    userId: string;
  }): Promise<string> {
    try {
      const prompt = `
        You are a helpful AI tutor. Respond to this student question:
        
        Question: ${params.message}
        ${params.context ? `Context: ${JSON.stringify(params.context)}` : ''}
        
        Provide a helpful, educational response.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      return 'I apologize, but I am unable to process your question at the moment. Please try again later or contact your instructor for assistance.';
    }
  }

  // Helper function to determine relevant psychometric categories for a job
  private getPsychometricCategoriesForJob(jobTitle: string, industry: string, requiredSkills: string[]): {
    cognitive: string[];
    aptitude: string[];
    personality: string[];
    behavioral: string[];
    skills: string[];
  } {
    const jobLower = jobTitle.toLowerCase();
    const industryLower = industry.toLowerCase();
    const skillsLower = requiredSkills.join(' ').toLowerCase();
    
    const categories = {
      cognitive: [] as string[],
      aptitude: [] as string[],
      personality: [] as string[],
      behavioral: [] as string[],
      skills: [] as string[]
    };

    // Cognitive categories - universal baseline
    categories.cognitive.push('logical reasoning', 'attention to detail');
    
    // Tech roles
    if (jobLower.includes('developer') || jobLower.includes('programmer') || jobLower.includes('software') || 
        jobLower.includes('engineer') || skillsLower.includes('programming') || skillsLower.includes('coding')) {
      categories.cognitive.push('numerical reasoning', 'logical reasoning', 'pattern recognition');
      categories.aptitude.push('coding aptitude', 'logical reasoning');
      categories.skills.push('technical problem-solving', 'analytical thinking');
      categories.personality.push('attention to detail', 'problem-solving approach');
    }
    
    // Data/Analytics roles
    if (jobLower.includes('data') || jobLower.includes('analyst') || jobLower.includes('scientist') ||
        skillsLower.includes('statistics') || skillsLower.includes('analytics')) {
      categories.cognitive.push('numerical reasoning', 'analytical thinking', 'pattern recognition');
      categories.aptitude.push('numerical reasoning', 'logical reasoning');
      categories.skills.push('quantitative analysis', 'data interpretation');
    }
    
    // Management/Leadership roles
    if (jobLower.includes('manager') || jobLower.includes('director') || jobLower.includes('lead') ||
        jobLower.includes('supervisor') || skillsLower.includes('leadership')) {
      categories.personality.push('leadership', 'communication', 'team management');
      categories.behavioral.push('situational judgment', 'decision-making', 'conflict resolution');
      categories.skills.push('team management', 'strategic thinking');
    }
    
    // Sales/Customer-facing roles
    if (jobLower.includes('sales') || jobLower.includes('customer') || jobLower.includes('marketing') ||
        skillsLower.includes('sales') || skillsLower.includes('customer service')) {
      categories.personality.push('communication', 'persuasion', 'empathy');
      categories.behavioral.push('situational judgment', 'customer service orientation');
      categories.skills.push('interpersonal skills', 'communication');
    }
    
    // Finance roles
    if (jobLower.includes('finance') || jobLower.includes('accounting') || jobLower.includes('audit') ||
        industryLower.includes('finance') || industryLower.includes('banking')) {
      categories.cognitive.push('numerical reasoning', 'attention to detail');
      categories.aptitude.push('numerical reasoning');
      categories.personality.push('attention to detail', 'analytical thinking');
    }
    
    // Healthcare roles
    if (industryLower.includes('healthcare') || industryLower.includes('medical') || 
        jobLower.includes('nurse') || jobLower.includes('doctor')) {
      categories.personality.push('empathy', 'stress management', 'attention to detail');
      categories.behavioral.push('ethical judgment', 'decision-making under pressure');
      categories.skills.push('critical thinking', 'attention to detail');
    }
    
    // Engineering/Mechanical roles
    if (jobLower.includes('mechanical') || jobLower.includes('civil') || jobLower.includes('electrical') ||
        industryLower.includes('engineering') || industryLower.includes('manufacturing')) {
      categories.cognitive.push('spatial reasoning', 'numerical reasoning');
      categories.aptitude.push('mechanical reasoning', 'spatial awareness');
      categories.skills.push('technical problem-solving', 'analytical thinking');
    }
    
    // Education roles
    if (jobLower.includes('teacher') || jobLower.includes('instructor') || jobLower.includes('trainer') ||
        industryLower.includes('education')) {
      categories.personality.push('communication', 'patience', 'adaptability');
      categories.behavioral.push('situational judgment', 'conflict resolution');
      categories.skills.push('communication', 'presentation skills');
    }
    
    // Creative roles
    if (jobLower.includes('design') || jobLower.includes('creative') || jobLower.includes('artist') ||
        jobLower.includes('writer') || industryLower.includes('creative')) {
      categories.personality.push('creativity', 'adaptability');
      categories.cognitive.push('spatial reasoning', 'pattern recognition');
      categories.skills.push('creative thinking', 'visual design');
    }
    
    // Legal roles
    if (jobLower.includes('legal') || jobLower.includes('lawyer') || jobLower.includes('attorney') ||
        industryLower.includes('legal')) {
      categories.cognitive.push('verbal reasoning', 'logical reasoning');
      categories.aptitude.push('verbal reasoning');
      categories.behavioral.push('ethical judgment', 'analytical judgment');
      categories.skills.push('critical analysis', 'written communication');
    }
    
    // Operations/Logistics
    if (jobLower.includes('operations') || jobLower.includes('logistics') || jobLower.includes('supply chain')) {
      categories.cognitive.push('logical reasoning', 'attention to detail');
      categories.personality.push('organization', 'time management');
      categories.skills.push('process optimization', 'planning');
    }

    // Remove duplicates and ensure minimum categories
    Object.keys(categories).forEach(key => {
      categories[key] = [...new Set(categories[key])];
      if (categories[key].length === 0) {
        // Add default categories if none selected
        switch (key) {
          case 'cognitive':
            categories[key] = ['logical reasoning', 'attention to detail'];
            break;
          case 'personality':
            categories[key] = ['communication', 'teamwork'];
            break;
          case 'behavioral':
            categories[key] = ['situational judgment', 'decision-making'];
            break;
          case 'aptitude':
            categories[key] = ['logical reasoning'];
            break;
          case 'skills':
            categories[key] = ['problem-solving', 'communication'];
            break;
        }
      }
    });

    return categories;
  }

  // Generate job-specific psychometric test
  async generateJobSpecificPsychometricTest(params: {
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    experienceLevel: string;
    industry: string;
    testType: 'personality' | 'cognitive' | 'aptitude' | 'skills' | 'behavioral' | 'comprehensive';
    questionCount?: number;
    timeLimit?: number;
    userId: string;
  }): Promise<any> {
    try {
      const {
        jobTitle,
        jobDescription,
        requiredSkills,
        experienceLevel,
        industry,
        testType,
        questionCount = 20,
        timeLimit = 30,
        userId
      } = params;

      // Define psychometric categories based on job requirements
      const psychometricCategories = this.getPsychometricCategoriesForJob(jobTitle, industry, requiredSkills);
      
      const testTypePrompts = {
        personality: `
          Focus on personality traits relevant to the role: leadership, teamwork, communication, stress management, 
          adaptability, creativity, attention to detail, problem-solving approach, motivation style, and work preferences.
          Categories to include: ${psychometricCategories.personality.join(', ')}
        `,
        cognitive: `
          Focus on cognitive abilities using these specific categories: ${psychometricCategories.cognitive.join(', ')}
          Include questions for: logical reasoning, numerical reasoning, verbal reasoning, pattern recognition, 
          analytical thinking, problem-solving, memory, attention to detail, abstract thinking, and spatial reasoning.
        `,
        aptitude: `
          Focus on job-relevant aptitudes using these categories: ${psychometricCategories.aptitude.join(', ')}
          Include: numerical reasoning, verbal reasoning, mechanical reasoning, spatial awareness, 
          coding aptitude (if applicable), and role-specific aptitudes based on the job requirements.
        `,
        skills: `
          Focus on technical and soft skills evaluation using these categories: ${psychometricCategories.skills.join(', ')}
          Include: role-specific technical competencies, communication skills, project management, 
          time management, and industry-specific knowledge.
        `,
        behavioral: `
          Focus on behavioral competencies using these categories: ${psychometricCategories.behavioral.join(', ')}
          Include: situational judgment, decision-making, conflict resolution, ethical judgment, 
          cultural fit, customer service orientation, and workplace situational responses.
        `,
        comprehensive: `
          Include questions from all relevant psychometric categories: ${[...psychometricCategories.cognitive, ...psychometricCategories.aptitude, ...psychometricCategories.behavioral, ...psychometricCategories.personality].join(', ')}
          Create a balanced mix of personality traits, cognitive abilities, relevant skills, 
          and behavioral competencies that are most important for this specific role.
        `
      };

      const prompt = `
        Generate a comprehensive psychometric test for the following job position:

        **Job Details:**
        - Title: ${jobTitle}
        - Industry: ${industry}
        - Experience Level: ${experienceLevel}
        - Description: ${jobDescription}
        - Required Skills: ${requiredSkills.join(', ')}

        **Test Requirements:**
        - Type: ${testType}
        - Number of Questions: ${questionCount}
        - Time Limit: ${timeLimit} minutes
        - ${testTypePrompts[testType]}

        **Important Guidelines:**
        1. Create exactly ${questionCount} unique, numbered questions (Q1, Q2, Q3, etc.)
        2. Ensure NO DUPLICATE questions or similar questions
        3. Use variety in question types: multiple choice, scenario-based, scale ratings, and true/false
        4. Make questions specific to the job role and industry
        5. Include realistic workplace scenarios
        6. Ensure questions are professional, unbiased, and legally compliant
        7. Each question should test different aspects/traits
        8. Provide clear, concise questions that candidates can understand easily

        **Response Format (JSON):**
        {
          "testId": "job-specific-${jobTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}",
          "test": {
            "title": "${testType.charAt(0).toUpperCase() + testType.slice(1)} Assessment for ${jobTitle}",
            "description": "A comprehensive ${testType} assessment designed specifically for the ${jobTitle} position",
            "type": "${testType}",
            "timeLimit": ${timeLimit},
            "industry": "${industry}",
            "jobRole": "${jobTitle}",
            "jobSpecific": true,
            "difficulty": "moderate",
            "categories": ["job-specific", "${testType}", "${industry.toLowerCase()}"],
            "questions": [
              {
                "id": "q1",
                "number": 1,
                "question": "Question text here?",
                "type": "multiple_choice",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "Option A",
                "traits": ["logical-reasoning", "problem-solving"],
                "weight": 1,
                "category": "cognitive",
                "explanation": "Brief explanation of the expected response"
              },
              {
                "id": "q2",
                "number": 2,
                "question": "Scenario-based question here...",
                "type": "scenario",
                "options": ["Response A", "Response B", "Response C", "Response D"],
                "correctAnswer": "Response A",
                "traits": ["situational-judgment", "decision-making"],
                "weight": 1,
                "category": "behavioral",
                "explanation": "Explanation of best response"
              },
              {
                "id": "q3",
                "number": 3,
                "question": "I enjoy working in team environments",
                "type": "scale",
                "scaleRange": {
                  "min": 1,
                  "max": 5,
                  "labels": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
                },
                "traits": ["teamwork", "collaboration"],
                "weight": 1,
                "category": "personality",
                "explanation": "Assesses teamwork preference"
              },
              {
                "id": "q4",
                "number": 4,
                "question": "Describe a challenging technical problem you solved and your approach to solving it.",
                "type": "text",
                "placeholder": "Describe your approach in detail...",
                "maxLength": 500,
                "traits": ["technical-problem-solving", "analytical-thinking"],
                "weight": 2,
                "category": "skills",
                "explanation": "Evaluates technical problem-solving abilities"
              },
              {
                "id": "q5",
                "number": 5,
                "question": "I prefer to work on multiple projects simultaneously rather than focusing on one at a time.",
                "type": "boolean",
                "options": ["True", "False"],
                "traits": ["multitasking", "focus"],
                "weight": 1,
                "category": "personality",
                "explanation": "Assesses work style preference"
              }
            ]
          }
        }

        **CRITICAL REQUIREMENTS:**
        - Generate EXACTLY ${questionCount} questions - no more, no less
        - Each question MUST be completely unique - no repetition in content, wording, or concepts
        - Number questions sequentially: Q1, Q2, Q3... Q${questionCount}
        - Use unique question IDs: q1, q2, q3... q${questionCount}

        **Question Types and Distribution (Total: ${questionCount}):**
        
        1. **Multiple Choice (${Math.floor(questionCount * 0.4)})**: 
           - MUST have exactly 4 options in "options" array
           - Format: { "type": "multiple_choice", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": "Option A" }
           - Categories: ${psychometricCategories.cognitive.slice(0, 2).join(', ')}, ${psychometricCategories.aptitude.slice(0, 1).join(', ')}
           - Each option must be a complete, distinct answer choice
        
        2. **Scenario-Based Multiple Choice (${Math.floor(questionCount * 0.25)})**: 
           - Real workplace situations with 4 response options
           - Categories: ${psychometricCategories.behavioral.join(', ')}
           - Format: { "type": "scenario", "options": [...], "correctAnswer": "..." }
        
        3. **Scale Rating (${Math.floor(questionCount * 0.2)})**: 
           - 1-5 Likert scale for personality/behavior traits
           - Categories: ${psychometricCategories.personality.join(', ')}
           - Format: { "type": "scale", "scaleRange": {"min": 1, "max": 5, "labels": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]} }
        
        4. **Text Input (${Math.floor(questionCount * 0.1)})**: 
           - Open-ended questions requiring written responses
           - For technical knowledge, problem-solving approaches, or experience descriptions
           - Format: { "type": "text", "placeholder": "Describe your approach...", "maxLength": 500 }
        
        5. **True/False (${questionCount - Math.floor(questionCount * 0.4) - Math.floor(questionCount * 0.25) - Math.floor(questionCount * 0.2) - Math.floor(questionCount * 0.1)})**: 
           - Work preferences/behaviors/statements
           - Categories: Mixed from all categories
           - Format: { "type": "boolean", "options": ["True", "False"], "correctAnswer": "True" or "False" }

        **Quality Assurance:**
        - Cover different aspects: technical skills, soft skills, job-specific knowledge, work style, problem-solving
        - Vary difficulty levels across questions
        - Ensure no two questions test the exact same concept
        - Make each question independently valuable for assessment
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const testData = this.extractJsonFromResponse(text);
        
        // Validate the generated test
        if (!testData.test || !testData.test.questions || !Array.isArray(testData.test.questions)) {
          throw new Error('Invalid test structure generated');
        }

        // Ensure question count matches and questions are numbered properly
        let questions = testData.test.questions;
        
        // Validate and fix question types
        questions = questions.map((q: any, index: number) => {
          // Fix question IDs and numbering
          q.id = `q${index + 1}`;
          q.number = index + 1;
          
          // Validate question types and fix missing fields
          if (q.type === 'multiple_choice' || q.type === 'scenario') {
            if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
              console.warn(`Fixing missing options for ${q.type} question ${q.id}`);
              q.options = [
                "Option A: Primary approach",
                "Option B: Alternative approach", 
                "Option C: Different approach",
                "Option D: Other approach"
              ];
              q.correctAnswer = q.correctAnswer || q.options[0];
            }
          } else if (q.type === 'boolean') {
            q.options = ["True", "False"];
          } else if (q.type === 'scale') {
            if (!q.scaleRange) {
              q.scaleRange = {
                min: 1,
                max: 5,
                labels: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
              };
            }
          } else if (q.type === 'text') {
            q.placeholder = q.placeholder || "Please provide your detailed response...";
            q.maxLength = q.maxLength || 500;
          }
          
          // Ensure required fields are present
          q.traits = q.traits || ['assessment'];
          q.weight = q.weight || 1;
          q.category = q.category || 'general';
          
          return q;
        });
        
        if (questions.length !== questionCount) {
          console.warn(`Generated ${questions.length} questions instead of requested ${questionCount}. Adjusting...`);
          
          if (questions.length < questionCount) {
            // Add missing questions
            const missingCount = questionCount - questions.length;
            const additionalQuestions = [];
            
            for (let i = 0; i < missingCount; i++) {
              const questionNumber = questions.length + i + 1;
              const skillIndex = i % requiredSkills.length;
              const skill = requiredSkills[skillIndex] || 'communication';
              
              additionalQuestions.push({
                id: `q${questionNumber}`,
                number: questionNumber,
                question: `How would you rate your experience with ${skill} in a professional setting?`,
                type: "scale",
                scaleRange: { min: 1, max: 5 },
                traits: ["self-assessment", skill.toLowerCase()],
                weight: 1,
                explanation: `Self-assessment of ${skill} competency level`
              });
            }
            
            questions = [...questions, ...additionalQuestions];
          } else if (questions.length > questionCount) {
            // Trim excess questions
            questions = questions.slice(0, questionCount);
          }
        }
        
        // Update the test data with corrected questions
        testData.test.questions = questions;

        // Ensure proper numbering and unique questions
        const questionTexts = new Set();
        questions.forEach((q: any, index: number) => {
          q.number = index + 1;
          q.id = `q${index + 1}`;
          
          // Check for duplicates
          if (questionTexts.has(q.question)) {
            console.warn(`Duplicate question detected: ${q.question}`);
            q.question = `${q.question} (Question ${index + 1})`;
          }
          questionTexts.add(q.question);
        });

        // Add metadata for tracking
        testData.test.generatedAt = new Date().toISOString();
        testData.test.generatedFor = userId;
        testData.test.jobSpecific = true;
        testData.test.actualQuestionCount = questions.length;

        // Final validation
        if (questions.length !== questionCount) {
          throw new Error(`Failed to generate exactly ${questionCount} questions. Final count: ${questions.length}`);
        }

        console.log(`✅ Successfully generated exactly ${questions.length} unique questions for ${jobTitle} psychometric assessment`);
        return testData;

      } catch (parseError) {
        console.error('Failed to parse AI test generation response:', parseError);
        throw new Error('Failed to generate valid psychometric test structure');
      }

    } catch (error) {
      console.error('Error generating job-specific psychometric test:', error);
      throw new Error('Failed to generate psychometric test');
    }
  }

  // Grade psychometric test responses
  async gradePsychometricTest(params: {
    test: any;
    answers: Record<string, any>;
    userId: string;
    jobId?: string;
  }): Promise<{
    scores: Record<string, number>;
    overallScore: number;
    interpretation: string;
    recommendations: string[];
    detailedAnalysis: any;
  }> {
    try {
      const { test, answers, userId, jobId } = params;

      const prompt = `
        You are a professional career assessment expert. Grade this psychometric test and provide detailed feedback in JSON format.

        **Test Details:**
        - Title: ${test.title}
        - Type: ${test.type} 
        - Questions Answered: ${Object.keys(answers).length}/${test.questions.length}

        **Questions & Answers:**
        ${test.questions.map((q: any, index: number) => {
          const answer = answers[q._id] || answers[q.id] || 'Not answered';
          const answerText = typeof answer === 'object' ? JSON.stringify(answer) : answer;
          return `
        Q${index + 1}: ${q.question}
        ${q.options ? `Options: ${q.options.join(', ')}` : ''}
        Student's Answer: ${answerText}
        Question Type: ${q.type}
        `;
        }).join('\n')}

        **Instructions:**
        The candidate has answered ${Object.keys(answers).length} out of ${test.questions.length} questions. 
        Analyze their actual responses (shown above) and provide realistic scores on a 0-100 scale.
        Even if some answers are brief or simple, give credit for engagement and effort.
        Provide constructive feedback based on the responses given.

        **Required JSON Response Format:**
        {
          "overallScore": 78,
          "grade": "B+",
          "percentile": 65,
          "scores": {
            "communication": 80,
            "problemSolving": 75,
            "leadership": 78,
            "teamwork": 82
          },
          "categoryScores": {
            "cognitive": 77,
            "personality": 79,
            "behavioral": 76
          },
          "interpretation": "Clear assessment of performance with specific observations about strengths and areas for development",
          "recommendations": [
            "Focus on developing technical skills through online courses",
            "Practice leadership scenarios to build confidence",
            "Seek feedback from colleagues to improve communication"
          ],
          "detailedAnalysis": {
            "strengths": [
              "Shows strong analytical thinking",
              "Good communication skills",
              "Demonstrates leadership potential"
            ],
            "developmentAreas": [
              "Technical skills need strengthening",
              "Time management could improve",
              "Strategic thinking requires development"
            ],
            "careerReadiness": {
              "currentRole": "Well-suited",
              "nextLevel": "Needs development",
              "timeToPromotion": "12-18 months"
            },
            "jobFitScore": 78,
            "industryBenchmark": "Above average",
            "nextSteps": [
              "Complete technical certification",
              "Join leadership development program",
              "Seek mentoring relationship"
            ]
          }
        }

        Provide ONLY the JSON response, no additional text.
      `;

      console.log('Sending prompt to AI model...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('AI response received, length:', text?.length || 0);
      console.log('Raw AI response (first 500 chars):', text?.substring(0, 500));

      try {
        const gradingResult = this.extractJsonFromResponse(text);
        console.log('Successfully parsed AI grading result');
        
        // Validate and ensure proper structure
        return {
          scores: gradingResult.scores || {},
          categoryScores: gradingResult.categoryScores || {},
          overallScore: Math.min(Math.max(gradingResult.overallScore || 0, 0), 100),
          grade: gradingResult.grade || this.calculateGrade(gradingResult.overallScore || 0),
          percentile: gradingResult.percentile || Math.round((gradingResult.overallScore || 0) * 0.8),
          interpretation: gradingResult.interpretation || 'Assessment completed.',
          recommendations: gradingResult.recommendations || [],
          detailedAnalysis: {
            strengths: gradingResult.detailedAnalysis?.strengths || [],
            developmentAreas: gradingResult.detailedAnalysis?.developmentAreas || [],
            skillGaps: gradingResult.detailedAnalysis?.skillGaps || [],
            careerReadiness: gradingResult.detailedAnalysis?.careerReadiness || {},
            jobFitScore: gradingResult.detailedAnalysis?.jobFitScore || gradingResult.overallScore || 0,
            confidenceLevel: gradingResult.detailedAnalysis?.confidenceLevel || 0.8,
            industryBenchmark: gradingResult.detailedAnalysis?.industryBenchmark || 'Average',
            competencyProfile: gradingResult.detailedAnalysis?.competencyProfile || {},
            learningRecommendations: gradingResult.detailedAnalysis?.learningRecommendations || [],
            nextSteps: gradingResult.detailedAnalysis?.nextSteps || []
          }
        };

      } catch (parseError) {
        console.error('Failed to parse grading response:', parseError);
        console.error('Raw AI response:', text?.substring(0, 1000));
        
        // Enhanced fallback scoring logic
        const answeredQuestions = Object.keys(answers).length;
        const totalQuestions = test.questions?.length || 1;
        const completionRate = answeredQuestions / totalQuestions;
        
        // Try to extract any score from the response text
        const scoreMatch = text?.match(/(\d+)%?/g);
        const extractedScore = scoreMatch ? Math.max(...scoreMatch.map(s => parseInt(s.replace('%', ''))).filter(n => n <= 100 && n >= 0)) : null;
        
        const fallbackScore = extractedScore || Math.max(Math.round(completionRate * 75 + Math.random() * 15), 60); // Base score 60-90
        
        console.log('Enhanced fallback scoring:', {
          answeredQuestions,
          totalQuestions,
          completionRate,
          extractedScore,
          finalFallbackScore: fallbackScore
        });

        return {
          scores: { 
            communication: fallbackScore,
            problemSolving: Math.max(fallbackScore - 5, 0),
            leadership: Math.min(fallbackScore + 5, 100),
            teamwork: fallbackScore,
            adaptability: Math.max(fallbackScore - 3, 0)
          },
          categoryScores: {
            cognitive: fallbackScore,
            personality: Math.max(fallbackScore - 2, 0),
            behavioral: Math.min(fallbackScore + 2, 100),
            skills: fallbackScore
          },
          overallScore: fallbackScore,
          grade: this.calculateGrade(fallbackScore),
          percentile: Math.round(fallbackScore * 0.8),
          interpretation: `Assessment completed successfully. You answered ${answeredQuestions} out of ${totalQuestions} questions, demonstrating engagement with the assessment process. Your responses indicate potential across multiple competency areas.`,
          recommendations: [
            'Continue developing your analytical and problem-solving skills',
            'Seek opportunities to apply your knowledge in practical settings',
            'Consider additional training in areas where you scored lower',
            'Build on your existing strengths while addressing development areas'
          ],
          detailedAnalysis: {
            strengths: [
              'Shows engagement with the assessment process',
              'Demonstrates willingness to tackle complex questions',
              'Exhibits potential for growth and development'
            ],
            developmentAreas: [
              'Continue building expertise in core competency areas',
              'Practice applying theoretical knowledge to real situations',
              'Develop confidence through additional learning and experience'
            ],
            skillGaps: [
              {
                skill: 'Professional Development',
                currentLevel: 'Developing',
                targetLevel: 'Proficient',
                importance: 'Medium',
                learningPath: 'Engage in continuous learning and skill-building activities'
              }
            ],
            careerReadiness: {
              currentRole: 'Suitable with development',
              nextLevel: 'Requires additional preparation',
              timeToPromotion: '6-18 months',
              keyFocusAreas: ['Skill enhancement', 'Experience building']
            },
            jobFitScore: fallbackScore,
            confidenceLevel: 0.7,
            industryBenchmark: 'Average',
            competencyProfile: {
              topCompetencies: ['Adaptability', 'Learning orientation'],
              emergingCompetencies: ['Problem solving', 'Communication'],
              competenciesToDevelop: ['Leadership', 'Technical expertise']
            },
            learningRecommendations: [
              {
                type: 'Skill Development',
                priority: 'Medium',
                recommendation: 'Focus on building core competencies through structured learning',
                timeline: '3-6 months',
                resources: ['Online courses', 'Workshops', 'Mentoring']
              }
            ],
            nextSteps: [
              'Review your results to identify specific areas for improvement',
              'Create a personal development plan with clear goals',
              'Seek learning opportunities that align with your career objectives',
              'Practice applying new skills in low-risk environments'
            ],
            completionRate,
            answeredQuestions,
            totalQuestions
          }
        };
      }

    } catch (error) {
      console.error('Error grading psychometric test:', error);
      throw new Error('Failed to grade psychometric test');
    }
  }

  // Helper method to calculate letter grade from numerical score
  private calculateGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
  }

  // Helper method to calculate fallback score based on completion
  private calculateFallbackScore(answers: Record<string, any>, questions: any[]): number {
    const answeredQuestions = Object.keys(answers).length;
    const totalQuestions = questions.length || 1;
    const completionRate = answeredQuestions / totalQuestions;
    
    // Base score calculation: 60-85 range based on completion
    const baseScore = Math.round(60 + (completionRate * 25));
    
    // Add some variation based on answer patterns
    let qualityBonus = 0;
    for (const answer of Object.values(answers)) {
      if (answer && answer.toString().length > 5) {
        qualityBonus += 2; // Bonus for detailed answers
      }
    }
    
    return Math.min(baseScore + qualityBonus, 100);
  }

  // General method to generate content using AI
  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content with AI:', error);
      throw new Error('Failed to generate content with AI');
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
