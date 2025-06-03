import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Establishes connection to MongoDB using Mongoose
 * @throws {Error} When MONGODB_URI is missing or connection fails
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI);
    console.info(`📦 Mongoose version: ${mongoose.version}`);
    console.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
