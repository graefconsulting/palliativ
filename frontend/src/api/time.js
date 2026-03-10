import api from './axios';

export const timeApi = {
    getTrackings: async (month, year, userId) => {
        const params = { month, year };
        if (userId) params.userId = userId;
        const response = await api.get('/time', { params });
        return response.data;
    },

    getSummary: async (month, year, userId) => {
        const response = await api.get('/time/summary', { params: { month, year, userId } });
        return response.data;
    },

    createTracking: async (data) => {
        const response = await api.post('/time', data);
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await api.put(`/time/${id}/status`, { status });
        return response.data;
    },

    deleteTracking: async (id) => {
        const response = await api.delete(`/time/${id}`);
        return response.data;
    }
};
