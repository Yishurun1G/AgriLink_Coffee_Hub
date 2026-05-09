import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
    const location = useLocation();
    
    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') return true;
        if (path !== '/admin' && location.pathname.startsWith(path)) return true;
        return false;
    };
    
    const linkClass = (path) => {
        return isActive(path)
            ? "flex items-center px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 rounded-md"
            : "flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-md transition";
    };

    return (
        <div className="w-64 bg-white h-full min-h-[calc(100vh-4rem)] border-r border-gray-100 p-6 flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">System Admin</h3>
            <nav className="space-y-1 flex-grow">
                <Link to="/admin" className={linkClass('/admin')}>
                    <span className="mr-3">📊</span>
                    <span>Dashboard Home</span>
                </Link>
                
                <Link to="/admin/users" className={linkClass('/admin/users')}>
                    <span className="mr-3">👥</span>
                    <span>Manage Users</span>
                </Link>
                
                <Link to="/admin/batches" className={linkClass('/admin/batches')}>
                    <span className="mr-3">☕</span>
                    <span>Coffee Batches</span>
                </Link>
                
                <Link to="/admin/orders" className={linkClass('/admin/orders')}>
                    <span className="mr-3">📦</span>
                    <span>Orders</span>
                </Link>
                
                <Link to="/admin/reports" className={linkClass('/admin/reports')}>
                    <span className="mr-3">📈</span>
                    <span>Reports & Analytics</span>
                </Link>
                
                <Link to="/admin/activity" className={linkClass('/admin/activity')}>
                    <span className="mr-3">📋</span>
                    <span>Activity Logs</span>
                </Link>
                
                <Link to="/chat" className={linkClass('/chat')}>
                    <span className="mr-3">💬</span>
                    <span>Communication</span>
                </Link>
            </nav>
        </div>
    );
};

export default AdminSidebar;
