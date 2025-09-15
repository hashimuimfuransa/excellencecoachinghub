// Job application emails are now handled by backend SendGrid service
// This service is kept for backward compatibility

export interface JobApplicationEmailData {
  // Employer information
  employerEmail: string;
  
  // Job information
  jobTitle: string;
  company: string;
  location: string;
  
  // Candidate information
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateLocation?: string;
  candidateJobTitle?: string;
  candidateSkills?: string[];
  candidateSummary?: string;
  candidateExperience?: any[];
  candidateEducation?: any[];
  candidateResume?: string;
  candidateCvFile?: string;
  profileCompletion: number;
}

export const sendJobApplicationToEmployer = async (
  data: JobApplicationEmailData
): Promise<boolean> => {
  console.log('📧 Job application emails are now handled automatically by backend SendGrid service');
  console.log('📧 Confirmation emails sent automatically when applications are submitted');
  console.log('👤 Candidate:', data.candidateName);
  console.log('💼 Job:', data.jobTitle, 'at', data.company);
  
  // Job application emails are now sent automatically by the backend
  // when a job application is submitted through the API
  return true;
};

// Email validation helper
export const isValidEmployerEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Test function for job application emails
export const testJobApplicationEmail = async (testEmail: string): Promise<boolean> => {
  console.log('📧 Job application emails are tested automatically by backend SendGrid service');
  console.log('📧 Test email would be sent to:', testEmail);
  return true;
};

export default {
  sendJobApplicationToEmployer,
  isValidEmployerEmail,
  testJobApplicationEmail
};