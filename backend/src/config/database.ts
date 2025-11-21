import { connectDatabase, disconnectDatabase } from '../utils/database';

// Export with the names expected by the scripts
export const connectDB = connectDatabase;
export const disconnectDB = disconnectDatabase;