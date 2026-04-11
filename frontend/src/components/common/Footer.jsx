import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 mt-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between">
                    
                    {/* Brand & Copyright */}
                    <div className="flex justify-center md:order-2 space-x-6 text-sm text-gray-500">
                        <Link to="/" className="hover:text-green-600 transition">Home</Link>
                        <Link to="/about" className="hover:text-green-600 transition">About</Link>
                        <Link to="/privacy" className="hover:text-green-600 transition">Privacy Policy</Link>
                    </div>
                    
                    {/* Quick Navigation */}
                    <div className="mt-8 md:mt-0 md:order-1">
                        <p className="text-center text-sm text-gray-400">
                            &copy; {new Date().getFullYear()} AgriLink Coffee Hub. Secure Traceability for the Coffee Supply Chain.
                        </p>
                    </div>

                </div>
            </div>
        </footer>
    );
};

export default Footer;