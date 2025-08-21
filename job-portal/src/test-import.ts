// Test file to check if AIInterview can be imported
import { AIInterview, InterviewType, ApiResponse } from './types';

console.log('Import test successful');

// Test if the types are available
const testInterview: AIInterview = {} as AIInterview;
const testType: InterviewType = InterviewType.GENERAL;
const testResponse: ApiResponse<string> = {} as ApiResponse<string>;

export { testInterview, testType, testResponse };