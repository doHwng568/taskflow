import api from "../../../services/api";

const workspaceService = {
    async getAll() {
        const response = await api.get("/api/workspaces");
        return response.data.data;
    },

    async getById(id) {
        const response = await api.get(`/api/workspaces/${id}`);
        return response.data.data;
    },

    async create(data) {
        const response = await api.post("/api/workspaces", data);
        return response.data.data;
    },

    async update(id, data) {
        const response = await api.put(`/api/workspaces/${id}`, data);
        return response.data.data;
    },

    async delete(id) {
        const response = await api.delete(`/api/workspaces/${id}`);
        return response.data.data;
    },

    async getMembers(id) {
        const response = await api.get(`/api/workspaces/${id}/members`);
        return response.data.data;
    },

    async addMember(id, email) {
        const response = await api.post(
            `/api/workspaces/${id}/members`,
            { email }
        );
        return response.data.data;
    },

    async removeMember(id, userId) {
        const response = await api.delete(
            `/api/workspaces/${id}/members/${userId}`
        );
        return response.data.data;
    },
};

export default workspaceService;