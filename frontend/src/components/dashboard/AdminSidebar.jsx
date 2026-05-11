import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Coffee,
    Package,
    BarChart3,
    Clock,
    MessageSquare,
    Leaf,
} from 'lucide-react';

const AdminSidebar = () => {
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') return true;
        if (path !== '/admin' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const linkClass = (path) => {
        return isActive(path)
            ? 'group flex items-center gap-4 px-5 py-4 text-sm font-semibold bg-gradient-to-r from-[#2F241C]/95 to-[#1D1712]/95 text-[#B7E4C7] border-l-4 border-[#5FA36A] rounded-2xl shadow-lg backdrop-blur-md'
            : 'group flex items-center gap-4 px-5 py-4 text-sm font-medium text-[#CBB8A5] hover:text-white hover:bg-[#241B15]/80 rounded-2xl transition-all duration-300';
    };

    return (
        <div
            className="w-72 min-h-screen relative overflow-hidden border-r border-[#3E2E25]/60 shadow-[0_0_50px_rgba(0,0,0,0.6)]"
            style={{
                backgroundImage: `
                    linear-gradient(rgba(15,12,10,0.93), rgba(15,12,10,0.95)),
                    url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1400&auto=format&fit=crop')
                `,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Soft Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1E140F]/60 via-[#120D0A]/70 to-[#0F0B08]/95 backdrop-blur-[2px]" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-[#3B2C22]/70 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-[#4E7A57] to-[#2F5233] p-3 rounded-2xl shadow-xl border border-[#7FA887]/30">
                            <Coffee className="w-7 h-7 text-white" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                AgriLink
                            </h1>

                            <div className="flex items-center gap-2 mt-1">
                                <Leaf className="w-3.5 h-3.5 text-[#7DBA89]" />

                                <p className="text-xs text-[#B7A48C] tracking-wide">
                                    CoffeeHub • Admin Panel
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 p-5 overflow-y-auto">
                    <div className="mb-5 px-5">
                        <h3 className="text-xs font-bold text-[#8B735F] uppercase tracking-[0.25em]">
                            Main Menu
                        </h3>
                    </div>

                    <nav className="space-y-2">
                        <Link to="/admin" className={linkClass('/admin')}>
                            <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Dashboard Home</span>
                        </Link>

                        <Link
                            to="/admin/users"
                            className={linkClass('/admin/users')}
                        >
                            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Manage Users</span>
                        </Link>

                        <Link
                            to="/admin/batches"
                            className={linkClass('/admin/batches')}
                        >
                            <Coffee className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Coffee Batches</span>
                        </Link>

                        <Link
                            to="/admin/orders"
                            className={linkClass('/admin/orders')}
                        >
                            <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Orders</span>
                        </Link>

                        <Link
                            to="/admin/reports"
                            className={linkClass('/admin/reports')}
                        >
                            <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Reports & Analytics</span>
                        </Link>

                        <Link
                            to="/admin/activity"
                            className={linkClass('/admin/activity')}
                        >
                            <Clock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Activity Logs</span>
                        </Link>

                        <Link to="/chat" className={linkClass('/chat')}>
                            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>Communication</span>
                        </Link>
                    </nav>
                </div>

                {/* Bottom Card */}
                <div className="px-5 pb-5">
                    <div
                        className="rounded-3xl overflow-hidden border border-[#4B392D]/60 shadow-2xl"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(20,15,12,0.75), rgba(20,15,12,0.9)),
                                url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop')
                            `,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <div className="p-5 backdrop-blur-sm">
                            <p className="text-sm font-semibold text-white mb-2">
                                Coffee Farm Insights
                            </p>

                            <p className="text-xs leading-relaxed text-[#D7C3AE]">
                                Monitor farmers, coffee batches, dealers, orders,
                                and communication activities across the AgriLink
                                ecosystem.
                            </p>

                            <button className="mt-4 w-full bg-gradient-to-r from-[#4D7A57] to-[#355C3E] hover:from-[#5B8D66] hover:to-[#3F6949] text-white py-3 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-lg">
                                System Active
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5">
                    <div className="border-t border-[#3A2B22]/60 pt-4 text-center">
                        <p className="text-xs text-[#8D7766] tracking-wide">
                            © {new Date().getFullYear()} AgriLink CoffeeHub
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSidebar;