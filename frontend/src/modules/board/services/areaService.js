import api from '../../../services/api'

const areaService = {
  // GET /workspaces/{workspaceId}/areas -> mảng area kèm cards
  async getByWorkspace(workspaceId) {
    const response = await api.get(`/workspaces/${workspaceId}/areas`)
    return response.data.data
  },

  // POST /workspaces/{workspaceId}/areas -> area vừa tạo
  async create(workspaceId, name) {
    const response = await api.post(`/workspaces/${workspaceId}/areas`, { name })
    return response.data.data
  },
}

export default areaService