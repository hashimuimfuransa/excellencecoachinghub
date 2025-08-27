import mongoose from 'mongoose';
import { config } from 'dotenv';
import { connectDatabase, disconnectDatabase } from './database';

// Load environment variables
config();

/**
 * Fix TestSession collection index issue
 * Remove the problematic sessionId_1 index that's causing duplicate key errors
 */
async function fixTestSessionIndex() {
  try {
    console.log('🔧 Starting TestSession index fix...');
    
    // Connect to database
    await connectDatabase();
    
    // Get the testsessions collection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const collection = db.collection('testsessions');
    
    // Check existing indexes
    console.log('📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Check if sessionId_1 index exists
    const sessionIdIndexExists = indexes.some(idx => idx.name === 'sessionId_1');
    
    if (sessionIdIndexExists) {
      console.log('🗑️  Dropping problematic sessionId_1 index...');
      await collection.dropIndex('sessionId_1');
      console.log('✅ Successfully dropped sessionId_1 index');
    } else {
      console.log('ℹ️  sessionId_1 index not found (already removed)');
    }
    
    // Remove any documents with sessionId field (cleanup)
    console.log('🧹 Cleaning up documents with sessionId field...');
    const result = await collection.updateMany(
      { sessionId: { $exists: true } },
      { $unset: { sessionId: 1 } }
    );
    console.log(`✅ Cleaned up ${result.modifiedCount} documents`);
    
    // Verify the fix by checking for conflicts
    console.log('🔍 Verifying the fix...');
    const documentsWithSessionId = await collection.countDocuments({ sessionId: { $exists: true } });
    console.log(`Documents with sessionId field: ${documentsWithSessionId}`);
    
    // Check final indexes
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:', finalIndexes.map(idx => idx.name));
    
    console.log('✅ TestSession index fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing TestSession index:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
}

// Run the fix if this script is called directly
if (require.main === module) {
  fixTestSessionIndex()
    .then(() => {
      console.log('🎉 Index fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Index fix failed:', error);
      process.exit(1);
    });
}

export { fixTestSessionIndex };