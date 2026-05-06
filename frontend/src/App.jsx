import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AuthPage from './pages/AuthPage';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import DealerDashboard from './pages/dealer/DealerDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';

// Chat
import ChatPage from './pages/chat/ChatPage';

// Tracking
import TrackingPage from './pages/customer/TrackingPage';
import DealerLocationSharer from './components/tracking/DealerLocationSharer';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow overflow-hidden flex flex-col">
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected — Dashboards */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dealer"
            element={
              <ProtectedRoute allowedRoles={['DEALER']}>
                <DealerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Chat */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'DEALER', 'ADMIN']}>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* Tracking — Customer */}
          <Route
            path="/tracking"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <TrackingPage />
              </ProtectedRoute>
            }
          />

          {/* Tracking — Dealer */}
          <Route
            path="/dealer/tracking"
            element={
              <ProtectedRoute allowedRoles={['DEALER']}>
                <DealerLocationSharer />
              </ProtectedRoute>
            }
          />

          {/* Redirect root by role */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function RoleBasedRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  const role = user.role?.toUpperCase();
  if (role === 'ADMIN')    return <Navigate to="/admin"    replace />;
  if (role === 'MANAGER')  return <Navigate to="/manager"  replace />;
  if (role === 'DEALER')   return <Navigate to="/dealer"   replace />;
  if (role === 'CUSTOMER') return <Navigate to="/customer" replace />;
  return <Navigate to="/auth" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;