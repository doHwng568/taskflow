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

  // PATCH /areas/{areaId} -> area sau khi đổi tên
  async rename(areaId, name) {
    const response = await api.patch(`/areas/${areaId}`, { name })
    return response.data.data
  },

  // DELETE /areas/{areaId} -> 204, xóa area cùng toàn bộ thẻ trong area
  async remove(areaId) {
    await api.delete(`/areas/${areaId}`)
  },
}

export default areaService