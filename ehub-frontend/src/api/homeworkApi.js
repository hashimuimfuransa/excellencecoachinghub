import axiosClient from './axiosClient';

export const homeworkApi = {
  // Homework management
  getHomework: (courseId, level, language) => {
    let url = '/homework-new';
    const params = new URLSearchParams();
    
    // Only add course ID if provided
    if (courseId) {
      url += `/course/${courseId}`;
    } else {
      // Use the default endpoint that gets all homework (no course required)
      url += '';
    }
    
    if (level) params.append('level', level);
    if (language) params.append('language', language);
    if (params.toString()) url += `?${params.toString()}`;
    return axiosClient.get(url);
  },
  createHomework: (homeworkData) => axiosClient.post('/homework-new', homeworkData),
  updateHomework: (id, homeworkData) => axiosClient.put(`/homework-new/${id}`, homeworkData),
  getHomeworkById: (id) => axiosClient.get(`/homework-new/${id}`),
  deleteHomework: (id) => axiosClient.delete(`/homework-new/${id}`),
  
  // Homework submission and grading
  submitHomework: (homeworkId, submissionData) => axiosClient.post(`/homework-new/${homeworkId}/submit`, submissionData),
  getStudentSubmission: (homeworkId) => axiosClient.get(`/homework-new/${homeworkId}/submission`),
  getHomeworkSubmissions: (homeworkId) => axiosClient.get(`/homework-new/${homeworkId}/submissions`),
  gradeHomeworkSubmission: (submissionId, gradeData) => axiosClient.put(`/homework-new/submissions/${submissionId}/grade`, gradeData),
  
  // Homework help system
  getHomeworkHelp: () => axiosClient.get('/homework/help'),
  getHomeworkHelpById: (id) => axiosClient.get(`/homework/help/${id}`),
  uploadHomeworkHelp: (data) => axiosClient.post('/homework/help/upload', data), // Changed to send JSON data
  downloadHomeworkHelp: (fileUrl) => axiosClient.get(fileUrl, { responseType: 'blob' }),
  
  // Interactive homework
  getInteractiveHomework: (id) => axiosClient.get(`/homework/interactive/${id}`),
  submitInteractiveHomework: (id, answers) => axiosClient.post(`/homework/interactive/${id}/submit`, { answers }),
  
  // Student-created homework
  getStudentHomework: () => axiosClient.get('/homework/student'),
  
  // Teacher stats and students
  getTeacherStats: () => axiosClient.get('/teacher/stats'),
  getStudents: () => axiosClient.get('/teacher/students'),
  
  // Leaderboard
  getLeaderboard: () => axiosClient.get('/leaderboard'),
};