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

            const errorMsg =
                err.response?.data?.detail ||
                err.response?.data?.error ||
                (err.response?.data
                    ? JSON.stringify(err.response.data)
                    : null) ||
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

            const errorMsg =
                err.response?.data?.error ||
                err.response?.data?.detail ||
                (err.response?.data
                    ? JSON.stringify(err.response.data)
                    : null) ||
                err.message ||
                'Failed to generate report';

            alert(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!confirm('Are you sure you want to delete this report?'))
            return;

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
            PENDING:
                'bg-yellow-900/40 text-yellow-300 border border-yellow-700',
            GENERATING:
                'bg-blue-900/40 text-blue-300 border border-blue-700',
            COMPLETED:
                'bg-green-900/40 text-green-300 border border-green-700',
            FAILED:
                'bg-red-900/40 text-red-300 border border-red-700',
        };

        return (
            colors[status] ||
            'bg-gray-800 text-gray-300 border border-gray-700'
        );
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
        <div className="min-h-screen bg-gradient-to-br from-[#1b1713] via-[#241d17] to-[#1f2b22] py-8 text-[#f5efe6] relative overflow-hidden">

            {/* Background image overlay */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(2px)',
                }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Header */}
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                            ☕ Reports Dashboard
                        </h1>

                        <p className="text-[#cdbba9] mt-2">
                            Generate and manage system reports
                        </p>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => setShowQuickReportModal(true)}
                            className="bg-[#355c3a] hover:bg-[#406d46] text-white px-6 py-3 rounded-2xl font-medium shadow-2xl transition-all duration-300"
                        >
                            ⚡ Quick Report
                        </button>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#6F4E37] hover:bg-[#7d5a42] text-white px-6 py-3 rounded-2xl font-medium shadow-2xl transition-all duration-300"
                        >
                            + Create Report
                        </button>
                    </div>
                </div>

                {/* Reports List */}
                {loading ? (
                    <div className="text-center py-20 text-[#d7c7b6] text-lg">
                        Loading reports...
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-[#2a231d]/90 border border-[#5d4a3a] p-12 rounded-3xl text-center text-[#d6c7b5] shadow-2xl backdrop-blur-md">
                        No reports yet. Create your first report!
                    </div>
                ) : (
                    <div className="space-y-5">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                className="relative overflow-hidden rounded-3xl border border-[#5a4d42] bg-[#2b241e]/90 backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.45)] p-6 transition-all duration-300 hover:scale-[1.01]"
                                style={{
                                    backgroundImage: `
                                        linear-gradient(rgba(24,20,16,0.88), rgba(24,20,16,0.92)),
                                        url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop')
                                    `,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            >
                                <div className="flex items-start justify-between gap-4 flex-wrap">

                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                                            <span className="text-3xl">
                                                {getReportIcon(
                                                    report.report_type
                                                )}
                                            </span>

                                            <h3 className="text-xl font-bold text-white">
                                                {report.title}
                                            </h3>

                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md ${getStatusColor(
                                                    report.status
                                                )}`}
                                            >
                                                {report.status_display}
                                            </span>
                                        </div>

                                        <p className="text-sm text-[#d9cfc4] mb-4">
                                            {report.description ||
                                                'No description'}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#c4b29f]">
                                            <span>
                                                📅{' '}
                                                {new Date(
                                                    report.start_date
                                                ).toLocaleDateString()}{' '}
                                                -{' '}
                                                {new Date(
                                                    report.end_date
                                                ).toLocaleDateString()}
                                            </span>

                                            <span>•</span>

                                            <span>
                                                👤{' '}
                                                {report.created_by_username}
                                            </span>

                                            <span>•</span>

                                            <span>
                                                🕒{' '}
                                                {new Date(
                                                    report.created_at
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-wrap">
                                        {report.status === 'COMPLETED' && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        setSelectedReport(
                                                            report
                                                        )
                                                    }
                                                    className="bg-[#355c3a] hover:bg-[#406d46] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-300"
                                                >
                                                    View
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleRegenerateReport(
                                                            report.id
                                                        )
                                                    }
                                                    className="bg-[#6F4E37] hover:bg-[#7d5a42] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-300"
                                                >
                                                    Regenerate
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() =>
                                                handleDeleteReport(report.id)
                                            }
                                            className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-300"
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
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-start justify-center z-50 p-4 pt-28 overflow-y-auto">
    <div
        className="bg-[#2a231d]/95 border border-[#5c4939] rounded-3xl p-6 w-full max-w-md my-10 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl text-[#f4eee6]"
        style={{
            backgroundImage: `
                linear-gradient(rgba(32,26,20,0.92), rgba(32,26,20,0.95)),
                url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            scrollbarWidth: 'thin',
            scrollbarColor: '#6F4E37 #241d17',
        }}
    >
                            <h2 className="text-2xl font-bold mb-5">
                                ☕ Create New Report
                            </h2>

                            <form
                                onSubmit={handleCreateReport}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-[#d7c6b3] mb-1">
                                        Title *
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                title: e.target.value,
                                            })
                                        }
                                        className="w-full bg-[#201914]/80 border border-[#5b4738] text-[#f5ede4] rounded-2xl px-4 py-3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#d7c6b3] mb-1">
                                        Report Type *
                                    </label>

                                    <select
                                        required
                                        value={formData.report_type}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                report_type: e.target.value,
                                            })
                                        }
                                        className="w-full bg-[#201914]/80 border border-[#5b4738] text-[#f5ede4] rounded-2xl px-4 py-3"
                                    >
                                        {reportTypes.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#d7c6b3] mb-1">
                                        Description
                                    </label>

                                    <textarea
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        rows="3"
                                        className="w-full bg-[#201914]/80 border border-[#5b4738] text-[#f5ede4] rounded-2xl px-4 py-3"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="date"
                                        required
                                        value={formData.start_date}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                start_date: e.target.value,
                                            })
                                        }
                                        className="w-full bg-[#201914]/80 border border-[#5b4738] text-[#f5ede4] rounded-2xl px-4 py-3"
                                    />

                                    <input
                                        type="date"
                                        required
                                        value={formData.end_date}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                end_date: e.target.value,
                                            })
                                        }
                                        className="w-full bg-[#201914]/80 border border-[#5b4738] text-[#f5ede4] rounded-2xl px-4 py-3"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 border border-[#5c4939] text-[#d7c6b3] px-4 py-3 rounded-2xl hover:bg-white/5 transition-all duration-300"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-[#6F4E37] hover:bg-[#7d5a42] text-white px-4 py-3 rounded-2xl shadow-xl transition-all duration-300"
                                    >
                                        {submitting
                                            ? 'Creating...'
                                            : 'Create Report'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Quick Report Modal */}
                {showQuickReportModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div
                            className="bg-[#2a231d]/95 border border-[#5c4939] rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl text-[#f4eee6]"
                            style={{
                                backgroundImage: `
                                    linear-gradient(rgba(32,26,20,0.92), rgba(32,26,20,0.95)),
                                    url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop')
                                `,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <h2 className="text-3xl font-bold mb-5">
                                ⚡ Quick Report
                            </h2>

                            {!quickReportData ? (
                                <form
                                    onSubmit={handleGenerateQuickReport}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-[#d7c6b3] mb-1">
                                            Report Type *
                                        </label>

                                        <select
                                            required
                                            value={formData.report_type}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    report_type:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full bg-[#201914]/80 border border-[#5b4738] text-[#f5ede4] rounded-2xl px-4 py-3"
                                        >
                                            {reportTypes.map((type) => (
                                                <option
                                                    key={type.value}
                                                    value={type.value}
                                                >
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="date"
                                            required
                                            value={formData.start_date}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    start_date:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full bg-[#201914]/80 border border-[#5b4738] text-[#f5ede4] rounded-2xl px-4 py-3"
                                        />

                                        <input
                                            type="date"
                                            required
                                            value={formData.end_date}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    end_date:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full bg-[#201914]/80 border border-[#5b4738] text-[#f5ede4] rounded-2xl px-4 py-3"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowQuickReportModal(
                                                    false
                                                );

                                                resetForm();
                                            }}
                                            className="flex-1 border border-[#5c4939] text-[#d7c6b3] px-4 py-3 rounded-2xl hover:bg-white/5 transition-all duration-300"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 bg-[#355c3a] hover:bg-[#406d46] text-white px-4 py-3 rounded-2xl shadow-xl transition-all duration-300"
                                        >
                                            {submitting
                                                ? 'Generating...'
                                                : 'Generate Report'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div className="bg-[#355c3a]/30 border border-[#355c3a] rounded-2xl p-4 mb-4">
                                        <p className="text-sm text-[#d8f1db]">
                                            Report generated for{' '}
                                            {new Date(
                                                quickReportData.start_date
                                            ).toLocaleDateString()}
                                            {' - '}
                                            {new Date(
                                                quickReportData.end_date
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="bg-black/30 rounded-2xl p-4 mb-4 border border-[#5b4738]">
                                        <pre className="text-sm overflow-auto max-h-96 text-[#f5ede4]">
                                            {JSON.stringify(
                                                quickReportData.data,
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setShowQuickReportModal(false);

                                            resetForm();
                                        }}
                                        className="w-full bg-[#6F4E37] hover:bg-[#7d5a42] text-white px-4 py-3 rounded-2xl transition-all duration-300"
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
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div
                            className="bg-[#2a231d]/95 border border-[#5c4939] rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl text-[#f4eee6]"
                            style={{
                                backgroundImage: `
                                    linear-gradient(rgba(32,26,20,0.92), rgba(32,26,20,0.95)),
                                    url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop')
                                `,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <h2 className="text-3xl font-bold mb-5">
                                ☕ {selectedReport.title}
                            </h2>

                            <div className="bg-black/30 rounded-2xl p-4 mb-4 border border-[#5b4738]">
                                <pre className="text-sm overflow-auto max-h-96 text-[#f5ede4]">
                                    {JSON.stringify(
                                        selectedReport.data,
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>

                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-full bg-[#6F4E37] hover:bg-[#7d5a42] text-white px-4 py-3 rounded-2xl transition-all duration-300"
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