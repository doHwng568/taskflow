import api from '../../../services/api';

const cardApi = {
  // Area (Cột / Danh sách) APIs
  getAreasApi(workspaceId) {
    return api.get('/api/areas', {
      params: workspaceId ? { workspaceId } : undefined,
    });
  },

  createAreaApi(data) {
    return api.post('/api/areas', data);
  },

  updateAreaApi(areaId, data) {
    return api.put(`/api/areas/${areaId}`, data);
  },

  deleteAreaApi(areaId) {
    return api.delete(`/api/areas/${areaId}`);
  },

  // Card (Thẻ công việc) APIs
  getCardsByAreaApi(areaId) {
    return api.get(`/api/cards/area/${areaId}`);
  },

  getCardByIdApi(cardId) {
    return api.get(`/api/cards/${cardId}`);
  },

  createCardApi(data) {
    return api.post('/api/cards', data);
  },

  updateCardApi(cardId, data) {
    return api.put(`/api/cards/${cardId}`, data);
  },

  moveCardApi(cardId, data) {
    return api.put(`/api/cards/${cardId}/move`, data);
  },

  getCardMovementsApi(cardId) {
    return api.get(`/api/cards/${cardId}/movements`);
  },

  deleteCardApi(cardId) {
    return api.delete(`/api/cards/${cardId}`);
  },
};

export default cardApi;
