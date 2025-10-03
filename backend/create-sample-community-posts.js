const mongoose = require('mongoose');
const { Post } = require('./src/models/Post');
const { User } = require('./src/models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellence-coaching-hub');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create sample posts
const createSamplePosts = async () => {
  try {
    // First, find an existing user or create a test user
    let authorId;
    const existingUser = await User.findOne();
    
    if (existingUser) {
      authorId = existingUser._id;
      console.log(`Using existing user: ${existingUser.firstName} ${existingUser.lastName}`);
    } else {
      console.log('No existing users found. Creating a test user...');
      const testUser = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'hashedpassword', // In real scenario, this should be hashed
        isEmailVerified: true,
        role: 'student'
      });
      authorId = testUser._id;
      console.log(`Created test user: ${testUser.firstName} ${testUser.lastName}`);
    }
    
    console.log('Creating sample community posts...');
    
    // Sample posts data
    const samplePosts = [
      {
        author: authorId,
        content: "Just completed my React certification! 🎉 Sharing my learning journey and some tips for fellow developers. Feel free to ask me anything about React hooks and component lifecycle! #react #javascript #webdevelopment #learning",
        type: 'achievement',
        tags: ['react', 'javascript', 'webdevelopment', 'learning'],
        likes: [],
        comments: [],
        shares: 0
      },
      {
        author: authorId,
        content: "What's the best approach for state management in large React applications? I've been using Redux but I'm curious about newer alternatives like Zustand or MobX. What are your experiences?",
        type: 'question',
        tags: ['react', 'state-management', 'redux', 'zustand'],
        likes: [],
        comments: [],
        shares: 0
      },
      {
        author: authorId,
        content: "Excited to announce that we're launching a new JavaScript fundamentals course next week! This course will cover ES6+ features, async programming, and modern JavaScript patterns. Stay tuned for enrollment details! 📚",
        type: 'announcement',
        tags: ['javascript', 'course', 'announcement', 'education'],
        likes: [],
        comments: [],

        shares: 0
      }
    ];

    // Insert sample posts
    await Post.insertMany(samplePosts);
    console.log('✅ Sample community posts created successfully!');
    
    // Verify posts were created
    const createdPosts = await Post.find().sort({ createdAt: -1 }).limit(3);
    console.log(`📊 Created ${createdPosts.length} posts:`);
    createdPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.content.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('Error creating sample posts:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await createSamplePosts();
  await mongoose.connection.close();
  console.log('Script completed!');
};

// Check if this is the main module
if (require.main === module) {
  run();
}

module.exports = { createSamplePosts };
