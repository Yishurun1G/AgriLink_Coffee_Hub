// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import AuthToggle from '../components/auth/AuthToggle';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">AgriLink Coffee</h1>
          <p className="text-gray-600 mt-2">Farm to Consumer Traceability</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <AuthToggle isLogin={isLogin} setIsLogin={setIsLogin} />

          {isLogin ? <LoginForm /> : <RegisterForm />}
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          © 2026 AgriLink Coffee Hub
        </p>
      </div>
    </div>
  );
};

export default AuthPage;