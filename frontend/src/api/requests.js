import api from './axios';

export const vacationApi = {
    getRequests: async () => {
        const response = await api.get('/requests/vacation');
        return response.data;
    },

    createRequest: async (data) => {
        const response = await api.post('/requests/vacation', data);
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await api.put(`/requests/vacation/${id}/status`, { status });
        return response.data;
    },

    deleteRequest: async (id) => {
        const response = await api.delete(`/requests/vacation/${id}`);
        return response.data;
    }
};

export const availabilityApi = {
    getRequests: async (date, view, userId) => {
        const params = { date, view };
        if (userId) params.userId = userId;
        const response = await api.get('/requests/availability', { params });
        return response.data;
    },

    createRequest: async (data) => {
        const response = await api.post('/requests/availability', data);
        return response.data;
    },

    deleteRequest: async (id) => {
        const response = await api.delete(`/requests/availability/${id}`);
        return response.data;
    }
};
