const mongoose = require('mongoose');
const { Post } = require('./src/models/Post');

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
    console.log('Creating sample posts...');
    
    // Use a generic ObjectId for testing
    const authorId = new mongoose.Types.ObjectId();
    
    // Clear existing posts first
    await Post.deleteMany({});
    console.log('Cleared existing posts');
    
    // Sample posts data
    const samplePosts = [
      {
        author: authorId,
        content: "Just completed my React certification! 🎉 Sharing my learning journey and some tips for fellow developers. Feel free to ask me anything about React hooks and component lifecycle! #react #javascript #webdevelopment #learning",
        type: 'achievement',
        tags: ['react', 'javascript', 'webdevelopment', 'learning'],
        likes: [],
        comments: [],
        bookmarks: [],
        shares: 0
      },
      {
        author: authorId,
        content: "What's the best approach for state management in large React applications? I've been using Redux but I'm curious about newer alternatives like Zustand or MobX. What are your experiences?",
        type: 'question',
        tags: ['react', 'state-management', 'redux', 'zustand'],
        likes: [],
        comments: [],
        bookmarks: [],
        shares: 0
      },
      {
        author: authorId,
        content: "Excited to announce that we're launching a new JavaScript fundamentals course next week! This course will cover ES6+ features, async programming, and modern JavaScript patterns. Stay tuned for enrollment details! 📚",
        type: 'announcement',
        tags: ['javascript', 'course', 'announcement', 'education'],
        likes: [],
        comments: [],
        bookmarks: [],
        shares: 0
      }
    ];

    // Insert sample posts
    await Post.insertMany(samplePosts);
    console.log('✅ Sample community posts created successfully!');
    
    // Verify posts were created
    const createdPosts = await Post.find().sort({ createdAt: -1 });
    console.log(`📊 Created ${createdPosts.length} posts:`);
    createdPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.content.substring(0, 50)}...`);
      console.log(`   - Likes: ${post.likes.length}, Comments: ${post.comments.length}, Bookmarks: ${post.bookmarks.length}`);
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
