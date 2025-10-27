import { AIService } from './aiService';
import PsychometricTestModel, { IPsychometricTest, ITestQuestion, ITestResult } from '@/models/PsychometricTest';
import { User } from '@/models/User';
import { Job } from '@/models/Job';
import { Course } from '@/models/Course';
import { JobStatus } from '@/types/job';
import mongoose from 'mongoose';

export interface ICareerAssessment {
  _id?: string;
  userId: string;
  assessmentType: 'career_discovery' | 'job_readiness' | 'skill_gap' | 'personality';
  title: string;
  description: string;
  questions: ITestQuestion[];
  results?: ICareerAssessmentResult;
  completedAt?: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICareerAssessmentResult {
  userId: string;
  assessmentId: string;
  personalityProfile: {
    primaryType: string;
    traits: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    strengths: string[];
    developmentAreas: string[];
  };
  skillsAnalysis: {
    technicalSkills: Array<{
      skill: string;
      proficiency: number;
      category: string;
    }>;
    softSkills: Array<{
      skill: string;
      proficiency: number;
      importance: number;
    }>;
    skillGaps: string[];
  };
  careerRecommendations: Array<{
    careerPath: string;
    matchPercentage: number;
    reasons: string[];
    requiredSkills: string[];
    averageSalary?: string;
    growthOutlook: string;
    industry: string;
  }>;
  learningRecommendations: Array<{
    courseId?: string;
    courseName: string;
    provider: string;
    priority: 'high' | 'medium' | 'low';
    estimatedDuration: string;
    skillsToGain: string[];
    category: string;
  }>;
  jobMatches: Array<{
    jobId?: string;
    jobTitle: string;
    company: string;
    matchPercentage: number;
    missingSkills: string[];
    readinessScore: number;
  }>;
  personalizedRoadmap: {
    shortTerm: Array<{
      goal: string;
      timeline: string;
      actions: string[];
    }>;
    mediumTerm: Array<{
      goal: string;
      timeline: string;
      actions: string[];
    }>;
    longTerm: Array<{
      goal: string;
      timeline: string;
      actions: string[];
    }>;
  };
  aiInsights: {
    summary: string;
    keyRecommendations: string[];
    motivationalMessage: string;
    nextSteps: string[];
  };
  completedAt: Date;
}

export interface ICareerProfile {
  userId: string;
  currentRole?: string;
  experience: string;
  education: string;
  skills: string[];
  interests: string[];
  values: string[];
  careerGoals: string[];
  preferredIndustries: string[];
  workStyle: string;
  assessmentHistory: string[];
  lastUpdated: Date;
}

export class CareerGuidanceService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  // Helper method to parse AI response that might be wrapped in markdown code blocks
  private parseAIResponse(response: string): any {
    try {
      // Remove markdown code block delimiters if present
      let cleanedResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Remove JavaScript-style comments (// comments) that may break JSON parsing
      cleanedResponse = cleanedResponse.replace(/\/\/.*$/gm, '');
      
      // Remove any trailing commas that might be left after removing comments
      cleanedResponse = cleanedResponse.replace(/,\s*(?=\s*[}\]])/g, '');
      
      const parsedData = JSON.parse(cleanedResponse);
      
      // Validate and fix question types if present
      if (parsedData.sections && Array.isArray(parsedData.sections)) {
        parsedData.sections.forEach((section: any) => {
          if (section.questions && Array.isArray(section.questions)) {
            section.questions.forEach((question: any) => {
              question.type = this.validateQuestionType(question.type);
            });
          }
        });
      }
      
      return parsedData;
    } catch (error) {
      console.error('Failed to parse AI response:', response);
      throw new Error('Invalid AI response format');
    }
  }

  // Helper method to validate and map question types to valid enum values
  private validateQuestionType(type: string): string {
    const typeMap: Record<string, string> = {
      'rating_scale': 'likert_scale',
      'scale': 'likert_scale',
      'open_ended': 'text',
      'open_text': 'text',
      'textual': 'text',
      'choice': 'multiple_choice',
      'mcq': 'multiple_choice',
      'single_choice': 'multiple_choice',
      'rank': 'multiple_choice',
      'order': 'multiple_choice'
    };
    
    const validTypes = ['multiple_choice', 'likert_scale', 'text'];
    
    // If it's already valid, return as is
    if (validTypes.includes(type)) {
      return type;
    }
    
    // Try to map from common variations
    const mappedType = typeMap[type.toLowerCase()];
    if (mappedType) {
      return mappedType;
    }
    
    // Default fallback
    console.warn(`Unknown question type "${type}", defaulting to "multiple_choice"`);
    return 'multiple_choice';
  }

  // Generate Career Discovery Assessment for E-learning students
  async generateCareerDiscoveryTest(userId: string): Promise<ICareerAssessment> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const assessmentPrompt = `
        Generate a comprehensive Career Discovery Assessment to help students identify their ideal career paths.
        
        The assessment should include:
        1. Personality Assessment (16-20 questions)
           - Big Five personality traits
           - Work style preferences
           - Communication style
           - Leadership preferences
           
        2. Interest Assessment (15-18 questions)
           - Professional interests
           - Activities they enjoy
           - Subject preferences
           - Work environment preferences
           
        3. Skills & Aptitude Assessment (12-15 questions)
           - Technical aptitude
           - Analytical skills
           - Creative abilities
           - Problem-solving approach
           
        4. Values & Goals Assessment (10-12 questions)
           - Work-life balance priorities
           - Career motivations
           - Success definitions
           - Impact preferences

        IMPORTANT: 
        - Use ONLY these question types: "multiple_choice", "likert_scale", "text"
        - Return only valid JSON without any comments or explanations
        - Do not include // comments in the JSON output
        
        Please structure the output as a JSON object with:
        {
          "title": "Career Discovery Assessment",
          "description": "Comprehensive assessment description",
          "sections": [
            {
              "title": "Section title",
              "description": "Section description",
              "questions": [
                {
                  "id": "unique_id",
                  "question": "Question text",
                  "type": "multiple_choice|likert_scale|text",
                  "options": ["option1", "option2", "option3", "option4"],
                  "category": "personality|interests|skills|values",
                  "weight": 1-5
                }
              ]
            }
          ],
          "totalQuestions": 60,
          "estimatedDuration": "25-30 minutes"
        }
      `;

      const response = await this.aiService.generateContent(assessmentPrompt);
      const assessmentData = this.parseAIResponse(response);

      // Flatten questions from sections
      const allQuestions = assessmentData.sections.reduce((acc: ITestQuestion[], section: any) => {
        return acc.concat(section.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
          category: q.category,
          weight: q.weight || 1,
          correctAnswer: null // No correct answers for personality/interest assessments
        })));
      }, []);

      const assessment: ICareerAssessment = {
        userId,
        assessmentType: 'career_discovery',
        title: assessmentData.title,
        description: assessmentData.description,
        questions: allQuestions,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return assessment;
    } catch (error) {
      console.error('Error generating career discovery test:', error);
      throw new Error('Failed to generate career discovery assessment');
    }
  }

  // Analyze Career Assessment Results
  async analyzeCareerAssessment(
    userId: string, 
    assessmentId: string, 
    answers: Record<string, any>
  ): Promise<ICareerAssessmentResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get available courses for learning recommendations
      const availableCourses = await Course.find({ isPublished: true }).select('title description category duration') || [];
      
      // Get available jobs for job matching
      const availableJobs = await Job.find({ 
        status: JobStatus.ACTIVE,
        applicationDeadline: { $gte: new Date() }
      }).select('title company description skills location salary') || [];

      const analysisPrompt = `
        Analyze the following career assessment responses and provide comprehensive career guidance.
        
        User Information:
        - Name: ${user.firstName} ${user.lastName}
        - Email: ${user.email}
        - Current Role: ${(user as any).currentRole || 'Student'}
        
        Assessment Answers: ${JSON.stringify(answers, null, 2)}
        
        Available Courses: ${JSON.stringify(availableCourses.slice(0, 20), null, 2)}
        
        Available Jobs: ${JSON.stringify(availableJobs.slice(0, 15), null, 2)}

        Please provide a comprehensive analysis in the following JSON structure:
        {
          "personalityProfile": {
            "primaryType": "MBTI-like type (e.g., 'Analytical Problem-Solver', 'Creative Innovator')",
            "traits": {
              "openness": 0-100,
              "conscientiousness": 0-100,
              "extraversion": 0-100,
              "agreeableness": 0-100,
              "neuroticism": 0-100
            },
            "strengths": ["strength1", "strength2", ...],
            "developmentAreas": ["area1", "area2", ...]
          },
          "skillsAnalysis": {
            "technicalSkills": [
              {
                "skill": "skill name",
                "proficiency": 0-100,
                "category": "technical|analytical|creative|leadership"
              }
            ],
            "softSkills": [
              {
                "skill": "skill name",
                "proficiency": 0-100,
                "importance": 0-100
              }
            ],
            "skillGaps": ["gap1", "gap2", ...]
          },
          "careerRecommendations": [
            {
              "careerPath": "Career Title",
              "matchPercentage": 0-100,
              "reasons": ["reason1", "reason2"],
              "requiredSkills": ["skill1", "skill2"],
              "averageSalary": "$XX,XXX - $XX,XXX",
              "growthOutlook": "Excellent|Good|Fair",
              "industry": "Technology|Healthcare|Finance|etc"
            }
          ],
          "learningRecommendations": [
            {
              "courseName": "Course name from available courses",
              "provider": "Excellence Coaching Hub",
              "priority": "high|medium|low",
              "estimatedDuration": "X weeks",
              "skillsToGain": ["skill1", "skill2"],
              "category": "technical|business|creative|personal development"
            }
          ],
          "jobMatches": [
            {
              "jobTitle": "Job title from available jobs",
              "company": "Company name",
              "matchPercentage": 0-100,
              "missingSkills": ["skill1", "skill2"],
              "readinessScore": 0-100
            }
          ],
          "personalizedRoadmap": {
            "shortTerm": [
              {
                "goal": "3-6 month goal",
                "timeline": "3-6 months",
                "actions": ["action1", "action2"]
              }
            ],
            "mediumTerm": [
              {
                "goal": "6-18 month goal", 
                "timeline": "6-18 months",
                "actions": ["action1", "action2"]
              }
            ],
            "longTerm": [
              {
                "goal": "1-3 year goal",
                "timeline": "1-3 years", 
                "actions": ["action1", "action2"]
              }
            ]
          },
          "aiInsights": {
            "summary": "2-3 sentence summary of the user's career profile",
            "keyRecommendations": ["rec1", "rec2", "rec3"],
            "motivationalMessage": "Encouraging message about their potential",
            "nextSteps": ["immediate action1", "immediate action2"]
          }
        }

        Important: Ensure recommendations are specific, actionable, and realistic. Match courses and jobs from the provided lists when possible.
      `;

      const analysisResponse = await this.aiService.generateContent(analysisPrompt);
      const analysisResult = this.parseAIResponse(analysisResponse);

      // Add course IDs for learning recommendations where possible
      const enhancedLearningRecs = analysisResult.learningRecommendations.map((rec: any) => {
        const matchingCourse = availableCourses.find(course => 
          course.title.toLowerCase().includes(rec.courseName.toLowerCase()) ||
          rec.courseName.toLowerCase().includes(course.title.toLowerCase())
        );
        
        return {
          ...rec,
          courseId: matchingCourse?._id.toString(),
          courseName: matchingCourse?.title || rec.courseName
        };
      });

      // Add job IDs for job matches where possible
      const enhancedJobMatches = analysisResult.jobMatches.map((match: any) => {
        const matchingJob = availableJobs.find(job =>
          job.title.toLowerCase().includes(match.jobTitle.toLowerCase()) ||
          match.jobTitle.toLowerCase().includes(job.title.toLowerCase())
        );

        return {
          ...match,
          jobId: matchingJob?._id.toString(),
          jobTitle: matchingJob?.title || match.jobTitle,
          company: matchingJob?.company || match.company
        };
      });

      const result: ICareerAssessmentResult = {
        userId,
        assessmentId,
        personalityProfile: analysisResult.personalityProfile,
        skillsAnalysis: analysisResult.skillsAnalysis,
        careerRecommendations: analysisResult.careerRecommendations,
        learningRecommendations: enhancedLearningRecs,
        jobMatches: enhancedJobMatches,
        personalizedRoadmap: analysisResult.personalizedRoadmap,
        aiInsights: analysisResult.aiInsights,
        completedAt: new Date()
      };

      return result;
    } catch (error) {
      console.error('Error analyzing career assessment:', error);
      throw new Error('Failed to analyze career assessment');
    }
  }

  // Generate Job Readiness Assessment for Job Portal
  async generateJobReadinessTest(userId: string, targetJob?: string): Promise<ICareerAssessment> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const jobContext = targetJob ? `for the position: ${targetJob}` : 'for general job readiness';

      const assessmentPrompt = `
        Generate a Job Readiness Psychometric Assessment ${jobContext}.
        
        The assessment should evaluate:
        1. Professional Competencies (15-20 questions)
           - Leadership abilities
           - Teamwork skills
           - Communication effectiveness
           - Problem-solving approach
           
        2. Work Readiness (12-15 questions)
           - Adaptability
           - Time management
           - Stress management
           - Professional ethics
           
        3. Technical Aptitude (10-15 questions)
           - Learning agility
           - Technical problem-solving
           - Innovation mindset
           - Digital literacy
           
        4. Behavioral Assessment (8-12 questions)
           - Reliability
           - Initiative
           - Conflict resolution
           - Customer focus

        IMPORTANT: 
        - Use ONLY these question types: "multiple_choice", "likert_scale", "text"
        - Return only valid JSON without any comments or explanations  
        - Do not include // comments in the JSON output

        Structure as JSON:
        {
          "title": "Job Readiness Assessment",
          "description": "Assessment description",
          "sections": [
            {
              "title": "Section title",
              "questions": [
                {
                  "id": "unique_id",
                  "question": "Question text",
                  "type": "multiple_choice|likert_scale|text",
                  "options": ["option1", "option2", ...],
                  "category": "competencies|readiness|technical|behavioral",
                  "weight": 1-5
                }
              ]
            }
          ]
        }
      `;

      const response = await this.aiService.generateContent(assessmentPrompt);
      const assessmentData = this.parseAIResponse(response);

      const allQuestions = assessmentData.sections.reduce((acc: ITestQuestion[], section: any) => {
        return acc.concat(section.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
          category: q.category,
          weight: q.weight || 1,
          correctAnswer: null
        })));
      }, []);

      const assessment: ICareerAssessment = {
        userId,
        assessmentType: 'job_readiness',
        title: assessmentData.title + (targetJob ? ` - ${targetJob}` : ''),
        description: assessmentData.description,
        questions: allQuestions,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return assessment;
    } catch (error) {
      console.error('Error generating job readiness test:', error);
      throw new Error('Failed to generate job readiness assessment');
    }
  }

  // Get personalized career guidance for a user
  async getPersonalizedGuidance(userId: string): Promise<{
    hasCompletedAssessment: boolean;
    latestResults?: ICareerAssessmentResult;
    recommendations: {
      nextSteps: string[];
      skillsToImprove: string[];
      coursesToTake: string[];
      jobsToConsider: string[];
    };
    progressTracking: {
      completedMilestones: number;
      totalMilestones: number;
      currentGoals: string[];
    };
  }> {
    // This would fetch user's assessment history and provide personalized guidance
    // Implementation would depend on how assessment results are stored
    
    return {
      hasCompletedAssessment: false,
      recommendations: {
        nextSteps: ['Take Career Discovery Assessment', 'Complete your profile', 'Explore courses'],
        skillsToImprove: [],
        coursesToTake: [],
        jobsToConsider: []
      },
      progressTracking: {
        completedMilestones: 0,
        totalMilestones: 1,
        currentGoals: ['Complete Career Assessment']
      }
    };
  }

  // AI Career Mentor Chat
  async getCareerMentorResponse(
    userId: string,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's career profile/assessment results if available
      const contextPrompt = `
        You are an AI Career Mentor for Excellence Coaching Hub. You provide personalized career guidance, advice, and support.
        
        User Context:
        - Name: ${user.firstName} ${user.lastName}
        - Role: ${(user as any).role || 'Student'}
        - Platform: E-learning Platform
        
        Conversation History:
        ${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
        
        Current User Question/Message: "${userMessage}"
        
        Please provide helpful, encouraging, and actionable career advice. Your response should:
        1. Be personalized and empathetic
        2. Provide specific, actionable recommendations
        3. Encourage continuous learning and growth
        4. Reference available courses or resources when relevant
        5. Be professional but friendly and motivational
        6. Keep responses concise but comprehensive (150-300 words)
        
        If the user asks about:
        - Career paths: Provide industry insights and growth opportunities
        - Skills: Suggest specific courses and learning resources
        - Job market: Give realistic expectations and preparation advice
        - Personal development: Offer strategies for growth and improvement
        - Course selection: Recommend based on career goals
      `;

      const mentorResponse = await this.aiService.generateContent(contextPrompt);
      return mentorResponse;
    } catch (error) {
      console.error('Error getting career mentor response:', error);
      throw new Error('Failed to get career mentor response');
    }
  }

  // Success Stories and Testimonials
  async getSuccessStories(careerField?: string): Promise<Array<{
    name: string;
    careerPath: string;
    story: string;
    achievements: string[];
    coursesCompleted: string[];
    timeToSuccess: string;
    currentRole: string;
    company: string;
    advice: string;
  }>> {
    // This could be from a database of real success stories
    // For now, returning sample data structure
    const sampleStories = [
      {
        name: 'Sarah Johnson',
        careerPath: 'Software Developer',
        story: 'Transitioned from marketing to software development through our comprehensive Full Stack Web Development program.',
        achievements: ['Landed job at tech startup', 'Increased salary by 150%', 'Built 3 production apps'],
        coursesCompleted: ['JavaScript Fundamentals', 'React Development', 'Node.js Backend'],
        timeToSuccess: '8 months',
        currentRole: 'Full Stack Developer',
        company: 'TechVibe Solutions',
        advice: 'Start with the basics and build projects alongside your learning. Practice is key!'
      }
    ];

    return careerField 
      ? sampleStories.filter(story => story.careerPath.toLowerCase().includes(careerField.toLowerCase()))
      : sampleStories;
  }
}

export default CareerGuidanceService;