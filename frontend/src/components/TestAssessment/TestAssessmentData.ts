// Test data to demonstrate improved assessment functionality
export const testAssessmentData = {
  _id: 'test-assessment-123',
  title: 'Sample Enhanced Assessment',
  description: 'This assessment demonstrates all question types and sections',
  courseId: 'course-123',
  teacherId: 'teacher-123',
  type: 'quiz' as const,
  status: 'published' as const,
  duration: 60,
  totalPoints: 100,
  extractedQuestions: [
    // Section A - Multiple Choice Questions
    {
      question: 'What is the capital of France?',
      type: 'multiple_choice' as const,
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
      points: 10,
      aiExtracted: true,
      section: 'A',
      sectionTitle: 'Multiple Choice Questions'
    },
    {
      question: 'Which of the following are programming languages? (Select all that apply)',
      type: 'multiple_choice_multiple' as const,
      options: ['JavaScript', 'HTML', 'Python', 'CSS', 'Java'],
      correctAnswer: ['JavaScript', 'Python', 'Java'],
      points: 15,
      aiExtracted: true,
      section: 'A',
      sectionTitle: 'Multiple Choice Questions'
    },
    {
      question: 'The Earth is flat.',
      type: 'true_false' as const,
      correctAnswer: 'false',
      points: 5,
      aiExtracted: true,
      section: 'A',
      sectionTitle: 'Multiple Choice Questions'
    },
    {
      question: 'Fill in the blank: The process of converting source code into machine code is called _____.',
      type: 'fill_in_blank' as const,
      correctAnswer: 'compilation',
      points: 10,
      aiExtracted: true,
      section: 'A',
      sectionTitle: 'Multiple Choice Questions'
    },
    {
      question: 'What is the value of π (pi) to 2 decimal places?',
      type: 'numerical' as const,
      correctAnswer: '3.14',
      points: 5,
      aiExtracted: true,
      section: 'A',
      sectionTitle: 'Multiple Choice Questions'
    },

    // Section B - Matching Questions
    {
      question: 'Match the programming concepts with their definitions:',
      type: 'matching' as const,
      leftItems: [
        'Variable',
        'Function',
        'Loop',
        'Array'
      ],
      rightItems: [
        'A collection of elements of the same type',
        'A named storage location for data',
        'A block of code that performs a specific task',
        'A control structure that repeats code'
      ],
      matchingPairs: [
        { left: 'Variable', right: 'A named storage location for data' },
        { left: 'Function', right: 'A block of code that performs a specific task' },
        { left: 'Loop', right: 'A control structure that repeats code' },
        { left: 'Array', right: 'A collection of elements of the same type' }
      ],
      correctAnswer: JSON.stringify({
        'Variable': 'A named storage location for data',
        'Function': 'A block of code that performs a specific task',
        'Loop': 'A control structure that repeats code',
        'Array': 'A collection of elements of the same type'
      }),
      points: 20,
      aiExtracted: true,
      section: 'B',
      sectionTitle: 'Matching Questions'
    },

    // Section C - Written Responses
    {
      question: 'Briefly explain the difference between procedural and object-oriented programming.',
      type: 'short_answer' as const,
      correctAnswer: 'Procedural programming focuses on functions and procedures that operate on data, while object-oriented programming organizes code into objects that contain both data and methods.',
      points: 15,
      aiExtracted: true,
      section: 'C',
      sectionTitle: 'Written Response Questions'
    },
    {
      question: 'Write a detailed essay (300-500 words) discussing the importance of software testing in the development lifecycle. Include at least three different types of testing and explain their purposes.',
      type: 'essay' as const,
      correctAnswer: 'Software testing is crucial for ensuring quality, reliability, and user satisfaction. Types include unit testing (testing individual components), integration testing (testing component interactions), and user acceptance testing (validating user requirements).',
      points: 25,
      aiExtracted: true,
      section: 'C',
      sectionTitle: 'Written Response Questions'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const testAssignmentData = {
  _id: 'test-assignment-123',
  title: 'Enhanced Programming Assignment',
  description: 'Create a web application using modern JavaScript frameworks',
  instructions: `
    Create a responsive web application with the following requirements:
    
    1. Use React or Vue.js as the frontend framework
    2. Implement user authentication
    3. Create a dashboard with data visualization
    4. Ensure mobile responsiveness
    5. Include proper error handling
    6. Write unit tests for key components
    
    Submission Requirements:
    - Source code (zip file)
    - Documentation (PDF)
    - Demo video (max 5 minutes)
  `,
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  maxPoints: 100,
  submissionType: 'both' as const,
  allowedFileTypes: ['zip', 'pdf', 'mp4', 'mov'],
  maxFileSize: 50, // MB
  isRequired: true,
  status: 'published' as const,
  course: {
    _id: 'course-123',
    title: 'Advanced Web Development'
  },
  instructor: {
    _id: 'teacher-123',
    firstName: 'John',
    lastName: 'Doe'
  }
};