import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAllReports,
    createReport,
    deleteReport,
    regenerateReport,
    getReportTypes,
    generateQuickReport
} from '../../api/reportsApi';

const ReportsPage = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [reportTypes, setReportTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQuickReportModal, setShowQuickReportModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [quickReportData, setQuickReportData] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        report_type: 'SALES',
        description: '',
        start_date: '',
        end_date: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchReports();
        fetchReportTypes();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await getAllReports();
            setReports(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReportTypes = async () => {
        try {
            const types = await getReportTypes();
            setReportTypes(types);
        } catch (err) {
            console.error('Failed to fetch report types:', err);
        }
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createReport(formData);
            setShowCreateModal(false);
            resetForm();
            fetchReports();
        } catch (err) {
            console.error('Create report error:', err);
            console.error('Error response:', err.response);
            const errorMsg = err.response?.data?.detail || 
                           err.response?.data?.error ||
                           (err.response?.data ? JSON.stringify(err.response.data) : null) ||
                           err.message || 
                           'Failed to create report';
            alert(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerateQuickReport = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = await generateQuickReport(
                formData.report_type,
                formData.start_date,
                formData.end_date
            );
            setQuickReportData(data);
        } catch (err) {
            console.error('Quick report error:', err);
            console.error('Error response:', err.response);
            const errorMsg = err.response?.data?.error || 
                           err.response?.data?.detail ||
                           (err.response?.data ? JSON.stringify(err.response.data) : null) ||
                           err.message || 
                           'Failed to generate report';
            alert(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!confirm('Are you sure you want to delete this report?')) return;
        try {
            await deleteReport(reportId);
            fetchReports();
        } catch (err) {
            alert('Failed to delete report');
        }
    };

    const handleRegenerateReport = async (reportId) => {
        try {
            await regenerateReport(reportId);
            fetchReports();
        } catch (err) {
            alert('Failed to regenerate report');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            report_type: 'SALES',
            description: '',
            start_date: '',
            end_date: '',
        });
        setQuickReportData(null);
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            GENERATING: 'bg-blue-100 text-blue-800',
            COMPLETED: 'bg-green-100 text-green-800',
            FAILED: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getReportIcon = (type) => {
        const icons = {
            SALES: '💰',
            INVENTORY: '📦',
            DEALER_PERFORMANCE: '🚚',
            CUSTOMER_ACTIVITY: '👥',
            ORDER_SUMMARY: '📋',
            BATCH_SUMMARY: '☕',
            REVENUE: '💵',
            DELIVERY_PERFORMANCE: '🚀',
        };
        return icons[type] || '📊';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
                        <p className="text-gray-600 mt-1">Generate and manage system reports</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowQuickReportModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
                        >
                            ⚡ Quick Report
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium"
                        >
                            + Create Report
                        </button>
                    </div>
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="text-center py-10">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl text-center text-gray-500">
                        No reports yet. Create your first report!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">{getReportIcon(report.report_type)}</span>
                                            <h3 className="text-lg font-bold text-gray-800">{report.title}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                                                {report.status_display}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{report.description || 'No description'}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>📅 {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>👤 {report.created_by_username}</span>
                                            <span>•</span>
                                            <span>🕒 {new Date(report.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {report.status === 'COMPLETED' && (
                                            <>
                                                <button
                                                    onClick={() => setSelectedReport(report)}
                                                    className="text-blue-600 hover:text-blue-900 px-3 py-1 text-sm font-medium"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleRegenerateReport(report.id)}
                                                    className="text-green-600 hover:text-green-900 px-3 py-1 text-sm font-medium"
                                                >
                                                    Regenerate
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDeleteReport(report.id)}
                                            className="text-red-600 hover:text-red-900 px-3 py-1 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Report Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Create New Report</h2>
                            <form onSubmit={handleCreateReport} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
                                    <select
                                        required
                                        value={formData.report_type}
                                        onChange={(e) => setFormData({...formData, report_type: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        {reportTypes.map((type) => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="3"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowCreateModal(false); resetForm(); }}
                                        className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                                    >
                                        {submitting ? 'Creating...' : 'Create Report'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Quick Report Modal */}
                {showQuickReportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4">Quick Report</h2>
                            
                            {!quickReportData ? (
                                <form onSubmit={handleGenerateQuickReport} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
                                        <select
                                            required
                                            value={formData.report_type}
                                            onChange={(e) => setFormData({...formData, report_type: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        >
                                            {reportTypes.map((type) => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => { setShowQuickReportModal(false); resetForm(); }}
                                            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                                        >
                                            {submitting ? 'Generating...' : 'Generate Report'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-blue-800">
                                            Report generated for {new Date(quickReportData.start_date).toLocaleDateString()} - {new Date(quickReportData.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <pre className="text-sm overflow-auto max-h-96">
                                            {JSON.stringify(quickReportData.data, null, 2)}
                                        </pre>
                                    </div>
                                    <button
                                        onClick={() => { setShowQuickReportModal(false); resetForm(); }}
                                        className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* View Report Modal */}
                {selectedReport && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4">{selectedReport.title}</h2>
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <pre className="text-sm overflow-auto max-h-96">
                                    {JSON.stringify(selectedReport.data, null, 2)}
                                </pre>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
