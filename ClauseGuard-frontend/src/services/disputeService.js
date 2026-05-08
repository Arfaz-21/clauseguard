import api from './api';

export const disputeService = {
  createDispute: async (disputeData) => {
    const response = await api.post('/disputes/', disputeData);
    return response.data;
  },
  getDispute: async (disputeId) => {
    const response = await api.get(`/disputes/${disputeId}`);
    return response.data;
  }
};
