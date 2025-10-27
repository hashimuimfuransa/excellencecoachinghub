import { Job } from '../types/job';

export interface TestCategory {
  id: string;
  name: string;
  description: string;
  questionTypes: QuestionType[];
}

export interface QuestionType {
  type: 'multiple_choice' | 'numerical' | 'logical' | 'verbal' | 'situational' | 'coding' | 'mechanical';
  weight: number;
  timePerQuestion: number; // in seconds
}

export interface GeneratedQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'numerical' | 'logical' | 'verbal' | 'situational' | 'coding' | 'mechanical';
  category: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  traits: string[];
  weight: number;
  timeLimit: number;
  chartData?: any;
  codeSnippet?: string;
  mechanicalDiagram?: string;
}

export interface JobTestBlueprint {
  jobId: string;
  jobTitle: string;
  categories: TestCategory[];
  totalQuestions: number;
  totalTimeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  skills: string[];
  traits: string[];
}

class AITestGenerationService {
  private skillToCategoryMapping: Record<string, string[]> = {
    // Technical Skills
    'JavaScript': ['coding', 'logical'],
    'Python': ['coding', 'logical'],
    'Java': ['coding', 'logical'],
    'React': ['coding', 'logical'],
    'Node.js': ['coding', 'logical'],
    'SQL': ['coding', 'logical'],
    'HTML': ['coding'],
    'CSS': ['coding'],
    'TypeScript': ['coding', 'logical'],
    'Angular': ['coding', 'logical'],
    'Vue.js': ['coding', 'logical'],
    'PHP': ['coding', 'logical'],
    'C++': ['coding', 'logical'],
    'C#': ['coding', 'logical'],
    'Go': ['coding', 'logical'],
    'Rust': ['coding', 'logical'],
    'Swift': ['coding', 'logical'],
    'Kotlin': ['coding', 'logical'],
    
    // Data & Analytics
    'Data Analysis': ['numerical', 'logical'],
    'Statistics': ['numerical', 'logical'],
    'Machine Learning': ['numerical', 'logical', 'coding'],
    'Data Science': ['numerical', 'logical', 'coding'],
    'Excel': ['numerical'],
    'Power BI': ['numerical', 'logical'],
    'Tableau': ['numerical', 'logical'],
    'R': ['coding', 'numerical'],
    'MATLAB': ['coding', 'numerical'],
    
    // Business & Finance
    'Accounting': ['numerical', 'attention_to_detail'],
    'Finance': ['numerical', 'logical'],
    'Financial Analysis': ['numerical', 'logical'],
    'Budget Management': ['numerical', 'situational'],
    'Investment Analysis': ['numerical', 'logical'],
    'Risk Management': ['logical', 'situational'],
    'Project Management': ['situational', 'logical'],
    'Business Analysis': ['logical', 'situational'],
    
    // Engineering & Technical
    'Mechanical Engineering': ['mechanical', 'numerical', 'logical'],
    'Electrical Engineering': ['mechanical', 'numerical', 'logical'],
    'Civil Engineering': ['mechanical', 'numerical', 'logical'],
    'Chemical Engineering': ['numerical', 'logical'],
    'Software Engineering': ['coding', 'logical'],
    'DevOps': ['coding', 'logical', 'situational'],
    'System Administration': ['coding', 'logical', 'situational'],
    'Network Engineering': ['logical', 'mechanical'],
    'Quality Assurance': ['attention_to_detail', 'logical'],
    'Testing': ['attention_to_detail', 'logical'],
    
    // Sales & Marketing
    'Sales': ['situational', 'verbal', 'personality'],
    'Marketing': ['verbal', 'logical', 'situational'],
    'Digital Marketing': ['logical', 'situational'],
    'SEO': ['logical', 'attention_to_detail'],
    'SEM': ['numerical', 'logical'],
    'Social Media': ['verbal', 'situational'],
    'Content Marketing': ['verbal', 'situational'],
    'Brand Management': ['situational', 'verbal'],
    'Customer Service': ['situational', 'verbal', 'personality'],
    'Customer Success': ['situational', 'verbal', 'personality'],
    
    // Management & Leadership
    'Team Leadership': ['situational', 'personality', 'verbal'],
    'Management': ['situational', 'personality', 'verbal'],
    'Strategic Planning': ['logical', 'situational'],
    'Operations Management': ['logical', 'situational', 'numerical'],
    'People Management': ['situational', 'personality'],
    'Change Management': ['situational', 'personality'],
    
    // Healthcare & Life Sciences
    'Nursing': ['situational', 'attention_to_detail', 'personality'],
    'Medicine': ['logical', 'situational', 'attention_to_detail'],
    'Healthcare': ['situational', 'personality', 'attention_to_detail'],
    'Pharmacy': ['attention_to_detail', 'numerical'],
    'Medical Research': ['logical', 'numerical', 'attention_to_detail'],
    'Clinical Research': ['logical', 'numerical', 'attention_to_detail'],
    
    // Design & Creative
    'UI/UX Design': ['logical', 'situational', 'attention_to_detail'],
    'Graphic Design': ['attention_to_detail', 'situational'],
    'Web Design': ['coding', 'attention_to_detail'],
    'Product Design': ['logical', 'situational'],
    
    // General Skills
    'Communication': ['verbal', 'situational'],
    'Problem Solving': ['logical', 'situational'],
    'Critical Thinking': ['logical'],
    'Attention to Detail': ['attention_to_detail'],
    'Time Management': ['situational', 'personality'],
    'Teamwork': ['situational', 'personality'],
    'Leadership': ['situational', 'personality'],
    'Adaptability': ['situational', 'personality'],
    'Creativity': ['situational', 'logical'],
    'Analytical Thinking': ['logical', 'numerical'],
  };

  private categoryDefinitions: Record<string, TestCategory> = {
    numerical: {
      id: 'numerical',
      name: 'Numerical Reasoning',
      description: 'Tests mathematical ability, data interpretation, and numerical problem-solving skills',
      questionTypes: [
        { type: 'numerical', weight: 1, timePerQuestion: 90 }
      ]
    },
    logical: {
      id: 'logical',
      name: 'Logical Reasoning',
      description: 'Evaluates pattern recognition, deductive reasoning, and abstract thinking',
      questionTypes: [
        { type: 'logical', weight: 1, timePerQuestion: 60 }
      ]
    },
    verbal: {
      id: 'verbal',
      name: 'Verbal Reasoning',
      description: 'Assesses language comprehension, critical reading, and communication skills',
      questionTypes: [
        { type: 'verbal', weight: 1, timePerQuestion: 75 }
      ]
    },
    attention_to_detail: {
      id: 'attention_to_detail',
      name: 'Attention to Detail',
      description: 'Measures accuracy, precision, and ability to spot errors or inconsistencies',
      questionTypes: [
        { type: 'multiple_choice', weight: 1, timePerQuestion: 45 }
      ]
    },
    situational: {
      id: 'situational',
      name: 'Situational Judgment',
      description: 'Evaluates decision-making skills in workplace scenarios',
      questionTypes: [
        { type: 'situational', weight: 1, timePerQuestion: 90 }
      ]
    },
    personality: {
      id: 'personality',
      name: 'Personality Assessment',
      description: 'Assesses behavioral traits, work style, and cultural fit',
      questionTypes: [
        { type: 'multiple_choice', weight: 1, timePerQuestion: 30 }
      ]
    },
    coding: {
      id: 'coding',
      name: 'Coding Aptitude',
      description: 'Tests programming logic, algorithm design, and technical problem-solving',
      questionTypes: [
        { type: 'coding', weight: 1, timePerQuestion: 180 }
      ]
    },
    mechanical: {
      id: 'mechanical',
      name: 'Mechanical Reasoning',
      description: 'Evaluates understanding of physical principles, mechanics, and spatial reasoning',
      questionTypes: [
        { type: 'mechanical', weight: 1, timePerQuestion: 75 }
      ]
    }
  };

  analyzeJobRequirements(job: Job): JobTestBlueprint {
    // Extract skills from job
    const jobSkills = [...(job.skills || []), ...(job.requirements || [])];
    const jobDescription = job.description.toLowerCase();
    const jobTitle = job.title.toLowerCase();
    
    // Identify relevant categories based on skills and description
    const relevantCategories = new Set<string>();
    const traits = new Set<string>();
    
    // Map skills to categories
    jobSkills.forEach(skill => {
      const categories = this.skillToCategoryMapping[skill];
      if (categories) {
        categories.forEach(cat => relevantCategories.add(cat));
      }
    });
    
    // Analyze job description and title for additional categories
    this.analyzeJobText(jobDescription + ' ' + jobTitle, relevantCategories, traits);
    
    // Ensure comprehensive coverage based on job type
    this.ensureComprehensiveCoverage(jobTitle, jobSkills, relevantCategories);
    
    // Always include these core categories for any job
    relevantCategories.add('situational'); // Always include situational judgment
    relevantCategories.add('personality');  // Always include personality assessment
    
    // Add logical reasoning for any analytical job
    if (this.isAnalyticalJob(jobTitle, jobSkills)) {
      relevantCategories.add('logical');
      relevantCategories.add('numerical');
    }
    
    // Add verbal for communication-heavy roles
    if (this.isCommunicationHeavyJob(jobTitle, jobSkills)) {
      relevantCategories.add('verbal');
    }
    
    // Convert to array and get category definitions
    const categories = Array.from(relevantCategories).map(catId => 
      this.categoryDefinitions[catId]
    ).filter(Boolean);
    
    // Determine difficulty based on job level
    const difficulty = this.determineDifficulty(job);
    
    // Fixed 20 questions total
    const totalQuestions = 20;
    const questionsPerCategory = Math.floor(totalQuestions / categories.length);
    const totalTimeLimit = this.calculateTotalTime(categories, questionsPerCategory);
    
    return {
      jobId: job._id,
      jobTitle: job.title,
      categories,
      totalQuestions,
      totalTimeLimit,
      difficulty,
      skills: jobSkills,
      traits: Array.from(traits)
    };
  }

  private ensureComprehensiveCoverage(jobTitle: string, jobSkills: string[], categories: Set<string>): void {
    const title = jobTitle.toLowerCase();
    
    // Technical roles - ensure coding and logical reasoning
    if (title.includes('developer') || title.includes('programmer') || title.includes('engineer') || 
        jobSkills.some(skill => ['JavaScript', 'Python', 'Java', 'React', 'Node.js'].includes(skill))) {
      categories.add('coding');
      categories.add('logical');
      categories.add('attention_to_detail');
    }
    
    // Management roles - ensure leadership assessment
    if (title.includes('manager') || title.includes('lead') || title.includes('director') || title.includes('head')) {
      categories.add('situational');
      categories.add('verbal');
      categories.add('personality');
    }
    
    // Finance/Accounting roles - ensure numerical reasoning
    if (title.includes('finance') || title.includes('accounting') || title.includes('analyst') || 
        jobSkills.some(skill => ['Excel', 'Financial Analysis', 'Accounting'].includes(skill))) {
      categories.add('numerical');
      categories.add('attention_to_detail');
      categories.add('logical');
    }
    
    // Sales/Marketing roles - ensure communication and situational
    if (title.includes('sales') || title.includes('marketing') || title.includes('business development')) {
      categories.add('verbal');
      categories.add('situational');
      categories.add('personality');
    }
    
    // Healthcare roles - ensure attention to detail and situational
    if (title.includes('nurse') || title.includes('doctor') || title.includes('healthcare') || title.includes('medical')) {
      categories.add('attention_to_detail');
      categories.add('situational');
      categories.add('personality');
    }
    
    // Engineering roles - ensure mechanical and numerical
    if (title.includes('mechanical') || title.includes('civil') || title.includes('electrical') || 
        title.includes('engineering')) {
      categories.add('mechanical');
      categories.add('numerical');
      categories.add('logical');
    }
    
    // Data roles - ensure numerical and logical
    if (title.includes('data') || title.includes('analyst') || title.includes('scientist') ||
        jobSkills.some(skill => ['Data Analysis', 'Statistics', 'Machine Learning'].includes(skill))) {
      categories.add('numerical');
      categories.add('logical');
      categories.add('coding');
    }
  }

  private isAnalyticalJob(jobTitle: string, jobSkills: string[]): boolean {
    const analyticalKeywords = ['analyst', 'scientist', 'researcher', 'engineer', 'developer'];
    const analyticalSkills = ['Data Analysis', 'Statistics', 'Research', 'Problem Solving'];
    
    return analyticalKeywords.some(keyword => jobTitle.toLowerCase().includes(keyword)) ||
           analyticalSkills.some(skill => jobSkills.includes(skill));
  }

  private isCommunicationHeavyJob(jobTitle: string, jobSkills: string[]): boolean {
    const communicationKeywords = ['manager', 'sales', 'marketing', 'consultant', 'coordinator', 'representative'];
    const communicationSkills = ['Communication', 'Presentation', 'Client Management', 'Team Leadership'];
    
    return communicationKeywords.some(keyword => jobTitle.toLowerCase().includes(keyword)) ||
           communicationSkills.some(skill => jobSkills.includes(skill));
  }

  private analyzeJobText(text: string, categories: Set<string>, traits: Set<string>) {
    const keywords = {
      numerical: ['math', 'calculation', 'budget', 'financial', 'analysis', 'data', 'statistics', 'metrics', 'revenue', 'profit'],
      logical: ['problem solving', 'analytical', 'reasoning', 'logic', 'strategy', 'planning', 'decision', 'evaluate'],
      verbal: ['communication', 'writing', 'presentation', 'documentation', 'report', 'client interaction', 'stakeholder'],
      coding: ['programming', 'development', 'software', 'code', 'algorithm', 'technical', 'system', 'database'],
      mechanical: ['engineering', 'mechanical', 'physical', 'equipment', 'machinery', 'technical drawing', 'CAD'],
      attention_to_detail: ['accuracy', 'precision', 'quality', 'review', 'audit', 'compliance', 'documentation'],
      situational: ['leadership', 'team', 'management', 'decision', 'conflict', 'collaboration', 'customer'],
      personality: ['culture', 'values', 'attitude', 'behavior', 'interpersonal', 'emotional intelligence']
    };

    Object.entries(keywords).forEach(([category, keywordList]) => {
      if (keywordList.some(keyword => text.includes(keyword))) {
        categories.add(category);
      }
    });

    // Add traits based on text analysis
    const traitKeywords = {
      'analytical': ['analysis', 'analytical', 'data', 'research'],
      'leadership': ['lead', 'manage', 'supervisor', 'director'],
      'teamwork': ['team', 'collaborate', 'cooperation'],
      'communication': ['communicate', 'present', 'write', 'report'],
      'creativity': ['creative', 'innovative', 'design', 'brainstorm'],
      'adaptability': ['adapt', 'flexible', 'change', 'dynamic']
    };

    Object.entries(traitKeywords).forEach(([trait, keywordList]) => {
      if (keywordList.some(keyword => text.includes(keyword))) {
        traits.add(trait);
      }
    });
  }

  private determineDifficulty(job: Job): 'easy' | 'medium' | 'hard' {
    const title = job.title.toLowerCase();
    const experience = job.experienceLevel?.toLowerCase() || '';
    
    // Determine based on job title and experience level
    if (title.includes('senior') || title.includes('lead') || title.includes('principal') || 
        title.includes('architect') || title.includes('director') || experience.includes('senior')) {
      return 'hard';
    } else if (title.includes('mid') || title.includes('intermediate') || 
               experience.includes('mid') || experience.includes('intermediate')) {
      return 'medium';
    } else if (title.includes('junior') || title.includes('entry') || title.includes('associate') ||
               experience.includes('junior') || experience.includes('entry')) {
      return 'easy';
    }
    
    return 'medium'; // Default
  }

  private calculateQuestionsPerCategory(categoryCount: number, difficulty: 'easy' | 'medium' | 'hard'): number {
    const totalQuestions = 20; // Fixed total of 20 questions
    
    // Distribute questions evenly across categories
    let questionsPerCategory = Math.floor(totalQuestions / categoryCount);
    
    // Ensure minimum 2 questions per category, maximum 5
    questionsPerCategory = Math.max(2, Math.min(5, questionsPerCategory));
    
    return questionsPerCategory;
  }

  private calculateTotalTime(categories: TestCategory[], questionsPerCategory: number): number {
    let totalTime = 0;
    categories.forEach(category => {
      category.questionTypes.forEach(questionType => {
        totalTime += questionType.timePerQuestion * questionsPerCategory;
      });
    });
    
    // Add 10% buffer time
    return Math.ceil(totalTime * 1.1);
  }

  async generateTestQuestions(blueprint: JobTestBlueprint): Promise<GeneratedQuestion[]> {
    const allQuestions: GeneratedQuestion[] = [];
    const totalQuestions = 20;
    const categoryCount = blueprint.categories.length;
    const usedQuestionContent = new Set<string>(); // Track question content to prevent duplicates
    
    console.log('🚀 Starting AI question generation for', categoryCount, 'categories');
    
    // Calculate questions per category to reach exactly 20 total
    const baseQuestionsPerCategory = Math.floor(totalQuestions / categoryCount);
    const remainingQuestions = totalQuestions % categoryCount;
    
    for (let i = 0; i < blueprint.categories.length; i++) {
      const category = blueprint.categories[i];
      // Some categories get one extra question to reach exactly 20
      const questionsForThisCategory = baseQuestionsPerCategory + (i < remainingQuestions ? 1 : 0);
      
      console.log(`🎯 Generating ${questionsForThisCategory} questions for category: ${category.name}`);
      
      const categoryQuestions = await this.generateQuestionsForCategory(
        category,
        questionsForThisCategory,
        blueprint.difficulty,
        blueprint.skills,
        blueprint.traits,
        blueprint.jobTitle,
        i, // Pass category index to ensure unique questions
        usedQuestionContent
      );
      
      allQuestions.push(...categoryQuestions);
      console.log(`✅ Generated ${categoryQuestions.length} unique questions for ${category.name}`);
    }
    
    // Ensure exactly 20 questions
    const finalQuestions = allQuestions.slice(0, 20);
    
    console.log(`🎉 Total questions generated: ${finalQuestions.length}`);
    console.log('📊 Questions by category:', finalQuestions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
    
    // Shuffle questions to mix categories
    return this.shuffleArray(finalQuestions);
  }
  
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async generateQuestionsForCategory(
    category: TestCategory,
    questionCount: number,
    difficulty: 'easy' | 'medium' | 'hard',
    jobSkills: string[],
    jobTraits: string[],
    jobTitle: string,
    categoryIndex: number = 0,
    usedQuestionContent?: Set<string>
  ): Promise<GeneratedQuestion[]> {
    const questions: GeneratedQuestion[] = [];
    const usedQuestionIndexes = new Set<number>();
    const contentTracker = usedQuestionContent || new Set<string>();
    
    // Get all available questions for this category
    const availableQuestions = await this.getAllQuestionsForCategory(category, difficulty, jobSkills, jobTitle);
    
    // Create a randomized array of indices to ensure no repeats
    const availableIndices = Array.from({ length: availableQuestions.length }, (_, i) => i);
    this.shuffleArray(availableIndices);
    
    let attemptCount = 0;
    const maxAttempts = availableIndices.length * 2; // Allow some retries
    
    for (let i = 0; i < questionCount && attemptCount < maxAttempts; i++) {
      let questionGenerated = false;
      
      // Try different indices until we get a unique question
      for (let j = 0; j < availableIndices.length && !questionGenerated; j++) {
        attemptCount++;
        const questionIndex = availableIndices[j];
        
        if (usedQuestionIndexes.has(questionIndex)) continue;
        
        // Generate unique question ID to prevent collisions
        const uniqueId = `${category.id}_${difficulty}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const question = await this.generateSingleQuestion(
          category,
          difficulty,
          jobSkills,
          jobTraits,
          jobTitle,
          questionIndex,
          uniqueId
        );
        
        // Check if this question content is unique
        const questionKey = `${question.question}_${category.id}`.toLowerCase().trim();
        if (!contentTracker.has(questionKey)) {
          contentTracker.add(questionKey);
          usedQuestionIndexes.add(questionIndex);
          questions.push(question);
          questionGenerated = true;
        }
      }
      
      // If we couldn't generate a unique question, create a variation
      if (!questionGenerated) {
        const baseIndex = i % availableIndices.length;
        const uniqueId = `${category.id}_${difficulty}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const question = await this.generateSingleQuestion(
          category,
          difficulty,
          jobSkills,
          jobTraits,
          jobTitle,
          baseIndex,
          uniqueId,
          i + 1 // Add variation seed
        );
        
        questions.push(question);
      }
    }
    
    return questions;
  }

  private async getAllQuestionsForCategory(
    category: TestCategory,
    difficulty: 'easy' | 'medium' | 'hard',
    jobSkills: string[],
    jobTitle: string
  ): Promise<any[]> {
    // Return the available question pool size for each category
    switch (category.id) {
      case 'numerical': return this.getNumericalQuestionPool(difficulty);
      case 'logical': return this.getLogicalQuestionPool(difficulty);
      case 'verbal': return this.getVerbalQuestionPool(difficulty);
      case 'coding': return this.getCodingQuestionPool(difficulty, jobSkills);
      case 'mechanical': return this.getMechanicalQuestionPool(difficulty);
      case 'attention_to_detail': return this.getAttentionQuestionPool(difficulty);
      case 'situational': return this.getSituationalQuestionPool(difficulty, jobTitle);
      case 'personality': return this.getPersonalityQuestionPool(difficulty);
      default: return new Array(10).fill({}); // Default pool size
    }
  }

  private async generateSingleQuestion(
    category: TestCategory,
    difficulty: 'easy' | 'medium' | 'hard',
    jobSkills: string[],
    jobTraits: string[],
    jobTitle: string,
    index: number,
    uniqueId?: string,
    variationSeed?: number
  ): Promise<GeneratedQuestion> {
    const questionType = category.questionTypes[0]; // Use first question type for simplicity
    const timeLimit = questionType.timePerQuestion;
    const questionId = uniqueId || `${category.id}_${difficulty}_${index}_${Date.now()}`;
    const effectiveIndex = variationSeed ? (index + variationSeed * 100) : index;
    
    switch (category.id) {
      case 'numerical':
        return this.generateNumericalQuestion(difficulty, jobTitle, effectiveIndex, timeLimit, questionId);
      case 'logical':
        return this.generateLogicalQuestion(difficulty, jobTitle, effectiveIndex, timeLimit, questionId);
      case 'verbal':
        return this.generateVerbalQuestion(difficulty, jobTitle, effectiveIndex, timeLimit, questionId);
      case 'coding':
        return this.generateCodingQuestion(difficulty, jobSkills, effectiveIndex, timeLimit, questionId);
      case 'mechanical':
        return this.generateMechanicalQuestion(difficulty, jobTitle, effectiveIndex, timeLimit, questionId);
      case 'attention_to_detail':
        return this.generateAttentionQuestion(difficulty, jobTitle, effectiveIndex, timeLimit, questionId);
      case 'situational':
        return this.generateSituationalQuestion(difficulty, jobTitle, jobTraits, effectiveIndex, timeLimit, questionId);
      case 'personality':
        return this.generatePersonalityQuestion(difficulty, jobTraits, effectiveIndex, timeLimit, questionId);
      default:
        return this.generateDefaultQuestion(category, difficulty, effectiveIndex, timeLimit, questionId);
    }
  }

  private generateNumericalQuestion(difficulty: string, jobTitle: string, index: number, timeLimit: number, questionId: string): GeneratedQuestion {
    const easyScenarios = [
      {
        question: "A company has 120 employees. If 25% work remotely, how many employees work remotely?",
        options: ["25", "30", "35", "40"],
        correctAnswer: "30",
        explanation: "25% of 120 = 0.25 × 120 = 30 employees"
      },
      {
        question: "Sales were $80,000 in Q1 and $100,000 in Q2. What is the percentage increase?",
        options: ["20%", "25%", "30%", "35%"],
        correctAnswer: "25%",
        explanation: "Increase = $100,000 - $80,000 = $20,000. Percentage = ($20,000 ÷ $80,000) × 100 = 25%"
      },
      {
        question: "A product costs $200. With a 10% discount, what is the final price?",
        options: ["$180", "$190", "$200", "$220"],
        correctAnswer: "$180",
        explanation: "10% discount = $200 × 0.10 = $20. Final price = $200 - $20 = $180"
      },
      {
        question: "In a team of 8 people, 3 are absent. What fraction of the team is present?",
        options: ["3/8", "5/8", "3/5", "8/5"],
        correctAnswer: "5/8",
        explanation: "Present = 8 - 3 = 5 people. Fraction = 5/8"
      },
      {
        question: "Monthly salary is $5,000. What is the yearly salary?",
        options: ["$50,000", "$55,000", "$60,000", "$65,000"],
        correctAnswer: "$60,000",
        explanation: "$5,000 × 12 months = $60,000"
      },
      {
        question: "Budget is $1,000. If $750 is spent, how much remains?",
        options: ["$200", "$250", "$300", "$350"],
        correctAnswer: "$250",
        explanation: "$1,000 - $750 = $250"
      },
      {
        question: "A class has 40 students. If 60% are female, how many male students are there?",
        options: ["16", "20", "24", "28"],
        correctAnswer: "16",
        explanation: "Female = 40 × 0.60 = 24. Male = 40 - 24 = 16"
      },
      {
        question: "If a project takes 15 hours and 3 people work on it, how many total person-hours are required?",
        options: ["45", "50", "60", "75"],
        correctAnswer: "45",
        explanation: "15 hours × 3 people = 45 person-hours"
      },
      {
        question: "A car travels 300 miles using 10 gallons of gas. What is the miles per gallon?",
        options: ["25", "30", "35", "40"],
        correctAnswer: "30",
        explanation: "300 miles ÷ 10 gallons = 30 miles per gallon"
      },
      {
        question: "An office has 50 computers. If 20% need repairs, how many computers need repairs?",
        options: ["8", "10", "12", "15"],
        correctAnswer: "10",
        explanation: "20% of 50 = 0.20 × 50 = 10 computers"
      },
      {
        question: "Revenue increased from $500,000 to $600,000. What is the percentage increase?",
        options: ["15%", "20%", "25%", "30%"],
        correctAnswer: "20%",
        explanation: "Increase = $600,000 - $500,000 = $100,000. Percentage = ($100,000 ÷ $500,000) × 100 = 20%"
      },
      {
        question: "A meeting room holds 30 people. If it's 80% full, how many people are in the room?",
        options: ["20", "24", "26", "28"],
        correctAnswer: "24",
        explanation: "80% of 30 = 0.80 × 30 = 24 people"
      }
    ];

    const mediumScenarios = [
      {
        question: "A project budget is $50,000. If 60% has been spent and there's a 15% cost overrun, what's the total amount spent?",
        options: ["$30,000", "$34,500", "$45,000", "$57,500"],
        correctAnswer: "$34,500",
        explanation: "60% of $50,000 = $30,000. With 15% overrun: $30,000 × 1.15 = $34,500"
      },
      {
        question: "If a machine produces 150 units per hour and operates 8 hours per day, how many units are produced in 5 days?",
        options: ["6,000", "7,200", "8,400", "9,600"],
        correctAnswer: "6,000",
        explanation: "150 units/hour × 8 hours/day × 5 days = 6,000 units"
      },
      {
        question: "Sales team: 5 members with average performance of 80%. If 2 members improve to 90%, what's the new average?",
        options: ["82%", "84%", "86%", "88%"],
        correctAnswer: "84%",
        explanation: "Total: (3×80%) + (2×90%) = 240% + 180% = 420%. Average = 420%/5 = 84%"
      },
      {
        question: "Investment of $8,000 earns 6% simple interest for 3 years. What's the total amount?",
        options: ["$9,200", "$9,440", "$9,600", "$9,800"],
        correctAnswer: "$9,440",
        explanation: "Interest = $8,000 × 0.06 × 3 = $1,440. Total = $8,000 + $1,440 = $9,440"
      },
      {
        question: "Production costs: Materials $3,000, Labor $2,000, Overhead 25% of total direct costs. What's total cost?",
        options: ["$6,000", "$6,250", "$6,500", "$6,750"],
        correctAnswer: "$6,250",
        explanation: "Direct costs = $3,000 + $2,000 = $5,000. Overhead = $5,000 × 0.25 = $1,250. Total = $6,250"
      },
      {
        question: "Quarterly sales: Q1=$40k, Q2=$48k, Q3=$36k. What must Q4 be for $180k annual target?",
        options: ["$52,000", "$54,000", "$56,000", "$58,000"],
        correctAnswer: "$56,000",
        explanation: "Current total = $40k + $48k + $36k = $124k. Q4 = $180k - $124k = $56k"
      }
    ];

    const hardScenarios = [
      {
        question: "An investment of $10,000 grows at 8% annually. With quarterly compounding, what's the value after 2 years?",
        options: ["$11,698", "$11,716", "$11,734", "$11,752"],
        correctAnswer: "$11,716",
        explanation: "A = P(1 + r/n)^(nt) = 10,000(1 + 0.08/4)^(4×2) = 10,000(1.02)^8 ≈ $11,716"
      },
      {
        question: "A company's profit margin decreased from 12% to 9%. If revenue remained at $500,000, by how much did profit decrease?",
        options: ["$15,000", "$18,000", "$21,000", "$24,000"],
        correctAnswer: "$15,000",
        explanation: "Original profit: $500,000 × 0.12 = $60,000. New profit: $500,000 × 0.09 = $45,000. Decrease = $15,000"
      },
      {
        question: "Portfolio: 40% stocks (15% return), 35% bonds (8% return), 25% cash (3% return). What's the weighted average return?",
        options: ["10.45%", "10.75%", "11.05%", "11.35%"],
        correctAnswer: "10.75%",
        explanation: "Weighted return = (40% × 15%) + (35% × 8%) + (25% × 3%) = 6% + 2.8% + 0.75% = 9.55%"
      },
      {
        question: "NPV calculation: Initial investment $100k, annual cash flows $30k for 4 years, discount rate 10%. What's the NPV?",
        options: ["$5,096", "$8,465", "$12,434", "$15,678"],
        correctAnswer: "$8,465",
        explanation: "NPV = -100,000 + 30,000/(1.1)^1 + 30,000/(1.1)^2 + 30,000/(1.1)^3 + 30,000/(1.1)^4 ≈ $8,465"
      },
      {
        question: "Break-even analysis: Fixed costs $50k, variable cost per unit $15, selling price $25. How many units to break even?",
        options: ["3,500", "4,000", "4,500", "5,000"],
        correctAnswer: "5,000",
        explanation: "Contribution margin = $25 - $15 = $10. Break-even = $50,000 ÷ $10 = 5,000 units"
      }
    ];
    
    let scenarios;
    switch(difficulty) {
      case 'easy': scenarios = easyScenarios; break;
      case 'hard': scenarios = hardScenarios; break;
      default: scenarios = mediumScenarios; break;
    }
    
    const scenario = scenarios[index % scenarios.length];
    
    return {
      _id: questionId,
      question: scenario.question,
      type: 'numerical',
      category: 'numerical',
      options: scenario.options,
      correctAnswer: scenario.correctAnswer,
      explanation: scenario.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['analytical', 'problem_solving', 'mathematical_reasoning'],
      weight: 1,
      timeLimit
    };
  }

  private generateLogicalQuestion(difficulty: string, jobTitle: string, index: number, timeLimit: number, questionId: string): GeneratedQuestion {
    const patterns = [
      {
        question: "Complete the sequence: 2, 6, 12, 20, 30, ?",
        options: ["40", "42", "44", "46"],
        correctAnswer: "42",
        explanation: "The differences are 4, 6, 8, 10, so the next difference is 12. 30 + 12 = 42"
      },
      {
        question: "If all Xs are Ys, and some Ys are Zs, which statement must be true?",
        options: ["All Xs are Zs", "Some Xs are Zs", "No Xs are Zs", "Cannot determine"],
        correctAnswer: "Cannot determine",
        explanation: "We don't have enough information to determine the relationship between Xs and Zs"
      }
    ];
    
    const pattern = patterns[index % patterns.length];
    
    return {
      _id: questionId,
      question: pattern.question,
      type: 'logical',
      category: 'logical',
      options: pattern.options,
      correctAnswer: pattern.correctAnswer,
      explanation: pattern.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['logical_thinking', 'pattern_recognition'],
      weight: 1,
      timeLimit
    };
  }

  private generateVerbalQuestion(difficulty: string, jobTitle: string, index: number, timeLimit: number): GeneratedQuestion {
    const passages = [
      {
        question: "Read the passage: 'The new marketing strategy resulted in a 25% increase in customer engagement. However, conversion rates remained stable.' What can be concluded?",
        options: [
          "More customers are buying products",
          "Customers are more interested but not necessarily buying more",
          "The marketing strategy failed",
          "Conversion rates decreased"
        ],
        correctAnswer: "Customers are more interested but not necessarily buying more",
        explanation: "Higher engagement with stable conversion rates means more interest but not necessarily more purchases"
      }
    ];
    
    const passage = passages[index % passages.length];
    
    return {
      _id: `verbal-${Date.now()}-${index}`,
      question: passage.question,
      type: 'verbal',
      category: 'verbal',
      options: passage.options,
      correctAnswer: passage.correctAnswer,
      explanation: passage.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['reading_comprehension', 'analytical_thinking'],
      weight: 1,
      timeLimit
    };
  }

  private generateCodingQuestion(difficulty: string, jobSkills: string[], index: number, timeLimit: number): GeneratedQuestion {
    const easyQuestions = [
      {
        question: "What will this JavaScript code output?\n\n```javascript\nconst x = 5;\nconst y = '5';\nconsole.log(x == y);\nconsole.log(x === y);\n```",
        options: ["true, true", "true, false", "false, true", "false, false"],
        correctAnswer: "true, false",
        explanation: "== does type coercion (5 == '5' is true), but === checks type and value (5 === '5' is false)",
        codeSnippet: "const x = 5;\nconst y = '5';\nconsole.log(x == y);\nconsole.log(x === y);"
      },
      {
        question: "What is the output of this Python code?\n\n```python\nlist1 = [1, 2, 3]\nlist2 = list1\nlist2.append(4)\nprint(len(list1))\n```",
        options: ["3", "4", "Error", "None"],
        correctAnswer: "4",
        explanation: "list2 = list1 creates a reference, not a copy. Modifying list2 affects list1. Length becomes 4.",
        codeSnippet: "list1 = [1, 2, 3]\nlist2 = list1\nlist2.append(4)\nprint(len(list1))"
      }
    ];

    const mediumQuestions = [
      {
        question: "What will this JavaScript code output?\n\n```javascript\nconst arr = [1, 2, 3];\nconst result = arr.map(x => x * 2).filter(x => x > 2);\nconsole.log(result);\n```",
        options: ["[1, 2, 3]", "[2, 4, 6]", "[4, 6]", "[2, 4]"],
        correctAnswer: "[4, 6]",
        explanation: "map(x => x * 2) gives [2, 4, 6], then filter(x => x > 2) removes 2, leaving [4, 6]",
        codeSnippet: "const arr = [1, 2, 3];\nconst result = arr.map(x => x * 2).filter(x => x > 2);\nconsole.log(result);"
      },
      {
        question: "What is the time complexity of this function?\n\n```python\ndef find_duplicates(arr):\n    duplicates = []\n    for i in range(len(arr)):\n        for j in range(i+1, len(arr)):\n            if arr[i] == arr[j]:\n                duplicates.append(arr[i])\n    return duplicates\n```",
        options: ["O(n)", "O(n log n)", "O(n²)", "O(2^n)"],
        correctAnswer: "O(n²)",
        explanation: "Nested loops iterate through all pairs of elements, resulting in O(n²) time complexity",
        codeSnippet: "def find_duplicates(arr):\n    duplicates = []\n    for i in range(len(arr)):\n        for j in range(i+1, len(arr)):\n            if arr[i] == arr[j]:\n                duplicates.append(arr[i])\n    return duplicates"
      }
    ];

    const hardQuestions = [
      {
        question: "What will this JavaScript closure code output?\n\n```javascript\nconst createFunctions = () => {\n    const funcs = [];\n    for (let i = 0; i < 3; i++) {\n        funcs.push(() => console.log(i));\n    }\n    return funcs;\n};\nconst functions = createFunctions();\nfunctions[0]();\nfunctions[1]();\n```",
        options: ["0, 1", "3, 3", "0, 0", "undefined, undefined"],
        correctAnswer: "3, 3",
        explanation: "The closure captures the variable i after the loop completes. Since let creates block scope, all functions capture the final value of i (3)",
        codeSnippet: "const createFunctions = () => {\n    const funcs = [];\n    for (let i = 0; i < 3; i++) {\n        funcs.push(() => console.log(i));\n    }\n    return funcs;\n};"
      },
      {
        question: "What is the output of this React Hook code?\n\n```javascript\nfunction Component() {\n    const [count, setCount] = useState(0);\n    \n    useEffect(() => {\n        setCount(count + 1);\n    }, [count]);\n    \n    return <div>{count}</div>;\n}\n```",
        options: ["0", "1", "Infinite loop", "Error"],
        correctAnswer: "Infinite loop",
        explanation: "useEffect depends on count and updates count, creating an infinite loop of re-renders",
        codeSnippet: "function Component() {\n    const [count, setCount] = useState(0);\n    useEffect(() => {\n        setCount(count + 1);\n    }, [count]);\n    return <div>{count}</div>;\n}"
      }
    ];
    
    let questions;
    switch(difficulty) {
      case 'easy': questions = easyQuestions; break;
      case 'hard': questions = hardQuestions; break;
      default: questions = mediumQuestions; break;
    }
    
    // Select question based on job skills if relevant
    let selectedQuestion = questions[index % questions.length];
    
    // Prefer language-specific questions if skills match
    if (jobSkills.includes('JavaScript') || jobSkills.includes('React')) {
      const jsQuestions = questions.filter(q => q.codeSnippet.includes('javascript') || q.question.includes('JavaScript'));
      if (jsQuestions.length > 0) {
        selectedQuestion = jsQuestions[index % jsQuestions.length];
      }
    } else if (jobSkills.includes('Python')) {
      const pythonQuestions = questions.filter(q => q.codeSnippet.includes('python') || q.question.includes('Python'));
      if (pythonQuestions.length > 0) {
        selectedQuestion = pythonQuestions[index % pythonQuestions.length];
      }
    }
    
    return {
      _id: `coding-${Date.now()}-${index}`,
      question: selectedQuestion.question,
      type: 'coding',
      category: 'coding',
      options: selectedQuestion.options,
      correctAnswer: selectedQuestion.correctAnswer,
      explanation: selectedQuestion.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['programming_logic', 'problem_solving', 'technical_knowledge'],
      weight: 1,
      timeLimit,
      codeSnippet: selectedQuestion.codeSnippet
    };
  }

  private generateMechanicalQuestion(difficulty: string, jobTitle: string, index: number, timeLimit: number): GeneratedQuestion {
    const mechanicalQuestions = [
      {
        question: "In a gear system, if Gear A (20 teeth) drives Gear B (40 teeth), and Gear A rotates at 100 RPM, what is Gear B's RPM?",
        options: ["50 RPM", "100 RPM", "150 RPM", "200 RPM"],
        correctAnswer: "50 RPM",
        explanation: "Gear ratio = 20:40 = 1:2. When Gear A rotates at 100 RPM, Gear B rotates at 100/2 = 50 RPM"
      }
    ];
    
    const question = mechanicalQuestions[index % mechanicalQuestions.length];
    
    return {
      _id: `mechanical-${Date.now()}-${index}`,
      question: question.question,
      type: 'mechanical',
      category: 'mechanical',
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['mechanical_reasoning', 'spatial_ability'],
      weight: 1,
      timeLimit
    };
  }

  private generateAttentionQuestion(difficulty: string, jobTitle: string, index: number, timeLimit: number): GeneratedQuestion {
    const attentionQuestions = [
      {
        question: "Find the error in this email address: john.smtih@company.co.uk",
        options: ["No error", "Missing @ symbol", "Misspelled 'smith'", "Wrong domain format"],
        correctAnswer: "Misspelled 'smith'",
        explanation: "'smtih' should be spelled 'smith'"
      }
    ];
    
    const question = attentionQuestions[index % attentionQuestions.length];
    
    return {
      _id: `attention-${Date.now()}-${index}`,
      question: question.question,
      type: 'multiple_choice',
      category: 'attention_to_detail',
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['attention_to_detail', 'accuracy'],
      weight: 1,
      timeLimit
    };
  }

  private generateSituationalQuestion(difficulty: string, jobTitle: string, jobTraits: string[], index: number, timeLimit: number): GeneratedQuestion {
    // General workplace situations
    const generalSituations = [
      {
        question: `As a ${jobTitle}, you notice a team member consistently missing deadlines. How do you handle this situation?`,
        options: [
          "Immediately report to management",
          "Have a private conversation to understand the issue",
          "Ignore it and hope it improves",
          "Publicly address it in a team meeting"
        ],
        correctAnswer: "Have a private conversation to understand the issue",
        explanation: "Direct, private communication allows you to understand root causes and provide appropriate support"
      },
      {
        question: `You're working on a high-priority project when your manager asks you to take on an urgent task. How do you respond?`,
        options: [
          "Immediately switch to the urgent task",
          "Explain your current workload and ask for priorities",
          "Refuse because you're too busy",
          "Try to do both simultaneously"
        ],
        correctAnswer: "Explain your current workload and ask for priorities",
        explanation: "Clear communication about workload and seeking priority guidance ensures effective resource allocation"
      }
    ];

    // Role-specific situations
    const developmentSituations = [
      {
        question: `You discover a critical bug in production code that you didn't write. The original developer is unavailable. What's your approach?`,
        options: [
          "Wait for the original developer to return",
          "Fix it immediately without documentation",
          "Analyze the issue, document findings, and implement a careful fix",
          "Revert to the previous version immediately"
        ],
        correctAnswer: "Analyze the issue, document findings, and implement a careful fix",
        explanation: "Systematic approach with documentation ensures proper resolution and knowledge sharing"
      }
    ];

    const managementSituations = [
      {
        question: `Two team members have conflicting approaches to solving a problem. Both are valid. How do you proceed?`,
        options: [
          "Choose the approach from the more senior person",
          "Let them work it out themselves",
          "Facilitate a discussion to combine the best of both approaches",
          "Make a unilateral decision"
        ],
        correctAnswer: "Facilitate a discussion to combine the best of both approaches",
        explanation: "Collaborative problem-solving leverages diverse perspectives and builds team cohesion"
      }
    ];

    const salesSituations = [
      {
        question: `A potential client expresses concerns about your product's price being higher than competitors. How do you respond?`,
        options: [
          "Immediately offer a discount",
          "Focus on unique value propositions and ROI",
          "Argue that higher price means better quality",
          "Refer them to a competitor"
        ],
        correctAnswer: "Focus on unique value propositions and ROI",
        explanation: "Value-based selling demonstrates product worth rather than competing solely on price"
      }
    ];

    // Select situation set based on job title
    let situations = generalSituations;
    const title = jobTitle.toLowerCase();
    
    if (title.includes('developer') || title.includes('engineer') || title.includes('programmer')) {
      situations = [...developmentSituations, ...generalSituations];
    } else if (title.includes('manager') || title.includes('lead') || title.includes('director')) {
      situations = [...managementSituations, ...generalSituations];
    } else if (title.includes('sales') || title.includes('account')) {
      situations = [...salesSituations, ...generalSituations];
    }
    
    const situation = situations[index % situations.length];
    
    // Determine traits based on situation type
    let traits = ['decision_making', 'problem_solving'];
    if (situation.question.includes('team') || situation.question.includes('colleague')) {
      traits.push('teamwork', 'communication');
    }
    if (situation.question.includes('client') || situation.question.includes('customer')) {
      traits.push('customer_focus', 'communication');
    }
    if (situation.question.includes('priority') || situation.question.includes('urgent')) {
      traits.push('time_management', 'prioritization');
    }
    
    return {
      _id: `situational-${Date.now()}-${index}`,
      question: situation.question,
      type: 'situational',
      category: 'situational',
      options: situation.options,
      correctAnswer: situation.correctAnswer,
      explanation: situation.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits,
      weight: 1,
      timeLimit
    };
  }

  private generatePersonalityQuestion(difficulty: string, jobTraits: string[], index: number, timeLimit: number): GeneratedQuestion {
    const personalityQuestions = [
      {
        question: "I prefer to work on multiple projects simultaneously rather than focusing on one at a time.",
        options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        explanation: "This assesses multitasking preference and work style"
      }
    ];
    
    const question = personalityQuestions[index % personalityQuestions.length];
    
    return {
      _id: `personality-${Date.now()}-${index}`,
      question: question.question,
      type: 'multiple_choice',
      category: 'personality',
      options: question.options,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['work_style', 'personality'],
      weight: 1,
      timeLimit,
      explanation: question.explanation
    };
  }

  private generateVerbalQuestion(difficulty: string, jobTitle: string, index: number, timeLimit: number, questionId: string): GeneratedQuestion {
    const passages = [
      {
        question: "Read the passage: 'The new marketing strategy resulted in a 25% increase in customer engagement. However, conversion rates remained stable.' What can be concluded?",
        options: [
          "More customers are buying products",
          "Customers are more interested but not necessarily buying more",
          "The marketing strategy failed",
          "Conversion rates decreased"
        ],
        correctAnswer: "Customers are more interested but not necessarily buying more",
        explanation: "Higher engagement with stable conversion rates means more interest but not necessarily more purchases"
      },
      {
        question: "Which sentence best demonstrates professional communication?",
        options: [
          "Hey, can you get this done ASAP?",
          "Could you please complete this task at your earliest convenience?",
          "Do this now please",
          "This needs to be finished immediately"
        ],
        correctAnswer: "Could you please complete this task at your earliest convenience?",
        explanation: "This option uses polite, professional language with appropriate courtesy"
      },
      {
        question: "In business writing, what is the main purpose of an executive summary?",
        options: [
          "To provide detailed technical specifications",
          "To give a brief overview of key points and recommendations",
          "To list all team members involved",
          "To include financial data only"
        ],
        correctAnswer: "To give a brief overview of key points and recommendations",
        explanation: "An executive summary provides a concise overview for busy executives to quickly understand main points"
      }
    ];
    
    const passage = passages[index % passages.length];
    
    return {
      _id: questionId,
      question: passage.question,
      type: 'verbal',
      category: 'verbal',
      options: passage.options,
      correctAnswer: passage.correctAnswer,
      explanation: passage.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['communication', 'reading_comprehension', 'critical_thinking'],
      weight: 1,
      timeLimit
    };
  }

  private generateCodingQuestion(difficulty: string, jobSkills: string[], index: number, timeLimit: number, questionId: string): GeneratedQuestion {
    const codingQuestions = [
      {
        question: "What will be the output of this JavaScript code?\n```javascript\nconsole.log(typeof null);\n```",
        options: ["null", "undefined", "object", "string"],
        correctAnswer: "object",
        explanation: "In JavaScript, typeof null returns 'object' due to a historical bug in the language"
      },
      {
        question: "Which of the following is the correct way to declare a variable in modern JavaScript?",
        options: ["var myVar = 5;", "let myVar = 5;", "const myVar = 5;", "All of the above"],
        correctAnswer: "All of the above",
        explanation: "All three are valid ways to declare variables, though let and const are preferred in modern JavaScript"
      },
      {
        question: "What is the time complexity of binary search in a sorted array?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctAnswer: "O(log n)",
        explanation: "Binary search divides the search space in half with each comparison, resulting in logarithmic time complexity"
      }
    ];
    
    const question = codingQuestions[index % codingQuestions.length];
    
    return {
      _id: questionId,
      question: question.question,
      type: 'coding',
      category: 'coding',
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['technical_skills', 'problem_solving', 'programming'],
      weight: 1,
      timeLimit
    };
  }

  private generateMechanicalQuestion(difficulty: string, jobTitle: string, index: number, timeLimit: number, questionId: string): GeneratedQuestion {
    const mechanicalQuestions = [
      {
        question: "Which tool is most appropriate for measuring the internal diameter of a pipe?",
        options: ["Ruler", "Calipers", "Micrometer", "Vernier calipers"],
        correctAnswer: "Vernier calipers",
        explanation: "Vernier calipers are designed to measure both internal and external dimensions accurately"
      },
      {
        question: "What type of joint is most suitable for connecting two pieces of metal permanently?",
        options: ["Bolted joint", "Welded joint", "Threaded joint", "Riveted joint"],
        correctAnswer: "Welded joint",
        explanation: "Welding creates a permanent fusion bond between metal pieces"
      }
    ];
    
    const question = mechanicalQuestions[index % mechanicalQuestions.length];
    
    return {
      _id: questionId,
      question: question.question,
      type: 'mechanical',
      category: 'mechanical',
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['technical_knowledge', 'spatial_reasoning', 'mechanical_aptitude'],
      weight: 1,
      timeLimit
    };
  }

  private generateAttentionQuestion(difficulty: string, jobTitle: string, index: number, timeLimit: number, questionId: string): GeneratedQuestion {
    const attentionQuestions = [
      {
        question: "Find the error in this email address: 'john.doe@company.com'",
        options: ["No error", "Missing @ symbol", "Invalid domain", "Spelling error in username"],
        correctAnswer: "No error",
        explanation: "This email address follows the correct format with no errors"
      },
      {
        question: "Which of these numbers is different: 8745, 8754, 8475, 8574",
        options: ["8745", "8754", "8475", "All are the same"],
        correctAnswer: "8475",
        explanation: "8475 has the digits in a different order compared to the others"
      }
    ];
    
    const question = attentionQuestions[index % attentionQuestions.length];
    
    return {
      _id: questionId,
      question: question.question,
      type: 'multiple_choice',
      category: 'attention_to_detail',
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['attention_to_detail', 'accuracy', 'precision'],
      weight: 1,
      timeLimit
    };
  }

  private generateSituationalQuestion(difficulty: string, jobTitle: string, jobTraits: string[], index: number, timeLimit: number, questionId: string): GeneratedQuestion {
    const situationalQuestions = [
      {
        question: "You notice a colleague is consistently missing deadlines, affecting team performance. What's your best approach?",
        options: [
          "Report them to management immediately",
          "Have a private conversation to understand their challenges",
          "Ignore it as it's not your responsibility",
          "Complete their work for them"
        ],
        correctAnswer: "Have a private conversation to understand their challenges",
        explanation: "This shows empathy and leadership while addressing the issue constructively"
      },
      {
        question: "During a team meeting, two colleagues have a heated disagreement. How should you respond?",
        options: [
          "Take sides with the person you agree with",
          "Leave the meeting immediately",
          "Suggest focusing on finding common ground and solutions",
          "Tell them to stop arguing"
        ],
        correctAnswer: "Suggest focusing on finding common ground and solutions",
        explanation: "This demonstrates conflict resolution skills and maintains team productivity"
      }
    ];
    
    const question = situationalQuestions[index % situationalQuestions.length];
    
    return {
      _id: questionId,
      question: question.question,
      type: 'situational',
      category: 'situational',
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['leadership', 'teamwork', 'problem_solving', 'communication'],
      weight: 1,
      timeLimit
    };
  }

  private generatePersonalityQuestion(difficulty: string, jobTraits: string[], index: number, timeLimit: number, questionId: string): GeneratedQuestion {
    const personalityQuestions = [
      {
        question: "When working on a challenging project, I prefer to:",
        options: [
          "Work independently and figure it out myself",
          "Collaborate with team members to find solutions",
          "Seek guidance from supervisors",
          "Break it down into smaller, manageable tasks"
        ],
        correctAnswer: "Break it down into smaller, manageable tasks",
        explanation: "This shows practical problem-solving skills and organizational ability"
      },
      {
        question: "In high-pressure situations, I typically:",
        options: [
          "Remain calm and focused on priorities",
          "Feel overwhelmed but push through",
          "Seek support from colleagues",
          "Take breaks to manage stress"
        ],
        correctAnswer: "Remain calm and focused on priorities",
        explanation: "This demonstrates emotional resilience and stress management skills"
      }
    ];
    
    const question = personalityQuestions[index % personalityQuestions.length];
    
    return {
      _id: questionId,
      question: question.question,
      type: 'multiple_choice',
      category: 'personality',
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['personality', 'work_style', 'emotional_intelligence'],
      weight: 1,
      timeLimit
    };
  }

  private generateDefaultQuestion(category: TestCategory, difficulty: string, index: number, timeLimit: number, questionId: string): GeneratedQuestion {
    return {
      _id: questionId,
      question: `Sample question for ${category.name} category`,
      type: 'multiple_choice',
      category: category.id,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      traits: ['general'],
      weight: 1,
      timeLimit
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Question pool methods to prevent repetition
  private getNumericalQuestionPool(difficulty: string): any[] {
    const easyPool = [
      { question: "Company with 120 employees, 25% remote", type: "percentage" },
      { question: "Sales Q1: $80k, Q2: $100k, percentage increase", type: "percentage_change" },
      { question: "Revenue $200k, costs 60%, profit calculation", type: "basic_calculation" },
      { question: "10% discount on $500 item", type: "discount" },
      { question: "Team of 8, 3 absent, fraction present", type: "fraction" },
      { question: "Monthly salary $5000, yearly calculation", type: "multiplication" },
      { question: "Budget $1000, spent $750, remaining amount", type: "subtraction" }
    ];

    const mediumPool = [
      { question: "Project budget $50k, 60% spent, 15% overrun", type: "complex_percentage" },
      { question: "Machine 150 units/hour, 8 hours/day, 5 days", type: "rate_calculation" },
      { question: "Investment growth 8% annually, compound interest", type: "compound_interest" },
      { question: "Sales team performance ratios", type: "ratios" },
      { question: "Cost reduction analysis", type: "variance_analysis" },
      { question: "Production efficiency metrics", type: "efficiency" },
      { question: "Financial trend analysis", type: "trends" }
    ];

    const hardPool = [
      { question: "Quarterly compound interest calculation", type: "advanced_finance" },
      { question: "Profit margin analysis with revenue changes", type: "margin_analysis" },
      { question: "Complex ratio and proportion problems", type: "advanced_ratios" },
      { question: "Statistical variance calculations", type: "statistics" },
      { question: "Multi-variable optimization", type: "optimization" },
      { question: "Advanced financial modeling", type: "modeling" }
    ];

    switch(difficulty) {
      case 'easy': return easyPool;
      case 'hard': return hardPool;
      default: return mediumPool;
    }
  }

  private getLogicalQuestionPool(difficulty: string): any[] {
    return [
      { type: "sequence", pattern: "numerical" },
      { type: "sequence", pattern: "alphabetical" },
      { type: "syllogism", logic: "basic" },
      { type: "syllogism", logic: "complex" },
      { type: "pattern", shape: "geometric" },
      { type: "pattern", shape: "abstract" },
      { type: "deduction", level: difficulty },
      { type: "analogy", category: "verbal" },
      { type: "analogy", category: "numerical" }
    ];
  }

  private getVerbalQuestionPool(difficulty: string): any[] {
    return [
      { type: "comprehension", topic: "business" },
      { type: "comprehension", topic: "technical" },
      { type: "comprehension", topic: "general" },
      { type: "vocabulary", level: difficulty },
      { type: "grammar", complexity: difficulty },
      { type: "critical_thinking", scenario: "workplace" },
      { type: "inference", context: "professional" }
    ];
  }

  private getCodingQuestionPool(difficulty: string, jobSkills: string[]): any[] {
    const pool = [
      { language: "javascript", concept: "closures" },
      { language: "javascript", concept: "promises" },
      { language: "javascript", concept: "array_methods" },
      { language: "python", concept: "list_comprehension" },
      { language: "python", concept: "decorators" },
      { language: "general", concept: "algorithms" },
      { language: "general", concept: "data_structures" },
      { language: "general", concept: "complexity" }
    ];

    // Filter based on job skills
    if (jobSkills.includes('JavaScript') || jobSkills.includes('React')) {
      return pool.filter(q => q.language === 'javascript' || q.language === 'general');
    } else if (jobSkills.includes('Python')) {
      return pool.filter(q => q.language === 'python' || q.language === 'general');
    }
    
    return pool;
  }

  private getMechanicalQuestionPool(difficulty: string): any[] {
    return [
      { type: "gears", complexity: difficulty },
      { type: "pulleys", complexity: difficulty },
      { type: "levers", complexity: difficulty },
      { type: "forces", complexity: difficulty },
      { type: "motion", complexity: difficulty },
      { type: "energy", complexity: difficulty }
    ];
  }

  private getAttentionQuestionPool(difficulty: string): any[] {
    return [
      { type: "error_detection", context: "email" },
      { type: "error_detection", context: "data" },
      { type: "pattern_matching", complexity: difficulty },
      { type: "detail_comparison", format: "text" },
      { type: "detail_comparison", format: "numbers" },
      { type: "proofreading", document: "business" }
    ];
  }

  private getSituationalQuestionPool(difficulty: string, jobTitle: string): any[] {
    const basePool = [
      { scenario: "deadline_management", role: "general" },
      { scenario: "conflict_resolution", role: "general" },
      { scenario: "priority_setting", role: "general" },
      { scenario: "team_collaboration", role: "general" }
    ];

    const title = jobTitle.toLowerCase();
    if (title.includes('developer') || title.includes('engineer')) {
      basePool.push(
        { scenario: "bug_fixing", role: "technical" },
        { scenario: "code_review", role: "technical" },
        { scenario: "technical_debt", role: "technical" }
      );
    } else if (title.includes('manager') || title.includes('lead')) {
      basePool.push(
        { scenario: "team_motivation", role: "management" },
        { scenario: "performance_management", role: "management" },
        { scenario: "resource_allocation", role: "management" }
      );
    }

    return basePool;
  }

  private getPersonalityQuestionPool(difficulty: string): any[] {
    return [
      { trait: "extraversion", scale: "likert" },
      { trait: "conscientiousness", scale: "likert" },
      { trait: "openness", scale: "likert" },
      { trait: "agreeableness", scale: "likert" },
      { trait: "emotional_stability", scale: "likert" },
      { trait: "work_style", scale: "preference" },
      { trait: "communication_style", scale: "preference" },
      { trait: "leadership_style", scale: "preference" }
    ];
  }
}

export const aiTestGenerationService = new AITestGenerationService();