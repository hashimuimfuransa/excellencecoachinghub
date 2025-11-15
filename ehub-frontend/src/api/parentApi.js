import axiosClient from './axiosClient';

export const parentApi = {
  getChildProgress: (childId) => axiosClient.get(`/parent/child/${childId}/progress`),
  getChildren: () => axiosClient.get('/parent/children'),
  sendMessageToTeacher: (messageData) => axiosClient.post('/parent/message-teacher', messageData),
  // Add a child to parent account
  addChild: (childName) => axiosClient.post('/parent/child', { childName }),
  // Homework functionality for parents to view their child's homework
  getChildHomework: (childId, level, language) => {
    let url = `/parent/child/${childId}/homework`;
    const params = new URLSearchParams();
    
    if (level) params.append('level', level);
    if (language) params.append('language', language);
    if (params.toString()) url += `?${params.toString()}`;
    
    return axiosClient.get(url);
  },
  getChildHomeworkById: (childId, homeworkId) => axiosClient.get(`/parent/child/${childId}/homework/${homeworkId}`),
  getChildHomeworkSubmissions: (childId, homeworkId) => axiosClient.get(`/parent/child/${childId}/homework/${homeworkId}/submissions`),
};