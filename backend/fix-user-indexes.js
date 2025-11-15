require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/coachinghub';
console.log('Connecting to MongoDB at:', mongoUri);

mongoose.connect(mongoUri);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Get the users collection
    const collection = db.collection('users');
    
    // Drop the existing email index
    console.log('Dropping existing email index...');
    try {
      await collection.dropIndex('email_1');
      console.log('Successfully dropped email_1 index');
    } catch (error) {
      console.log('No existing email_1 index to drop or error dropping:', error.message);
    }
    
    // Drop the existing googleId index
    console.log('Dropping existing googleId index...');
    try {
      await collection.dropIndex('googleId_1');
      console.log('Successfully dropped googleId_1 index');
    } catch (error) {
      console.log('No existing googleId_1 index to drop or error dropping:', error.message);
    }
    
    // Drop the existing unsubscribeToken index
    console.log('Dropping existing unsubscribeToken index...');
    try {
      await collection.dropIndex('unsubscribeToken_1');
      console.log('Successfully dropped unsubscribeToken_1 index');
    } catch (error) {
      console.log('No existing unsubscribeToken_1 index to drop or error dropping:', error.message);
    }
    
    // Create new indexes with sparse option
    console.log('Creating new sparse indexes...');
    
    // Create sparse email index
    await collection.createIndex({ email: 1 }, { 
      unique: true, 
      sparse: true,
      name: 'email_1'
    });
    console.log('Created sparse email index');
    
    // Create sparse googleId index
    await collection.createIndex({ googleId: 1 }, { 
      unique: true, 
      sparse: true,
      name: 'googleId_1'
    });
    console.log('Created sparse googleId index');
    
    // Create sparse unsubscribeToken index
    await collection.createIndex({ unsubscribeToken: 1 }, { 
      unique: true, 
      sparse: true,
      name: 'unsubscribeToken_1'
    });
    console.log('Created sparse unsubscribeToken index');
    
    console.log('All indexes updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating indexes:', error);
    process.exit(1);
  }
});