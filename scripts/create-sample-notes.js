#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Define schemas (simplified versions)
const CourseSchema = new mongoose.Schema({
  title: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String
}, { timestamps: true });

const EnrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const CourseNotesSchema = new mongoose.Schema({
  title: String,
  description: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chapter: Number,
  sections: [{
    id: String,
    title: String,
    content: String,
    order: Number,
    type: { type: String, default: 'text' },
    isRequired: { type: Boolean, default: true },
    estimatedReadTime: Number
  }],
  isPublished: { type: Boolean, default: false },
  version: { type: Number, default: 1 }
}, { timestamps: true });

const Course = mongoose.model('Course', CourseSchema);
const User = mongoose.model('User', UserSchema);
const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
const CourseNotes = mongoose.model('CourseNotes', CourseNotesSchema);

const createSampleData = async () => {
  try {
    console.log('🔍 Checking existing data...');
    
    // Check if the course exists
    const courseId = '68937dcc7fd4938812659c36';
    const course = await Course.findById(courseId);
    
    if (!course) {
      console.log('❌ Course not found with ID:', courseId);
      return;
    }
    
    console.log('✅ Found course:', course.title);
    
    // Check if there are any enrollments
    const enrollments = await Enrollment.find({ course: courseId });
    console.log(`📚 Found ${enrollments.length} enrollments for this course`);
    
    // Check if there are any course notes
    const existingNotes = await CourseNotes.find({ course: courseId });
    console.log(`📝 Found ${existingNotes.length} existing course notes`);
    
    if (existingNotes.length === 0) {
      console.log('🔨 Creating sample course notes...');
      
      // Find the instructor
      const instructor = await User.findById(course.instructor);
      if (!instructor) {
        console.log('❌ Instructor not found');
        return;
      }
      
      // Create sample course notes
      const sampleNotes = new CourseNotes({
        title: 'Introduction to ' + course.title,
        description: 'Comprehensive introduction covering the fundamentals and key concepts.',
        course: courseId,
        instructor: course.instructor,
        chapter: 1,
        sections: [
          {
            id: 'section-1',
            title: 'Getting Started',
            content: `Welcome to ${course.title}! 

This comprehensive course will take you through all the essential concepts and practical applications. In this first section, we'll cover the fundamentals and set up the foundation for your learning journey.

Key topics covered:
• Understanding the core principles
• Setting up your learning environment  
• Overview of what you'll accomplish
• Best practices and common pitfalls to avoid

By the end of this section, you'll have a solid understanding of the basics and be ready to dive deeper into more advanced topics. Take your time to absorb the material and don't hesitate to revisit concepts as needed.

Remember: Learning is a journey, not a destination. Each concept builds upon the previous one, so make sure you understand each section before moving forward.`,
            order: 1,
            type: 'text',
            isRequired: true,
            estimatedReadTime: 5
          },
          {
            id: 'section-2', 
            title: 'Core Concepts',
            content: `Now that you have the foundation, let's explore the core concepts that form the backbone of ${course.title}.

Understanding these concepts is crucial for your success in this course. We'll break down complex ideas into manageable pieces and provide practical examples to illustrate each point.

Main concepts we'll cover:
• Fundamental principles and theories
• Real-world applications and use cases
• Common patterns and methodologies
• Tools and techniques used by professionals

Each concept is designed to build upon what you've already learned. Take notes, practice the examples, and make sure you understand how each piece fits into the bigger picture.

Pro tip: Try to relate these concepts to your own experiences or projects. This will help you remember and apply what you've learned more effectively.`,
            order: 2,
            type: 'text',
            isRequired: true,
            estimatedReadTime: 8
          },
          {
            id: 'section-3',
            title: 'Practical Applications',
            content: `Theory is important, but practical application is where real learning happens. In this section, we'll put everything you've learned into practice.

You'll work through hands-on examples that demonstrate how to apply the concepts in real-world scenarios. These exercises are designed to reinforce your understanding and build your confidence.

What you'll practice:
• Step-by-step implementation guides
• Common challenges and how to overcome them
• Best practices from industry experts
• Tips for optimizing your approach

Don't just read through the examples - try them yourself! Experiment with different approaches and see what works best for you. Making mistakes is part of the learning process, so don't be afraid to try new things.

Remember: The goal is not perfection, but progress. Each attempt teaches you something new and brings you closer to mastery.`,
            order: 3,
            type: 'text',
            isRequired: true,
            estimatedReadTime: 12
          }
        ],
        isPublished: true,
        version: 1
      });
      
      await sampleNotes.save();
      console.log('✅ Created sample course notes');
      
      // Create a second chapter
      const sampleNotes2 = new CourseNotes({
        title: 'Advanced Topics in ' + course.title,
        description: 'Deep dive into advanced concepts and professional techniques.',
        course: courseId,
        instructor: course.instructor,
        chapter: 2,
        sections: [
          {
            id: 'section-4',
            title: 'Advanced Techniques',
            content: `Welcome to the advanced section! Now that you have a solid foundation, we can explore more sophisticated techniques and approaches.

These advanced concepts will help you take your skills to the next level and tackle more complex challenges. We'll cover professional-grade techniques used in industry settings.

Advanced topics include:
• Complex problem-solving strategies
• Performance optimization techniques
• Advanced patterns and architectures
• Integration with other systems and tools

This section requires a good understanding of the basics, so make sure you're comfortable with the previous material before proceeding. The concepts here are more challenging but also more rewarding.

Challenge yourself: Try to think of ways you could apply these advanced techniques to your own projects or work scenarios.`,
            order: 1,
            type: 'text',
            isRequired: true,
            estimatedReadTime: 10
          },
          {
            id: 'section-5',
            title: 'Professional Best Practices',
            content: `In this final section, we'll cover the best practices that separate beginners from professionals. These are the techniques and approaches that experienced practitioners use every day.

Professional best practices include:
• Code organization and structure
• Testing and quality assurance
• Documentation and communication
• Collaboration and teamwork
• Continuous learning and improvement

These practices might seem less exciting than technical concepts, but they're what make the difference between a hobbyist and a professional. They ensure your work is maintainable, scalable, and valuable to others.

Take these practices seriously - they'll serve you well throughout your career and make you a more effective and respected professional in your field.

Congratulations on completing this course! You now have the knowledge and skills to tackle real-world challenges with confidence.`,
            order: 2,
            type: 'text',
            isRequired: true,
            estimatedReadTime: 8
          }
        ],
        isPublished: true,
        version: 1
      });
      
      await sampleNotes2.save();
      console.log('✅ Created second chapter of course notes');
    } else {
      console.log('📝 Course notes already exist, checking if they are published...');
      
      const publishedNotes = existingNotes.filter(note => note.isPublished);
      console.log(`📚 ${publishedNotes.length} notes are published`);
      
      if (publishedNotes.length === 0) {
        console.log('🔨 Publishing existing notes...');
        await CourseNotes.updateMany(
          { course: courseId },
          { $set: { isPublished: true } }
        );
        console.log('✅ Published all course notes');
      }
    }
    
    // Check enrollments and create sample enrollment if needed
    if (enrollments.length === 0) {
      console.log('🔍 No enrollments found. You may need to enroll a student in this course.');
      
      // Find a student user
      const student = await User.findOne({ role: 'student' });
      if (student) {
        const enrollment = new Enrollment({
          student: student._id,
          course: courseId,
          isActive: true
        });
        await enrollment.save();
        console.log('✅ Created sample enrollment for student:', student.email);
      }
    }
    
    console.log('🎉 Sample data creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

const main = async () => {
  await connectDB();
  await createSampleData();
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
};

main().catch(console.error);