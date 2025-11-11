import axiosClient from './axiosClient';

export const videoApi = {
  getVideos: () => axiosClient.get('/videos'),
  uploadVideo: (videoData) => axiosClient.post('/video/upload', videoData),
  markAsWatched: (videoId) => axiosClient.put(`/videos/${videoId}/watched`),
};