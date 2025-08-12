import mongoose from 'mongoose';
import { User, Course, Quiz, Badge, UserProgress } from '../models';
import { TeacherProfile } from '../models/TeacherProfile';
import { UserRole, CourseStatus, QuizType, BadgeType } from '../../../shared/types';
import { seedNotifications } from './seedNotifications';

// Sample data for seeding the database
export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (only in development)
    if (process.env.NODE_ENV === 'development') {
      await User.deleteMany({});
      await Course.deleteMany({});
      await Quiz.deleteMany({});
      await Badge.deleteMany({});
      await UserProgress.deleteMany({});
      await TeacherProfile.deleteMany({});
      console.log('🗑️ Cleared existing data');
    }

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@excellencecoaching.com',
      password: 'Admin123!',
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true
    });

    // Create teacher users
    const teacher1 = await User.create({
      email: 'john.teacher@excellencecoaching.com',
      password: 'Teacher123!',
      firstName: 'John',
      lastName: 'Smith',
      role: UserRole.TEACHER,
      isEmailVerified: true,
      isActive: true
    });

    const teacher2 = await User.create({
      email: 'sarah.teacher@excellencecoaching.com',
      password: 'Teacher123!',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: UserRole.TEACHER,
      isEmailVerified: true,
      isActive: true
    });

    // Create approved teacher profiles
    const teacherProfile1 = await TeacherProfile.create({
      userId: teacher1._id,
      specialization: ['Web Development', 'JavaScript', 'React'],
      bio: 'Experienced web developer with 8+ years in the industry. Passionate about teaching modern web technologies.',
      experience: 8,
      education: [{
        degree: 'Bachelor of Computer Science',
        institution: 'University of Technology',
        year: 2015,
        field: 'Computer Science'
      }],
      certifications: [{
        name: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        issueDate: new Date('2022-01-15'),
        credentialId: 'AWS-DEV-2022-001'
      }],
      skills: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'MongoDB'],
      languages: ['English', 'Spanish'],
      teachingAreas: ['Web Development', 'Frontend Development', 'Backend Development'],
      preferredLevels: ['Beginner', 'Intermediate'],
      hourlyRate: 75,
      profileStatus: 'approved',
      submittedAt: new Date(),
      reviewedAt: new Date(),
      reviewedBy: adminUser._id,
      adminFeedback: 'Excellent qualifications and experience. Approved for teaching.'
    });

    const teacherProfile2 = await TeacherProfile.create({
      userId: teacher2._id,
      specialization: ['React', 'Advanced JavaScript', 'Frontend Architecture'],
      bio: 'Senior frontend developer and React expert. Love sharing knowledge about modern frontend development.',
      experience: 10,
      education: [{
        degree: 'Master of Software Engineering',
        institution: 'Tech Institute',
        year: 2013,
        field: 'Software Engineering'
      }],
      certifications: [{
        name: 'React Professional Certification',
        issuer: 'React Training',
        issueDate: new Date('2021-06-10'),
        credentialId: 'REACT-PRO-2021-045'
      }],
      skills: ['React', 'TypeScript', 'Redux', 'Next.js', 'GraphQL', 'Testing'],
      languages: ['English', 'French'],
      teachingAreas: ['React Development', 'Advanced JavaScript', 'Frontend Architecture'],
      preferredLevels: ['Intermediate', 'Advanced'],
      hourlyRate: 90,
      profileStatus: 'approved',
      submittedAt: new Date(),
      reviewedAt: new Date(),
      reviewedBy: adminUser._id,
      adminFeedback: 'Outstanding expertise in React and frontend development. Approved.'
    });

    // Create student users
    const student1 = await User.create({
      email: 'alice.student@example.com',
      password: 'Student123!',
      firstName: 'Alice',
      lastName: 'Brown',
      role: UserRole.STUDENT,
      isEmailVerified: true,
      isActive: true
    });

    const student2 = await User.create({
      email: 'bob.student@example.com',
      password: 'Student123!',
      firstName: 'Bob',
      lastName: 'Wilson',
      role: UserRole.STUDENT,
      isEmailVerified: true,
      isActive: true
    });

    const student3 = await User.create({
      email: 'charlie.student@example.com',
      password: 'Student123!',
      firstName: 'Charlie',
      lastName: 'Davis',
      role: UserRole.STUDENT,
      isEmailVerified: true,
      isActive: true
    });

    console.log('👥 Created users');

    // Create sample courses
    const course1 = await Course.create({
      title: 'Introduction to Web Development',
      description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
      instructor: teacher1._id,
      status: CourseStatus.APPROVED,
      category: 'Programming',
      tags: ['HTML', 'CSS', 'JavaScript', 'Web Development'],
      duration: 40,
      level: 'beginner',
      price: 99.99,
      isPublished: true,
      publishedAt: new Date(),
      content: [
        {
          title: 'Introduction to HTML',
          type: 'video',
          videoUrl: 'https://example.com/video1.mp4',
          duration: 30,
          order: 1,
          isRequired: true
        },
        {
          title: 'CSS Fundamentals',
          type: 'video',
          videoUrl: 'https://example.com/video2.mp4',
          duration: 45,
          order: 2,
          isRequired: true
        },
        {
          title: 'JavaScript Basics',
          type: 'video',
          videoUrl: 'https://example.com/video3.mp4',
          duration: 60,
          order: 3,
          isRequired: true
        }
      ],
      prerequisites: ['Basic computer skills'],
      learningOutcomes: [
        'Understand HTML structure and semantics',
        'Style web pages with CSS',
        'Add interactivity with JavaScript',
        'Build a complete web page'
      ]
    });

    const course2 = await Course.create({
      title: 'Advanced React Development',
      description: 'Master React.js with hooks, context, and modern development patterns.',
      instructor: teacher2._id,
      status: CourseStatus.APPROVED,
      category: 'Programming',
      tags: ['React', 'JavaScript', 'Frontend', 'Hooks'],
      duration: 60,
      level: 'advanced',
      price: 149.99,
      isPublished: true,
      publishedAt: new Date(),
      content: [
        {
          title: 'React Hooks Deep Dive',
          type: 'video',
          videoUrl: 'https://example.com/react1.mp4',
          duration: 90,
          order: 1,
          isRequired: true
        },
        {
          title: 'Context API and State Management',
          type: 'video',
          videoUrl: 'https://example.com/react2.mp4',
          duration: 75,
          order: 2,
          isRequired: true
        }
      ],
      prerequisites: ['Basic React knowledge', 'JavaScript ES6+'],
      learningOutcomes: [
        'Master React Hooks',
        'Implement complex state management',
        'Build scalable React applications'
      ]
    });

    const course3 = await Course.create({
      title: 'Data Science Fundamentals',
      description: 'Introduction to data science with Python, statistics, and machine learning.',
      instructor: teacher1._id,
      status: CourseStatus.PENDING_APPROVAL,
      category: 'Data Science',
      tags: ['Python', 'Statistics', 'Machine Learning', 'Data Analysis'],
      duration: 80,
      level: 'intermediate',
      price: 199.99,
      isPublished: false,
      content: [
        {
          title: 'Python for Data Science',
          type: 'video',
          videoUrl: 'https://example.com/python1.mp4',
          duration: 120,
          order: 1,
          isRequired: true
        }
      ],
      prerequisites: ['Basic Python knowledge', 'High school mathematics'],
      learningOutcomes: [
        'Analyze data with Python',
        'Apply statistical methods',
        'Build machine learning models'
      ]
    });

    console.log('📚 Created courses');

    // Create sample quizzes
    const quiz1 = await Quiz.create({
      title: 'HTML Basics Quiz',
      description: 'Test your knowledge of HTML fundamentals',
      course: course1._id,
      questions: [
        {
          question: 'What does HTML stand for?',
          type: QuizType.MULTIPLE_CHOICE,
          options: [
            'Hyper Text Markup Language',
            'High Tech Modern Language',
            'Home Tool Markup Language',
            'Hyperlink and Text Markup Language'
          ],
          correctAnswer: 'Hyper Text Markup Language',
          explanation: 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.',
          points: 10,
          difficulty: 'easy',
          order: 1
        },
        {
          question: 'Which HTML tag is used for the largest heading?',
          type: QuizType.MULTIPLE_CHOICE,
          options: ['<h1>', '<h6>', '<heading>', '<header>'],
          correctAnswer: '<h1>',
          explanation: 'The <h1> tag represents the largest heading in HTML.',
          points: 10,
          difficulty: 'easy',
          order: 2
        },
        {
          question: 'HTML is a programming language.',
          type: QuizType.TRUE_FALSE,
          correctAnswer: 'false',
          explanation: 'HTML is a markup language, not a programming language.',
          points: 5,
          difficulty: 'easy',
          order: 3
        }
      ],
      timeLimit: 30,
      attempts: 3,
      passingScore: 70,
      isProctored: false,
      createdBy: teacher1._id
    });

    const quiz2 = await Quiz.create({
      title: 'React Hooks Assessment',
      description: 'Advanced quiz on React Hooks concepts',
      course: course2._id,
      questions: [
        {
          question: 'What is the purpose of the useEffect hook?',
          type: QuizType.SHORT_ANSWER,
          correctAnswer: 'To perform side effects in functional components',
          explanation: 'useEffect allows you to perform side effects in functional components, similar to componentDidMount, componentDidUpdate, and componentWillUnmount combined.',
          points: 15,
          difficulty: 'medium',
          order: 1
        },
        {
          question: 'Which hook would you use to manage complex state logic?',
          type: QuizType.MULTIPLE_CHOICE,
          options: ['useState', 'useReducer', 'useContext', 'useMemo'],
          correctAnswer: 'useReducer',
          explanation: 'useReducer is preferable to useState when you have complex state logic that involves multiple sub-values.',
          points: 20,
          difficulty: 'hard',
          order: 2
        }
      ],
      timeLimit: 45,
      attempts: 2,
      passingScore: 80,
      isProctored: true,
      createdBy: teacher2._id
    });

    console.log('📝 Created quizzes');

    // Create sample badges
    const badges = await Badge.create([
      {
        name: 'First Course Completed',
        description: 'Awarded for completing your first course',
        type: BadgeType.COURSE_COMPLETION,
        icon: '🎓',
        criteria: { coursesCompleted: 1 },
        points: 100,
        rarity: 'common',
        createdBy: adminUser._id
      },
      {
        name: 'Quiz Master',
        description: 'Awarded for scoring 100% on 5 quizzes',
        type: BadgeType.QUIZ_MASTER,
        icon: '🏆',
        criteria: { perfectQuizzes: 5 },
        points: 250,
        rarity: 'rare',
        createdBy: adminUser._id
      },
      {
        name: 'Early Bird',
        description: 'Awarded for joining live sessions early',
        type: BadgeType.EARLY_BIRD,
        icon: '🐦',
        criteria: { earlyJoins: 10 },
        points: 150,
        rarity: 'uncommon',
        createdBy: adminUser._id
      },
      {
        name: 'Perfect Attendance',
        description: 'Awarded for attending all live sessions in a course',
        type: BadgeType.PERFECT_ATTENDANCE,
        icon: '📅',
        criteria: { attendanceRate: 100 },
        points: 200,
        rarity: 'rare',
        createdBy: adminUser._id
      },
      {
        name: 'Streak Keeper',
        description: 'Awarded for maintaining a 30-day learning streak',
        type: BadgeType.STREAK_KEEPER,
        icon: '🔥',
        criteria: { streakDays: 30 },
        points: 300,
        rarity: 'epic',
        createdBy: adminUser._id
      }
    ]);

    console.log('🏅 Created badges');

    // Create sample user progress
    await UserProgress.create([
      {
        user: student1._id,
        course: course1._id,
        completedLessons: ['lesson1', 'lesson2'],
        completedQuizzes: [quiz1._id],
        totalTimeSpent: 120,
        progressPercentage: 75,
        totalPoints: 150,
        streakDays: 5,
        badges: [badges[0]._id]
      },
      {
        user: student2._id,
        course: course1._id,
        completedLessons: ['lesson1'],
        completedQuizzes: [],
        totalTimeSpent: 45,
        progressPercentage: 25,
        totalPoints: 50,
        streakDays: 2
      },
      {
        user: student1._id,
        course: course2._id,
        completedLessons: [],
        completedQuizzes: [],
        totalTimeSpent: 0,
        progressPercentage: 0,
        totalPoints: 0,
        streakDays: 0
      }
    ]);

    console.log('📊 Created user progress records');

    // Seed notifications
    await seedNotifications();

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Seeded Data Summary:
- Users: 6 (1 admin, 2 teachers, 3 students)
- Courses: 3 (2 approved, 1 pending)
- Quizzes: 2
- Badges: 5
- User Progress: 3 records

🔐 Login Credentials:
Admin: admin@excellencecoaching.com / Admin123!
Teacher 1: john.teacher@excellencecoaching.com / Teacher123!
Teacher 2: sarah.teacher@excellencecoaching.com / Teacher123!
Student 1: alice.student@example.com / Student123!
Student 2: bob.student@example.com / Student123!
Student 3: charlie.student@example.com / Student123!
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Function to run seeding from command line
export const runSeed = async (): Promise<void> => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/excellence-coaching-hub';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Run seeding
    await seedDatabase();

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  runSeed();
}
