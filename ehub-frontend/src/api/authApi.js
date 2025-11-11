import axiosClient from './axiosClient';

export const authApi = {
  register: (userData) => axiosClient.post('/auth/register', userData),
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  googleLogin: (googleToken) => axiosClient.post('/auth/google', { credential: googleToken }),
  getCurrentUser: () => axiosClient.get('/auth/me'),
  updateProfile: (userData) => axiosClient.post('/auth/update-profile', userData),
};