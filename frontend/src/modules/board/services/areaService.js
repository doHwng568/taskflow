import api from '../../../services/api'

const areaService = {
  // GET /workspaces/{workspaceId}/areas -> mảng area kèm cards
  async getByWorkspace(workspaceId) {
    const response = await api.get(`/workspaces/${workspaceId}/areas`)
    return response.data.data
  },
}

export default areaService