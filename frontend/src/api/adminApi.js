// frontend/src/api/adminApi.js
import axios from './axios';

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Stats
// ═══════════════════════════════════════════════════════════════════════════

export const getAdminStats = async () => {
    const response = await axios.get('/users/admin/stats/');
    return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// User Management
// ═══════════════════════════════════════════════════════════════════════════

export const getAllUsers = async (params = {}) => {
    const response = await axios.get('/users/admin/users/', { params });
    return response.data;
};

export const getUserById = async (userId) => {
    const response = await axios.get(`/users/admin/users/${userId}/`);
    return response.data;
};

export const createUser = async (userData) => {
    const response = await axios.post('/users/admin/users/', userData);
    return response.data;
};

export const updateUser = async (userId, userData) => {
    const response = await axios.patch(`/users/admin/users/${userId}/`, userData);
    return response.data;
};

export const deleteUser = async (userId) => {
    const response = await axios.delete(`/users/admin/users/${userId}/`);
    return response.data;
};

export const toggleUserActive = async (userId) => {
    const response = await axios.post(`/users/admin/users/${userId}/toggle_active/`);
    return response.data;
};

export const resetUserPassword = async (userId, newPassword) => {
    const response = await axios.post(`/users/admin/users/${userId}/reset_password/`, {
        new_password: newPassword
    });
    return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// Activity Logs
// ═══════════════════════════════════════════════════════════════════════════

export const getActivityLogs = async () => {
    const response = await axios.get('/users/admin/activity-logs/');
    return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// Reports & Analytics
// ═══════════════════════════════════════════════════════════════════════════

export const getAdminReports = async () => {
    const response = await axios.get('/users/admin/reports/');
    return response.data;
};
