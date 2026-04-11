import { Link } from 'react-router-dom';

const DealerSidebar = () => {
    return (
        <div className="w-64 bg-white h-full min-h-[calc(100vh-4rem)] border-r border-gray-100 p-6 flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Dealer Hub</h3>
            <nav className="space-y-1 flex-grow">
                <Link to="/dealer" className="flex items-center px-4 py-2.5 text-sm font-medium 
                text-green-700 bg-green-50 rounded-md group">
                    <span>My Batches</span>
                </Link>
                <Link to="/dealer/add" className="flex items-center px-4 py-2.5 
                text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-gray-50 
                rounded-md transition group">
                    <span>Log New Batch</span>
                </Link>
            </nav>
        </div>
    );
};

export default DealerSidebar;