const AuthToggle = ({ isLogin, setIsLogin }) => {
    return (
        <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
                {isLogin ? "New to AgriLink?" : "Already have an account?"}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="ml-2 font-medium text-green-600 hover:text-green-500 
                    focus:outline-none focus:underline transition ease-in-out duration-150"
                >
                    {isLogin ? "Create an account" : "Sign in instead"}
                </button>
            </p>
        </div>
    );
};

export default AuthToggle;