import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Coffee,
  MessageSquare,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle,
  Users,
  Globe,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";

import { motion } from "framer-motion";

/* IMPORT CHATBOT */
import ChatBot from "../components/chatbot/ChatBot.jsx"; // adjust path if needed

const LandingPage = () => {
  const navigate = useNavigate();

  const [mobileMenu, setMobileMenu] = React.useState(false);

  const features = [
    {
      icon: Coffee,
      title: "Coffee Supply Management",
      description:
        "Track coffee batches, inventory, logistics, and deliveries from farms to markets.",
    },
    {
      icon: MessageSquare,
      title: "Real-Time Communication",
      description:
        "Instant messaging between managers, dealers, admins, and customers.",
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description:
        "Powerful analytics and reporting tools for better decision making.",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description:
        "Enterprise-level security with role-based access and authentication.",
    },
  ];

  const stats = [
    {
      icon: Users,
      value: "10K+",
      label: "Platform Users",
    },
    {
      icon: Coffee,
      value: "500+",
      label: "Coffee Dealers",
    },
    {
      icon: Globe,
      value: "20+",
      label: "Connected Regions",
    },
    {
      icon: TrendingUp,
      value: "98%",
      label: "Operational Efficiency",
    },
  ];

  return (
    <div className="bg-[#1B120D] text-white overflow-hidden relative">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-[#1B120D]/80 border-b border-[#3E2723]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-xl shadow-lg shadow-green-900/40">
              <Coffee className="w-6 h-6 text-white" />
            </div>

            <h1 className="text-2xl font-extrabold tracking-wide">
              AgriLink CoffeeHub
            </h1>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-10 text-gray-300 font-medium">
            <a href="#features" className="hover:text-green-400 transition">
              Features
            </a>

            <a href="#stats" className="hover:text-green-400 transition">
              Statistics
            </a>

            <a href="#dashboard" className="hover:text-green-400 transition">
              Dashboard
            </a>

            <a href="#contact" className="hover:text-green-400 transition">
              Contact
            </a>
          </div>

          {/* BUTTONS */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 rounded-xl border border-[#5D4037] hover:bg-[#3E2723] transition"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/register")}
              className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition shadow-lg shadow-green-900/40"
            >
              Get Started
            </button>
          </div>

          {/* MOBILE */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden"
          >
            {mobileMenu ? <X size={30} /> : <Menu size={30} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenu && (
          <div className="md:hidden bg-[#1B120D] border-t border-[#3E2723]">
            <div className="flex flex-col gap-6 px-6 py-6">
              <a href="#features">Features</a>
              <a href="#stats">Statistics</a>
              <a href="#dashboard">Dashboard</a>
              <a href="#contact">Contact</a>

              <button
                onClick={() => navigate("/login")}
                className="py-3 border border-[#5D4037] rounded-xl"
              >
                Login
              </button>

              <button
                onClick={() => navigate("/register")}
                className="py-3 bg-green-600 rounded-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* BACKGROUND IMAGE */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?q=80&w=2070')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B120D]/95 via-[#1B120D]/80 to-[#1B120D]/90"></div>
        </div>

        {/* BLUR EFFECTS */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-600/20 rounded-full blur-3xl"></div>

        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#6F4E37]/40 rounded-full blur-3xl"></div>

        {/* CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 70 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center max-w-6xl px-6"
        >
          <div className="inline-flex items-center gap-3 bg-[#3E2723]/70 backdrop-blur-md border border-[#6F4E37] px-10 py-3 rounded-full mb-8 shadow-2xl">
            <Coffee className="text-green-400" />
            <span className="text-green-200">
              Smart Coffee Supply Chain Platform
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-8">
            Connecting Coffee
            <span className="text-green-400">
              {" "}
              Farmers, Dealers & Markets{" "}
            </span>
            Digitally
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto mb-10">
            AgriLink CoffeeHub transforms coffee supply operations with
            intelligent management, analytics, communication, and reporting
            tools built for modern coffee businesses.
          </p>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="group px-8 py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-2xl shadow-green-900/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 rounded-2xl border border-[#6F4E37] bg-[#3E2723]/60 backdrop-blur-md hover:bg-[#4E342E] transition-all text-lg font-bold"
            >
              Explore Platform
            </button>
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <section
        id="stats"
        className="relative z-20 py-10 -mt-20 max-w-7xl mx-auto px-6 transition-all"
      >
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <motion.div
                whileHover={{ y: -10 }}
                key={index}
                className="bg-[#2A1B16] border border-[#4E342E] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:shadow-green-900/30 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-green-600/20 flex items-center justify-center mb-6">
                  <Icon className="w-8 h-8 text-green-400" />
                </div>

                <h2 className="text-4xl font-extrabold mb-2">
                  {stat.value}
                </h2>

                <p className="text-gray-400">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          {/* HEADER */}
          <div className="text-center mb-20">
            <h2 className="text-5xl font-extrabold mb-5">
              Powerful Features
            </h2>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Everything you need to modernize and manage your coffee business
              digitally.
            </p>
          </div>

          {/* FEATURE CARDS */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  whileHover={{ y: -10 }}
                  key={index}
                  className="group bg-[#2A1B16] border border-[#4E342E] rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] hover:border-green-700 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-green-600/20 flex items-center justify-center mb-6 group-hover:bg-green-600 transition">
                    <Icon className="w-8 h-8 text-green-400 group-hover:text-white transition" />
                  </div>

                  <h3 className="text-2xl font-bold mb-4">
                    {feature.title}
                  </h3>

                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section
        id="dashboard"
        className="py-32 bg-gradient-to-br from-[#241510] to-[#1B120D]"
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* HEADER */}
          <div className="text-center mb-20">
            <h2 className="text-5xl font-extrabold mb-5">
              Smart Dashboard Experience
            </h2>

            <p className="text-xl text-gray-400">
              Powerful tools for admins, managers, and dealers.
            </p>
          </div>

          {/* DASHBOARD CARDS */}
          <div className="grid md:grid-cols-3 gap-10">
            {/* ADMIN */}
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-[#2A1B16] rounded-3xl overflow-hidden border border-[#4E342E] shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            >
              <div className="h-56 bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
                <BarChart3 className="w-28 h-28 text-white" />
              </div>

              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4">
                  Admin Dashboard
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  Manage users, reports, analytics, system operations, and
                  monitor business activities.
                </p>
              </div>
            </motion.div>

            {/* CHAT */}
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-[#2A1B16] rounded-3xl overflow-hidden border border-[#4E342E] shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            >
              <div className="h-56 bg-gradient-to-br from-[#6F4E37] to-[#4E342E] flex items-center justify-center">
                <MessageSquare className="w-28 h-28 text-white" />
              </div>

              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4">
                  Communication System
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  Real-time messaging and collaboration between all coffee
                  supply chain stakeholders.
                </p>
              </div>
            </motion.div>

            {/* COFFEE */}
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-[#2A1B16] rounded-3xl overflow-hidden border border-[#4E342E] shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            >
              <div className="h-56 bg-gradient-to-br from-green-600 to-[#3E2723] flex items-center justify-center">
                <Coffee className="w-28 h-28 text-white" />
              </div>

              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4">
                  Coffee Management
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  Manage inventory, coffee batches, logistics, orders, and
                  supplier operations efficiently.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 overflow-hidden">
        {/* BG */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-800 via-[#3E2723] to-[#1B120D]"></div>

        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"></div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#6F4E37]/30 rounded-full blur-3xl"></div>

        {/* CONTENT */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-8">
            Ready to Transform Your Coffee Business?
          </h2>

          <p className="text-xl text-gray-300 leading-relaxed mb-10">
            Join coffee dealers, suppliers, and managers already modernizing
            their operations with AgriLink CoffeeHub.
          </p>

          <button
            onClick={() => navigate("/register")}
            className="group px-10 py-5 rounded-2xl bg-white text-[#1B120D] font-bold text-xl hover:scale-105 transition-all shadow-2xl inline-flex items-center gap-3"
          >
            Get Started Today

            <CheckCircle className="group-hover:rotate-12 transition" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        id="contact"
        className="bg-[#120C09] border-t border-[#3E2723] py-20"
      >
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-14">
          {/* BRAND */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-green-600 p-2 rounded-xl">
                <Coffee className="text-white" />
              </div>

              <h2 className="text-2xl font-bold">
                AgriLink CoffeeHub
              </h2>
            </div>

            <p className="text-gray-400 leading-relaxed">
              A modern coffee supply chain platform connecting coffee farms,
              dealers, managers, and markets digitally.
            </p>
          </div>

          {/* LINKS */}
          <div>
            <h3 className="text-xl font-bold mb-6">Platform</h3>

            <ul className="space-y-4 text-gray-400">
              <li className="hover:text-green-400 transition cursor-pointer">
                Dashboard
              </li>

              <li className="hover:text-green-400 transition cursor-pointer">
                Reports
              </li>

              <li className="hover:text-green-400 transition cursor-pointer">
                Communication
              </li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h3 className="text-xl font-bold mb-6">Company</h3>

            <ul className="space-y-4 text-gray-400">
              <li className="hover:text-green-400 transition cursor-pointer">
                About
              </li>

              <li className="hover:text-green-400 transition cursor-pointer">
                Careers
              </li>

              <li className="hover:text-green-400 transition cursor-pointer">
                Contact
              </li>
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h3 className="text-xl font-bold mb-6">Support</h3>

            <ul className="space-y-4 text-gray-400">
              <li className="hover:text-green-400 transition cursor-pointer">
                Help Center
              </li>

              <li className="hover:text-green-400 transition cursor-pointer">
                Privacy Policy
              </li>

              <li className="hover:text-green-400 transition cursor-pointer">
                Terms & Conditions
              </li>
            </ul>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-[#3E2723] mt-16 pt-8 text-center text-gray-500">
          © {new Date().getFullYear()} AgriLink CoffeeHub. All rights reserved.
        </div>
      </footer>

      {/* CHATBOT */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <ChatBot />
      </div>
    </div>
  );
};

export default LandingPage;