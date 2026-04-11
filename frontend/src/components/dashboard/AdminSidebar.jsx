import { Link } from 'react-router-dom';

const AdminSidebar = () => {
    return (
        <div className="w-64 bg-white h-full min-h-[calc(100vh-4rem)] border-r border-gray-100 p-6 flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">System Admin</h3>
            <nav className="space-y-1 flex-grow">
                <Link to="/admin" className="flex items-center px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 rounded-md group">
                    <span>Dashboard Home</span>
                </Link>
                <Link to="/admin/users" className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-md transition group">
                    <span>Manage Users</span>
                </Link>
                <Link to="/admin/logs" className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-md transition group">
                    <span>System Logs</span>
                </Link>
            </nav>
        </div>
    );
};

export default AdminSidebar;