import axiosClient from './axiosClient';

export const parentApi = {
  getChildProgress: (childId) => axiosClient.get(`/parent/child/${childId}/progress`),
  getChildren: () => axiosClient.get('/parent/children'),
  sendMessageToTeacher: (messageData) => axiosClient.post('/parent/message-teacher', messageData),
};