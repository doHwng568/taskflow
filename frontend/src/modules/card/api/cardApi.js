import api from '../../../services/api';

const cardApi = {
  getCardsByAreaApi(areaId) {
    return api.get(`/cards/area/${areaId}`);
  },

  getCardByIdApi(cardId) {
    return api.get(`/cards/${cardId}`);
  },

  createCardApi(data) {
    return api.post('/cards', data);
  },

  updateCardApi(cardId, data) {
    return api.put(`/cards/${cardId}`, data);
  },

  moveCardApi(cardId, data) {
    return api.put(`/cards/${cardId}/move`, data);
  },

  deleteCardApi(cardId) {
    return api.delete(`/cards/${cardId}`);
  },
};

export default cardApi;
