import axiosClient from './axiosClient';

export const homeworkApi = {
  // Homework management
  getHomework: () => axiosClient.get('/homework'),
  createHomework: (homeworkData) => axiosClient.post('/homework/create', homeworkData),
  updateHomework: (id, homeworkData) => axiosClient.put(`/homework/${id}`, homeworkData),
  deleteHomework: (id) => axiosClient.delete(`/homework/${id}`),
  
  // Homework submission and grading
  submitHomework: (homeworkId, submissionData) => axiosClient.post(`/homework/${homeworkId}/submit`, submissionData),
  // Use the correct endpoint for getting all submissions for a teacher
  getSubmissions: () => axiosClient.get('/assignments/teacher/submissions'),
  getSubmissionById: (submissionId) => axiosClient.get(`/homework/submissions/${submissionId}`),
  reviewSubmission: (submissionId, feedbackData) => axiosClient.put(`/homework/submissions/${submissionId}/review`, feedbackData),
  gradeSubmission: (submissionId, gradeData) => axiosClient.put(`/homework/submissions/${submissionId}/grade`, gradeData),
  
  // Homework help system
  getHomeworkHelp: () => axiosClient.get('/homework/help'),
  getHomeworkHelpById: (id) => axiosClient.get(`/homework/help/${id}`),
  uploadHomeworkHelp: (formData) => axiosClient.post('/homework/help/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
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