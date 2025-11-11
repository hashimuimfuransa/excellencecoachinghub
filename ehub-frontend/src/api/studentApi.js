import axiosClient from './axiosClient';

export const studentApi = {
  getDashboardStats: () => axiosClient.get('/students/dashboard/stats'),
};