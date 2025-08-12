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
      serverSelectionTimeoutMS: 0, // No timeout for server selection (slow networks)
      socketTimeoutMS: 0, // No timeout for socket operations (slow networks)
      connectTimeoutMS: 0, // No timeout for initial connection (slow networks)
      // Note: bufferMaxEntries is deprecated in newer MongoDB drivers
      // bufferCommands: false, // Disable mongoose buffering - handled by mongoose config
    };

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
