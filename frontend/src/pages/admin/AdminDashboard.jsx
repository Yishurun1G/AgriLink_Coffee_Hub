import AdminSidebar from '../../components/dashboard/AdminSidebar';

const AdminDashboard = () => {
    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-grow p-8 bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage users, review system activity, and pull platform-wide analytics.</p>
                
                {/* Future KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 font-medium">Total Users</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">--</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;