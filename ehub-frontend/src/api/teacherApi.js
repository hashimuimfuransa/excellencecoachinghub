import axiosClient from './axiosClient';

export const teacherApi = {
  // Teacher stats and students
  getStats: () => axiosClient.get('/settings/teacher/stats'),
  getStudents: () => axiosClient.get('/settings/teacher/students'),
  getSubmissions: () => axiosClient.get('/teacher/submissions'),
  
  // Teacher courses
  getCourses: () => axiosClient.get('/settings/teacher/courses'),
  
  // Teacher homework
  getHomework: () => axiosClient.get('/homework-new'),
  createHomework: (homeworkData) => axiosClient.post('/homework-new', homeworkData),
  updateHomework: (homeworkId, homeworkData) => axiosClient.put(`/homework-new/${homeworkId}`, homeworkData),
  deleteHomework: (homeworkId) => axiosClient.delete(`/homework-new/${homeworkId}`),
};