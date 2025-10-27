import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env['NODE_ENV'] === 'test'
      ? process.env['MONGODB_TEST_URI']
      : process.env['MONGODB_URI'];

    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 connection
      serverSelectionTimeoutMS: 60000, // 60 seconds timeout for server selection
      socketTimeoutMS: 60000, // 60 seconds timeout for socket operations
      connectTimeoutMS: 60000, // 60 seconds timeout for initial connection
      heartbeatFrequencyMS: 10000, // Check connection every 10 seconds
      retryWrites: true, // Retry failed writes
      retryReads: true, // Retry failed reads
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    };

    // Set Mongoose-specific options
    mongoose.set('bufferCommands', false);

    await mongoose.connect(mongoUri, options);

    console.log('✅ MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};
