// src/pages/AuthPage.jsx

import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import AuthToggle from '../components/auth/AuthToggle';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cover bg-center px-4 py-12"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1920&auto=format&fit=crop')",
      }}
    >
      {/* Dark cinematic overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Ambient background glow */}
      <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-green-900/20 blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold tracking-[3px] text-white drop-shadow-[0_8px_25px_rgba(0,0,0,0.9)]">
            AgriLink Coffee
          </h1>

          <p className="mt-4 text-sm tracking-[2px] text-gray-300">
            Farm to Consumer Traceability
          </p>
        </div>

        {/* Dramatic Auth Card */}
        <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#101010] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.95)]">

          {/* Large dramatic glow */}
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-green-500/10 blur-3xl"></div>

          {/* Bottom ambient shadow */}
          <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-black/80 blur-3xl"></div>

          {/* Soft inner light */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent"></div>

          {/* Glossy top border */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/15"></div>

          {/* Dark texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_45%)]"></div>

          <div className="relative z-10">

            {/* Toggle */}
            <AuthToggle
              isLogin={isLogin}
              setIsLogin={setIsLogin}
            />

            {/* Forms */}
            <div className="mt-6">
              {isLogin ? <LoginForm /> : <RegisterForm />}
            </div>

          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm tracking-wide text-gray-400">
          © 2026 AgriLink Coffee Hub
        </p>

      </div>
    </div>
  );
};

export default AuthPage;