
import api from "../../../services/api";

const workspaceService = {
    // Lấy danh sách Workspace
    async getAll() {
        const response = await api.get("/api/workspaces");
        return response.data.data;
    },

    // Lấy chi tiết Workspace
    async getById(id) {
        const response = await api.get(`/api/workspaces/${id}`);
        return response.data.data;
    },

    // Tạo Workspace
    async create(data) {
        const response = await api.post("/api/workspaces", data);
        return response.data.data;
    },

    // Cập nhật Workspace
    async update(id, data) {
        const response = await api.put(
            `/api/workspaces/${id}`,
            data
        );

        return response.data.data;
    },

    // Xóa Workspace
    async delete(id) {
        const response = await api.delete(
            `/api/workspaces/${id}`
        );

        return response.data.data;
    },

    // Lấy danh sách thành viên
    async getMembers(id) {
        const response = await api.get(
            `/api/workspaces/${id}/members`
        );

        return response.data.data;
    },

    // Thêm thành viên
    async addMember(id, data) {
        const response = await api.post(
            `/api/workspaces/${id}/members`,
            data
        );

        return response.data.data;
    },

    // Cập nhật role thành viên
    async updateMemberRole(id, userId, role) {
        const response = await api.put(
            `/api/workspaces/${id}/members/${userId}/role`,
            { role }
        );

        return response.data.data;
    },

    // Xóa thành viên
    async removeMember(id, userId) {
        const response = await api.delete(
            `/api/workspaces/${id}/members/${userId}`
        );

        return response.data.data;
    },

    // Chuyển quyền OWNER
    async transferOwnership(id, newOwnerId) {
        const response = await api.post(
            `/api/workspaces/${id}/transfer-ownership`,
            { newOwnerId }
        );

        return response.data.data;
    },
};

export default workspaceService;
