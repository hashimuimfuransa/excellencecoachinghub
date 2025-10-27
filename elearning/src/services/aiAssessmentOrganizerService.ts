import { aiService } from './aiService';
import { geminiAIService } from './geminiAIService';
import { assessmentService, IAssessment, IQuestion } from './assessmentService';

export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  questions: IQuestion[];
  timeAllocation: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  instructions: string;
  objectives: string[];
  suggestedApproach: string;
}

export interface OrganizedAssessment {
  originalAssessment: IAssessment;
  aiOrganized: boolean;
  organizationTimestamp: string;
  sections: AssessmentSection[];
  overallInstructions: string;
  studyRecommendations: string[];
  timeManagementTips: string[];
  difficultyAnalysis: {
    easy: number;
    medium: number;
    hard: number;
  };
  estimatedCompletionTime: number; // minutes
  aiInsights: {
    strengths: string[];
    challenges: string[];
    preparationTips: string[];
  };
}

export interface AssessmentOrganizationRequest {
  assessmentId: string;
  studentProfile?: {
    previousScores?: number[];
    strengths?: string[];
    weaknesses?: string[];
    preferredLearningStyle?: string;
  };
  courseContext?: {
    courseTitle?: string;
    currentWeek?: number;
    completedTopics?: string[];
  };
}

export const aiAssessmentOrganizerService = {
  /**
   * Main function to organize an assessment using AI
   */
  organizeAssessment: async (request: AssessmentOrganizationRequest): Promise<OrganizedAssessment> => {
    try {
      console.log('🤖 Starting AI assessment organization for:', request.assessmentId);
      
      // 1. Fetch the original assessment
      const assessment = await assessmentService.getAssessmentById(request.assessmentId);
      
      // 2. Use AI to analyze and organize the assessment
      const aiOrganization = await analyzeAndOrganizeAssessment(assessment, request);
      
      // 3. Create organized sections
      const sections = await createOrganizedSections(assessment.questions, aiOrganization);
      
      // 4. Generate study recommendations and tips
      const studyInsights = await generateStudyInsights(assessment, sections, request);
      
      // 5. Calculate difficulty distribution
      const difficultyAnalysis = analyzeDifficultyDistribution(assessment.questions);
      
      // 6. Estimate completion time
      const estimatedTime = calculateEstimatedTime(sections, difficultyAnalysis);
      
      const organizedAssessment: OrganizedAssessment = {
        originalAssessment: assessment,
        aiOrganized: true,
        organizationTimestamp: new Date().toISOString(),
        sections,
        overallInstructions: aiOrganization.overallInstructions,
        studyRecommendations: studyInsights.studyRecommendations,
        timeManagementTips: studyInsights.timeManagementTips,
        difficultyAnalysis,
        estimatedCompletionTime: estimatedTime,
        aiInsights: studyInsights.aiInsights
      };
      
      console.log('✅ Assessment organization completed successfully');
      return organizedAssessment;
      
    } catch (error) {
      console.error('❌ Error organizing assessment:', error);
      
      // Fallback: return basic organization without AI enhancement
      const assessment = await assessmentService.getAssessmentById(request.assessmentId);
      return createFallbackOrganization(assessment);
    }
  },

  /**
   * Get cached organized assessment if available
   */
  getCachedOrganizedAssessment: async (assessmentId: string): Promise<OrganizedAssessment | null> => {
    try {
      const cacheKey = `organized_assessment_${assessmentId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Check if cache is still valid (1 hour expiry)
        const cacheTime = new Date(parsedCache.organizationTimestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 1) {
          console.log('📦 Using cached organized assessment');
          return parsedCache;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving cached assessment:', error);
      return null;
    }
  },

  /**
   * Cache organized assessment for future use
   */
  cacheOrganizedAssessment: (organizedAssessment: OrganizedAssessment): void => {
    try {
      const cacheKey = `organized_assessment_${organizedAssessment.originalAssessment._id}`;
      localStorage.setItem(cacheKey, JSON.stringify(organizedAssessment));
      console.log('💾 Organized assessment cached successfully');
    } catch (error) {
      console.error('Error caching organized assessment:', error);
    }
  },

  /**
   * Clear cache for a specific assessment
   */
  clearAssessmentCache: (assessmentId: string): void => {
    try {
      const cacheKey = `organized_assessment_${assessmentId}`;
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Assessment cache cleared');
    } catch (error) {
      console.error('Error clearing assessment cache:', error);
    }
  }
};

/**
 * Use AI to analyze and organize the assessment structure
 */
async function analyzeAndOrganizeAssessment(
  assessment: IAssessment, 
  request: AssessmentOrganizationRequest
): Promise<any> {
  try {
    if (!geminiAIService.isAvailable()) {
      return getFallbackOrganizationStructure(assessment);
    }

    const prompt = `Analyze this assessment and provide an optimal organization structure:

ASSESSMENT DETAILS:
Title: ${assessment.title}
Description: ${assessment.description || 'No description provided'}
Total Questions: ${assessment.questions.length}
Time Limit: ${assessment.timeLimit || 'Not specified'} minutes
Type: ${assessment.type}

QUESTIONS ANALYSIS:
${assessment.questions.map((q, index) => `
${index + 1}. Type: ${q.type}, Section: ${q.section || 'None'}, Points: ${q.points}
   Question: ${q.question.substring(0, 100)}...
`).join('')}

STUDENT CONTEXT:
${request.courseContext?.courseTitle ? `Course: ${request.courseContext.courseTitle}` : ''}
${request.courseContext?.currentWeek ? `Current Week: ${request.courseContext.currentWeek}` : ''}
${request.studentProfile?.preferredLearningStyle ? `Learning Style: ${request.studentProfile.preferredLearningStyle}` : ''}

Please provide:
1. Logical sectioning of questions based on difficulty and topic
2. Overall assessment instructions that are encouraging and clear
3. Time management recommendations
4. Difficulty progression strategy (easy to hard or mixed)
5. Key learning objectives being tested

Format your response as a structured analysis.`;

    const aiResponse = await geminiAIService.sendMessage({
      userMessage: prompt,
      context: {
        page: 'assessment-organization',
        courseTitle: request.courseContext?.courseTitle,
        content: assessment.instructions
      }
    });

    return {
      aiAnalysis: aiResponse.message,
      overallInstructions: extractOverallInstructions(aiResponse.message, assessment),
      sectioningStrategy: extractSectioningStrategy(aiResponse.message),
      timeStrategy: extractTimeManagementStrategy(aiResponse.message)
    };

  } catch (error) {
    console.error('AI analysis failed, using fallback:', error);
    return getFallbackOrganizationStructure(assessment);
  }
}

/**
 * Create organized sections based on AI analysis
 */
async function createOrganizedSections(
  questions: IQuestion[], 
  aiOrganization: any
): Promise<AssessmentSection[]> {
  // Group questions by section if they have sections, otherwise create logical groups
  const questionGroups = groupQuestionsByLogic(questions);
  
  const sections: AssessmentSection[] = [];
  
  for (const [groupKey, groupQuestions] of Object.entries(questionGroups)) {
    const sectionDifficulty = calculateSectionDifficulty(groupQuestions as IQuestion[]);
    const timeAllocation = calculateTimeAllocation(groupQuestions as IQuestion[]);
    
    const section: AssessmentSection = {
      id: `section_${groupKey}`,
      title: getSectionTitle(groupKey, groupQuestions as IQuestion[]),
      description: getSectionDescription(groupKey, groupQuestions as IQuestion[]),
      questions: groupQuestions as IQuestion[],
      timeAllocation,
      difficulty: sectionDifficulty,
      instructions: getSectionInstructions(groupKey, sectionDifficulty),
      objectives: getSectionObjectives(groupKey, groupQuestions as IQuestion[]),
      suggestedApproach: getSuggestedApproach(sectionDifficulty, groupQuestions as IQuestion[])
    };
    
    sections.push(section);
  }
  
  // Sort sections by recommended order (usually easy to hard)
  return sections.sort((a, b) => {
    const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });
}

/**
 * Generate study insights and recommendations
 */
async function generateStudyInsights(
  assessment: IAssessment, 
  sections: AssessmentSection[], 
  request: AssessmentOrganizationRequest
): Promise<any> {
  try {
    if (!geminiAIService.isAvailable()) {
      return getFallbackStudyInsights(assessment, sections);
    }

    const prompt = `Based on this assessment structure, provide study recommendations:

ASSESSMENT: ${assessment.title}
SECTIONS: ${sections.map(s => `${s.title} (${s.questions.length} questions, ${s.difficulty} difficulty)`).join(', ')}
TOTAL TIME: ${assessment.timeLimit || 60} minutes

Provide:
1. 3-5 specific study recommendations
2. 3-5 time management tips
3. Potential strengths this assessment tests
4. Common challenges students might face
5. Preparation tips for success

Be encouraging and practical.`;

    const aiResponse = await geminiAIService.sendMessage({
      userMessage: prompt,
      context: {
        page: 'study-recommendations',
        courseTitle: request.courseContext?.courseTitle
      }
    });

    return parseStudyInsights(aiResponse.message);

  } catch (error) {
    console.error('Failed to generate AI study insights:', error);
    return getFallbackStudyInsights(assessment, sections);
  }
}

/**
 * Helper functions
 */
function groupQuestionsByLogic(questions: IQuestion[]): Record<string, IQuestion[]> {
  // If questions have sections, use them
  const hasExistingSections = questions.some(q => q.section);
  
  if (hasExistingSections) {
    return questions.reduce((groups, question) => {
      const section = question.section || 'misc';
      if (!groups[section]) groups[section] = [];
      groups[section].push(question);
      return groups;
    }, {} as Record<string, IQuestion[]>);
  }
  
  // Otherwise, group by question type and difficulty
  return questions.reduce((groups, question, index) => {
    let groupKey: string;
    
    // Group by type primarily
    if (question.type === 'multiple_choice' || question.type === 'multiple_choice_multiple') {
      groupKey = 'multiple_choice';
    } else if (question.type === 'true_false') {
      groupKey = 'true_false';
    } else if (question.type === 'short_answer' || question.type === 'essay') {
      groupKey = 'written_response';
    } else {
      groupKey = 'specialized';
    }
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(question);
    return groups;
  }, {} as Record<string, IQuestion[]>);
}

function calculateSectionDifficulty(questions: IQuestion[]): 'easy' | 'medium' | 'hard' {
  const difficultyScores = questions.map(q => {
    if (q.difficulty === 'easy') return 1;
    if (q.difficulty === 'hard') return 3;
    return 2; // medium or unspecified
  });
  
  const avgScore = difficultyScores.reduce((sum, score) => sum + score, 0) / difficultyScores.length;
  
  if (avgScore <= 1.5) return 'easy';
  if (avgScore >= 2.5) return 'hard';
  return 'medium';
}

function calculateTimeAllocation(questions: IQuestion[]): number {
  // Base time allocation based on question types
  return questions.reduce((total, question) => {
    switch (question.type) {
      case 'multiple_choice':
      case 'true_false':
        return total + 1.5;
      case 'short_answer':
        return total + 3;
      case 'essay':
        return total + 8;
      case 'fill_in_blank':
      case 'numerical':
        return total + 2;
      default:
        return total + 2;
    }
  }, 0);
}

function getSectionTitle(groupKey: string, questions: IQuestion[]): string {
  const titles: Record<string, string> = {
    A: 'Section A - Foundation Questions',
    B: 'Section B - Application Questions', 
    C: 'Section C - Analysis Questions',
    multiple_choice: 'Multiple Choice Questions',
    true_false: 'True/False Questions',
    written_response: 'Written Response Questions',
    specialized: 'Specialized Questions'
  };
  
  return titles[groupKey] || `Section ${groupKey.toUpperCase()}`;
}

function getSectionDescription(groupKey: string, questions: IQuestion[]): string {
  const questionCount = questions.length;
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  
  return `This section contains ${questionCount} question${questionCount !== 1 ? 's' : ''} worth ${totalPoints} point${totalPoints !== 1 ? 's' : ''} total.`;
}

function getSectionInstructions(groupKey: string, difficulty: 'easy' | 'medium' | 'hard'): string {
  const baseInstructions = 'Read each question carefully and select or provide the best answer.';
  
  const difficultyInstructions: Record<string, string> = {
    easy: 'These questions test your basic understanding of the concepts.',
    medium: 'These questions require you to apply your knowledge and think critically.',
    hard: 'These questions are challenging and may require synthesis of multiple concepts.'
  };
  
  return `${baseInstructions} ${difficultyInstructions[difficulty]}`;
}

function getSectionObjectives(groupKey: string, questions: IQuestion[]): string[] {
  // Generic objectives based on question types
  const questionTypes = [...new Set(questions.map(q => q.type))];
  
  const objectives: string[] = [];
  
  if (questionTypes.includes('multiple_choice')) {
    objectives.push('Demonstrate knowledge of key concepts');
  }
  if (questionTypes.includes('essay') || questionTypes.includes('short_answer')) {
    objectives.push('Express understanding in your own words');
  }
  if (questionTypes.includes('true_false')) {
    objectives.push('Identify accurate statements about the subject');
  }
  
  objectives.push('Apply learned concepts to solve problems');
  
  return objectives;
}

function getSuggestedApproach(difficulty: 'easy' | 'medium' | 'hard', questions: IQuestion[]): string {
  const approaches: Record<string, string> = {
    easy: 'Start with confidence - these questions build your foundation. Take your time to read carefully.',
    medium: 'Think through each option carefully. Use process of elimination for multiple choice questions.',
    hard: 'Don\'t rush. These questions may require you to connect multiple concepts. Sketch out your thoughts if needed.'
  };
  
  return approaches[difficulty];
}

function analyzeDifficultyDistribution(questions: IQuestion[]): { easy: number; medium: number; hard: number } {
  return questions.reduce((dist, question) => {
    if (question.difficulty === 'easy') dist.easy++;
    else if (question.difficulty === 'hard') dist.hard++;
    else dist.medium++;
    return dist;
  }, { easy: 0, medium: 0, hard: 0 });
}

function calculateEstimatedTime(sections: AssessmentSection[], difficultyAnalysis: any): number {
  const baseTime = sections.reduce((total, section) => total + section.timeAllocation, 0);
  
  // Add buffer time based on difficulty
  const difficultyBuffer = (difficultyAnalysis.hard * 2) + (difficultyAnalysis.medium * 1);
  
  return Math.ceil(baseTime + difficultyBuffer);
}

/**
 * Fallback functions for when AI is not available
 */
function createFallbackOrganization(assessment: IAssessment): OrganizedAssessment {
  const sections: AssessmentSection[] = [{
    id: 'main_section',
    title: 'Assessment Questions',
    description: `Complete all ${assessment.questions.length} questions in this assessment.`,
    questions: assessment.questions,
    timeAllocation: assessment.timeLimit || 60,
    difficulty: 'medium',
    instructions: 'Answer all questions to the best of your ability.',
    objectives: ['Demonstrate understanding of course concepts'],
    suggestedApproach: 'Work through questions systematically and manage your time wisely.'
  }];

  return {
    originalAssessment: assessment,
    aiOrganized: false,
    organizationTimestamp: new Date().toISOString(),
    sections,
    overallInstructions: assessment.instructions || 'Complete this assessment to demonstrate your understanding.',
    studyRecommendations: [
      'Review your course materials before starting',
      'Read each question carefully',
      'Manage your time effectively'
    ],
    timeManagementTips: [
      'Allocate time based on question difficulty',
      'Don\'t spend too long on any single question',
      'Review your answers if time permits'
    ],
    difficultyAnalysis: analyzeDifficultyDistribution(assessment.questions),
    estimatedCompletionTime: assessment.timeLimit || 60,
    aiInsights: {
      strengths: ['Knowledge retention', 'Problem solving'],
      challenges: ['Time management', 'Question interpretation'],
      preparationTips: ['Review notes', 'Practice similar questions', 'Get adequate rest']
    }
  };
}

function getFallbackOrganizationStructure(assessment: IAssessment): any {
  return {
    aiAnalysis: 'Fallback analysis - AI not available',
    overallInstructions: assessment.instructions || 'Complete this assessment to demonstrate your understanding of the course material.',
    sectioningStrategy: 'Questions grouped by type and difficulty',
    timeStrategy: 'Allocate time evenly across all questions'
  };
}

function getFallbackStudyInsights(assessment: IAssessment, sections: AssessmentSection[]): any {
  return {
    studyRecommendations: [
      'Review all course materials related to the assessment topics',
      'Practice similar questions if available',
      'Ensure you understand key concepts thoroughly'
    ],
    timeManagementTips: [
      'Read through all questions first to plan your time',
      'Start with questions you feel most confident about',
      'Leave time at the end to review your answers'
    ],
    aiInsights: {
      strengths: ['Knowledge application', 'Critical thinking'],
      challenges: ['Time pressure', 'Complex questions'],
      preparationTips: ['Get good rest before the assessment', 'Have all materials ready', 'Stay calm and focused']
    }
  };
}

/**
 * Helper functions to extract information from AI responses
 */
function extractOverallInstructions(aiResponse: string, assessment: IAssessment): string {
  // Try to extract instructions from AI response, fallback to assessment instructions
  const instructionMatch = aiResponse.match(/instructions?[:\-](.*?)(?:\n|$)/i);
  if (instructionMatch) {
    return instructionMatch[1].trim();
  }
  
  return assessment.instructions || `Welcome to the ${assessment.title} assessment. This assessment contains ${assessment.questions.length} questions designed to test your understanding of the course material. Take your time, read each question carefully, and select the best answer. Good luck!`;
}

function extractSectioningStrategy(aiResponse: string): string {
  const strategyMatch = aiResponse.match(/section[a-z ]*strategy[:\-](.*?)(?:\n|$)/i);
  return strategyMatch ? strategyMatch[1].trim() : 'Questions organized by difficulty and topic';
}

function extractTimeManagementStrategy(aiResponse: string): string {
  const timeMatch = aiResponse.match(/time[a-z ]*management[:\-](.*?)(?:\n|$)/i);
  return timeMatch ? timeMatch[1].trim() : 'Allocate time evenly across all questions';
}

function parseStudyInsights(aiResponse: string): any {
  // Try to extract structured information from AI response
  const studyRecommendations: string[] = [];
  const timeManagementTips: string[] = [];
  const strengths: string[] = [];
  const challenges: string[] = [];
  const preparationTips: string[] = [];

  // Simple parsing - look for numbered lists or bullet points
  const lines = aiResponse.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.match(/study|recommendation/i)) {
      currentSection = 'study';
    } else if (trimmedLine.match(/time|management/i)) {
      currentSection = 'time';
    } else if (trimmedLine.match(/strength/i)) {
      currentSection = 'strengths';
    } else if (trimmedLine.match(/challenge/i)) {
      currentSection = 'challenges';
    } else if (trimmedLine.match(/preparation|tip/i)) {
      currentSection = 'preparation';
    }
    
    // Extract items from numbered or bulleted lists
    if (trimmedLine.match(/^[\d\-\*\•]/)) {
      const item = trimmedLine.replace(/^[\d\-\*\•\.\)]+\s*/, '').trim();
      if (item.length > 0) {
        switch (currentSection) {
          case 'study':
            studyRecommendations.push(item);
            break;
          case 'time':
            timeManagementTips.push(item);
            break;
          case 'strengths':
            strengths.push(item);
            break;
          case 'challenges':
            challenges.push(item);
            break;
          case 'preparation':
            preparationTips.push(item);
            break;
        }
      }
    }
  }

  // Fallback if parsing didn't work well
  return {
    studyRecommendations: studyRecommendations.length > 0 ? studyRecommendations : [
      'Review your course notes and materials',
      'Practice with similar questions',
      'Focus on understanding key concepts'
    ],
    timeManagementTips: timeManagementTips.length > 0 ? timeManagementTips : [
      'Read all questions first to plan your approach',
      'Start with easier questions to build confidence',
      'Keep track of time remaining'
    ],
    aiInsights: {
      strengths: strengths.length > 0 ? strengths : ['Knowledge retention', 'Problem-solving ability'],
      challenges: challenges.length > 0 ? challenges : ['Time management', 'Complex questions'],
      preparationTips: preparationTips.length > 0 ? preparationTips : ['Review materials', 'Get adequate rest', 'Stay focused']
    }
  };
}