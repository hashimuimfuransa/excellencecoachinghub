// Test file to isolate the AIInterview export issue

export enum InterviewType {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  CASE_STUDY = 'case_study',
  GENERAL = 'general'
}

export interface AIInterview {
  _id: string;
  type: InterviewType;
  overallScore: number;
  feedback: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}