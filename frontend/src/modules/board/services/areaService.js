import api from '../../../services/api'

const areaService = {
  // GET /workspaces/{workspaceId}/areas -> mảng area kèm cards
  async getByWorkspace(workspaceId) {
    const response = await api.get(`/workspaces/${workspaceId}/areas`)
    return response.data.data
  },

  // GET /workspaces/{workspaceId}/areas/archived -> các area đã lưu trữ
  async getArchived(workspaceId) {
    const response = await api.get(`/workspaces/${workspaceId}/areas/archived`)
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

  // PATCH /areas/{areaId}/archive -> area đã lưu trữ
  async archive(areaId) {
    const response = await api.patch(`/areas/${areaId}/archive`)
    return response.data.data
  },

  // PATCH /areas/{areaId}/restore -> area đã khôi phục (kèm cards)
  async restore(areaId) {
    const response = await api.patch(`/areas/${areaId}/restore`)
    return response.data.data
  },

  // PATCH /areas/{areaId}/color, color = '#RRGGBB' hoặc null để bỏ màu
  async changeColor(areaId, color) {
    const response = await api.patch(`/areas/${areaId}/color`, { color })
    return response.data.data
  },

  // PATCH /areas/{areaId}/position
  // previousAreaId / nextAreaId: area đứng ngay trước / sau vị trí mới (null nếu ở đầu / cuối)
  async move(areaId, previousAreaId, nextAreaId) {
    const response = await api.patch(`/areas/${areaId}/position`, {
      previousAreaId,
      nextAreaId,
    })
    return response.data.data
  },

  // PATCH /areas/{areaId}/pin, pinned = true ghim lên đầu board, false bỏ ghim
  async pin(areaId, pinned) {
    const response = await api.patch(`/areas/${areaId}/pin`, { pinned })
    return response.data.data
  },

  // POST /areas/{areaId}/copy -> bản sao (kèm thẻ) nằm ngay sau area gốc
  async copy(areaId, name) {
    const body = name ? { name } : {}
    const response = await api.post(`/areas/${areaId}/copy`, body)
    return response.data.data
  },

  // PATCH /areas/{areaId}/workspace -> chuyển area (kèm thẻ) sang workspace khác
  async moveToWorkspace(areaId, targetWorkspaceId) {
    const response = await api.patch(`/areas/${areaId}/workspace`, { targetWorkspaceId })
    return response.data.data
  },
}

export default areaService