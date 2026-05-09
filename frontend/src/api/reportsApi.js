// frontend/src/api/reportsApi.js
import axios from './axios';

// ═══════════════════════════════════════════════════════════════════════════
// Reports Management
// ═══════════════════════════════════════════════════════════════════════════

export const getAllReports = async (params = {}) => {
    const response = await axios.get('/reports/list/', { params });
    return response.data;
};

export const getReportById = async (reportId) => {
    const response = await axios.get(`/reports/list/${reportId}/`);
    return response.data;
};

export const createReport = async (reportData) => {
    const response = await axios.post('/reports/list/', reportData);
    return response.data;
};

export const deleteReport = async (reportId) => {
    const response = await axios.delete(`/reports/list/${reportId}/`);
    return response.data;
};

export const regenerateReport = async (reportId) => {
    const response = await axios.post(`/reports/list/${reportId}/regenerate/`);
    return response.data;
};

export const getReportTypes = async () => {
    const response = await axios.get('/reports/types/');
    return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// Quick Reports (Real-time, not saved)
// ═══════════════════════════════════════════════════════════════════════════

export const generateQuickReport = async (reportType, startDate, endDate) => {
    const response = await axios.post('/reports/quick/', {
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
    });
    return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════
// Report Schedules
// ═══════════════════════════════════════════════════════════════════════════

export const getAllSchedules = async () => {
    const response = await axios.get('/reports/schedules/');
    return response.data;
};

export const createSchedule = async (scheduleData) => {
    const response = await axios.post('/reports/schedules/', scheduleData);
    return response.data;
};

export const updateSchedule = async (scheduleId, scheduleData) => {
    const response = await axios.put(`/reports/schedules/${scheduleId}/`, scheduleData);
    return response.data;
};

export const deleteSchedule = async (scheduleId) => {
    const response = await axios.delete(`/reports/schedules/${scheduleId}/`);
    return response.data;
};

export const toggleScheduleActive = async (scheduleId) => {
    const response = await axios.post(`/reports/schedules/${scheduleId}/toggle_active/`);
    return response.data;
};
