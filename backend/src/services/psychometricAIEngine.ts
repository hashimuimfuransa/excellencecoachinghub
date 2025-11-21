// API Key Configuration for the psychometric AI engine
export interface PsychometricAPIKeyConfig {
  key: string;
  name: string;
  dailyLimit: number;
  used: number;
  lastReset: string;
  status: 'active' | 'quota_exceeded' | 'failed' | 'blocked';
  lastError?: string;
}