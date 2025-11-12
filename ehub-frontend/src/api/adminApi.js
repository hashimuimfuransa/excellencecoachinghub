import axiosClient from './axiosClient';

export const adminApi = {
  // Dashboard stats
  getStats: () => axiosClient.get('/admin/stats'),
  getRecentActivity: () => axiosClient.get('/admin/activity'),
  
  // User management
  getUsers: () => axiosClient.get('/admin/users'),
  getUserById: (userId) => axiosClient.get(`/admin/users/${userId}`),
  createUser: (userData) => axiosClient.post('/admin/users', userData),
  updateUser: (userId, userData) => axiosClient.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => axiosClient.delete(`/admin/users/${userId}`),
  
  // Content management
  getVideos: () => axiosClient.get('/admin/videos'),
  uploadVideo: (formData) => axiosClient.post('/admin/videos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  deleteVideo: (videoId) => axiosClient.delete(`/admin/videos/${videoId}`),
  
  // Homework management
  getHomework: () => axiosClient.get('/admin/homework'),
  createHomework: (homeworkData) => axiosClient.post('/admin/homework', homeworkData),
  updateHomework: (homeworkId, homeworkData) => axiosClient.put(`/admin/homework/${homeworkId}`, homeworkData),
  deleteHomework: (homeworkId) => axiosClient.delete(`/admin/homework/${homeworkId}`),
  
  // Reports
  getUsageReport: (startDate, endDate) => axiosClient.get(`/admin/reports/usage?start=${startDate}&end=${endDate}`),
  getPerformanceReport: () => axiosClient.get('/admin/reports/performance'),
};