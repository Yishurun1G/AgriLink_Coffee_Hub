import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="relative mt-auto overflow-hidden border-t border-white/5 bg-[#0d0d0d]">

            {/* Ambient Glow */}
            <div className="absolute top-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl"></div>

            {/* Top glossy line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/10"></div>

            {/* Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_45%)]"></div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">

                    {/* Copyright */}
                    <div>
                        <p className="text-center text-sm tracking-wide text-gray-400 md:text-left">
                            &copy; {new Date().getFullYear()} AgriLink Coffee Hub.
                            <span className="block text-gray-500 md:inline md:ml-2">
                                Secure Traceability for the Coffee Supply Chain.
                            </span>
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-6 text-sm font-medium">

                        <Link
                            to="/"
                            className="text-gray-400 transition duration-300 hover:text-green-400"
                        >
                            Home
                        </Link>

                        <Link
                            to="/about"
                            className="text-gray-400 transition duration-300 hover:text-green-400"
                        >
                            About
                        </Link>

                        <Link
                            to="/privacy"
                            className="text-gray-400 transition duration-300 hover:text-green-400"
                        >
                            Privacy Policy
                        </Link>

                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;