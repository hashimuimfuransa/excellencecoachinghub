import axiosClient from './axiosClient';

export const chatApi = {
  getMessages: (roomId) => axiosClient.get(`/chat/${roomId}`),
  sendMessage: (messageData) => axiosClient.post('/chat/send', messageData),
  getRooms: () => axiosClient.get('/chat/rooms'),
};