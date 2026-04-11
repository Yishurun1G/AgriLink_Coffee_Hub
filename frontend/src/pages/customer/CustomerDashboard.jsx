import { Link } from 'react-router-dom';

const CustomerDashboard = () => {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Welcome to AgriLink!</h1>
                    <p className="text-gray-600 mt-1">
                        Trace your coffee's journey from the farm directly to your cup.
                    </p>
                </div>

                {/* Main Action: Search Bar */}
                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Trace a Batch</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Enter a unique Coffee Batch ID to verify its authenticity and view its supply chain history.
                    </p>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="e.g., BTCH-2026-X982"
                            className="flex-grow rounded-md border border-gray-300 px-4 py-2 
                            focus:border-green-500 focus:ring-green-500 text-sm"
                        />
                        <button className="bg-green-600 text-white px-6 py-2 rounded-md 
                        hover:bg-green-700 transition font-medium text-sm">
                            Trace Batch
                        </button>
                    </div>
                </div>

                {/* History Grid */}
                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Recent Searches</h3>
                    
                    {/* Placeholder table for searched history */}
                    <p className="text-sm text-gray-500 italic">
                        You haven't traced any batches yet. Enter a batch ID above to get started!
                    </p>
                </div>

            </div>
        </div>
    );
};

export default CustomerDashboard;