import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coffee, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Coffee,
      title: "Coffee Supply Management",
      description: "Track and manage coffee batches from farm to market with real-time inventory updates.",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: MessageSquare,
      title: "Dealer & Manager Communication",
      description: "Built-in messaging system for seamless communication between all stakeholders.",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Comprehensive reports on sales, inventory, dealer performance, and revenue trends.",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: Shield,
      title: "Secure Role-Based Access",
      description: "Protected platform with role-specific permissions for admins, managers, dealers, and customers.",
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Register",
      description: "Create your account as a dealer, manager, or customer in minutes."
    },
    {
      number: "02",
      title: "Connect",
      description: "Link with managers, dealers, and suppliers in the coffee supply chain."
    },
    {
      number: "03",
      title: "Manage Digitally",
      description: "Handle all coffee operations, orders, and communications in one platform."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=2061')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/60"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Connecting Coffee Farmers,<br />
            Dealers & Markets <span className="text-green-400">Digitally</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
            AgriLink CoffeeHub helps manage coffee trading, communication, reports, 
            and supply operations in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border-2 border-white/30 transition-all"
            >
              Login
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for Coffee Trading
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your coffee supply chain efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2"
                >
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-green-200"></div>
                )}
                
                <div className="relative z-10 mb-6">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl">
                    <span className="text-5xl font-bold text-white">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-lg">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Intuitive Dashboard Experience
            </h2>
            <p className="text-xl text-gray-600">
              Manage everything from one powerful interface
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-all">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <BarChart3 className="w-24 h-24 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Admin Dashboard</h3>
                <p className="text-gray-600">
                  Complete system oversight with analytics, user management, and reports
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-all">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <MessageSquare className="w-24 h-24 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chat System</h3>
                <p className="text-gray-600">
                  Real-time messaging between dealers, managers, and customers
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-all">
              <div className="h-48 bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <Coffee className="w-24 h-24 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Coffee Management</h3>
                <p className="text-gray-600">
                  Track batches, inventory, orders, and delivery in real-time
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-800">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Coffee Business?
          </h2>
          <p className="text-xl mb-8 text-green-100">
            Join hundreds of coffee dealers and managers already using AgriLink CoffeeHub
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-5 bg-white text-green-700 hover:bg-gray-100 font-bold rounded-lg text-xl transition-all transform hover:scale-105 shadow-xl inline-flex items-center gap-2"
          >
            Get Started Today
            <CheckCircle className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                <Coffee className="w-6 h-6 text-green-500" />
                AgriLink CoffeeHub
              </h3>
              <p className="text-gray-400">
                Connecting the coffee supply chain digitally
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">About</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-green-400 transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Team</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li><a href="mailto:info@agrilinkcoffeehub.com" className="hover:text-green-400 transition-colors">info@agrilinkcoffeehub.com</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-green-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} AgriLink CoffeeHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
