const mongoose = require('mongoose');
require('dotenv').config();

const Comment = require('./src/models/Comment').Comment;
const Post = require('./src/models/Post').Post;

async function debugComments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all posts
    const posts = await Post.find().select('_id content commentsCount');
    console.log('\n📝 Posts:');
    console.table(posts);

    // For each post with comments, check comment structure
    for (let post of posts) {
      if (post.commentsCount > 0) {
        console.log(`\n🔍 Debugging Post: ${post._id} (Comments Count: ${post.commentsCount})`);
        
        // Get ALL comments for this post (no filtering)
        const allComments = await Comment.find({ post: post._id }).select('_id content parentComment author createdAt');
        console.log(`📊 Total comments in DB: ${allComments.length}`);
        
        // Get top-level comments (what the API returns)
        const topLevelComments = await Comment.find({ 
          post: post._id, 
          parentComment: { $exists: false } 
        }).select('_id content parentComment author createdAt');
        console.log(`📊 Top-level comments (API returns): ${topLevelComments.length}`);
        
        // Get reply comments
        const replyComments = await Comment.find({ 
          post: post._id, 
          parentComment: { $exists: true } 
        }).select('_id content parentComment author createdAt');
        console.log(`📊 Reply comments: ${replyComments.length}`);

        if (allComments.length > 0) {
          console.log('📋 Sample comment structure:');
          console.log(JSON.stringify(allComments[0], null, 2));
        }

        console.log('---');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugComments();
