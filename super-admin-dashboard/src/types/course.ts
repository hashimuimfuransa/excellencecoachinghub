import type { User } from './user';

export interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration?: number;
  instructor?: User;
  createdAt: string;
  updatedAt: string;
}