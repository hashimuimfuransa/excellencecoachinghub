import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Create the model
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

export default geminiModel;