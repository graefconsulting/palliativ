import api from './axios';

export const shiftsApi = {
    getShifts: async (date, view = 'week', userId = null) => {
        const params = { date, view };
        if (userId) params.userId = userId;
        const response = await api.get('/shifts', { params });
        return response.data;
    },

    createShift: async (shiftData) => {
        const response = await api.post('/shifts', shiftData);
        return response.data;
    },

    updateShift: async (id, shiftData) => {
        const response = await api.put(`/shifts/${id}`, shiftData);
        return response.data;
    },

    deleteShift: async (id) => {
        const response = await api.delete(`/shifts/${id}`);
        return response.data;
    },

    getOnCallReport: async (month, year) => {
        const response = await api.get('/shifts/reports/oncall', { params: { month, year } });
        return response.data;
    },

    getIllnessReport: async (month, year) => {
        const response = await api.get('/shifts/reports/illness', { params: { month, year } });
        return response.data;
    }
};

export const shiftSettingsApi = {
    getSettings: async () => {
        const response = await api.get('/shift-settings');
        return response.data;
    },
    createSetting: async (data) => {
        const response = await api.post('/shift-settings', data);
        return response.data;
    },
    updateSetting: async (id, data) => {
        const response = await api.put(`/shift-settings/${id}`, data);
        return response.data;
    },
    deleteSetting: async (id) => {
        const response = await api.delete(`/shift-settings/${id}`);
        return response.data;
    }
};

export const holidaysApi = {
    getHolidays: async (year) => {
        const response = await api.get('/holidays', { params: { year } });
        return response.data;
    }
};
