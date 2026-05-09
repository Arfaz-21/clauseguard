import api from './api';

export const agreementService = {
  uploadAgreement: async (tenantId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/agreements/upload/${tenantId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getAgreement: async (agreementId) => {
    const response = await api.get(`/agreements/${agreementId}`);
    return response.data;
  },
  getTenantAgreements: async (tenantId) => {
    const response = await api.get(`/agreements/tenant/${tenantId}`);
    return response.data;
  },
  reAudit: async (agreementId) => {
    const response = await api.post(`/agreements/${agreementId}/re-audit`);
    return response.data;
  }
};
