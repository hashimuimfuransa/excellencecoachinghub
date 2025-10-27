import type { User } from './user';

export const enum PsychometricTestType {
  PERSONALITY = 'personality',
  COGNITIVE = 'cognitive',
  APTITUDE = 'aptitude',
  SKILLS = 'skills',
  BEHAVIORAL = 'behavioral'
}

export interface PsychometricQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'scenario';
  options?: string[];
  correctAnswer?: string;
  traits?: string[];
  weight: number;
  scaleRange?: { min: number; max: number };
}

export interface PsychometricTest {
  _id: string;
  title: string;
  description: string;
  type: PsychometricTestType;
  questions: PsychometricQuestion[];
  timeLimit: number;
  industry?: string;
  jobRole?: string;
  isActive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}