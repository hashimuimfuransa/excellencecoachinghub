import axiosClient from './axiosClient';

export const homeworkApi = {
  getHomework: () => axiosClient.get('/homework'),
  submitHomework: (homeworkData) => axiosClient.post('/homework/submit', homeworkData),
  getSubmissions: () => axiosClient.get('/homework/submissions'),
  reviewSubmission: (submissionId, feedback) => axiosClient.put(`/homework/feedback/${submissionId}`, { feedback }),
  createHomework: (homeworkData) => axiosClient.post('/homework/create', homeworkData),
  uploadHomeworkHelp: (formData) => axiosClient.post('/homework/help/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getHomeworkHelp: () => axiosClient.get('/homework/help'),
  addComment: (helpId, comment) => axiosClient.post(`/homework/help/${helpId}/comments`, { comment }),
};