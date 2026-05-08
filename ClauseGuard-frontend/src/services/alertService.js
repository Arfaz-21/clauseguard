import api from './api';

export const alertService = {
  getUserAlerts: async (userId) => {
    const response = await api.get(`/alerts/user/${userId}`);
    return response.data;
  }
};
