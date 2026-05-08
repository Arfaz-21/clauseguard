import api from './api';

export const userService = {
  createUser: async (userData) => {
    const response = await api.post('/users/', userData);
    return response.data;
  },
  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
  googleLogin: async (googleData) => {
    const response = await api.post('/users/google-login', googleData);
    return response.data;
  }
};
