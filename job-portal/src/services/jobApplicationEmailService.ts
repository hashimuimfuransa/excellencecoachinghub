import { sendJobApplicationEmail } from './emailjsService';

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
  try {
    console.log('🚀 Preparing to send job application email...');
    
    if (!data.employerEmail) {
      console.error('❌ Employer email is required');
      return false;
    }

    const candidateData = {
      name: data.candidateName,
      email: data.candidateEmail,
      phone: data.candidatePhone,
      location: data.candidateLocation,
      jobTitle: data.candidateJobTitle,
      skills: data.candidateSkills,
      summary: data.candidateSummary,
      experience: data.candidateExperience,
      education: data.candidateEducation,
      resume: data.candidateResume,
      cvFile: data.candidateCvFile,
      profileCompletion: data.profileCompletion
    };

    const jobData = {
      title: data.jobTitle,
      company: data.company,
      location: data.location
    };

    console.log('📧 Sending job application via EmailJS...');
    console.log('👤 Candidate:', candidateData.name);
    console.log('💼 Job:', jobData.title, 'at', jobData.company);
    console.log('📨 Employer Email:', data.employerEmail);

    const emailSent = await sendJobApplicationEmail(
      data.employerEmail,
      candidateData,
      jobData
    );

    if (emailSent) {
      console.log('✅ Job application email sent successfully!');
    } else {
      console.log('⚠️ Job application email failed to send, but application was still processed');
    }

    return emailSent;
  } catch (error) {
    console.error('❌ Error in sendJobApplicationToEmployer:', error);
    return false;
  }
};

// Email validation helper
export const isValidEmployerEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Test function for job application emails
export const testJobApplicationEmail = async (testEmail: string): Promise<boolean> => {
  const testData: JobApplicationEmailData = {
    employerEmail: testEmail,
    jobTitle: 'Senior Software Developer',
    company: 'Tech Solutions Ltd',
    location: 'Lagos, Nigeria',
    candidateName: 'John Doe',
    candidateEmail: 'john.doe@example.com',
    candidatePhone: '+234 123 456 7890',
    candidateLocation: 'Lagos, Nigeria',
    candidateJobTitle: 'Full Stack Developer',
    candidateSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript'],
    candidateSummary: 'Experienced full-stack developer with 5+ years in web development, specializing in React and Node.js applications.',
    candidateExperience: [
      {
        jobTitle: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'Lagos, Nigeria',
        startDate: '2020-01',
        endDate: '2023-12',
        description: 'Developed and maintained web applications using React and Node.js'
      }
    ],
    candidateEducation: [
      {
        degree: 'Bachelor of Science',
        major: 'Computer Science',
        institution: 'University of Lagos',
        startDate: '2015',
        endDate: '2019'
      }
    ],
    candidateResume: 'https://example-storage.com/files/john-doe-cv.pdf',
    candidateCvFile: 'https://example-storage.com/files/john-doe-resume.pdf',
    profileCompletion: 85
  };

  return await sendJobApplicationToEmployer(testData);
};

export default {
  sendJobApplicationToEmployer,
  isValidEmployerEmail,
  testJobApplicationEmail
};